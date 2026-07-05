import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/axios";
import toast from "react-hot-toast";
import { Plus, Search, ShieldAlert, ShieldCheck, MapPin, Calendar, Clock, AlertTriangle } from "lucide-react";
import { useAuth, getBuildingId } from "../../context/AuthContext";
import Badge from "../../components/ui/Badge";
import Modal from "../../components/ui/Modal";
import SkeletonRow from "../../components/ui/SkeletonRow";

export default function Security() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<any>({ type: "patrol", severity: "low" });
  
  const userBuildingId = getBuildingId(user);
  const [selectedBuilding, setSelectedBuilding] = useState("");
  const buildingId = user?.role === "super_admin" ? selectedBuilding : userBuildingId;
  const isResident = user?.role === "resident";

  const { data: buildings } = useQuery({
    queryKey: ["buildings-list"],
    queryFn: () => api.get("/buildings?limit=100").then(r => r.data.data.results),
    enabled: user?.role === "super_admin",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["security", search, filterType, buildingId],
    queryFn: () => {
      const p = new URLSearchParams();
      if (search) p.set("search", search);
      if (filterType) p.set("type", filterType);
      if (buildingId) p.set("building", buildingId);
      return api.get(`/security?${p}`).then(r => r.data.data);
    },
    enabled: !isResident && (!!buildingId || user?.role === "super_admin"),
  });

  const createMutation = useMutation({
    mutationFn: (d: any) => api.post("/security", d),
    onSuccess: () => {
      toast.success("Security log created");
      qc.invalidateQueries({ queryKey: ["security"] });
      setShowModal(false);
      setForm({ type: "patrol", severity: "low" });
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Error"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: any) => api.patch(`/security/${id}`, { status }),
    onSuccess: () => {
      toast.success("Status updated");
      qc.invalidateQueries({ queryKey: ["security"] });
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Error"),
  });

  if (isResident) {
    return <div className="empty-state">Unauthorized. Only for security staff and management.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="pb-5 mb-6 border-b border-[#2a2a3a] flex items-center justify-between">
        <div>
          <h1 className="page-title">Security Logs</h1>
          <p className="muted-text mt-1">Manage patrol routes and security incidents</p>
        </div>
        <button onClick={() => setShowModal(true)} disabled={!buildingId && user?.role !== 'super_admin'} className="btn-primary flex items-center gap-2 disabled:opacity-50">
          <Plus size={16} /> Add Log
        </button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[240px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#55556a]" />
          <input className="input pl-9 w-full" placeholder="Search logs..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {user?.role === "super_admin" && (
          <select className="input w-[180px]" value={selectedBuilding} onChange={e => setSelectedBuilding(e.target.value)}>
            <option value="">All buildings</option>
            {buildings?.map((b: any) => <option key={b._id} value={b._id}>{b.name}</option>)}
          </select>
        )}
        <select className="input w-[180px]" value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="">All Types</option>
          <option value="patrol">Patrol Log</option>
          <option value="incident">Incident Report</option>
        </select>
      </div>

      <div className="space-y-4">
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="card h-24 animate-pulse"></div>)}
          </div>
        )}

        {!isLoading && data?.results?.length === 0 && (
          <div className="empty-state card border-dashed">
            <ShieldCheck size={48} className="text-[#2a2a3a] mb-4" />
            <h3 className="text-[16px] text-[#8b8b9e] font-medium">No security logs</h3>
            <p className="text-[13px] text-[#55556a] mt-1">Area is secure.</p>
          </div>
        )}

        {data?.results?.map((log: any) => (
          <div key={log._id} className={`card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-l-4 ${log.type === "incident" ? "border-l-[#ef4444]" : "border-l-[#38bdf8]"}`}>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-1.5 rounded-lg ${log.type === "incident" ? "bg-[#ef4444]/10 text-[#ef4444]" : "bg-[#38bdf8]/10 text-[#38bdf8]"}`}>
                  {log.type === "incident" ? <AlertTriangle size={16} /> : <ShieldCheck size={16} />}
                </div>
                <h3 className="text-[16px] font-[600] text-[#f1f1f3]">{log.title}</h3>
                <Badge className={log.type === "incident" ? "bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/20" : "bg-[#38bdf8]/10 text-[#38bdf8] border-[#38bdf8]/20"}>
                  {log.type}
                </Badge>
                {log.type === "incident" && (
                  <Badge variant={log.severity === "critical" ? "danger" : log.severity === "high" ? "warning" : "neutral"} className="bg-transparent border-[#3d3d55] text-xs">
                    {log.severity} severity
                  </Badge>
                )}
                {log.status === "resolved" && <Badge variant="success">Resolved</Badge>}
              </div>
              
              <p className="text-[14px] text-[#8b8b9e] mb-3">{log.description}</p>
              
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[12px] text-[#55556a]">
                <div className="flex items-center gap-1.5">
                  <MapPin size={14} />
                  {log.location}
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock size={14} />
                  {new Date(log.createdAt).toLocaleString()}
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldAlert size={14} />
                  Logged by {log.loggedBy?.name}
                </div>
              </div>
            </div>
            
            {log.status === "open" && log.type === "incident" && (
              <button 
                onClick={() => updateMutation.mutate({ id: log._id, status: "resolved" })}
                className="btn-ghost border border-[#2a2a3a] sm:ml-auto whitespace-nowrap"
              >
                Mark Resolved
              </button>
            )}
          </div>
        ))}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Security Log">
        <form onSubmit={e => { e.preventDefault(); createMutation.mutate({ ...form, building: form.building || buildingId }); }} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="card-label block mb-2">Log Type *</label>
              <select className="input w-full" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                <option value="patrol">Patrol Log</option>
                <option value="incident">Incident Report</option>
              </select>
            </div>
            {form.type === "incident" && (
              <div>
                <label className="card-label block mb-2">Severity *</label>
                <select className="input w-full" value={form.severity} onChange={e => setForm({ ...form, severity: e.target.value })}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            )}
          </div>
          <div>
            <label className="card-label block mb-2">Title *</label>
            <input className="input w-full" required placeholder="e.g. South Wing Night Patrol" value={form.title || ""} onChange={e => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label className="card-label block mb-2">Location *</label>
            <input className="input w-full" required placeholder="e.g. Parking Level 1" value={form.location || ""} onChange={e => setForm({ ...form, location: e.target.value })} />
          </div>
          <div>
            <label className="card-label block mb-2">Description *</label>
            <textarea className="input w-full h-24 resize-none" required placeholder="Details of the patrol or incident..." value={form.description || ""} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="flex gap-3 pt-4 border-t border-[#2a2a3a]">
            <button type="button" onClick={() => setShowModal(false)} className="btn-ghost flex-1">Cancel</button>
            <button type="submit" disabled={createMutation.isPending || !buildingId} className={form.type === "incident" ? "btn-danger flex-1" : "btn-primary flex-1 text-center"}>
              {createMutation.isPending ? "Submitting..." : form.type === "incident" ? "Report Incident" : "Log Patrol"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
