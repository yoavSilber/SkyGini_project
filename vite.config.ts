import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // loadEnv reads .env.local (and .env) into a plain object.
  // The third argument '' means: load all variables, not just VITE_* prefixed ones.
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api/search': {
          target: 'https://api.skygini.com',
          changeOrigin: true,
          rewrite: () => '/flights/search/home-assignment',
          headers: {
            'X-API-Key': env.SKYGINI_API_KEY ?? '',
          },
        },
      },
    },
  }
})
