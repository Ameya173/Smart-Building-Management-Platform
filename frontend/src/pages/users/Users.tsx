import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/axios";
import toast from "react-hot-toast";
import { Plus, Search, Shield, User, Trash2, Edit2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import Badge from "../../components/ui/Badge";
import Modal from "../../components/ui/Modal";
import SkeletonRow from "../../components/ui/SkeletonRow";

const ALL_ROLES = [
  "resident",
  "building_manager",
  "security_staff",
  "maintenance_staff",
  "super_admin",
] as const;

// Roles assignable by super_admin when creating/editing other users
const ASSIGNABLE_ROLES = ALL_ROLES.filter((r) => r !== "super_admin");

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  building_manager: "Building Manager",
  security_staff: "Security Staff",
  maintenance_staff: "Maintenance Staff",
  resident: "Resident",
};

const ROLE_COLORS: Record<string, string> = {
  super_admin: "bg-[#6366f1]/20 text-[#818cf8] border-[#6366f1]/30",
  building_manager: "bg-[#0ea5e9]/20 text-[#38bdf8] border-[#0ea5e9]/30",
  security_staff: "bg-[#f59e0b]/20 text-[#fbbf24] border-[#f59e0b]/30",
  maintenance_staff: "bg-[#10b981]/20 text-[#34d399] border-[#10b981]/30",
  resident: "bg-[#1a1a24] text-[#8b8b9e] border-[#2a2a3a]",
};

interface FormState {
  name: string;
  email: string;
  password?: string;
  role: string;
  building: string;
}

