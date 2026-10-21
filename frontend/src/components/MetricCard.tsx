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
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "negative":
        return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      case "warning":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "gold":
        return "bg-amber-400/15 text-amber-300 border-amber-400/30";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  return (
    <div
      className="card-gradient rounded-xl p-5 border border-[#1E3E62] transition-all hover:border-amber-500/40 hover:shadow-lg hover:shadow-amber-500/5 group"
      title={tooltip}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{title}</span>
        {Icon && (
          <div className="rounded-lg p-2 bg-[#071328] border border-[#1E3E62] text-amber-400 group-hover:scale-110 transition-transform">
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline justify-between gap-2">
        <div className="text-2xl font-bold tracking-tight text-white font-mono">{value}</div>
        {badge && (
          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${getBadgeStyle()}`}>
            {badge}
          </span>
        )}
      </div>

      {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
    </div>
  );
};
