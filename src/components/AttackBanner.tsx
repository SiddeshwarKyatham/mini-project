import { cn } from "@/lib/utils";
import { ShieldAlert, ShieldCheck } from "lucide-react";

interface AttackBannerProps {
  isUnderAttack: boolean;
}

export default function AttackBanner({ isUnderAttack }: AttackBannerProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-3 py-2.5 px-4 text-sm font-mono font-semibold transition-colors duration-300",
        isUnderAttack
          ? "bg-cyber-danger/15 text-cyber-danger border-b border-cyber-danger/30 animate-pulse"
          : "bg-primary/10 text-primary border-b border-primary/20"
      )}
    >
      {isUnderAttack ? (
        <>
          <ShieldAlert className="h-4 w-4" />
          <span>⚠️ SYSTEM STATUS: UNDER ATTACK — DDoS DETECTED</span>
          <ShieldAlert className="h-4 w-4" />
        </>
      ) : (
        <>
          <ShieldCheck className="h-4 w-4" />
          <span>SYSTEM STATUS: NORMAL — NO THREATS DETECTED</span>
        </>
      )}
    </div>
  );
}
