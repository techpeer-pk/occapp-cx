# ARY Cash Portal — Complete Workflow Guide

## Overview

ARY Cash Portal manages the end-to-end cash flow from **ARY Wallet top-up transactions** at merchant kiosks all the way to **bank deposits**. Cash moves through four roles in a strict linear pipeline.

```
BDO → Recovery Officer → Accounts → Bank
```

Each step advances the transaction status:

```
pending  →  collected  →  deposited
```

---

## Roles & Responsibilities

| Role | Who | What they do |
|------|-----|-------------|
| **Admin** | Manager / Head Office | Sets up system, manages all master data, full visibility |
| **BDO** | Business Development Officer | Records cash top-up entries at kiosk |
| **Recovery Officer** | Field collector | Physically picks up cash from kiosks |
| **Accounts** | Finance department | Deposits collected cash into bank |

---

## Step-by-Step Workflow

### STEP 0 — Admin Setup (One-time)

Before anyone can use the system, Admin must configure:

1. **Merchants** → Add merchants (shop/business names)
   - Path: Admin → Merchants → Add Merchant

2. **Kiosks** → Add cash collection points, link each kiosk to a merchant
   - Path: Admin → Kiosks → Add Kiosk
   - Each kiosk has: Code (e.g. `KHI-001`), Merchant, Location

3. **Top-up Types** → Define wallet top-up products
   - Path: Admin → Top-up Types → Add Type
   - Each type has: Name (e.g. `Book Gold`), Code (e.g. `BG`), active toggle

4. **Payment Modes** → Define how Recovery Officers move cash
   - Path: Admin → Payment Modes → Add Mode
   - Examples: `Cash`, `Bank`, `Fin Dept`, `Cheque`

5. **Users** → Create accounts for all staff
   - Path: Admin → Users → Add User
   - BDO users must be assigned to a kiosk during creation
   - Available roles: Admin, BDO, Recovery Officer, Accounts

---

### STEP 1 — BDO Records a Transaction

**Who:** BDO (Business Development Officer)
**When:** Every time a customer does a wallet top-up at the kiosk
**Path:** BDO Portal → New Cash Entry

**What BDO fills in:**
| Field | Description |
|-------|-------------|
| Top-up Type | Select product (Book Gold, Wallet, etc.) |
| Amount | Cash received from customer (PKR) |
| Customer Name | Full name — **mandatory** |
| ARY Wallet # | Customer's wallet number — **mandatory**, format `92xxxxxxxxxx` (12 digits) |
| Remarks | Optional notes |

**What gets saved to Firestore (`transactions` collection):**
```
status:        "pending"
bdoUid/Name:   logged-in BDO
kioskId/Code:  from BDO's profile
merchantName:  from BDO's profile (linked via kiosk)
topupType:     selected type (name + code)
amount:        entered amount
customerName:  entered customer name
walletNumber:  validated 12-digit number
createdAt:     server timestamp
```

**After this step:** Transaction is `pending` — cash is physically at the kiosk, not yet collected.

---

### STEP 2 — Recovery Officer Collects Cash

**Who:** Recovery Officer
**When:** They physically visit kiosks and pick up accumulated cash
**Path:** Recovery Portal → Pending Pickups

