import React from "react";
import clsx from "clsx";

type BadgeVariant = "success" | "warning" | "info" | "danger" | "neutral";

interface BadgeProps {
  children?: React.ReactNode;
  variant?: BadgeVariant;
  status?: string; // Automatically maps status string to variant
  className?: string;
}

const mapStatusToVariant = (status: string): BadgeVariant => {
  const s = status.toLowerCase();
  if (["operational", "confirmed", "active", "resolved", "approved", "checked_in"].includes(s)) return "success";
  if (["pending", "open", "under_maintenance"].includes(s)) return "warning";
  if (["in_progress"].includes(s)) return "info";
  if (["faulty", "critical", "danger", "rejected"].includes(s)) return "danger";
  if (["closed", "inactive", "decommissioned", "checked_out"].includes(s)) return "neutral";
  return "neutral";
};

export default function Badge({ children, variant, status, className }: BadgeProps) {
  const v = variant || (status ? mapStatusToVariant(status) : "neutral");

  const variants = {
    success: "bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20",
    warning: "bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/20",
    info: "bg-[#38bdf8]/10 text-[#38bdf8] border border-[#38bdf8]/20",
    danger: "bg-[#ef4444]/10 text-[#ef4444] border border-[#ef4444]/20",
    neutral: "bg-[#2a2a3a] text-[#8b8b9e] border border-transparent",
  };

  return (
    <span className={clsx("badge capitalize", variants[v], className)}>
      {children || status?.replace("_", " ")}
    </span>
  );
}
