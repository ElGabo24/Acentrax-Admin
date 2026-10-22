import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// `npm run dev:remoto` (vite --mode devserver) manda /api a la API de desarrollo en línea
// (https://api.acentrax.com.mx/api-dev/v1, base ficticia) en vez de al back local.
// El proxy sigue quitando `Origin`, así que no hace falta tocar CORS en el back.
export default defineConfig(({ mode }) => {
  const remoto = mode === 'devserver'
  return {
    plugins: [
      react(),
      babel({ presets: [reactCompilerPreset()] }),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      // En local, VITE_API_URL=/api y el proxy evita CORS contra el backend.
      proxy: {
        '/api': {
          target: remoto ? 'https://api.acentrax.com.mx' : 'http://localhost:8080',
          changeOrigin: true,
          ...(remoto && { secure: true, rewrite: (ruta: string) => ruta.replace(/^\/api/, '/api-dev') }),
          // El backend rechaza (403 CORS) el Origin de localhost:5173; el proxy lo quita.
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => proxyReq.removeHeader('origin'))
          },
        },
      },
    },
  }
})
