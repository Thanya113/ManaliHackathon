import React from "react";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  badge?: string;
  badgeType?: "positive" | "negative" | "warning" | "neutral" | "gold";
  icon?: LucideIcon;
  tooltip?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  badge,
  badgeType = "neutral",
  icon: Icon,
  tooltip,
}) => {
  const getBadgeStyle = () => {
    switch (badgeType) {
      case "positive":
        return "bg-emerald-50 text-emerald-800 border-emerald-200";
      case "negative":
        return "bg-rose-50 text-rose-800 border-rose-200";
      case "warning":
        return "bg-amber-50 text-amber-800 border-amber-200";
      case "gold":
        return "bg-amber-100 text-amber-900 border-amber-300 font-bold";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div
      className="card-gradient rounded-xl p-5 border border-[#E8E1D5] transition-all hover:border-amber-400 hover:shadow-md group"
      title={tooltip}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</span>
        {Icon && (
          <div className="rounded-lg p-2 bg-amber-50 border border-amber-200/60 text-amber-600 group-hover:scale-110 transition-transform">
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline justify-between gap-2">
        <div className="text-2xl font-extrabold tracking-tight text-slate-900 font-mono">{value}</div>
        {badge && (
          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${getBadgeStyle()}`}>
            {badge}
          </span>
        )}
      </div>

      {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
    </div>
  );
};
