// src/components/ClinicSwitch.tsx
import React from 'react';
import { useClinic } from '../context/ClinicContext';
// Importación de iconos vectoriales para estandarización visual
import { Building2 } from 'lucide-react';

/* Componente para la gestión de estados globales de la sede.
Permite al facultativo alternar el contexto de datos entre las distintas clínicas.
*/
export const ClinicSwitch: React.FC = () => {
  const { currentClinicId, setClinicId } = useClinic();

  // Definición de constantes para la identidad visual de cada clínica
  const COLORS = {
    clinic_a: '#0076ff',
    clinic_b: '#28a745'
  };

  return (
    <div className="bg-gray-100 p-1.5 rounded-full inline-flex items-center shadow-inner border border-gray-200 relative">
      
      {/* Botón Clínica 1 */}
      <button
        onClick={() => setClinicId('clinic_a')}
        className={`relative z-10 px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 flex items-center gap-2 ${
          currentClinicId === 'clinic_a'
            ? 'text-white shadow-lg transform scale-105'
            : 'text-gray-400 hover:text-gray-600'
        }`}
        style={{
            backgroundColor: currentClinicId === 'clinic_a' ? COLORS.clinic_a : 'transparent'
        }}
      >
        <Building2 
          size={16} 
          className={`transition-all duration-300 ${
            currentClinicId === 'clinic_a' ? 'scale-110' : 'opacity-40'
          }`} 
        />
        Clínica 1
      </button>

      {/* Botón Clínica 2 */}
      <button
        onClick={() => setClinicId('clinic_b')}
        className={`relative z-10 px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 flex items-center gap-2 ${
          currentClinicId === 'clinic_b'
            ? 'text-white shadow-lg transform scale-105'
            : 'text-gray-400 hover:text-gray-600'
        }`}
        style={{
            backgroundColor: currentClinicId === 'clinic_b' ? COLORS.clinic_b : 'transparent'
        }}
      >
        <Building2 
          size={16} 
          className={`transition-all duration-300 ${
            currentClinicId === 'clinic_b' ? 'scale-110' : 'opacity-40'
          }`} 
        />
        Clínica 2
      </button>
    </div>
  );
};