// src/pages/Login.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
// Iconografía para una interfaz de acceso segura
import { 
  User, 
  Lock, 
  LogIn, 
  AlertCircle, 
  Loader2, 
  Plus 
} from 'lucide-react';

/* Pantalla de Autenticación.
Gestiona el acceso al sistema mediante el enmascaramiento de identidad 
y protege las rutas redirigiendo a usuarios ya autenticados.
*/
export const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const { login, currentUser } = useAuth(); 
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* Guardia de Navegación.
  Si el estado global de autenticación detecta un usuario activo, redirige automáticamente al Dashboard.
  */
  useEffect(() => {
    if (currentUser) {
      navigate('/');
    }
  }, [currentUser, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await login(username, password);
      // La navegación se gestiona reactivamente en el useEffect superior
    } catch (err) {
      console.error("Error de acceso:", err);
      setError('Credenciales incorrectas. Verifique sus datos.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-4 font-sans">
      <div className="max-w-md w-full bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl border border-white/50 overflow-hidden transition-all duration-500 hover:shadow-blue-200/50">
        
        {/* Cabecera Visual y Marca */}
        <div className="pt-10 pb-6 text-center">
            <div className="mx-auto w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg mb-4 transform rotate-3 hover:rotate-0 transition-transform duration-300">
                <Plus size={40} className="text-white" strokeWidth={3} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Consultorio Digital</h2>
            <p className="text-blue-500 font-bold text-xs uppercase tracking-widest mt-1">Acceso Médico Autorizado</p>
        </div>

        <form onSubmit={handleSubmit} className="px-8 pb-10 space-y-5">
          {/* Alerta de Error Dinámica */}
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm text-center border border-red-100 flex items-center justify-center gap-2 animate-bounce">
              <AlertCircle size={16} />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {/* Campo de Identificador de Usuario */}
          <div className="space-y-1">
            <label className="block text-gray-400 text-[10px] font-bold uppercase tracking-widest ml-1">
              Usuario
            </label>
            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors">
                    <User size={18} className="text-gray-400 group-focus-within:text-blue-600" />
                </div>
                <input
                  type="text"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:bg-white transition-all text-gray-800 placeholder-gray-300 font-medium"
                  placeholder="Nombre de usuario"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
            </div>
          </div>

          {/* Campo de Credencial Secreta */}
          <div className="space-y-1">
            <label className="block text-gray-400 text-[10px] font-bold uppercase tracking-widest ml-1">
              Contraseña
            </label>
            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock size={18} className="text-gray-400 group-focus-within:text-blue-600" />
                </div>
                <input
                  type="password"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:bg-white transition-all text-gray-800 placeholder-gray-300"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
            </div>
          </div>

          {/* Acción de Autenticación */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-4 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-xl shadow-xl shadow-blue-500/20 transition-all duration-300 transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2 ${
              isSubmitting ? 'opacity-70 cursor-wait' : ''
            }`}
          >
            {isSubmitting ? (
                <>
                    <Loader2 size={20} className="animate-spin" />
                    Validando...
                </>
            ) : (
                <>
                    <LogIn size={20} />
                    Iniciar Sesión
                </>
            )}
          </button>
        </form>
        
        {/* Pie de Página con Metadatos del Sistema */}
        <div className="bg-gray-50/50 px-8 py-5 text-center border-t border-gray-100">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                Ecosistema Clínico Profesional • v2.0 <br/>
                <span className="text-blue-400/60">Cifrado de grado médico & Offline First</span>
            </p>
        </div>
      </div>
    </div>
  );
};