import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Genova",
    short_name: "GENOVA",
    description: "A Progressive Web App built with Next.js",
    start_url: "/",
    display: "standalone",
    theme_color: "#24386c",
    background_color: "#0b317c",

    icons: [
      {
        src: "/Glogo.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/Glogo.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
