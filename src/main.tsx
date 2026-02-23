// src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css' 

/**
 * Registro del Service Worker (PWA).
 * Esta pieza es la que permite que el software se pueda "Instalar" 
 * en la PC o el celular y que funcione incluso sin conexión a internet.
 */
// @ts-ignore
import { registerSW } from 'virtual:pwa-register'

const updateSW = registerSW({
  onNeedRefresh() {
    /**
     * Cuando subimos una mejora al servidor, el navegador lo detecta.
     * Usamos un aviso amigable para que el doctor decida cuándo aplicarla,
     * así evitamos que la página se refresque sola a mitad de una receta.
     */
    const userAccepted = confirm(
      "¡Nueva versión disponible!\n\n" +
      "Hemos añadido mejoras al sistema. ¿Quieres aplicarlas en este momento?"
    );

    if (userAccepted) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    // Esto le da paz mental al equipo: el sistema ya vive en el dispositivo.
    console.log("Infraestructura lista: El consultorio ahora puede operar offline.");
  },
})

/**
 * Vigilante de Versiones.
 * Esta función obliga al navegador a preguntar al servidor si hay algo nuevo.
 * Es nuestra garantía de que el doctor siempre tenga la última versión de seguridad.
 */
const forceCheckUpdate = async () => {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      // Comparamos el código actual con el que está en la nube
      await registration.update();
      console.log("Sincronizando versiones con el servidor central...");
    }
  }
};

/**
 * Rutina de mantenimiento silencioso.
 * Revisamos actualizaciones cada 5 minutos de forma automática.
 * No consume casi datos, pero mantiene el sistema al día.
 */
setInterval(forceCheckUpdate, 5 * 60 * 1000); 

/**
 * Verificación reactiva.
 * Si el doctor minimiza la ventana y vuelve a entrar horas después, 
 * el sistema aprovecha ese "regreso" para verificar actualizaciones de inmediato.
 */
window.addEventListener('focus', () => {
  forceCheckUpdate();
});

// Punto de entrada principal de React
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)