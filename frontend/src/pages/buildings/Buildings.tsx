import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/axios";
import toast from "react-hot-toast";
import {
  Plus, Building2, MapPin, User, Layers, Phone, Factory, Home,
  GraduationCap, Stethoscope, ShoppingBag, Edit2, UserCheck,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import Badge from "../../components/ui/Badge";
import Modal from "../../components/ui/Modal";

// Must match Building model enum exactly
const BUILDING_TYPES = ["college", "office", "hospital", "mall", "residential"] as const;
type BuildingType = (typeof BUILDING_TYPES)[number];

const TYPE_META: Record<BuildingType, { label: string; icon: JSX.Element; bg: string; text: string }> = {
  college:     { label: "College",     icon: <GraduationCap size={20} className="text-[#a78bfa]" />, bg: "bg-[#a78bfa]/10", text: "text-[#a78bfa]" },
  office:      { label: "Office",      icon: <Building2    size={20} className="text-[#6366f1]" />, bg: "bg-[#6366f1]/10", text: "text-[#6366f1]" },
  hospital:    { label: "Hospital",    icon: <Stethoscope  size={20} className="text-[#ef4444]" />, bg: "bg-[#ef4444]/10", text: "text-[#ef4444]" },
  mall:        { label: "Mall",        icon: <ShoppingBag  size={20} className="text-[#f59e0b]" />, bg: "bg-[#f59e0b]/10", text: "text-[#f59e0b]" },
  residential: { label: "Residential", icon: <Home         size={20} className="text-[#38bdf8]" />, bg: "bg-[#38bdf8]/10", text: "text-[#38bdf8]" },
};

const EFFICIENCY_COLOR = (score: number) => {
  if (score >= 75) return { bar: "bg-[#22c55e]", label: "text-[#22c55e]", text: "Good" };
  if (score >= 45) return { bar: "bg-[#f59e0b]", label: "text-[#f59e0b]", text: "Fair" };
  return { bar: "bg-[#ef4444]", label: "text-[#ef4444]", text: "Poor" };
};

interface BuildingForm {
  name: string;
  type: BuildingType;
  totalFloors: number;
  totalArea: number;
  contactEmail: string;
  contactPhone: string;
  address: { line1: string; city: string; state: string; pincode: string; country: string };
}

const defaultForm = (): BuildingForm => ({
  name: "",
  type: "office",
  totalFloors: 1,
  totalArea: 0,
  contactEmail: "",
  contactPhone: "",
  address: { line1: "", city: "", state: "", pincode: "", country: "India" },
});

export default function Buildings() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [showModal, setShowModal]     = useState(false);
  const [showMgrModal, setShowMgrModal] = useState(false);
  const [editing, setEditing]         = useState<any>(null);
  const [mgrBuilding, setMgrBuilding] = useState<any>(null);
  const [selectedMgr, setSelectedMgr] = useState("");
  const [form, setForm]               = useState<BuildingForm>(defaultForm());

  // --- Queries ---
  const { data: buildings, isLoading } = useQuery({
    queryKey: ["buildings"],
    queryFn: () => api.get("/buildings?limit=100").then((r) => r.data.data.results ?? r.data.data),
  });

  // Fetch users eligible to be building_manager for the assign-manager modal
  const { data: eligibleUsers } = useQuery({
    queryKey: ["users-for-manager"],
    queryFn: () =>
      api.get("/auth/users").then((r) =>
        (r.data.data as any[]).filter((u) => u.role !== "super_admin")
      ),
    enabled: showMgrModal,
  });

  // --- Mutations ---
  const saveMutation = useMutation({
    mutationFn: (payload: any) =>
      editing
        ? api.patch(`/buildings/${editing._id}`, payload)
        : api.post("/buildings", payload),
    onSuccess: () => {
      toast.success(editing ? "Building updated" : "Building created");
      qc.invalidateQueries({ queryKey: ["buildings"] });
      setShowModal(false);
      setEditing(null);
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Error"),
  });

  const assignMgrMutation = useMutation({
    mutationFn: ({ buildingId, managerId }: { buildingId: string; managerId: string }) =>
      api.patch(`/buildings/${buildingId}/assign-manager`, { managerId }),
    onSuccess: () => {
      toast.success("Manager assigned successfully");
      qc.invalidateQueries({ queryKey: ["buildings"] });
      qc.invalidateQueries({ queryKey: ["users"] });
      qc.invalidateQueries({ queryKey: ["users-for-manager"] });
      setShowMgrModal(false);
      setMgrBuilding(null);
      setSelectedMgr("");
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Failed to assign manager"),
  });

  const isSuperAdmin = user?.role === "super_admin";

  const openAdd = () => {
    setEditing(null);
    setForm(defaultForm());
    setShowModal(true);
  };

  const openEdit = (b: any) => {
    setEditing(b);
    setForm({
      name:         b.name        ?? "",
      type:         b.type        ?? "office",
      totalFloors:  b.totalFloors ?? 1,
      totalArea:    b.totalArea   ?? 0,
      contactEmail: b.contactEmail ?? "",
      contactPhone: b.contactPhone ?? "",
      address: {
        line1:   b.address?.line1   ?? "",
        city:    b.address?.city    ?? "",
        state:   b.address?.state   ?? "",
        pincode: b.address?.pincode ?? "",
        country: b.address?.country ?? "India",
      },
    });
    setShowModal(true);
  };

  const openAssignMgr = (b: any) => {
    setMgrBuilding(b);
    setSelectedMgr(b.manager?._id ?? "");
    setShowMgrModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(form);
  };

  const addr = (b: any) => {
    const a = b.address;
    if (!a) return "—";
    return [a.line1, a.city, a.state].filter(Boolean).join(", ") || "—";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-5 mb-6 border-b border-[#2a2a3a] flex items-center justify-between">
        <div>
          <h1 className="page-title">Buildings</h1>
          <p className="muted-text mt-1">Manage your properties and facilities</p>
        </div>
        {isSuperAdmin && (
          <button onClick={openAdd} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Add Building
          </button>
        )}
      </div>

      {/* Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card h-52 animate-pulse flex flex-col gap-4">
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-[#1a1a24] rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-[#1a1a24] w-2/3 rounded" />
                  <div className="h-3 bg-[#1a1a24] w-1/3 rounded" />
                </div>
              </div>
              <div className="h-3 bg-[#1a1a24] rounded w-full" />
              <div className="h-3 bg-[#1a1a24] rounded w-3/4" />
              <div className="h-10 bg-[#1a1a24] rounded-lg mt-auto" />
            </div>
          ))}
        </div>
      )}

      {/* Building cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {buildings?.map((b: any) => {
          const meta  = TYPE_META[b.type as BuildingType] ?? TYPE_META.office;
          const eff   = EFFICIENCY_COLOR(b.efficiencyScore ?? 0);
          const score = b.efficiencyScore ?? 0;

          return (
            <div
              key={b._id}
              className="card p-0 overflow-hidden flex flex-col group cursor-default transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-[#6366f1]/5"
            >
              <div className="p-5 flex-1 relative">
                {/* Action buttons */}
                {isSuperAdmin && (
                  <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openAssignMgr(b)}
                      title="Assign Manager"
                      className="btn-ghost p-1.5 bg-[#1a1a24] hover:text-[#6366f1]"
                    >
                      <UserCheck size={14} />
                    </button>
                    <button
                      onClick={() => openEdit(b)}
                      title="Edit Building"
                      className="btn-ghost p-1.5 bg-[#1a1a24] hover:text-[#6366f1]"
                    >
                      <Edit2 size={14} />
                    </button>
                  </div>
                )}

                {/* Icon + Name */}
                <div className="flex items-start gap-4 mb-4 pr-16">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${meta.bg}`}>
                    {meta.icon}
                  </div>
                  <div>
                    <h2 className="text-[16px] font-[600] text-[#f1f1f3] mb-1 leading-snug">{b.name}</h2>
                    <Badge className={`border border-[#3d3d55] text-xs px-2 py-0 ${meta.text} bg-transparent`}>
                      {meta.label}
                    </Badge>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2 mt-4">
                  <div className="flex items-start gap-2 text-[13px] text-[#8b8b9e]">
                    <MapPin size={14} className="mt-0.5 text-[#55556a] flex-shrink-0" />
                    <span className="leading-snug">{addr(b)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[13px]">
                    <User size={14} className="text-[#55556a] flex-shrink-0" />
                    {b.manager?.name ? (
                      <span className="text-[#34d399]">
                        {b.manager.name}
                        <span className="text-[#55556a] ml-1 text-[11px]">(Manager)</span>
                      </span>
                    ) : (
                      <span className="text-[#f59e0b]">
                        Unassigned
                        {isSuperAdmin && (
                          <button
                            onClick={() => openAssignMgr(b)}
                            className="ml-2 text-[#6366f1] text-[11px] underline underline-offset-2 hover:text-[#818cf8]"
                          >
                            Assign
                          </button>
                        )}
                      </span>
                    )}
                  </div>
                  {b.contactPhone && (
                    <div className="flex items-center gap-2 text-[13px] text-[#8b8b9e]">
                      <Phone size={14} className="text-[#55556a]" />
                      <span>{b.contactPhone}</span>
                    </div>
                  )}
                </div>

                {/* Efficiency bar */}
                <div className="mt-5 space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#8b8b9e]">Energy Efficiency</span>
                    <span className={eff.label}>{score}% — {eff.text}</span>
                  </div>
                  <div className="w-full bg-[#1a1a24] rounded-full h-1.5">
                    <div
                      className={`${eff.bar} h-1.5 rounded-full transition-all`}
                      style={{ width: `${score}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Footer stats */}
              <div className="grid grid-cols-2 bg-[#1a1a24] border-t border-[#2a2a3a]">
                <div className="p-3 flex items-center justify-center gap-2 border-r border-[#2a2a3a] text-[13px] text-[#8b8b9e]">
                  <Layers size={14} className="text-[#6366f1]" />
                  {b.totalFloors || 0} Floor{b.totalFloors !== 1 ? "s" : ""}
                </div>
                <div className="p-3 flex items-center justify-center gap-2 text-[13px] text-[#8b8b9e]">
                  <Factory size={14} className="text-[#6366f1]" />
                  {b.totalArea ? `${b.totalArea.toLocaleString()} m²` : "—"}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {!isLoading && (!buildings || buildings.length === 0) && (
        <div className="empty-state py-16">
          <Building2 size={48} className="mx-auto mb-4 text-[#55556a]" />
          <p className="text-[#55556a]">No buildings found</p>
          {isSuperAdmin && (
            <button onClick={openAdd} className="btn-primary mt-4">
              Add your first building
            </button>
          )}
        </div>
      )}

      {/* ─── Add / Edit Building Modal ─── */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? `Edit — ${editing.name}` : "Add New Building"}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div>
            <label className="card-label block mb-2">Building Name *</label>
            <input
              className="input w-full"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. E-6 Block"
            />
          </div>

          {/* Type + Floors */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="card-label block mb-2">Type *</label>
              <select
                className="input w-full"
                required
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as BuildingType })}
              >
                {BUILDING_TYPES.map((t) => (
                  <option key={t} value={t}>{TYPE_META[t].label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="card-label block mb-2">Total Floors</label>
              <input
                type="number" min={1} className="input w-full"
                value={form.totalFloors}
                onChange={(e) => setForm({ ...form, totalFloors: +e.target.value })}
              />
            </div>
          </div>

          {/* Total Area + Contact Phone */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="card-label block mb-2">Total Area (m²)</label>
              <input
                type="number" min={0} className="input w-full"
                value={form.totalArea}
                onChange={(e) => setForm({ ...form, totalArea: +e.target.value })}
              />
            </div>
            <div>
              <label className="card-label block mb-2">Contact Phone</label>
              <input
                className="input w-full"
                value={form.contactPhone}
                onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                placeholder="+91 XXXXX XXXXX"
              />
            </div>
          </div>

          {/* Contact Email */}
          <div>
            <label className="card-label block mb-2">Contact Email</label>
            <input
              type="email" className="input w-full"
              value={form.contactEmail}
              onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
              placeholder="admin@building.com"
            />
          </div>

          {/* Address */}
          <div>
            <label className="card-label block mb-2">Street Address</label>
            <input
              className="input w-full"
              value={form.address.line1}
              onChange={(e) => setForm({ ...form, address: { ...form.address, line1: e.target.value } })}
              placeholder="Street / Block / Plot no."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="card-label block mb-2">City</label>
              <input
                className="input w-full"
                value={form.address.city}
                onChange={(e) => setForm({ ...form, address: { ...form.address, city: e.target.value } })}
              />
            </div>
            <div>
              <label className="card-label block mb-2">State</label>
              <input
                className="input w-full"
                value={form.address.state}
                onChange={(e) => setForm({ ...form, address: { ...form.address, state: e.target.value } })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="card-label block mb-2">Pincode</label>
              <input
                className="input w-full"
                value={form.address.pincode}
                onChange={(e) => setForm({ ...form, address: { ...form.address, pincode: e.target.value } })}
              />
            </div>
            <div>
              <label className="card-label block mb-2">Country</label>
              <input
                className="input w-full"
                value={form.address.country}
                onChange={(e) => setForm({ ...form, address: { ...form.address, country: e.target.value } })}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-[#2a2a3a]">
            <button type="button" onClick={() => setShowModal(false)} className="btn-ghost flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Saving..." : editing ? "Save Changes" : "Create Building"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ─── Assign Manager Modal ─── */}
      <Modal
        isOpen={showMgrModal}
        onClose={() => { setShowMgrModal(false); setMgrBuilding(null); setSelectedMgr(""); }}
        title={`Assign Manager — ${mgrBuilding?.name ?? ""}`}
      >
        <div className="space-y-5">
          {/* Current manager info */}
          {mgrBuilding?.manager?.name && (
            <div className="bg-[#1a1a24] border border-[#2a2a3a] rounded-lg px-4 py-3 flex items-center gap-3">
              <UserCheck size={16} className="text-[#34d399]" />
              <div>
                <p className="text-[13px] text-[#8b8b9e]">Current Manager</p>
                <p className="text-[14px] font-medium text-[#f1f1f3]">{mgrBuilding.manager.name}</p>
                <p className="text-[12px] text-[#55556a]">{mgrBuilding.manager.email}</p>
              </div>
            </div>
          )}

          <div>
            <label className="card-label block mb-2">Select New Manager *</label>
            <select
              className="input w-full"
              value={selectedMgr}
              onChange={(e) => setSelectedMgr(e.target.value)}
            >
              <option value="">— Choose a user —</option>
              {eligibleUsers?.map((u: any) => (
                <option key={u._id} value={u._id}>
                  {u.name} ({u.role.replace("_", " ")})
                  {u.building?.name ? ` · ${u.building.name}` : ""}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-[#55556a] mt-1">
              The selected user will be promoted to Building Manager and linked to this building.
            </p>
          </div>

          <div className="flex gap-3 pt-4 border-t border-[#2a2a3a]">
            <button
              type="button"
              onClick={() => { setShowMgrModal(false); setMgrBuilding(null); setSelectedMgr(""); }}
              className="btn-ghost flex-1"
            >
              Cancel
            </button>
            <button
              className="btn-primary flex-1"
              disabled={!selectedMgr || assignMgrMutation.isPending}
              onClick={() =>
                assignMgrMutation.mutate({ buildingId: mgrBuilding._id, managerId: selectedMgr })
              }
            >
              {assignMgrMutation.isPending ? "Assigning..." : "Assign Manager"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
