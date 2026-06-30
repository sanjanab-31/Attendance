import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import ErrorBoundary from "./components/ErrorBoundary";

// Layout
import DashboardLayout from "./layouts/DashboardLayout";

// Loading component for Suspense fallback code-splitting
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="w-10 h-10 border-4 border-primary-dark border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}

// Lazy Load Pages
const Login = lazy(() => import("./pages/Login"));
const ChangePassword = lazy(() => import("./pages/ChangePassword"));

// Owner Pages
const OwnerDashboard = lazy(() => import("./pages/owner/Dashboard"));
const ManageEmployees = lazy(() => import("./pages/owner/ManageEmployees"));
const CreateEmployee = lazy(() => import("./pages/owner/CreateEmployee"));
const EmployeeDetail = lazy(() => import("./pages/owner/EmployeeDetail"));
const AttendanceEntry = lazy(() => import("./pages/owner/AttendanceEntry"));
const Reports = lazy(() => import("./pages/owner/Reports"));
const OwnerProfile = lazy(() => import("./pages/owner/Profile"));

// Employee Pages
const EmployeeDashboard = lazy(() => import("./pages/employee/Dashboard"));
const EmployeeProfile = lazy(() => import("./pages/employee/Profile"));
const EmployeeAttendance = lazy(() => import("./pages/employee/Attendance"));
const EmployeePayments = lazy(() => import("./pages/employee/Payments"));

// Guard for authenticated users
function RequireAuth({ children, allowedRoles }) {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary-dark border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Mandatory password change check
  if (currentUser.mustChangePassword && location.pathname !== "/change-password") {
    return <Navigate to="/change-password" replace />;
  }

  // Check role authorization
  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    if (currentUser.role === "owner") {
      return <Navigate to="/owner/dashboard" replace />;
    } else {
      return <Navigate to="/employee/dashboard" replace />;
    }
  }

  return children;
}

// Redirect root to dashboard/login
function RootRedirect() {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary-dark border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (currentUser.mustChangePassword) {
    return <Navigate to="/change-password" replace />;
  }

  if (currentUser.role === "owner") {
    return <Navigate to="/owner/dashboard" replace />;
  } else {
    return <Navigate to="/employee/dashboard" replace />;
  }
}

function AppContent() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public Route */}
        <Route path="/login" element={<Login />} />

        {/* Mandatory Password Change Route */}
        <Route
          path="/change-password"
          element={
            <RequireAuth>
              <ChangePassword />
            </RequireAuth>
          }
        />

        {/* Owner Console Layout */}
        <Route
          path="/owner"
          element={
            <RequireAuth allowedRoles={["owner"]}>
              <DashboardLayout />
            </RequireAuth>
          }
        >
          <Route path="dashboard" element={<OwnerDashboard />} />
          <Route path="employees" element={<ManageEmployees />} />
          <Route path="employees/new" element={<CreateEmployee />} />
          <Route path="employees/:uid" element={<EmployeeDetail />} />
          <Route path="attendance" element={<AttendanceEntry />} />
          <Route path="reports" element={<Reports />} />
          <Route path="profile" element={<OwnerProfile />} />
        </Route>

        {/* Employee Console Layout */}
        <Route
          path="/employee"
          element={
            <RequireAuth allowedRoles={["employee"]}>
              <DashboardLayout />
            </RequireAuth>
          }
        >
          <Route path="dashboard" element={<EmployeeDashboard />} />
          <Route path="profile" element={<EmployeeProfile />} />
          <Route path="attendance" element={<EmployeeAttendance />} />
          <Route path="payments" element={<EmployeePayments />} />
        </Route>

        {/* Index Redirect */}
        <Route path="/" element={<RootRedirect />} />

        {/* Catch-all fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <Router>
            <AppContent />
          </Router>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}
