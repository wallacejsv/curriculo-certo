import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // unpdf traz o pdfjs empacotado; mantê-lo externo no server evita conflitos de bundling.
  serverExternalPackages: ["unpdf"],
};

export default nextConfig;
