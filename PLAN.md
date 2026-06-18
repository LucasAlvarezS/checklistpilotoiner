# Plan de desarrollo — Checklist Inspecciones Externas (INER)

Digitalización del formato **OPE-PR-01 "Checklist Inspecciones Externas"** para que los
pilotos RPA lo completen desde celular/tablet y, al finalizar, se notifique al supervisor
(Nicolás) por correo con el formato adjunto en PDF.

---

## 1. Objetivo y alcance

- Reproducir **el mismo formato** (sin agregar ni quitar filas/columnas): N° · Ítem · SÍ · NO · Observación.
- Flujo simple: el piloto abre un link → llena cabecera → marca SÍ/NO por ítem → envía.
- Al enviar:
  1. Se **guarda** el registro (fecha/hora, piloto, parque y todas las respuestas).
  2. Se **genera un PDF** idéntico al formato con las casillas marcadas.
  3. Se **envía un correo** a Nicolás con diseño INER + el PDF adjunto.
- Identidad visual INER: verde `#044245`, gris `#707070`, amarillo `#FFA700`, logo hoja+rayo.

## 2. Stack (ejecutable sin fricción)

| Capa | Tecnología | Por qué |
|------|-----------|---------|
| App / UI | **Next.js 15 (App Router) + React + TypeScript** | Un solo proyecto para frontend y API. Responsive/PWA. |
| Estilos | **Tailwind CSS** | Rápido para aplicar la paleta INER y que se vea bien en móvil. |
| Formulario | **React Hook Form + Zod** | Validación (cabecera obligatoria, observación obligatoria si marca NO). |
| Base de datos | **PostgreSQL** (Docker local → luego Supabase/Neon) | Ya tienes Docker + DBeaver. Histórico consultable. |
| ORM | **Prisma** | Esquema claro y migraciones simples. |
| PDF | **Puppeteer** (HTML→PDF del mismo layout) | El PDF sale pixel-igual al formato y reaprovecha el HTML. |
| Correo | **Resend** + **React Email** | API key y listo; plantilla HTML con branding INER y adjunto. |
| Deploy | **Vercel** (o Docker en servidor INER) | Un push y queda online con HTTPS. |

> Todo el proyecto corre con `npm run dev` en local; solo necesita la `RESEND_API_KEY` y la URL de Postgres.

## 3. Estructura del formato (fija)

**Cabecera (la llena el piloto):** Nombre del piloto · Nombre del parque · Fecha y hora (automática, editable) · RPA/equipo.

**Secciones e ítems** (extraídos del .docx, en orden):

- **PREPARACIÓN DEL VUELO**
  1. *Permisos y planes de vuelo*: Orden de vuelo (Gerente Operaciones) · Credencial Operadores RPA · Tarjeta de Registro del RPA · Res. Exc. Seguro JAC · Autorización de Operación ANAC · Autorización Entidad Estatal
  2. *Condiciones meteorológicas*: METAR/NOTAM aeródromo cercano · Sin neblina/lluvia · Viento y temperatura adecuados
- **PREVUELO**
  1. *Comprobación visual del fuselaje*: Motores giran manual y correcto · Baterías sujetas y con carga · Conexiones y cables · Antenas en posición
  2. *Hélices*: Sin grietas/desgaste · Montaje correcto y ajustado
  3. *Estación terrestre de carga*: Generador conectado · Alargadores · Cargadores · Sin sobrecalentamiento
  4. *Radio control*: Antenas · Palancas libres · Ajuste modo de vuelo · Baterías · Pantalla asegurada
  5. *Tarjeta SD*: Espacio suficiente · Correctamente instalada
  6. *Área de despegue y aterrizaje*: Delimitada con conos · Libre de obstáculos · Señalización preventiva
  7. *Personal en tierra*: Uso de EPP · Condiciones físicas/mentales óptimas
  8. *Tornillos*: TorNillería presente y con marca de apriete
  9. *Movimiento axial*: Sin juego axial perceptible
  10. *Cámara y accesorios*: Lente sin grietas/manchas · Fijación/Gimbal
  11. *Condiciones operacionales*: Equipos encendidos · RTH · Altura máx · Satélites ≥10 · Señal óptima · Sensores obstáculo · Sin emergencia en pantalla · Calibración Gimbal · Calibración control/IMU/brújula · Paracaídas (si corresponde)
