import type { MetadataRoute } from "next";

/*
 * Installable to a phone home screen (11.2). Colours come from the token
 * table — --bg for both the splash and the theme.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Libro de gastos",
    short_name: "Gastos",
    description: "Registra un gasto en menos de 10 segundos.",
    lang: "es-CO",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#F4F4F2",
    theme_color: "#F4F4F2",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
