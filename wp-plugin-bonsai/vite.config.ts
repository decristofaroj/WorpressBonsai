import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url';

// __dirname is not available in ES modules by default.
// This correctly derives the directory path from the module's URL.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Fix: Replaced process.cwd() with __dirname to resolve a TypeScript type error.
  const env = loadEnv(mode, __dirname, '');
  
  return {
    plugins: [react()],
    resolve: {
      alias: {
        // This alias allows for clean imports like `import Component from '@/components/Component'`
        '@': path.resolve(__dirname, './src'),
      },
    },
    // This `define` block makes .env variables available in your client-side code
    // via the `process.env` object, making them accessible in your services.
    define: {
      'process.env.API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
      'process.env.VITE_OPENAI_API_KEY': JSON.stringify(env.VITE_OPENAI_API_KEY),
      'process.env.VITE_ANTHROPIC_API_KEY': JSON.stringify(env.VITE_ANTHROPIC_API_KEY),
    },
  }
})
