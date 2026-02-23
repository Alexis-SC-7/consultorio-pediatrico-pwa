import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

/**
 * Motor de Configuración de Vite.
 * Aquí orquestamos cómo se compila el código y cómo se comporta la 
 * Progressive Web App (PWA).
 */
export default defineConfig({
  plugins: [
    react(),
    
    /**
     * Configuración del Plugin PWA.
     * Esta sección es la que dota al consultorio de "superpoderes" offline.
     */
    VitePWA({
      // Usamos 'prompt' para que el usuario controle cuándo actualizar 
      // (coordinado con el código que pusimos en main.tsx).
      registerType: 'prompt', 
      
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      
      manifest: {
        name: 'Consultorio Digital',
        short_name: 'Consultorio',
        description: 'Sistema de Gestión Pediátrica para el Dr. Jesús',
        theme_color: '#ffffff', // Color de la barra de estado en móviles
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },

      /**
       * Estrategia Workbox (Service Worker).
       * Le indica al navegador qué archivos debe guardar "en la mochila" (caché)
       * para que el sistema abra instantáneamente aunque no haya internet.
       */
      workbox: {
        // Cacheamos todo lo vital: Lógica (js), Estilos (css) y Gráficos (svg/png)
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
      }
    })
  ],
})