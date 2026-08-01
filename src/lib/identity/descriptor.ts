"use client";

/**
 * Face descriptors, computed in the browser.
 *
 * A descriptor is 128 floats summarising the geometry of a face. Two photos of
 * the same person land close together; different people land far apart. We
 * compute one from the customer's liveness selfie at verification, and one
 * from the counter photo at pickup, and compare the distance.
 *
 * Nothing is uploaded to do this and no third party is involved — the model
 * runs on the device. The agency receives the stored descriptor (numbers), so
 * the customer's actual photograph never leaves CarKari.
 *
 * The library and weights load from jsDelivr at runtime rather than being
 * bundled: they are ~6MB and only two screens ever need them. Version is
 * pinned. TODO before launch: vendor these into /public/models so we are not
 * trusting a CDN in an identity path —
 *   npm i @vladmandic/face-api@1.7.15
 *   cp -r node_modules/@vladmandic/face-api/model public/models
 * then set NEXT_PUBLIC_FACE_MODEL_URL=/models
 */

const VERSION = "1.7.15";
const LIB = `https://cdn.jsdelivr.net/npm/@vladmandic/face-api@${VERSION}/dist/face-api.esm.js`;
const MODELS =
  process.env.NEXT_PUBLIC_FACE_MODEL_URL ??
  `https://cdn.jsdelivr.net/npm/@vladmandic/face-api@${VERSION}/model`;

/** Same person if the descriptors are closer than this. */
export const MATCH_DISTANCE = 0.5;

type FaceApi = {
  nets: {
    ssdMobilenetv1: { loadFromUri: (u: string) => Promise<void> };
    faceLandmark68Net: { loadFromUri: (u: string) => Promise<void> };
    faceRecognitionNet: { loadFromUri: (u: string) => Promise<void> };
  };
  detectSingleFace: (input: HTMLImageElement) => {
    withFaceLandmarks: () => {
      withFaceDescriptor: () => Promise<{ descriptor: Float32Array } | undefined>;
    };
  };
};

let loading: Promise<FaceApi | null> | null = null;

async function load(): Promise<FaceApi | null> {
  if (!loading) {
    loading = (async () => {
      try {
        const api = (await import(/* webpackIgnore: true */ LIB)) as unknown as FaceApi;
        await Promise.all([
          api.nets.ssdMobilenetv1.loadFromUri(MODELS),
          api.nets.faceLandmark68Net.loadFromUri(MODELS),
          api.nets.faceRecognitionNet.loadFromUri(MODELS),
        ]);
        return api;
      } catch {
        return null; // offline, blocked, or unsupported — caller degrades
      }
    })();
  }
  return loading;
}

function toImage(file: File | Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("image decode failed"));
    };
    img.src = url;
  });
}

/**
 * Descriptor for one photo, or null when no single clear face is found —
 * which is itself useful information, not an error to hide.
 */
export async function faceDescriptor(file: File | Blob): Promise<number[] | null> {
  const api = await load();
  if (!api) return null;
  try {
    const img = await toImage(file);
    const result = await api
      .detectSingleFace(img)
      .withFaceLandmarks()
      .withFaceDescriptor();
    return result ? Array.from(result.descriptor) : null;
  } catch {
    return null;
  }
}

/** Euclidean distance. Smaller means more alike. */
export function distance(a: number[], b: number[]): number {
  if (a.length !== b.length) return Number.POSITIVE_INFINITY;
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    sum += d * d;
  }
  return Math.sqrt(sum);
}

export type DeviceVerdict = "match" | "no_match" | "unavailable";

/** Compare a fresh photo against a stored descriptor. */
export async function compareToStored(
  photo: File | Blob,
  stored: number[] | null
): Promise<{ verdict: DeviceVerdict; distance: number | null }> {
  if (!stored?.length) return { verdict: "unavailable", distance: null };
  const fresh = await faceDescriptor(photo);
  if (!fresh) return { verdict: "unavailable", distance: null };
  const d = distance(fresh, stored);
  return {
    verdict: d <= MATCH_DISTANCE ? "match" : "no_match",
    distance: Math.round(d * 1000) / 1000,
  };
}
