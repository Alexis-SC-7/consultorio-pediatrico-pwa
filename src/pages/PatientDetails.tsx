// src/pages/PatientDetails.tsx
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, collection, query, orderBy, onSnapshot, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useClinic } from '../context/ClinicContext';

// IMPORTS DE COMPONENTES
import { ConsultationModal } from '../components/ConsultationModal';
import { PatientModal } from '../components/PatientModal';
import { LetterheadModal } from '../components/LetterheadModal';
import { PrescriptionPrint } from '../components/PrescriptionPrint';
import { LetterheadPrint } from '../components/LetterheadPrint';
import { useReactToPrint } from 'react-to-print';

// IMPORTACIÓN DE ICONOS
import { 
  ArrowLeft, 
  User, 
  Calendar, 
  Droplets, 
  Phone, 
  Search, 
  Clock, 
  FileText, 
  Pill, 
  Stethoscope, 
  Printer, 
  Edit3, 
  Trash2, 
  AlertTriangle,
  ClipboardList,
  CreditCard,
  History
} from 'lucide-react';

export const PatientDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { themeColor, clinicName, currentClinicId } = useClinic(); 
  
  const [patient, setPatient] = useState<any>(null);
  const [timelineEvents, setTimelineEvents] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);
  
  // Estado para gestionar el filtrado por categorías del historial
  const [filter, setFilter] = useState<'all' | 'consulta' | 'receta' | 'membrete'>('all');

  // Control de visibilidad de los modales operativos
  const [isConsultModalOpen, setIsConsultModalOpen] = useState(false);
  const [isLetterheadModalOpen, setIsLetterheadModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Estados para almacenar la información en proceso de edición
  const [consultationToEdit, setConsultationToEdit] = useState<any>(null);
  const [letterheadToEdit, setLetterheadToEdit] = useState<any>(null); 
  const [modalType, setModalType] = useState<'consulta' | 'receta'>('consulta');

  // CONFIGURACIÓN DE IMPRESIÓN (RECETAS)
  const recipePrintRef = useRef<HTMLDivElement>(null); 
  const [recipeData, setRecipeData] = useState<any>(null);
  
  const handlePrintRecipe = useReactToPrint({ 
    contentRef: recipePrintRef, 
    documentTitle: `Receta-${patient?.name || 'Paciente'}` 
  });

  const printRecipe = (data: any) => {
    setRecipeData(data);
    // Damos un respiro al navegador para que cargue los datos antes de imprimir
    setTimeout(() => { handlePrintRecipe(); }, 100);
  };

  // CONFIGURACIÓN DE IMPRESIÓN (MEMBRETE)
  const letterheadPrintRef = useRef<HTMLDivElement>(null);
  const [letterheadData, setLetterheadData] = useState<any>(null);

  const handlePrintLetterhead = useReactToPrint({ 
    contentRef: letterheadPrintRef, 
    documentTitle: `Membrete-${patient?.name || 'Paciente'}` 
  });

  const printLetterhead = (data: any) => {
    setLetterheadData(data);
    setTimeout(() => { handlePrintLetterhead(); }, 100);
  };

  /* Operaciones de Creación y Edición.
  Preparamos los estados de los modales antes de mostrarlos al médico.
  */
  const handleNewConsultation = () => {
    setConsultationToEdit(null);
    setModalType('consulta');
    setIsConsultModalOpen(true);
  };

  const handleNewRecipe = () => {
    setConsultationToEdit(null);
    setModalType('receta'); 
    setIsConsultModalOpen(true);
  };

  const handleEditConsultation = (consult: any) => {
    setConsultationToEdit(consult);
    setModalType(consult.type === 'receta' ? 'receta' : 'consulta');
    setIsConsultModalOpen(true);
  };

  const handleNewLetterhead = () => {
    setLetterheadToEdit(null);
    setIsLetterheadModalOpen(true);
  };

  const handleEditLetterhead = (item: any) => {
    setLetterheadToEdit(item);
    setIsLetterheadModalOpen(true);
  };

  /* Borrado definitivo de registros históricos.
  Implementamos una confirmación por seguridad para proteger el historial médico.
  */
  const handleDeleteEvent = async (eventId: string, type?: string) => {
    const label = type === 'membrete' ? 'este membrete' : (type === 'receta' ? 'esta receta' : 'esta consulta');
    if (!confirm(`¿Estás seguro de eliminar ${label}? Esta acción no se puede deshacer.`)) return;

    try {
        await deleteDoc(doc(db, "users", currentUser!.uid, "patients", id!, "consultations", eventId));
    } catch (error) {
        console.error("Error al procesar la eliminación:", error);
    }
  };

  /* Calculadora de edad.
  Devuelve un formato semántico: meses para neonatos o años para el resto.
  */
  const formatPatientAge = (birthDateString: string) => {
    if (!birthDateString) return '';
    const today = new Date();
    const birthDate = new Date(birthDateString);
    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();
    if (months < 0 || (months === 0 && today.getDate() < birthDate.getDate())) { years--; months += 12; }
    if (today.getDate() < birthDate.getDate()) { months--; }
    if (months < 0) { months += 12; }
    if (years >= 1) return years === 1 ? "1 año" : `${years} años`;
    else return months === 0 ? "Recién nacido" : (months === 1 ? "1 mes" : `${months} meses`);
  };

  /* Sincronización de Datos.
  Conectamos con Firestore para obtener el perfil y los eventos históricos en tiempo real.
  */
  useEffect(() => {
    if (!currentUser || !id) return;

    const patientRef = doc(db, "users", currentUser.uid, "patients", id);
    const unsubPatient = onSnapshot(patientRef, (docSnap) => {
         if (docSnap.exists()) { setPatient({ id: docSnap.id, ...docSnap.data() }); } 
         else { navigate('/pacientes'); }
         setLoading(false);
    });

    const eventsRef = collection(db, "users", currentUser.uid, "patients", id, "consultations");
    const q = query(eventsRef, orderBy("date", "desc"));
    const unsubTimeline = onSnapshot(q, (snapshot) => {
        setTimelineEvents(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubPatient(); unsubTimeline(); };
  }, [id, currentUser, navigate]);

  // Aplicación de filtros locales sobre la colección de eventos
  const filteredEvents = timelineEvents.filter(item => {
    const type = item.type || 'consulta';
    if (filter === 'all') return true;
    return type === filter;
  });

  if (loading && !patient) return <div className="p-12 text-center text-gray-400 font-medium italic animate-pulse">Abriendo expediente médico...</div>;
  if (!patient) return null;

  const ageString = formatPatientAge(patient.birthDate);
  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      {/* Navegación y retorno */}
      <button 
        onClick={() => navigate('/pacientes')} 
        className="text-gray-400 hover:text-gray-800 flex items-center gap-2 transition-all font-bold text-xs uppercase tracking-widest"
      >
        <ArrowLeft size={16} />
        Volver al listado
      </button>

      {/* --- SECCIÓN 1: ENCABEZADO --- */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="h-3 w-full" style={{ backgroundColor: themeColor }}></div>
        <div className="p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-6">
                    <div 
                      className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl text-white font-bold shadow-lg transform -rotate-2" 
                      style={{ backgroundColor: themeColor }}
                    >
                        {patient.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 tracking-tight">{patient.name}</h1>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {ageString && (
                              <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-[10px] font-bold uppercase flex items-center gap-1.5">
                                <Calendar size={12} /> {ageString}
                              </span>
                            )}
                            {patient.sex && (
                              <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-[10px] font-bold uppercase flex items-center gap-1.5">
                                <User size={12} /> {patient.sex}
                              </span>
                            )}
                            {patient.bloodType && (
                              <span className="px-3 py-1 bg-red-50 text-red-700 border border-red-100 rounded-lg text-[10px] font-bold uppercase flex items-center gap-1.5">
                                <Droplets size={12} /> {patient.bloodType}
                              </span>
                            )}
                        </div>
                    </div>
                </div>
                {/* Botón con efecto de oscurecimiento (Black Hover) */}
                <button 
                  onClick={() => setIsEditModalOpen(true)} 
                  className="px-4 py-2 bg-gray-100 text-gray-500 rounded-xl hover:bg-gray-900 hover:text-white transition-all font-bold text-xs flex items-center gap-2 shadow-sm border border-transparent"
                >
                    <Edit3 size={14} />
                    Editar Datos
                </button>
            </div>
            
            {/* Grid de Información Médica */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8 pt-8 border-t border-gray-100">
                <div className="space-y-3"> 
                  <p className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest"><CreditCard size={12}/> Identificación</p> 
                  <p className="text-sm font-bold text-gray-700">{patient.curp || 'No registrado'}</p> 
                  <p className="text-sm text-gray-500 font-medium">{patient.birthDate}</p> 
                </div>
                <div className="space-y-3"> 
                  <p className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest"><Phone size={12}/> Contacto</p> 
                  <p className="text-sm font-bold text-gray-700">{patient.phone || 'Sin número'}</p> 
                </div>

                <div className="space-y-4">
                    <p className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest"><ClipboardList size={12}/> Antecedentes Médicos</p>
                    
                    {/* SECCIÓN ALERGIAS */}
                    <div>
                        {patient.allergies && !['no', 'ninguna', 'negadas', '-'].includes(patient.allergies.toLowerCase().trim()) ? (
                            <div className="flex items-start gap-2 bg-red-50 border border-red-100 text-red-700 px-3 py-2.5 rounded-xl text-xs font-bold shadow-sm">
                                <AlertTriangle size={16} className="shrink-0" />
                                <span className="leading-tight">ALERGIAS: {patient.allergies.toUpperCase()}</span>
                            </div>
                        ) : (
                            <div className="inline-flex items-center gap-1.5 bg-gray-50 text-gray-300 text-[10px] font-bold px-2 py-1 rounded uppercase italic border border-gray-100">
                                Alergias Negadas
                            </div>
                        )}
                    </div>

                    {/* SECCIÓN CRÓNICAS */}
                    <div>
                        {patient.chronicDiseases ? (
                            <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 text-blue-700 px-3 py-2.5 rounded-xl text-xs font-bold shadow-sm">
                                <Stethoscope size={16} className="shrink-0" />
                                <span className="leading-tight">CRÓNICAS: {patient.chronicDiseases.toUpperCase()}</span>
                            </div>
                        ) : (
                            <div className="inline-flex items-center gap-1.5 bg-gray-50 text-gray-300 text-[10px] font-bold px-2 py-1 rounded uppercase italic border border-gray-100">
                                Sin crónicas registradas
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {patient.notes && (
              <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-100 text-xs text-amber-800 leading-relaxed font-medium flex gap-2">
                <FileText size={16} className="shrink-0 opacity-40" />
                <span><b>Notas:</b> {patient.notes}</span>
              </div>
            )}
        </div>
      </div>

      {/* SECCIÓN 2: BOTONERA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4 border-t border-gray-100">
         <div className="flex items-center gap-2">
           <History className="text-gray-400" size={20} />
           <h2 className="text-xl font-bold text-gray-800 tracking-tight">Historial Médico</h2>
         </div>
         <div className="flex gap-3">
             <button onClick={handleNewLetterhead} className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 shadow-sm font-bold text-xs uppercase tracking-tighter flex items-center gap-2 transition-all">
               <FileText size={16} /> Membrete
             </button>
             <button onClick={handleNewRecipe} className="px-4 py-2 bg-emerald-600 text-white rounded-xl shadow-lg hover:bg-emerald-700 font-bold text-xs uppercase tracking-tighter flex items-center gap-2 transition-all">
               <Pill size={16} /> Receta Rápida
             </button>
             <button onClick={handleNewConsultation} style={{ backgroundColor: themeColor }} className="px-4 py-2 text-white rounded-xl shadow-lg hover:brightness-110 font-bold text-xs uppercase tracking-tighter flex items-center gap-2 transition-all">
               <Stethoscope size={16} /> Consulta
             </button>
         </div>
      </div>

      {/* SECCIÓN 2.5: FILTROS */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
            { id: 'all', label: 'Ver Todo', icon: null },
            { id: 'consulta', label: 'Consultas', icon: <Stethoscope size={14}/> },
            { id: 'receta', label: 'Recetas', icon: <Pill size={14}/> },
            { id: 'membrete', label: 'Documentos', icon: <FileText size={14}/> }
        ].map(opt => (
            <button
                key={opt.id}
                onClick={() => setFilter(opt.id as any)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border ${
                    filter === opt.id 
                    ? 'bg-gray-900 text-white shadow-md border-gray-900' 
                    : 'bg-white text-gray-400 hover:bg-gray-100 border-gray-100'
                }`}
            >
                {opt.icon}
                {opt.label}
            </button>
        ))}
      </div>

      {/* SECCIÓN 3: TIMELINE */}
      <div className="space-y-6">
          {filteredEvents.length === 0 ? (
            <div className="p-16 text-center text-gray-400 bg-white rounded-2xl border-2 border-dashed border-gray-100">
                <div className="flex flex-col items-center gap-3">
                  <Search size={40} className="opacity-10" />
                  <p className="font-bold text-xs uppercase tracking-widest">No hay registros con este filtro</p>
                </div>
            </div>
          ) : (
            filteredEvents.map((item) => {
                const isMembrete = item.type === 'membrete';
                const isReceta = item.type === 'receta';
                let accentColor = themeColor; 
                if (isMembrete) accentColor = '#94a3b8'; 
                if (isReceta) accentColor = '#10b981';

                return (
                <div key={item.id} className="group relative bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all hover:shadow-md">
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 transition-all group-hover:w-2" style={{ backgroundColor: accentColor }}></div>
                    <div className="p-6 pl-8">
                        {/* Cabecera */}
                        <div className="flex flex-col md:flex-row justify-between items-start mb-6 gap-4">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded ${
                                      isMembrete ? 'bg-slate-100 text-slate-500' : (isReceta ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600')
                                    }`}>
                                        {isMembrete ? 'DOCUMENTO' : (isReceta ? 'RECETA RÁPIDA' : 'CONSULTA MÉDICA')}
                                    </span>
                                    <span className="text-[11px] text-gray-400 font-bold uppercase tracking-tighter flex items-center gap-1.5">
                                        <Clock size={12} />
                                        {item.date?.toDate ? item.date.toDate().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour:'2-digit', minute:'2-digit' }) : 'Fecha pendiente'}
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-gray-800 tracking-tight italic font-serif">
                                    {isMembrete ? item.subject : (isReceta ? `Receta de Medicamentos${item.reason ? ` - ${item.reason}` : ''}` : item.reason)}
                                </h3>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => isMembrete ? handleEditLetterhead(item) : handleEditConsultation(item)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Editar"><Edit3 size={18} /></button>
                                <button onClick={() => handleDeleteEvent(item.id, item.type)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Eliminar"><Trash2 size={18} /></button>
                                {/* Botón Imprimir con efecto oscurecido */}
                                <button 
                                  onClick={() => isMembrete ? printLetterhead(item) : printRecipe(item)} 
                                  className="px-4 py-2 bg-gray-100 text-gray-500 hover:bg-gray-900 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-sm border border-transparent"
                                >
                                    <Printer size={16} /> Imprimir
                                </button>
                            </div>
                        </div>

                        {/* Contenido */}
                        <div className="space-y-4">
                            {isMembrete ? (
                              <div className="text-sm text-gray-600 italic bg-slate-50 p-5 rounded-2xl border border-slate-100 font-serif leading-relaxed line-clamp-3">
                                "{item.body?.substring(0, 200)}{item.body?.length > 200 ? '...' : ''}"
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                                  {!isReceta && (
                                    <div className="md:col-span-4 space-y-4 text-sm">
                                        <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-gray-400 bg-gray-50/50 p-3 rounded-xl border border-gray-100 uppercase tracking-tighter">
                                            <span>Peso: <b className="text-gray-700">{item.weight}kg</b></span>
                                            <span>Temp: <b className="text-gray-700">{item.temp}°C</b></span>
                                            <span>Talla: <b className="text-gray-700">{item.height}m</b></span>
                                            <span>T/A: <b className="text-gray-700">{item.pressure}</b></span>
                                        </div>
                                        {item.physicalExam && (
                                          <div>
                                            <p className="text-[10px] font-black text-gray-300 uppercase mb-1 tracking-widest">Exploración</p>
                                            <p className="text-xs text-gray-700 font-medium leading-relaxed bg-white/50 p-3 rounded-xl border border-gray-100">{item.physicalExam}</p>
                                          </div>
                                        )}
                                        <div>
                                          <p className="text-[10px] font-black text-gray-300 uppercase mb-1 tracking-widest">Diagnóstico</p>
                                          <p className="text-xs text-gray-800 font-bold italic">{item.diagnosis || 'Sin diagnóstico'}</p>
                                        </div>
                                    </div>
                                  )}
                                  <div className={isReceta ? 'md:col-span-12' : 'md:col-span-8'}>
                                      <p className="text-[10px] font-black text-emerald-600/50 uppercase mb-2 tracking-widest flex items-center gap-2"><Pill size={12}/> Receta / Plan</p>
                                      <div className="font-mono text-sm text-gray-700 bg-emerald-50/30 p-5 rounded-2xl border border-emerald-100/50 whitespace-pre-wrap leading-relaxed shadow-inner">
                                          {item.prescription}
                                      </div>
                                      {item.observations && <p className="mt-3 text-[11px] text-gray-400 italic font-medium px-2 border-l-2 border-gray-200">Obs: {item.observations}</p>}
                                  </div>
                              </div>
                            )}
                        </div>
                    </div>
                </div>
                )})
          )}
      </div>

      {/* Modales */}
      <ConsultationModal isOpen={isConsultModalOpen} onClose={() => setIsConsultModalOpen(false)} patientId={patient.id} patientName={patient.name} onSuccess={() => {}} consultationToEdit={consultationToEdit} initialType={modalType} />
      <LetterheadModal isOpen={isLetterheadModalOpen} onClose={() => setIsLetterheadModalOpen(false)} patientId={patient.id} patientName={patient.name} onSuccess={() => {}} letterheadToEdit={letterheadToEdit} />
      <PatientModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onSuccess={() => {}} patientToEdit={patient} />

      {/* Sección de Impresión */}
      <div className="hidden">
        {recipeData && (
            <PrescriptionPrint 
                ref={recipePrintRef} 
                clinicId={currentClinicId} 
                clinicName={clinicName} 
                doctorName={currentUser?.username} 
                themeColor={themeColor} 
                patientName={patient.name} 
                patientAge={ageString} 
                date={recipeData.date} 
                diagnosis={recipeData.diagnosis} 
                prescription={recipeData.prescription} 
                vitals={{ weight: recipeData.weight, pressure: recipeData.pressure, temp: recipeData.temp, height: recipeData.height }}
                formatting={recipeData.formatting} 
            />
        )}
        {letterheadData && (
            <LetterheadPrint 
                ref={letterheadPrintRef} 
                clinicId={currentClinicId} 
                patientName={patient.name} 
                date={letterheadData.date} 
                subject={letterheadData.subject} 
                body={letterheadData.body} 
            />
        )}
      </div>
    </div>
  );
};