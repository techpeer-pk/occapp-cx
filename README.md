<div align="center">

<svg xmlns="http://www.w3.org/2000/svg" width="72" height="72" viewBox="0 0 72 72" fill="none">
  <rect width="72" height="72" rx="16" fill="#C8102E"/>
  <path d="M20 38h10l4-12 8 24 4-16h6" stroke="white" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>

# ARY Cash Collection Portal

**A multi-role, real-time cash collection and reconciliation system**  
**for ARY Financial Services merchant alliances.**

<br/>

![React](https://img.shields.io/badge/React-18.3-%2361DAFB?style=flat-square&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-6.0-%23646CFF?style=flat-square&logo=vite&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-10.14-%23FFCA28?style=flat-square&logo=firebase&logoColor=black)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.4-%2306B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![React Router](https://img.shields.io/badge/React_Router-6-%23CA4245?style=flat-square&logo=reactrouter&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-%2322C55E?style=flat-square)
![Status](https://img.shields.io/badge/Status-Active-%2322C55E?style=flat-square)

</div>

---

## Overview

ARY Cash Collection Portal manages the complete lifecycle of physical cash collected from customers at merchant kiosks, converting it into ARY Wallet top-ups, and tracking it through recovery to final bank deposit — with full reconciliation at every stage.

```
Customer (Cash Payment)
         │
         ▼
  BDO at Kiosk  ──────────►  ARY Wallet Top-Up  (SC / BookGold / ...)
         │
         ▼
  Recovery Officer  ────────►  Physical Cash Pickup from BDO
         │
         ▼
  Accounts Department  ──────►  Bank Deposit + Reconciliation
```

---

## Features

### Authentication & Access Control
- Firebase Email/Password authentication
- Role-based routing — each role has a fully isolated dashboard
- Four access levels: Admin, BDO, Recovery Officer, Accounts

### Admin Panel
- Merchant management — add, edit, deactivate business alliance partners
- Kiosk management — locations linked to merchants
- User management — create users, assign roles and kiosks
- Top-up Types — dynamically manage wallet service types (SC, BookGold, and any future type)
- Reports — date-range reports with CSV export
- Dashboard — 7-day collection chart with live stats

### BDO (Business Development Officer)
- New cash entry form — amount, top-up type, wallet number, customer name
- Personal transaction history with status filters
- Dashboard showing today's totals and pending recovery balance

### Recovery Officer
- All pending cash grouped by kiosk location
- Bulk-select transactions and mark as collected in a single action
- Full collection history with deposit status

### Accounts
- View all collected cash pending bank deposit
- Select collections and record deposit with bank name and slip number
- Complete deposit history
- Reconciliation — gap analysis across BDO entries, recoveries, and deposits

### General
- Real-time updates via Firestore `onSnapshot` listeners
- Responsive layout — desktop and mobile
- Transaction status chain: `pending` → `collected` → `deposited`

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend Framework | [React 18](https://react.dev/) + [Vite 6](https://vitejs.dev/) |
| Styling | [Tailwind CSS 3](https://tailwindcss.com/) |
| Database | [Firebase Firestore](https://firebase.google.com/docs/firestore) |
| Authentication | [Firebase Authentication](https://firebase.google.com/docs/auth) |
| Routing | [React Router v6](https://reactrouter.com/) |
| Forms | [React Hook Form](https://react-hook-form.com/) |
| Charts | [Recharts](https://recharts.org/) |
| Icons | [Lucide React](https://lucide.dev/) |
| Notifications | [React Hot Toast](https://react-hot-toast.com/) |
| Date Utilities | [date-fns](https://date-fns.org/) |

---

## Getting Started

### Prerequisites

- Node.js `>= 18.x`
- npm `>= 9.x`
- A Firebase project with Firestore and Authentication enabled

### 1. Clone the Repository

```bash
git clone https://github.com/techpeer-pk/occapp-cx.git
cd occapp-cx
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Firebase Setup

1. Open [Firebase Console](https://console.firebase.google.com/) and create a new project
2. Navigate to **Authentication** → Sign-in method → enable **Email/Password**
3. Navigate to **Firestore Database** → Create database → Start in **test mode**
4. Go to **Project Settings** → Your apps → Add Web App → copy the config object

### 4. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your Firebase project values:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your_project-default-rtdb.firebaseio.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 5. Create the First Admin User

**In Firebase Console — Authentication tab:**  
Add a user with email and password, then copy the generated UID.

**In Firestore — `users` collection:**  
Create a document with the UID as the document ID:

```json
{
  "uid": "paste-uid-here",
  "name": "Admin User",
  "email": "admin@example.com",
  "role": "admin",
  "active": true
}
```

### 6. Start Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### 7. Production Build

```bash
npm run build
npm run preview
```

---

## Project Structure

```
occapp-cx/
├── public/
├── src/
│   ├── firebase/
│   │   └── config.js                  Firebase initialization
│   ├── context/
│   │   └── AuthContext.jsx            Auth state and profile management
│   ├── layouts/
│   │   ├── AdminLayout.jsx
│   │   ├── BDOLayout.jsx
│   │   ├── RecoveryLayout.jsx
│   │   └── AccountsLayout.jsx
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── admin/
│   │   │   ├── Dashboard.jsx          Live stats and 7-day chart
│   │   │   ├── Merchants.jsx          CRUD — merchant management
│   │   │   ├── Kiosks.jsx             CRUD — kiosk management
│   │   │   ├── Users.jsx              CRUD — user and role management
│   │   │   ├── TopupTypes.jsx         Dynamic top-up type management
│   │   │   └── Reports.jsx            Date-range reports with CSV export
│   │   ├── bdo/
│   │   │   ├── Dashboard.jsx          Summary and recent transactions
│   │   │   ├── NewTransaction.jsx     Cash entry form
│   │   │   └── Transactions.jsx       Full transaction history
│   │   ├── recovery/
│   │   │   ├── Dashboard.jsx          Pending overview grouped by kiosk
│   │   │   ├── PendingPickups.jsx     Bulk collection marking
│   │   │   └── History.jsx            Collection history
│   │   └── accounts/
│   │       ├── Dashboard.jsx          Awaiting deposit and recent deposits
│   │       ├── Deposits.jsx           Bank deposit recording
│   │       └── Reconciliation.jsx     Gap analysis across all stages
│   ├── App.jsx                        Routes and role-based guards
│   ├── main.jsx
│   └── index.css                      Tailwind base and custom utilities
├── .env.example
├── .gitignore
├── tailwind.config.js
├── vite.config.js
└── package.json
```

---

## User Roles

| Role | Access |
|---|---|
| **Admin** | Full access — merchants, kiosks, users, top-up types, reports, dashboard |
| **BDO** | New cash entry, own transaction history and summary |
| **Recovery Officer** | Pending pickups, bulk collection, own collection history |
| **Accounts** | Record bank deposits, full reconciliation view |

---

## Firestore Data Model

| Collection | Purpose |
|---|---|
| `users` | User profiles with roles and kiosk assignments |
| `merchants` | Business alliance merchant records |
| `kiosks` | Kiosk locations linked to merchants |
| `topupTypes` | Wallet top-up service types — admin-managed |
| `transactions` | BDO cash entries — status: `pending → collected → deposited` |
| `collections` | Recovery officer pickup records |
| `deposits` | Bank deposit records with slip numbers |

---

## Transaction Status Flow

```
  BDO Entry          Recovery Officer        Accounts
  ─────────          ────────────────        ────────
  pending      ───►     collected      ───►  deposited
```

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server on `localhost:5173` |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |

---

## Security

- `.env` is gitignored — Firebase credentials are never committed
- Update Firestore security rules before deploying to production

**Recommended Firestore Rules:**

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
      allow read, write: if request.auth != null;
    }
    match /collections/{id} {
      allow read, write: if request.auth != null;
    }
    match /deposits/{id} {
      allow read, write: if request.auth != null;
    }
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## Contributing

1. Fork the repository
2. Create a feature branch — `git checkout -b feature/your-feature`
3. Commit your changes — `git commit -m 'Add your feature'`
4. Push to the branch — `git push origin feature/your-feature`
5. Open a Pull Request

---

## License

Released under the [MIT License](LICENSE).

---

<div align="center">

<br/>

<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" fill="none">
  <rect width="32" height="32" rx="8" fill="#111827"/>
  <path d="M8 20l4-8 4 10 3-6 3 4" stroke="#C8102E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>

**Created by [TechPeer](https://github.com/techpeer-pk)**

ARY Financial Services — Cash Collection Management System

![Built with React](https://img.shields.io/badge/Built%20with-React-61DAFB?style=flat-square&logo=react&logoColor=black)
![Powered by Firebase](https://img.shields.io/badge/Powered%20by-Firebase-FFCA28?style=flat-square&logo=firebase&logoColor=black)

</div>
