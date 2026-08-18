# Agnos Patient Connect

ระบบกรอกข้อมูลผู้ป่วยแบบ **เรียลไทม์** — ผู้ป่วยกรอกฟอร์มในหน้าหนึ่ง เจ้าหน้าที่เห็นข้อมูลเปลี่ยนทันทีในอีกหน้าโดยไม่ต้องรีเฟรช ผ่าน WebSocket (Socket.IO)

| | |
|---|---|
| **เว็บที่ deploy แล้ว** | _(ใส่ URL Vercel หลัง deploy)_ |
| **Socket server** | _(ใส่ URL Render หลัง deploy)_ |
| **GitHub** | _(ใส่ URL repo)_ |

---

## ฟีเจอร์

- **Real-time sync** — ผู้ป่วยพิมพ์ → เจ้าหน้าที่เห็นภายใน ~300ms (debounce) ส่งเฉพาะ field ที่เปลี่ยน (patch) ไม่ส่งทั้ง object
- **หลาย session พร้อมกัน** — หน้าเจ้าหน้าที่มีรายการผู้ป่วยทั้งหมด กดดูรายคนได้
- **สถานะผู้ป่วย 3 แบบ** — `กำลังกรอกข้อมูล` / `ส่งข้อมูลเรียบร้อยแล้ว` / `หยุดกรอก`
- **Validation 2 ชั้น** — Zod schema เดียวกันทำงานทั้งฝั่ง client (react-hook-form) และฝั่ง server
- **สลับภาษา ไทย/อังกฤษ** — รวมถึงข้อความ error ทั้งหมด (จำค่าไว้ใน localStorage)
- **Auto-save draft** — ทุกครั้งที่พิมพ์จะบันทึกลง MongoDB ถ้ารีเฟรชหน้าข้อมูลยังอยู่
- **Reconnect + resync** — ถ้าเน็ตหลุด client ต่อกลับเองแล้วดึง snapshot ใหม่ patch ที่ค้างจะถูกส่งซ้ำ
- **Responsive** — ออกแบบแยกสำหรับมือถือ / แท็บเล็ต / เดสก์ท็อป (split view)
- **Accessibility** — label ผูกกับ input, `aria-invalid`, `aria-live`, focus ring ชัด, respect `prefers-reduced-motion`

---

## เทคโนโลยี

| ส่วน | เทคโนโลยี |
|---|---|
| Frontend | Next.js 15 (App Router), React 18, TypeScript, Tailwind CSS, react-hook-form, lucide-react |
| Real-time | Socket.IO (WebSocket) |
| Backend | Node.js, Express, Socket.IO server, TypeScript |
| Database | MongoDB (official `mongodb` driver) |
| Validation | Zod (แชร์ระหว่าง client/server) |
| Deploy | Vercel (frontend) + Render (socket server) |

---

## โครงสร้างโปรเจกต์

monorepo ด้วย **npm workspaces** — 3 packages

```
agnos-patient-connect/
├─ packages/shared/     # types + Zod schema + event contract (ใช้ร่วม 2 ฝั่ง)
├─ apps/server/         # Express + Socket.IO + MongoDB  → Render
└─ apps/web/            # Next.js frontend                → Vercel
```

รายละเอียดไฟล์ทั้งหมด ดู [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md)

---

## วิธีติดตั้งและรัน (local)

### ข้อกำหนด

- Node.js 20 ขึ้นไป
- MongoDB (ใช้ตัวที่มีอยู่ หรือ MongoDB Atlas ฟรีก็ได้)

### 1. ติดตั้ง dependencies

```bash
npm install
```

> **หมายเหตุ Windows/PowerShell**: ถ้าเจอ error `npm.ps1 cannot be loaded` ให้ใช้ `npm.cmd` แทน `npm` หรือรันใน Command Prompt

### 2. ตั้งค่า environment

**`apps/server/.env`** (คัดลอกจาก `.env.example`)

