import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/axios";
import toast from "react-hot-toast";
import { Plus, Users, Clock, X, Calendar as CalendarIcon, AlertCircle } from "lucide-react";
import { useAuth, getBuildingId } from "../../context/AuthContext";
import Badge from "../../components/ui/Badge";
import Modal from "../../components/ui/Modal";

export default function Bookings() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [showModal, setShowModal] = useState(false);
  
  // Date time math for form defaults
  const nextHour = new Date();
  nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
  const nextTwoHours = new Date(nextHour);
  nextTwoHours.setHours(nextTwoHours.getHours() + 1);
  const toLocalIsoStr = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

  const [form, setForm] = useState<any>({
    startTime: toLocalIsoStr(nextHour),
    endTime: toLocalIsoStr(nextTwoHours)
  });

  const [selectedBuilding, setSelectedBuilding] = useState("");
  const userBuildingId = getBuildingId(user);
  const buildingId = user?.role === "super_admin" ? selectedBuilding : userBuildingId;
  const isResident = user?.role === "resident";
  const hasNoBuilding = isResident && !userBuildingId;

  const { data: buildings } = useQuery({
    queryKey: ["buildings-list"],
    queryFn: () => api.get("/buildings?limit=100").then(r => r.data.data.results),
    enabled: user?.role === "super_admin",
  });

  const { data: rooms } = useQuery({
    queryKey: ["rooms", buildingId],
    queryFn: () => api.get(`/rooms?${buildingId ? `building=${buildingId}` : ""}`).then(r => r.data.data),
    enabled: !hasNoBuilding && (!!buildingId || user?.role === "super_admin"),
  });
  
  const roomList = Array.isArray(rooms) ? rooms : rooms?.results || [];

  const { data: bookings, isLoading } = useQuery({
    queryKey: ["bookings", buildingId, selectedDate],
    queryFn: () => {
      const p = new URLSearchParams();
      if (buildingId) p.set("building", buildingId);
      
      // Filter by the selected date
      const start = new Date(selectedDate);
      start.setHours(0,0,0,0);
      const end = new Date(selectedDate);
      end.setHours(23,59,59,999);
      
      p.set("startTime", start.toISOString());
      p.set("endTime", end.toISOString());
      
      return api.get(`/bookings?${p}`).then(r => r.data.data.results);
    },
    enabled: !hasNoBuilding && (!!buildingId || user?.role === "super_admin"),
  });

  const createMutation = useMutation({
    mutationFn: (d: any) => api.post("/bookings", d),
    onSuccess: () => { toast.success("Room booked successfully"); qc.invalidateQueries({queryKey:["bookings"], exact: false}); setShowModal(false); },
    onError: (e: any) => toast.error(e.response?.data?.message||"Error"),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/bookings/${id}/cancel`),
    onSuccess: () => { toast.success("Booking cancelled"); qc.invalidateQueries({queryKey:["bookings"], exact: false}); },
  });

  // Calendar logic for simple date picker
  const today = new Date();
  today.setHours(0,0,0,0);
  
  const calendarDays = [];
  for (let i = -3; i <= 10; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    calendarDays.push(d);
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="pb-5 mb-6 border-b border-[#2a2a3a] flex items-center justify-between">
        <div>
          <h1 className="page-title">Bookings</h1>
          <p className="muted-text mt-1">Reserve meeting rooms and amenities</p>
        </div>
        <button onClick={()=>setShowModal(true)} disabled={hasNoBuilding || (!buildingId && user?.role !== 'super_admin')} className="btn-primary flex items-center gap-2 disabled:opacity-50">
          <Plus size={16}/> Book a Room
        </button>
      </div>

      {hasNoBuilding && (
        <div className="card flex items-start gap-3 border-[#f59e0b]/30 bg-[#f59e0b]/5 mb-6">
          <AlertCircle size={20} className="text-[#f59e0b] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[14px] font-[500] text-[#f1f1f3]">No building assigned</p>
            <p className="text-[13px] text-[#8b8b9e] mt-0.5">Please contact your building administrator to be assigned to a building before making bookings.</p>
          </div>
        </div>
      )}

      {user?.role === "super_admin" && (
        <div className="mb-6">
          <select className="input w-[240px]" value={selectedBuilding} onChange={e=>setSelectedBuilding(e.target.value)}>
            <option value="">All buildings</option>
            {buildings?.map((b: any)=><option key={b._id} value={b._id}>{b.name}</option>)}
          </select>
        </div>
      )}

      {!hasNoBuilding && (
        <div className="flex flex-col md:flex-row gap-6">
          {/* Left Panel - Mini Calendar */}
          <div className="md:w-1/3 flex-shrink-0">
            <div className="card p-5 sticky top-6">
              <div className="flex items-center gap-2 mb-4">
                <CalendarIcon size={18} className="text-[#6366f1]" />
                <h2 className="section-title">Select Date</h2>
              </div>
              <div className="space-y-1">
                {calendarDays.map((d, i) => {
                  const dateStr = d.toISOString().split("T")[0];
                  const isSelected = selectedDate === dateStr;
                  const isToday = d.getTime() === today.getTime();
                  return (
                    <button
                      key={i}
                      onClick={() => setSelectedDate(dateStr)}
                      className={`w-full flex items-center justify-between p-3 rounded-lg text-sm font-medium transition-colors ${
                        isSelected 
                          ? "bg-[#6366f1] text-white" 
                          : "text-[#8b8b9e] hover:bg-[#1a1a24] hover:text-[#f1f1f3]"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="w-8 text-left">{d.toLocaleDateString(undefined, { weekday: 'short' })}</span>
                        <span className="text-[15px]">{d.getDate()} {d.toLocaleDateString(undefined, { month: 'short' })}</span>
                      </span>
                      {isToday && <span className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded ${isSelected ? "bg-white/20" : "bg-[#2a2a3a] text-[#55556a]"}`}>Today</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Panel - Bookings List */}
          <div className="flex-1 space-y-4">
            <h2 className="section-title mb-2 text-[#8b8b9e]">
              Schedule for {new Date(selectedDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </h2>

            {isLoading && (
              <div className="space-y-4">
                {[1,2,3].map(i => <div key={i} className="card h-24 animate-pulse"></div>)}
              </div>
            )}
            
            {!isLoading && bookings?.length === 0 && (
              <div className="empty-state card border-dashed">
                <CalendarIcon size={48} className="text-[#2a2a3a] mb-4" />
                <h3 className="text-[16px] text-[#8b8b9e] font-medium">No bookings</h3>
                <p className="text-[13px] text-[#55556a] mt-1">There are no bookings for this date.</p>
              </div>
            )}

            {bookings?.map((b: any) => {
              const start = new Date(b.startTime);
              const end = new Date(b.endTime);
              const canCancel = ["super_admin", "building_manager"].includes(user?.role||"") || b.user?._id === user?._id;
              
              return (
                <div key={b._id} className={`card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-l-4 ${b.status === "confirmed" ? "border-l-[#22c55e]" : b.status === "cancelled" ? "border-l-[#2a2a3a] opacity-60" : "border-l-[#f59e0b]"}`}>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-[16px] font-[600] text-[#f1f1f3]">{b.title}</h3>
                      <Badge status={b.status} />
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-[#8b8b9e]">
                      <div className="flex items-center gap-1.5">
                        <Clock size={14} className="text-[#55556a]" />
                        {start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {end.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                      <div className="flex items-center gap-1.5 font-medium text-[#f1f1f3]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#6366f1]" />
                        {b.room?.name || "Room"}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users size={14} className="text-[#55556a]" />
                        {b.user?.name}
                      </div>
                    </div>
                  </div>
                  
                  {b.status === "confirmed" && canCancel && (
                    <button 
                      onClick={() => { if(confirm("Cancel this booking?")) cancelMutation.mutate(b._id); }}
                      className="btn-danger sm:ml-auto"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Book a Room">
        <form onSubmit={e=>{e.preventDefault();createMutation.mutate({...form, building: buildingId});}} className="space-y-5">
          <div>
            <label className="card-label block mb-2">Meeting Title *</label>
            <input className="input w-full" required placeholder="e.g. Project Sync" value={form.title||""} onChange={e=>setForm({...form,title:e.target.value})}/>
          </div>
          
          <div>
            <label className="card-label block mb-2">Select Room *</label>
            <select className="input w-full" required value={form.room||""} onChange={e=>setForm({...form,room:e.target.value})}>
              <option value="">Choose a room...</option>
              {roomList.map((r: any) => (
                <option key={r._id} value={r._id} disabled={!r.isBookable}>
                  {r.name} • {r.capacity} ppl • {r.type.replace("_"," ")} {!r.isBookable ? "(Unavailable)" : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="card-label block mb-2">Start Time *</label>
              <input type="datetime-local" className="input w-full text-sm" required value={form.startTime||""} onChange={e=>setForm({...form,startTime:e.target.value})}/>
            </div>
            <div>
              <label className="card-label block mb-2">End Time *</label>
              <input type="datetime-local" className="input w-full text-sm" required value={form.endTime||""} onChange={e=>setForm({...form,endTime:e.target.value})}/>
            </div>
          </div>
          
          <div className="flex gap-3 pt-4 border-t border-[#2a2a3a]">
            <button type="button" onClick={()=>setShowModal(false)} className="btn-ghost flex-1">Cancel</button>
            <button type="submit" disabled={createMutation.isPending || !form.room} className="btn-primary flex-1">
              {createMutation.isPending ? "Booking..." : "Confirm Booking"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