export default function Users() {
  const { user: currentUser } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    password: "",
    role: "resident",
    building: "",
  });

  const { data: users, isLoading } = useQuery({
    queryKey: ["users", search, filterRole],
    queryFn: () => {
      const p = new URLSearchParams();
      if (search) p.set("search", search);
      if (filterRole) p.set("role", filterRole);
      return api.get(`/auth/users?${p}`).then((r) => r.data.data);
    },
    enabled: currentUser?.role === "super_admin",
  });

  const { data: buildings } = useQuery({
    queryKey: ["buildings-list"],
    queryFn: () =>
      api.get("/buildings?limit=100").then((r) => r.data.data.results ?? r.data.data),
    enabled: currentUser?.role === "super_admin",
  });

  const saveMutation = useMutation({
    mutationFn: (payload: any) => {
      if (editing) {
        // PATCH existing user — send only what changed
        return api.patch(`/auth/users/${editing._id}`, payload);
      }
      // Create via register
      return api.post("/auth/register", payload);
    },
    onSuccess: () => {
      toast.success(editing ? "User updated" : "User invited — OTP sent to email");
      qc.invalidateQueries({ queryKey: ["users"] });
      qc.invalidateQueries({ queryKey: ["buildings"] });         // reflect manager changes
      qc.invalidateQueries({ queryKey: ["users-for-manager"] }); // refresh assign-mgr picker
      setShowModal(false);
      setEditing(null);
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.message || "An error occurred"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/auth/users/${id}`),
    onSuccess: () => {
      toast.success("User deleted");
      qc.invalidateQueries({ queryKey: ["users"] });
      qc.invalidateQueries({ queryKey: ["buildings"] });         // manager may have been removed
      qc.invalidateQueries({ queryKey: ["users-for-manager"] });
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.message || "Cannot delete user"),
  });

  if (currentUser?.role !== "super_admin") {
    return (
      <div className="empty-state">
        <Shield size={48} className="mx-auto mb-4 text-[#55556a]" />
        <p>You don't have permission to access this page.</p>
      </div>
    );
  }

  const openAdd = () => {
    setEditing(null);
    setForm({ name: "", email: "", password: "", role: "resident", building: "" });
    setShowModal(true);
  };

  const openEdit = (u: any) => {
    setEditing(u);
    setForm({
      name: u.name,
      email: u.email,
      role: u.role,
      building: u.building?._id ?? u.building ?? "",
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = { ...form };
    // Don't send password on edit
    if (editing) delete payload.password;
    // Clear building for super_admin
    if (payload.role === "super_admin") payload.building = null;
    saveMutation.mutate(payload);
  };

  const handleDelete = (u: any) => {
    if (u.role === "super_admin") {
      toast.error("Cannot delete a super admin account");
      return;
    }
    if (confirm(`Delete user "${u.name}"? This cannot be undone.`)) {
      deleteMutation.mutate(u._id);
    }
  };

  const isSuperAdmin = (u: any) => u.role === "super_admin";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-5 mb-6 border-b border-[#2a2a3a] flex items-center justify-between">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="muted-text mt-1">
            Manage accounts, roles, building assignments, and permissions
          </p>
        </div>
        <button
          onClick={openAdd}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={16} /> Invite User
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[240px]">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#55556a]"
          />
          <input
            className="input pl-9 w-full"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input w-[200px]"
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
        >
          <option value="">All Roles</option>
          {ALL_ROLES.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r]}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#111118] border-b border-[#2a2a3a]">
                {["User", "Role", "Building", "Status", "Joined", ""].map((h) => (
                  <th key={h} className="px-5 py-3 card-label">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && <SkeletonRow columns={6} />}
              {!isLoading && (!users || users.length === 0) && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-[#55556a]">
                    No users found
                  </td>
                </tr>
              )}
              {users?.map((u: any) => (
                <tr key={u._id} className="table-row group">
                  {/* User info */}
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#1a1a24] border border-[#2a2a3a] flex items-center justify-center flex-shrink-0">
                        {isSuperAdmin(u) ? (
                          <Shield size={16} className="text-[#6366f1]" />
                        ) : (
                          <User size={16} className="text-[#8b8b9e]" />
                        )}
                      </div>
                      <div>
                        <p className="text-[14px] font-[500] text-[#f1f1f3]">
                          {u.name}
                        </p>
                        <p className="text-[12px] text-[#55556a] mt-0.5">
                          {u.email}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Role badge */}
                  <td className="px-5 py-3">
                    <Badge
                      className={`border text-[11px] ${ROLE_COLORS[u.role] ?? ROLE_COLORS.resident}`}
                    >
                      {ROLE_LABELS[u.role] ?? u.role}
                    </Badge>
                  </td>

                  {/* Building */}
                  <td className="px-5 py-3 text-[13px] text-[#8b8b9e]">
                    {u.building?.name ?? (isSuperAdmin(u) ? "All Buildings" : "—")}
                  </td>

                  {/* Status */}
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex items-center gap-1.5 text-[12px] ${
                        u.isActive ? "text-[#34d399]" : "text-[#ef4444]"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          u.isActive ? "bg-[#34d399]" : "bg-[#ef4444]"
                        }`}
                      />
                      {u.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>

                  {/* Joined */}
                  <td className="px-5 py-3 text-[13px] text-[#8b8b9e]">
                    {new Date(u.createdAt).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-3 text-right">
                    {!isSuperAdmin(u) && (
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEdit(u)}
                          title="Edit user"
                          className="btn-ghost p-1.5 hover:bg-[#2a2a3a] hover:text-[#6366f1]"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(u)}
                          title="Delete user"
                          className="btn-ghost p-1.5 hover:bg-[#2a2a3a] hover:text-[#ef4444]"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                    {isSuperAdmin(u) && (
                      <span className="text-[11px] text-[#55556a] px-2">
                        Protected
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? `Edit — ${editing.name}` : "Invite New User"}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div>
            <label className="card-label block mb-2">Full Name *</label>
            <input
              className="input w-full"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          {/* Email */}
          <div>
            <label className="card-label block mb-2">Email Address *</label>
            <input
              type="email"
              className="input w-full"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          {/* Password — only on create */}
          {!editing && (
            <div>
              <label className="card-label block mb-2">Password *</label>
              <input
                type="password"
                minLength={6}
                className="input w-full"
                required
                value={form.password ?? ""}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Min. 6 characters"
              />
              <p className="text-[11px] text-[#55556a] mt-1">
                An OTP verification email will be sent to the user.
              </p>
            </div>
          )}

          {/* Role + Building */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="card-label block mb-2">Role *</label>
              <select
                className="input w-full"
                required
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value, building: "" })}
              >
                {ASSIGNABLE_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
            </div>

            {form.role !== "super_admin" && (
              <div>
                <label className="card-label block mb-2">
                  Building{" "}
                  <span className="text-[#55556a] text-[11px]">(optional)</span>
                </label>
                <select
                  className="input w-full"
                  value={form.building}
                  onChange={(e) => setForm({ ...form, building: e.target.value })}
                >
                  <option value="">— None —</option>
                  {buildings?.map((b: any) => (
                    <option key={b._id} value={b._id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Info note */}
          <p className="text-[12px] text-[#55556a] bg-[#111118] rounded-lg px-3 py-2 border border-[#2a2a3a]">
            ℹ️ Super admin accounts cannot be created or modified through this form.
          </p>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-[#2a2a3a]">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="btn-ghost flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1"
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending
                ? "Saving..."
                : editing
                ? "Save Changes"
                : "Create & Invite"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
