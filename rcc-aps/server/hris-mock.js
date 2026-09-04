// Mock HRIS employee records.
// Used while the real HRIS API is still under development.
// Shape mirrors what the real HRIS API returns (snake_case fields).
module.exports = {
  employees: [
    {
      employee_id: 'EMP-001',
      first_name: 'Nash',
      last_name: 'Valencia',
      email: 'admin@rcc.edu.ph',
      password: 'admin123',
      role: 'System Admin',
      status: 'Active',
      department: 'IT Office',
      classification: 'Non-Teaching',
      salary: 45000,
      hourly_rate: 0,
      hire_date: '2022-01-10',
      hours_worked: 0,
      absence_days: 0
    },
    {
      employee_id: 'EMP-002',
      first_name: 'John',
      last_name: 'Cabigting',
      email: 'finance@rcc.edu.ph',
      password: 'finance123',
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
      employee_id: 'EMP-003',
      first_name: 'Jhon Gerald',
      last_name: 'Batuaan',
      email: 'employee@rcc.edu.ph',
      password: 'employee123',
      role: 'Employee',
      status: 'Active',
      department: 'College of Computer Studies',
      classification: 'Teaching',
      salary: 28500,
      hourly_rate: 190,
      hire_date: '2024-08-01',
      hours_worked: 150,
      absence_days: 0
    }
  ],
  leaveRecords: [
    {
      employee_email: 'admin@rcc.edu.ph',
      leave_type: 'Vacation Leave',
      start_date: '2026-09-10',
      end_date: '2026-09-12',
      days: 3
    }
  ]
};
