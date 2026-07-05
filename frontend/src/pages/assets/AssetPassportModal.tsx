import { useQuery } from "@tanstack/react-query";
import api from "../../lib/axios";
import Modal from "../../components/ui/Modal";
import { BrainCircuit, Clock, Wrench, PiggyBank, ShieldAlert, BadgeCheck, FileText, Activity } from "lucide-react";
import Badge from "../../components/ui/Badge";

export default function AssetPassportModal({ assetId, isOpen, onClose }: { assetId: string | null; isOpen: boolean; onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ["assetPassport", assetId],
    queryFn: () => api.get(`/assets/${assetId}/passport`).then((r) => r.data.data),
    enabled: !!assetId && isOpen,
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Asset Digital Passport" size="xl">
      {isLoading || !data ? (
        <div className="flex justify-center p-8 text-[#8b8b9e]">Loading AI Passport Data...</div>
      ) : (
        <div className="space-y-6">
          
          {/* Identity Section */}
          <div className="flex items-start justify-between bg-[#111118] p-5 rounded-xl border border-[#2a2a3a]">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-lg font-semibold text-[#f1f1f3]">{data.asset.name}</h2>
                <Badge status={data.asset.status} />
              </div>
              <div className="flex items-center gap-4 text-sm text-[#8b8b9e] font-mono mt-2">
                <span className="flex items-center gap-1.5"><BadgeCheck size={14} className="text-[#6366f1]" /> {data.asset.assetTag || "NO TAG"}</span>
                <span className="flex items-center gap-1.5"><FileText size={14} /> {data.asset.category.replace("_", " ")}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[12px] text-[#8b8b9e] uppercase tracking-wider mb-1">Installation Date</p>
              <p className="text-[#f1f1f3] font-medium">{new Date(data.asset.installationDate).toLocaleDateString()}</p>
            </div>
          </div>

          {/* AI Intelligence Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="card border-[#3d3d55] bg-gradient-to-br from-[#1a1a24] to-[#111118]">
              <div className="flex items-center gap-2 mb-4">
                <BrainCircuit size={18} className="text-[#6366f1]" />
                <h3 className="text-[14px] font-semibold text-[#f1f1f3]">AI Lifecycle Engine</h3>
              </div>
              
              <div className="space-y-5">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-[#8b8b9e]">Health Score</span>
                    <span className="font-mono text-[#f1f1f3]">{data.asset.healthScore}%</span>
                  </div>
                  <div className="w-full h-2 bg-[#2a2a3a] rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${data.asset.healthScore > 75 ? "bg-[#22c55e]" : data.asset.healthScore > 40 ? "bg-[#f59e0b]" : "bg-[#ef4444]"}`} style={{ width: `${data.asset.healthScore}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-[#8b8b9e]">Failure Probability</span>
                    <span className="font-mono text-[#f1f1f3]">{data.aiIntelligence.failureProbability}%</span>
                  </div>
                  <div className="w-full h-2 bg-[#2a2a3a] rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${data.aiIntelligence.failureProbability < 30 ? "bg-[#22c55e]" : data.aiIntelligence.failureProbability < 60 ? "bg-[#f59e0b]" : "bg-[#ef4444]"}`} style={{ width: `${data.aiIntelligence.failureProbability}%` }} />
                  </div>
                </div>

                <div className="p-3 bg-[#111118] border border-[#2a2a3a] rounded-lg flex items-center justify-between">
                  <span className="text-sm text-[#8b8b9e]">Remaining Useful Life (RUL)</span>
                  <span className="font-semibold text-[#f1f1f3] text-lg">{data.aiIntelligence.remainingUsefulLife} yrs</span>
                </div>
              </div>
            </div>

            {/* Lifecycle Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-[#111118] border border-[#2a2a3a] rounded-xl p-4 flex flex-col justify-center">
                <Wrench size={20} className="text-[#8b8b9e] mb-2" />
                <p className="text-[12px] text-[#55556a] font-medium uppercase tracking-wider mb-1">Total Repairs</p>
                <p className="text-xl font-semibold text-[#f1f1f3]">{data.lifecycle.totalRepairs}</p>
              </div>
              <div className="bg-[#111118] border border-[#2a2a3a] rounded-xl p-4 flex flex-col justify-center">
                <PiggyBank size={20} className="text-[#8b8b9e] mb-2" />
                <p className="text-[12px] text-[#55556a] font-medium uppercase tracking-wider mb-1">Maintenance Cost</p>
                <p className="text-xl font-semibold text-[#f1f1f3]">₹{data.lifecycle.totalMaintenanceCost.toLocaleString()}</p>
              </div>
              <div className="bg-[#111118] border border-[#2a2a3a] rounded-xl p-4 flex flex-col justify-center">
                <Clock size={20} className="text-[#8b8b9e] mb-2" />
                <p className="text-[12px] text-[#55556a] font-medium uppercase tracking-wider mb-1">Total Downtime</p>
                <p className="text-xl font-semibold text-[#f1f1f3]">{data.lifecycle.totalDowntimeHours} <span className="text-[12px] text-[#8b8b9e] font-normal">hrs</span></p>
              </div>
              <div className="bg-[#111118] border border-[#2a2a3a] rounded-xl p-4 flex flex-col justify-center">
                <Activity size={20} className="text-[#8b8b9e] mb-2" />
                <p className="text-[12px] text-[#55556a] font-medium uppercase tracking-wider mb-1">Asset Age</p>
                <p className="text-xl font-semibold text-[#f1f1f3]">{data.lifecycle.ageInYears} <span className="text-[12px] text-[#8b8b9e] font-normal">yrs</span></p>
              </div>
            </div>
          </div>

          {/* AI Recommendation Box */}
          <div className="p-4 rounded-xl border border-[#4338ca] bg-gradient-to-r from-[#312e81]/30 to-[#1e1b4b]/30">
            <div className="flex items-start gap-3">
              <ShieldAlert size={20} className="text-[#818cf8] mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-[#c7d2fe] mb-1">AI Recommendation</h4>
                <p className="text-[13.5px] text-[#a5b4fc] leading-relaxed">
                  {data.aiIntelligence.recommendation}
                </p>
              </div>
            </div>
          </div>
          
        </div>
      )}
    </Modal>
  );
}
