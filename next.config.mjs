/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Pin the file-tracing root to this project (a lockfile exists in the parent
  // folder, which would otherwise be inferred as the workspace root).
  outputFileTracingRoot: import.meta.dirname,
  images: {
    // Allow Supabase Storage public URLs (avatars). Replace <project-ref> after setup,
    // or rely on the env-driven hostname below.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;
