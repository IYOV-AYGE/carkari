/**
 * Face matching for the counter check.
 *
 * The host photographs the customer; CarKari compares that photo against the
 * selfie verified at signup and returns ONLY a verdict. The agency never sees
 * the stored face — that is the whole point of doing it server-side.
 *
 * Provider interface first, AWS Rekognition behind it. Swapping to another
 * engine (or Stripe Identity) means writing one function, not touching the
 * handover flow.
 *
 * Configure with AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY and optionally
 * AWS_REGION (default eu-west-1, close to Morocco). With no keys set,
 * `compareFaces` reports "unavailable" and the flow degrades to the host
 * confirming the physical ID — it never blocks a legitimate pickup.
 *
 * No SDK on purpose: signing SigV4 by hand is ~40 lines and avoids a large
 * dependency (npm install is also currently broken in our build sandbox).
 */

import { createHash, createHmac } from "crypto";

export type MatchStatus = "match" | "no_match" | "unavailable" | "error";
export type MatchResult = { status: MatchStatus; score: number | null; detail?: string };

/** Similarity below this is treated as a different person. */
export const MATCH_THRESHOLD = 90;

const sha256 = (d: Buffer | string) => createHash("sha256").update(d).digest("hex");
const hmac = (k: Buffer | string, d: string) => createHmac("sha256", k).update(d).digest();

function signingKey(secret: string, date: string, region: string, service: string) {
  return hmac(hmac(hmac(hmac("AWS4" + secret, date), region), service), "aws4_request");
}

export function isConfigured(): boolean {
  return Boolean(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
}

/**
 * Compare two JPEG images. `source` is the freshly taken photo, `target` the
 * selfie on file. Returns a similarity 0..100.
 */
export async function compareFaces(
  source: Buffer,
  target: Buffer
): Promise<MatchResult> {
  const key = process.env.AWS_ACCESS_KEY_ID;
  const secret = process.env.AWS_SECRET_ACCESS_KEY;
  const region = process.env.AWS_REGION ?? "eu-west-1";
  if (!key || !secret) return { status: "unavailable", score: null };

  const service = "rekognition";
  const host = `${service}.${region}.amazonaws.com`;
  const body = JSON.stringify({
    SourceImage: { Bytes: source.toString("base64") },
    TargetImage: { Bytes: target.toString("base64") },
    SimilarityThreshold: 1, // ask for the number; WE decide the cut-off
    QualityFilter: "AUTO",
  });

  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const date = amzDate.slice(0, 8);
  const target_ = "RekognitionService.CompareFaces";

  const canonicalHeaders =
    `content-type:application/x-amz-json-1.1\n` +
    `host:${host}\n` +
    `x-amz-date:${amzDate}\n` +
    `x-amz-target:${target_}\n`;
  const signedHeaders = "content-type;host;x-amz-date;x-amz-target";
  const canonicalRequest = [
    "POST", "/", "", canonicalHeaders, signedHeaders, sha256(body),
  ].join("\n");

  const scope = `${date}/${region}/${service}/aws4_request`;
  const toSign = [
    "AWS4-HMAC-SHA256", amzDate, scope, sha256(canonicalRequest),
  ].join("\n");
  const signature = createHmac("sha256", signingKey(secret, date, region, service))
    .update(toSign)
    .digest("hex");

  try {
    const res = await fetch(`https://${host}/`, {
      method: "POST",
      headers: {
        "content-type": "application/x-amz-json-1.1",
        "x-amz-date": amzDate,
        "x-amz-target": target_,
        authorization:
          `AWS4-HMAC-SHA256 Credential=${key}/${scope}, ` +
          `SignedHeaders=${signedHeaders}, Signature=${signature}`,
      },
      body,
      // The customer is standing at the counter; do not hang the queue.
      signal: AbortSignal.timeout(12_000),
    });

    const json = (await res.json()) as {
      FaceMatches?: { Similarity: number }[];
      UnmatchedFaces?: unknown[];
      Message?: string;
      __type?: string;
    };

    if (!res.ok) {
      // A photo with no detectable face is a real answer, not a failure.
      if (json.__type?.includes("InvalidParameter")) {
        return { status: "no_match", score: null, detail: "no face detected" };
      }
      return { status: "error", score: null, detail: json.Message ?? json.__type };
    }

    const best = json.FaceMatches?.[0]?.Similarity ?? 0;
    return {
      status: best >= MATCH_THRESHOLD ? "match" : "no_match",
      score: Math.round(best * 10) / 10,
    };
  } catch (e) {
    return { status: "error", score: null, detail: (e as Error).message };
  }
}
