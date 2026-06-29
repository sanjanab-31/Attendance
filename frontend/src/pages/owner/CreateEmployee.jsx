import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { createEmployee } from "../../services/employeeService";
import { UserPlus, AlertCircle, CheckCircle } from "lucide-react";

// Import Reusable Form Components
import Input from "../../components/employee/Input";
import DatePicker from "../../components/employee/DatePicker";

export default function CreateEmployee() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    age: "",
    dateOfJoining: new Date().toISOString().split("T")[0],
    phone: "",
    address: "",
    email: "",
    password: "",
    hourRate: "",
    otHourRate: ""
  });

  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  }

  const validateForm = () => {
    const tempErrors = {};
    
    if (!formData.name.trim()) tempErrors.name = "Full name is required.";
    
    const ageVal = parseInt(formData.age, 10);
    if (!formData.age) {
      tempErrors.age = "Age is required.";
    } else if (isNaN(ageVal) || ageVal < 18 || ageVal > 100) {
      tempErrors.age = "Age must be between 18 and 100.";
    }

    if (!formData.phone.trim()) {
      tempErrors.phone = "Phone number is required.";
    } else if (!/^\+?[0-9\s-]{7,15}$/.test(formData.phone.trim())) {
      tempErrors.phone = "Invalid phone number format.";
    }

    if (!formData.dateOfJoining) tempErrors.dateOfJoining = "Date of joining is required.";
    if (!formData.address.trim()) tempErrors.address = "Home address is required.";

    if (!formData.email.trim()) {
      tempErrors.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      tempErrors.email = "Invalid email format.";
    }

    if (!formData.password) {
      tempErrors.password = "Temporary password is required.";
    } else if (formData.password.length < 6) {
      tempErrors.password = "Password must be at least 6 characters long.";
    }

    const hr = parseFloat(formData.hourRate);
    if (formData.hourRate === "") {
      tempErrors.hourRate = "Hourly rate is required.";
    } else if (isNaN(hr) || hr < 0) {
      tempErrors.hourRate = "Hourly rate must be a positive number.";
    }

    const ot = parseFloat(formData.otHourRate);
    if (formData.otHourRate === "") {
      tempErrors.otHourRate = "OT hourly rate is required.";
    } else if (isNaN(ot) || ot < 0) {
      tempErrors.otHourRate = "OT rate must be a positive number.";
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setGlobalError("");
    setSuccess("");
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Use modular Employee Service
      await createEmployee(formData, currentUser);

      setSuccess(`Employee ${formData.name} created successfully!`);
      setFormData({
        name: "",
        age: "",
        dateOfJoining: new Date().toISOString().split("T")[0],
        phone: "",
        address: "",
        email: "",
        password: "",
        hourRate: "",
        otHourRate: ""
      });

      setTimeout(() => {
        navigate("/owner/employees");
      }, 2000);
    } catch (err) {
      console.error(err);
      setGlobalError(err.message || "Failed to register employee. Email might already be in use.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Form UI */}
      <div>
        <h1 className="text-2xl font-extrabold text-[#0d2702] flex items-center gap-3">
          <UserPlus className="w-7 h-7 text-[#0d2702]" />
          Add New Employee
        </h1>
        <p className="text-slate-500 mt-0.5 text-xs font-semibold">
          Register a new employee account. This will create their secure portal access credentials.
        </p>
      </div>

      {globalError && (
        <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-lg flex items-start gap-2.5 text-rose-600 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p className="leading-normal">{globalError}</p>
        </div>
      )}

      {success && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-100 rounded-lg flex items-start gap-2.5 text-emerald-600 text-xs">
          <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p className="leading-normal">{success}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-lg p-5 space-y-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <Input
            label="Full Name"
            name="name"
            required
            value={formData.name}
            onChange={handleChange}
            placeholder="John Doe"
            error={errors.name}
          />

          <Input
            label="Age"
            name="age"
            type="number"
            required
            value={formData.age}
            onChange={handleChange}
            placeholder="e.g. 28"
            error={errors.age}
          />

          <Input
            label="Phone Number"
            name="phone"
            type="tel"
            required
            value={formData.phone}
            onChange={handleChange}
            placeholder="+1234567890"
            error={errors.phone}
          />

          <DatePicker
            label="Date of Joining"
            name="dateOfJoining"
            required
            value={formData.dateOfJoining}
            onChange={handleChange}
            error={errors.dateOfJoining}
          />

          <Input
            label="Email Address"
            name="email"
            type="email"
            required
            value={formData.email}
            onChange={handleChange}
            placeholder="employee@vortex.com"
            error={errors.email}
          />

          <Input
            label="Temporary Password"
            name="password"
            required
            value={formData.password}
            onChange={handleChange}
            placeholder="e.g. TempPass123!"
            error={errors.password}
          />

          <Input
            label="Hourly Rate ($)"
            name="hourRate"
            type="number"
            step="0.01"
            required
            value={formData.hourRate}
            onChange={handleChange}
            placeholder="e.g. 25.00"
            error={errors.hourRate}
          />

          <Input
            label="OT Hourly Rate ($)"
            name="otHourRate"
            type="number"
            step="0.01"
            required
            value={formData.otHourRate}
            onChange={handleChange}
            placeholder="e.g. 37.50"
            error={errors.otHourRate}
          />

          <div className="md:col-span-3 lg:col-span-4">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Home Address <span className="text-rose-500">*</span>
            </label>
            <input
              name="address"
              required
              value={formData.address}
              onChange={handleChange}
              placeholder="Street name, City, Zip"
              className={`w-full px-3 py-2 bg-slate-50 border rounded-lg text-slate-900 placeholder-slate-400 outline-none text-xs transition-colors ${
                errors.address ? "border-rose-400 focus:border-rose-500" : "border-slate-200 focus:border-[#71d300]"
              }`}
            />
            {errors.address && (
              <p className="text-rose-600 text-[10px] mt-1 font-semibold">{errors.address}</p>
            )}
          </div>
        </div>

        <div className="flex gap-3 justify-end pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={() => navigate("/owner/employees")}
            className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-[#71d300] hover:opacity-90 text-[#0d2702] font-bold text-xs uppercase tracking-wider rounded-lg transition-colors shadow-sm active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? "Registering..." : "Create Account"}
          </button>
        </div>
      </form>
    </div>
  );
}
