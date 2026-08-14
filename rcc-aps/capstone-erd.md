# RCC-APS Entity Relationship Diagram (ERD)

> Based on the actual data model of the system (db.json / saveDemo() state).
> Feed this to any AI to generate a formal crow's-foot / Chen ERD diagram.

---

## 1. Legend

| Notation | Meaning |
|---|---|
| 🔑 **PK** | Primary Key |
| **FK** | Foreign Key |
| `1 : 1` | One-to-one relationship |
| `1 : M` | One-to-many relationship |
| *Optional* | Relationship that may not always exist |

---

## 2. RELATIONSHIP OVERVIEW

```
┌────────────┐  1         1 ┌──────────────┐  1           1 ┌─────────────┐
│  USERS     │ ──────────── │  AUTH        │ ────────────── │  HRIS       │
│ (employee) │              │ (login acct) │                │ (external)  │
└─────┬──────┘              └──────────────┘                └─────────────┘
      │ 1
      │
      ├───────────────┐
      │               │
      ▼               ▼
┌─────────────┐  ┌──────────────────┐
│ PAYROLL     │  │ CASH ADVANCE     │
│ RECORDS     │  │ (per employee)   │
│ (payslip)   │  └──────────────────┘
└─────────────┘
      ▲               ▲
      │               │
┌─────────────┐  ┌──────────────────┐
│ BONUS       │  │ BONUS PAYOUTS    │
│ TYPES       │  │ (13th-month pay) │
│ (reference) │  └──────────────────┘
└─────────────┘
```

---

## 3. ENTITIES

### 3.1 USERS (Employee / User master record)
**Description:** Master list of all employees and system users.

| Attribute | Type | Key | Notes |
|---|---|---|---|
| id | Integer | 🔑 PK | Auto-increment (nextUserId) |
| first | String | | First name |
| last | String | | Last name |
| email | String | | Unique — used for login |
| role | String | | `System Admin` / `Finance Officer` / `Employee` |
| status | String | | `Active` / `Inactive` |
| date | String | | Date added to system |
| salary | Number | | Monthly base salary (Non-Teaching) |
| classification | String | | `Teaching` / `Non-Teaching` |
| department | String | | e.g. College of Computer Studies |
| hireDate | String | | Date hired |
| endDate | String | *Optional* | Date of separation (Inactive users) |
| hourlyRate | Number | *Optional* | Teaching only |
| hoursWorked | Number | *Optional* | Teaching only (default attendance) |

### 3.2 AUTH (Login credentials)
**Description:** Login accounts. One-to-one with USERS.

| Attribute | Type | Key | Notes |
|---|---|---|---|
| id | Integer | 🔑 PK | Matches USERS.id |
| email | String | | Login email (lowercase) |
| pass | String | | Login password (plain text in demo) |
| label | String | | Role label |
| icon | String | | Role icon (emoji) |
| page | String | | Landing page per role |
| role | String | | `admin` / `finance` / `employee` |
| status | String | | `Active` / `Inactive` (blocks login) |

**Relationship:** USERS `1 : 1` AUTH — one employee has exactly one login account.

### 3.3 CASH ADVANCES
**Description:** Cash advance amount per employee, keyed by employee id.

| Attribute | Type | Key | Notes |
|---|---|---|---|
| key | Integer | 🔑 PK | = USERS.id (object key) |
| amount | Number | | Cash advance deducted from payroll |

**Relationship:** USERS `1 : 1` CASH ADVANCES — one employee has at most one cash advance balance.

### 3.4 BONUS TYPES (Reference table)
**Description:** Configurable bonus types (e.g. 13th Month Pay). Applied during payroll computation.

| Attribute | Type | Key | Notes |
|---|---|---|---|
| id | Integer | 🔑 PK | Auto-increment (nextBonusId) |
| name | String | | e.g. "13th Month Pay" |
| kind | String | | `months` / `fixed` / `percent` |
| value | Number | | Number of months / fixed amount / percent |
| desc | String | | Description |
| status | String | | `Active` / `Inactive` |
| deMinimis | Boolean | *Optional* | BIR de minimis exempt bonus |

### 3.5 PAYROLL RECORDS (Payslips)
**Description:** Confirmed payroll computations per employee per period.

| Attribute | Type | Key | Notes |
|---|---|---|---|
| empId | Integer | FK | → USERS.id |
| name | String | | Employee name (denormalized snapshot) |
| month | Integer | | 1–12 |
| monthName | String | | e.g. "December" |
| year | Integer | | e.g. 2026 |
| period | String | | e.g. "December 2026" |
| gross | Number | | Gross pay |
| deMinimisSum | Number | | Sum of de minimis bonuses |
| thirteenth | Number | | 13th-month amount (RA 8515) |
| thirteenTaxable | Number | | Taxable portion |
| thirteenExempt | Number | | Exempt portion (≤ ₱90,000) |
| thirteenTax | Number | | Tax on excess |
| net | Number | | NET PAY |
| sss | Number | | SSS contribution |
| phil | Number | | PhilHealth contribution |
| pag | Number | | Pag-IBIG contribution |
| bir | Number | | Withholding tax |
| cash | Number | | Cash advance deducted |
| bonuses | Array | | List of applied bonus amounts |
| date | String | | Date computed |

