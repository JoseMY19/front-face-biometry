
# Facial Biometry Frontend

Interfaz web en **Next.js 15 + React 19** para captura, comparación y gestión de biometría facial.

## Arquitectura

### Stack
- **Framework:** Next.js (App Router)
- **UI:** React + Tailwind CSS + `lucide-react`
- **Estado:** estado local con hooks (`useState`, `useEffect`)
- **Comunicación con backend:** `fetch` centralizado en `lib/api.ts`

### Estructura del proyecto
```text
app/
	page.tsx              # Comparación biométrica (captura/subida y resultados)
	database/page.tsx     # Administración de personas en base de datos
	history/page.tsx      # Historial de comparaciones
components/
	CameraCapture.tsx
	ComparisonResults.tsx
	Navigation.tsx
	PersonCard.tsx
lib/
	api.ts                # Cliente HTTP y helpers (photoUrl)
types/
	index.ts              # Tipos de dominio (Person, CompareResponse, HistoryItem...)
```

### Flujo funcional
1. El usuario captura o sube una imagen en **Comparar**.
2. El frontend envía la imagen al backend (`POST /api/compare`).
3. Se muestra resultado con mejor coincidencia, análisis y detecciones.
4. En **Base de datos** se gestionan personas (`GET/POST/DELETE /api/persons`).
5. En **Historial** se consultan comparaciones previas (`GET /api/history`).

## Requisitos

- Node.js 18.18+ (recomendado Node.js 20 LTS)
- npm 9+
- Backend API disponible (por defecto `http://localhost:8000`)

## Cómo iniciar el proyecto

### 1) Instalar dependencias
```bash
npm install
```

### 2) Crear archivo de entorno
Crea un archivo `.env.local` en la raíz del frontend:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

> Esta variable define la URL base del backend que consume `lib/api.ts`.

### 3) Levantar servidor de desarrollo
```bash
npm run dev
```

La app quedará disponible en:
- `http://localhost:3000`

## Variables de entorno

Actualmente el frontend requiere:

- `NEXT_PUBLIC_API_URL`: URL base del backend (incluye protocolo y puerto).

Ejemplos:
- Local: `NEXT_PUBLIC_API_URL=http://localhost:8000`
- Staging: `NEXT_PUBLIC_API_URL=https://api-staging.tudominio.com`
- Producción: `NEXT_PUBLIC_API_URL=https://api.tudominio.com`

## Scripts disponibles

- `npm run dev`: ejecuta entorno de desarrollo.
- `npm run build`: genera build de producción.
- `npm run start`: levanta la build de producción.
- `npm run lint`: ejecuta linting.

## Notas

- El proyecto usa rutas del App Router (`app/`).
- Si el backend no responde, el frontend mostrará errores de conexión en las vistas.
- Para cargar imágenes remotas en Next/Image, el dominio/puerto debe estar permitido en `next.config.js`.
