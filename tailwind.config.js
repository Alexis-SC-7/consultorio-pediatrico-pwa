/** @type {import('tailwindcss').Config} */
export default {
  // Definimos las rutas donde Tailwind debe buscar nuestras clases 
  // para generar el CSS final.
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Aquí es donde sucede la magia personalizada.
      // Por ahora está limpio, lo que mantiene tu app ligera y rápida.
      animation: {
        // Podríamos añadir animaciones personalizadas aquí más adelante
      },
    },
  },
  // Los plugins permiten añadir funciones extra como formularios estilizados 
  // o tipografía avanzada, pero para tu sistema médico actual, 
  // mantenerlo limpio es lo más eficiente.
  plugins: [],
}