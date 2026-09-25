# Acentrax · Administración

Panel de superadmin de Acentrax. Repo independiente del panel de tenants; se despliega en `admin.acentrax.com.mx`.

- Stack: React 19 + TypeScript + Vite 8, Tailwind 4, TanStack Query, zustand, react-router.
- Local: `cp .env.template .env && npm install && npm run dev` (el proxy de Vite manda `/api` a `http://localhost:8080`).
- Producción: `VITE_API_URL=https://api.acentrax.com.mx/api`.
- Solo entran cuentas con `esSuperadmin: true` en la respuesta del login.
