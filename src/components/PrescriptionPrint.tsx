// src/components/PrescriptionPrint.tsx
import { forwardRef } from 'react';
// Activos visuales para el fondo de la receta según la sede
import bgJesus from '../assets/receta_bg_jesus.png'; 
import bgLuz from '../assets/receta_bg_luz.png';

interface PrescriptionPrintProps {
  clinicId: string;
  patientName: string;
  patientAge?: string | number;
  date: any; 
  diagnosis: string;
  prescription: string;
  vitals?: {
    weight?: string;
    temp?: string;
    pressure?: string;
    height?: string; 
  };
  clinicName?: string;
  doctorName?: string;
  themeColor?: string;
  // RF-17: Estructura de formato dinámico para el cuerpo de la receta
  formatting?: {
    fontSize: number;
    bold: boolean;
    align: 'left' | 'center' | 'right';
  };
}

/* Componente de impresión de recetas médicas.
Diseñado con posicionamiento absoluto para superponer datos sobre una imagen de fondo preimpresa (media carta).
*/
export const PrescriptionPrint = forwardRef<HTMLDivElement, PrescriptionPrintProps>((props, ref) => {
  const { 
    clinicId, patientName, patientAge, date, 
    prescription, vitals, formatting 
  } = props;

  // Selección de fondo según el identificador de la clínica
  const backgroundImage = clinicId === 'clinic_a' ? bgJesus : bgLuz;

  // Formateo de fecha con localización estándar
  const formattedDate = date?.toDate 
    ? date.toDate().toLocaleDateString('es-MX')
    : new Date().toLocaleDateString('es-MX');

  return (
    /* CONTENEDOR TÉCNICO: Dimensiones estándar para media carta (21.5cm x 13.8cm) */
    <div 
      ref={ref} 
      className="relative w-[21.5cm] h-[13.8cm] text-gray-900 font-sans text-sm overflow-hidden bg-transparent print:shadow-none"
    >
      
      {/* CAPA BASE: Imagen de fondo membretada */}
      <img 
        src={backgroundImage} 
        alt="Fondo Receta" 
        className="absolute inset-0 w-full h-full object-fill z-0" 
      />

      {/* --- CAPA DE DATOS ANTROPOMÉTRICOS Y FILIACIÓN --- */}

      {/* Identificación del Paciente */}
      <div className="absolute z-10 top-[28%] left-[12%] w-[42%] font-bold truncate text-base">
        {patientName}
      </div>
      
      {/* Edad Cronológica */}
      <div className="absolute z-10 top-[28%] left-[55%] w-[20%] text-center font-bold text-sm leading-tight flex items-center justify-center h-6">
        {patientAge}
      </div>
      
      {/* Fecha de Emisión */}
      <div className="absolute z-10 top-[28%] left-[80%] w-[12%] text-center font-bold text-base">
        {formattedDate}
      </div>


      {/* --- BLOQUE DE SIGNOS VITALES --- */}
      
      <div className="absolute z-10 top-[34%] left-[6%] w-[10%] text-center font-bold">
        {vitals?.weight ? `${vitals.weight} kg` : ''}
      </div>
      
      <div className="absolute z-10 top-[34%] left-[25%] w-[10%] text-center font-bold">
        {vitals?.height ? `${vitals.height} Mts` : '-'}
      </div>

      <div className="absolute z-10 top-[34%] left-[43%] w-[10%] text-center font-bold">
        {vitals?.temp ? `${vitals.temp} °C` : ''}
      </div>

      <div className="absolute z-10 top-[34%] left-[61%] w-[15%] text-center font-bold">
        {vitals?.pressure}
      </div>


      {/* --- ÁREA DE PRESCRIPCIÓN: RENDERIZADO DINÁMICO (RF-17) --- */}
      <div className="absolute z-10 top-[36%] left-[2%] right-[5%] bottom-[8%] p-6 overflow-hidden">
        
        {/* Inyección de estilos de formato personalizados por el médico */}
        <div 
            className="whitespace-pre-wrap leading-relaxed text-gray-900"
            style={{ 
                fontSize: formatting ? `${formatting.fontSize}pt` : '12pt',
                fontWeight: formatting?.bold ? 'bold' : 'normal',
                textAlign: formatting?.align || 'left',
            }}
        >
            {prescription}
        </div>
      </div>

      {/* CONFIGURACIÓN DE IMPRESIÓN: Formato Horizontal (Landscape) */}
      <style>{`
        @media print {
          @page {
            size: landscape;
            margin: 0mm; 
          }
          body {
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact; /* Garantiza la impresión de la imagen de fondo */
          }
        }
      `}</style>
    </div>
  );
});