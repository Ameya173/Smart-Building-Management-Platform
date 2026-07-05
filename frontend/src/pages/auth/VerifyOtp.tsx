import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../lib/axios";
import { ShieldCheck } from "lucide-react";

export default function VerifyOtp() {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const email = searchParams.get("email") || "";

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/verify-otp", { email, otp });
      toast.success("Email verified! You can now log in.");
      navigate("/login");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#13131f] px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary mx-auto flex items-center justify-center mb-4">
            <ShieldCheck size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Verify Email</h1>
          <p className="text-gray-400 mt-1 text-sm">Enter the OTP sent to <span className="text-white">{email}</span></p>
        </div>
        <div className="card">
          <form onSubmit={handleVerify} className="space-y-4">
            <input
              className="input text-center text-2xl tracking-widest"
              maxLength={6}
              placeholder="000000"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
            <button type="submit" className="btn-primary w-full py-2.5" disabled={loading || otp.length < 6}>
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
          </form>
        </div>
        <p className="text-center text-sm text-gray-500 mt-4">
          <Link to="/login" className="text-primary hover:underline">← Back to login</Link>
        </p>
      </div>
    </div>
  );
}
