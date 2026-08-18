# สถาปัตยกรรมระบบ

## ภาพรวม

```
┌──────────────────────────┐                    ┌──────────────────────────────┐
│   Next.js (Vercel)       │◄────WebSocket─────►│  Socket.IO server (Render)    │
│   • หน้าผู้ป่วย            │                    │  • Express (REST)             │
│   • หน้าเจ้าหน้าที่         │─────REST (SSR)────►│  • Socket.IO (rooms)          │
└──────────────────────────┘                    │  • idle sweeper               │
                                                └──────────────┬───────────────┘
                                                               │ mongodb driver
                                                     ┌─────────▼─────────┐
                                                     │  MongoDB          │
                                                     │  sessions         │
                                                     │  submissions      │
                                                     └───────────────────┘
```

**หลักการสำคัญ**: มีเพียง socket server เท่านั้นที่คุยกับ MongoDB (single source of truth) — Next.js เป็น frontend ล้วน ไม่มี DB logic ซ้ำ

---

## โครงสร้างไฟล์และโฟลเดอร์

```
agnos-patient-connect/
├─ package.json                       # npm workspaces root + script รวม
├─ render.yaml                        # blueprint deploy socket server
├─ README.md
├─ docs/
│  ├─ ARCHITECTURE.md                 # ไฟล์นี้
│  └─ UI-UX.md
│
├─ packages/shared/                   # โค้ดที่ใช้ร่วมกัน 2 ฝั่ง (compile เป็น dist ก่อนใช้)
│  └─ src/
│     ├─ constants.ts                 # ตัวเลือก enum (เพศ/ภาษา/ศาสนา/สัญชาติ) + ค่าเวลา
│     ├─ types.ts                     # PatientData, SessionSummary, SessionSnapshot, helper
│     ├─ schema.ts                    # Zod schema (เต็ม + draft) และ ERROR_KEYS
│     ├─ events.ts                    # ชื่อ event, payload types, ชื่อ room
│     └─ index.ts
│
├─ apps/server/                       # → Render
│  ├─ .env.example
│  └─ src/
│     ├─ index.ts                     # bootstrap: connect Mongo → Express → Socket.IO → sweeper
│     ├─ config.ts                    # อ่าน env + validate ว่ามี MONGODB_URI
│     ├─ db/
│     │  ├─ mongo.ts                  # MongoClient (connect ครั้งเดียว) + สร้าง index + ping
│     │  ├─ types.ts                  # รูปร่าง document ใน Mongo
│     │  └─ sessionRepository.ts      # upsert draft / submit / list / หา session ที่ค้าง
│     ├─ services/
│     │  ├─ sessionService.ts         # business logic + คำนวณสถานะ + validate
│     │  ├─ presence.ts               # จำว่า socket ของผู้ป่วยรายไหนยังต่ออยู่ (in-memory)
│     │  └─ idleSweeper.ts            # interval broadcast สถานะ idle
│     ├─ socket/handlers.ts           # event handlers ทั้งหมด
│     └─ routes/sessions.ts           # REST: GET /api/sessions, POST, GET /:id
│
└─ apps/web/                          # → Vercel
   ├─ .env.example
   └─ src/
      ├─ app/
      │  ├─ layout.tsx                # font Noto Sans Thai + LanguageProvider + SocketProvider + AppHeader
      │  ├─ globals.css
      │  ├─ page.tsx                  # landing เลือกโหมด
      │  ├─ patient/page.tsx          # สร้าง sessionId ใหม่แล้ว redirect
      │  ├─ patient/[sessionId]/      # page.tsx (server) + PatientFormPageClient.tsx
      │  ├─ staff/page.tsx            # ดึง list ครั้งแรกผ่าน REST แล้วส่งให้ client
      │  └─ staff/[sessionId]/        # page.tsx (server) + StaffSessionPageClient.tsx
      │
      ├─ providers/
      │  ├─ SocketProvider.tsx        # singleton socket + connection state
      │  └─ LanguageProvider.tsx      # locale + translator (จำใน localStorage)
      │
      ├─ hooks/
      │  ├─ useSocket.ts              # ดึง socket จาก context
      │  ├─ usePatientDraftSync.ts    # join + debounce + emit patch + submit + retry queue
      │  ├─ useStaffSessions.ts       # เข้า staff lobby + รับ list เรียลไทม์
      │  ├─ useSessionSubscription.ts # เฝ้าดู 1 session + merge patch
      │  ├─ useSessionStatus.ts       # คำนวณสถานะฝั่ง client ด้วย timer
      │  ├─ useMediaQuery.ts          # แยกพฤติกรรม mobile / desktop
      │  └─ useTranslation.ts
      │
      ├─ components/
      │  ├─ layout/AppHeader.tsx
      │  ├─ patient/{PatientForm,FormField,FormSection,SubmitBar,SuccessPanel}.tsx
      │  ├─ staff/{StaffDashboard,SessionList,SessionCard,SessionDetail,LiveField,StatusBadge}.tsx
      │  └─ ui/{Button,Card,Input,Select,Textarea,ProgressBar,LanguageToggle,ConnectionIndicator}.tsx
      │
      └─ lib/
         ├─ socket.ts                 # สร้าง socket.io-client (singleton)
         ├─ api.ts                    # fetch REST (ใช้ฝั่ง server)
         ├─ options.ts                # แปลง enum เป็นตัวเลือก select + หา label key
         ├─ format.ts                 # เวลา relative + วันที่ตาม locale
         └─ i18n/{th.ts,en.ts,index.ts}
```

