import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import {
  Building2, Eye, EyeOff, Mail, Lock, ArrowRight,
  Cpu, Wifi, BarChart3, Shield,
} from "lucide-react";
import AuthBackground from "../../components/auth/AuthBackground";

type FormData = { email: string; password: string };

const FEATURES = [
  { icon: <Cpu size={14} />,      label: "Digital Twin Engine" },
  { icon: <Wifi size={14} />,     label: "Real-time IoT Sync" },
  { icon: <BarChart3 size={14} />, label: "AI Analytics" },
  { icon: <Shield size={14} />,   label: "Secure Access Control" },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPass, setShowPass] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    try {
      await login(data.email, data.password);
      toast.success("Welcome back!");
      navigate("/");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12 relative"
      style={{ background: "#080810" }}
    >
      {/* Animated background */}
      <AuthBackground />

      {/* Content layer */}
      <div className="relative z-10 w-full max-w-[420px]">

        {/* Logo + Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-5">
            <div
              className="auth-logo-icon w-16 h-16 rounded-2xl flex items-center justify-center relative"
              style={{
                background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                boxShadow: "0 0 32px rgba(99,102,241,0.5), inset 0 1px 0 rgba(255,255,255,0.2)",
              }}
            >
              <Building2 size={30} className="text-white" />
              {/* Ping dot */}
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#34d399] rounded-full border-2 border-[#080810] flex items-center justify-center">
                <span className="w-1.5 h-1.5 bg-[#34d399] rounded-full animate-ping absolute" />
              </span>
            </div>
          </div>

          <h1
            className="text-[28px] font-[700] tracking-tight mb-1"
            style={{
              background: "linear-gradient(135deg, #f1f1f3 30%, #a5b4fc 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Digital Twin AI
          </h1>
          <p className="text-[13px] text-[#55556a] tracking-wide">
            Intelligent Building Management Platform
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {FEATURES.map(({ icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium tracking-wide"
                style={{
                  background: "rgba(99,102,241,0.08)",
                  border: "1px solid rgba(99,102,241,0.2)",
                  color: "rgba(165,180,252,0.9)",
                }}
              >
                {icon} {label}
              </span>
            ))}
          </div>
        </div>

        {/* Glass card */}
        <div className="auth-card">
          <div className="mb-6">
            <h2 className="text-[18px] font-[600] text-[#f1f1f3]">Sign in</h2>
            <p className="text-[13px] text-[#55556a] mt-0.5">
              Enter your credentials to access the dashboard
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            {/* Email */}
            <div className="auth-field">
              <label className="auth-label">Email Address</label>
              <div className="relative">
                <Mail
                  size={15}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#55556a] pointer-events-none"
                />
                <input
                  type="email"
                  className="auth-input"
                  style={{ paddingLeft: "42px" }}
                  placeholder="you@example.com"
                  autoComplete="email"
                  {...register("email", { required: "Email is required" })}
                />
              </div>
              {errors.email && (
                <p className="auth-error">⚠ {errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="auth-field">
              <div className="flex items-center justify-between mb-2">
                <label className="auth-label" style={{ marginBottom: 0 }}>Password</label>
                <Link
                  to="/forgot-password"
                  className="text-[11px] text-[#6366f1] hover:text-[#a5b4fc] transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock
                  size={15}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#55556a] pointer-events-none"
                />
                <input
                  type={showPass ? "text" : "password"}
                  className="auth-input"
                  style={{ paddingLeft: "42px", paddingRight: "46px" }}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  {...register("password", { required: "Password is required" })}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((p) => !p)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#55556a] hover:text-[#a5b4fc] transition-colors"
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && (
                <p className="auth-error">⚠ {errors.password.message}</p>
              )}
            </div>

            {/* Submit */}
            <div className="auth-field pt-2">
              <button type="submit" className="auth-btn" disabled={isSubmitting}>
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Authenticating...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Sign In <ArrowRight size={15} />
                  </span>
                )}
              </button>
            </div>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px" style={{ background: "rgba(99,102,241,0.12)" }} />
            <span className="text-[11px] text-[#55556a] tracking-widest">OR</span>
            <div className="flex-1 h-px" style={{ background: "rgba(99,102,241,0.12)" }} />
          </div>

          <p className="text-center text-[13px] text-[#55556a]">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="text-[#6366f1] hover:text-[#a5b4fc] font-medium transition-colors"
            >
              Create account →
            </Link>
          </p>
        </div>

        {/* Footer note */}
        <p className="text-center text-[11px] text-[#2a2a3a] mt-6 font-mono tracking-widest">
          DIGITAL TWIN AI · v2.0 · SECURE
        </p>
      </div>
    </div>
  );
}
