# Checklist Inspecciones Externas — INER

Digitalización del formato **OPE-PR-01 "Checklist Inspecciones Externas"** (inspección RPA).
El piloto completa el checklist desde celular/tablet; al enviarlo:

1. Se **guarda** en la base de datos (fecha/hora, piloto, parque, equipo y las 75 respuestas).
2. Se **genera un PDF** idéntico al formato con las casillas marcadas.
3. Se **envía un correo** al supervisor con el diseño INER y el PDF adjunto.

## Stack
Next.js 16 (App Router) · React 19 · Tailwind v4 · Prisma + PostgreSQL (Supabase) ·
Resend + React Email · Puppeteer / `@sparticuz/chromium` (PDF). Deploy en Vercel.

## Estructura
```
src/lib/checklist-schema.ts    Fuente única: etapas/secciones/ítems del formato
src/lib/validation.ts          Reglas Zod (NO ⇒ observación obligatoria)
src/lib/inspeccion.ts          Procesamiento (estado, resumen, ítems en NO, nombre PDF)
src/lib/pdf.ts                 Genera el PDF (réplica del formato) con Puppeteer
src/lib/email.ts               Envío con Resend
src/lib/db.ts                  Cliente Prisma
src/emails/InspeccionEmail.tsx Plantilla del correo (caso SÍ / con observaciones)
src/app/page.tsx               Formulario multipaso
src/app/components/            ChecklistForm + ItemRow
src/app/api/inspecciones/      POST: valida → guarda → PDF → correo
src/app/enviado/               Pantalla de confirmación
prisma/schema.prisma           Modelos Inspeccion + Respuesta
scripts/smoke.ts               Prueba end-to-end (envía una inspección de ejemplo)
```

## Desarrollo local
```bash
npm install
npx prisma db push      # crea las tablas en Supabase (usa DIRECT_URL)
npm run dev             # http://localhost:3000
```
Variables en `.env` (ver `.env.example`): `DATABASE_URL`, `DIRECT_URL`,
`RESEND_API_KEY`, `MAIL_FROM`, `MAIL_TO_SUPERVISOR`, `NEXT_PUBLIC_APP_URL`.

Prueba end-to-end (con el server corriendo):
```bash
npx tsx scripts/smoke.ts          # caso todo en SÍ
npx tsx scripts/smoke.ts conobs   # caso con un ítem en NO
```

## Deploy en Vercel
1. Sube el repo a GitHub e impórtalo en Vercel.
2. En **Settings → Environment Variables** carga las mismas variables del `.env`.
   - `NEXT_PUBLIC_APP_URL` = la URL pública de Vercel (para que el logo del correo cargue).
   - Agrega `PUPPETEER_SKIP_DOWNLOAD=true` para que el build no descargue el Chromium
     de `puppeteer` (en producción se usa `@sparticuz/chromium`).
3. Deploy. La ruta `/api/inspecciones` corre en runtime Node con `maxDuration = 60`.

> El correo usa el dominio verificado en Resend (`MAIL_FROM`). Para pruebas sin dominio
> verificado, usar `onboarding@resend.dev` (solo permite enviar al correo de tu cuenta Resend).
