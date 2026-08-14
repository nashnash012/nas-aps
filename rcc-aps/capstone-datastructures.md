# RCC-APS Data Structures

> Complete data structures of the system — for capstone documentation.
> Feed this to any AI to generate formal Class Diagrams, DDL/SQL, JSON schemas, or data dictionary tables.

---

## 1. Overview

RCC-APS stores data in two places:
- **Browser `localStorage`** (key: `rcc_aps_demo_v1`) — frontend state
- **Server JSON file** (`server/db/db.json`) — synced copy via `/api/data`

All data is persisted as JSON. The state object saved by `saveDemo()`:

```json
{
  "users": [],
  "nextUserId": 13,
  "cashAdvances": {},
  "bonusTypes": [],
  "nextBonusId": 2,
  "auth": {},
  "deductionCategories": [],
  "nextDedCatId": 1,
  "payrollRecords": [],
  "bonusPayouts": {},
  "profile": {}
}
```

---

## 2. USERS — Employee / User master record

**Type:** Array of objects. **Primary key:** `id` (Integer, auto-increment via `nextUserId`).

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | Integer | ✔ | Unique user ID (PK) |
| `first` | String | ✔ | First name |
| `last` | String | ✔ | Last name |
| `email` | String | ✔ | Email — unique, used for login |
| `role` | String | ✔ | `System Admin` / `Finance Officer` / `Employee` |
| `status` | String | ✔ | `Active` / `Inactive` |
| `date` | String | ✔ | Date account added (e.g. "Jan 10, 2026") |
| `salary` | Number | ✔ | Monthly base salary (Non-Teaching) or reference |
| `classification` | String | ✔ | `Teaching` / `Non-Teaching` |
| `department` | String | ✔ | e.g. "College of Computer Studies" |
| `hireDate` | String | ✔ | Date hired (YYYY-MM-DD) |
| `endDate` | String | ✘ | Separation date (resignees, inactive users) |
| `hourlyRate` | Number | ✘ | Teaching only — hourly rate |
| `hoursWorked` | Number | ✘ | Teaching only — default hours worked |

**Example:**
```json
{ "id": 3, "first": "Jhon Gerald", "last": "Batuaan",
  "email": "employee@rcc.edu.ph", "role": "Employee",
  "status": "Active", "date": "Jan 12, 2026", "salary": 28500,
  "classification": "Teaching", "department": "College of Computer Studies",
  "hireDate": "2025-06-01", "hourlyRate": 190, "hoursWorked": 150 }
```

---

## 3. AUTH — Login credentials

**Type:** Object keyed by user ID. **Primary key:** `id` (matches USERS.id). One-to-one with USERS.

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | Integer | ✔ | Same as USERS.id (FK) |
| `email` | String | ✔ | Login email (lowercase) |
| `pass` | String | ✔ | Login password |
| `label` | String | ✔ | Role display label |
| `icon` | String | ✔ | Role emoji icon |
| `page` | String | ✔ | Landing page ID (`adminPage` / `financePage` / `empPage`) |
| `role` | String | ✔ | Role key (`admin` / `finance` / `employee`) |
| `status` | String | ✔ | `Active` / `Inactive` (blocks login if Inactive) |

**Example:**
```json
{ "1": { "id": 1, "email": "admin@rcc.edu.ph", "pass": "admin123",
         "label": "System Admin", "icon": "🔧", "page": "adminPage",
         "role": "admin", "status": "Active" } }
```

---

## 4. CASH ADVANCES

**Type:** Object keyed by employee ID. One-to-one with USERS.

| Field | Type | Description |
|---|---|---|
| key | Integer | Employee ID (= USERS.id) |
| value | Number | Cash advance amount deducted from payroll |

**Example:**
```json
{ "1": 0 }
```

---

## 5. BONUS TYPES — Configurable bonus reference

**Type:** Array of objects. **Primary key:** `id` (auto-increment via `nextBonusId`).

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | Integer | ✔ | Unique bonus type ID |
| `name` | String | ✔ | e.g. "13th Month Pay" |
| `kind` | String | ✔ | `months` (N months of pay) / `fixed` (₱ amount) / `percent` (% of gross) |
| `value` | Number | ✔ | Months / amount / percent value |
| `desc` | String | ✘ | Description |
| `status` | String | ✔ | `Active` / `Inactive` |
| `deMinimis` | Boolean | ✘ | True = BIR de minimis (tax-exempt, not in ₱90k pool) |

**Note:** The statutory 13th Month Pay is Bonus Type `id=1` (kind `months`, value 1).

**Example:**
```json
{ "id": 1, "name": "13th Month Pay", "kind": "months", "value": 1,
  "desc": "Statutory bonus per RA 8515", "status": "Active" }
```

---

## 6. PAYROLL RECORDS — Confirmed payslips

**Type:** Array of objects. **Primary key:** implicit (empId + month + year unique).

| Field | Type | Description |
|---|---|---|
| `empId` | Integer | FK → USERS.id |
| `name` | String | Employee name (snapshot) |
| `month` | Integer | 1–12 |
| `monthName` | String | e.g. "December" |
| `year` | Integer | e.g. 2026 |
| `period` | String | e.g. "December 2026" |
| `gross` | Number | Gross pay (taxable base + taxable bonuses) |
| `deMinimisSum` | Number | Total de minimis bonuses (tax-exempt) |
| `thirteenth` | Number | 13th month amount (RA 8515) |
| `thirteenTaxable` | Number | 13th month portion over ₱90,000 exemption |
| `thirteenExempt` | Number | 13th month exempt portion (≤ ₱90,000) |
| `thirteenTax` | Number | Withholding tax on the excess |
| `net` | Number | NET PAY |
| `sss` | Number | SSS contribution |
| `phil` | Number | PhilHealth contribution |
| `pag` | Number | Pag-IBIG contribution |
| `bir` | Number | Withholding tax (TRAIN) |
| `cash` | Number | Cash advance deducted |
| `bonuses` | Array | Applied bonus amounts `[{name, amount, deMinimis}]` |
| `date` | String | Date computed |

