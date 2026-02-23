// src/pages/Profile.tsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useClinic } from '../context/ClinicContext';
import { auth, db } from '../firebase'; 
import { doc, updateDoc } from 'firebase/firestore';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { ShieldCheck, KeyRound, Save, Loader2, Info, UserCircle } from 'lucide-react';

export const Profile: React.FC = () => {
  const { currentUser } = useAuth();
  const { themeColor, currentClinicId, doctorName } = useClinic();
  
  // Estados para la gestión de identidad y seguridad
  const [newDoctorName, setNewDoctorName] = useState(doctorName);
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  /* Persistencia de Identidad Profesional. */
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    
    setLoading(true);
    try {
      const userRef = doc(db, "users", currentUser.uid);
      // Actualizamos solo el campo específico dentro del mapa de clínicas
      await updateDoc(userRef, {
        [`clinics.${currentClinicId}.doctorName`]: newDoctorName
      });
      setMessage({ type: 'success', text: 'Identidad actualizada correctamente.' });
    } catch (error) {
      console.error("Error al actualizar perfil:", error);
      setMessage({ type: 'error', text: 'No se pudo guardar el nombre profesional.' });
    } finally {
      setLoading(false);
    }
  };

  /* Flujo de Seguridad Crítica
  Requiere re-autenticación para validar que el cambio de clave es legítimo */
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (newPass !== confirmPass) {
        setMessage({ type: 'error', text: 'Las nuevas contraseñas no coinciden.' });
        return;
    }

    setLoading(true);
    try {
        if (auth.currentUser && currentUser?.email) {
            const credential = EmailAuthProvider.credential(currentUser.email, currentPass);
            await reauthenticateWithCredential(auth.currentUser, credential);
            await updatePassword(auth.currentUser, newPass);

            setMessage({ type: 'success', text: 'Contraseña actualizada con éxito.' });
            setCurrentPass(''); setNewPass(''); setConfirmPass('');
        }
    } catch (error: any) {
        const errorMsg = error.code === 'auth/wrong-password' 
            ? 'La contraseña actual es incorrecta.' 
            : 'Error de conexión. Intenta más tarde.';
        setMessage({ type: 'error', text: errorMsg });
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Header Dinámico */}
      <div className="flex items-center gap-5">
        <div 
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl text-white font-bold shadow-lg transform rotate-3"
            style={{ backgroundColor: themeColor }}
        >
            {currentUser?.username.charAt(0).toUpperCase()}
        </div>
        <div>
            <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Configuración</h1>
            <p className="text-gray-500 font-medium italic">Gestión de identidad y seguridad médica</p>
        </div>
      </div>

      {/* Bloque 1: Identidad Profesional */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <h2 className="font-bold text-gray-700 flex items-center gap-2 uppercase text-xs tracking-widest">
                <UserCircle size={16} className="text-gray-400" />
                Firma Profesional
            </h2>
        </div>
        <form onSubmit={handleUpdateProfile} className="p-8 space-y-4">
            <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nombre para Recetas y Saludos</label>
                <div className="flex gap-3">
                    <input 
                        type="text" 
                        className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-opacity-10 transition-all font-medium"
                        style={{ '--tw-ring-color': themeColor } as any}
                        value={newDoctorName}
                        onChange={e => setNewDoctorName(e.target.value)}
                        placeholder="Ej: Dr. Jesús Carachure"
                    />
                    <button 
                        type="submit"
                        disabled={loading}
                        style={{ backgroundColor: themeColor }}
                        className="px-6 py-3 text-white rounded-xl shadow-md hover:brightness-110 active:scale-95 transition-all font-bold text-sm flex items-center gap-2"
                    >
                        {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        Actualizar
                    </button>
                </div>
            </div>
        </form>
      </div>

      {/* Bloque 2: Seguridad (Password) */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <h2 className="font-bold text-gray-700 flex items-center gap-2 uppercase text-xs tracking-widest">
                <KeyRound size={16} className="text-gray-400" />
                Acceso a la Cuenta
            </h2>
            <ShieldCheck size={20} className="text-green-500 opacity-50" />
        </div>
        
        <form onSubmit={handleChangePassword} className="p-8 space-y-6">
            {message && (
                <div className={`p-4 rounded-xl text-sm font-bold flex items-center gap-3 border animate-in slide-in-from-top-2 ${
                    message.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                }`}>
                    <Info size={18} /> {message.text}
                </div>
            )}

            <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Contraseña Actual</label>
                <input 
                    type="password" 
                    required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none"
                    value={currentPass}
                    onChange={e => setCurrentPass(e.target.value)}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nueva Contraseña</label>
                    <input 
                        type="password" 
                        required
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none"
                        value={newPass}
                        onChange={e => setNewPass(e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Confirmar Nueva</label>
                    <input 
                        type="password" 
                        required
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none"
                        value={confirmPass}
                        onChange={e => setConfirmPass(e.target.value)}
                    />
                </div>
            </div>

            <div className="pt-4 flex justify-end">
                <button 
                    type="submit"
                    disabled={loading}
                    style={{ backgroundColor: themeColor }}
                    className="px-8 py-3 text-white rounded-xl shadow-lg font-bold text-sm flex items-center gap-2"
                >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
                    Cambiar Contraseña
                </button>
            </div>
        </form>
      </div>

      <div className="bg-slate-800 p-5 rounded-2xl text-white shadow-xl flex items-start gap-4">
        <div className="p-2 bg-white/10 rounded-lg"><Info size={20} className="text-blue-300" /></div>
        <div>
          <h4 className="font-bold text-sm">Protección de datos</h4>
          <p className="text-white/60 text-xs mt-1">Los cambios de identidad se sincronizan en tiempo real con la nube.</p>
        </div>
      </div>
    </div>
  );
};