// Mock HRIS employee records.
// Used while the real HRIS API is still under development.
// Shape mirrors what the real HRIS API returns (snake_case fields).
module.exports = {
  employees: [
    {
      employee_id: 'EMP-013',
      first_name: 'Grace',
      last_name: 'Aquino',
      email: 'grace@rcc.edu.ph',
      password: 'grace123',
      role: 'Employee',
      status: 'Active',
      department: 'College of Nursing',
      classification: 'Teaching',
      salary: 30000,
      hourly_rate: 200,
      hire_date: '2025-06-02',
      hours_worked: 150,
      absence_days: 0
    },
    {
      employee_id: 'EMP-014',
      first_name: 'Mark',
      last_name: 'Dizon',
      email: 'mark@rcc.edu.ph',
      password: 'mark123',
      role: 'Employee',
      status: 'Active',
      department: 'Registrar Office',
      classification: 'Non-Teaching',
      salary: 26000,
      hourly_rate: 0,
      hire_date: '2024-09-01',
      hours_worked: 0,
      absence_days: 0
    },
    {
      employee_id: 'EMP-015',
      first_name: 'Angel',
      last_name: 'Fernandez',
      email: 'angel@rcc.edu.ph',
      password: 'angel123',
      role: 'Finance Officer',
      status: 'Active',
      department: 'Finance Office',
      classification: 'Non-Teaching',
      salary: 38000,
      hourly_rate: 0,
      hire_date: '2023-01-15',
      hours_worked: 0,
      absence_days: 0
    },
    {
      employee_id: 'EMP-016',
      first_name: 'Paolo',
      last_name: 'Gonzales',
      email: 'paolo@rcc.edu.ph',
      password: 'paolo123',
      role: 'Employee',
      status: 'Active',
      department: 'Maintenance Office',
      classification: 'Non-Teaching',
      salary: 19000,
      hourly_rate: 0,
      hire_date: '2025-02-10',
      hours_worked: 0,
      absence_days: 0
    }
  ],
  leaveRecords: [
    {
      employee_email: 'mark@rcc.edu.ph',
      leave_type: 'Sick Leave',
      start_date: '2026-09-01',
      end_date: '2026-09-02',
      days: 2
    },
    {
      employee_email: 'mark@rcc.edu.ph',
      leave_type: 'Personal Leave',
      start_date: '2026-09-15',
      end_date: '2026-09-15',
      days: 1
    },
    {
      employee_email: 'admin@rcc.edu.ph',
      leave_type: 'Vacation Leave',
      start_date: '2026-09-10',
      end_date: '2026-09-11',
      days: 2
    }
  ],
  // Daily attendance (time-in / time-out) per employee.
  // Absence auto-detection: 1 working day (WORK_DAYS baseline) with NO time-in
  // record = 1 absent (unpaid), MINUS any days covered by an approved leave.
  // Dates shown are the Sep 2026 Mon-Fri working days (22 total = WORK_DAYS).
  attendance: [
    // ── admin@rcc.edu.ph (Nash Valencia, Non-Teaching) ──
    // Present 15 working days. Leave-covered days (no time-in expected):
    // Sep 01 (Sick), Sep 04 (Personal), Sep 10-12 (Vacation). Absent days with
    // no time-in and no leave: Sep 07, 22, 29 → 3 unpaid absences.
    { employee_email: 'admin@rcc.edu.ph', date: '2026-09-02', time_in: '07:58', time_out: '17:01' },
    { employee_email: 'admin@rcc.edu.ph', date: '2026-09-03', time_in: '08:00', time_out: '16:58' },
    { employee_email: 'admin@rcc.edu.ph', date: '2026-09-08', time_in: '07:55', time_out: '17:03' },
    { employee_email: 'admin@rcc.edu.ph', date: '2026-09-09', time_in: '08:01', time_out: '17:00' },
    { employee_email: 'admin@rcc.edu.ph', date: '2026-09-14', time_in: '08:00', time_out: '17:01' },
    { employee_email: 'admin@rcc.edu.ph', date: '2026-09-15', time_in: '07:57', time_out: '17:04' },
    { employee_email: 'admin@rcc.edu.ph', date: '2026-09-16', time_in: '08:04', time_out: '16:59' },
    { employee_email: 'admin@rcc.edu.ph', date: '2026-09-17', time_in: '08:02', time_out: '17:00' },
    { employee_email: 'admin@rcc.edu.ph', date: '2026-09-18', time_in: '07:56', time_out: '17:05' },
    { employee_email: 'admin@rcc.edu.ph', date: '2026-09-21', time_in: '08:06', time_out: '17:02' },
    { employee_email: 'admin@rcc.edu.ph', date: '2026-09-23', time_in: '08:00', time_out: '17:01' },
    { employee_email: 'admin@rcc.edu.ph', date: '2026-09-24', time_in: '07:58', time_out: '17:00' },
    { employee_email: 'admin@rcc.edu.ph', date: '2026-09-25', time_in: '08:01', time_out: '16:57' },
    { employee_email: 'admin@rcc.edu.ph', date: '2026-09-28', time_in: '07:55', time_out: '17:03' },
    { employee_email: 'admin@rcc.edu.ph', date: '2026-09-30', time_in: '08:03', time_out: '17:00' },
    // ── finance@rcc.edu.ph (John Cabigting, Non-Teaching) ──
    // Present all 22 working days → 0 absences.
    { employee_email: 'finance@rcc.edu.ph', date: '2026-09-01', time_in: '08:00', time_out: '17:00' },
    { employee_email: 'finance@rcc.edu.ph', date: '2026-09-02', time_in: '08:00', time_out: '17:00' },
    { employee_email: 'finance@rcc.edu.ph', date: '2026-09-03', time_in: '08:00', time_out: '17:00' },
    { employee_email: 'finance@rcc.edu.ph', date: '2026-09-04', time_in: '08:00', time_out: '17:00' },
    { employee_email: 'finance@rcc.edu.ph', date: '2026-09-07', time_in: '08:00', time_out: '17:00' },
    { employee_email: 'finance@rcc.edu.ph', date: '2026-09-08', time_in: '08:00', time_out: '17:00' },
    { employee_email: 'finance@rcc.edu.ph', date: '2026-09-09', time_in: '08:00', time_out: '17:00' },
    { employee_email: 'finance@rcc.edu.ph', date: '2026-09-10', time_in: '08:00', time_out: '17:00' },
    { employee_email: 'finance@rcc.edu.ph', date: '2026-09-11', time_in: '08:00', time_out: '17:00' },
    { employee_email: 'finance@rcc.edu.ph', date: '2026-09-14', time_in: '08:00', time_out: '17:00' },
    { employee_email: 'finance@rcc.edu.ph', date: '2026-09-15', time_in: '08:00', time_out: '17:00' },
    { employee_email: 'finance@rcc.edu.ph', date: '2026-09-16', time_in: '08:00', time_out: '17:00' },
    { employee_email: 'finance@rcc.edu.ph', date: '2026-09-17', time_in: '08:00', time_out: '17:00' },
    { employee_email: 'finance@rcc.edu.ph', date: '2026-09-18', time_in: '08:00', time_out: '17:00' },
    { employee_email: 'finance@rcc.edu.ph', date: '2026-09-21', time_in: '08:00', time_out: '17:00' },
    { employee_email: 'finance@rcc.edu.ph', date: '2026-09-22', time_in: '08:00', time_out: '17:00' },
    { employee_email: 'finance@rcc.edu.ph', date: '2026-09-23', time_in: '08:00', time_out: '17:00' },
    { employee_email: 'finance@rcc.edu.ph', date: '2026-09-24', time_in: '08:00', time_out: '17:00' },
    { employee_email: 'finance@rcc.edu.ph', date: '2026-09-25', time_in: '08:00', time_out: '17:00' },
    { employee_email: 'finance@rcc.edu.ph', date: '2026-09-28', time_in: '08:00', time_out: '17:00' },
    { employee_email: 'finance@rcc.edu.ph', date: '2026-09-29', time_in: '08:00', time_out: '17:00' },
    { employee_email: 'finance@rcc.edu.ph', date: '2026-09-30', time_in: '08:00', time_out: '17:00' },
    // ── employee@rcc.edu.ph (Jhon Gerald Batuaan, Teaching) ──
    // Attendance tracked for reference; Teaching pay uses hours, not absences.
    { employee_email: 'employee@rcc.edu.ph', date: '2026-09-01', time_in: '07:50', time_out: '16:00' },
    { employee_email: 'employee@rcc.edu.ph', date: '2026-09-02', time_in: '07:55', time_out: '16:10' },
    { employee_email: 'employee@rcc.edu.ph', date: '2026-09-03', time_in: '07:48', time_out: '15:50' },
    { employee_email: 'employee@rcc.edu.ph', date: '2026-09-04', time_in: '08:05', time_out: '16:05' },
    { employee_email: 'employee@rcc.edu.ph', date: '2026-09-07', time_in: '07:52', time_out: '16:00' },
    { employee_email: 'employee@rcc.edu.ph', date: '2026-09-08', time_in: '07:58', time_out: '16:08' },
    { employee_email: 'employee@rcc.edu.ph', date: '2026-09-09', time_in: '07:47', time_out: '15:55' },
    { employee_email: 'employee@rcc.edu.ph', date: '2026-09-10', time_in: '08:00', time_out: '16:02' },
    { employee_email: 'employee@rcc.edu.ph', date: '2026-09-11', time_in: '07:54', time_out: '16:00' },
    { employee_email: 'employee@rcc.edu.ph', date: '2026-09-14', time_in: '07:51', time_out: '15:58' },
    { employee_email: 'employee@rcc.edu.ph', date: '2026-09-15', time_in: '08:02', time_out: '16:10' },
    { employee_email: 'employee@rcc.edu.ph', date: '2026-09-16', time_in: '07:49', time_out: '16:00' },
    { employee_email: 'employee@rcc.edu.ph', date: '2026-09-17', time_in: '07:56', time_out: '15:52' },
    { employee_email: 'employee@rcc.edu.ph', date: '2026-09-18', time_in: '08:04', time_out: '16:06' },
    { employee_email: 'employee@rcc.edu.ph', date: '2026-09-21', time_in: '07:53', time_out: '16:00' },
    { employee_email: 'employee@rcc.edu.ph', date: '2026-09-22', time_in: '07:57', time_out: '16:04' },
    { employee_email: 'employee@rcc.edu.ph', date: '2026-09-23', time_in: '07:46', time_out: '15:54' },
    { employee_email: 'employee@rcc.edu.ph', date: '2026-09-24', time_in: '08:01', time_out: '16:00' },
    { employee_email: 'employee@rcc.edu.ph', date: '2026-09-25', time_in: '07:55', time_out: '16:02' },
    { employee_email: 'employee@rcc.edu.ph', date: '2026-09-28', time_in: '07:50', time_out: '15:59' },
    { employee_email: 'employee@rcc.edu.ph', date: '2026-09-29', time_in: '08:03', time_out: '16:07' },
    { employee_email: 'employee@rcc.edu.ph', date: '2026-09-30', time_in: '07:52', time_out: '16:00' }
  ]
};