**What the Recovery Officer sees:**
- All `pending` transactions grouped **by kiosk**
- Total amount per kiosk
- Individual transaction details (date, type, amount, customer, wallet #)

**Collection flow:**
1. Select transactions to collect (checkbox per transaction, or select all for a kiosk)
2. Click **Collect** button
3. Select **Payment Mode** (how cash will move: Cash / Bank / Fin Dept / etc.)
4. Confirm → system records the collection

**What gets written to Firestore:**

`transactions` (batch update):
```
status:          "collected"
collectedAt:     server timestamp
recoveryUid:     recovery officer's UID
recoveryOfficer: recovery officer's name
paymentMode:     selected mode
```

`collections` (new document per kiosk group):
```
recoveryUid/Name: recovery officer
kioskId/Code:     kiosk details
merchantName:     merchant
bdoName/Uid:      originating BDO
txIds:            array of transaction IDs in this pickup
amount:           total amount
paymentMode:      selected mode
status:           "collected"
createdAt:        server timestamp
```

**After this step:** Cash is physically with the Recovery Officer. Transactions are `collected`.

**Recovery Officer can also view:**
- **History** page → all their past collections with search + sort

---

### STEP 3 — Accounts Records Bank Deposit

**Who:** Accounts officer
**When:** After receiving cash from Recovery Officer and depositing to bank
**Path:** Accounts Portal → Bank Deposits

**What Accounts sees:**
- All `collected` collections awaiting deposit (checkbox select)
- Deposit history with search + sort

**Deposit flow:**
1. Select one or more collections to deposit
2. Click **Record Deposit**
3. Fill in: Bank Name, Slip/Reference Number, optional Remarks
4. Confirm → system records the deposit

**What gets written to Firestore:**

`deposits` (new document):
```
accountsUid/Name: accounts officer
collectionIds:    array of collection IDs being deposited
txIds:            all underlying transaction IDs
amount:           total deposited
bankName:         entered bank name
slipNumber:       deposit slip / reference number
remarks:          optional
createdAt:        server timestamp
```

`collections` (batch update):
```
status:      "deposited"
depositedAt: server timestamp
```

`transactions` (batch update):
```
status:      "deposited"
depositedAt: server timestamp
```

**After this step:** Full cycle complete. Cash is in the bank.

---

## Transaction Status Lifecycle

```
┌─────────┐     BDO creates      ┌───────────┐
│  (new)  │ ──────────────────→  │  pending  │
└─────────┘                      └───────────┘
                                       │
                          Recovery collects
                                       │
                                       ▼
                                 ┌───────────┐
                                 │ collected │
                                 └───────────┘
                                       │
                            Accounts deposits
                                       │
                                       ▼
                                 ┌───────────┐
                                 │ deposited │
                                 └───────────┘
```

---

## Admin Visibility & Reports

**Path:** Admin → Reports

Admin can see all transactions across all roles with:
- Date range filter: Today / Last 7 Days / Last 30 Days
- Keyword search across all fields
- Sortable columns (click any column header)
- Summary cards: Total Entered | Pending | Collected | Deposited

**CSV Export includes:**
`#ID, Date, BDO, Kiosk, Merchant, Type, Code, Amount, Customer, Wallet #, Payment Mode, Recovery Officer, Collected At, Remarks, Status`

**Path:** Admin → Reconciliation (Accounts section)

Cash pipeline reconciliation:
- BDO Entries vs Recovery Collected → gap analysis
- Recovery Collected vs Bank Deposited → gap analysis
- BDO-wise breakdown

---

## Firestore Collections Summary

| Collection | Created by | Purpose |
|------------|-----------|---------|
| `users` | Admin / Self-signup | User profiles with roles |
| `merchants` | Admin | Merchant master data |
| `kiosks` | Admin | Kiosk master data linked to merchants |
| `topupTypes` | Admin | Wallet top-up product definitions |
| `paymentModes` | Admin | Cash movement mode options |
| `transactions` | BDO | Individual cash top-up entries |
| `collections` | Recovery Officer | Grouped pickup records (per kiosk visit) |
| `deposits` | Accounts | Bank deposit records |

---

## Security Rules Summary

| Collection | Read | Create | Update | Delete |
|------------|------|--------|--------|--------|
| `users` | Own doc or Admin | Self (BDO only, inactive) or Admin | Admin only | Admin only |
| `merchants` | All active users | Admin only | Admin only | Admin only |
| `kiosks` | All active users | Admin only | Admin only | Admin only |
| `topupTypes` | All active users | Admin only | Admin only | Admin only |
| `paymentModes` | All active users | Admin only | Admin only | Admin only |
| `transactions` | Admin/Recovery/Accounts or own (BDO) | BDO (own UID only) | Admin/Recovery/Accounts | Admin only |
| `collections` | Admin/Accounts or own (Recovery) | Recovery (own UID only) | Admin/Accounts | Admin only |
| `deposits` | Admin/Accounts | Accounts (own UID only) | Admin only | Admin only |

---

## Setup Checklist (Fresh Deployment)

- [ ] Deploy Firestore security rules (`firebase deploy --only firestore:rules`)
- [ ] Admin creates at least one **Merchant**
- [ ] Admin creates at least one **Kiosk** (linked to merchant)
- [ ] Admin creates **Top-up Types** (e.g. Book Gold, Wallet)
- [ ] Admin creates **Payment Modes** (e.g. Cash, Bank, Fin Dept)
- [ ] Admin creates **BDO user** and assigns them a kiosk
- [ ] Admin creates **Recovery Officer** user
- [ ] Admin creates **Accounts** user
- [ ] Test full cycle: BDO entry → Recovery collect → Accounts deposit → check Reports