**Example:**
```json
{ "empId": 1, "name": "Nash Valencia", "month": 12, "monthName": "December",
  "year": 2026, "period": "December 2026", "gross": 45000, "deMinimisSum": 0,
  "thirteenth": 45000, "thirteenTaxable": 0, "thirteenExempt": 45000,
  "thirteenTax": 0, "net": 83411.67, "sss": 1750, "phil": 1125, "pag": 100,
  "bir": 3613.33, "cash": 0, "bonuses": [], "date": "Aug 7, 2026" }
```

---

## 7. BONUS PAYOUTS — 13th month payout tracking

**Type:** Object. **Primary key:** composite string `"{empId}_{year}"`.

| Field | Type | Description |
|---|---|---|
| key | String | `{empId}_{year}` e.g. `"3_2026"` |
| `date` | String | Date marked as paid |

**Example:**
```json
{ "3_2026": { "date": "Dec 24, 2026" } }
```

---

## 8. DEDUCTION CATEGORIES — Custom deductions

**Type:** Array of objects. **Primary key:** `id` (auto-increment via `nextDedCatId`).

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | Integer | ✔ | Unique category ID |
| `name` | String | ✔ | e.g. "Union Dues" |
| `type` | String | ✔ | `fixed` (₱) / `percent` (% of gross) |
| `amount` | Number | ✔ | Default amount or rate |
| `desc` | String | ✘ | Description |
| `status` | String | ✔ | `Active` / `Inactive` |

**Example:**
```json
{ "id": 1, "name": "Union Dues", "type": "fixed", "amount": 50,
  "desc": "Monthly union contribution", "status": "Active" }
```

---

## 9. PROFILE — Employee contact info

**Type:** Object (single row).

| Field | Type | Description |
|---|---|---|
| `empPhone` | String | Contact number |
| `empAddr` | String | Address |

**Example:**
```json
{ "empPhone": "09171234567", "empAddr": "123 Mabini St., Angeles City, Pampanga" }
```

---

## 10. SSS TABLE — Editable contribution brackets (63 rows)

**Type:** Array of objects. Bracket lookup by monthly salary credit (MSC).

| Field | Type | Description |
|---|---|---|
| `range` | String | MSC range label e.g. "₱9,750 – ₱10,249" |
| `emp` | Number | Employee share (5%) |
| `er` | Number | Employer share (10%) |

**Example:**
```json
{ "range": "₱9,750 – ₱10,249", "emp": 500.00, "er": 1000.00 }
```

Range: "Below ₱5,250" (₱250/₱500) → "₱34,750 and above" (₱1,750/₱3,500).

---

## 11. PHILHEALTH — philData

| Field | Type | Description |
|---|---|---|
| `rate` | Number | 5% |
| `min` | Number | ₱500 (minimum premium) |
| `max` | Number | ₱5,000 (maximum premium) |

```json
{ "rate": 5.00, "min": 500.00, "max": 5000.00 }
```

---

## 12. PAG-IBIG — pagData

| Field | Type | Description |
|---|---|---|
| `rate1` | Number | 1% (salary ≤ ₱1,500) |
| `rate2` | Number | 2% (salary > ₱1,500) |
| `empMax` | Number | Max employee share (₱100) |
| `erMax` | Number | Max employer share (₱100) |

```json
{ "rate1": 1, "rate2": 2, "empMax": 100.00, "erMax": 100.00 }
```

---

## 13. BIR — birData (TRAIN law brackets, 6 rows)

| Field | Type | Description |
|---|---|---|
| `range` | String | Bracket label |
| `base` | Number | Base tax of the bracket |
| `rate` | Number | Marginal tax rate % |

**Values (RA 10963):**
```
Up to ₱250,000          base 0        rate 0%
₱250,001 – ₱400,000     base 0        rate 15%
₱400,001 – ₱800,000     base 22,500   rate 20%
₱800,001 – ₱2,000,000   base 102,500  rate 25%
₱2,000,001 – ₱8,000,000 base 402,500  rate 30%
Above ₱8,000,000        base 2,202,500 rate 35%
```

---

## 14. DATA DICTIONARY SUMMARY

| Entity | Container | PK | Relationship |
|---|---|---|---|
| USERS | Array | id | 1 : 1 AUTH, 1 : 1 CASH ADVANCES, 1 : M PAYROLL RECORDS, 1 : 1 BONUS PAYOUTS |
| AUTH | Object {id:...} | id | 1 : 1 USERS |
| CASH ADVANCES | Object {id:amt} | id | 1 : 1 USERS |
| BONUS TYPES | Array | id | applied to PAYROLL RECORDS.bonuses |
| PAYROLL RECORDS | Array | empId+month+year | M : 1 USERS |
| BONUS PAYOUTS | Object {id_year:...} | empId_year | 1 : 1 USERS per year |
| DEDUCTION CATEGORIES | Array | id | standalone (applied in payroll) |
| PROFILE | Object | single row | standalone |
| SSS TABLE | Array | range | reference |
| PHILHEALTH | Object | single | reference |
| PAG-IBIG | Object | single | reference |
| BIR | Array | range | reference |
