import React from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  iconColorClass?: string; // e.g. "text-blue-400 bg-blue-500/10"
  trend?: number;
}

export default function StatCard({ title, value, icon: Icon, iconColorClass = "text-[#6366f1] bg-[rgba(99,102,241,0.1)]", trend }: StatCardProps) {
  return (
    <div className="card flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-[10px] flex items-center justify-center ${iconColorClass}`}>
          <Icon size={20} />
        </div>
        <div>
          <p className="card-label mb-1">{title}</p>
          <p className="text-[28px] font-[700] text-[#f1f1f3] leading-none">{value}</p>
        </div>
      </div>
      {trend !== undefined && trend !== 0 && (
        <div className={`flex items-center gap-1 text-[13px] font-[500] px-2 py-1 rounded-full ${trend > 0 ? "text-[#22c55e] bg-[#22c55e]/10" : "text-[#ef4444] bg-[#ef4444]/10"}`}>
          {trend > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {Math.abs(trend)}%
        </div>
      )}
    </div>
  );
}
