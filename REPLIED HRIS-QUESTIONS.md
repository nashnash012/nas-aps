# HRIS Data Requirements — RCC-APS Payroll System

**Petsa:** September 4, 2026
**Hinihingi ni:** RCC-APS Payroll System Development Team
**Para kay:** HRIS System / IT Administrator

Mahal naming HRIS team,

Gumagawa kami ng payroll system na magre-require ng data mula sa inyong HRIS para sa:
- Pagkalkula ng sahod (gross pay)
- Pag-detect ng mga absent (walang time-in)
- Pagrerecord ng mga approved leaves
- Pagkakaiba ng Teaching (hours-work) at Non-Teaching (monthly) empleyado

Upang maiwasan ang mga mali sa pagkuha ng data at sa pagkalkula, pakiusap naming sagutin ang mga sumusunod na tanong. Pwede ninyong isulat ang mga sagot mismo sa file na ito (may espasyo para sa "Sagot:" sa bawat tanong).

Maraming salamat!

---

## 1. DATA FORMAT (API)

- [ ] Ano ang eksaktong **API endpoint (URL)** para sa:
  - Listahan ng empleyado?
  - Attendance records?
  - Leave records?
  - (Sagot:)
- [ ] May **authentication** ba (API key, token, OAuth)? Paano ito makukuha?
  - (Sagot:)
- [ ] Anong **HTTP method** ang gagamitin (GET/POST)?
  - (Sagot:)
- [ ] Sa **field names**: snake_case (`time_in`) o camelCase (`timeIn`)? Pakilista ang eksaktong spelling ng bawat field.
  - (Sagot:)
- [ ] Ang response ba ay **JSON**? May **pagination** ba kung malaki o maraming records?
  - (Sagot:)
- [ ] Hanggang **kailan** ang historical data na available (hal. nakaraang buwan/taon)?
  - (Sagot:)
- [ ] Paano dumarating ang **oras** — string (`"08:00"`), timestamp, o may timezone?
  - (Sagot:)

---

## 2. ATTENDANCE

- [ ] May **time_in / time_out** ba kada araw, o may direktang **`hours_worked`** lang?
  - (Sagot:)
- [ ] Kung time_in/time_out: **isang record ba kada araw**, o dalawa (may afternoon reporting)?
  - (Sagot:)
- [ ] Paano ninyo hinahawakan ang **graveyard shift** (time_in 22:00 → time_out 06:00)? Saan araw ito nirerecord?
  - (Sagot:)
- [ ] Kung `hours_worked`: **per day** ba ito, o kabuuan na ng buwan? Bawas na ba ang **break/lunch** o hindi pa?
  - (Sagot:)
- [ ] Paano hawak ang **overtime** — kasama sa parehong field o hiwalay na field?
  - (Sagot:)
- [ ] Paano hawak ang **late** — may hiwalay na marker o pareho lang sa attendance?
  - (Sagot:)
- [ ] May karagdagang field ba sa attendance gaya ng `leave` o `absence` indicator?
  - (Sagot:)

---

## 3. ABSENCES & LEAVES

- [ ] Paano ninyo **ini-flag ang absent** — may field ba gaya ng `absence_days`, o wala at kailangan naming i-deduce (walang time-in = absent)?
  - (Sagot:)
- [ ] Paano ang **leave** — may `leave_type` (Sick, Vacation, Personal, atbp.) at `status` (approved/pending/rejected) ba?
  - (Sagot:)
- [ ] **Hiwalay ba** ang "absent" at "approved leave"? (Ibig sabihin: kung may approved leave ang empleyado sa araw na iyon, hindi ba siya tatawaging absent?)
  - (Sagot:)
- [ ] May hiwalay bang counter per buwan para sa `absence_days` at `leave_days`?
  - (Sagot:)

---

## 4. TEACHING vs NON-TEACHING (pinaka-mahalaga)

- [ ] Para sa **Teaching (hours-work)**: anong field ang gagamitin sa payroll — **oras** o **days absent**?
  - (Sagot:)
