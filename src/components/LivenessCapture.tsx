"use client";

/**
 * Active-liveness selfie capture.
 *
 * The screen becomes a controlled light source: we flash a colour sequence
 * that the SERVER chose seconds ago, and measure how the face reflects each
 * one. A printed photo reflects nothing (it is matte and already coloured); a
 * face on a phone screen emits its own light and barely responds; a recorded
 * video cannot possibly react to a sequence that did not exist when it was
 * filmed. We also ask for two head turns, which gives a human reviewer three
 * angles of the same person.
 *
 * Deliberate limits, so nobody mistakes this for more than it is:
 *  - the measurements happen in the browser, so someone who rewrites our JS
 *    can forge them. The captured frames are stored precisely so a person can
 *    check the automated verdict.
 *  - a deepfake fed through a virtual camera driver looks like a normal camera
 *    to getUserMedia. We block the obvious virtual devices by name; anything
 *    more needs a vendor SDK.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { compressDocument } from "@/lib/images/compress";

export type LivenessLabels = {
  title: string;
  intro: string;
  start: string;
  holdStill: string;
  lookCenter: string;
  lookLeft: string;
  lookRight: string;
  analysing: string;
  passed: string;
  failedTitle: string;
  retry: string;
  denied: string;
  unsupported: string;
  virtualCam: string;
  reasons: Record<string, string>;
};

type Challenge = { id: string; colors: string[]; poses: string[] };

const FLASH: Record<string, string> = {
  R: "#ff2d2d",
  G: "#2dff6a",
  B: "#2d6aff",
  W: "#ffffff",
};

/**
 * Classify the CHANGE a flash produced on the face.
 *
 * Takes deltas from the neutral baseline, not absolute colour: skin tone and
 * ambient light vary far too much between people to threshold directly.
 *
 * "N" (no response) is a separate verdict on purpose. If we folded it into
 * "W", a matte print — which reflects almost nothing — would score a free
 * match on every white flash. N never matches anything, which is the point.
 */
export function classifyResponse(dr: number, dg: number, db: number): string {
  const mag = Math.max(Math.abs(dr), Math.abs(dg), Math.abs(db));
  if (mag < 6) return "N"; // surface did not react to the light at all
  const max = Math.max(dr, dg, db);
  const min = Math.min(dr, dg, db);
  if (max <= 0) return "N"; // got darker everywhere: not a reflection
  // All channels lifted together, none dominating → the white flash.
  if (max - min < max * 0.35 && dr > 0 && dg > 0 && db > 0) return "W";
  if (max === dr) return "R";
  if (max === dg) return "G";
  return "B";
}

