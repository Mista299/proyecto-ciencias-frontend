# MUA Biodiversidad — Frontend

Interfaz de escritorio para la gestión de la Colección de Ictiología de la Universidad de Antioquia (CIUA). Construida con **React Native Web + Expo** y empaquetada como aplicación de escritorio con **Electron**.

---

## Requisitos

| Herramienta | Versión mínima |
|-------------|----------------|
| Node.js     | 18.x           |
| npm         | 9.x            |
| Backend API | corriendo en `http://localhost:8000` |

---

## Instalación

```bash
npm install
```

---

## Modos de ejecución

### Desarrollo web (navegador)

Abre la app en el navegador con hot-reload:

```bash
npm run web
```

Navega a `http://localhost:19006`.

---

### Escritorio con Electron (modo desarrollo)

Primero levanta el servidor web de Expo en otra terminal:

```bash
npm run web
```

Luego, en una segunda terminal, inicia Electron apuntando al servidor local:

```bash
npm run electron
```

> Electron carga la app desde `http://localhost:19006` durante el desarrollo.

---

## Empaquetado para distribución

### 1. Compilar la app web

```bash
npx expo export:web
```

Genera la carpeta `web-build/` con los archivos estáticos optimizados.

### 2. Generar el instalador de Electron

```bash
npm run dist
```

Equivale a ejecutar:
```
PUBLIC_URL=. expo export:web && electron-builder --linux
```

El instalador `.AppImage` queda en la carpeta `dist/`.

> Para Windows o macOS, edita la sección `build` en `package.json` y cambia el target de `linux` al sistema operativo correspondiente (`win`, `mac`).

---

## Credenciales por defecto

El backend crea un usuario administrador al iniciarse por primera vez:

| Campo      | Valor          |
|------------|----------------|
| Usuario    | `admin`        |
| Contraseña | `changeme123`  |

Cámbialas en producción desde el panel de **Configuración → Cambiar contraseña**.

---

## Pantallas disponibles

| Pantalla       | Descripción                                                  |
|----------------|--------------------------------------------------------------|
| Panorama       | Estadísticas generales, completitud de datos y top familias  |
| Cargar archivo | Carga de especímenes desde archivos CSV/Excel (ETL)          |
| Explorador     | Tabla paginada de registros con filtros avanzados y exportación CSV |
| Taxonomía      | Distribución taxonómica por familia y orden                  |
| Cartografía    | Mapa interactivo de especímenes georeferenciados con filtros |
| Administración | Gestión de usuarios (solo administradores)                   |
| Configuración  | Perfil, cambio de contraseña y estado del sistema            |

---

## Estructura del proyecto

```
frontend/
├── App.tsx                  # Raíz: providers y enrutamiento por pantalla
├── screens/                 # Una carpeta por vista principal
├── components/              # Componentes reutilizables (modales, topbar, etc.)
├── services/
│   ├── api.ts               # Cliente HTTP (axios) con todos los endpoints
│   ├── types.ts             # Interfaces TypeScript compartidas
│   └── navigation.ts        # Estado global mínimo para navegación entre pantallas
├── context/
│   ├── AuthContext.tsx       # Sesión JWT (login / logout / rol)
│   └── ToastContext.tsx      # Notificaciones flotantes
└── constants/
    └── theme.ts             # Paleta de colores, tipografías y espaciado
```

---

## Variables de entorno del backend

La URL base de la API se configura en `services/api.ts`:

```typescript
const BASE = 'http://localhost:8000';
```

Cámbiala si el backend corre en otro host o puerto antes de empaquetar.
