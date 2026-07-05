# Digital Twin AI – Smart Building Management Platform

A production-ready full-stack MERN web application for smart building management with real-time notifications, asset tracking, maintenance management, and more.

---

## Tech Stack
- **Frontend** – React 18, TypeScript, Vite, Tailwind CSS, Recharts, TanStack Query
- **Backend** – Node.js, Express.js, JWT Auth, Socket.IO, Multer
- **Database** – MongoDB Atlas (cloud)

---

## 📦 Project Structure

```
digital-twin-ai/
├── backend/          # Node.js + Express API
└── frontend/         # React + TypeScript + Vite
```

---

## 🍃 Step 1 — Set Up MongoDB Atlas (Free)

1. Go to https://www.mongodb.com/cloud/atlas/register and create a free account
2. Click **"Build a Database"** → choose **Free (M0 Shared)** tier
3. Pick any cloud provider & region → click **Create**
4. **Create a database user:**
   - Username: `dtai_user` (anything)
   - Password: generate a secure password (save it)
   - Click **"Create User"**
5. **Allow network access:**
   - Click "Add IP Address"
   - Click **"Allow Access from Anywhere"** → `0.0.0.0/0`
   - Click **Confirm**
6. **Get your connection string:**
   - Click **"Connect"** → **"Drivers"**
   - Copy the URI — looks like:
     ```
     mongodb+srv://dtai_user:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
     ```
   - Replace `<password>` with your actual password
   - Add your DB name before the `?`:
     ```
     mongodb+srv://dtai_user:mypassword@cluster0.xxxxx.mongodb.net/digital_twin_ai?retryWrites=true&w=majority
     ```

---

## ⚙️ Step 2 — Backend Setup

```bash
cd backend
npm install
```

Edit `backend/.env` and fill in your values:

```env
PORT=5000
NODE_ENV=development

# 👇 Paste your MongoDB Atlas URI here
MONGO_URI=mongodb+srv://dtai_user:yourpassword@cluster0.xxxxx.mongodb.net/digital_twin_ai?retryWrites=true&w=majority

# JWT — change both secrets to anything long and random
JWT_SECRET=changeme_make_this_long_random_string_123
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=another_random_string_456
JWT_REFRESH_EXPIRES_IN=30d

# Frontend URL (for CORS)
CLIENT_URL=http://localhost:5173

# Email (optional for OTP emails — Gmail works fine)
# Create an App Password at: https://myaccount.google.com/apppasswords
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_app_password

# Cloudinary (optional for image uploads)
# Free account at: https://cloudinary.com
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Run the backend:

```bash
npm run dev
```

You should see:
```
✅ MongoDB Connected: cluster0.xxxxx.mongodb.net
🚀 Server running on http://localhost:5000
```

---

## 💻 Step 3 — Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on http://localhost:5173

The Vite proxy is already configured so all `/api` calls automatically go to `http://localhost:5000` — no extra config needed.

---

## 🚀 Step 4 — Create Your First Super Admin

Since there's no super admin in the database yet, register normally then manually update the role in MongoDB Atlas:

1. Go to `http://localhost:5173/register`
2. Register with any credentials
3. The OTP will appear in the backend terminal (dev mode)
4. Go to MongoDB Atlas → Browse Collections → `users`
5. Find your user → click Edit → change `role` to `"super_admin"` and `isVerified` to `true`
6. Save → log in at `http://localhost:5173/login`

---

## 📡 API Endpoints Summary

| Module | Base URL |
|--------|----------|
| Auth | `POST /api/auth/register` `POST /api/auth/login` |
| Buildings | `GET/POST /api/buildings` |
| Assets | `GET/POST /api/assets` |
| Maintenance | `GET/POST /api/maintenance` |
| Complaints | `GET/POST /api/complaints` |
| Visitors | `GET/POST /api/visitors` |
| Parking | `GET/POST /api/parking` |
| Bookings | `GET/POST /api/bookings` |
| Energy | `GET/POST /api/energy` |
| Notifications | `GET /api/notifications` |
| Dashboard | `GET /api/dashboard/stats` |

---

## 🔐 Roles & Permissions

| Role | Access |
|------|--------|
| `super_admin` | Everything — all buildings, users, analytics |
| `building_manager` | Own building — assets, maintenance, reports |
| `maintenance_staff` | Assigned tickets only |
| `security_staff` | Visitors, parking |
| `resident` | Complaints, bookings, notifications |

---

## 📱 Features

- ✅ JWT Auth with refresh token rotation
- ✅ OTP email verification
- ✅ Role-based access control (5 roles)
- ✅ Real-time notifications via Socket.IO
- ✅ Building & floor management
- ✅ Asset tracking with health scores
- ✅ Maintenance ticket workflow
- ✅ Complaint management
- ✅ Visitor management with pass codes
- ✅ Smart parking slot tracking
- ✅ Room booking with double-booking prevention
- ✅ Energy consumption tracking & charts
- ✅ Dashboard with live stats & charts
- ✅ Dark mode glassmorphism UI

---

## 🌐 Deployment (Free)

**Backend → Render.com**
1. Push `backend/` to GitHub
2. New Web Service on Render → connect repo
3. Build: `npm install` · Start: `node src/server.js`
4. Add all `.env` variables in Render's environment tab

**Frontend → Vercel.com**
1. Push `frontend/` to GitHub
2. Import project on Vercel
3. Set `VITE_API_URL=https://your-render-backend.onrender.com/api`
4. Deploy

**Database → Already on MongoDB Atlas (free M0 tier)**
