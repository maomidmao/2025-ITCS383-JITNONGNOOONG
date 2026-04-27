
# 2025-ITCS383-JITNONGNOOONG

# 🐾 JITNONGNOONG — ระบบรับเลี้ยงสุนัข (Dog Adoption System)

---

## Mobile Github
  https://github.com/Korawit-chn/2025-ITCS383-JITNONGNOOONG

## 📁 Project Structure

```
JITNONGNOONG/
├── designs/                        # D1 Design documents & diagrams
│   └── JITNONGNOONG_D1_Design.md
├── implementations/
│   ├── backend/                    # Node.js / Express REST API
│   │   ├── config/
│   │   │   └── db.js               # MySQL connection pool
│   │   ├── middleware/
│   │   │   └── auth.js             # Session auth & role guards
│   │   ├── routes/
│   │   │   ├── auth.js             # POST /api/auth/*
│   │   │   ├── dogs.js             # /api/dogs
│   │   │   ├── favourites.js       # /api/favourites
│   │   │   ├── adoptions.js        # /api/adoptions
│   │   │   ├── checkups.js         # /api/checkups
│   │   │   ├── verify.js           # /api/verify/*
│   │   │   ├── sponsors.js         # /api/sponsors
│   │   │   └── reports.js          # /api/reports/*
│   │   ├── dog_adoption_db.sql     # Database schema + seed data
│   │   ├── server.js               # Main entry point
│   │   ├── package.json
│   │   └── .env.example
│   └── frontend/                   # Static HTML/CSS/JS frontend
│       ├── index.html              # Landing page
│       ├── admin-dashboard.html
│       ├── staff-dashboard/
│       ├── user-dashboard/
│       ├── sponsor-dashboard.html
│       ├── css/style.css
│       ├── js/api.js               # Shared API client
│       └── pages/
│           ├── login.html
│           └── dogs.html
=======
│   ├── src/
│   │   ├── backend/                # Node.js / Express REST API
│   │   │   ├── config/
│   │   │   │   └── db.js           # MySQL connection pool
│   │   │   ├── middleware/
│   │   │   │   └── auth.js         # Session auth & role guards
│   │   │   ├── routes/
│   │   │   │   ├── auth.js         # POST /api/auth/*
│   │   │   │   ├── dogs.js         # /api/dogs
│   │   │   │   ├── favourites.js   # /api/favourites
│   │   │   │   ├── adoptions.js    # /api/adoptions
│   │   │   │   ├── checkups.js     # /api/checkups
│   │   │   │   ├── verify.js       # /api/verify/*
│   │   │   │   ├── sponsors.js     # /api/sponsors
│   │   │   │   └── reports.js      # /api/reports/*
│   │   │   ├── dog_adoption_db.sql # Database schema + seed data
│   │   │   ├── server.js           # Main entry point
│   │   │   └── .env.example
│   │   └── frontend/               # Static HTML/CSS/JS frontend
│   │       ├── css/
│   │       ├── js/
│   │       └── pages/
│   └── tests/                      # Automated tests
│   ├── package.json                # Build/config files
│   └── package-lock.json
└── README.md                       # ← You are here
```

---

## ⚙️ Requirements

| Dependency | Version |
|---|---|
| Node.js | ≥ 18.x |
| npm | ≥ 9.x |
| MySQL | ≥ 8.0 |

---
## Option A: Download ZIP from GitHub and Run Locally
### Download source as ZIP

1. Open your GitHub repository page in browser.
2. Click `Code`.
3. Click `Download ZIP`.
4. Extract ZIP to your local machine.

### 🗄️ Database Setup

1. Open MySQL and run the schema + seed script:

### User Account and the Database dog_adoption_db Preparation in MySQL

1. Open MySQL Workbench and connect to `Local instance 3306`.
2. Run the SQL script to create a database `dog_adoption_db`.
3. Create a User Account in MySQL Server for the web server with:
- Login Name: `dog_adoption`
- Password: `dog_adoption`
- Authentication Type: `Standard`
- Limit to Hosts: `localhost`
4. Set Schema privileges for the `dog_adoption` database.
5. Set access rights on `dog_adoption` including:
- `SELECT`
- `INSERT`
- `UPDATE`
- `DELETE`
- `EXECUTE`
- `SHOW VIEW`
6. Test the `dog_adoption_db` database connection.

---

### 🔧 Backend Setup & Run

```bash
# 1. Navigate to implementations folder
cd implementations/src/backend

# 2. Install dependencies
npm install

# 3. Start the server
npm start

# 4. Run test
npm test
```

For development with auto-reload:
```bash
npm run dev
```

The server will start at **http://localhost:3000**

---

## 🌐 Accessing the Application

