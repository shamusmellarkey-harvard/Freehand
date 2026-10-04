import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // googleapis is large and Node-only; keep it external to the server bundle.
  serverExternalPackages: ["googleapis"],
  poweredByHeader: false,
  // Do not auto-generate AGENTS.md / CLAUDE.md on dev start.
  agentRules: false,
};

export default nextConfig;
