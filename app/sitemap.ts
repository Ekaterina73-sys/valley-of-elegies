import type { MetadataRoute } from 'next';

// Нужно при output:'export' — иначе sitemap считается динамическим и сборка падает.
export const dynamic = 'force-static';

const BASE = 'https://valleyofelegies.com';

// Карта сайта для поисковиков. trailingSlash:true → URL со слешем на конце.
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${BASE}/`,            lastModified: now, changeFrequency: 'weekly',  priority: 1   },
    { url: `${BASE}/radio/`,      lastModified: now, changeFrequency: 'daily',   priority: 0.9 },
    { url: `${BASE}/characters/`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/world/`,      lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/about/`,      lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/privacy/`,    lastModified: now, changeFrequency: 'yearly',  priority: 0.2 },
  ];
}
