// src/context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User as FirebaseUser 
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import type { AuthContextType, User } from '../types/index';

// Inicialización del contexto de seguridad
const AuthContext = createContext<AuthContextType | null>(null);

// Constante de dominio interno para enmascarar la autenticación de Firebase
const EMAIL_SUFFIX = "@sistema.local";

/* Proveedor de Autenticación.
Centraliza el estado de la sesión y la hidratación de datos del perfil desde Firestore hacia el resto de la aplicación.
*/
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  /* Ejecuta el proceso de Login:
  Transforma un identificador de usuario simple en una credencial compatible con Firebase Auth mediante un sufijo de dominio controlado.
  */
  const login = async (username: string, pass: string) => {
    // Normalización de credenciales para evitar errores por mayúsculas o espacios
    const fakeEmail = `${username.toLowerCase().trim()}${EMAIL_SUFFIX}`;
    await signInWithEmailAndPassword(auth, fakeEmail, pass);
  };

  /**
    Finaliza la sesión activa en el cliente y el servidor de Firebase.
   */
  const logout = () => signOut(auth);

  /* Listener del ciclo de vida de la sesión.
  Se encarga de la persistencia de datos y la recuperación de perfiles extendidos.
  */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        // Recuperación del perfil de usuario desde la colección 'users'
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          // Unificación de credenciales de Auth con metadatos de Firestore
          setCurrentUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            ...userDoc.data()
          } as User);
        } else {
          // Gestión de inconsistencia: Usuario autenticado sin registro de perfil
          console.error("Inconsistencia detectada: Autenticación activa sin perfil de base de datos.");
          setCurrentUser(null);
        }
      } else {
        // Sesión nula o expirada
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {/* Se previene el renderizado de la app hasta que el estado de sesión sea resuelto */}
      {!loading && children}
    </AuthContext.Provider>
  );
};

/* Hook de acceso rápido al contexto de autenticación.
Implementa una guardia de seguridad para asegurar que se use dentro del proveedor.
*/
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe instanciarse estrictamente dentro de un AuthProvider");
  return context;
};