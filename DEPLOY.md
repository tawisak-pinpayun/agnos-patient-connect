# คู่มือ Deploy ระบบขึ้นออนไลน์

ต้อง deploy 2 ส่วน และมี **ลำดับที่สำคัญ**:

1. **Socket.IO server ขึ้น Render ก่อน** (เพื่อได้ URL)
2. นำ URL ที่ได้ ไปใส่ใน **Vercel ตามด้วย**
3. อัปเดต `CORS_ORIGINS` ใน Render ด้วย URL ของ Vercel

---

## 1. GitHub

โปรเจกต์นี้ต้องอยู่บน GitHub ก่อนถึงจะเชื่อม Vercel/Render ได้ ถ้ายังไม่มี repo ให้รัน:

```bash
git init
git add .
git commit -m "Initial commit: patient connect real-time app"
git remote add origin https://github.com/<ชื่อผู้ใช้>/agnos-patient-connect.git
git branch -M main
git push -u origin main
```

---

## 2. ส่วน Backend: Deploy ไป Render

### 2.1 สร้าง Web Service

1. ไปที <https://dashboard.render.com/>
2. **New +** → **Web Service**
3. เลือก repo `agnos-patient-connect` จาก GitHub
4. ตั้งค่า:

| ฟิลด์ | ค่าที่ใช้ |
|---|---|
| Name | `agnos-patient-connect-socket` |
| Runtime | Node |
| Region | Singapore หรือทื่ใกล้คุณ |
| Branch | `main` |
| Root Directory | `.` |
| Build Command | `npm install && npm run build:shared && npm run build --workspace @apc/server` |
| Start Command | `npm run start --workspace @apc/server` |
| Health Check Path | `/healthz` |

หรือถ้า import blueprint กด **New +** → **Blueprint** → เลือก repo จะมี `render.yaml` ให้แล้ว

### 2.2 ตั้ง Environment Variables

ใน Render Dashboard → tab **Environment** เติม:

```
MONGODB_URI=mongodb://root:tawisak123password123@89.116.121.17:27017/patient-connect?authSource=admin
MONGODB_DB=patient-connect
CORS_ORIGINS=https://agnos-patient-connect.vercel.app   ← ใช้ URL Vercel จริงของคุณ
IDLE_THRESHOLD_MS=30000
DRAFT_TTL_DAYS=7
PORT=4000
NODE_VERSION=20.18.0
```

> **ถ้ายังไม่มี URL Vercel จริง**: กรอก `https://agnos-patient-connect.vercel.app` ไปก่อน แล้วแก้หลัง deploy Vercel แล้ว

### 2.3 เปิด "Auto-Deploy"

ให้ git push ใหม่ แล้ว Render build ใหม่เอง

### 2.4 รอสักครู่แล้วทดสอบ

```bash
curl https://<your-service>.onrender.com/healthz
# ควรได้: {"status":"ok","db":true}
```

---

## 3. ส่วน Frontend: Deploy ไป Vercel

### 3.1 สร้าง Project

1. ไปที <https://vercel.com/new>
2. เลือก repo `agnos-patient-connect`
3. ตั้ง **Root Directory** = `apps/web`
4. Framework Preset = Next.js (auto-detect)
5. กด **Deploy**

### 3.2 ตั้ง Environment Variables

ในหน้า Vercel Dashboard → Project → **Settings → Environment Variables** เพิ่ม:

```
NEXT_PUBLIC_SOCKET_URL=https://<your-render-url>.onrender.com
SERVER_API_URL=https://<your-render-url>.onrender.com
```

**สำคัญ**: ตัวขึ้นต้นด้วย `NEXT_PUBLIC_` เท่านั้นถึงจะเห็นที่ฝั่ง client (Socket.IO ทำงานใน browser) `SERVER_API_URL` ใช้สำหรับ server-side fetch ในหน้า staff/patient

### 3.3 กด Redeploy

หลังจากเพิ่ม env var ให้กด **Redeploy** เพื่อ Next.js build ใหม่

---

## 4. อัปเดต CORS (สำคัญ ขั้นตอนสุดท้าย)

1. กลับไป Render
2. แก้ `CORS_ORIGINS` เป็น URL ของ Vercel จริง เช่น `https://agnos-patient-connect.vercel.app`
3. ถ้าจะมี preview deployment หลายอัน (Vercel preview) ให้คั่นด้วย comma: `https://agnos-patient-connect.vercel.app,https://agnos-patient-connect-git-main-xxx.vercel.app`
4. กด **Deploy Latest** ที Render

---

## 5. ทดสอบบน production

1. เปิดหน้า Vercel (`https://<your-app>.vercel.app`)
2. กด **ผู้ป่วย** → ได้รหัส session
3. เปิดอีกหน้า/อีกเครื่อง ไปที่ `/staff` → เลือก session นั้น
4. พิมพ์ข้อมูลในหน้าผู้ป่วย → ต้องเห็นเปลี่ยนทันทีในหน้าเจ้าหน้าที่

---

## หมายเหตุเรื่อง Render Free Tier

บริการฟรีจะ **sleep** เมื่อไม่มีคนใช้ ถ้าเกิดข้อความ `กำลังเชื่อมต่อ...` นานเกิน 30 วินาทีในครั้งแรก สาเหตุคือ Render กำลัง start instance ขึ้นมา ให้รอหรือ upgrade เปลี่ยนไป plan มีค่าใช้จ่าย
