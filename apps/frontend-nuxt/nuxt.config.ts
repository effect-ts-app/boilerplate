import { defineNuxtConfig } from 'nuxt'

// https://v3.nuxtjs.org/api/configuration/nuxt.config
export default defineNuxtConfig({
  vite: {
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:3540',
          rewrite: (path) => path.replace(/^\/api/, ""),
          changeOrigin: true,
          secure: false
        }
      },
    },
  },
})
