// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ClinicProvider } from './context/ClinicContext';

// --- VISTAS DEL SISTEMA ---
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Pacientes } from './pages/Pacientes';
import { PatientDetails } from './pages/PatientDetails';
import { Profile } from './pages/Profile'; 
import { DataMigration } from './pages/DataMigration';

// --- COMPONENTES ESTRUCTURALES ---
import { Layout } from './components/Layout';
import { Loader2 } from 'lucide-react'; // Icono para un feedback visual profesional

/* Guardia de Rutas Privadas.
Verifica si el médico tiene una sesión activa antes de permitir el acceso.
Si el sistema aún está validando la identidad, muestra una pantalla de carga.
*/
const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
        <p className="text-gray-500 font-medium animate-pulse uppercase text-xs tracking-widest">
          Iniciando Sistema...
        </p>
      </div>
    );
  }

  return currentUser ? <>{children}</> : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <ClinicProvider>
        <Router>
          <Routes>
            {/* Ruta Pública: 
                Acceso inicial para autenticación de personal médico.
            */}
            <Route path="/login" element={<Login />} />
            
            {/* Estructura Protegida: 
                Todas estas rutas requieren sesión y comparten el mismo Layout (menú lateral, cabecera).
            */}
            <Route path="/" element={
              <PrivateRoute>
                <Layout /> 
              </PrivateRoute>
            }>
              {/* Vista principal: Resumen operativo */}
              <Route index element={<Dashboard />} />
              
              {/* Gestión de Expedientes Clínicos */}
              <Route path="pacientes" element={<Pacientes />} />
              <Route path="pacientes/:id" element={<PatientDetails />} />
              
              {/* Configuración del Médico */}
              <Route path="perfil" element={<Profile />} />

              {/* Herramienta Técnica: Importación de datos legados */}
              <Route path="migracion-secreta" element={<DataMigration />} />
            </Route>

            {/* Redirección automática de seguridad para rutas inexistentes */}
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        </Router>
      </ClinicProvider>
    </AuthProvider>
  );
}

export default App;