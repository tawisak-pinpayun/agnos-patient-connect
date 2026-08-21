# เอกสารส่งงาน — Agnos Patient Connect

ระบบกรอกข้อมูลผู้ป่วยแบบ **เรียลไทม์** ผู้ป่วยกรอกฟอร์มในหน้าหนึ่ง เจ้าหน้าที่เห็นข้อมูลเปลี่ยนทันทีในอีกหน้าโดยไม่ต้องรีเฟรช ผ่าน WebSocket (Socket.IO)

---

## 1. ลิงก์สำคัญ

| รายการ | URL |
|---|---|
| **เว็บแอป (frontend)** | _(ใส่ URL Vercel หลัง deploy สำเร็จ)_ |
| **Socket server (backend)** | https://agnos-patient-connect-socket.site |
| **Source code (GitHub)** | https://github.com/tawisak-pinpayun/agnos-patient-connect |

---

## 2. เทคโนโลยีที่ใช้

| ส่วน | เทคโนโลยี |
|---|---|
| Frontend | Next.js 15 (App Router), React 18, TypeScript, Tailwind CSS, react-hook-form |
| Real-time | Socket.IO (WebSocket) |
| Backend | Node.js, Express, Socket.IO server, TypeScript |
| Database | MongoDB |
| Validation | Zod (schema เดียวใช้ร่วมกันทั้ง client และ server ผ่าน `packages/shared`) |
| Deploy | Vercel (frontend) + VPS ส่วนตัว พร้อม Nginx reverse proxy + SSL (backend) |

โครงสร้างเป็น **monorepo** (npm workspaces): `packages/shared` (types/schema ใช้ร่วมกัน) + `apps/server` + `apps/web`

---

## 3. ฟีเจอร์หลัก

- **Real-time sync** — พิมพ์ฝั่งผู้ป่วยแล้วเจ้าหน้าที่เห็นทันที (debounce + ส่งเฉพาะ field ที่เปลี่ยน)
- **Dashboard เจ้าหน้าที่** — ค้นหา/กรองสถานะ, สถิติภาพรวม, ดูรายละเอียดผู้ป่วยรายคน
- **แก้ไขข้อมูลโดยเจ้าหน้าที่** — แก้ไขข้อมูลผู้ป่วยแบบเรียลไทม์ผ่านหน้าเจ้าหน้าที่ได้
- **คำนวณอายุอัตโนมัติ** จากวันเกิดที่กรอก
- **Audit log** — บันทึกประวัติการแก้ไขข้อมูลทุกครั้ง พร้อมแหล่งที่มา (ผู้ป่วย/เจ้าหน้าที่)
- **Export CSV** พร้อมกรองตามช่วงวันที่
- **คัดลอกลิงก์ผู้ป่วย + แจ้งเตือนเรียลไทม์** เมื่อมีการส่งข้อมูล
- **สถานะ 3 แบบ** — กำลังกรอกข้อมูล / หยุดกรอก / ส่งข้อมูลเรียบร้อยแล้ว
- **สลับภาษาไทย/อังกฤษ** ทั้ง UI และข้อความ error
- **Dark mode**
- **Validation 2 ชั้น** — schema เดียวกันทำงานทั้ง client และ server (client ไม่ผ่านก็ยังโดน server เช็คซ้ำ)
- **Reconnect + resync อัตโนมัติ** — เน็ตหลุดแล้วต่อกลับ ข้อมูลที่ค้างส่งจะถูกส่งซ้ำให้อัตโนมัติ
- **Responsive** ทุกขนาดหน้าจอ พร้อม accessibility (aria-live, label ผูก input, focus ring)

รายละเอียดโครงสร้างไฟล์และ flow การ sync ข้อมูลดูที่ [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md)
แนวคิดการออกแบบ UI/UX ดูที่ [`docs/UI-UX.md`](./docs/UI-UX.md)

---

## 4. วิธีรันโปรเจกต์ (local)

```bash
npm install
npm run dev   # รันทั้ง socket server (:4000) และ Next.js (:3000)
```

ต้องตั้งค่า `.env` ก่อนรัน ดูรายละเอียดเต็มใน [`README.md`](./README.md)

---

## 5. สถาปัตยกรรม deploy

```
ผู้ใช้ ──▶ Vercel (Next.js, apps/web)
              │  Socket.IO client (wss://)
              ▼
      VPS ส่วนตัว + Nginx (SSL) ──▶ apps/server (Express + Socket.IO)
              │
              ▼
          MongoDB
```

- Frontend deploy บน Vercel, Root Directory = `apps/web`, build ผ่าน `apps/web/vercel.json` ที่สั่งให้ build `@apc/shared` ก่อนแล้วค่อย build `@apc/web`
- Backend รันบน VPS ส่วนตัวแทน platform serverless เพราะ Socket.IO ต้องการ connection ค้างสาย (persistent connection) ซึ่ง serverless function ไม่รองรับ
- SSL ของ backend ออกให้ผ่านโดเมน `agnos-patient-connect-socket.site`

---

## 6. หมายเหตุ

- โค้ดทั้งหมดอยู่ใน repo เดียว (monorepo) แยก deploy คนละที่ตามความเหมาะสมของแต่ละส่วน
- `CORS_ORIGINS` ฝั่ง server ถูกจำกัดเฉพาะโดเมน frontend ที่อนุญาต ไม่เปิดเป็น `*`
- ข้อมูล connection string ของ MongoDB ไม่ถูก commit ลง git
