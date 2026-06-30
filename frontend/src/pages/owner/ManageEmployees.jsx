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
    <div className="flex flex-col h-full space-y-6 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-extrabold text-primary-dark">Manage Employees</h1>
          <p className="text-slate-500 mt-0.5 text-sm font-semibold">
            View profiles, edit billing rates, process payments, and manage settings.
          </p>
        </div>

        <Link
          to="/owner/employees/new"
          className="flex items-center gap-2 px-4 py-2 bg-primary-dark hover:bg-primary text-white font-bold text-sm uppercase tracking-wider rounded-lg transition-colors shadow-sm shrink-0"
        >
          <UserPlus className="w-5 h-5" />
          Add Employee
        </Link>
      </div>


      {/* Loading, Empty, or Table Grid Display */}
      <div className="flex-1 min-h-0 overflow-hidden rounded-xl">
        {loading ? (
          <LoadingState />
        ) : employees.length === 0 ? (
          <EmptyState />
        ) : (
          <EmployeeTable employees={employees} />
        )}
      </div>
    </div>
  );
}
