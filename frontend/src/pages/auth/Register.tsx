import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import api from "../../lib/axios";
import {
  Building2, Eye, EyeOff, Mail, Lock, User, ChevronDown, ArrowRight, CheckCircle2,
} from "lucide-react";
import AuthBackground from "../../components/auth/AuthBackground";

type FormData = { name: string; email: string; password: string; role: string };

const ROLE_OPTIONS = [
  { value: "resident",          label: "Resident / Employee",   desc: "Access building services and amenities" },
  { value: "maintenance_staff", label: "Maintenance Staff",      desc: "Manage tickets and asset repairs" },
  { value: "security_staff",   label: "Security Staff",         desc: "Monitor access logs and incidents" },
  { value: "building_manager", label: "Building Manager",        desc: "Oversee building operations" },
];

const PASSWORD_STRENGTH = (pw: string) => {
  if (!pw) return { level: 0, label: "", color: "" };
  const score =
    (pw.length >= 8 ? 1 : 0) +
    (/[A-Z]/.test(pw) ? 1 : 0) +
    (/[0-9]/.test(pw) ? 1 : 0) +
    (/[^a-zA-Z0-9]/.test(pw) ? 1 : 0);
  if (score <= 1) return { level: 1, label: "Weak",   color: "#ef4444" };
  if (score <= 2) return { level: 2, label: "Fair",   color: "#f59e0b" };
  if (score <= 3) return { level: 3, label: "Good",   color: "#3b82f6" };
  return             { level: 4, label: "Strong", color: "#22c55e" };
};

export default function Register() {
  const navigate = useNavigate();
  const [showPass, setShowPass] = useState(false);
  const [pwValue, setPwValue]   = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ defaultValues: { role: "resident" } });

  const onSubmit = async (data: FormData) => {
    try {
      await api.post("/auth/register", data);
      toast.success("Account created! Check your email for the OTP.");
      navigate(`/verify-otp?email=${encodeURIComponent(data.email)}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Registration failed");
    }
  };

  const strength = PASSWORD_STRENGTH(pwValue);

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12 relative"
      style={{ background: "#080810" }}
    >
      {/* Animated background */}
      <AuthBackground />

      {/* Content layer */}
      <div className="relative z-10 w-full max-w-[440px]">

        {/* Logo + Branding */}
        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center mb-5">
            <div
              className="auth-logo-icon w-16 h-16 rounded-2xl flex items-center justify-center relative"
              style={{
                background: "linear-gradient(135deg, #7c3aed, #6366f1)",
                boxShadow: "0 0 32px rgba(124,58,237,0.5), inset 0 1px 0 rgba(255,255,255,0.2)",
              }}
            >
              <Building2 size={30} className="text-white" />
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#6366f1] rounded-full border-2 border-[#080810]" />
            </div>
          </div>

          <h1
            className="text-[28px] font-[700] tracking-tight mb-1"
            style={{
              background: "linear-gradient(135deg, #f1f1f3 30%, #c4b5fd 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Create Account
          </h1>
          <p className="text-[13px] text-[#55556a]">
            Join the Digital Twin AI platform
          </p>
        </div>

        {/* Glass card */}
        <div className="auth-card">
          <div className="mb-6">
            <h2 className="text-[18px] font-[600] text-[#f1f1f3]">Register</h2>
            <p className="text-[13px] text-[#55556a] mt-0.5">
              Fill in your details to get started
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>

            {/* Full Name */}
            <div className="auth-field">
              <label className="auth-label">Full Name</label>
              <div className="relative">
                <User size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#55556a] pointer-events-none" />
                <input
                  className="auth-input"
                  style={{ paddingLeft: "42px" }}
                  placeholder="John Doe"
                  autoComplete="name"
                  {...register("name", { required: "Full name is required" })}
                />
              </div>
              {errors.name && <p className="auth-error">⚠ {errors.name.message}</p>}
            </div>

            {/* Email */}
            <div className="auth-field">
              <label className="auth-label">Email Address</label>
              <div className="relative">
                <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#55556a] pointer-events-none" />
                <input
                  type="email"
                  className="auth-input"
                  style={{ paddingLeft: "42px" }}
                  placeholder="you@example.com"
                  autoComplete="email"
                  {...register("email", {
                    required: "Email is required",
                    pattern: { value: /^[^@]+@[^@]+\.[^@]+$/, message: "Invalid email" },
                  })}
                />
              </div>
              {errors.email && <p className="auth-error">⚠ {errors.email.message}</p>}
            </div>

            {/* Password */}
            <div className="auth-field">
              <label className="auth-label">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#55556a] pointer-events-none" />
                <input
                  type={showPass ? "text" : "password"}
                  className="auth-input"
                  style={{ paddingLeft: "42px", paddingRight: "46px" }}
                  placeholder="Min. 6 characters"
                  autoComplete="new-password"
                  {...register("password", {
                    required: "Password is required",
                    minLength: { value: 6, message: "Minimum 6 characters" },
                    onChange: (e) => setPwValue(e.target.value),
                  })}
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
              {/* Strength meter */}
              {pwValue && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((n) => (
                      <div
                        key={n}
                        className="h-1 flex-1 rounded-full transition-all duration-300"
                        style={{
                          background: n <= strength.level ? strength.color : "rgba(99,102,241,0.1)",
                        }}
                      />
                    ))}
                  </div>
                  <p className="text-[11px]" style={{ color: strength.color }}>
                    Password strength: {strength.label}
                  </p>
                </div>
              )}
              {errors.password && <p className="auth-error">⚠ {errors.password.message}</p>}
            </div>

            {/* Role */}
            <div className="auth-field">
              <label className="auth-label">I am a...</label>
              <div className="relative">
                <ChevronDown size={15} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6366f1] pointer-events-none" />
                <select
                  className="auth-select"
                  {...register("role")}
                >
                  {ROLE_OPTIONS.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              {/* Role description */}
              <div className="mt-2 flex flex-col gap-0.5">
                {ROLE_OPTIONS.map(({ value, desc }) => (
                  <p
                    key={value}
                    className="text-[11px] text-[#55556a]"
                    style={{ display: "none" }}
                    data-role={value}
                  >
                    {desc}
                  </p>
                ))}
              </div>
            </div>

            {/* Benefits */}
            <div
              className="rounded-xl p-3 space-y-2"
              style={{
                background: "rgba(99,102,241,0.05)",
                border: "1px solid rgba(99,102,241,0.1)",
              }}
            >
              {[
                "OTP email verification included",
                "Role-based access control",
                "Assigned to your building automatically",
              ].map((t) => (
                <div key={t} className="flex items-center gap-2">
                  <CheckCircle2 size={12} className="text-[#6366f1] flex-shrink-0" />
                  <span className="text-[11px] text-[#8b8b9e]">{t}</span>
                </div>
              ))}
            </div>

            {/* Submit */}
            <div className="auth-field">
              <button type="submit" className="auth-btn" disabled={isSubmitting}>
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating account...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Create Account <ArrowRight size={15} />
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
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-[#6366f1] hover:text-[#a5b4fc] font-medium transition-colors"
            >
              Sign in →
            </Link>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-[#2a2a3a] mt-6 font-mono tracking-widest">
          DIGITAL TWIN AI · v2.0 · SECURE
        </p>
      </div>
    </div>
  );
}
