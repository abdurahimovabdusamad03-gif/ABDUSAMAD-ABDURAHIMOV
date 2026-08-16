# 🚀 ERP Master - Zamonaviy Savdo, Ombor va Biznes Boshqaruv Tizimi

[![React](https://img.shields.io/badge/React-19-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38bdf8.svg)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express-4.21-lightgrey.svg)](https://expressjs.com/)
[![Gemini AI](https://img.shields.io/badge/Gemini_AI-Google-orange.svg)](https://ai.google.dev/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**ERP Master** — Chakana va ulgurji savdo do'konlari, omborxonalar, kassa punktlari hamda xizmat ko'rsatish sohalari uchun maxsus ishlab chiqilgan to'liq avtomatlashtirilgan ERP va CRM platformasi.

---

## 🌟 Asosiy Imkoniyatlar

- 🛒 **Tezkor Kassa (POS)** — Tovar shtrix-kodini skanerlash, qidirish, chek chiqarish, chegirmalar va bo'lib to'lash.
- 📦 **Ombor va Mahsulotlar (Sklad)** — Tovar qoldig'i, tannarx, optom va chakana narxlar, mahsulot toifalari, kam qolgan tovarlar ogohlantirishi.
- 👥 **Xodimlar va Huquqlar (Rollar)** — Administrator, Sotuvchi/Kassir, Omborchi va Hisobchi rollari, xodimlar uchun oylik va maosh hisobi.
- 📒 **Mijozlar va Qarz Daftari (Nasiya)** — Mijozlar balansi, nasiya savdo, to'lovlar tarixi, qarzdorlik muddatlari va eslatmalar.
- 🤖 **AI Biznes Tahlilchi (Gemini AI)** — Savdo ko'rsatkichlarini sun'iy intellekt orqali tahlil qilish, eng ko'p foyda keltiruvchi tovarlar prognozi va biznes maslahatlar.
- 📱 **Telegram Bot Integratsiyasi** — Kunlik savdo hisoboti va yangi buyurtmalarni Telegram guruh/kanaliga avtomatik yuborish.
- 📊 **Moliya va Hisobotlar** — Sof foyda, tushum, xarajatlar, kassa balansi va Excel eksport/import.
- 🏷️ **Shtrix-kod va QR-kod Printeri** — Tovar yorliqlarini (stiker) to'g'ridan-to'g'ri pechatga chiqarish.
- 📱 **PWA (Progressive Web App)** — Mobil telefonlar (iOS / Android) va kompyuterlarda mustaqil ilova (app) sifatida o'rnatish.
- 🌐 **Ko'p tilli interfeys** — O'zbekcha (Lotin / Kirill), Ruscha va Inglizcha.

---

## 🛠️ Texnologiyalar Steki

- **Frontend:** React 19, TypeScript, Tailwind CSS 4, Motion (Framer Motion), Lucide Icons, html5-qrcode
- **Backend:** Node.js, Express, tsx, esbuild
- **AI Integratsiya:** Google GenAI (@google/genai)
- **Hujjatlar va Eksport:** ExcelJS, JSBarcode, QRCode.react

---

## 💻 Mahalliy Kompyuterda O'rnatish va Ishga Tushirish

### 1. Repozitoriyani yuklab olish:
```bash
git clone https://github.com/YOUR_USERNAME/erp-master.git
cd erp-master
```

### 2. Bog'liqliklarni (dependencies) o'rnatish:
```bash
npm install
```

### 3. Muhit o'zgaruvchilarini (`.env`) sozlash:
Loyiha ildizida `.env` fayl yarating va quyidagi parametrlarni kiriting:
```env
PORT=3000
GEMINI_API_KEY=your_gemini_api_key_here
APP_URL=http://localhost:3000
```

### 4. Dasturni ishga tushirish (Development rejimi):
```bash
npm run dev
```
Brauzerda: `http://localhost:3000` manzilini oching.

### 5. Ishlab chiqarish (Production build & start):
```bash
npm run build
npm start
```

---

## 🐳 Docker orqali ishga tushirish

```bash
# Docker tasvirini (image) qurish:
docker build -t erp-master .

# Konteynerni ishga tushirish:
docker run -p 3000:3000 --env-file .env erp-master
```

---

## ☁️ Serverlarga Deploy Qilish (Publish)

### 1. Render.com
- **Build Command:** `npm run build`
- **Start Command:** `npm start`
- **Node Version:** `18+` yoki `20+`
- **Environment Variables:** `PORT=3000`, `GEMINI_API_KEY=...`

### 2. Railway.app
- Loyihani GitHub orqali ulang, Railway avtomatik ravishda `Dockerfile` yoki `npm run build` & `npm start` buyruqlarini aniqlaydi.

### 3. Vercel / Netlify
- Vercel orqali deploy qilishda Express backend uchun Serverless Function yoki alohida Node server sifatida sozlashingiz mumkin.

### 4. VPS / Ubuntu Server (PM2 orqali)
```bash
npm run build
npm install -g pm2
pm2 start dist/server.cjs --name "erp-master"
pm2 save
pm2 startup
```

---

## 📁 Loyiha Strukturasi

```text
├── public/                # Ilova logotiplari, PWA manifest va statik fayllar
├── src/
│   ├── components/        # Umumiy UI komponentlar (Header, Navigation, Skaner, va b.)
│   ├── context/           # Asosiy holat boshqaruvi (ERPContext)
│   ├── translations/      # Ko'p tillilik lug'atlari (UZ, RU, EN)
│   ├── types/             # TypeScript interfeyslari va turlari
│   ├── views/             # Asosiy sahifalar (Kassa, Ombor, Tahlil, Moliya, va b.)
│   ├── App.tsx            # Asosiy ilova komponenti
│   └── main.tsx           # React kirish nuqtasi
├── server.ts              # Express API server & Vite middleware
├── Dockerfile             # Docker konteynerizatsiya konfiguratsiyasi
├── package.json           # Loyiha ma'lumotlari va paketlar
└── vite.config.ts         # Vite konfiguratsiyasi
```

---

## 🔐 Xavfsizlik va Litsenziya

- Ushbu loyiha [MIT](LICENSE) litsenziyasi asosida tarqatiladi.
- Maxfiy API kalitlarni (`GEMINI_API_KEY`, parollar) hech qachon ochiq GitHub repozitoriyasiga yuklamang (`.env` fayli `.gitignore` ga kiritilgan).

---

⭐ **Loyiha sizga ma'qul kelgan bo'lsa, GitHub'da Star (yulduzcha) bosishni unutmang!**
