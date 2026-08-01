import type { MetadataRoute } from "next";

/**
 * Web app manifest — what Android/Chrome read when someone taps
 * "Add to home screen". Without it the phone invents an icon from a
 * screenshot, which is why unpolished sites end up with a blurry tile.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CarKari — Car rental in Morocco",
    short_name: "CarKari",
    description:
      "Rent a car from verified agencies across Morocco. Book online with a deposit, pay the rest at pickup.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    // Matches the dark tile behind the wheel mark on the home-screen icon.
    theme_color: "#0d1b2a",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      // "maskable" = edge-to-edge art Android can crop to any shape
      // (circle, squircle, rounded square) without clipping the mark.
      { src: "/icon-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
