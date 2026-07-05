import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/axios";
import { Check, Bell, AlertTriangle, Info, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import clsx from "clsx";

export default function Notifications() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => api.get("/notifications").then(r => r.data.data),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications", "notif-count"] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => api.patch("/notifications/read-all"),
    onSuccess: () => {
      toast.success("All notifications marked as read");
      qc.invalidateQueries({ queryKey: ["notifications", "notif-count"] });
    },
  });

  const getIcon = (type: string) => {
    switch (type) {
      case "alert": return <AlertTriangle size={18} className="text-[#ef4444]" />;
      case "success": return <CheckCircle size={18} className="text-[#22c55e]" />;
      default: return <Info size={18} className="text-[#6366f1]" />;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="pb-5 mb-6 border-b border-[#2a2a3a] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Bell size={24} className="text-[#6366f1]" />
            Notifications
          </h1>
          <p className="muted-text mt-1">You have {data?.unreadCount || 0} unread notifications</p>
        </div>
        {data?.unreadCount > 0 && (
          <button 
            onClick={() => markAllReadMutation.mutate()} 
            disabled={markAllReadMutation.isPending}
            className="btn-ghost flex items-center gap-2 border border-[#2a2a3a] px-4"
          >
            <Check size={16} /> Mark all as read
          </button>
        )}
      </div>

      <div className="card p-0 overflow-hidden divide-y divide-[#2a2a3a]">
        {isLoading && (
          <div className="p-4 space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-4 animate-pulse">
                <div className="w-10 h-10 bg-[#1a1a24] rounded-full"></div>
                <div className="flex-1"><div className="h-4 bg-[#1a1a24] w-1/3 rounded mb-2"></div><div className="h-3 bg-[#1a1a24] w-2/3 rounded"></div></div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && data?.results?.length === 0 && (
          <div className="empty-state">
            <Bell size={48} className="text-[#2a2a3a] mb-4" />
            <h3 className="text-[16px] text-[#8b8b9e] font-medium">All caught up!</h3>
            <p className="text-[13px] text-[#55556a] mt-1">You don't have any notifications right now.</p>
          </div>
        )}

        {data?.results?.map((n: any) => (
          <div 
            key={n._id} 
            className={clsx(
              "p-4 transition-colors flex gap-4 hover:bg-[#1a1a24] relative",
              !n.read ? "bg-[#6366f1]/5" : "opacity-70"
            )}
            onClick={() => {
              if (!n.read) markReadMutation.mutate(n._id);
            }}
          >
            {!n.read && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#6366f1]" />}
            
            <div className={clsx(
              "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border",
              !n.read ? "bg-[#111118] border-[#2a2a3a]" : "bg-transparent border-transparent"
            )}>
              {getIcon(n.type)}
            </div>
            
            <div className="flex-1 min-w-0 pr-4">
              <p className={clsx("text-[14px]", !n.read ? "font-[600] text-[#f1f1f3]" : "font-[500] text-[#8b8b9e]")}>
                {n.title}
              </p>
              <p className="text-[13px] text-[#8b8b9e] mt-0.5">{n.message}</p>
              <p className="text-[11px] text-[#55556a] mt-2 font-medium">
                {new Date(n.createdAt).toLocaleString(undefined, {
                  month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
                })}
              </p>
            </div>

            {!n.read && (
              <div className="flex-shrink-0 flex items-center justify-center">
                <span className="w-2.5 h-2.5 rounded-full bg-[#6366f1]"></span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
