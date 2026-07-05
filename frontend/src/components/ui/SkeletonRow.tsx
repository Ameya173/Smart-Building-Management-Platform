import React from "react";

export default function SkeletonRow({ columns = 5 }: { columns?: number }) {
  return (
    <tr className="border-b border-[#2a2a3a] animate-pulse">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-4">
          <div className="h-4 bg-[#1a1a24] rounded-md w-full max-w-[120px]"></div>
        </td>
      ))}
    </tr>
  );
}