- [ ] **Ilang oras = 1 absent day** para sa hours-work employees? (Hal. 8, 10, o 12 oras?)
  - (Sagot:)
- [ ] May pinagkaiba ba ang HRIS record ng **Teaching** vs **Non-Teaching** na empleyado?
  - (Sagot:)

---

## 5. RELIABILITY & MATCHING

- [ ] **Real-time** ba ang update ng data, o may schedule (hal. end-of-day batch run)?
  - (Sagot:)
- [ ] May **unique employee ID** ba sa bawat record, para mai-match namin sa aming system (at maiwasan ang duplicate sa kaparehong pangalan)?
  - (Sagot:)
- [ ] Nasa response ba ang **status** ng empleyado (active/inactive)?
  - (Sagot:)
- [ ] Paano namin hahahawakan ang mga empleyado na **wala sa HRIS** (terminated o bagong-hire) para hindi magkasalungat ang pagbilang?
  - (Sagot:)

---

## Buod ng Pinakamahalagang Sagot na Kailangan Namin

Para sa maayos na pagkalkula, ito ang mga sagot na lubos naming kailangan muna:

1. May **time_in/time_out** ba o **hours_worked** lang ang data ng attendance?
2. **Ilang oras = 1 absent day** para sa Teaching (hours-work)?
3. Hiwalay ba ang **absent** at **approved leave**?
4. Ano ang eksaktong **field names** at **endpoint** ng API?

---
---

# MGA SAGOT MULA SA HRIS (RCC-HIROS)

**Sagot ni:** RCC-HIROS IT Administrator / System Developer
Petsa: Setyembre 4, 2026

---

## 1. DATA FORMAT (API)

- **API endpoints:**
  - Listahan ng empleyado: `GET /api/employees`
  - Attendance records: `GET /api/attendance`
  - Leave records: `GET /api/leave-requests`

- **Authentication:** JWT Bearer token (HS256, 8-hour expiry). Login sa `POST /api/auth/login` gamit ang `identifier` (Employee ID o email) + `password`. I-send ang token bilang `Authorization: Bearer <token>` sa lahat ng requests.

- **HTTP method:** `GET` para sa lahat ng read operations.

- **Field names:** Lahat ay **camelCase** — hal. `clockInAt`, `employeeId`, `leaveTypeId`, `firstName`, `lastName`, `contractType`, `startDate`, `endDate`, `workdays`, `status`.

- **Response format:** JSON. **Walang pagination** — bumabalik ang buong dataset. Gumamit ng date range filters (`dateFrom`/`dateTo`) o `employeeId` filter para limitahan ang results.

- **Historical data:** Lahat ng data mula noong i-deploy ang system (Agosto 2026). Walang artificial cutoff.

- **Time format:** ISO 8601 UTC strings — hal. `"2026-09-01T07:58:23.000Z"`. I-convert sa `Asia/Manila` (UTC+8) sa inyong side.

---

## 2. ATTENDANCE

- **May time_in/time_out ba o hours_worked lang?** May `clockInAt` at `clockOutAt` (DateTime fields). **Walang `hours_worked` field** — kailangan i-compute mula sa `clockOutAt - clockInAt`.

- **Isang record ba kada araw?** Oo, **isang record lang bawat empleyado bawat araw** (enforced ng unique constraint `@@unique([employeeId, date])`).

- **Graveyard shift:** Hindi specifically hawak. Kung ang clock-in ay 22:00 at clock-out ay 06:00, magiging negatibo ang duration kung diretso i-compute. I-check kung `clockOutAt < clockInAt` at i-add ang 24 hours.

- **`hours_worked` (kung meron):** Walang `hours_worked` field. I-compute mula sa `clockInAt`/`clockOutAt`. Walang break/lunch tracking — kailangan i-subtract kung kinakailangan.

- **Overtime:** **Hindi naka-track.** Walang overtime field sa schema.

- **Late:** **Hindi naka-track.** Walang late/lateness field sa schema.

