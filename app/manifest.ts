import type { MetadataRoute } from "next";
import { BRAND } from "@/lib/env";

/** Lets staff add the app to their home screen; it opens straight into their tips. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: BRAND,
    short_name: BRAND,
    description: "Your tips, ratings and card.",
    start_url: "/me",
    display: "standalone",
    background_color: "#f5f5f7",
    theme_color: "#ffffff",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
