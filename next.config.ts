import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',          // статический экспорт в папку out/
  trailingSlash: true,       // /radio -> /radio/index.html (удобно для Object Storage)
  images: { unoptimized: true }, // без серверной оптимизации картинок — нужен для статики
};

export default nextConfig;
