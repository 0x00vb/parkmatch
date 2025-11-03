# ParkMatch - Aplicación de Alquiler de Cocheras

ParkMatch es una aplicación web moderna para conectar conductores con propietarios de cocheras en Buenos Aires. Permite a los usuarios encontrar, reservar y gestionar espacios de estacionamiento de forma segura y eficiente.

## 🚀 Características Implementadas

### Módulos Completados

#### 1. Pantalla de Inicio (Landing Page)
- Diseño mobile-first responsive
- Logo y branding de ParkMatch
- Presentación de servicios para conductores y propietarios
- Call-to-action para registro
- Navegación a login/registro

#### 2. Sistema de Autenticación
- **Registro por email y contraseña** con validación
- **Autenticación con Google OAuth**
- **Inicio de sesión** con credenciales o Google
- **Validación de formularios** con Zod y React Hook Form
- **Recuperación de contraseña** (estructura preparada)

#### 3. Selección de Rol de Usuario
- **Conductor**: Busca y reserva cocheras
- **Conductor y Propietario**: También puede publicar cocheras
- Flujo post-registro para definir rol principal
- Posibilidad de cambiar rol desde perfil

#### 4. Completar Perfil
- **Campos requeridos**: Nombre, apellido, teléfono
- **Verificación de email**: Estado visual (sin funcionalidad real)
- **Autenticación 2FA**: Opción de diseño (no funcional)
- **Validación completa**: Solo permite continuar con todos los campos

#### 5. Gestión de Vehículos (Conductor y Propietario)
- **CRUD completo**: Añadir, editar, eliminar vehículos
- **Integración Cars API**: Datos automáticos de marca/modelo desde api-ninjas.com
- **Dimensiones estimadas**: Basadas en clase de vehículo
- **Preferencias de búsqueda**: Altura mínima y solo cocheras cubiertas
- **Componentes reutilizables**: Sistema modular

#### 6. Publicación de Cocheras (Solo Propietario)
- **Pantalla 1 - Ubicación**: Google Maps Autocomplete + Leaflet
- **Pantalla 2 - Detalles**: Tipo, dimensiones, seguridad, acceso, reglas
- **Pantalla 3 - Fotos**: Subida hasta 3 imágenes con Cloudinary
- **Flujo completo**: Con progress bar y validaciones
- **Componentes reutilizables**: Sistema modular para reutilización

## 🛠 Stack Tecnológico

- **Frontend**: Next.js 16.0.1, React 19, TypeScript
- **Styling**: Tailwind CSS 4.1.16, HeadlessUI
- **Autenticación**: NextAuth.js con proveedores Email y Google
- **Base de Datos**: PostgreSQL con Prisma ORM
- **Validación**: Zod + React Hook Form
- **Iconos**: Heroicons
- **Mapas**: Google Maps JavaScript API + Leaflet
- **Imágenes**: Cloudinary para subida y optimización
- **APIs Externas**: Cars API (api-ninjas.com) para datos de vehículos

## 📋 Prerequisitos

- Node.js 18+ 
- PostgreSQL instalado y ejecutándose
- Cuenta de Google Cloud (para OAuth)

## 🔧 Instalación y Configuración

### 1. Clonar el repositorio
```bash
git clone <repository-url>
cd parkmatch
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar Base de Datos
Crear base de datos PostgreSQL:
```sql
CREATE DATABASE parkmatch;
```

### 4. Configurar Variables de Entorno
Crear archivo `.env` en la raíz del proyecto:
```env
# Database
DATABASE_URL="postgresql://postgres:Valentino@localhost:5432/parkmatch"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth (configurar en Google Cloud Console)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="your-google-maps-api-key"

# Cloudinary
CLOUDINARY_CLOUD_NAME="your-cloudinary-cloud-name"
CLOUDINARY_API_KEY="your-cloudinary-api-key"
CLOUDINARY_API_SECRET="your-cloudinary-api-secret"

# Cars API
CARS_API_KEY="your-cars-api-key"
```

### 5. Configurar Google OAuth
1. Ir a [Google Cloud Console](https://console.cloud.google.com/)
2. Crear nuevo proyecto o seleccionar existente
3. Habilitar Google+ API
4. Crear credenciales OAuth 2.0
5. Agregar `http://localhost:3000/api/auth/callback/google` como URI de redirección
6. Copiar Client ID y Client Secret al archivo `.env`

### 6. Ejecutar Migraciones de Base de Datos
```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 7. Iniciar Servidor de Desarrollo
```bash
npm run dev
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000)

## 📱 Estructura del Proyecto

```
parkmatch/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── [...nextauth]/route.ts
│   │   │   └── register/route.ts
│   │   └── user/
│   │       └── role/route.ts
│   ├── auth/
│   │   ├── signin/page.tsx
│   │   ├── signup/page.tsx
│   │   └── role-selection/page.tsx
│   ├── dashboard/page.tsx
│   ├── layout.tsx
│   └── page.tsx
├── lib/
│   ├── auth.ts
│   └── prisma.ts
├── prisma/
│   └── schema.prisma
├── types/
│   └── next-auth.d.ts
└── README.md
```

## 🎨 Diseño y UX

- **Mobile-first**: Diseño optimizado para dispositivos móviles
- **Responsive**: Adaptable a diferentes tamaños de pantalla
- **Accesible**: Componentes con buenas prácticas de accesibilidad
- **Consistente**: Sistema de diseño coherente con colores y tipografía

## 🔐 Seguridad

- Contraseñas hasheadas con bcrypt
- Validación de entrada en frontend y backend
- Sesiones JWT seguras
- Protección CSRF integrada con NextAuth

## 🚀 Próximos Pasos

Para continuar el desarrollo, se recomienda implementar:

1. **Gestión de Cocheras**: CRUD para propietarios
2. **Sistema de Búsqueda**: Filtros y geolocalización
3. **Sistema de Reservas**: Calendario y pagos
4. **Perfil de Usuario**: Gestión de datos personales
5. **Notificaciones**: Email y push notifications
6. **Dashboard Avanzado**: Analytics y reportes

## 🤝 Integración con Otros Módulos

Este módulo de autenticación está preparado para integrarse con:

- **Módulo de Cocheras**: Usando el rol de usuario para permisos
- **Módulo de Reservas**: Identificación de usuario autenticado
- **Módulo de Pagos**: Vinculación con perfil de usuario
- **Módulo de Notificaciones**: Usando datos de contacto del usuario

## 📝 Comandos Útiles

```bash
# Desarrollo
npm run dev

# Build para producción
npm run build
npm start

# Linting
npm run lint

# Prisma
npx prisma studio          # Interfaz visual de BD
npx prisma migrate dev     # Nueva migración
npx prisma generate        # Regenerar cliente
npx prisma db push         # Sincronizar esquema sin migración
```

## 🐛 Troubleshooting

### Error de conexión a PostgreSQL
- Verificar que PostgreSQL esté ejecutándose
- Confirmar credenciales en DATABASE_URL
- Verificar que la base de datos 'parkmatch' exista

### Error de Google OAuth
- Verificar GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET
- Confirmar URI de redirección en Google Cloud Console
- Verificar que Google+ API esté habilitada

### Errores de Prisma
- Ejecutar `npx prisma generate` después de cambios en schema
- Verificar que las migraciones estén aplicadas
- Revisar logs de base de datos para errores específicos
