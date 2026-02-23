// src/components/ConsultationModal.tsx
import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { 
  collection, 
  serverTimestamp, 
  doc, 
  updateDoc, 
  setDoc, 
  getDoc 
} from 'firebase/firestore'; 
import { useAuth } from '../context/AuthContext';
import { useClinic } from '../context/ClinicContext';
import { saveErrorLog } from '../firebase';
// Iconografía profesional para la interfaz médica
import { 
  Pill, 
  Stethoscope, 
  X, 
  AlertTriangle, 
  Type, 
  Bold, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  CheckCircle 
} from 'lucide-react';

interface ConsultationModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
  onSuccess: () => void;
  consultationToEdit?: any;
  initialType?: 'consulta' | 'receta'; 
}

export const ConsultationModal: React.FC<ConsultationModalProps> = ({ 
  isOpen, onClose, patientId, patientName, onSuccess, consultationToEdit, initialType = 'consulta' 
}) => {
  const { currentUser } = useAuth();
  const { themeColor, currentClinicId } = useClinic();
  
  const [showToast, setShowToast] = useState(false);
  const [imc, setImc] = useState<string>(''); 
  const [formType, setFormType] = useState<'consulta' | 'receta'>('consulta');
  
  // Estado para la gestión de seguridad del paciente (Alergias)
  const [patientAllergies, setPatientAllergies] = useState<string>('');

  const [formData, setFormData] = useState({
    weight: '', height: '', temp: '', pressure: '',
    reason: '', physicalExam: '', diagnosis: '', prescription: '', observations: ''
  });

  const [recipeStyle, setRecipeStyle] = useState({
    fontSize: 12,
    bold: false,
    align: 'left' as 'left' | 'center' | 'right'
  });

  // Carga de antecedentes alérgicos al abrir el expediente
  useEffect(() => {
    const fetchPatientData = async () => {
      if (!isOpen) {
        setPatientAllergies('');
        return;
      }

      if (patientId && currentUser) {
        try {
          const pRef = doc(db, "users", currentUser.uid, "patients", patientId);
          const pSnap = await getDoc(pRef);
          
          if (pSnap.exists()) {
            const allergies = pSnap.data().allergies || '';
            setPatientAllergies(allergies);
          }
        } catch (e) {
          console.error("Error cargando alergias:", e);
          const { saveErrorLog } = await import('../firebase');
          saveErrorLog(e, "fetchPatientData - ConsultationModal");
        }
      }
    };

    fetchPatientData();
  }, [isOpen, patientId, currentUser]);

  // Sincronización de datos en modo edición o creación
  useEffect(() => {
    if (isOpen) {
        if (consultationToEdit) {
            setFormType(consultationToEdit.type || 'consulta');
            setFormData({
                weight: consultationToEdit.weight || '',
                height: consultationToEdit.height || '',
                temp: consultationToEdit.temp || '',
                pressure: consultationToEdit.pressure || '',
                reason: consultationToEdit.reason || '',
                physicalExam: consultationToEdit.physicalExam || '',
                diagnosis: consultationToEdit.diagnosis || '',
                prescription: consultationToEdit.prescription || '',
                observations: consultationToEdit.observations || ''
            });
            
            if (consultationToEdit.formatting) {
                setRecipeStyle(consultationToEdit.formatting);
            } else {
                 setRecipeStyle({ fontSize: 12, bold: false, align: 'left' });
            }
        } else {
            setFormType(initialType);
            setFormData({ 
                weight: '', height: '', temp: '', pressure: '',
                reason: '', physicalExam: '', diagnosis: '', prescription: '', observations: ''
            });
            setRecipeStyle({ fontSize: 12, bold: false, align: 'left' });
            setImc('');
        }
    }
  }, [isOpen, consultationToEdit, initialType]);
  // Cálculo automático del Índice de Masa Corporal (IMC)
  useEffect(() => {
    const w = parseFloat(formData.weight);
    const h = parseFloat(formData.height);
    if (w > 0 && h > 0) {
        setImc((w / (h * h)).toFixed(2));
    } else {
        setImc('');
    }
  }, [formData.weight, formData.height]);

  /* Manejo del envío del formulario.
  Gestiona la creación de nuevos registros o la actualización de existentes.
  */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !patientId) return;

    try {
      const dataToSave = { ...formData, imc, type: formType, formatting: recipeStyle };

      if (consultationToEdit) {
        const consultRef = doc(db, "users", currentUser.uid, "patients", patientId, "consultations", consultationToEdit.id);
        updateDoc(consultRef, dataToSave);
      } else {
        const consultsRef = collection(db, "users", currentUser.uid, "patients", patientId, "consultations");
        const newDocRef = doc(consultsRef);
        setDoc(newDocRef, { ...dataToSave, clinicId: currentClinicId, date: serverTimestamp() });
      }

      setShowToast(true);
      onSuccess();
      setTimeout(() => { onClose(); setShowToast(false); }, 200);

    } catch (error) {
      console.error("Error:", error);
      saveErrorLog(error, "handleSubmit - ConsultationModal");
      alert("Error al guardar localmente.");
    }
  };

  if (!isOpen) return null;

  const isRecetaMode = formType === 'receta';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto relative">
        
        {/* ENCABEZADO DINÁMICO */}
        <div className={`p-4 border-b border-gray-100 flex justify-between items-center sticky top-0 z-10 ${isRecetaMode ? 'bg-green-50' : 'bg-gray-50'}`}>
          <div className="flex items-center gap-3">
            <div className={isRecetaMode ? 'text-green-600' : 'text-blue-600'}>
              {isRecetaMode ? <Pill size={24} /> : <Stethoscope size={24} />}
            </div>
            <div>
              <h2 className={`font-bold text-lg ${isRecetaMode ? 'text-green-800' : 'text-gray-800'}`}>
                  {consultationToEdit ? 'Editar Registro' : (isRecetaMode ? 'Nueva Receta Rápida' : 'Nueva Consulta Médica')}
              </h2>
              <p className="text-xs text-gray-500">Paciente: <span className="font-bold text-gray-700">{patientName}</span></p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* ALERTA DE ALERGIAS CON FILTRADO DE RESPUESTAS NEGATIVAS */}
        {patientAllergies && 
          !['negado', 'negada', 'ninguna', 'no', 'sin alergias', 'negativas', 'n/a', '-'].includes(patientAllergies.toLowerCase().trim()) && (
          <div className="mx-6 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3 shadow-sm">
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="text-amber-600" size={20} />
            </div>
            <div>
              <p className="text-amber-800 font-bold text-xs uppercase tracking-wide">Información Médica</p>
              <p className="text-amber-700 text-sm italic">
                El paciente presenta alergia a: <span className="font-bold not-italic">{patientAllergies}</span>
              </p>
            </div>
          </div>
        )}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
            
            {/* PANEL DE SIGNOS VITALES (Modo Consulta) */}
            {!isRecetaMode && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 items-end">
                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Peso (kg)</label>
                            <input type="number" step="0.1" className="input-std" value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Talla (mts)</label>
                            <input type="number" step="0.01" className="input-std" value={formData.height} onChange={e => setFormData({...formData, height: e.target.value})} />
                        </div>
                        <div className="bg-white/70 border border-blue-200 rounded p-1.5 flex flex-col items-center justify-center h-[38px] mt-1">
                             <span className="text-[9px] text-blue-400 font-bold uppercase leading-none">IMC</span>
                             <span className={`font-bold text-sm ${imc ? 'text-blue-700' : 'text-gray-300'}`}>{imc || '--'}</span>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Temp (°C)</label>
                            <input type="number" step="0.1" className="input-std" value={formData.temp} onChange={e => setFormData({...formData, temp: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">T/A</label>
                            <input type="text" className="input-std" value={formData.pressure} onChange={e => setFormData({...formData, pressure: e.target.value})} />
                        </div>
                    </div>
                </div>
            )}

            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                    {isRecetaMode ? 'Motivo (Opcional)' : 'Motivo de Consulta'}
                </label>
                <input type="text" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:outline-none transition-all"
                    value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} />
            </div>

            {!isRecetaMode && (
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Exploración Física</label>
                    <textarea rows={3} className="textarea-std" placeholder="Hallazgos del examen físico..."
                        value={formData.physicalExam} onChange={e => setFormData({...formData, physicalExam: e.target.value})} />
                </div>
            )}

            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Diagnóstico</label>
                <textarea rows={2} className="textarea-std" placeholder="Impresión diagnóstica..."
                    value={formData.diagnosis} onChange={e => setFormData({...formData, diagnosis: e.target.value})} />
            </div>

            {/* SECCIÓN DE TRATAMIENTO Y HERRAMIENTAS DE FORMATO */}
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                    {isRecetaMode ? 'Medicamentos e Indicaciones' : 'Tratamiento / Receta'}
                </label>
                
                <div className="flex items-center gap-2 mb-2 bg-gray-50 p-2 rounded-t-lg border border-gray-200 border-b-0">
                    <span className="text-[10px] font-bold text-gray-400 mr-2 uppercase">Formato:</span>
                    <button type="button" onClick={() => setRecipeStyle(s => ({...s, fontSize: Math.max(8, s.fontSize - 1)}))} className="w-8 h-8 flex items-center justify-center bg-white border rounded hover:bg-gray-100 text-xs">
                        <Type size={12} className="opacity-70" />-
                    </button>
                    <span className="text-xs font-mono w-6 text-center">{recipeStyle.fontSize}</span>
                    <button type="button" onClick={() => setRecipeStyle(s => ({...s, fontSize: Math.min(24, s.fontSize + 1)}))} className="w-8 h-8 flex items-center justify-center bg-white border rounded hover:bg-gray-100 text-xs">
                        <Type size={14} />+
                    </button>
                    
                    <div className="w-px h-6 bg-gray-300 mx-1"></div>
                    
                    <button type="button" onClick={() => setRecipeStyle(s => ({...s, bold: !s.bold}))} 
                        className={`w-8 h-8 flex items-center justify-center border rounded text-sm transition-colors ${recipeStyle.bold ? 'bg-gray-800 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>
                        <Bold size={14} />
                    </button>
                    
                    <div className="w-px h-6 bg-gray-300 mx-1"></div>
                    
                    <button type="button" onClick={() => setRecipeStyle(s => ({...s, align: 'left'}))} className={`w-8 h-8 flex items-center justify-center border rounded transition-colors ${recipeStyle.align === 'left' ? 'bg-blue-100 border-blue-300 text-blue-600' : 'bg-white text-gray-400 hover:bg-gray-100'}`}>
                        <AlignLeft size={14} />
                    </button>
                    <button type="button" onClick={() => setRecipeStyle(s => ({...s, align: 'center'}))} className={`w-8 h-8 flex items-center justify-center border rounded transition-colors ${recipeStyle.align === 'center' ? 'bg-blue-100 border-blue-300 text-blue-600' : 'bg-white text-gray-400 hover:bg-gray-100'}`}>
                        <AlignCenter size={14} />
                    </button>
                    <button type="button" onClick={() => setRecipeStyle(s => ({...s, align: 'right'}))} className={`w-8 h-8 flex items-center justify-center border rounded transition-colors ${recipeStyle.align === 'right' ? 'bg-blue-100 border-blue-300 text-blue-600' : 'bg-white text-gray-400 hover:bg-gray-100'}`}>
                        <AlignRight size={14} />
                    </button>
                </div>

                <textarea 
                    required={formType === 'receta'}
                    rows={8} 
                    className="w-full px-3 py-2 border rounded-b-lg focus:ring-2 focus:outline-none transition-all"
                    style={{ 
                        fontSize: `${recipeStyle.fontSize}px`,
                        fontWeight: recipeStyle.bold ? 'bold' : 'normal',
                        textAlign: recipeStyle.align,
                        fontFamily: 'monospace',
                        backgroundColor: isRecetaMode ? '#f0fdf4' : 'white',
                        borderColor: isRecetaMode ? '#bbf7d0' : '#e5e7eb'
                    } as any}
                    placeholder="Escriba el tratamiento aquí..."
                    value={formData.prescription} 
                    onChange={e => setFormData({...formData, prescription: e.target.value})} 
                />
            </div>

            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Observaciones</label>
                <textarea rows={2} className="textarea-std" placeholder="Notas internas..."
                    value={formData.observations} onChange={e => setFormData({...formData, observations: e.target.value})} />
            </div>

            <div className="pt-2 flex gap-3 justify-end border-t border-gray-100 mt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium">
                    Cancelar
                </button>
                <button 
                  type="submit" 
                  style={{ backgroundColor: isRecetaMode ? '#10b981' : themeColor }} 
                  className="px-6 py-2 text-white rounded-lg font-bold shadow-md hover:opacity-90 transition-all flex items-center gap-2"
                >
                    {consultationToEdit ? 'Actualizar Registro' : (isRecetaMode ? 'Crear Receta' : 'Finalizar Consulta')}
                </button>
            </div>
        </form>

        {showToast && (
          <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 z-[60] animate-in fade-in slide-in-from-bottom-4 duration-300">
            <CheckCircle className="text-green-400" size={18} />
            <span className="text-sm font-bold text-white">Guardado localmente. Sincronizando...</span>
          </div>
        )}
        
        <style>{`
            .input-std { width: 100%; border: 1px solid #e5e7eb; border-radius: 0.5rem; padding: 0.5rem; margin-top: 0.25rem; font-size: 0.875rem; outline: none; transition: all 0.2s; }
            .input-std:focus { border-color: ${themeColor}; box-shadow: 0 0 0 2px ${themeColor}20; }
            .textarea-std { width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #e5e7eb; border-radius: 0.5rem; outline: none; resize: none; transition: all 0.2s; font-size: 0.875rem; }
            .textarea-std:focus { border-color: ${themeColor}; box-shadow: 0 0 0 2px ${themeColor}20; }
        `}</style>
      </div>
    </div>
  );
};