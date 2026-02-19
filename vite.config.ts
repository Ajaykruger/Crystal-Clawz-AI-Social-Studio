import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    // Support both VITE_GEMINI_API_KEY (standard Vite convention) and plain GEMINI_API_KEY.
    // Only inject the key at build time when it actually has a value — if it's absent,
    // leave process.env.API_KEY as a runtime reference so Google AI Studio can inject
    // its own key without being overridden by a baked-in undefined/empty string.
    const geminiKey = env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY;
    const define: Record<string, string> = {};
    if (geminiKey) {
      define['process.env.API_KEY'] = JSON.stringify(geminiKey);
      define['process.env.GEMINI_API_KEY'] = JSON.stringify(geminiKey);
    }
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define,
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
