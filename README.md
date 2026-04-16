# 💸 ARY Cash Collection Portal

<div align="center">

![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-10.14-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Active-success?style=for-the-badge)

**A multi-role cash collection management system for ARY Financial Services merchant alliances.**  
Physical cash → BDO Kiosk → Recovery Officer → Bank Deposit — fully tracked & reconciled.

[Features](#-features) • [Tech Stack](#-tech-stack) • [Getting Started](#-getting-started) • [Project Structure](#-project-structure) • [Roles](#-user-roles) • [Screenshots](#-screenshots)

</div>

---

## 📌 Overview

ARY Cash Collection Portal is a real-time web application that manages the complete lifecycle of physical cash collected from customers at merchant kiosks and deposited into ARY Wallets. It provides separate dashboards for each role in the collection chain, with full reconciliation and reporting.

```
Customer (Cash)
      │
      ▼
 BDO @ Kiosk  ──► ARY Wallet Top-Up (SC / BookGold / etc.)
      │
      ▼
Recovery Officer  ──► Collects Physical Cash from BDO
      │
      ▼
Accounts Department  ──► Bank Deposit + Reconciliation
```

---

## ✨ Features

### 🔐 Authentication & Roles
- Firebase Email/Password authentication
- Role-based routing — each role gets its own isolated dashboard
- Four roles: **Admin**, **BDO**, **Recovery Officer**, **Accounts**

### 🛠️ Admin Panel
- **Merchants** — Add, edit, delete business alliance partners
- **Kiosks** — Manage kiosk locations linked to merchants
- **Users** — Create & assign roles/kiosks to portal users
- **Top-up Types** — Dynamically manage wallet service types (SC, BookGold, etc.)
- **Reports** — Date-range reports with CSV export
- **Dashboard** — 7-day collection chart, live stats

### 🧾 BDO (Business Development Officer)
- New transaction entry (amount, top-up type, wallet number, customer name)
- Personal transaction history with status filters
- Dashboard showing today's collection, pending recovery amount

### 🚗 Recovery Officer
- View all pending cash grouped by kiosk
- Bulk-select transactions and mark as collected in one click
- Collection history with deposited/pending status

### 🏦 Accounts
- View all collected cash awaiting bank deposit
- Select collections and record bank deposit (bank name + slip number)
- Full deposit history
- **Reconciliation** — Gap analysis across BDO entries → collections → bank deposits

### ⚙️ General
- Real-time updates via Firestore `onSnapshot`
- Responsive design (mobile + desktop)
- Toast notifications for all actions
- Transaction status chain: `pending` → `collected` → `deposited`

---

## 🧰 Tech Stack

| Layer        | Technology                                      |
|--------------|-------------------------------------------------|
| Frontend     | [React 18](https://react.dev/) + [Vite 6](https://vitejs.dev/) |
| Styling      | [Tailwind CSS 3](https://tailwindcss.com/)      |
| Backend/DB   | [Firebase Firestore](https://firebase.google.com/docs/firestore) |
| Auth         | [Firebase Authentication](https://firebase.google.com/docs/auth) |
| Routing      | [React Router v6](https://reactrouter.com/)     |
| Forms        | [React Hook Form](https://react-hook-form.com/) |
| Charts       | [Recharts](https://recharts.org/)               |
| Icons        | [Lucide React](https://lucide.dev/)             |
| Notifications| [React Hot Toast](https://react-hot-toast.com/) |
| Date Utils   | [date-fns](https://date-fns.org/)               |

---

## 🚀 Getting Started

### Prerequisites

- Node.js `>=18.x`
- npm `>=9.x`
- A Firebase project with **Firestore** and **Authentication** enabled

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/ary-cash-collection-portal.git
cd ary-cash-collection-portal
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable **Authentication** → Sign-in method → **Email/Password**
4. Create **Firestore Database** → Start in **test mode**
5. Go to Project Settings → Your apps → Add Web App → Copy config

### 4. Configure Environment Variables

Copy the example env file and fill in your Firebase credentials:

```bash
cp .env.example .env
```

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your_project-default-rtdb.firebaseio.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 5. Create First Admin User

In Firebase Console:

1. **Authentication** → Add user (email + password)
2. Copy the generated **UID**
3. **Firestore** → Create collection `users` → Document ID = `{UID}`

```json
{
  "uid": "paste-uid-here",
  "name": "Admin User",
  "email": "admin@example.com",
  "role": "admin",
  "active": true
}
```

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### 7. Build for Production

```bash
npm run build
npm run preview
```

---

## 📁 Project Structure

```
ary-cash-collection-portal/
├── public/
├── src/
│   ├── firebase/
│   │   └── config.js              # Firebase initialization
│   ├── context/
│   │   └── AuthContext.jsx        # Auth state + profile management
│   ├── layouts/
│   │   ├── AdminLayout.jsx        # Admin sidebar + routing
│   │   ├── BDOLayout.jsx          # BDO sidebar + routing
│   │   ├── RecoveryLayout.jsx     # Recovery sidebar + routing
│   │   └── AccountsLayout.jsx     # Accounts sidebar + routing
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── admin/
│   │   │   ├── Dashboard.jsx      # Stats + 7-day chart
│   │   │   ├── Merchants.jsx      # CRUD merchants
│   │   │   ├── Kiosks.jsx         # CRUD kiosks
│   │   │   ├── Users.jsx          # CRUD users + role assignment
│   │   │   ├── TopupTypes.jsx     # Dynamic top-up type management
│   │   │   └── Reports.jsx        # Date-range reports + CSV export
│   │   ├── bdo/
│   │   │   ├── Dashboard.jsx      # BDO summary + recent transactions
│   │   │   ├── NewTransaction.jsx # Cash entry form
│   │   │   └── Transactions.jsx   # Full transaction history
│   │   ├── recovery/
│   │   │   ├── Dashboard.jsx      # Pending by kiosk overview
│   │   │   ├── PendingPickups.jsx # Bulk collection marking
│   │   │   └── History.jsx        # Collection history
│   │   └── accounts/
│   │       ├── Dashboard.jsx      # Awaiting deposit + recent deposits
│   │       ├── Deposits.jsx       # Bank deposit recording
│   │       └── Reconciliation.jsx # Gap analysis
│   ├── App.jsx                    # Routes + role-based guards
│   ├── main.jsx
│   └── index.css                  # Tailwind + custom utilities
├── .env.example
├── .env                           # ← your Firebase credentials (gitignored)
├── tailwind.config.js
├── vite.config.js
├── postcss.config.js
└── package.json
```

---

## 👥 User Roles

| Role             | Access                                                        |
|------------------|---------------------------------------------------------------|
| **Admin**        | Full access — merchants, kiosks, users, types, reports        |
| **BDO**          | New cash entry, own transaction history                       |
| **Recovery Officer** | View pending pickups, mark collected, view own history    |
| **Accounts**     | Record bank deposits, reconciliation view                     |

---

## 🗄️ Firestore Collections

| Collection     | Purpose                                              |
|----------------|------------------------------------------------------|
| `users`        | User profiles with roles and kiosk assignments       |
| `merchants`    | Business alliance merchant records                   |
| `kiosks`       | Kiosk locations linked to merchants                  |
| `topupTypes`   | Dynamic wallet top-up service types (SC, BookGold…)  |
| `transactions` | BDO cash entries — `pending → collected → deposited` |
| `collections`  | Recovery officer pickup records                      |
| `deposits`     | Bank deposit records with slip numbers               |

---

## 🔄 Transaction Status Flow

```
[BDO Entry]          [Recovery Officer]       [Accounts]
  pending       ──►      collected      ──►    deposited
```

---

## 📜 Available Scripts

```bash
npm run dev        # Start development server (localhost:5173)
npm run build      # Build for production
npm run preview    # Preview production build locally
npm run lint       # Run ESLint
```

---

## 🔒 Security Notes

- `.env` is gitignored — never commit Firebase credentials
- Update Firestore security rules before going to production
- Each role is protected via React Router guards + Firestore profile check

### Recommended Firestore Rules (Production)

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    match /transactions/{id} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
    }
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch — `git checkout -b feature/amazing-feature`
3. Commit your changes — `git commit -m 'Add amazing feature'`
4. Push to the branch — `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Created with ❤️ by [TechPeer](https://github.com/techpeer)**

*ARY Financial Services — Cash Collection Management System*

![Made with React](https://img.shields.io/badge/Made%20with-React-61DAFB?style=flat-square&logo=react)
![Powered by Firebase](https://img.shields.io/badge/Powered%20by-Firebase-FFCA28?style=flat-square&logo=firebase&logoColor=black)

</div>
