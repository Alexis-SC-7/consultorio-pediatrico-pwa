// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  collection,
  addDoc,
  serverTimestamp 
} from "firebase/firestore";
import { getStorage } from "firebase/storage";

/* Configuración de Identidad de Firebase.
    Utilizamos 'import.meta.env' 
  para que Vite las inyecte desde el archivo .env.local para que Git lo ignore.
  Esto protege la infraestructura de accesos no autorizados en GitHub.
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Inicializamos la conexión base con los servicios de Google
const app = initializeApp(firebaseConfig);

// Módulo de Autenticación: Control de acceso y sesiones del doctor
export const auth = getAuth(app);

/* Configuración de Firestore con Persistencia Local (Offline-First).
Esta configuración es vital para el Consultorio Digital. Si el internet falla, los datos se
guardan en el almacenamiento local del navegador y se sincronizan automáticamente al
recuperar la señal. El TabManager permite que la app funcione sincronizada incluso si el
doctor tiene varias pestañas abiertas.
*/
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

// Almacenamiento en la nube: Para recetas generadas, fotos o archivos médicos
export const storage = getStorage(app);

/* Sistema de Telemetría de Errores.
Esta función registra silenciosamente los errores en la colección 'error_logs', 
permitiéndonos depurar problemas de producción sin interrumpir al Dr.
*/
export const saveErrorLog = async (error: any, context: string) => {
  try {
    const logsRef = collection(db, "error_logs");
    
    await addDoc(logsRef, {
      message: error.message || "Error sin descripción",
      code: error.code || "unknown_error",
      context: context, // Ej: "Fallo en generación de PDF"
      timestamp: serverTimestamp(),
      userAgent: navigator.userAgent, // Datos del dispositivo para diagnóstico técnico
    });

  } catch (e) {
    // Si la red está caída, el log se enviará automáticamente cuando vuelva la conexión
    // gracias a la persistencia local configurada arriba.
    console.error("No se pudo registrar el log de error de forma inmediata.", e);
  }
};