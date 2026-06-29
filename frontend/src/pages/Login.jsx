import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Lock, Mail, AlertCircle, Sparkles, User, ShieldCheck } from "lucide-react";

export default function Login() {
  const [activeTab, setActiveTab] = useState("owner"); // "owner" or "employee"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotError, setForgotError] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  const { login, currentUser, sendOwnerPasswordReset } = useAuth();
  const navigate = useNavigate();

  // Redirect user if they are already logged in
  useEffect(() => {
    if (currentUser) {
      if (currentUser.mustChangePassword) {
        navigate("/change-password");
      } else if (currentUser.role === "owner") {
        navigate("/owner/dashboard");
      } else {
        navigate("/employee/dashboard");
      }
    }
  }, [currentUser, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
    } catch (err) {
      console.error(err);
      setError("Invalid credentials. Please ensure your email and password are correct.");
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotSubmit(e) {
    e.preventDefault();
    setForgotError("");
    setForgotLoading(true);
    setResetSent(false);

    try {
      await sendOwnerPasswordReset(forgotEmail);
      setResetSent(true);
      setTimeout(() => {
        setShowForgotModal(false);
        setForgotEmail("");
        setResetSent(false);
      }, 3000);
    } catch (err) {
      console.error(err);
      setForgotError("Failed to send reset link. Ensure the email is registered.");
    } finally {
      setForgotLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex items-center justify-center px-4 font-sans">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-lg p-8 shadow-sm">
        <div className="text-center mb-6">
          <div className="inline-flex p-3 bg-slate-100 rounded-lg mb-3 text-[#0d2702]">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0d2702]">
            ESA Attendance
          </h1>
          <p className="text-slate-500 mt-1 text-xs font-semibold">
            Employee Attendance & Payroll Management
          </p>
        </div>

        {/* Roles Tab Selector */}
        <div className="flex bg-slate-100 p-1 rounded-lg mb-6 border border-slate-200">
          <button
            type="button"
            onClick={() => {
              setActiveTab("owner");
              setError("");
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === "owner"
                ? "bg-[#0d2702] text-white shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Owner Access
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("employee");
              setError("");
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === "employee"
                ? "bg-[#0d2702] text-white shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <User className="w-4 h-4" />
            Employee Access
          </button>
        </div>

        {error && (
          <div className="mb-5 p-3 bg-rose-50 border border-rose-100 rounded-lg flex items-start gap-2.5 text-rose-600 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="leading-normal">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={activeTab === "owner" ? "owner@company.com" : "employee@company.com"}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-[#71d300] focus:ring-1 focus:ring-[#71d300] rounded-lg text-slate-900 placeholder-slate-400 outline-none transition-all text-sm"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Password
              </label>
              {activeTab === "owner" && (
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-[10px] text-[#0d2702] hover:text-[#71d300] font-bold transition-colors"
                >
                  Forgot Password?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-[#71d300] focus:ring-1 focus:ring-[#71d300] rounded-lg text-slate-900 placeholder-slate-400 outline-none transition-all text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[#0d2702] hover:bg-[#153e03] text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-all shadow-sm active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? "Signing In..." : `Sign In as ${activeTab}`}
          </button>
        </form>

        <p className="text-center text-[10px] text-slate-400 mt-6 leading-relaxed">
          {activeTab === "owner" 
            ? "Owners can request account password reset link directly."
            : "Employees: password resets must be requested directly from the Owner."}
        </p>
      </div>

      {/* Forgot Password Modal (Owner Only) */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-lg p-6 shadow-xl relative">
            <h2 className="text-lg font-bold text-[#0d2702] mb-1">Owner Password Recovery</h2>
            <p className="text-xs text-slate-500 mb-5">
              Enter your owner email address. We will send you an email reset link.
            </p>

            {forgotError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-100 rounded-lg flex items-center gap-2 text-rose-600 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <p>{forgotError}</p>
              </div>
            )}

            {resetSent && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-600 text-xs">
                Password reset link sent! Check your inbox.
              </div>
            )}

            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="owner@company.com"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-[#71d300] rounded-lg text-slate-900 outline-none transition-all text-xs"
                />
              </div>

              <div className="flex gap-2.5 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="px-3.5 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={forgotLoading || resetSent}
                  className="px-4.5 py-2 bg-[#0d2702] hover:bg-[#153e03] text-white font-bold text-xs rounded-lg transition-all disabled:opacity-50"
                >
                  {forgotLoading ? "Sending..." : "Send Link"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
