import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE.name,
    short_name: SITE.name,
    description: "Premium professional removals across Scotland. Fixed prices, full insurance, refined service.",
    start_url: "/",
    display: "standalone",
    background_color: "#09090B",
    theme_color: "#D4AF37",
    orientation: "portrait",
    categories: ["business", "lifestyle", "travel"],
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
