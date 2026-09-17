# TECHCARE

Sistema integral de gestión para una tienda de computadores y servicio técnico:
ventas, inventario, servicio técnico con seguimiento público, garantías,
clientes, usuarios con roles y auditoría.

## Identidad visual

La interfaz se basa en el objeto físico de un taller de reparación: el ticket
de orden de servicio que se amarra al equipo, con su código, su borde
perforado y su sello de estado. Paleta grafito / cobre / verde placa, tipografía
condensada industrial para títulos y monoespaciada para códigos reales
(SKU, número de serie, tracking). Ver `frontend/tailwind.config.ts`.

## Stack

| Capa       | Tecnología                                              |
|------------|----------------------------------------------------------|
| Frontend   | Next.js 14 (App Router), TypeScript, Tailwind CSS        |
| Backend    | Node.js, Express, JWT (access + refresh token), Zod      |
| Base de datos | PostgreSQL + Prisma ORM                                |
| Infra local | Docker Compose (solo PostgreSQL)                        |
| Deploy     | Frontend → Vercel · Backend → Render/Railway · DB → Neon/Supabase/Railway |

> Nota sobre auth: se implementó autenticación propia con JWT (access token
> de vida corta en memoria + refresh token en cookie httpOnly), gestionada
> con `jsonwebtoken` y `bcryptjs` en el backend Express. Si prefieres usar
> **Auth.js (NextAuth)** en el frontend en vez de este esquema, la sección
> "Alternativa con Auth.js" al final explica cómo migrar sin tocar el modelo
> de roles ni el backend.

## Estructura del repositorio

```
techcare/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma      # modelo completo de datos
│   │   └── seed.ts            # admin + técnico + productos de ejemplo
│   └── src/
│       ├── controllers/       # lógica de negocio por módulo
│       ├── routes/            # endpoints REST, con RBAC aplicado
│       ├── middleware/        # auth (JWT), roles (RBAC), errores
│       ├── validators/        # esquemas Zod por módulo
│       ├── utils/             # jwt.ts, audit.ts
│       └── config/db.ts       # cliente Prisma
├── frontend/
│   └── src/
│       ├── app/                # rutas (App Router): público + /dashboard
│       ├── components/         # PublicHeader, ServiceTimeline, etc.
│       ├── context/AuthContext.tsx
│       ├── lib/api.ts          # cliente axios con refresh automático
│       └── types/
└── docker-compose.yml          # PostgreSQL local
```

## Roles y permisos (RBAC)

| Módulo      | Admin | Vendedor | Técnico | Cliente |
|-------------|:-----:|:--------:|:-------:|:-------:|
| Productos   | ✅    | ✅       | 👀      | 👀 (catálogo) |
| Ventas      | ✅    | ✅       | ❌      | propias |
| Inventario  | ✅    | 👀       | 👀      | ❌      |
| Servicios   | ✅    | 👀       | ✅      | propios |
| Garantías   | ✅    | ❌       | 👀      | propias |
| Usuarios    | ✅    | ❌       | ❌      | ❌      |
| Auditoría   | ✅    | ❌       | ❌      | ❌      |

El RBAC se aplica en dos capas: `requireAuth` (verifica el JWT) y
`requireRole(...roles)` (verifica el rol) en cada ruta de
`backend/src/routes/*.ts`. El frontend además oculta del menú del dashboard
las secciones a las que el rol no tiene acceso, en
`frontend/src/app/dashboard/layout.tsx`.

## Flujos clave implementados

- **Venta**: carrito → checkout → `POST /api/orders` descuenta stock dentro
  de una transacción de Prisma (evita sobreventa) y registra el movimiento
  de inventario y el log de auditoría.
- **Servicio técnico**: recepción completa (cliente, equipo, marca, modelo, serial,
  accesorios, estado físico, fotos en Cloudinary). `POST /api/services` genera
  un código `TRK-XXXXXX`. PDF de orden, diagnóstico, factura y entrega en
  `GET /api/services/:id/pdf?type=orden|diagnostico|factura|entrega`.
  El cliente consulta sin login en `GET /api/services/track/:code`.
- **Garantías**: el cliente/técnico sube fotografías reales a Cloudinary
  (`POST /api/uploads`) y las URLs quedan en `WarrantyEvidence` (PostgreSQL).
- **Auditoría**: toda mutación relevante llama a `recordAudit(...)`
  (`backend/src/utils/audit.ts`), guardando quién, qué acción, sobre qué
  entidad y el detalle (ej. stock `10 → 8`).

## Cómo correrlo en local

### 1. Base de datos

```bash
docker compose up -d
```

### 2. Backend

