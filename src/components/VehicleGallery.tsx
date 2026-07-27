"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";

/**
 * Listing gallery: mosaic on desktop (1 large + 2 stacked), swipeable single
 * image on mobile, full-screen lightbox with keyboard + arrow navigation.
 */
export function VehicleGallery({
  images,
  alt,
  labels,
}: {
  images: string[];
  alt: string;
  labels: { viewAll: string; close: string; prev: string; next: string; of: string };
}) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const count = images.length;

  const go = useCallback(
    (delta: number) => setIndex((i) => (i + delta + count) % count),
    [count]
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, go]);

  function openAt(i: number) {
    setIndex(i);
    setOpen(true);
  }

  const main = images[0];
  const side = images.slice(1, 3);
  const rest = Math.max(0, count - 3);

  return (
    <>
      {/* mobile: horizontal snap scroller */}
      <div className="-mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 pb-1 sm:hidden">
        {images.map((src, i) => (
          <button
            key={src}
            onClick={() => openAt(i)}
            className="relative aspect-4/3 w-[85%] shrink-0 snap-center overflow-hidden rounded-2xl bg-brand-100"
          >
            <Image
              src={src}
              alt={`${alt} ${i + 1}`}
              fill
              sizes="85vw"
              priority={i === 0}
              className="object-cover"
            />
          </button>
        ))}
      </div>

      {/* desktop mosaic */}
      <div className="hidden gap-2 sm:grid sm:grid-cols-3">
        <button
          onClick={() => openAt(0)}
          className="group relative col-span-2 aspect-16/10 overflow-hidden rounded-l-2xl bg-brand-100"
        >
          <Image
            src={main}
            alt={alt}
            fill
            priority
            sizes="(max-width: 1024px) 66vw, 640px"
            className="object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        </button>
        <div className="grid grid-rows-2 gap-2">
          {side.map((src, i) => (
            <button
              key={src}
              onClick={() => openAt(i + 1)}
              className={`group relative overflow-hidden bg-brand-100 ${i === 0 ? "rounded-tr-2xl" : "rounded-br-2xl"}`}
            >
              <Image
                src={src}
                alt={`${alt} ${i + 2}`}
                fill
                sizes="320px"
                className="object-cover transition duration-500 group-hover:scale-[1.05]"
              />
              {i === 1 && count > 1 && (
                <span className="absolute bottom-3 right-3 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-brand-950 shadow">
                  {labels.viewAll.replace("{n}", String(count))}
                </span>
              )}
            </button>
          ))}
          {side.length === 0 && (
            <div className="row-span-2 rounded-r-2xl bg-brand-100" />
          )}
        </div>
      </div>

      {rest > 0 && (
        <div className="mt-2 hidden gap-2 sm:flex">
          {images.slice(3).map((src, i) => (
            <button
              key={src}
              onClick={() => openAt(i + 3)}
              className="relative h-20 w-28 overflow-hidden rounded-xl bg-brand-100"
            >
              <Image src={src} alt={`${alt} ${i + 4}`} fill sizes="112px" className="object-cover" />
            </button>
          ))}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-black/95">
          <div className="flex items-center justify-between px-4 py-3 text-white">
            <span className="text-sm">
              {index + 1} {labels.of} {count}
            </span>
            <button
              onClick={() => setOpen(false)}
              aria-label={labels.close}
              className="rounded-full p-2 text-2xl leading-none hover:bg-white/10"
            >
              ×
            </button>
          </div>
          <div className="relative flex-1">
            <Image
              src={images[index]}
              alt={`${alt} ${index + 1}`}
              fill
              sizes="100vw"
              className="object-contain"
            />
            {count > 1 && (
              <>
                <button
                  onClick={() => go(-1)}
                  aria-label={labels.prev}
                  className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/15 p-3 text-white backdrop-blur hover:bg-white/25"
                >
                  ‹
                </button>
                <button
                  onClick={() => go(1)}
                  aria-label={labels.next}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/15 p-3 text-white backdrop-blur hover:bg-white/25"
                >
                  ›
                </button>
              </>
            )}
          </div>
          <div className="flex justify-center gap-2 overflow-x-auto p-4">
            {images.map((src, i) => (
              <button
                key={src}
                onClick={() => setIndex(i)}
                className={`relative h-14 w-20 shrink-0 overflow-hidden rounded-lg ring-2 transition ${i === index ? "ring-white" : "ring-transparent opacity-60 hover:opacity-100"}`}
              >
                <Image src={src} alt="" fill sizes="80px" className="object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