---

## Component หลักและหน้าที่

### ฝั่งผู้ป่วย

| Component | หน้าที่ |
|---|---|
| `PatientForm` | หัวใจของหน้าผู้ป่วย — ผูก react-hook-form กับ Zod, hydrate draft จาก snapshot, subscribe `watch()` เพื่อส่ง patch เฉพาะ field ที่เปลี่ยน, จัดการ submit และ error จาก server |
| `FormSection` | จัดกลุ่มช่องกรอกเป็นการ์ด (ข้อมูลส่วนตัว / ติดต่อ / เพิ่มเติม) วาง grid 1→2 คอลัมน์ |
| `FormField` | label + `htmlFor`, badge "ไม่บังคับ", hint, ข้อความ error พร้อม `role="alert"` |
| `SubmitBar` | progress bar, สถานะ auto-save, ปุ่มส่ง — sticky ล่างจอบนมือถือ, inline บนเดสก์ท็อป |
| `SuccessPanel` | หน้าจอยืนยันหลังส่งสำเร็จ + ปุ่มเริ่ม session ใหม่ |

### ฝั่งเจ้าหน้าที่

| Component | หน้าที่ |
|---|---|
| `StaffDashboard` | ประกอบ list + detail, ตัดสินใจว่า mobile ให้ไปหน้าใหม่ หรือ desktop ให้แสดง split view |
| `SessionList` | render รายการ + empty state |
| `SessionCard` | สรุปผู้ป่วย 1 ราย: ชื่อ, สถานะ, เวลาอัปเดตล่าสุด, progress |
| `SessionDetail` | แสดงทุก field แบ่ง 3 กลุ่ม + progress + สถานะ |
| `LiveField` | 1 ช่องข้อมูล มี flash animation เมื่อค่าเปลี่ยน (respect `prefers-reduced-motion`) และ `aria-live` |
| `StatusBadge` | badge 3 สถานะพร้อมไอคอนและสี |

### ส่วนกลาง

| Component | หน้าที่ |
|---|---|
| `SocketProvider` | สร้าง socket **หนึ่งตัว** ต่อทั้งแอพ, ติดตาม connected/connecting/disconnected |
| `LanguageProvider` | เก็บ locale, สร้าง translator, sync `<html lang>` และ localStorage |
| `AppHeader` | nav + ตัวบอกสถานะการเชื่อมต่อ + ปุ่มสลับภาษา |
| `ConnectionIndicator` | แสดงสถานะ WebSocket แบบ `aria-live` |

---

## Flow การรับส่งและ Sync ข้อมูลแบบ Real-time

### Event contract (`packages/shared/src/events.ts`)

| Event | ทิศทาง | payload |
|---|---|---|
| `session:join` | client → server | `{ sessionId, role }` |
| `session:snapshot` | server → client | `SessionSnapshot` (ข้อมูลเต็ม) |
| `draft:update` | patient → server | `{ sessionId, patch }` |
| `draft:updated` | server → room | `{ sessionId, patch, lastActivityAt }` |
| `draft:submit` | patient → server | `{ sessionId, data }` + ack |
| `draft:submitted` | server → room | `{ sessionId, data, submittedAt }` |
| `staff:join` | staff → server | – |
| `staff:snapshot` | server → staff | `SessionSummary[]` |
| `session:watch` / `session:unwatch` | staff → server | `sessionId` |
| `session:summary` | server → staff lobby | `SessionSummary` |
| `session:status` | server → room | `{ sessionId, status, lastActivityAt, connected }` |

### Rooms

- `session:<sessionId>` — ผู้ป่วยรายนั้น + เจ้าหน้าที่ที่กำลังดูรายนั้น
- `staff:lobby` — เจ้าหน้าที่ทุกคนที่เปิดหน้า dashboard

### ลำดับเหตุการณ์: ผู้ป่วยพิมพ์

