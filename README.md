# Employee Attendance & Payroll Management System

A production-ready Enterprise Employee Attendance and Payroll management web application. Built with React (Vite) client, Tailwind CSS, Express API backend, and Firestore database. Features automated salary ledger recalculations, multi-format reports exporting, and role-based route authorization.

---

## 1. Project & Directory Structure

The project is structured into a clean monorepo separating client concerns from backend API endpoints:

```
AttendanceWeb/
├── backend/                  # Express.js Server API
│   ├── api/
│   │   ├── controllers/      # API logic controllers (User creations, resets)
│   │   ├── firebaseAdmin/    # Firebase Admin SDK initialization
│   │   ├── middleware/       # Token verification & owner role checks
│   │   ├── routes/           # REST Route configurations
│   │   └── index.js          # Express entrypoint
│   ├── package.json
│   └── vercel.json           # Backend functions Vercel routing
│
├── frontend/                 # React.js Vite Client
│   ├── src/
│   │   ├── components/       # Reusable components (Form inputs, sidebar, tables)
│   │   ├── context/          # State managers (Auth Context, Toast Notifications)
│   │   ├── layouts/          # Layout wrappers (Dashboard sidebar shell)
│   │   ├── pages/            # Page Views (Owner panels, Employee portals)
│   │   ├── services/         # Firebase integration & payroll utilities
│   │   ├── App.jsx           # Client router & page lazy-loading
│   │   ├── index.css         # Styling system
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── firestore.rules           # DB level authorization enforcements
└── vercel.json               # Root Vercel proxy configuration
```

---

## 2. Firestore Database Schemas & Collections

### `users` (Documents: `users/{uid}`)
Stores user profiles and real-time cached wage summary statistics.
```json
{
  "uid": "string",
  "name": "string",
  "email": "string",
  "role": "owner" | "employee",
  "age": 28,
  "dateOfJoining": "YYYY-MM-DD",
  "phone": "string",
  "address": "string",
  "mustChangePassword": true | false,
  "hourRate": 15.00,
  "otHourRate": 22.50,
  "status": "Active" | "Read Only",
  "totalEarned": 1200.00,      // Cache recalculated on write
  "totalPaid": 800.00,
  "totalAdvance": 200.00,
  "pendingSalary": 400.00,
  "finalPayable": 200.00
}
```

* **Subcollection**: `users/{uid}/rateHistory`
  Stores historical pay rate adjustments.
  ```json
  {
    "hourRate": 15.00,
    "otHourRate": 22.50,
    "effectiveDate": "YYYY-MM-DD",
    "createdBy": "string",
    "createdAt": "timestamp"
  }
  ```

### `attendance` (Documents: `attendance/{employeeUid}_{dateStr}`)
Logs daily hours and calculates individual shift earnings.
```json
{
  "uid": "string",
  "name": "string",
  "date": "YYYY-MM-DD",
  "hourRate": 15.00,           // Rate locked in on this date
  "otHourRate": 22.50,
  "workingHours": 8.0,
  "otHours": 2.0,
  "isHoliday": false,
  "earnings": 165.00,          // computed: (hours * rate) + (otHours * otRate)
  "remarks": "string",
  "createdAt": "timestamp",
  "createdBy": "string"
}
```

* **Subcollection**: `attendance/{docId}/history`
  Contains history logs of all modifications to attendance entries.

### `payments`
Logs payouts issued to employees.
```json
{
  "uid": "string",
  "name": "string",
  "date": "YYYY-MM-DD",
  "amount": 500.00,
  "method": "Cash" | "UPI" | "Bank" | "Cheque" | "Other",
  "remarks": "string",
  "remainingBalance": 150.00,
  "createdAt": "timestamp",
  "createdBy": "string"
}
```

### `advances`
Logs advances issued to employees.
```json
{
  "uid": "string",
  "name": "string",
  "date": "YYYY-MM-DD",
  "amount": 200.00,
  "method": "Cash" | "UPI" | "Bank" | "Cheque" | "Other",
  "remarks": "string",
  "createdAt": "timestamp",
  "createdBy": "string"
}
```

### `activities`
Tracks system administrative events.

### `settings`
Stores company and general configurations (`settings/company` and `settings/general`).

---

## 3. Core Mechanics

### A. Authentication & Route Guards
* **Auth Guard**: Rejects unauthenticated connections. Checks if `mustChangePassword` is `true` and forces redirection to the `/change-password` workspace.
* **Role Check**: Directs Owners `/owner/*` and Employees `/employee/*` to their distinct routes.

### B. Salary Engine & Calculations
1. **Dynamic Rates**: Resolves the pay rates active on the target attendance date using a binary match on the effectiveDate arrays.
2. **Ledger Formula**:
   - `Daily Earnings = (Regular Hours * hourRate) + (OT Hours * otHourRate)` (Holidays equal 0 earnings).
3. **Recalculation Trigger**: Writing an attendance shift, payout, advance, or rate revision automatically triggers a recalculation function that updates the cached totals in the primary user document.
   - `finalPayable = totalEarned - totalPaid - totalAdvance`

---

## 4. Environment Variables Configuration

Create a `.env` file inside both `frontend/` and `backend/` directories:

### Frontend `.env`
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Backend `.env`
```env
PORT=5000
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
```

---

## 5. Deployment Guide

### Vercel Deployment (Monorepo)
The root `vercel.json` routes `/api/*` requests to the Express server inside `/backend` and other routes to the static `/frontend` client.

1. Install Vercel CLI: `npm install -g vercel`
2. Run configuration: `vercel`
3. Add production environment variables inside the Vercel Dashboard.
4. Deploy to production: `vercel --prod`
