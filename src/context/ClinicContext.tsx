// src/context/ClinicContext.tsx
import React, { createContext, useContext, useState } from 'react';
import { useAuth } from './AuthContext';

/* Definición del Contrato del Contexto. */
interface ClinicContextType {
  currentClinicId: string;
  setClinicId: (id: string) => void;
  clinicName: string;
  doctorName: string;
  themeColor: string;
}

// Inicialización del contexto.
const ClinicContext = createContext<ClinicContextType | null>(null);

/* Proveedor de Contexto Clínico.
Aca se decide qué colores, qué nombres y qué clínica se está visualizando en tiempo real basándose en quién inició sesión.
*/
export const ClinicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  
  /* Por defecto entramos a la 'clinic_a'. 
  Si en el futuro el/los Dr./Drs tiene varias clinicas, solo cambiamos este ID.
  */
  const [currentClinicId, setClinicId] = useState('clinic_a');

  // Buscamos la configuración específica de la clínica dentro del perfil del médico
  const currentClinicConfig = currentUser?.clinics?.[currentClinicId];

  /* Fallbacks (Red de Seguridad).
  Si por alguna razón la base de datos no responde o el campo está vacío, el sistema no se rompe; usa estos valores por defecto.
  */
  const clinicName = currentClinicConfig?.name || 'Consultorio Médico';
  
  // Si no hay nombre, saludamos como "Doctor".
  const doctorName = currentClinicConfig?.doctorName || 'Doctor';
  
  const themeColor = currentClinicConfig?.primaryColor || '#3b82f6';

  // Empaquetamos todo para distribuirlo a los componentes (Dashboard)
  const value = {
    currentClinicId,
    setClinicId,
    clinicName,
    doctorName, 
    themeColor
  };

  return (
    <ClinicContext.Provider value={value}>
      {children}
    </ClinicContext.Provider>
  );
};

// Hook 'useClinic'
export const useClinic = () => {
  const context = useContext(ClinicContext);
  
  // Verificación de seguridad para desarrolladores
  if (!context) {
    throw new Error(
      "ERROR TÉCNICO: useClinic fue llamado fuera de su Provider. " +
      "Asegúrate de que ClinicProvider envuelva a tu App."
    );
  }
  
  return context;
};