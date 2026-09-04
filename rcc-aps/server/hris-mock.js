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
      end_date: '2026-09-12',
      days: 3
    }
  ]
};
