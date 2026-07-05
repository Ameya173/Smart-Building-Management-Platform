import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/axios";
import toast from "react-hot-toast";
import { Plus, Search, Package, Edit2, Trash2, Box } from "lucide-react";
import { useAuth, getBuildingId } from "../../context/AuthContext";
import Badge from "../../components/ui/Badge";
import Modal from "../../components/ui/Modal";
import SkeletonRow from "../../components/ui/SkeletonRow";
import AssetPassportModal from "./AssetPassportModal";
import { BrainCircuit } from "lucide-react";

const CATEGORIES = ["hvac","elevator","electrical","plumbing","fire_safety","it_equipment","furniture","generator","solar_panel","other"];
const STATUSES = ["operational","under_maintenance","faulty","decommissioned"];

export default function Assets() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const buildingId = getBuildingId(user);
  
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [passportAssetId, setPassportAssetId] = useState<string | null>(null);

  const canEdit = ["super_admin","building_manager"].includes(user?.role || "");

  const { data, isLoading } = useQuery({
    queryKey: ["assets", search, filterStatus, filterCategory, buildingId],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (filterStatus) params.set("status", filterStatus);
      if (filterCategory) params.set("category", filterCategory);
      if (buildingId) params.set("building", buildingId);
      return api.get(`/assets?${params}`).then(r => r.data.data);
    },
  });

  const { data: buildings } = useQuery({
    queryKey: ["buildings-list"],
    queryFn: () => api.get("/buildings").then(r => r.data.data.results),
    enabled: user?.role === "super_admin",
  });

  const saveMutation = useMutation({
    mutationFn: (payload: any) => editing
      ? api.patch(`/assets/${editing._id}`, payload)
      : api.post("/assets", payload),
    onSuccess: () => {
      toast.success(editing ? "Asset updated" : "Asset created");
      qc.invalidateQueries({ queryKey: ["assets"], exact: false });
      setShowModal(false);
      setEditing(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Error"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/assets/${id}`),
    onSuccess: () => { toast.success("Asset deactivated"); qc.invalidateQueries({ queryKey: ["assets"], exact: false }); },
  });

  const openCreate = () => { 
    setEditing(null); 
    setForm({
      building: buildingId || "",
      status: "operational",
      healthScore: 100,
      expectedLifespanYears: 10
    }); 
    setShowModal(true); 
  };
  
  const openEdit = (a: any) => { 
    setEditing(a); 
    setForm({ ...a, building: a.building?._id || a.building }); 
    setShowModal(true); 
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name?.trim() || !form.category || !form.purchaseDate || !form.installationDate || !form.building) {
      toast.error("Please fill all required fields");
      return;
    }
    saveMutation.mutate(form);
  };

  return (
    <div className="space-y-6">
      <div className="pb-5 mb-6 border-b border-[#2a2a3a] flex items-center justify-between">
        <div>
          <h1 className="page-title">Assets</h1>
          <p className="muted-text mt-1">{data?.pagination?.total || 0} total assets</p>
        </div>
        {canEdit && (
          <button onClick={openCreate} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Add Asset
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[240px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#55556a]" />
          <input className="input pl-9 w-full" placeholder="Search assets by name or tag..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-[180px]" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s.replace("_"," ")}</option>)}
        </select>
        <select className="input w-[180px]" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c.replace("_"," ")}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#111118] border-b border-[#2a2a3a]">
                {["Asset", "Category", "Location", "Status", "Health Bar", "Age", ""].map((h, i) => (
                  <th key={i} className="px-5 py-3 card-label">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && <SkeletonRow columns={7} />}
              {!isLoading && data?.results?.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-state">
                      <Box size={48} className="text-[#2a2a3a] mb-4" />
                      <h3 className="text-[16px] text-[#8b8b9e] font-medium">No assets found</h3>
                      <p className="text-[13px] text-[#55556a] mt-1">Try adjusting your filters or search.</p>
                      {canEdit && (
                        <button onClick={openCreate} className="btn-ghost mt-4 flex items-center gap-2 border border-[#2a2a3a]">
                          <Plus size={14} /> Add your first asset
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
              {data?.results?.map((a: any) => {
                // Calculate age in years
                const age = a.installationDate ? Math.max(0, new Date().getFullYear() - new Date(a.installationDate).getFullYear()) : null;
                
                return (
                  <tr key={a._id} className="table-row group">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-[#1a1a24] flex items-center justify-center border border-[#2a2a3a] flex-shrink-0">
                          <Package size={14} className="text-[#8b8b9e]" />
                        </div>
                        <div>
                          <p className="text-[14px] font-[500] text-[#f1f1f3]">{a.name}</p>
                          <p className="text-[12px] text-[#55556a] font-mono mt-0.5">{a.assetTag || "NO TAG"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-[13px] text-[#8b8b9e] capitalize">{a.category?.replace("_"," ")}</td>
                    <td className="px-5 py-3 text-[13px] text-[#8b8b9e]">{a.building?.name || "—"}</td>
                    <td className="px-5 py-3"><Badge status={a.status} /></td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-[#1a1a24] rounded-full h-1.5 w-[80px] overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${a.healthScore > 75 ? "bg-[#22c55e]" : a.healthScore > 40 ? "bg-[#f59e0b]" : "bg-[#ef4444]"}`}
                            style={{ width: `${a.healthScore}%` }} 
                          />
                        </div>
                        <span className="text-[12px] font-mono text-[#8b8b9e]">{a.healthScore}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-[13px] text-[#8b8b9e]">{age !== null ? `${age} yrs` : "—"}</td>
                    <td className="px-5 py-3 text-right">
                      {canEdit && (
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setPassportAssetId(a._id)} className="btn-ghost p-1.5 hover:bg-[#312e81]/30 hover:text-[#818cf8]" title="AI Passport">
                            <BrainCircuit size={14} />
                          </button>
                          <button onClick={() => openEdit(a)} className="btn-ghost p-1.5 hover:bg-[#2a2a3a] hover:text-[#6366f1]" title="Edit Asset">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => deleteMutation.mutate(a._id)} className="btn-ghost p-1.5 hover:bg-[#2a2a3a] hover:text-[#ef4444]" title="Deactivate">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? "Edit Asset" : "Add Asset"}>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="card-label block mb-2">Asset Name *</label>
            <input className="input w-full" required value={form.name || ""} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="card-label block mb-2">Category *</label>
              <select className="input w-full" required value={form.category || ""} onChange={e => setForm({ ...form, category: e.target.value })}>
                <option value="">Select...</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c.replace("_"," ")}</option>)}
              </select>
            </div>
            <div>
              <label className="card-label block mb-2">Status</label>
              <select className="input w-full" value={form.status || "operational"} onChange={e => setForm({ ...form, status: e.target.value })}>
                {STATUSES.map(s => <option key={s} value={s}>{s.replace("_"," ")}</option>)}
              </select>
            </div>
          </div>
          {user?.role === "super_admin" && (
            <div>
              <label className="card-label block mb-2">Building *</label>
              <select className="input w-full" required value={form.building || ""} onChange={e => setForm({ ...form, building: e.target.value })}>
                <option value="">Select building...</option>
                {buildings?.map((b: any) => <option key={b._id} value={b._id}>{b.name}</option>)}
              </select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="card-label block mb-2">Purchase Date *</label>
              <input type="date" className="input w-full" required value={form.purchaseDate?.substring(0,10) || ""} onChange={e => setForm({ ...form, purchaseDate: e.target.value })} />
            </div>
            <div>
              <label className="card-label block mb-2">Install Date *</label>
              <input type="date" className="input w-full" required value={form.installationDate?.substring(0,10) || ""} onChange={e => setForm({ ...form, installationDate: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="card-label block mb-2">Manufacturer</label>
              <input className="input w-full" value={form.manufacturer || ""} onChange={e => setForm({ ...form, manufacturer: e.target.value })} />
            </div>
            <div>
              <label className="card-label block mb-2">Model</label>
              <input className="input w-full" value={form.model || ""} onChange={e => setForm({ ...form, model: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="card-label block mb-2">Asset Tag</label>
              <input className="input w-full font-mono text-sm" value={form.assetTag || ""} onChange={e => setForm({ ...form, assetTag: e.target.value })} />
            </div>
            <div>
              <label className="card-label block mb-2">Health Score (%)</label>
              <input type="number" className="input w-full" min="0" max="100" value={form.healthScore || "100"} onChange={e => setForm({ ...form, healthScore: parseInt(e.target.value) })} />
            </div>
          </div>
          <div className="flex gap-3 pt-4 border-t border-[#2a2a3a]">
            <button type="button" onClick={() => setShowModal(false)} className="btn-ghost flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Saving..." : editing ? "Save Changes" : "Create Asset"}
            </button>
          </div>
        </form>
      </Modal>

      <AssetPassportModal 
        assetId={passportAssetId} 
        isOpen={!!passportAssetId} 
        onClose={() => setPassportAssetId(null)} 
      />
    </div>
  );
}
