import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/axios";
import toast from "react-hot-toast";
import { Plus, Search, Wrench, Calendar, User as UserIcon, CheckCircle2 } from "lucide-react";
import { useAuth, getBuildingId } from "../../context/AuthContext";
import Badge from "../../components/ui/Badge";
import Modal from "../../components/ui/Modal";

const PRIORITIES = ["low","medium","high","critical"];
const STATUSES = ["open","in_progress","resolved","closed"];
const TABS = [
  { id: "", label: "All Tickets" },
  { id: "open", label: "Open" },
  { id: "in_progress", label: "In Progress" },
  { id: "resolved", label: "Resolved" },
];

export default function Maintenance() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<any>({});

  const canManage = ["super_admin","building_manager"].includes(user?.role||"");
  const buildingId = getBuildingId(user);

  const { data, isLoading } = useQuery({
    queryKey: ["tickets", search, filterStatus, buildingId],
    queryFn: () => {
      const p = new URLSearchParams();
      if (search) p.set("search", search);
      if (filterStatus) p.set("status", filterStatus);
      if (buildingId) p.set("building", buildingId);
      return api.get(`/maintenance?${p}`).then(r => r.data.data);
    },
  });

  const { data: assets } = useQuery({
    queryKey: ["assets-list", buildingId],
    queryFn: () => api.get(`/assets?${buildingId ? `building=${buildingId}&` : ""}limit=100`).then(r => r.data.data.results),
    enabled: !!buildingId || user?.role === "super_admin",
  });

  const { data: staff } = useQuery({
    queryKey: ["maintenance-staff", buildingId],
    queryFn: () => api.get(`/auth/users?${buildingId ? `building=${buildingId}&` : ""}role=maintenance_staff`).then(r => r.data.data),
    enabled: canManage,
  });

  const createMutation = useMutation({
    mutationFn: (d: any) => api.post("/maintenance", d),
    onSuccess: () => { toast.success("Ticket created"); qc.invalidateQueries({ queryKey: ["tickets"], exact: false }); setShowModal(false); setForm({}); },
    onError: (e: any) => toast.error(e.response?.data?.message || "Error"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...d }: any) => api.patch(`/maintenance/${id}`, d),
    onSuccess: () => { toast.success("Ticket updated"); qc.invalidateQueries({ queryKey: ["tickets"], exact: false }); },
  });

  const getPriorityBorder = (p: string) => {
    switch (p) {
      case "critical": return "border-l-[#ef4444]";
      case "high": return "border-l-[#f59e0b]";
      case "medium": return "border-l-[#eab308]";
      case "low": return "border-l-[#22c55e]";
      default: return "border-l-[#2a2a3a]";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Maintenance</h1>
          <p className="muted-text mt-1">{data?.pagination?.total || 0} tickets found</p>
        </div>
        {canManage && (
          <button onClick={() => { setForm({ building: buildingId, priority:"medium" }); setShowModal(true); }} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> New Ticket
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between border-b border-[#2a2a3a] pb-4">
        {/* Pill Tabs */}
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

        {/* Search */}
        <div className="relative w-full sm:w-[280px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#55556a]" />
          <input className="input pl-9 w-full bg-[#111118]" placeholder="Search tickets..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="space-y-3">
        {isLoading && (
          <div className="space-y-3">
            {[1,2,3].map(i => (
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
            <h3 className="text-[16px] text-[#8b8b9e] font-medium">All caught up!</h3>
            <p className="text-[13px] text-[#55556a] mt-1">No tickets match the current filters.</p>
          </div>
        )}

        {data?.results?.map((t: any) => (
          <div key={t._id} className={`card p-4 flex flex-col sm:flex-row sm:items-center gap-4 border-l-4 ${getPriorityBorder(t.priority)} hover:bg-[#1a1a24]`}>
            <div className="w-10 h-10 rounded-lg bg-[#2a2a3a] flex items-center justify-center flex-shrink-0">
              <Wrench size={18} className="text-[#f1f1f3]" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <p className="font-[500] text-[15px] text-[#f1f1f3]">{t.title}</p>
                <Badge status={t.status} />
                <Badge variant={t.priority === "critical" ? "danger" : t.priority === "high" ? "warning" : "info"} className="bg-transparent border-[#3d3d55] text-xs">
                  {t.priority}
                </Badge>
              </div>
              <p className="muted-text">{t.asset?.name || "General Facility"} • Reported by {t.raisedBy?.name}</p>
            </div>

            <div className="flex items-center gap-4 sm:ml-auto">
              {t.assignedTo && (
                <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#111118] border border-[#2a2a3a] text-xs text-[#8b8b9e]">
                  <UserIcon size={12} />
                  {t.assignedTo.name}
                </div>
              )}
              
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#55556a]">
                <Calendar size={12} />
                {new Date(t.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </div>

              {canManage && t.status !== "resolved" && t.status !== "closed" && (
                <select
                  className="input py-1.5 px-2 text-xs w-[120px] bg-[#111118]"
                  value={t.status}
                  onChange={e => updateMutation.mutate({ id: t._id, status: e.target.value })}
                >
                  {STATUSES.map(s => <option key={s} value={s}>{s.replace("_"," ")}</option>)}
                </select>
              )}
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="New Maintenance Ticket">
        <form onSubmit={e=>{e.preventDefault();createMutation.mutate({...form, building: form.building || buildingId});}} className="space-y-5">
          <div>
            <label className="card-label block mb-2">Title *</label>
            <input className="input w-full" required value={form.title||""} onChange={e => setForm({...form, title: e.target.value})} />
          </div>
          <div>
            <label className="card-label block mb-2">Asset *</label>
            <select className="input w-full" required value={form.asset||""} onChange={e => setForm({...form, asset: e.target.value})}>
              <option value="">Select asset...</option>
              {assets?.map((a: any) => <option key={a._id} value={a._id}>{a.name}</option>)}
            </select>
          </div>
          <div>
            <label className="card-label block mb-2">Description *</label>
            <textarea className="input w-full h-24 resize-none" required value={form.description||""} onChange={e => setForm({...form, description: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="card-label block mb-2">Priority</label>
              <select className="input w-full" value={form.priority||"medium"} onChange={e => setForm({...form, priority: e.target.value})}>
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            {canManage && (
              <div>
                <label className="card-label block mb-2">Assign To</label>
                <select className="input w-full" value={form.assignedTo||""} onChange={e => setForm({...form, assignedTo: e.target.value || null})}>
                  <option value="">Unassigned</option>
                  {staff?.map((s: any) => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              </div>
            )}
          </div>
          <div className="flex gap-3 pt-4 border-t border-[#2a2a3a]">
            <button type="button" onClick={() => setShowModal(false)} className="btn-ghost flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create Ticket"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