- **Karagdagang fields:** GPS coordinates (`clockInLat`, `clockInLng`, `clockOutLat`, `clockOutLng`), on-premise flag (`clockInOnPremise`, `clockOutOnPremise`), distance mula sa campus, biometric verification flag, manual edit flag.

---

## 3. ABSENCES & LEAVES

- **Paano ini-flag ang absent?** Walang explicit field. **Kung walang attendance record para sa isang workday = absent.** Kailangan i-cross-reference ang mga petsa para ma-detect ang mga absent.

- **Leave:** Oo — may `leaveTypeId` (FK sa `LeaveType` na may `name` at `code`) at `status` (6-state workflow: `draft` → `pending_l1` → `pending_l2` → `approved` / `rejected` / `cancelled`). Dalawang level ng approval.

- **Hiwalay ba ang "absent" at "approved leave"?** Oo, hiwalay sila. Ang empleyado na may approved leave sa isang araw ay maaaring may o walang attendance record. Kailangan niyong i-exclude ang mga araw na may approved leaves mula sa absence calculations.

- **Monthly counters:** Ang `LeaveBalance` model ay nagte-track ng `totalDays` at `usedDays` bawat empleyado bawat leave type bawat taon.

---

## 4. TEACHING vs NON-TEACHING

- **Para sa Teaching (hours-work): anong field ang gagamitin?** Gamitin ang `clockInAt`/`clockOutAt` para i-compute ang mga oras.

- **Ilang oras = 1 absent day?** **Hindi tinukoy sa HRIS.** Ito ay payroll policy decision — kailangan niyong tukuyin (karaniwan ay 8 oras).

- **May pinagkaiba ba ang HRIS record ng Teaching vs Non-Teaching?** **Wala sa schema.** Walang `employeeType` field. Ang pinakamalapit ay `contractType` (`"Regular"`, `"Contractual"`, `"Part-Time"`). Kung kailangan niyong i-distinguish ang teaching vs non-teaching, kailangan mag-add ng field.

---

## 5. RELIABILITY & MATCHING

- **Real-time ba ang update?** Oo — agad na nag-update ang data kapag nag-clock in/out at kapag nag-submit/approve ng leave.

- **May unique employee ID ba?** Oo — ang `employeeId` field (format `"EMP-0001"`) ay unique bawat empleyado. Mayroon ding internal `id` (CUID).

- **Nasa response ba ang status ng empleyado?** Oo — may `active: Boolean` field sa Employee. `false` = inactive/terminated.

- **Paano hahawakan ang mga empleyado na wala sa HRIS?** Ituring ang HRIS bilang source of truth. Kung ang empleyado ay wala sa HRIS (terminated/o bagong-hire pa lang), i-skip sila. Kung ang empleyado ay nasa HRIS pero wala sa payroll, iyon ay payroll-side issue.

---

## Buod ng mga Sagot (Quick Reference)

1. **May time_in/time_out ba o hours_worked?** → May `clockInAt`/`clockOutAt`. Walang `hours_worked` — i-compute.
2. **Ilang oras = 1 absent day?** → Hindi defined sa HRIS. I-decide sa payroll policy (default: 8 oras).
3. **Hiwalay ba ang absent at approved leave?** → Oo. I-cross-reference: kung may approved leave, huwag i-count bilang absent.
4. **Mga field names at endpoint?** → Lahat camelCase. Endpoints: `/api/employees`, `/api/attendance`, `/api/leave-requests`. Auth: JWT Bearer token.

---

**Mga Kailangan I-clarify / I-add sa HRIS para sa Payroll Integration:**

1. **Teaching vs Non-Teaching field** — Walang `employeeType` field sa schema. Kailangan i-add kung gusto niyong i-automate ang pagkakaiba ng calculation.
2. **Overtime tracking** — Hindi naka-track sa attendance. Kung kailangan, kailangan i-add na field.
3. **Late tracking** — Hindi naka-track. Kung kailangan, kailangan i-add na field.
4. **Hours per workday** — Hindi defined sa HRIS. I-set bilang constant sa payroll system (hal. 8 oras para sa regular, iba para sa teaching).