```env
PORT=4000
MONGODB_URI=mongodb://<user>:<password>@<host>:27017/patient-connect?authSource=admin
MONGODB_DB=patient-connect
CORS_ORIGINS=http://localhost:3000
IDLE_THRESHOLD_MS=30000
DRAFT_TTL_DAYS=7
```

**`apps/web/.env.local`** (คัดลอกจาก `.env.example`)

```env
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
SERVER_API_URL=http://localhost:4000
```

### 3. รัน

```bash
npm run dev          # รันทั้ง socket server (:4000) และ Next.js (:3000)
```

หรือแยกกัน 2 terminal

```bash
npm run dev:server
npm run dev:web
```

### 4. ทดสอบ real-time

1. เปิด <http://localhost:3000/patient> ในแท็บที่ 1
2. เปิด <http://localhost:3000/staff> ในแท็บที่ 2 แล้วกดเลือกผู้ป่วยที่ปรากฏขึ้น
3. พิมพ์ในแท็บที่ 1 → เห็นค่าเปลี่ยนทันทีในแท็บที่ 2 (มี flash highlight)
4. หยุดพิมพ์ 30 วินาที → badge เปลี่ยนเป็น "หยุดกรอก"
5. กดส่งข้อมูล → badge เปลี่ยนเป็น "ส่งข้อมูลเรียบร้อยแล้ว"

---

## คำสั่งอื่น ๆ

| คำสั่ง | หน้าที่ |
|---|---|
| `npm run build` | build ทั้ง 3 packages |
| `npm run build:shared` | build เฉพาะ `packages/shared` (ต้องทำก่อน build อย่างอื่น) |
| `npm run lint` | ESLint ฝั่ง web |
| `npm run typecheck` | ตรวจ type ทั้ง workspace |

---

## Deploy

### 1. Socket server → Render

1. Push repo ขึ้น GitHub
2. Render → **New Web Service** → เลือก repo (มี `render.yaml` ให้แล้ว)
3. ตั้ง environment variables:
   - `MONGODB_URI` = connection string ของคุณ
   - `CORS_ORIGINS` = `https://<your-app>.vercel.app` (เติมตอนได้ URL Vercel แล้ว)
4. Health check path: `/healthz`
5. จด URL ที่ได้ เช่น `https://agnos-patient-connect-socket.onrender.com`

> Render free tier จะ **หลับเมื่อไม่มีทราฟฟิก** ทำให้เปิดครั้งแรกช้า ~30 วินาที (UI มี loading state รองรับ)

### 2. Frontend → Vercel

1. Vercel → **New Project** → เลือก repo เดียวกัน
2. **Root Directory** = `apps/web`
3. Environment variables:
   - `NEXT_PUBLIC_SOCKET_URL` = URL ของ Render
   - `SERVER_API_URL` = URL ของ Render
4. Deploy แล้วนำ URL Vercel กลับไปใส่ใน `CORS_ORIGINS` ที่ Render

---

## ความปลอดภัย

- ค่า `MONGODB_URI` **ไม่ถูก commit** ลง git (อยู่ใน `.gitignore`) — เก็บใน `.env` ที่เครื่อง และ Environment ของ Render เท่านั้น
- แนะนำให้สร้าง MongoDB user เฉพาะแอพ (สิทธิ์ `readWrite` เฉพาะ database `patient-connect`) แทนการใช้ `root`
- `CORS_ORIGINS` จำกัด origin ที่ต่อ socket ได้ ไม่เปิดเป็น `*`
- ข้อมูลถูก validate ซ้ำที่ฝั่ง server เสมอ ไม่เชื่อ client

---

## เอกสารเพิ่มเติม

- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — โครงสร้างไฟล์, component หลัก, flow การ sync ข้อมูล
- [`docs/UI-UX.md`](./docs/UI-UX.md) — แนวคิดการออกแบบบนหน้าจอขนาดต่าง ๆ
