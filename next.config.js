 /** @type {import('next').NextConfig} */                                                                                                        
  const nextConfig = {
    images: {
      remotePatterns: [
        // Render backend (producción)
        {
          protocol: "https",
          hostname: "backend-biometry-face.onrender.com",
          pathname: "/**",
        },
        // Local desarrollo
        {
          protocol: "http",
          hostname: "localhost",
          port: "8000",
          pathname: "/**",
        },
      ],
    },
  };
  
  module.exports = nextConfig;