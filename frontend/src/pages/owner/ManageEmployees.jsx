import { useEffect, useState } from "react";
import { UserPlus } from "lucide-react";
import { Link } from "react-router-dom";
import { subscribeToEmployeesList } from "../../services/employeeService";

// Import Reusable Subcomponents
import EmployeeTable from "../../components/employee/EmployeeTable";
import EmptyState from "../../components/employee/EmptyState";
import LoadingState from "../../components/employee/LoadingState";

export default function ManageEmployees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    // Subscribe to employees list in real-time
    const unsubscribe = subscribeToEmployeesList(
      (list) => {
        setEmployees(list);
        setLoading(false);
      },
      (error) => {
        console.error("Error loading employees list:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0d2702]">Manage Employees</h1>
          <p className="text-slate-500 mt-0.5 text-xs font-semibold">
            View profiles, edit billing rates, process payments, and manage settings.
          </p>
        </div>

        <Link
          to="/owner/employees/new"
          className="flex items-center gap-2 px-4 py-2 bg-[#0d2702] hover:bg-[#163c03] text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-colors shadow-sm shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          Add Employee
        </Link>
      </div>


      {/* Loading, Empty, or Table Grid Display */}
      {loading ? (
        <LoadingState />
      ) : employees.length === 0 ? (
        <EmptyState />
      ) : (
        <EmployeeTable employees={employees} />
      )}
    </div>
  );
}
