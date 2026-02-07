import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatusCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  status?: "normal" | "warning" | "danger";
}

const statusStyles = {
  normal: "text-primary border-primary/20 cyber-glow",
  warning: "text-cyber-warn border-cyber-warn/20",
  danger: "text-cyber-danger border-cyber-danger/20",
};

const StatusCard = ({ title, value, subtitle, icon: Icon, status = "normal" }: StatusCardProps) => {
  return (
    <Card className={cn("relative overflow-hidden cyber-border bg-card/80 backdrop-blur-sm", statusStyles[status])}>
      <div className="absolute inset-0 scan-line pointer-events-none" />
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
              {title}
            </p>
            <p className={cn("text-3xl font-mono font-bold tracking-tight", {
              "text-primary": status === "normal",
              "text-cyber-warn": status === "warning",
              "text-cyber-danger": status === "danger",
            })}>
              {value}
            </p>
            {subtitle && (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div className={cn("p-3 rounded-lg bg-secondary", {
            "text-primary": status === "normal",
            "text-cyber-warn": status === "warning",
            "text-cyber-danger": status === "danger",
          })}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatusCard;
