import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/axios";
import { Zap, DollarSign, CloudRain, Activity, Plus, X } from "lucide-react";
import { useAuth, getBuildingId } from "../../context/AuthContext";
import StatCard from "../../components/ui/StatCard";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import toast from "react-hot-toast";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#111118] border border-[#2a2a3a] rounded-lg p-3 shadow-xl">
        <p className="text-[#8b8b9e] text-xs mb-1">{label}</p>
        <p className="text-[#f1f1f3] font-semibold">
          {payload[0].value.toLocaleString()} {payload[0].name === "Consumption" ? "kWh" : "₹"}
        </p>
      </div>
    );
  }
  return null;
};

export default function Energy() {
  const { user } = useAuth();
  const buildingId = getBuildingId(user);
  const buildingQuery = buildingId ? `?building=${buildingId}` : "";
  const qc = useQueryClient();

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    electricityUnits: 0,
    electricityCost: 0,
    waterUnits: 0,
    waterCost: 0,
    solarUnits: 0,
    solarSavings: 0,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["energy", buildingId],
    queryFn: () => api.get(`/energy/summary${buildingQuery}`).then(r => r.data.data),
    enabled: !!buildingId,
  });

  const mutation = useMutation({
    mutationFn: (payload: any) => api.post("/energy", payload),
    onSuccess: () => {
      toast.success("Energy record added successfully");
      qc.invalidateQueries({ queryKey: ["energy", buildingId] });
      setShowModal(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to add energy record");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!buildingId) {
      toast.error("No building associated with your account.");
      return;
    }
    mutation.mutate({
      building: buildingId,
      month: Number(formData.month),
      year: Number(formData.year),
      electricity: { units: Number(formData.electricityUnits), cost: Number(formData.electricityCost) },
      water: { units: Number(formData.waterUnits), cost: Number(formData.waterCost) },
      solar: { units: Number(formData.solarUnits), savings: Number(formData.solarSavings) },
    });
  };

  const chartData = (data?.trend || []).map((item: any) => ({
    name: `${MONTHS[item._id.month - 1]} ${item._id.year}`,
    Consumption: item.consumption,
    Cost: item.cost
  }));

  const canAddRecord = user?.role === "super_admin" || user?.role === "building_manager";

  if (isLoading) {
    return <div className="empty-state"><p className="muted-text">Loading energy analytics...</p></div>;
  }

  return (
    <div className="space-y-6 relative">
      <div className="pb-5 mb-6 border-b border-[#2a2a3a] flex items-center justify-between">
        <div>
          <h1 className="page-title">Energy Analytics</h1>
          <p className="muted-text mt-1">Monitor consumption and environmental impact</p>
        </div>
        {canAddRecord && (
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Add Record
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Consumption" value={`${Math.round(data?.stats?.totalConsumption || 0).toLocaleString()} kWh`} icon={Zap} iconColorClass="text-[#f59e0b] bg-[#f59e0b]/10" />
        <StatCard title="Total Cost" value={`₹${Math.round(data?.stats?.totalCost || 0).toLocaleString()}`} icon={DollarSign} iconColorClass="text-[#22c55e] bg-[#22c55e]/10" />
        <StatCard title="Carbon Emissions" value={`${Math.round(data?.stats?.totalEmissions || 0).toLocaleString()} kg`} icon={CloudRain} iconColorClass="text-[#38bdf8] bg-[#38bdf8]/10" />
        <StatCard title="Avg Daily Usage" value={`${Math.round(data?.stats?.avgDaily || 0).toLocaleString()} kWh`} icon={Activity} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card h-[400px] flex flex-col">
          <div className="p-1 mb-4 flex items-center justify-between">
            <h2 className="section-title">Consumption Over Time</h2>
            <div className="flex items-center gap-2 text-[12px] text-[#8b8b9e]">
              <span className="w-3 h-3 rounded-sm bg-[#6366f1]/20 border border-[#6366f1]"></span>
              kWh
            </div>
          </div>
          <div className="flex-1 min-h-0">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCons" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2a2a3a" />
                  <XAxis dataKey="name" tick={{ fill: "#8b8b9e", fontSize: 12 }} axisLine={false} tickLine={false} dy={10} />
                  <YAxis tick={{ fill: "#8b8b9e", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v/1000}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="Consumption" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorCons)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[#55556a] text-sm">No data available</div>
            )}
          </div>
        </div>

        <div className="card h-[400px] flex flex-col">
          <div className="p-1 mb-4 flex items-center justify-between">
            <h2 className="section-title">Cost Over Time</h2>
            <div className="flex items-center gap-2 text-[12px] text-[#8b8b9e]">
              <span className="w-3 h-3 rounded-sm bg-[#22c55e]/20 border border-[#22c55e]"></span>
              INR (₹)
            </div>
          </div>
          <div className="flex-1 min-h-0">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2a2a3a" />
                  <XAxis dataKey="name" tick={{ fill: "#8b8b9e", fontSize: 12 }} axisLine={false} tickLine={false} dy={10} />
                  <YAxis tick={{ fill: "#8b8b9e", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="Cost" stroke="#22c55e" strokeWidth={3} fillOpacity={1} fill="url(#colorCost)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[#55556a] text-sm">No data available</div>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111118] border border-[#2a2a3a] rounded-xl w-full max-w-md shadow-2xl p-6 relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-[#8b8b9e] hover:text-white"
            >
              <X size={20} />
            </button>
            <h2 className="text-xl font-semibold text-white mb-6">Add Energy Record</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Month</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    className="input w-full"
                    value={formData.month}
                    onChange={(e) => setFormData({ ...formData, month: Number(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Year</label>
                  <input
                    type="number"
                    className="input w-full"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div className="border-t border-[#2a2a3a] pt-4 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Electricity (kWh)</label>
                  <input
                    type="number"
                    className="input w-full"
                    value={formData.electricityUnits}
                    onChange={(e) => setFormData({ ...formData, electricityUnits: Number(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Electricity Cost (₹)</label>
                  <input
                    type="number"
                    className="input w-full"
                    value={formData.electricityCost}
                    onChange={(e) => setFormData({ ...formData, electricityCost: Number(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div className="border-t border-[#2a2a3a] pt-4 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Water (Liters/Gal)</label>
                  <input
                    type="number"
                    className="input w-full"
                    value={formData.waterUnits}
                    onChange={(e) => setFormData({ ...formData, waterUnits: Number(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Water Cost (₹)</label>
                  <input
                    type="number"
                    className="input w-full"
                    value={formData.waterCost}
                    onChange={(e) => setFormData({ ...formData, waterCost: Number(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div className="border-t border-[#2a2a3a] pt-4 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Solar Gen (kWh)</label>
                  <input
                    type="number"
                    className="input w-full"
                    value={formData.solarUnits}
                    onChange={(e) => setFormData({ ...formData, solarUnits: Number(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Solar Savings (₹)</label>
                  <input
                    type="number"
                    className="input w-full"
                    value={formData.solarSavings}
                    onChange={(e) => setFormData({ ...formData, solarSavings: Number(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="btn-ghost">
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={mutation.isPending}>
                  {mutation.isPending ? "Saving..." : "Save Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