| URL | Description |
|---|---|
| http://localhost:3000 | Landing page |
| http://localhost:3000/pages/login.html | Login / Register |
| http://localhost:3000/pages/dogs.html | Browse available dogs |
| http://localhost:3000/pages/user-dashboard/favourites.html | User dashboard (Favourites) |
| http://localhost:3000/pages/staff-dashboard/dogmanagement.html | Staff dashboard (Dog Management) |
| http://localhost:3000/admin-dashboard.html | Admin dashboard |
| http://localhost:3000/sponsor-dashboard.html | Sponsor dashboard |
| http://localhost:3000/api/health | API health check |

Default port: **3000** → `http://localhost:3000`

---

## 👥 Demo Accounts (from seed data)

All seed accounts use the password: **`Password123!`**

| Email | Role | Description |
|---|---|---|
| `admin@gmail.com` | ADMIN | ผู้ดูแลระบบ |
| `malee.staff@gmail.com` | STAFF | เจ้าหน้าที่ |
| `somchai.staff@gmail.com` | STAFF | เจ้าหน้าที่ |
| `thanakrit@gmail.com` | USER | ผู้ใช้ทั่วไป |
| `paweena@gmail.com` | USER | ผู้ใช้ทั่วไป |
| `sponsor1@gmail.com` | SPONSOR | ผู้สนับสนุน |

---

## 📡 API Endpoints Summary

### Auth
| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/register` | สมัครสมาชิก |
| POST | `/api/auth/login` | เข้าสู่ระบบ |
| POST | `/api/auth/logout` | ออกจากระบบ |
| GET | `/api/auth/me` | ดูข้อมูลผู้ใช้ปัจจุบัน |

### Dogs
| Method | Path | Description |
|---|---|---|
| GET | `/api/dogs` | รายการสุนัขทั้งหมด (รองรับ `?status=`, `?search=`, `?gender=`) |
| GET | `/api/dogs/:id` | รายละเอียดสุนัข |
| POST | `/api/dogs` | เพิ่มสุนัข (STAFF/ADMIN) |
| PUT | `/api/dogs/:id` | แก้ไขข้อมูลสุนัข (STAFF/ADMIN) |
| DELETE | `/api/dogs/:id` | ลบสุนัข (ADMIN) |
| POST | `/api/dogs/:id/treatments` | เพิ่มบันทึกการรักษา |
| POST | `/api/dogs/:id/trainings` | เพิ่มบันทึกการฝึก |

### Adoption
| Method | Path | Description |
|---|---|---|
| GET | `/api/adoptions` | รายการคำขอรับเลี้ยง |
| GET | `/api/adoptions/my` | คำขอของฉัน |
| POST | `/api/adoptions` | ส่งคำขอรับเลี้ยง |
| PUT | `/api/adoptions/:id/review` | อนุมัติ/ปฏิเสธคำขอ (STAFF/ADMIN) |

### Other
| Method | Path | Description |
|---|---|---|
| GET/POST/DELETE | `/api/favourites` | รายการโปรด |
| GET/PUT/POST | `/api/checkups` | การติดตามหลังรับเลี้ยง |
| POST | `/api/verify/citizen` | ตรวจสอบบัตรประชาชน |
| POST | `/api/verify/criminal` | ตรวจสอบประวัติอาชญากรรม |
| POST | `/api/verify/blacklist` | ตรวจสอบบัญชีดำ |
| GET | `/api/sponsors` | รายการผู้สนับสนุน |
| POST | `/api/sponsors/register` | ลงทะเบียนผู้สนับสนุน |
| GET | `/api/reports/summary` | สรุปภาพรวม (ADMIN) |
| GET | `/api/reports/potential-adopters` | รายงานผู้รับเลี้ยงที่มีศักยภาพ (ADMIN) |

---

## 🔒 Role Permissions

| Feature | USER | STAFF | ADMIN | SPONSOR |
|---|:---:|:---:|:---:|:---:|
| Browse dogs | ✅ | ✅ | ✅ | ✅ |
| Submit adoption | ✅ | | | |
| Manage favourites | ✅ | | | |
| Manage dogs | | ✅ | ✅ | |
| Review adoptions | | ✅ | ✅ | |
| Verify citizens | | ✅ | ✅ | |
| Monthly checkups | | ✅ | ✅ | |
| Admin reports | | | ✅ | |
| Sponsor profile | | | | ✅ |

---

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MySQL 8 (via mysql2 + connection pooling)
- **Auth**: express-session (server-side sessions)
- **File Upload**: Multer
- **Frontend**: Vanilla HTML / CSS / JavaScript (no framework)

---

*JITNONGNOONG v1.0 — D2 Functional Service Release*
>>>>>>> main
