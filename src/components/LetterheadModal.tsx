// src/components/LetterheadModal.tsx
import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore'; 
import { useAuth } from '../context/AuthContext';
import { useClinic } from '../context/ClinicContext';
// Iconografía para gestión de documentos y acciones de guardado
import { FileText, X, Save, Loader2 } from 'lucide-react';

interface LetterheadModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
  onSuccess: () => void;
  letterheadToEdit?: any; 
}

/* Componente para la generación de documentos membretados y constancias.
Permite la edición dinámica de plantillas y su almacenamiento en el historial del paciente.
*/
export const LetterheadModal: React.FC<LetterheadModalProps> = ({ 
  isOpen, onClose, patientId, patientName, onSuccess, letterheadToEdit 
}) => {
  const { currentUser } = useAuth();
  const { themeColor, currentClinicId } = useClinic();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    subject: 'Constancia Médica',
    body: '' 
  });

  // Gestión de carga de datos iniciales o reset de formulario
  useEffect(() => {
    if (isOpen) {
        if (letterheadToEdit) {
            setFormData({
                subject: letterheadToEdit.subject || '',
                body: letterheadToEdit.body || ''
            });
        } else {
            setFormData({
                subject: 'Constancia Médica',
                body: `A quien corresponda:\n\nPor medio de la presente hago constar que el paciente ${patientName} ...`
            });
        }
    }
  }, [isOpen, letterheadToEdit, patientName]);

  if (!isOpen) return null;

  /* Procesa la persistencia del documento en Firestore.
  Diferencia entre actualización de documento existente o creación de uno nuevo.
  */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !patientId) return;

    setLoading(true);
    try {
      if (letterheadToEdit) {
        const docRef = doc(db, "users", currentUser.uid, "patients", patientId, "consultations", letterheadToEdit.id);
        await updateDoc(docRef, { ...formData });
      } else {
        const colRef = collection(db, "users", currentUser.uid, "patients", patientId, "consultations");
        await addDoc(colRef, {
            ...formData,
            type: 'membrete',
            clinicId: currentClinicId,
            date: serverTimestamp(),
        });
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error al guardar documento:", error);
      alert("Error al guardar membrete.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden">
        
        {/* Encabezado del Modal */}
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div className="flex items-center gap-2">
            <FileText size={18} style={{ color: themeColor }} />
            <h2 className="font-bold text-gray-800">
              {letterheadToEdit ? 'Editar Membrete' : 'Nuevo Membrete'}
            </h2>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Asunto</label>
                <input 
                  required 
                  type="text" 
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all"
                  style={{ '--tw-ring-color': themeColor } as any}
                  value={formData.subject} 
                  onChange={e => setFormData({...formData, subject: e.target.value})} 
                />
            </div>

            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Cuerpo del Documento</label>
                <textarea 
                  required 
                  rows={10} 
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 resize-none transition-all text-sm leading-relaxed"
                  style={{ '--tw-ring-color': themeColor } as any}
                  value={formData.body} 
                  onChange={e => setFormData({...formData, body: e.target.value})} 
                />
            </div>

            {/* Acciones del Formulario */}
            <div className="pt-2 flex gap-3 justify-end">
                <button 
                  type="button" 
                  onClick={onClose} 
                  className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={loading} 
                  style={{ backgroundColor: themeColor }} 
                  className="px-6 py-2 text-white rounded-lg shadow-md hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2 font-bold"
                >
                    {loading ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Save size={18} />
                    )}
                    {loading ? 'Guardando...' : (letterheadToEdit ? 'Actualizar' : 'Guardar Membrete')}
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};