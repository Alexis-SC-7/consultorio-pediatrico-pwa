// src/components/PatientModal.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase';
import { collection, doc, updateDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useClinic } from '../context/ClinicContext';
import { useNavigate } from 'react-router-dom';
import { saveErrorLog } from '../firebase';
// Iconografía para validaciones y estructura de formulario
import { 
  UserCircle, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

interface PatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newPatientId?: string) => void;
  patientToEdit?: any;
  existingPatients?: any[]; 
}

/* Gestión de expedientes clínicos.
Implementa detección de duplicados en tiempo real y persistencia optimista para garantizar 
la operatividad en entornos de baja conectividad.
*/
export const PatientModal: React.FC<PatientModalProps> = ({ 
  isOpen, onClose, onSuccess, patientToEdit, existingPatients = [] 
}) => {
  const { currentUser } = useAuth();
  const { themeColor, currentClinicId } = useClinic();
  const navigate = useNavigate();
  const [showToast, setShowToast] = useState(false);

  // Parámetros de validación para el ciclo de vida del paciente
  const today = new Date().toISOString().split('T')[0];
  const minDate = `${new Date().getFullYear() - 120}-01-01`;

  const [formData, setFormData] = useState({
    name: '', birthDate: '', phone: '', sex: 'Hombre', bloodType: '',
    curp: '', allergies: '', chronicDiseases: '', tutor: '', notes: ''
  });

  const normalizeText = (text: string) => {
    return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  };

  /* Hook de detección de duplicados.
  Optimiza la búsqueda mediante useMemo para evitar colisiones de registros.
  */
  const duplicateFound = useMemo(() => {
    if (patientToEdit || formData.name.length < 3) return null;
    const searchName = normalizeText(formData.name);
    return existingPatients.find(p => normalizeText(p.name).includes(searchName));
  }, [formData.name, existingPatients, patientToEdit]);

  useEffect(() => {
    if (isOpen) {
      if (patientToEdit) {
        setFormData({
          name: patientToEdit.name || '',
          birthDate: patientToEdit.birthDate || '',
          phone: patientToEdit.phone || '',
          sex: patientToEdit.sex || 'Hombre',
          bloodType: patientToEdit.bloodType || '',
          curp: patientToEdit.curp || '',
          allergies: patientToEdit.allergies || '',
          chronicDiseases: patientToEdit.chronicDiseases || '',
          tutor: patientToEdit.tutor || '',
          notes: patientToEdit.notes || ''
        });
      } else {
        setFormData({
          name: '', birthDate: '', phone: '', sex: 'Hombre', bloodType: '',
          curp: '', allergies: '', chronicDiseases: '', tutor: '', notes: ''
        });
      }
    }
  }, [isOpen, patientToEdit]);

  if (!isOpen) return null;

  /* Procesa la persistencia del expediente.
  Utiliza una estrategia de escritura asíncrona para mejorar la percepción de velocidad.
  */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const selectedDate = new Date(formData.birthDate);
    const dateLimit = new Date(today);
    const dateMinLimit = new Date(minDate);

    if (selectedDate > dateLimit || selectedDate < dateMinLimit) {
      alert("Revisa la fecha de nacimiento.");
      return;
    }

    try {
      let finalDocId = '';

      if (patientToEdit) {
        const patientRef = doc(db, "users", currentUser.uid, "patients", patientToEdit.id);
        updateDoc(patientRef, { 
            ...formData,
            nameLowerCase: formData.name.toLowerCase() 
        });
        finalDocId = patientToEdit.id;
      } else {
        const patientsRef = collection(db, "users", currentUser.uid, "patients");
        const newDocRef = doc(patientsRef); 
        finalDocId = newDocRef.id;
        
        setDoc(newDocRef, {
            ...formData,
            nameLowerCase: formData.name.toLowerCase(),
            clinicId: currentClinicId,
            createdAt: serverTimestamp(),
        });
      }
      
      onSuccess(finalDocId);
      setShowToast(true);
      
      setTimeout(() => {
        onClose();
        setShowToast(false);
      }, 200);
      
    } catch (error) {
      saveErrorLog(error, "handleSubmit - PatientModal"); 
      alert("Ocurrió un error al procesar los datos localmente.");
    }
  };
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative border border-gray-100">
        
        {/* Cabecera del Expediente */}
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <UserCircle size={22} style={{ color: themeColor }} />
            <h2 className="font-bold text-gray-800 text-lg">
              {patientToEdit ? 'Editar Expediente' : 'Nuevo Expediente'}
            </h2>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
            
            {/* Detección Proactiva de Duplicados */}
            {duplicateFound && (
              <div className="bg-amber-50 border-2 border-amber-200 p-4 rounded-xl flex items-center justify-between animate-in fade-in zoom-in duration-300 shadow-sm">
                <div className="flex items-center gap-3">
                  <AlertCircle className="text-amber-600" size={28} />
                  <div>
                    <p className="text-amber-800 font-bold text-sm">Registro similar detectado</p>
                    <p className="text-amber-700 text-xs">
                        Nombre: <b>{duplicateFound.name}</b> (Nacimiento: {duplicateFound.birthDate})
                    </p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate(`/pacientes/${duplicateFound.id}`);
                  }}
                  className="bg-amber-600 text-white px-3 py-2 rounded-lg text-xs font-bold hover:bg-amber-700 transition-all flex items-center gap-1.5 shadow-md"
                >
                  <ExternalLink size={14} />
                  Ver Registro
                </button>
              </div>
            )}

            {/* Sección de Datos Críticos */}
            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 mb-2">
                <div className="flex items-center gap-2 mb-3">
                  <ShieldCheck size={14} className="text-blue-600" />
                  <p className="text-xs text-blue-600 font-bold uppercase tracking-wider">Información Obligatoria</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="block text-sm font-bold text-gray-700">Nombre Completo *</label>
                        <input required type="text" className="input-std" placeholder="Apellidos y Nombres"
                            value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                        <label className="block text-sm font-bold text-gray-700">Fecha de Nacimiento *</label>
                        <input 
                            required 
                            type="date" 
                            className="input-std"
                            max={today} 
                            min={minDate} 
                            value={formData.birthDate} 
                            onChange={e => {
                              e.target.setCustomValidity(""); 
                              setFormData({...formData, birthDate: e.target.value});
                            }}
                           onInvalid={e => (e.target as HTMLInputElement).setCustomValidity("Fecha de nacimiento inválida")}
                        />
                    </div>
                </div>
            </div>

            {/* Ficha de Identificación General */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="block text-sm font-bold text-gray-700">Teléfono de Contacto</label>
                    <input type="tel" className="input-std" placeholder="10 dígitos"
                        value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
                <div className="space-y-1">
                    <label className="block text-sm font-bold text-gray-700">Sexo</label>
                    <select className="input-std" value={formData.sex} onChange={e => setFormData({...formData, sex: e.target.value})}>
                        <option value="Hombre">Hombre</option>
                        <option value="Mujer">Mujer</option>
                    </select>
                </div>
                <div className="space-y-1">
                    <label className="block text-sm font-bold text-gray-700">Grupo Sanguíneo</label>
                    <select className="input-std" value={formData.bloodType} onChange={e => setFormData({...formData, bloodType: e.target.value})}>
                        <option value="">-- No especificado --</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                    </select>
                </div>
                <div className="space-y-1">
                    <label className="block text-sm font-bold text-gray-700">CURP</label>
                    <input 
                        type="text" 
                        className="input-std uppercase font-mono text-xs" 
                        placeholder="18 caracteres"
                        value={formData.curp} 
                        minLength={18}
                        maxLength={18} 
                        onChange={e => {
                            e.target.setCustomValidity(""); 
                            setFormData({...formData, curp: e.target.value.toUpperCase()});
                        }}
                        onInvalid={e => (e.target as HTMLInputElement).setCustomValidity("El CURP debe contener 18 caracteres")}
                    />
                </div>
            </div>

            {/* Antecedentes Clínicos y Notas */}
            <div className="border-t border-gray-100 pt-4 space-y-4">
                 <div className="space-y-1">
                    <label className="block text-sm font-bold text-gray-700">Alergias</label>
                    <textarea rows={2} className="input-std resize-none" placeholder="Medicamentos, alimentos, etc."
                        value={formData.allergies} onChange={e => setFormData({...formData, allergies: e.target.value})} />
                </div>
                <div className="space-y-1">
                    <label className="block text-sm font-bold text-gray-700">Enfermedades Crónicas</label>
                    <textarea rows={2} className="input-std resize-none" placeholder="Padecimientos preexistentes..."
                        value={formData.chronicDiseases} onChange={e => setFormData({...formData, chronicDiseases: e.target.value})} />
                </div>
                <div className="space-y-1">
                    <label className="block text-sm font-bold text-gray-700">Tutor / Responsable Legal</label>
                    <input type="text" className="input-std" placeholder="Nombre completo del tutor"
                        value={formData.tutor} onChange={e => setFormData({...formData, tutor: e.target.value})} />
                </div>
                 <div className="space-y-1">
                    <label className="block text-sm font-bold text-gray-700">Notas Adicionales</label>
                    <textarea rows={2} className="input-std resize-none" placeholder="Observaciones generales..."
                        value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
                </div>
            </div>

            {/* Botonera de Acciones */}
            <div className="pt-2 flex gap-3 justify-end border-t border-gray-100 mt-4">
                <button 
                  type="button" 
                  onClick={onClose} 
                  className="px-5 py-2.5 text-gray-500 hover:bg-gray-100 rounded-xl font-bold text-sm transition-all"
                >
                    Cancelar
                </button>
                <button 
                  type="submit" 
                  style={{ backgroundColor: themeColor }} 
                  className="px-8 py-2.5 text-white rounded-xl font-bold shadow-lg hover:brightness-110 active:scale-95 transition-all text-sm"
                >
                   {patientToEdit ? 'Actualizar Datos' : 'Registrar Paciente'}
                </button>
            </div>
        </form>

        {/* Notificación de Sincronización */}
        {showToast && (
          <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 z-[60] animate-in fade-in slide-in-from-bottom-4 duration-300">
            <CheckCircle2 className="text-green-400" size={18} />
            <span className="text-sm font-bold tracking-tight text-white">Cambios guardados localmente.</span>
          </div>
        )}
        
        <style>{`
            .input-std { width: 100%; border: 1px solid #e5e7eb; border-radius: 0.75rem; padding: 0.6rem 0.8rem; font-size: 0.875rem; outline: none; transition: all 0.2s; background-color: #ffffff; }
            .input-std:focus { border-color: ${themeColor}; box-shadow: 0 0 0 4px ${themeColor}15; }
        `}</style>
      </div>
    </div>
  );
};