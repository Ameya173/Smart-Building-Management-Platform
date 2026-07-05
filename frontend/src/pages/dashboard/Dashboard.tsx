import { useQuery } from "@tanstack/react-query";
import { useAuth, getBuildingId } from "../../context/AuthContext";
import api from "../../lib/axios";
import { Package, Wrench, MessageSquare, Car, Activity, Users, CheckCircle, AlertTriangle } from "lucide-react";
import StatCard from "../../components/ui/StatCard";
import Badge from "../../components/ui/Badge";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#111118] border border-[#2a2a3a] rounded-lg p-3 shadow-xl">
        <p className="text-[#8b8b9e] text-xs mb-1">{label}</p>
        <p className="text-[#f1f1f3] font-semibold">{payload[0].value} Tickets</p>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const { user } = useAuth();
  const buildingId = getBuildingId(user);
  const buildingQuery = buildingId ? `?building=${buildingId}` : "";

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", buildingId],
    queryFn: () => api.get(`/dashboard/stats${buildingQuery}`).then((r) => r.data.data),
  });

  if (isLoading) {
    return <div className="empty-state"><p className="muted-text">Loading dashboard...</p></div>;
  }

  // Format chart data
  const ticketTrendData = (data?.ticketTrend || []).map((item: any) => ({
    name: `${MONTHS[item._id.month - 1]} ${item._id.year}`,
    tickets: item.count
  }));

  const assetStatusData = [
    { name: "Operational", value: data?.assets?.operational || 0, color: "#22c55e" },
    { name: "Faulty", value: data?.assets?.faulty || 0, color: "#ef4444" },
    { name: "Maintenance", value: (data?.assets?.total || 0) - (data?.assets?.operational || 0) - (data?.assets?.faulty || 0), color: "#f59e0b" }
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      <div className="pb-5 mb-6 border-b border-[#2a2a3a]">
        <h1 className="page-title">Dashboard</h1>
        <p className="muted-text mt-1">Overview of your facility operations</p>
      </div>

      {/* Row 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Assets" value={data?.assets?.total || 0} icon={Package} />
        <StatCard title="Open Tickets" value={data?.maintenance?.open || 0} icon={Wrench} iconColorClass="text-[#f59e0b] bg-[#f59e0b]/10" />
        <StatCard title="Open Complaints" value={data?.complaints?.open || 0} icon={MessageSquare} iconColorClass="text-[#ef4444] bg-[#ef4444]/10" />
        <StatCard title="Parking Available" value={data?.parking?.available || 0} icon={Car} iconColorClass="text-[#22c55e] bg-[#22c55e]/10" />
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Avg Health Score" value={`${data?.assets?.avgHealthScore || 0}%`} icon={Activity} />
        <StatCard title="Today's Visitors" value={data?.visitors?.today || 0} icon={Users} iconColorClass="text-[#38bdf8] bg-[#38bdf8]/10" />
        <StatCard title="Resolution Rate" value={`${data?.maintenance?.resolutionRate || 0}%`} icon={CheckCircle} iconColorClass="text-[#22c55e] bg-[#22c55e]/10" />
        <StatCard title="Faulty Assets" value={data?.assets?.faulty || 0} icon={AlertTriangle} iconColorClass="text-[#ef4444] bg-[#ef4444]/10" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card lg:col-span-2">
          <h2 className="section-title mb-6">Tickets (Last 6 Months)</h2>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ticketTrendData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fill: "#8b8b9e", fontSize: 12 }} axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{ fill: "#8b8b9e", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "#1a1a24" }} />
                <Bar dataKey="tickets" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="card lg:col-span-1">
          <h2 className="section-title mb-2">Asset Status</h2>
          <div className="h-[260px] flex items-center justify-center">
            {assetStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={assetStatusData}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {assetStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#111118", borderColor: "#2a2a3a", borderRadius: "8px" }} 
                    itemStyle={{ color: "#f1f1f3" }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: "12px", color: "#8b8b9e" }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="muted-text">No asset data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-0 overflow-hidden">
          <div className="p-5 border-b border-[#2a2a3a]">
            <h2 className="section-title">Recent Tickets</h2>
          </div>
          <div className="divide-y divide-[#2a2a3a]">
            {data?.recentTickets?.length > 0 ? data.recentTickets.map((t: any) => (
              <div key={t._id} className="p-4 hover:bg-[#1a1a24] transition-colors flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${t.priority === "critical" ? "bg-red-500" : t.priority === "high" ? "bg-orange-500" : t.priority === "medium" ? "bg-yellow-500" : "bg-green-500"}`} />
                  <div>
                    <p className="text-[14px] font-[500] text-[#f1f1f3]">{t.title}</p>
                    <p className="text-[12px] text-[#55556a] mt-0.5">{t.asset?.name || "General"} • {new Date(t.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <Badge status={t.status} />
              </div>
            )) : (
              <div className="p-8 text-center text-[#55556a] text-sm">No recent tickets</div>
            )}
          </div>
        </div>

        <div className="card p-0 overflow-hidden">
          <div className="p-5 border-b border-[#2a2a3a]">
            <h2 className="section-title">Recent Complaints</h2>
          </div>
          <div className="divide-y divide-[#2a2a3a]">
            {data?.recentComplaints?.length > 0 ? data.recentComplaints.map((c: any) => (
              <div key={c._id} className="p-4 hover:bg-[#1a1a24] transition-colors flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${c.status === "open" || c.status === "pending" ? "bg-red-500" : c.status === "in_progress" ? "bg-blue-500" : "bg-green-500"}`} />
                  <div>
                    <p className="text-[14px] font-[500] text-[#f1f1f3]">{c.title}</p>
                    <p className="text-[12px] text-[#55556a] mt-0.5">{c.category?.replace("_"," ")} • {new Date(c.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <Badge status={c.status} />
              </div>
            )) : (
              <div className="p-8 text-center text-[#55556a] text-sm">No recent complaints</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