- **DESPEGUE**
  1. *Vuelo estacionario (2 mts)*: Elementos fijos · Vuelo estable · Verificar comandos · Despegue contra el viento
- **VUELO**
  2. *Condición visual del RPA*: Condición segura, VLOS
  3. *Obstáculos en zona de operación*: Libre paso · Presencia de otros RPA · Presencia de objetos
- **ATERRIZAJE**
  1. *Área de aterrizaje*: Libre de obstáculos · Sin interferencias · Señalización
  2. *Vuelo estacionario (2 mts)*: Elementos fijos · Vuelo estable
  3. *Modo de vuelo para aterrizaje*: Manual · Automático · Asistido
  4. *Aterrizaje*: Detención de hélices · Desconexión de energía · Apagado de equipos
  5. *Post aterrizaje*: Mantiene condiciones iniciales · Remoción/inspección de baterías · Temperatura batería · Avisar a ANAC término
- **ALMACENAJE**
  1. *Inspección visual*: Cámara · Motores · Hélices · Baterías · Control remoto · Tren de aterrizaje · Almacenaje general

> Estos ítems se cargan desde un archivo `checklist-schema.ts` (fuente única de verdad) que alimenta tanto el formulario como el PDF.

## 4. Modelo de datos (Postgres / Prisma)

```
Inspeccion
  id            uuid
  creadoEn      timestamp   // fecha y hora
  pilotoNombre  text
  parqueNombre  text
  equipoRPA     text
  estado        enum(COMPLETA_SI | CON_OBSERVACIONES)
  pdfUrl        text
Respuesta
  id            uuid
  inspeccionId  uuid -> Inspeccion
  seccion       text
  numero        text
  item          text
  valor         enum(SI | NO | NA)
  observacion   text
```

## 5. Flujo de la app

1. **Pantalla 1 – Cabecera:** piloto, parque, equipo (fecha/hora auto).
2. **Pantalla 2 – Checklist:** secciones colapsables; cada ítem con toggle **SÍ / NO**. Si marca **NO**, se exige una **observación** (campo comentario).
3. **Resumen y envío:** muestra cuántos SÍ y qué ítems quedaron en NO; botón **"Enviar inspección"**.
4. **Al enviar (API `/api/inspecciones`):** guarda en BD → genera PDF → envía correo → confirma al piloto en pantalla.

## 6. Diseño del correo al supervisor

- Encabezado verde INER `#044245` con logo y título "Checklist Inspecciones Externas".
- **Caso todo SÍ:** banner verde "✓ Checklist completado — todas las casillas en SÍ". Datos: piloto, parque, fecha/hora.
- **Caso con NO:** banner ámbar `#FFA700` "⚠ Inspección con observaciones" y una **tabla** que lista cada ítem en NO con: sección, **nombre del ítem** y **comentario** del piloto.
- Pie con datos del registro y el **PDF adjunto** (formato OPE-PR-01 con las marcas).

## 7. PDF adjunto

- Réplica del formato con logo, header (Procedimiento trabajo aéreo · OPE-PR-01 · Rev 03) y footer.
- Tabla con las 5 columnas; casillas SÍ/NO marcadas según el piloto y la columna Observación rellena.
- Nombre de archivo: `Checklist_<Parque>_<Piloto>_<YYYY-MM-DD_HHmm>.pdf`.

## 8. Etapas de entrega

1. **Setup** (proyecto Next.js + Tailwind + branding INER + logo).
2. **Esquema** `checklist-schema.ts` con todos los ítems.
3. **Formulario** multipaso con validación (NO ⇒ observación obligatoria).
4. **BD + API** de guardado (Prisma + Postgres).
5. **Generación de PDF** idéntico al formato.
6. **Correo** con Resend (plantilla SÍ / con-observaciones + adjunto).
7. **Pantalla de confirmación** + manejo de errores.
8. **Deploy** y prueba de punta a punta.

## 9. Variables de entorno

```
DATABASE_URL=postgresql://...
RESEND_API_KEY=...
MAIL_TO_SUPERVISOR=nicolas@iner...   // correo de Nicolás
MAIL_FROM=checklist@iner...
```
