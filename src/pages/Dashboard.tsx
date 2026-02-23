// src/pages/Dashboard.tsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useClinic } from '../context/ClinicContext';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore'; 
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { PatientModal } from '../components/PatientModal';

// Iconografía profesional
import { 
  Users, 
  UserPlus, 
  Calendar, 
  ArrowRight,
  Clock 
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { currentUser } = useAuth();
  
  /* Inyectamos 'doctorName' desde el contexto clínico.
    Esto nos permite anonimizar el código fuente para el portafolio,
    delegando la identidad a los datos almacenados en Firestore.
    */
  const { clinicName, themeColor, currentClinicId, doctorName } = useClinic();
  const navigate = useNavigate();

  // Estados para métricas y listados dinámicos
  const [stats, setStats] = useState({ patients: 0, consultations: 0 });
  const [allPatients, setAllPatients] = useState<any[]>([]); 
  const [recentPatients, setRecentPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);

  /* Determina el saludo basándose en la hora local del dispositivo. */
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Buenos días";
    if (hour >= 12 && hour < 19) return "Buenas tardes";
    return "Buenas noches";
  };

  const greeting = getGreeting();

  /* Suscripción en tiempo real a la colección de pacientes.
  Escucha cambios en Firestore y filtra por la clínica activa.
    */
  useEffect(() => {
    if (!currentUser) return;

    setLoading(true);
    
    // Referencia a la colección personal del doctor
    const patientsRef = collection(db, "users", currentUser.uid, "patients");
    // Ordenamos por fecha de creación para mostrar lo más nuevo primero
    const q = query(patientsRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      // Mapeo de documentos con tipado flexible para evitar errores de compilación
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      
      setAllPatients(docs); 

      // Filtrado por contexto de clínica actual
      const clinicDocs = docs.filter(p => p.clinicId === currentClinicId);
      
      // Limitamos a los 5 más recientes para la vista rápida
      setRecentPatients(clinicDocs.slice(0, 5));
      setStats({
        patients: clinicDocs.length,
        consultations: 0 
      });
      
      setLoading(false);
    });

    // Limpieza de la suscripción al desmontar el componente
    return () => unsubscribe();
  }, [currentUser, currentClinicId]);

  const handlePatientCreated = (newPatientId?: string) => {
    if (newPatientId) {
        // Navegación automática al expediente del paciente recién creado
        navigate(`/pacientes/${newPatientId}`);
    } else {
        setIsPatientModalOpen(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Sección de Bienvenida y Contexto Clínico */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800 tracking-tight">
             {/* Sustitución de nombre estático por propiedad del contexto.
                 Ahora el saludo es 100% personalizado según el perfil del usuario.
             */}
             {greeting}, {doctorName}
        </h1>
        <p className="text-gray-500 mt-1 flex items-center gap-2">
            Resumen operativo de <span className="font-bold" style={{ color: themeColor }}>{clinicName}</span>
        </p>
      </div>

      {/* Tarjetas de Indicadores Clave */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Métrica de Pacientes */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 transition-all hover:shadow-md">
            <div className="p-4 rounded-xl bg-blue-50 text-blue-600">
                <Users size={24} />
            </div>
            <div>
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Pacientes registrados</p>
                <h3 className="text-3xl font-bold text-gray-800">{loading ? '...' : stats.patients}</h3>
            </div>
        </div>

        {/* Acceso Directo: Alta de Paciente */}
        <div 
            onClick={() => setIsPatientModalOpen(true)}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 cursor-pointer hover:shadow-md transition-all group"
        >
            <div className="p-4 rounded-xl bg-green-50 text-green-600 group-hover:bg-green-600 group-hover:text-white transition-all">
                <UserPlus size={24} />
            </div>
            <div>
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Acción Rápida</p>
                <h3 className="text-lg font-bold text-gray-800 group-hover:text-green-700">Nuevo Paciente</h3>
            </div>
        </div>

        {/* Widget de Fecha Actual */}
         <div className="bg-slate-800 p-6 rounded-2xl shadow-lg text-white flex items-center gap-4 border border-slate-700">
            <div className="p-4 rounded-xl bg-white/10 text-white">
                <Calendar size={24} />
            </div>
            <div>
                <p className="text-white/50 text-[10px] font-bold uppercase tracking-wider">Hoy es</p>
                <h3 className="text-lg font-bold capitalize">
                    {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
                </h3>
            </div>
        </div>
      </div>

      {/* Panel de Actividad Reciente */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-gray-400" />
              <h2 className="font-bold text-gray-800 text-lg">Últimos Registros</h2>
            </div>
            <button 
                onClick={() => navigate('/pacientes')}
                className="text-sm font-bold flex items-center gap-1 hover:opacity-80 transition-opacity"
                style={{ color: themeColor }}
            >
                Ver todos <ArrowRight size={16} />
            </button>
        </div>
        
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-gray-50/50 text-gray-400 text-[10px] uppercase font-bold tracking-widest">
                    <tr>
                        <th className="px-6 py-4">Nombre del Paciente</th>
                        <th className="px-6 py-4">Fecha de Registro</th>
                        <th className="px-6 py-4 text-right">Acción</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {loading ? (
                        <tr>
                          <td colSpan={3} className="p-10 text-center text-gray-400 font-medium italic">
                            Sincronizando registros...
                          </td>
                        </tr>
                    ) : recentPatients.length === 0 ? (
                        <tr><td colSpan={3} className="p-10 text-center text-gray-400 font-medium">No hay actividad reciente en esta clínica.</td></tr>
                    ) : (
                        recentPatients.map((p) => (
                            <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4 font-bold text-gray-700">{p.name}</td>
                                <td className="px-6 py-4 text-gray-500 text-sm">
                                    {p.createdAt?.toDate ? p.createdAt.toDate().toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : '---'}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button 
                                        onClick={() => navigate(`/pacientes/${p.id}`)}
                                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-800 hover:text-white font-bold text-xs transition-all"
                                    >
                                        Ver Perfil
                                        <ArrowRight size={14} />
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
      </div>

      {/* Inyección del Modal para creación optimista de pacientes */}
      <PatientModal 
        isOpen={isPatientModalOpen}
        onClose={() => setIsPatientModalOpen(false)}
        onSuccess={handlePatientCreated}
        existingPatients={allPatients} 
      />

    </div>
  );
};