import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: parseInt(process.env.CLIENT_PORT || process.env.FRONTEND_PORT || '3000', 10),
    proxy: {
      '/api': {
        target: `http://127.0.0.1:${process.env.SERVER_PORT || process.env.BACKEND_PORT || process.env.PORT || '3001'}`,
        changeOrigin: true,
        configure(proxy) {
          // Vite 5 otherwise waits for the upstream response before forwarding close.
          proxy.on('proxyReq', (upstream, request, response) => {
            const cancel = () => { if (!response.writableEnded) upstream.destroy(); };
            request.once('aborted', cancel);
            response.once('close', cancel);
            if (request.aborted || response.destroyed) cancel();
          });
        },
      },
    },
  },
});
