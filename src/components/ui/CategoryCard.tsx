import React from "react";
import { Sparkles, Coins, Heart, Briefcase, Activity, Calendar, Sun } from "lucide-react";

type CategoryCardProps = {
  key?: React.Key;
  index: number;
  titleKr: string;
  titleEn: string;
  subtitle: string;
  icon: string;
  onClick: () => void | Promise<void>;
};

const iconMap: Record<string, React.ReactNode> = {
  sparkles: <Sparkles className="w-5 h-5" />,
  coins: <Coins className="w-5 h-5" />,
  heart: <Heart className="w-5 h-5" />,
  briefcase: <Briefcase className="w-5 h-5" />,
  activity: <Activity className="w-5 h-5" />,
  calendar: <Calendar className="w-5 h-5" />,
  sun: <Sun className="w-5 h-5" />,
};

export default function CategoryCard({
  index,
  titleKr,
  titleEn,
  subtitle,
  icon,
  onClick,
}: CategoryCardProps) {
  return (
    <button
      onClick={onClick}
      className="group relative rounded-[28px] border border-white/10 bg-black/30 p-6 text-left transition-all duration-300 hover:border-neon-primary/40 hover:bg-white/[0.03] hover:-translate-y-1"
    >
      <div className="mb-6 text-5xl font-black leading-none text-white/10">
        {String(index).padStart(2, "0")}
      </div>

      <div className="mb-4 flex items-center gap-3 text-neon-primary">
        {iconMap[icon] || <Sparkles className="w-5 h-5" />}
        <span className="text-xs uppercase tracking-[0.2em] text-white/35">
          {titleEn}
        </span>
      </div>

      <div className="text-3xl font-black tracking-tight text-white group-hover:text-neon-primary transition-colors">
        {titleKr}
      </div>

      <div className="mt-2 text-sm text-white/45">{subtitle}</div>
    </button>
  );
}
