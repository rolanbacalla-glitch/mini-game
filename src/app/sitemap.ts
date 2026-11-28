import type { MetadataRoute } from "next";

const SITE_URL = "https://games.rolanbacalla.online";

const ROUTES = [
  "",
  "/cause-and-effect",
  "/chess",
  "/chroma-calm",
  "/connect-4",
  "/daily-pour",
  "/draughts",
  "/loom-and-latch",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return ROUTES.map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified,
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1.0 : 0.8,
  }));
}