```bash
cd backend
cp .env.example .env
npm install
npm run prisma:generate
npm run prisma:migrate      # crea las tablas
npm run seed                # crea admin@techcare.com / Admin123!
npm run dev                 # http://localhost:4000
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev                 # http://localhost:3000
```

Inicia sesión con `admin@techcare.com` / `Admin123!` para ver el panel
completo, o `cristian@techcare.com` / `Tecnico123!` para el rol técnico.

## Despliegue

### Base de datos (PostgreSQL administrado)

Usa un proveedor con Postgres gestionado y string de conexión listo para
Prisma: **Neon**, **Supabase** o **Railway** son las opciones más simples.
Copia la connection string a `DATABASE_URL`.

### Backend → Render o Railway

1. Crea un servicio "Web Service" apuntando a la carpeta `backend/`.
2. Build command: `npm install && npm run prisma:generate && npm run build`
3. Start command: `npm start`
4. Variables de entorno: las mismas de `.env.example`, con
   `DATABASE_URL` apuntando a tu Postgres administrado y `FRONTEND_URL`
   apuntando a tu dominio de Vercel (ej. `https://techcare.vercel.app`).
5. Corre las migraciones una vez desplegado: `npx prisma migrate deploy`.

### Frontend → Vercel

1. Importa el repositorio en Vercel y selecciona `frontend/` como
   **Root Directory** del proyecto.
2. Framework preset: Next.js (se detecta solo).
3. Variable de entorno: `NEXT_PUBLIC_API_URL` = URL pública de tu backend
   (ej. `https://techcare-api.onrender.com/api`).
4. Deploy. Vercel construye y sirve automáticamente en cada push.

> Importante: como el refresh token vive en una cookie httpOnly de dominio
> del backend, si el backend y el frontend quedan en dominios distintos
> (Vercel + Render), la cookie necesita `SameSite=None; Secure` — ya está
> contemplado en `cookieOptions()` en `auth.controller.ts` cuando
> `NODE_ENV=production`. Verifica que ambos dominios usen HTTPS.

## Alternativa con Auth.js

Si prefieres manejar sesiones con **Auth.js (NextAuth)** en el frontend en
vez del JWT propio:

1. Instala `next-auth` en `frontend/` y configura un `CredentialsProvider`
   que internamente llame a `POST /api/auth/login` del backend y guarde
   `{ id, email, role }` en el JWT de la sesión de Auth.js.
2. Elimina `AuthContext.tsx` y reemplaza `useAuth()` por `useSession()`.
2. El backend no cambia: sigue siendo la única fuente de verdad de
   contraseñas (bcrypt) y de roles. Auth.js solo orquesta la sesión del
   lado del frontend.
3. El middleware `requireAuth`/`requireRole` del backend sigue validando
   un JWT propio del backend — pásalo como Bearer token desde el callback
   `jwt()` de Auth.js.

## Guía de uso

Esta sección explica cómo usar el sistema ya en funcionamiento, paso a paso,
tanto desde la tienda pública como desde el panel administrativo.

### Cuentas de prueba (creadas por el seed)

| Rol      | Email                    | Contraseña   |
|----------|--------------------------|--------------|
| Admin    | admin@techcare.com       | Admin123!    |
| Técnico  | cristian@techcare.com    | Tecnico123!  |

Para probar el rol **Vendedor** o **Cliente**, regístrate desde
`/registro` (queda como Cliente) y luego, como Admin, cámbiale el rol desde
`dashboard/usuarios`.

### 1. Explorar el catálogo como cliente

1. Entra a `http://localhost:3000` y ve a **Productos**.
2. Los productos que ves ahí ya vienen del seed (RTX 5070, Ryzen 7 9700X, etc.),
   con su stock real desde PostgreSQL.
3. Crea una cuenta en `/registro` para poder comprar.

### 2. Registrar una venta (rol Admin o Vendedor)

1. Inicia sesión con `admin@techcare.com` y entra a **Panel → Ventas**
   (`/dashboard/ventas`).
2. En "Venta rápida": elige un producto, la cantidad, dale **+ Agregar**
   (puedes agregar varios productos distintos) y luego **Registrar venta**.
3. Esto llama a `POST /api/orders`, que dentro de una transacción de Prisma:
   valida el stock disponible, descuenta el inventario, crea el pedido y su
   pago, y queda reflejado de inmediato en la tabla de abajo y en
   **Inventario**.
4. Si el stock no alcanza, el sistema rechaza la venta con un mensaje claro
   en vez de dejarla a medias.

### 3. Ajustar inventario manualmente

