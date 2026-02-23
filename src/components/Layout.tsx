// src/components/Layout.tsx
import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useClinic } from '../context/ClinicContext';
import { ClinicSwitch } from './ClinicSwitch'; 
import logoDoctor from '../assets/logo-doctor.png'; 
// Importación de iconografía para navegación y acciones de sistema
import { 
  Home, 
  Users, 
  User, 
  LogOut, 
  X, 
  Menu 
} from 'lucide-react';

/* Componente estructural de la aplicación (Shell).
Gestiona el menú lateral responsivo, la identidad visual y el contexto de navegación.
*/
export const Layout: React.FC = () => {
  const { logout, currentUser } = useAuth();
  const { clinicName, themeColor } = useClinic();
  const location = useLocation();
  
  // Estado para la gestión del menú lateral en dispositivos móviles
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Definición de rutas principales con sus respectivos iconos vectoriales
  const menuItems = [
    { path: '/', label: 'Inicio', icon: <Home size={20} /> },
    { path: '/pacientes', label: 'Pacientes', icon: <Users size={20} /> },
    { path: '/perfil', label: 'Mi Perfil', icon: <User size={20} /> },
  ];

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <div className="flex h-screen bg-gray-100">
      
      {/* Overlay de seguridad para cierre de menú móvil al perder foco */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={closeMobileMenu}
        ></div>
      )}

      {/* --- BARRA LATERAL (SIDEBAR) --- */}
      <aside 
        className={`
          fixed md:static inset-y-0 left-0 z-50 w-64 bg-white shadow-md flex flex-col transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} 
          md:translate-x-0 
        `}
      >
        
        {/* Identidad de Marca y Versión del Software */}
        <div className="py-8 px-6 border-b border-gray-100 flex flex-col items-center justify-center text-center relative">
            
            {/* Control de cierre para móviles */}
            <button 
                onClick={closeMobileMenu}
                className="absolute top-4 right-4 md:hidden text-gray-400 hover:text-gray-600 p-1 transition-colors"
            >
                <X size={20} />
            </button>

            <img 
                src={logoDoctor} 
                alt="Logotipo Dr. Jesús Carachure" 
                className="w-24 h-auto object-contain mb-3 transition-transform hover:scale-105" 
            />
            
            <h1 
                className="text-lg font-bold tracking-tight leading-none"
                style={{ color: themeColor }}
            >
                Consultorio
            </h1>

            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mt-2">
                v2.0 Offline First
            </p>
        </div>

        {/* Listado de navegación dinámico */}
        <nav className="flex-1 p-4 space-y-2 mt-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={closeMobileMenu}
                style={{ 
                  color: isActive ? themeColor : undefined,
                  backgroundColor: isActive ? `${themeColor}10` : undefined, 
                  borderRight: isActive ? `3px solid ${themeColor}` : '3px solid transparent'
                }}
                className={`flex items-center gap-3 px-4 py-3 rounded-l-lg transition-all duration-200 ${
                  isActive
                    ? 'font-medium translate-x-1' 
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                }`}
              >
                <span className={isActive ? '' : 'text-gray-400'}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Perfil del usuario autenticado y control de acceso */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
            <div className="flex items-center gap-3 mb-4 px-2">
                <div 
                  className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white shadow-sm"
                  style={{ backgroundColor: themeColor }}
                >
                    {currentUser?.username.charAt(0).toUpperCase()}
                </div>
                <div className="overflow-hidden">
                    <div className="font-bold text-sm text-gray-900 truncate">Dr. Jesús Carachure</div>
                    <div className="text-xs text-gray-500">Pediatra</div>
                </div>
            </div>
            <button 
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 px-2 py-2 text-xs font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
            >
                <LogOut size={14} />
                Cerrar Sesión
            </button>
        </div>
      </aside>
      {/* --- CONTENIDO PRINCIPAL --- */}
      <div className="flex-1 flex flex-col overflow-hidden bg-gray-50 h-screen w-full">
        
        {/* HEADER: Barra de navegación superior con desenfoque de fondo (glassmorphism) */}
        <header className="bg-white/80 backdrop-blur-md sticky top-0 border-b border-gray-200 h-16 flex items-center justify-between px-4 md:px-6 z-20">
            
            <div className="flex items-center gap-3">
                
                {/* Control de apertura de menú (visible solo en viewport móvil) */}
                <button 
                    onClick={() => setIsMobileMenuOpen(true)}
                    className="md:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg mr-1 transition-colors"
                    aria-label="Abrir menú"
                >
                    <Menu size={24} />
                </button>

                {/* Indicador visual de marca */}
                <div 
                    className="w-1.5 h-6 rounded-full hidden md:block"
                    style={{ backgroundColor: themeColor }} 
                ></div>
                
                <h2 className="text-lg font-semibold text-gray-800 truncate">
                    {clinicName}
                </h2>
            </div>

            {/* Componente para la conmutación rápida entre sedes */}
            <ClinicSwitch />
        </header>

        {/* Área de renderizado dinámico para las vistas de la aplicación */}
        <main className="flex-1 overflow-auto p-4 md:p-6 scroll-smooth w-full">
            <Outlet />
        </main>
      </div>
    </div>
  );
};