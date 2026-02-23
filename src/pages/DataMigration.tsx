// src/pages/DataMigration.tsx
import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { useClinic } from '../context/ClinicContext';
import { useAuth } from '../context/AuthContext';
// Iconografía para herramientas de sistema
import { 
  Database, 
  Users, 
  Stethoscope, 
  Terminal, 
  UploadCloud, 
  CheckCircle2, 
  AlertCircle,
  Loader2
} from 'lucide-react';

export const DataMigration: React.FC = () => {
  const { currentClinicId, themeColor } = useClinic();
  const { currentUser } = useAuth();
  
  const [jsonInput, setJsonInput] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [dataType, setDataType] = useState<'pacientes' | 'consultas'>('pacientes');

  /* Limpieza de texto para asegurar que las búsquedas futuras no fallen por acentos o mayúsculas.
   */
  const normalizeText = (text: string) => 
    text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  /* Intérprete de fechas flexible.
  Maneja formatos estándar y variaciones comunes en archivos CSV/JSON locales.
  */
  const parseDate = (dateString: string) => {
    if (!dateString) return new Date();
    const parts = dateString.split(/[-/]/);
    if (parts.length === 3) {
        // Soporte para formato latino DD/MM/YYYY
        return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    }
    return new Date(dateString);
  };

  /* Sanitización de valores numéricos.
  Elimina unidades de medida (Kg, Mts) para dejar solo el valor puro.
  */
  const cleanNumber = (val: string | number) => {
    if (!val) return '';
    return String(val).replace(/[^\d.]/g, '').trim();
  };

  /* Motor de migración.
  Procesa el JSON y lo inyecta en las subcolecciones correspondientes
  manteniendo la integridad de las relaciones mediante legacyId.
  */
  const handleMigrate = async () => {
    if (!jsonInput) return alert("Por favor, pega el contenido JSON para continuar.");
    if (!confirm(`¿Confirmas la importación masiva hacia la sede: ${currentClinicId}?`)) return;

    setLoading(true);
    setLogs([]);
    
    try {
      const data = JSON.parse(jsonInput);
      if (!Array.isArray(data)) throw new Error("Formato inválido: Se requiere un Array [].");

      let count = 0;
      let tempLogs: string[] = [];

      // --- FLUJO DE IMPORTACIÓN: PACIENTES ---
      if (dataType === 'pacientes') {
        const patientsRef = collection(db, "users", currentUser!.uid, "patients");

        for (const item of data) {
          const newPatient = {
            name: item.NombreCompleto || item.Nombre || 'Paciente sin nombre', 
            birthDate: item.FechaNacimiento || '', 
            sex: item.Sexo || 'Hombre',
            phone: item.Telefono || '',
            curp: item.CURP || '',
            tutor: item.Tutor || '',
            bloodType: item.GrupoSanguineo || '',
            allergies: item.Alergias || '',
            chronicDiseases: item.EnfermedadesCronicas || '',
            notes: item.Notas || '',
            clinicId: currentClinicId,
            nameLowerCase: normalizeText(item.NombreCompleto || item.Nombre || ''),
            createdAt: serverTimestamp(),
            legacyId: String(item.IdPaciente || item.ID || '') 
          };

          await addDoc(patientsRef, newPatient);
          count++;
          tempLogs.push(`Registro exitoso: ${newPatient.name}`);
          setLogs([...tempLogs]); 
        }
      }

      // --- FLUJO DE IMPORTACIÓN: CONSULTAS (Vínculo por ID Legacy) ---
      if (dataType === 'consultas') {
        const patientsRef = collection(db, "users", currentUser!.uid, "patients");

        for (const item of data) {
            const legacyId = String(item.Paciente_ID || item.IdPacienteRelacionado || ''); 
            
            if (!legacyId) {
                tempLogs.push(`Omitiendo: Registro sin identificador de relación.`);
                continue;
            }

            // Localización del paciente padre mediante el ID del sistema anterior
            const q = query(patientsRef, where("legacyId", "==", legacyId));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const patientDoc = querySnapshot.docs[0];
                const patientId = patientDoc.id;
                const patientName = patientDoc.data().name;

                const consultsRef = collection(db, "users", currentUser!.uid, "patients", patientId, "consultations");
                
                await addDoc(consultsRef, {
                    date: parseDate(item.Fecha_Consulta || item.FechaConsulta),
                    weight: cleanNumber(item.Peso),
                    height: cleanNumber(item.Talla),
                    temp: cleanNumber(item.Temperatura),
                    pressure: item["Tensión Arterial"] || item.TensionArterial || '',
                    reason: item.Motivo || 'Migración Histórica',
                    diagnosis: item.Diagnóstico || item.Diagnostico || '',
                    prescription: item.Tratamiento || item.RecetaTexto || '',
                    observations: item.Observaciones || '',
                    type: 'consulta', 
                    clinicId: currentClinicId
                });
                tempLogs.push(`Historial vinculado: ${patientName} (ID: ${legacyId})`);
                count++;
            } else {
                tempLogs.push(`Error: No se encontró al paciente con ID Legacy ${legacyId}`);
            }
            setLogs([...tempLogs]);
        }
      }

      alert(`¡Migración completada! ${count} registros procesados.`);

    } catch (error) {
      console.error(error);
      alert("Error en la estructura del JSON. Verifica el formato e intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
        <Database className="text-gray-400" size={28} />
        <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Migración de Datos</h1>
      </div>
      
      {/* Selector de tipo de carga */}
      <div className="flex gap-3 bg-gray-100 p-1.5 rounded-xl w-fit">
          <button 
            onClick={() => setDataType('pacientes')} 
            className={`px-5 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${dataType === 'pacientes' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Users size={16} />
            1. Pacientes
          </button>
          <button 
            onClick={() => setDataType('consultas')} 
            className={`px-5 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${dataType === 'consultas' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Stethoscope size={16} />
            2. Historial Clínico
          </button>
      </div>

      <div className="relative group">
        <textarea 
            className="w-full h-80 p-5 border border-gray-200 rounded-2xl font-mono text-[11px] bg-gray-50 focus:ring-4 focus:ring-blue-100 focus:bg-white focus:border-blue-400 outline-none transition-all shadow-inner"
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder='Pega aquí el objeto JSON [ { ... }, { ... } ]'
        />
        <div className="absolute top-4 right-4 text-gray-300">
          <UploadCloud size={24} />
        </div>
      </div>

      <button 
        onClick={handleMigrate}
        disabled={loading}
        style={{ backgroundColor: loading ? '#9ca3af' : themeColor }}
        className="text-white px-6 py-4 rounded-2xl font-bold shadow-lg shadow-blue-500/20 hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed w-full transition-all flex items-center justify-center gap-3 tracking-widest text-sm uppercase"
      >
        {loading ? (
          <>
            <Loader2 className="animate-spin" size={20} />
            Procesando archivos...
          </>
        ) : (
          <>
            <CheckCircle2 size={20} />
            Iniciar Importación Masiva
          </>
        )}
      </button>

      {/* Terminal de Logs */}
      <div className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
        <div className="bg-slate-800 px-4 py-2 flex items-center gap-2 border-b border-slate-700">
          <Terminal size={14} className="text-slate-400" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Consola de Salida</span>
        </div>
        <div className="p-5 h-56 overflow-y-auto font-mono text-[11px] leading-relaxed text-emerald-400 custom-scrollbar">
          {logs.length === 0 ? (
            <div className="text-slate-500 flex items-center gap-2 italic">
              <AlertCircle size={14} />
              En espera de datos para procesar...
            </div>
          ) : (
            logs.map((l, i) => (
              <div key={i} className="flex gap-2 mb-1">
                <span className="text-slate-600">[{new Date().toLocaleTimeString()}]</span>
                <span className={l.includes('Error') ? 'text-red-400' : 'text-emerald-400'}>{l}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
      `}</style>
    </div>
  );
};