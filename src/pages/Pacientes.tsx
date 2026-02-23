// src/pages/Pacientes.tsx
import React, { useState, useEffect } from 'react';
import { useClinic } from '../context/ClinicContext';
import { useAuth } from '../context/AuthContext';
import { PatientModal } from '../components/PatientModal';
import { ReportModal } from '../components/ReportModal';
import { useNavigate } from 'react-router-dom';
import { 
  collection, query, orderBy, limit, startAfter, 
  getDocs, onSnapshot, QueryDocumentSnapshot, doc, deleteDoc 
} from 'firebase/firestore';
import { db, saveErrorLog } from '../firebase';
// Iconografía para gestión de listados y búsqueda
import { 
  UserPlus, 
  FileDown, 
  Search, 
  Trash2, 
  ChevronRight, 
  Users 
} from 'lucide-react';

/* Vista de administración del censo de pacientes.
Implementa una estrategia de carga híbrida: tiempo real para listas cortas
y paginación bajo demanda para grandes volúmenes de datos.
*/
export const Pacientes: React.FC = () => {
  const { themeColor, clinicName, currentClinicId } = useClinic(); 
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const PAGE_SIZE = 20;

  /* Calcula la edad biológica basándose en la fecha de nacimiento. */
  const calculateAge = (birthDateString: string) => {
    if (!birthDateString) return '-';
    const today = new Date();
    const birthDate = new Date(birthDateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  /* Gestiona la eliminación lógica y física del expediente */
  const handleDelete = async (patientId: string, patientName: string) => {
    if (!currentUser) return;
    if (window.confirm(`¿Estás seguro de eliminar a ${patientName}? Esta acción es irreversible.`)) {
        try {
            await deleteDoc(doc(db, "users", currentUser.uid, "patients", patientId));
        } catch (error) {
            console.error("Error al eliminar registro:", error);
            saveErrorLog(error, "handleDelete - Pacientes");
        }
    }
  };

  /* Sincronización con Firestore.
  Alterna entre modo búsqueda global o listado por sede. */
  useEffect(() => {
    if (!currentUser) return;

    setLoading(true);
    const patientsRef = collection(db, "users", currentUser.uid, "patients");
    let q;

    if (searchTerm.length > 0) {
      // Búsqueda global (limitada a 500 para evitar saturación de memoria)
      q = query(patientsRef, orderBy("createdAt", "desc"), limit(500));
    } else {
      // Listado paginado estándar
      q = query(patientsRef, orderBy("createdAt", "desc"), limit(PAGE_SIZE));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPatients(docs);
      
      if (searchTerm.length === 0) {
        setLastVisible(snapshot.docs[snapshot.docs.length - 1] || null);
        setHasMore(snapshot.docs.length === PAGE_SIZE);
      } else {
        setHasMore(false);
      }
      setLoading(false);
    }, (error) => {
      saveErrorLog(error, "onSnapshot - Pacientes");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser, searchTerm, PAGE_SIZE]);

  const fetchMorePatients = async () => {
    if (!currentUser || !lastVisible || loadingMore) return;

    setLoadingMore(true);
    const patientsRef = collection(db, "users", currentUser.uid, "patients");
    const q = query(
      patientsRef, 
      orderBy("createdAt", "desc"), 
      startAfter(lastVisible), 
      limit(PAGE_SIZE)
    );

    try {
      const snapshot = await getDocs(q);
      const newDocs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      setPatients(prev => [...prev, ...newDocs]);
      setLastVisible(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === PAGE_SIZE);
    } catch (error) {
      saveErrorLog(error, "fetchMorePatients - Pacientes");
    } finally {
      setLoadingMore(false);
    }
  };

  const normalizeText = (text: string) => {
    return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  };

  /* Motor de filtrado inteligente.
  Decide si mostrar datos globales o filtrados por clínica según la búsqueda. */
  const filteredPatients = patients.filter(patient => {
    const matchesSearch = normalizeText(patient.name || '').includes(normalizeText(searchTerm));
    const belongsToClinic = patient.clinicId === currentClinicId;

    return searchTerm.length > 0 ? matchesSearch : belongsToClinic;
  });

  const handleSuccess = (newPatientId?: string) => {
    if (newPatientId) {
        navigate(`/pacientes/${newPatientId}`);
    }
  };
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Encabezado y Acciones Globales */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="text-gray-400" size={24} />
            <h1 className="text-2xl font-bold text-gray-800">Pacientes</h1>
          </div>
          <p className="text-gray-500 text-sm mt-1">
              {searchTerm ? 'Resultados de búsqueda global...' : `Listado oficial de ${clinicName}`}
          </p>
        </div>
        
        <div className="flex gap-2">
            <button
                onClick={() => setIsReportOpen(true)}
                className="px-4 py-2 bg-white text-gray-700 border border-gray-200 rounded-xl shadow-sm hover:bg-gray-50 transition-all flex items-center gap-2 font-bold text-xs uppercase tracking-tight"
            >
                <FileDown size={16} />
                Reporte PDF
            </button>

            <button
                onClick={() => setIsModalOpen(true)}
                style={{ backgroundColor: themeColor }}
                className="px-5 py-2 text-white rounded-xl shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 font-bold text-sm"
            >
                <UserPlus size={18} />
                Nuevo Paciente
            </button>
        </div>
      </div>

      {/* Contenedor de Tabla y Buscador */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Barra de Búsqueda Estilizada */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/30 flex items-center gap-3">
            <div className="relative flex-1 md:max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                    type="text" 
                    placeholder={patients.length > 0 ? "Buscar en todas las sedes..." : "Escribe el nombre del paciente..."}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-opacity-10 transition-all text-sm bg-white"
                    style={{ '--tw-ring-color': themeColor } as any}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>

        {loading ? (
            <div className="p-12 text-center text-gray-400 font-medium animate-pulse">
                Sincronizando censo de pacientes...
            </div>
        ) : (
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50/80 text-gray-400 font-bold text-[10px] uppercase tracking-widest">
                        <tr>
                            <th className="px-6 py-4">Información del Paciente</th>
                            <th className="px-6 py-4">Edad</th>
                            <th className="px-6 py-4">Contacto</th>
                            <th className="px-6 py-4 text-right">Gestión</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredPatients.length > 0 ? (
                            filteredPatients.map((patient) => (
                                <tr key={patient.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-700">{patient.name}</div>
                                        <div className="text-[10px] text-gray-400 font-bold mt-1 flex items-center gap-1.5 uppercase tracking-tighter">
                                            {patient.sex} {patient.bloodType ? `• ${patient.bloodType}` : ''}
                                            {searchTerm && patient.clinicId !== currentClinicId && (
                                                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 border border-slate-200">
                                                    Sede Externa
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500 font-medium text-sm">
                                        {patient.birthDate 
                                        ? `${calculateAge(patient.birthDate)} años` 
                                        : (patient.age ? `${patient.age} años` : '-')}
                                    </td>
                                    <td className="px-6 py-4 text-gray-500 font-medium text-sm">
                                        {patient.phone || '---'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-3">
                                            {/* BOTÓN ESTILO OSCURECIDO */}
                                            <button 
                                                onClick={() => navigate(`/pacientes/${patient.id}`)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-900 hover:text-white font-bold text-xs transition-all shadow-sm"
                                            >
                                                Ver Historial
                                                <ChevronRight size={14} />
                                            </button>

                                            <button 
                                                onClick={() => handleDelete(patient.id, patient.name)}
                                                className="text-gray-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-all"
                                                title="Eliminar Registro"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={4} className="p-16 text-center text-gray-400">
                                    <div className="flex flex-col items-center gap-2">
                                        <Search size={32} className="opacity-20" />
                                        <p className="font-medium">
                                            {searchTerm 
                                             ? 'No hay coincidencias para esta búsqueda.' 
                                             : 'Aún no hay pacientes registrados en esta clínica.'}
                                        </p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {/* BOTÓN DE PAGINACIÓN ESTILIZADO */}
                {!searchTerm && hasMore && (
                    <div className="p-6 border-t border-gray-100 bg-gray-50/30 flex justify-center">
                        <button 
                            onClick={fetchMorePatients}
                            disabled={loadingMore}
                            className="px-8 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-900 hover:text-white transition-all shadow-sm disabled:opacity-50 active:scale-95"
                        >
                            {loadingMore ? 'Sincronizando...' : 'Cargar registros anteriores'}
                        </button>
                    </div>
                )}
            </div>
        )}
      </div>

      {/* Modales de Interacción */}
      <PatientModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSuccess} 
        existingPatients={patients} 
      />

      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        patients={filteredPatients} 
      />
    </div>
  );
};