1. Ve a **Panel → Inventario** (`/dashboard/inventario`).
2. Haz clic en **Ajustar** sobre cualquier producto.
3. Elige el tipo de movimiento:
   - **Entrada**: suma al stock actual (ej. llegó mercancía).
   - **Salida**: resta del stock actual (ej. producto dañado, no vendido).
   - **Ajuste**: fija el stock a un número exacto (ej. conteo físico).
4. Cada movimiento queda en `InventoryMovement` y también en **Auditoría**.

### 4. Recibir un equipo a reparación y darle seguimiento

1. Como Admin o Técnico, un servicio se crea vía `POST /api/services`
   (endpoint listo; agrégalo a la UI del dashboard cuando quieras un
   formulario de recepción — sigue el patrón de `dashboard/servicios`).
   Alternativamente, un Cliente logueado puede solicitar el servicio desde
   su cuenta.
2. El sistema genera un código único `TRK-XXXXX`.
3. En **Panel → Servicios técnicos** (`/dashboard/servicios`), cambia el
   estado con el selector: RECIBIDO → DIAGNÓSTICO → COTIZACIÓN →
   ESPERANDO_APROBACION → EN_REPARACION → LISTO → ENTREGADO.
4. El cliente (sin necesidad de iniciar sesión) sigue su equipo en
   `http://localhost:3000/reparaciones` ingresando su código `TRK-XXXXX`,
   y ve la línea de tiempo con el paso actual resaltado.

### 5. Gestionar una garantía

1. Un cliente reporta una falla en un producto comprado vía
   `POST /api/warranties` (con `productId`, `problem`, `purchaseDate` y,
   opcionalmente, URLs de imágenes como evidencia).
2. Como Admin o Técnico, ve a **Panel → Garantías** (`/dashboard/garantias`)
   y cambia el estado: PENDIENTE → EN_REVISION → APROBADA/RECHAZADA →
   SOLUCIONADA.

### 6. Administrar usuarios y roles

1. Solo el Admin ve **Panel → Usuarios** (`/dashboard/usuarios`).
2. Desde ahí cambias el rol de cualquier cuenta (Admin/Vendedor/Técnico/Cliente)
   con el selector, o la desactivas con **Desactivar** (un usuario inactivo
   no puede iniciar sesión, aunque su historial se conserva).

### 7. Revisar la auditoría

1. **Panel → Auditoría** (`/dashboard/auditoria`) muestra, de más reciente a
   más antiguo, quién hizo cada acción relevante: creación/edición de
   productos, cambios de stock, ventas, cambios de estado de servicios y
   garantías, y cambios de rol de usuarios.
2. Es de solo lectura — sirve para trazabilidad, no se edita desde ahí.

### 8. Leer el resumen del dashboard

`/dashboard` (el primer ítem del menú) muestra cuatro indicadores clave
(ventas del mes, pedidos, servicios activos, stock bajo) y dos gráficas con
`recharts`: ventas de los últimos 6 meses (línea) y los 5 productos más
vendidos (barras), alimentadas por `GET /api/dashboard/sales-by-month` y
`GET /api/dashboard/top-products`. Si no hay ventas aún, las gráficas lo
indican en vez de mostrarse vacías sin explicación.

## Extensiones pendientes (opcionales)

- **`dashboard/clientes`**: el menú ya tiene el enlace, pero no hay pantalla
  propia — hoy reutilizarías `GET /api/users` filtrando `role: CLIENTE`.
  Como esa ruta es solo-Admin en el backend, si quieres que Vendedor/Técnico
  también vean clientes, crea un endpoint `GET /api/customers` con su propio
  `requireRole`.
- **Formulario de recepción de equipos** en `dashboard/servicios` (hoy el
  alta se hace vía API; la UI solo cambia estados).
- **Subida real de imágenes** para evidencia de garantías (hoy se pasan
  URLs; se puede integrar Cloudinary/S3 y ajustar `evidenceUrls`).

## Referencia de la API

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/logout
GET    /api/auth/me

GET    /api/products
GET    /api/products/:id
POST   /api/products
PUT    /api/products/:id
DELETE /api/products/:id
POST   /api/products/:id/stock
GET    /api/products/low-stock

GET    /api/orders
GET    /api/orders/:id
POST   /api/orders
PUT    /api/orders/:id/status

GET    /api/services
GET    /api/services/:id
GET    /api/services/track/:code      (público, sin login)
POST   /api/services
PUT    /api/services/:id/status
PUT    /api/services/:id/assign
PUT    /api/services/:id/diagnosis

GET    /api/warranties
GET    /api/warranties/:id
POST   /api/warranties
PUT    /api/warranties/:id/status

GET    /api/users
PUT    /api/users/:id/role
PUT    /api/users/:id/active

GET    /api/dashboard
GET    /api/dashboard/sales-by-month
GET    /api/dashboard/top-products

GET    /api/audit
```
