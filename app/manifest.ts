import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "NaijaPlay — Play. Learn. Compete. Become.",
    short_name: "NaijaPlay",
    description:
      "An African youth entertainment and learning ecosystem starting in Nigeria. Play games, complete daily missions, learn skills, and compete safely.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#0B111E",
    theme_color: "#059669",
    icons: [
      {
        src: "/pwa-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/pwa-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/pwa-maskable-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
