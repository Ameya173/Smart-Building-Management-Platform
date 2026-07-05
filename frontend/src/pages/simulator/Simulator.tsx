import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth, getBuildingId } from "../../context/AuthContext";
import api from "../../lib/axios";
import { BrainCircuit, Activity, Wrench, PiggyBank, AlertCircle } from "lucide-react";
import StatCard from "../../components/ui/StatCard";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from "recharts";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#111118] border border-[#2a2a3a] rounded-lg p-3 shadow-xl">
        <p className="text-[#8b8b9e] text-xs mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} className="text-[13px] font-semibold" style={{ color: p.color }}>
            {p.name}: {p.name === "Savings" ? `₹${p.value.toLocaleString()}` : p.name === "Health" ? `${p.value}%` : p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Simulator() {
  const { user } = useAuth();
  const buildingId = getBuildingId(user);
  
  const [budget, setBudget] = useState(500000);
  const [debouncedBudget, setDebouncedBudget] = useState(budget);

  // Debounce the slider input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedBudget(budget);
    }, 300);
    return () => clearTimeout(handler);
  }, [budget]);

  const buildingQuery = buildingId ? `building=${buildingId}&` : "";
  
  const { data, isLoading } = useQuery({
    queryKey: ["simulator", buildingId, debouncedBudget],
    queryFn: () => api.get(`/simulator/predict?${buildingQuery}budget=${debouncedBudget}`).then(r => r.data.data),
    staleTime: 60000,
  });

  const chartData = data?.predictions || [];

  return (
    <div className="space-y-6">
      <div className="pb-5 mb-6 border-b border-[#2a2a3a]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8b5cf6] to-[#6366f1] flex items-center justify-center text-white shadow-lg shadow-[#6366f1]/20">
            <BrainCircuit size={20} />
          </div>
          <div>
            <h1 className="page-title">AI Predictive Simulator</h1>
            <p className="muted-text mt-1">Simulate building health & maintenance outcomes based on budget</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Column - Controls & Summary */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card">
            <h2 className="section-title mb-4">Maintenance Budget</h2>
            <div className="mb-6">
              <label className="text-[13px] text-[#8b8b9e] block mb-2">Annual Budget (₹)</label>
              <div className="text-2xl font-bold text-[#f1f1f3] mb-4">
                ₹{budget.toLocaleString()}
              </div>
              <input
                type="range"
                min="100000"
                max="2000000"
                step="50000"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="w-full h-2 bg-[#2a2a3a] rounded-lg appearance-none cursor-pointer accent-[#6366f1]"
              />
              <div className="flex justify-between text-[11px] text-[#55556a] mt-2 font-mono">
                <span>₹1L</span>
                <span>₹10L</span>
                <span>₹20L</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#1a1a24] border border-[#2a2a3a]">
                <p className="text-[12px] text-[#8b8b9e] mb-1">Health Today</p>
                <div className="flex items-end gap-2">
                  <span className="text-xl font-semibold text-[#f1f1f3]">{data?.currentHealth || 0}%</span>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-[#1a1a24] border border-[#2a2a3a]">
                <p className="text-[12px] text-[#8b8b9e] mb-1">Health in 6 Months</p>
                <div className="flex items-end gap-2">
                  <span className={`text-xl font-semibold ${data?.sixMonthHealth < (data?.currentHealth || 0) ? 'text-red-400' : 'text-green-400'}`}>
                    {data?.sixMonthHealth || 0}%
                  </span>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-[#1a1a24] border border-[#2a2a3a]">
                <p className="text-[12px] text-[#8b8b9e] mb-1">Health in 12 Months</p>
                <div className="flex items-end gap-2">
                  <span className={`text-xl font-semibold ${data?.twelveMonthHealth < (data?.currentHealth || 0) ? 'text-red-400' : 'text-green-400'}`}>
                    {data?.twelveMonthHealth || 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-[#1e1b4b] to-[#111118] border-[#4338ca]">
            <div className="flex gap-3 mb-2">
              <AlertCircle size={18} className="text-[#818cf8]" />
              <h3 className="text-sm font-semibold text-[#c7d2fe]">AI Recommendation</h3>
            </div>
            <p className="text-[13px] text-[#a5b4fc] leading-relaxed">
              {isLoading ? "Analyzing..." : data?.recommendation}
            </p>
          </div>
        </div>

        {/* Right Column - Charts */}
        <div className="lg:col-span-3 space-y-4">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StatCard 
              title="Predicted Breakdowns (12m)" 
              value={data?.totalBreakdowns || 0} 
              icon={Wrench} 
              iconColorClass="text-[#f59e0b] bg-[#f59e0b]/10" 
            />
            <StatCard 
              title="Estimated Savings (12m)" 
              value={`₹${(data?.totalSavings || 0).toLocaleString()}`} 
              icon={PiggyBank} 
              iconColorClass={data?.totalSavings >= 0 ? "text-[#22c55e] bg-[#22c55e]/10" : "text-[#ef4444] bg-[#ef4444]/10"} 
            />
          </div>

          <div className="card h-[320px] flex flex-col">
            <div className="p-1 mb-4 flex items-center justify-between">
              <h2 className="section-title">Health Trajectory</h2>
              <div className="flex items-center gap-2 text-[12px] text-[#8b8b9e]">
                <span className="w-3 h-3 rounded-sm bg-[#38bdf8]/20 border border-[#38bdf8]"></span>
                Health %
              </div>
            </div>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2a2a3a" />
                  <XAxis dataKey="month" tick={{ fill: "#8b8b9e", fontSize: 12 }} axisLine={false} tickLine={false} dy={10} />
                  <YAxis domain={[0, 100]} tick={{ fill: "#8b8b9e", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="health" name="Health" stroke="#38bdf8" strokeWidth={3} dot={{ fill: '#38bdf8', r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="card h-[280px] flex flex-col">
              <div className="p-1 mb-4">
                <h2 className="section-title">Predicted Breakdowns</h2>
              </div>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorBrk" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2a2a3a" />
                    <XAxis dataKey="month" tick={{ fill: "#8b8b9e", fontSize: 12 }} axisLine={false} tickLine={false} dy={10} />
                    <YAxis tick={{ fill: "#8b8b9e", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="breakdowns" name="Breakdowns" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorBrk)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card h-[280px] flex flex-col">
              <div className="p-1 mb-4">
                <h2 className="section-title">Estimated Savings</h2>
              </div>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSav" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2a2a3a" />
                    <XAxis dataKey="month" tick={{ fill: "#8b8b9e", fontSize: 12 }} axisLine={false} tickLine={false} dy={10} />
                    <YAxis tick={{ fill: "#8b8b9e", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v/1000}k`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="savings" name="Savings" stroke="#22c55e" strokeWidth={2} fillOpacity={1} fill="url(#colorSav)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
