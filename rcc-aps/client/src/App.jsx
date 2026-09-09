import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import DeductionTables from './pages/admin/DeductionTables';
import FinanceDashboard from './pages/finance/FinanceDashboard';
import PayrollCalculator from './pages/finance/PayrollCalculator';
import BonusManagement from './pages/finance/BonusManagement';
import Reports from './pages/finance/Reports';
import Analytics from './pages/finance/Analytics';
import FinanceDeductions from './pages/finance/FinanceDeductions';
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import PayslipViewer from './pages/employee/PayslipViewer';
import ProfilePage from './pages/ProfilePage';
import ChangePasswordPage from './pages/ChangePasswordPage';

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  const page = user.page || (user.role === 'admin' ? 'adminPage' : user.role === 'finance' ? 'financePage' : 'empPage');
  return <Navigate to={{ adminPage: '/admin', financePage: '/finance', empPage: '/employee' }[page] || '/login'} replace />;
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<UserManagement />} />
          <Route path="/admin/deductions" element={<DeductionTables />} />
          <Route path="/admin/payslip" element={<PayslipViewer />} />
          <Route path="/admin/profile" element={<ProfilePage />} />
          <Route path="/admin/password" element={<ChangePasswordPage />} />
          <Route path="/finance" element={<FinanceDashboard />} />
          <Route path="/finance/analytics" element={<Analytics />} />
          <Route path="/finance/payroll" element={<PayrollCalculator />} />
          <Route path="/finance/bonus" element={<BonusManagement />} />
          <Route path="/finance/reports" element={<Reports />} />
          <Route path="/finance/deductions" element={<FinanceDeductions />} />
          <Route path="/finance/payslip" element={<PayslipViewer />} />
          <Route path="/finance/profile" element={<ProfilePage />} />
          <Route path="/finance/password" element={<ChangePasswordPage />} />
          <Route path="/employee" element={<EmployeeDashboard />} />
          <Route path="/employee/payslip" element={<PayslipViewer />} />
          <Route path="/employee/profile" element={<ProfilePage />} />
          <Route path="/employee/password" element={<ChangePasswordPage />} />
        </Route>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;