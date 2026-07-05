import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/axios";
import toast from "react-hot-toast";
import { Car, LogIn, LogOut, Plus, AlertCircle, Maximize, Hash } from "lucide-react";
import { useAuth, getBuildingId } from "../../context/AuthContext";
import StatCard from "../../components/ui/StatCard";
import Modal from "../../components/ui/Modal";

const SLOT_TYPES = ["car","bike","visitor","reserved"];

export default function Parking() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [slotForm, setSlotForm] = useState<any>({ type: "car", floor: "Ground" });
  const [selectedBuilding, setSelectedBuilding] = useState("");

  const userBuildingId = getBuildingId(user);
  const buildingId = user?.role === "super_admin" ? selectedBuilding : userBuildingId;
  const isResident = user?.role === "resident";
  const hasNoBuilding = isResident && !userBuildingId;
  const canManage = ["super_admin","building_manager"].includes(user?.role || "");

  const { data: buildings } = useQuery({
    queryKey: ["buildings-list"],
    queryFn: () => api.get("/buildings?limit=100").then(r => r.data.data.results),
    enabled: user?.role === "super_admin",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["parking", buildingId],
    queryFn: () => {
      const params = new URLSearchParams();
      if (buildingId) params.set("building", buildingId);
      return api.get(`/parking?${params}`).then(r => r.data.data);
    },
    enabled: !hasNoBuilding && (!!buildingId || user?.role === "super_admin"),
  });

  const checkInMutation = useMutation({
    mutationFn: ({ id }: any) => api.patch(`/parking/${id}/check-in`, { vehicleNumber }),
    onSuccess: () => { toast.success("Parked successfully!"); qc.invalidateQueries({queryKey:["parking"], exact: false}); setVehicleNumber(""); },
    onError: (e: any) => toast.error(e.response?.data?.message||"Error"),
  });

  const checkOutMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/parking/${id}/check-out`),
    onSuccess: () => { toast.success("Checked out"); qc.invalidateQueries({queryKey:["parking"], exact: false}); },
    onError: (e: any) => toast.error(e.response?.data?.message||"Error"),
  });

  const createSlotMutation = useMutation({
    mutationFn: (d: any) => api.post("/parking", d),
    onSuccess: () => {
      toast.success("Parking slot created");
      qc.invalidateQueries({ queryKey: ["parking"], exact: false });
      setShowModal(false);
      setSlotForm({ type: "car", floor: "Ground" });
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Error"),
  });

  return (
    <div className="space-y-6">
      <div className="pb-5 mb-6 border-b border-[#2a2a3a] flex items-center justify-between">
        <div>
          <h1 className="page-title">Smart Parking</h1>
          <p className="muted-text mt-1">
            {data?.available||0} available / {data?.totalSlots||0} total slots
          </p>
        </div>
        {canManage && (
          <button
            onClick={()=>setShowModal(true)}
            disabled={!buildingId}
            className="btn-primary flex items-center gap-2 disabled:opacity-50"
          >
            <Plus size={16}/> Add Slot
          </button>
        )}
      </div>

      {hasNoBuilding && (
        <div className="card flex items-start gap-3 border-[#f59e0b]/30 bg-[#f59e0b]/5 mb-6">
          <AlertCircle size={20} className="text-[#f59e0b] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[14px] font-[500] text-[#f1f1f3]">No building assigned</p>
            <p className="text-[13px] text-[#8b8b9e] mt-0.5">Please contact your building administrator to be assigned to a building before accessing parking.</p>
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

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total Slots" value={data?.totalSlots || 0} icon={Maximize} />
        <StatCard title="Available" value={data?.available || 0} icon={CheckCircle2} iconColorClass="text-[#22c55e] bg-[#22c55e]/10" />
        <StatCard title="Occupied" value={data?.occupied || 0} icon={Car} iconColorClass="text-[#ef4444] bg-[#ef4444]/10" />
      </div>

      {/* Parking grid */}
      {!hasNoBuilding && (
        <div className="card p-6">
          {/* Vehicle number input for check-in */}
          <div className="flex gap-3 mb-6 bg-[#1a1a24] p-4 rounded-xl border border-[#2a2a3a]">
            <div className="flex-1 max-w-md">
              <label className="card-label block mb-2">Your Vehicle Number</label>
              <div className="relative">
                <Hash size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#55556a]" />
                <input
                  className="input w-full pl-9 font-mono uppercase bg-[#111118]"
                  placeholder="e.g. MH01AB1234"
                  value={vehicleNumber}
                  onChange={e=>setVehicleNumber(e.target.value)}
                />
              </div>
              <p className="text-[12px] text-[#55556a] mt-2">Enter plate number, then click an available slot to park.</p>
            </div>
          </div>

          {isLoading && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4">
              {[1,2,3,4,5,6].map(i => <div key={i} className="h-28 bg-[#1a1a24] rounded-xl animate-pulse"></div>)}
            </div>
          )}

          {!isLoading && data?.slots?.length === 0 && (
             <div className="empty-state border border-dashed border-[#2a2a3a] rounded-xl">
               <Car size={48} className="text-[#2a2a3a] mb-4" />
               <h3 className="text-[16px] text-[#8b8b9e] font-medium">No parking slots</h3>
               <p className="text-[13px] text-[#55556a] mt-1">Slots have not been configured yet.</p>
             </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4">
            {data?.slots?.map((s: any) => {
              const isOccupied = s.isOccupied;
              const isMine = String(s.occupiedBy?._id || s.occupiedBy) === String(user?._id);
              
              // Color coding logic matching prompt request
              let borderClass = "border-[#22c55e]/30 hover:border-[#22c55e] bg-[#22c55e]/5"; // green = available
              if (isOccupied) {
                if (isMine) borderClass = "border-[#f59e0b]/50 hover:border-[#f59e0b] bg-[#f59e0b]/10"; // yellow = mine
                else borderClass = "border-[#ef4444]/30 bg-[#ef4444]/5 opacity-60"; // red = others
              }

              return (
                <div key={s._id} className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center justify-between min-h-[120px] ${borderClass}`}>
                  <div className="text-center w-full">
                    <p className="text-[16px] font-[700] text-[#f1f1f3] font-mono leading-none mb-1">{s.slotNumber}</p>
                    <p className="text-[11px] font-[500] text-[#8b8b9e] uppercase tracking-wider">{s.type}</p>
                  </div>
                  
                  {isOccupied ? (
                    <div className="w-full mt-3 flex flex-col items-center gap-2">
                      <div className="bg-[#111118] px-2 py-1 rounded border border-[#2a2a3a] w-full text-center">
                        <p className="text-[11px] font-mono text-[#f1f1f3] truncate">{s.currentVehicle || "PARKED"}</p>
                      </div>
                      {(canManage || isMine) ? (
                        <button
                          onClick={()=>checkOutMutation.mutate(s._id)}
                          className={`w-full text-xs rounded py-1.5 flex items-center justify-center gap-1.5 transition-colors font-medium ${isMine ? "bg-[#f59e0b] text-[#0a0a0f] hover:bg-[#d97706]" : "bg-[#ef4444]/10 text-[#ef4444] hover:bg-[#ef4444]/20"}`}
                        >
                          <LogOut size={12}/> Exit
                        </button>
                      ) : (
                        <p className="w-full text-center text-[10px] text-[#55556a] uppercase font-bold py-1">Occupied</p>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={()=>checkInMutation.mutate({id:s._id})}
                      disabled={!vehicleNumber}
                      title={!vehicleNumber ? "Enter vehicle number first" : "Park here"}
                      className="mt-3 w-full text-xs bg-[#22c55e]/10 text-[#22c55e] hover:bg-[#22c55e]/20 border border-[#22c55e]/20 rounded py-1.5 flex items-center justify-center gap-1.5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed font-medium"
                    >
                      <LogIn size={12}/> Park
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Parking Slot">
        <form onSubmit={e=>{e.preventDefault();createSlotMutation.mutate({...slotForm, building: buildingId});}} className="space-y-5">
          <div>
            <label className="card-label block mb-2">Slot Number *</label>
            <input className="input w-full font-mono text-sm uppercase" required placeholder="e.g. A-101" value={slotForm.slotNumber||""} onChange={e=>setSlotForm({...slotForm,slotNumber:e.target.value.toUpperCase()})}/>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="card-label block mb-2">Type</label>
              <select className="input w-full" value={slotForm.type||"car"} onChange={e=>setSlotForm({...slotForm,type:e.target.value})}>
                {SLOT_TYPES.map(t=><option key={t} value={t}>{t.toUpperCase()}</option>)}
              </select>
            </div>
            <div>
              <label className="card-label block mb-2">Floor / Level</label>
              <input className="input w-full" placeholder="e.g. Basement 1" value={slotForm.floor||""} onChange={e=>setSlotForm({...slotForm,floor:e.target.value})}/>
            </div>
          </div>
          <div className="flex gap-3 pt-4 border-t border-[#2a2a3a]">
            <button type="button" onClick={()=>setShowModal(false)} className="btn-ghost flex-1">Cancel</button>
            <button type="submit" disabled={!buildingId || createSlotMutation.isPending} className="btn-primary flex-1 disabled:opacity-50">
              {createSlotMutation.isPending ? "Creating..." : "Create Slot"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// Missing lucide icon
function CheckCircle2(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={props.size||24} height={props.size||24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
}