```
1. ผู้ป่วยพิมพ์ในช่อง "firstName"
2. react-hook-form watch() ยิง → usePatientDraftSync รวม patch เข้าคิว
3. debounce 300ms → socket.emit("draft:update", { sessionId, patch: { firstName: "..." } })
4. server:
   a. validate patch ด้วย patientDraftSchema (Zod)
   b. upsert MongoDB: $set { "data.firstName": ..., lastActivityAt: now }, status = "filling"
   c. socket.to("session:<id>").emit("draft:updated", { patch, lastActivityAt })   ← ไม่ echo กลับผู้ส่ง
   d. io.to("staff:lobby").emit("session:summary", summary)                        ← อัปเดตการ์ดในรายการ
5. ฝั่งเจ้าหน้าที่: useSessionSubscription merge patch เข้า snapshot เดิม
6. LiveField ของ field นั้น flash 1 วินาที
7. ack กลับถึงผู้ป่วย → เปลี่ยนสถานะเป็น "บันทึกอัตโนมัติแล้ว"
```

**ทำไมส่งเป็น patch**: payload เล็ก (1 field) ไม่ต้องส่งทั้ง object ทุกครั้งที่กดปุ่ม และหลบปัญหาเขียนทับค่าที่เจ้าหน้าที่เพิ่งได้รับจาก field อื่น

### ลำดับเหตุการณ์: ส่งข้อมูล

```
1. handleSubmit → Zod validate ฝั่ง client (ผ่านแล้วค่อยยิง)
2. socket.emit("draft:submit", { sessionId, data }, ack)
3. server validate ด้วย patientSchema ซ้ำ
   - ไม่ผ่าน → ack({ ok:false, errors:[{ field, message }] }) → client setError รายช่อง
   - ผ่าน → insert submissions + set sessions.status = "submitted"
4. broadcast "draft:submitted" ไปทั้ง room + "session:summary" ไป staff lobby
5. ผู้ป่วยเห็น SuccessPanel / เจ้าหน้าที่เห็น badge "ส่งข้อมูลเรียบร้อยแล้ว"
```

### การคำนวณสถานะ 3 แบบ

| สถานะ | เงื่อนไข |
|---|---|
| `filling` | socket ผู้ป่วยยัง connect **และ** มี activity ภายใน 30 วินาทีล่าสุด |
| `submitted` | submit สำเร็จ (สถานะสุดท้าย ไม่ย้อนกลับ) |
| `idle` | socket หลุด **หรือ** ไม่มี activity เกิน 30 วินาที และยังไม่ submit |

คำนวณ **2 ที่** เพื่อให้ทันใจและถูกต้อง:

1. **Server** — `presence.ts` (in-memory map ของ socket ที่ต่ออยู่) + `idleSweeper` interval 10s กวาด session ที่เกิน threshold แล้ว broadcast; และเมื่อ socket `disconnect` จะ broadcast ทันที
2. **Client** — `useSessionStatus` มี timer 5s คำนวณจาก `lastActivityAt` ทำให้ badge เปลี่ยนเองแม้ยังไม่ได้รับ event

### Reconnect และการกู้คืน

- `socket.io-client` reconnect เองไม่จำกัดครั้ง (delay 500ms → สูงสุด 5s)
- เมื่อ `connect` สำเร็จอีกครั้ง:
  - **ผู้ป่วย** ยิง `session:join` ใหม่ → ได้ `session:snapshot` กลับมา + ส่ง patch ที่ค้างในคิว
  - **เจ้าหน้าที่** ยิง `staff:join` และ `session:watch` ใหม่ → ได้ข้อมูลล่าสุดทั้งหมด
- ถ้า emit ล้มเหลว patch จะถูกใส่กลับคิว (ค่าใหม่กว่ามีสิทธิ์ทับค่าเก่า) แล้วส่งเมื่อกลับมาต่อได้

### การเก็บข้อมูลใน MongoDB

| Collection | เนื้อหา | Index |
|---|---|---|
| `sessions` | 1 doc/session: `_id` (sessionId), `data`, `status`, `createdAt`, `lastActivityAt`, `submittedAt` | `lastActivityAt:-1`, `{status, lastActivityAt}`, TTL 7 วันบน `createdAt` (เฉพาะ `submittedAt: null`) |
| `submissions` | ข้อมูลที่ส่งสำเร็จ (immutable, เก็บถาวร) | `sessionId:1`, `submittedAt:-1` |

Draft ที่ผู้ป่วยกรอกค้างไว้จะถูกลบอัตโนมัติหลัง 7 วัน ส่วนข้อมูลที่ submit แล้วเก็บถาวรใน `submissions`