export function LivenessCapture({
  t,
  userId,
  onDone,
}: {
  t: LivenessLabels;
  userId: string;
  /** Called once the check has run; passed=false still lets the user retry.
   *  frontFile is the centred frame, kept in memory so the caller can derive
   *  a face descriptor from it without re-downloading anything. */
  onDone: (result: { passed: boolean; framePaths: string[]; frontFile?: File }) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [phase, setPhase] = useState<"idle" | "run" | "work" | "done">("idle");
  const [flash, setFlash] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ passed: boolean; reason: string } | null>(null);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
  }, []);
  useEffect(() => () => stop(), [stop]);

  /** Average colour of the centre of the frame, where the face sits. */
  function sampleFace(video: HTMLVideoElement, c: HTMLCanvasElement) {
    const w = 120, h = 120;
    c.width = w; c.height = h;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    const vw = video.videoWidth || 640, vh = video.videoHeight || 480;
    const side = Math.min(vw, vh) * 0.5;
    ctx.drawImage(video, (vw - side) / 2, (vh - side) / 2, side, side, 0, 0, w, h);
    const d = ctx.getImageData(0, 0, w, h).data;
    let r = 0, g = 0, b = 0;
    for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; }
    const n = d.length / 4;
    return { r: r / n, g: g / n, b: b / n, pixels: d };
  }

  function frameDiff(a: Uint8ClampedArray, b: Uint8ClampedArray) {
    let sum = 0;
    for (let i = 0; i < a.length; i += 16) sum += Math.abs(a[i] - b[i]);
    return sum / (a.length / 16) / 255; // 0..1
  }

  async function shoot(video: HTMLVideoElement): Promise<File> {
    const c = document.createElement("canvas");
    c.width = video.videoWidth || 1280;
    c.height = video.videoHeight || 720;
    c.getContext("2d")!.drawImage(video, 0, 0, c.width, c.height);
    const blob = await new Promise<Blob | null>((res) =>
      c.toBlob(res, "image/jpeg", 0.9)
    );
    return compressDocument(
      new File([blob!], `live-${Date.now()}.jpg`, { type: "image/jpeg" })
    );
  }

  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

  async function run() {
    setError("");
    setResult(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setError(t.unsupported);
      return;
    }

    const supabase = createClient();
    let challenge: Challenge;
    try {
      const { data, error: e } = await supabase.rpc("issue_liveness_challenge");
      if (e || !data?.[0]) throw e ?? new Error("no challenge");
      challenge = data[0] as Challenge;
    } catch {
      setError(t.unsupported);
      return;
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "user" }, width: { ideal: 1280 } },
        audio: false,
      });
    } catch {
      setError(t.denied);
      return;
    }

    // Cheapest possible injection check: virtual cameras announce themselves.
    try {
      const label = stream.getVideoTracks()[0]?.label?.toLowerCase() ?? "";
      if (/obs|manycam|virtual|snap camera|droidcam|epoccam|xsplit/.test(label)) {
        stream.getTracks().forEach((tr) => tr.stop());
        setError(t.virtualCam);
        return;
      }
    } catch { /* label unavailable — continue */ }

    streamRef.current = stream;
    setPhase("run");
    const video = videoRef.current!;
    video.srcObject = stream;
    await video.play().catch(() => {});
    await wait(700); // let auto-exposure settle, else the first flash misreads

    const scratch = document.createElement("canvas");
    const observed: string[] = [];

    // --- colour sequence -----------------------------------------------
    setPrompt(t.holdStill);
    const base = sampleFace(video, scratch);
    for (const colour of challenge.colors) {
      setFlash(FLASH[colour] ?? "#ffffff");
      await wait(420); // long enough for the camera to expose for the new light
      const s = sampleFace(video, scratch);
      if (s && base) {
        observed.push(classifyResponse(s.r - base.r, s.g - base.g, s.b - base.b));
      } else {
        observed.push("N");
      }
    }
    setFlash(null);
    await wait(250);

    // --- poses + frame capture ------------------------------------------
    const frames: File[] = [];
    let motion = 0;
    let previous: Uint8ClampedArray | null = null;
    for (const pose of challenge.poses) {
      setPrompt(
        pose === "left" ? t.lookLeft : pose === "right" ? t.lookRight : t.lookCenter
      );
      await wait(1400);
      const s = sampleFace(video, scratch);
      if (s && previous) motion = Math.max(motion, frameDiff(previous, s.pixels));
      previous = s?.pixels ?? null;
      frames.push(await shoot(video));
    }

    setPhase("work");
    setPrompt(t.analysing);
    stop();

    // --- upload + server verdict ----------------------------------------
    try {
      const paths: string[] = [];
      for (let i = 0; i < frames.length; i++) {
        const path = `${userId}/liveness-${Date.now()}-${i}.jpg`;
        const { error: upErr } = await supabase.storage
          .from("customer-docs")
          .upload(path, frames[i], { contentType: "image/jpeg" });
        if (upErr) throw upErr;
        paths.push(path);
      }

      const { data, error: vErr } = await supabase.rpc("verify_liveness", {
        p_challenge: challenge.id,
        p_observed: observed,
        p_motion: Number(motion.toFixed(3)),
        p_frames: paths,
      });
      if (vErr) throw vErr;

      const row = data?.[0] as { passed: boolean; score: number; reason: string };
      setResult({ passed: row.passed, reason: row.reason });
      setPhase("done");
      onDone({ passed: row.passed, framePaths: paths, frontFile: frames[0] });
    } catch {
      setError(t.unsupported);
      setPhase("idle");
    }
  }

  if (phase === "idle" || phase === "done") {
    return (
      <div className="rounded-2xl border border-ink/15 p-5">
        <p className="font-bold text-ink">{t.title}</p>
        <p className="mt-1 text-sm text-ink/65">{t.intro}</p>

        {result && (
          <p
            className={`mt-3 rounded-lg px-3 py-2 text-sm ${
              result.passed
                ? "bg-green-50 dark:bg-green-500/15 text-green-800 dark:text-green-300"
                : "bg-red-50 dark:bg-red-500/15 text-red-700 dark:text-red-300"
            }`}
          >
            {result.passed
              ? t.passed
              : `${t.failedTitle} ${t.reasons[result.reason] ?? result.reason}`}
          </p>
        )}
        {error && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/15 dark:text-red-300">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={run}
          className="mt-4 w-full rounded-xl bg-accent-500 py-3 font-semibold text-white transition hover:bg-accent-400"
        >
          {result ? t.retry : t.start}
        </button>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center transition-colors duration-150"
      style={{ background: flash ?? "#000" }}
    >
      <video
        ref={videoRef}
        playsInline
        muted
        className="h-[62vh] w-auto max-w-[92vw] scale-x-[-1] rounded-3xl object-cover"
      />
      <p
        className="mt-6 px-6 text-center text-lg font-semibold"
        style={{ color: flash ? "#00000099" : "#fff" }}
      >
        {prompt}
      </p>
    </div>
  );
}
