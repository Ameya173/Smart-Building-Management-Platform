import { useState } from "react";
import { useAuth, getBuildingName } from "../../context/AuthContext";
import { useMutation } from "@tanstack/react-query";
import api from "../../lib/axios";
import toast from "react-hot-toast";
import { User, Mail, Lock, Shield, Building2 } from "lucide-react";
import Badge from "../../components/ui/Badge";

export default function Profile() {
  const { user } = useAuth();
  
  const [form, setForm] = useState({
    name: user?.name || "",
    currentPassword: "",
    newPassword: "",
  });

  const updateMutation = useMutation({
    mutationFn: (d: any) => api.patch("/auth/me", d),
    onSuccess: () => {
      toast.success("Profile updated. Please login again.");
      setTimeout(() => window.location.reload(), 2000);
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Update failed"),
  });

  const buildingName = getBuildingName(user);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="pb-5 mb-6 border-b border-[#2a2a3a]">
        <h1 className="page-title">My Profile</h1>
        <p className="muted-text mt-1">Manage your account settings and preferences</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column - Profile Card */}
        <div className="lg:w-1/3">
          <div className="card p-6 flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-[#1a1a24] border-2 border-[#2a2a3a] flex items-center justify-center mb-4 text-[#f1f1f3] text-3xl font-[600] relative group overflow-hidden">
              {user?.name?.charAt(0).toUpperCase()}
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <span className="text-xs font-medium">Change</span>
              </div>
            </div>
            
            <h2 className="text-[20px] font-[600] text-[#f1f1f3] mb-1">{user?.name}</h2>
            <p className="text-[14px] text-[#8b8b9e] mb-4">{user?.email}</p>
            
            <div className="flex flex-col w-full gap-3 mt-2">
              <div className="flex items-center justify-between p-3 rounded-lg bg-[#111118] border border-[#2a2a3a]">
                <div className="flex items-center gap-2 text-[13px] text-[#8b8b9e]">
                  <Shield size={16} className="text-[#6366f1]" /> Role
                </div>
                <Badge className="bg-[#1a1a24] text-[#f1f1f3] border-[#3d3d55] capitalize px-3">
                  {user?.role?.replace("_", " ")}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg bg-[#111118] border border-[#2a2a3a]">
                <div className="flex items-center gap-2 text-[13px] text-[#8b8b9e]">
                  <Building2 size={16} className="text-[#6366f1]" /> Building
                </div>
                <span className="text-[13px] font-[500] text-[#f1f1f3]">{buildingName || "None"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Settings Form */}
        <div className="lg:w-2/3">
          <div className="card p-0 overflow-hidden">
            <div className="p-5 border-b border-[#2a2a3a]">
              <h2 className="section-title">Account Settings</h2>
            </div>
            <form onSubmit={e => {
              e.preventDefault();
              if (form.newPassword && !form.currentPassword) {
                return toast.error("Current password is required to set a new password");
              }
              const payload: any = { name: form.name };
              if (form.newPassword) {
                payload.currentPassword = form.currentPassword;
                payload.newPassword = form.newPassword;
              }
              updateMutation.mutate(payload);
            }} className="p-6 space-y-6">
              
              <div className="space-y-4">
                <div>
                  <label className="card-label block mb-2">Full Name</label>
                  <div className="relative">
                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#55556a]" />
                    <input className="input pl-10 w-full" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                  </div>
                </div>
                
                <div>
                  <label className="card-label block mb-2">Email Address</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#55556a]" />
                    <input className="input pl-10 w-full opacity-60 cursor-not-allowed" value={user?.email || ""} disabled />
                  </div>
                  <p className="text-[11px] text-[#55556a] mt-1.5">Contact your administrator to change your email address.</p>
                </div>
              </div>

              <div className="pt-6 border-t border-[#2a2a3a]">
                <h3 className="text-[14px] font-[600] text-[#f1f1f3] mb-4">Change Password</h3>
                <div className="space-y-4">
                  <div>
                    <label className="card-label block mb-2">Current Password</label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#55556a]" />
                      <input type="password" placeholder="••••••••" className="input pl-10 w-full" value={form.currentPassword} onChange={e => setForm({...form, currentPassword: e.target.value})} />
                    </div>
                  </div>
                  
                  <div>
                    <label className="card-label block mb-2">New Password</label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#55556a]" />
                      <input type="password" placeholder="••••••••" className="input pl-10 w-full" minLength={6} value={form.newPassword} onChange={e => setForm({...form, newPassword: e.target.value})} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button type="submit" className="btn-primary px-6" disabled={updateMutation.isPending || (form.name === user?.name && !form.newPassword)}>
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