**Relationship:** USERS `1 : M` PAYROLL RECORDS — one employee has many payslips (one per period).

### 3.6 BONUS PAYOUTS (13th-month tracking)
**Description:** Tracks which employees were marked paid for 13th-month pay per year.

| Attribute | Type | Key | Notes |
|---|---|---|---|
| key | String | 🔑 PK | Composite: `{empId}_{year}` |
| date | String | | Date marked as paid |

**Relationship:** USERS `1 : 1` BONUS PAYOUTS per year — one employee per year has one payout record.

### 3.7 DEDUCTION CATEGORIES (Custom deductions)
**Description:** Other custom deduction categories created by Finance (e.g. union dues, loans).

| Attribute | Type | Key | Notes |
|---|---|---|---|
| id | Integer | 🔑 PK | Auto-increment (nextDedCatId) |
| name | String | | Category name |
| type | String | | `fixed` (₱) / `percent` (% of gross) |
| amount | Number | | Default amount or rate |
| desc | String | | Description |
| status | String | | `Active` / `Inactive` |

### 3.8 PROFILE (Employee self-service info)
**Description:** Single-row record of the employee's contact details.

| Attribute | Type | Key | Notes |
|---|---|---|---|
| empPhone | String | | Contact number |
| empAddr | String | | Address |

---

## 4. REFERENCE DATA (rate tables — not stored in db.json, defined in JS)

### 4.1 SSS TABLE (editable)
| Attribute | Type | Notes |
|---|---|---|
| min | Number | MSC lower bound (₱5,000 → ₱35,000, 63 brackets) |
| max | Number | MSC upper bound |
| emp | Number | Employee share (5%) |
| er | Number | Employer share (10%) |

### 4.2 PHILHEALTH (philData)
| Attribute | Type | Notes |
|---|---|---|
| rate | Number | 5% |
| min | Number | ₱500 |
| max | Number | ₱5,000 |

### 4.3 PAG-IBIG (pagData)
| Attribute | Type | Notes |
|---|---|---|
| rate1 | Number | 1% (salary ≤ 1,500) |
| rate2 | Number | 2% (salary > 1,500) |
| empMax | Number | Max employee share (₱100) |
| erMax | Number | Max employer share (₱100) |

### 4.4 BIR (birData)
| Attribute | Type | Notes |
|---|---|---|
| base | Number | Bracket floor (TRAIN law, 6 brackets) |
| rate | Number | Tax rate % |

---

## 5. RELATIONSHIP MATRIX

| From | To | Cardinality | FK / Key |
|---|---|---|---|
| USERS | AUTH | 1 : 1 | USERS.id = AUTH.id |
| USERS | CASH ADVANCES | 1 : 1 | USERS.id = key |
| USERS | PAYROLL RECORDS | 1 : M | USERS.id = empId |
| USERS | BONUS PAYOUTS | 1 : 1 (per year) | `{empId}_{year}` |
| BONUS TYPES | PAYROLL RECORDS | M : N (via bonuses array) | bonuses[] |
| USERS | HRIS | 1 : 1 | email match |
| DEDUCTION CATEGORIES | PAYROLL RECORDS | M : N (by design) | name/type |

---

## 6. CROW'S-FOOT SUMMARY

```
USERS ────────||──── AUTH                    (one-to-one, mandatory)
USERS ────────||──── CASH ADVANCES           (one-to-one, optional)
USERS ────────||──< PAYROLL RECORDS          (one-to-many)
USERS ────────||──── BONUS PAYOUTS           (one-to-one per year)
BONUS TYPES ──>── PAYROLL RECORDS            (applied in bonuses[])
```

---

## 7. SIMPLIFIED DIAGRAM (for capstone slide)

```
                    ┌──────────────────┐
                    │      USERS       │
                    │  PK id           │
                    │  first, last     │
                    │  email (unique)  │
                    │  role, status    │
                    │  salary, dept    │
                    │  hireDate        │
                    └────────┬─────────┘
                   1│         │1         │1
                 ┌──┴──┐  ┌──┴─────┐  ┌──┴─────────────┐
                 │AUTH │  │CASH    │  │BONUS PAYOUTS   │
                 │PK id│  │ADVANCE │  │PK {empId_year} │
                 │email│  │PK id   │  │date            │
                 │pass │  │amount  │  └────────────────┘
                 │role │  └────────┘
                 │page │
                 └─────┘
                   1│
                 ┌──┴──────────────┐
                 │ PAYROLL RECORDS │
                 │ FK empId        │
                 │ period, gross   │
                 │ sss, phil, pag  │
                 │ bir, net, 13th  │
                 └─────────────────┘
```
