import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          "/api/openai": {
            target: "https://api.openai.com",
            changeOrigin: true,
            secure: true,
            rewrite: (path) => path.replace(/^\/api\/openai/, "/v1"),
            configure: (proxy) => {
              proxy.on("proxyReq", (proxyReq) => {
                if (env.VITE_OPENAI_API_KEY) {
                  proxyReq.setHeader("Authorization", `Bearer ${env.VITE_OPENAI_API_KEY}`);
                }
                proxyReq.setHeader("Content-Type", "application/json");
              });
            },
          },
        },
      },
      plugins: [react()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
