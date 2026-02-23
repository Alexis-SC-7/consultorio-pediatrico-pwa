# Consultorio Digital Pediátrico

Progressive Web App (PWA) de alto rendimiento diseñada para la gestión de expedientes clínicos, control de pacientes y administración de consultas médicas en tiempo real.

---

## Descripción del Proyecto
Este sistema ha sido desarrollado para digitalizar y optimizar la operación clínica del consultorio del Dr. Jesús. La arquitectura está centrada en la integridad de los datos y la continuidad del servicio en entornos de conectividad intermitente, garantizando una herramienta confiable para el sector salud.

### Especificaciones Técnicas
* **Arquitectura Offline-First:** Implementación de persistencia local mediante Firestore para garantizar la disponibilidad del sistema sin conexión a internet.
* **Sincronización de Identidad:** Sistema dinámico de gestión de perfiles profesionales que personaliza la interfaz y documentos basándose en datos del especialista.
* **Gestión Documental:** CRUD avanzado para el manejo de expedientes pediátricos e historiales clínicos.
* **Sistema de Telemetría:** Registro automatizado de logs de error y contexto técnico para mantenimiento preventivo y depuración en producción.

---

## Stack Tecnológico
* **Frontend:** React (Context API para gestión de estado) y TypeScript para tipado estricto.
* **Build Tool:** Vite para optimización del bundle.
* **Diseño:** Tailwind CSS bajo metodología de componentes responsivos.
* **Backend & Cloud Services:** Firebase (Firestore NoSQL, Authentication, Hosting).

---

## Seguridad y Estándares de Ingeniería
El proyecto se rige por estándares de seguridad modernos y buenas prácticas de desarrollo:
1.  **Protección de Infraestructura:** Las credenciales de API están restringidas mediante referentes HTTP en Google Cloud Console para evitar su uso en dominios no autorizados.
2.  **Gestión de Secretos:** Implementación de variables de entorno (Environment Variables) para proteger llaves de Firebase, excluyendo datos sensibles del control de versiones mediante .gitignore.
3.  **Higiene de Código:** Aplicación de principios de Clean Code, eliminando redundancias y mensajes de depuración en la consola de producción.
4.  **Acceso Autorizado:** Reglas de seguridad de servidor para restringir el acceso a la base de datos exclusivamente a personal autenticado.

---

## Instalación y Configuración Local

Para replicar el entorno de desarrollo, siga estos pasos:

1.  Clonar el repositorio:
    ```bash
    git clone [https://github.com/Alexis-SC-7/consultorio-pediatrico-pwa.git](https://github.com/Alexis-SC-7/consultorio-pediatrico-pwa.git)
    ```
2.  Instalar dependencias:
    ```bash
    npm install
    ```
3.  Configurar el entorno:
    Crear un archivo `.env.local` en la raíz del proyecto con las siguientes llaves (sustituir con valores reales):
    ```env
    VITE_FIREBASE_API_KEY=your_api_key
    VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
    VITE_FIREBASE_PROJECT_ID=consultorio-digital-31f70
    VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
    VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
    VITE_FIREBASE_APP_ID=your_app_id
    ```
4.  Iniciar servidor de desarrollo:
    ```bash
    npm run dev
    ```

---

## Desarrollador
**Alexis SC**
Ingeniería en Sistemas Computacionales
Escuela Superior de Cómputo (ESCOM) - IPN