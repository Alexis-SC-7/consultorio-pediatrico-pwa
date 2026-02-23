// src/components/LetterheadPrint.tsx
import { forwardRef } from 'react';
// Activos para la identidad visual de los documentos físicos
import bgJesus from '../assets/membrete_bg_jesus.jpg'; 
import bgLuz from '../assets/membrete_bg_luz.jpg';

interface LetterheadPrintProps {
  clinicId: string;
  patientName: string;
  date: any;
  subject: string;
  body: string;
}

/* Componente de renderizado para impresión física (Letter Size).
Utiliza ForwardRef para permitir que librerías externas (como react-to-print) capturen el 
nodo del DOM y generen el spool de impresión o PDF.
*/
export const LetterheadPrint = forwardRef<HTMLDivElement, LetterheadPrintProps>((props, ref) => {
  const { clinicId, date, subject, body } = props;

  // Selección de identidad visual basada en el contexto de la clínica actual
  const backgroundImage = clinicId === 'clinic_a' ? bgJesus : bgLuz;

  /* Procesamiento de metadatos temporales.
  Transforma el timestamp de Firebase a una cadena semántica localizada.
  */
  const dateObj = date?.toDate ? date.toDate() : new Date();
  
  const day = dateObj.getDate();
  const month = dateObj.toLocaleDateString('es-MX', { month: 'long' });
  const year = dateObj.getFullYear();

  // Formato oficial para documentos médico-legales
  const customDateString = `Ciudad Altamirano, Gro. A ${day} de ${month} del ${year}`;

  return (
    <div 
      ref={ref} 
      className="relative w-[21.5cm] h-[27.9cm] text-gray-900 font-sans overflow-hidden bg-white print:shadow-none"
    >
      
      {/* CAPA DE FONDO: Imagen de marca de agua a tamaño completo */}
      <img 
        src={backgroundImage} 
        alt="Fondo Membrete" 
        className="absolute inset-0 w-full h-full object-cover z-0" 
      />

      {/* CAPA DE CONTENIDO: Estructura del documento con márgenes técnicos de impresión */}
      <div className="absolute inset-0 z-10 flex flex-col px-20 pt-48 pb-20"> 

        {/* Localización y Fecha */}
        <div className="text-right text-lg font-medium mb-12 text-gray-700">
            {customDateString}
        </div>

        {/* Definición del Asunto Documental */}
        <div className="mb-8">
            <span className="font-bold uppercase text-gray-800 tracking-tight">Asunto:</span> 
            <span className="ml-2 text-gray-800 uppercase font-semibold">{subject}</span>
        </div>

        {/* Cuerpo del Mensaje: Mantiene saltos de línea y espaciado original */}
        <div className="flex-1 text-justify text-lg leading-loose whitespace-pre-wrap text-gray-800">
            {body}
        </div>

      </div>

      {/* INYECCIÓN DE ESTILOS CSS PARA MOTORES DE IMPRESIÓN (W3C Standard) */}
      <style>{`
        @media print {
          @page {
            size: letter;
            margin: 0mm; 
          }
          body {
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact; /* Asegura que el fondo se imprima con fidelidad */
          }
        }
      `}</style>
    </div>
  );
});