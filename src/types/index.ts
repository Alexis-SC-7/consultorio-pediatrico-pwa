/* Esquema de Identidad de Usuario.
Define la estructura del perfil almacenado en Firestore y consumido globalmente por el AuthContext.
*/
export interface User {
  uid: string;
  username: string;
  email: string;
  role: 'doctor' | 'admin';
  /* Diccionario de sedes autorizadas para este usuario */
  clinics: {
    [key: string]: ClinicConfig;
  };
}

/* Configuración Operativa de Sede
Contiene los metadatos de marca y recursos visuales para la generación de documentos físicos.
*/
export interface ClinicConfig {
  name: string;
  doctorName: string;
  primaryColor: string;
  recipeTemplateUrl?: string;
  letterheadTemplateUrl?: string;
}

/* Contrato del Contexto de Autenticación.
Define los métodos y estados de seguridad disponibles en toda la aplicación.
*/
export interface AuthContextType {
  /** Perfil del médico autenticado o nulo si la sesión está inactiva */
  currentUser: User | null;
  /** Estado de sincronización inicial con Firebase Auth */
  loading: boolean;
  /** Inicia sesión transformando el username en credencial de sistema */
  login: (username: string, password: string) => Promise<void>;
  /** Finaliza la sesión del lado del servidor y del cliente */
  logout: () => Promise<void>;
}

/* Contrato del Contexto Clínico.
Gestiona el estado de la sede activa y la inyección de marca en la UI.
*/
export interface ClinicContextType {
  currentClinicId: string;
  setClinicId: (id: string) => void;
  clinicName: string;
  themeColor: string;
}