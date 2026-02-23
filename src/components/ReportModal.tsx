// src/components/ReportModal.tsx
import React, { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useClinic } from '../context/ClinicContext';
// Iconografía para exportación y controles de interfaz
import { FileDown, X, Calendar, Loader2 } from 'lucide-react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  patients: any[]; 
}

/* Componente para la generación de informes administrativos en formato PDF.
Realiza un filtrado en memoria basado en el rango de fechas de registro.
*/
export const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, patients }) => {
  const { clinicName, themeColor } = useClinic();
  
  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  /* Procesa la lógica de filtrado y construcción del documento PDF.
  Maneja la normalización de zonas horarias para asegurar la precisión del reporte.
  */
  const handleGeneratePDF = () => {
    setLoading(true);
    try {
        // Normalización de fechas para búsqueda por rangos horarios (Hora Local)
        const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
        const start = new Date(startYear, startMonth - 1, startDay, 0, 0, 0, 0); 
        
        const [endYear, endMonth, endDay] = endDate.split('-').map(Number);
        const end = new Date(endYear, endMonth - 1, endDay, 23, 59, 59, 999); 

        const filtered = patients.filter(p => {
            if (!p.createdAt) return false;
            const pDate = p.createdAt.toDate ? p.createdAt.toDate() : new Date(p.createdAt);
            return pDate >= start && pDate <= end;
        });

        if (filtered.length === 0) {
            alert("No se encontraron registros en el rango seleccionado.");
            setLoading(false);
            return;
        }

        // Configuración y construcción del motor jsPDF
        const doc = new jsPDF();

        // Estructura de encabezados del reporte
        doc.setFontSize(18);
        doc.setTextColor(themeColor);
        doc.text(clinicName, 14, 20);
        
        doc.setFontSize(12);
        doc.setTextColor(100);
        doc.text(`Reporte de Pacientes Registrados`, 14, 28);
        doc.setFontSize(10);
        doc.text(`Periodo: ${startDate} al ${endDate}`, 14, 34);
        doc.text(`Total de registros: ${filtered.length}`, 14, 39);

        // Mapeo de datos para la construcción de la tabla
        const tableColumn = ["Nombre del Paciente", "Fecha Registro", "Edad", "Teléfono", "Sexo"];
        const tableRows: any[] = [];

        filtered.forEach(patient => {
            const dateStr = patient.createdAt?.toDate 
                ? patient.createdAt.toDate().toLocaleDateString('es-MX') 
                : '-';
            
            let ageStr = '-';
            if(patient.birthDate) {
                const birth = new Date(patient.birthDate);
                const diff = Date.now() - birth.getTime();
                const ageDate = new Date(diff); 
                ageStr = Math.abs(ageDate.getUTCFullYear() - 1970) + " años";
            }

            tableRows.push([
                patient.name,
                dateStr,
                ageStr,
                patient.phone || 'N/A',
                patient.sex
            ]);
        });

        // Generación de tabla automática con estilos corporativos
        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 45,
            theme: 'grid',
            headStyles: { fillColor: themeColor },
            styles: { fontSize: 9 }
        });

        doc.save(`Reporte_Pacientes_${startDate}_${endDate}.pdf`);
        onClose();

    } catch (error) {
        console.error("Error en motor PDF:", error);
        alert("Ocurrió un error al generar el documento.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        
        {/* Cabecera del generador */}
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div className="flex items-center gap-2">
            <FileDown size={18} className="text-gray-600" />
            <h2 className="font-bold text-gray-700">Generar Reporte PDF</h2>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
            <p className="text-sm text-gray-500 leading-relaxed">
              Define el rango de fechas para exportar el listado oficial de pacientes registrados en la sede actual.
            </p>
            
            {/* Controles de selección temporal */}
            <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1">
                    <label className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      <Calendar size={12} />
                      Fecha Inicio
                    </label>
                    <input 
                        type="date" 
                        className="w-full border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-opacity-20 outline-none transition-all text-sm"
                        style={{ '--tw-ring-color': themeColor } as any}
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                    />
                </div>

                <div className="space-y-1">
                    <label className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      <Calendar size={12} />
                      Fecha Fin
                    </label>
                    <input 
                        type="date" 
                        className="w-full border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-opacity-20 outline-none transition-all text-sm"
                        style={{ '--tw-ring-color': themeColor } as any}
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                    />
                </div>
            </div>

            {/* Acciones de exportación */}
            <div className="pt-4 flex gap-3 justify-end border-t border-gray-50 mt-2">
                <button 
                  onClick={onClose} 
                  className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg text-sm font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button 
                    onClick={handleGeneratePDF} 
                    disabled={loading}
                    style={{ backgroundColor: themeColor }}
                    className="px-6 py-2 text-white rounded-lg shadow-md hover:brightness-110 disabled:opacity-50 text-sm font-bold flex items-center gap-2 transition-all"
                >
                    {loading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <FileDown size={16} />
                    )}
                    {loading ? 'Procesando...' : 'Descargar PDF'}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};