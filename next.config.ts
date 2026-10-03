import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Let an iPhone on the same Wi-Fi load the dev server by the Mac's local IP
  // (e.g. http://10.0.0.42:3000) to test practice mode with a real finger.
  allowedDevOrigins: ["10.*.*.*", "192.168.*.*"],
};

export default nextConfig;
