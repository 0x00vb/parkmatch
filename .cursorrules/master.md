Excelente 👏
Tu idea de usar **prompts modulares** para que una IA vaya desarrollando cada parte del sistema es perfecta.
Lo que te dejo a continuación es una **versión optimizada y profesional** de tu prompt, con:

* Estructura clara
* Lenguaje técnico preciso
* Estilo estándar para un asistente desarrollador
* Pensado para integrarse con agentes de IA o herramientas como Replit, Cursor, o v0.dev

---

## 💡 Prompt Maestro Optimizado: Plataforma de Alquiler de Cocheras

**Contexto general**

Debo desarrollar un **prototipo funcional** de una plataforma para **alquiler y reserva de cocheras**, como proyecto universitario.
El desarrollo debe estar organizado en **módulos**, con **prompts separados por funcionalidades** para que un agente de IA pueda implementarlos de manera independiente y luego integrarlos.

**Stack tecnológico**

* **Frontend:** Next.js (App Router) + TailwindCSS (diseño mobile-first, luego adaptado a desktop por la IA)
* **Backend:** Next.js API Routes con PostgreSQL (usando Prisma ORM)
* **Imágenes:** Cloudinary
* **Autenticación:** NextAuth.js (Email, Google)

**Objetivo del prompt:**
Dividir todo el desarrollo en prompts modulares, cada uno con instrucciones claras para implementación, diseño y lógica.
Cada prompt puede incluir los mockups correspondientes como referencia visual.
El diseño web (desktop) debe adaptarse automáticamente a partir del diseño mobile.

---

## ⚙️ Prompt Base General (para tu agente)

> Actúa como un desarrollador full-stack experto en Next.js, PostgreSQL, Tailwind y Cloudinary.
> Vas a crear un módulo funcional de una aplicación de alquiler de cocheras según los requerimientos que te indicaré.
> Cada módulo debe incluir:
>
> * Estructura de carpetas
> * Componentes React funcionales y reutilizables
> * Validaciones front y backend
> * Hooks y context si corresponde
> * Modelos y migraciones en Prisma
> * APIs CRUD seguras
> * Instrucciones para integrar con otros módulos
>
> El diseño debe ser **mobile responsive-first**, basado en los mockups adjuntos.
>
> Antes de devolver código, resume brevemente qué hará el módulo y cómo se integrará con los demás.

---

## 🧱 Módulos a desarrollar

### **1. Registro e Inicio de Sesión**

**Requerimientos:**

* Registro por email y contraseña.
* Autenticación con Google.
* Validación de formato de email y contraseña.
* Inicio de sesión con cualquier método registrado.
* Recuperación de contraseña (flujo no obligatorio en este prototipo).

**Consideraciones técnicas:**

* Usar `NextAuth` con proveedores de Email y Google.
* Almacenar usuarios en PostgreSQL.
* Estructura de UI con formulario simple y botón social login.
* Tailwind + HeadlessUI.

---

### **2. Selección de Rol**

**Requerimientos:**

* Luego del registro, el usuario debe seleccionar su rol:

  * **Conductor**: busca y reserva cocheras.
  * **Conductor y Propietario**: también puede publicar cocheras.
* Guardar el rol en el perfil (columna `role` en tabla `User`).
* El flujo siguiente depende del rol.

---

### **3. Completar Perfil y Verificación**

**Requerimientos:**

* Campos: nombre, apellido, teléfono.
* Estado de verificación del correo (solo visual, sin funcionalidad real por ahora).
* Opción de activar autenticación de dos factores (solo diseño, no funcional).
* Guardar datos en tabla `UserProfile`.
* Continuar al siguiente paso solo si todos los campos están completos.

---

### **4. Configuración de Vehículos (solo Conductor/Propietario)**

**Requerimientos:**

* Permitir añadir, editar y eliminar vehículos.
* Datos requeridos:

  * Marca y modelo (usando API externa: [https://api-ninjas.com/api/cars](https://api-ninjas.com/api/cars))
  * Patente
  * Dimensiones (obtenidas de la API)
* En la misma pantalla, permitir definir:

  * Altura mínima requerida
  * Preferencia “solo cocheras cubiertas”
* Al finalizar, mostrar pantalla de confirmación (“¡Todo listo!”).
* Componente de gestión de vehículos debe ser **reutilizable**.

---

### **5. Publicar Cochera (solo Propietario)**

**Pantalla 1 – Dirección**

* Input de dirección con **Google Maps Autocomplete**.
* Campo de ciudad.
* Mostrar ubicación en un mapa.

**Pantalla 2 – Detalles**

* Tipo: Cubierto / Descubierto
* Altura, ancho y largo (inputs numéricos)
* Seguridad: portón y/o cámaras (checkboxes)
* Forma de acceso: control o llaves
* Reglas específicas (textarea opcional)

**Pantalla 3 – Fotos**

* Subida de hasta 3 imágenes con Cloudinary.
* La primera imagen será la portada.
* Previsualización y eliminación antes de guardar.

**Datos a guardar (tabla `ParkingSpot`):**

* Ubicación (lat, lng, dirección, ciudad)
* Dimensiones
* Tipo y seguridad
* Reglas y forma de acceso
* Imágenes (array de URLs Cloudinary)
* FK con usuario propietario

---

### **6. Pantalla Principal**

**Requerimientos:**

* Tras iniciar sesión, redirigir al dashboard principal.
* El diseño y funcionalidades dependerán del rol:

  * **Propietario:** ver y administrar cocheras publicadas.
  * **Conductor y propietario:** buscar y reservar cocheras y tambien funcionalidad de propietario.


---

## 📦 Estructura esperada (sugerida)

```
/src
 ├─ app/
 │   ├─ auth/
 │   ├─ profile/
 │   ├─ vehicles/
 │   ├─ parking/
 │   └─ dashboard/
 ├─ components/
 ├─ lib/
 ├─ prisma/
 ├─ hooks/
 └─ utils/
```

---

## 🔁 Integración entre módulos

* El flujo completo será:

  1. Registro →
  2. Selección de rol →
  3. Completar perfil →
  4. Configuración de vehículos (si aplica) →
  5. Publicar cochera (si aplica) →
  6. Dashboard principal

Cada módulo deberá exportar componentes y endpoints listos para ser conectados entre sí.