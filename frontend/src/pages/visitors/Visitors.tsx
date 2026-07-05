import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/axios";
import toast from "react-hot-toast";
import { Plus, X, Users, Check, LogIn, LogOut, Copy, Search, ShieldBan, ShieldCheck } from "lucide-react";
import { useAuth, getBuildingId } from "../../context/AuthContext";
import Badge from "../../components/ui/Badge";
import Modal from "../../components/ui/Modal";
import SkeletonRow from "../../components/ui/SkeletonRow";

export default function Visitors() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<any>({});
  const [filterStatus, setFilterStatus] = useState("");
  const [search, setSearch] = useState("");
  const [selectedBuilding, setSelectedBuilding] = useState("");
  
  const userBuildingId = getBuildingId(user);
  const buildingId = user?.role === "super_admin" ? selectedBuilding : userBuildingId;

  const { data: buildings } = useQuery({
    queryKey: ["buildings-list"],
    queryFn: () => api.get("/buildings?limit=100").then(r => r.data.data.results),
    enabled: user?.role === "super_admin",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["visitors", filterStatus, search, buildingId],
    queryFn: () => {
      const p = new URLSearchParams();
      if (filterStatus) p.set("status", filterStatus);
      if (search) p.set("search", search);
      if (buildingId) p.set("building", buildingId);
      return api.get(`/visitors?${p}`).then(r => r.data.data);
    },
  });

  const { data: users } = useQuery({
    queryKey: ["users-list", buildingId],
    queryFn: () => api.get(`/auth/users?${buildingId ? `building=${buildingId}` : ""}`).then(r => r.data.data),
    enabled: !!buildingId || user?.role === "super_admin",
  });

  const createMutation = useMutation({
    mutationFn: (d: any) => api.post("/visitors", d),
    onSuccess: () => { toast.success("Visitor registered"); qc.invalidateQueries({queryKey:["visitors"], exact: false}); setShowModal(false); setForm({}); },
    onError: (e: any) => toast.error(e.response?.data?.message||"Error"),
  });

  const actionMutation = useMutation({
    mutationFn: ({ id, action }: any) => api.patch(`/visitors/${id}/${action}`),
    onSuccess: () => { toast.success("Updated"); qc.invalidateQueries({queryKey:["visitors"], exact: false}); },
    onError: (e: any) => toast.error(e.response?.data?.message||"Error"),
  });

  const canManage = ["super_admin","building_manager","security_staff"].includes(user?.role||"");

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Pass code copied!");
  };

  return (
    <div className="space-y-6">
      <div className="pb-5 mb-6 border-b border-[#2a2a3a] flex items-center justify-between">
        <div>
          <h1 className="page-title">Visitors</h1>
          <p className="muted-text mt-1">{data?.pagination?.total||0} visitors registered</p>
        </div>
        <button onClick={()=>{setForm({building:buildingId});setShowModal(true);}} disabled={!buildingId && user?.role !== 'super_admin'} className="btn-primary flex items-center gap-2 disabled:opacity-50">
          <Plus size={16}/> Register Visitor
        </button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[240px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#55556a]" />
          <input className="input pl-9 w-full" placeholder="Search visitors..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {user?.role === "super_admin" && (
          <select className="input w-[180px]" value={selectedBuilding} onChange={e=>setSelectedBuilding(e.target.value)}>
            <option value="">All buildings</option>
            {buildings?.map((b: any)=><option key={b._id} value={b._id}>{b.name}</option>)}
          </select>
        )}
        <select className="input w-[180px]" value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
          <option value="">All Statuses</option>
          {["pending","approved","checked_in","checked_out","rejected"].map(s=><option key={s} value={s}>{s.replace("_"," ")}</option>)}
        </select>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#111118] border-b border-[#2a2a3a]">
                {["Visitor", "Purpose", "Host", "Pass Code", "Status", "Actions"].map(h => (
                  <th key={h} className="px-5 py-3 card-label">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && <SkeletonRow columns={6} />}
              {!isLoading && data?.results?.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state">
                      <Users size={48} className="text-[#2a2a3a] mb-4" />
                      <h3 className="text-[16px] text-[#8b8b9e] font-medium">No visitors found</h3>
                      <p className="text-[13px] text-[#55556a] mt-1">Register a visitor to get started.</p>
                    </div>
                  </td>
                </tr>
              )}
              {data?.results?.map((v: any) => (
                <tr key={v._id} className="table-row">
                  <td className="px-5 py-3">
                    <p className="text-[14px] font-[500] text-[#f1f1f3]">{v.name}</p>
                    <p className="text-[12px] text-[#55556a] mt-0.5">{v.phone}</p>
                  </td>
                  <td className="px-5 py-3 text-[13px] text-[#8b8b9e]">{v.purpose}</td>
                  <td className="px-5 py-3 text-[13px] text-[#8b8b9e]">
                    {v.hostUser?.name ? (
                      <div>
                        <p>{v.hostUser.name}</p>
                        <p className="text-[11px] text-[#55556a] mt-0.5">Host</p>
                      </div>
                    ) : "—"}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[#6366f1] bg-[rgba(99,102,241,0.1)] px-2 py-1 rounded text-sm tracking-widest">{v.passCode}</span>
                      <button onClick={() => copyToClipboard(v.passCode)} className="text-[#55556a] hover:text-[#f1f1f3] transition-colors p-1" title="Copy code">
                        <Copy size={14} />
                      </button>
                    </div>
                  </td>
                  <td className="px-5 py-3"><Badge status={v.status} /></td>
                  <td className="px-5 py-3">
                    {canManage && (
                      <div className="flex items-center gap-2">
                        {v.status === "pending" && (
                          <>
                            <button onClick={()=>actionMutation.mutate({id:v._id,action:"approve"})} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-[#22c55e]/10 text-[#22c55e] hover:bg-[#22c55e]/20 transition-colors text-xs font-medium border border-[#22c55e]/20" title="Approve">
                              <Check size={14} /> Approve
                            </button>
                            <button onClick={()=>actionMutation.mutate({id:v._id,action:"reject"})} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-[#ef4444]/10 text-[#ef4444] hover:bg-[#ef4444]/20 transition-colors text-xs font-medium border border-[#ef4444]/20" title="Reject">
                              <ShieldBan size={14} /> Reject
                            </button>
                          </>
                        )}
                        {v.status === "approved" && (
                          <button onClick={()=>actionMutation.mutate({id:v._id,action:"check-in"})} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-[#38bdf8]/10 text-[#38bdf8] hover:bg-[#38bdf8]/20 transition-colors text-xs font-medium border border-[#38bdf8]/20" title="Check In">
                            <LogIn size={14} /> Check In
                          </button>
                        )}
                        {v.status === "checked_in" && (
                          <button onClick={()=>actionMutation.mutate({id:v._id,action:"check-out"})} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-[#2a2a3a] text-[#8b8b9e] hover:text-[#f1f1f3] hover:bg-[#3d3d55] transition-colors text-xs font-medium border border-transparent" title="Check Out">
                            <LogOut size={14} /> Check Out
                          </button>
                        )}
                        {["checked_out", "rejected"].includes(v.status) && (
                          <span className="text-xs text-[#55556a]">No actions available</span>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Register Visitor">
        <form onSubmit={e=>{e.preventDefault();createMutation.mutate({...form, building: form.building || buildingId});}} className="space-y-5">
          <div>
            <label className="card-label block mb-2">Visitor Name *</label>
            <input className="input w-full" required value={form.name||""} onChange={e=>setForm({...form,name:e.target.value})}/>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="card-label block mb-2">Phone *</label>
              <input className="input w-full" required value={form.phone||""} onChange={e=>setForm({...form,phone:e.target.value})}/>
            </div>
            <div>
              <label className="card-label block mb-2">Email</label>
              <input type="email" className="input w-full" value={form.email||""} onChange={e=>setForm({...form,email:e.target.value})}/>
            </div>
          </div>
          <div>
            <label className="card-label block mb-2">Purpose *</label>
            <input className="input w-full" required value={form.purpose||""} onChange={e=>setForm({...form,purpose:e.target.value})}/>
          </div>
          <div>
            <label className="card-label block mb-2">Host User *</label>
            <select className="input w-full" required value={form.hostUser||""} onChange={e=>setForm({...form,hostUser:e.target.value})}>
              <option value="">Select user...</option>
              {users?.map((u: any) => <option key={u._id} value={u._id}>{u.name} ({u.role})</option>)}
            </select>
          </div>
          <div>
            <label className="card-label block mb-2">Vehicle Number</label>
            <input className="input w-full font-mono text-sm uppercase" placeholder="e.g. MH01AB1234" value={form.vehicleNumber||""} onChange={e=>setForm({...form,vehicleNumber:e.target.value})}/>
          </div>
          <div className="flex gap-3 pt-4 border-t border-[#2a2a3a]">
            <button type="button" onClick={()=>setShowModal(false)} className="btn-ghost flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Registering..." : "Register Visitor"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
