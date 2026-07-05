import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/axios";
import toast from "react-hot-toast";
import { Plus, Search, MessageSquare, Calendar, CheckCircle2, AlertCircle } from "lucide-react";
import { useAuth, getBuildingId } from "../../context/AuthContext";
import Badge from "../../components/ui/Badge";
import Modal from "../../components/ui/Modal";

const CATEGORIES = ["noise", "cleanliness", "security", "parking", "other"];
const STATUSES = ["pending", "in_progress", "resolved", "rejected"];
const TABS = [
  { id: "", label: "All Complaints" },
  { id: "pending", label: "Pending" },
  { id: "in_progress", label: "In Progress" },
  { id: "resolved", label: "Resolved" },
];

export default function Complaints() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<any>({});

  const userBuildingId = getBuildingId(user);
  const buildingId = userBuildingId;
  const isResident = user?.role === "resident";
  const hasNoBuilding = isResident && !userBuildingId;
  const canManage = ["super_admin", "building_manager"].includes(user?.role || "");

  const { data, isLoading } = useQuery({
    queryKey: ["complaints", search, filterStatus, buildingId],
    queryFn: () => {
      const p = new URLSearchParams();
      if (search) p.set("search", search);
      if (filterStatus) p.set("status", filterStatus);
      if (buildingId) p.set("building", buildingId);
      return api.get(`/complaints?${p}`).then(r => r.data.data);
    },
    enabled: !hasNoBuilding, // Don't fetch if resident has no building
  });

  const createMutation = useMutation({
    mutationFn: (d: any) => api.post("/complaints", d),
    onSuccess: () => { toast.success("Complaint submitted"); qc.invalidateQueries({ queryKey: ["complaints"], exact: false }); setShowModal(false); setForm({}); },
    onError: (e: any) => toast.error(e.response?.data?.message || "Error"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...d }: any) => api.patch(`/complaints/${id}`, d),
    onSuccess: () => { toast.success("Status updated"); qc.invalidateQueries({ queryKey: ["complaints"], exact: false }); },
  });
  
  const withdrawMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/complaints/${id}`),
    onSuccess: () => { toast.success("Complaint withdrawn"); qc.invalidateQueries({ queryKey: ["complaints"], exact: false }); },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Complaints</h1>
          <p className="muted-text mt-1">{data?.pagination?.total || 0} complaints found</p>
        </div>
        <button 
          onClick={() => setShowModal(true)} 
          disabled={hasNoBuilding}
          className="btn-primary flex items-center gap-2 disabled:opacity-50"
        >
          <Plus size={16} /> New Complaint
        </button>
      </div>

      {hasNoBuilding && (
        <div className="card flex items-start gap-3 border-[#ef4444]/30 bg-[#ef4444]/5">
          <AlertCircle size={20} className="text-[#ef4444] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[14px] font-[500] text-[#f1f1f3]">No building assigned</p>
            <p className="text-[13px] text-[#8b8b9e] mt-0.5">Please contact your administrator to be assigned to a building before submitting complaints.</p>
          </div>
        </div>
      )}

      {!hasNoBuilding && (
        <>
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between border-b border-[#2a2a3a] pb-4">
            <div className="flex gap-2 p-1 bg-[#111118] border border-[#2a2a3a] rounded-lg">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setFilterStatus(tab.id)}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    filterStatus === tab.id 
                      ? "bg-[#2a2a3a] text-white shadow-sm" 
                      : "text-[#8b8b9e] hover:text-[#f1f1f3]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-[280px]">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#55556a]" />
              <input className="input pl-9 w-full bg-[#111118]" placeholder="Search complaints..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>

          <div className="space-y-3">
            {isLoading && (
              <div className="space-y-3">
                {[1,2].map(i => (
                  <div key={i} className="card p-4 animate-pulse flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#1a1a24] rounded-lg"></div>
                    <div className="flex-1 space-y-2"><div className="h-4 bg-[#1a1a24] w-1/3 rounded"></div><div className="h-3 bg-[#1a1a24] w-1/4 rounded"></div></div>
                  </div>
                ))}
              </div>
            )}
            
            {!isLoading && data?.results?.length === 0 && (
              <div className="card empty-state col-span-full border-dashed">
                <CheckCircle2 size={48} className="text-[#2a2a3a] mb-4" />
                <h3 className="text-[16px] text-[#8b8b9e] font-medium">No complaints</h3>
                <p className="text-[13px] text-[#55556a] mt-1">Everything is running smoothly.</p>
              </div>
            )}

            {data?.results?.map((c: any) => (
              <div key={c._id} className={`card p-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-[#1a1a24] transition-colors ${c.status === "resolved" ? "opacity-75" : ""}`}>
                <div className="w-10 h-10 rounded-lg bg-[#2a2a3a] flex items-center justify-center flex-shrink-0">
                  <MessageSquare size={18} className="text-[#f1f1f3]" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="font-[500] text-[15px] text-[#f1f1f3]">{c.title}</p>
                    <Badge status={c.status} />
                    <Badge className="bg-transparent border-[#3d3d55] text-xs capitalize">
                      {c.category?.replace("_", " ")}
                    </Badge>
                  </div>
                  <p className="text-[13px] text-[#8b8b9e] mt-1 line-clamp-2">{c.description}</p>
                  <p className="muted-text mt-2">Reported by {c.raisedBy?.name || "Unknown"}</p>
                </div>

                <div className="flex items-center gap-4 sm:ml-auto">
                  <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#55556a]">
                    <Calendar size={12} />
                    {new Date(c.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </div>

                  {canManage && (
                    <select
                      className="input py-1.5 px-2 text-xs w-[120px] bg-[#111118]"
                      value={c.status}
                      onChange={e => updateMutation.mutate({ id: c._id, status: e.target.value })}
                    >
                      {STATUSES.map(s => <option key={s} value={s}>{s.replace("_"," ")}</option>)}
                    </select>
                  )}
                  
                  {isResident && c.status === "pending" && (
                    <button 
                      onClick={() => {
                        if (confirm("Are you sure you want to withdraw this complaint?")) {
                          withdrawMutation.mutate(c._id);
                        }
                      }}
                      className="btn-danger py-1.5 px-3 text-xs"
                    >
                      Withdraw
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Submit Complaint">
        <form onSubmit={e=>{e.preventDefault();createMutation.mutate({...form, building: buildingId});}} className="space-y-5">
          <div>
            <label className="card-label block mb-2">Title *</label>
            <input className="input w-full" required value={form.title||""} onChange={e => setForm({...form, title: e.target.value})} />
          </div>
          <div>
            <label className="card-label block mb-2">Category *</label>
            <select className="input w-full" required value={form.category||""} onChange={e => setForm({...form, category: e.target.value})}>
              <option value="">Select category...</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c.replace("_"," ")}</option>)}
            </select>
          </div>
          <div>
            <label className="card-label block mb-2">Description *</label>
            <textarea className="input w-full h-24 resize-none" required placeholder="Please describe the issue..." value={form.description||""} onChange={e => setForm({...form, description: e.target.value})} />
          </div>
          <div className="flex gap-3 pt-4 border-t border-[#2a2a3a]">
            <button type="button" onClick={() => setShowModal(false)} className="btn-ghost flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1" disabled={createMutation.isPending || !buildingId}>
              {createMutation.isPending ? "Submitting..." : "Submit"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
