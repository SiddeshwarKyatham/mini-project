import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShieldAlert, ShieldCheck, Loader2, Flag } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TrafficEntry } from "@/hooks/useTrafficFeed";

interface MitigationEvent {
  id: string;
  timestamp: Date;
  sourceIp: string;
  volume: number;
  confidence: number;
  status: "flagged" | "mitigating" | "mitigated";
}

function randomIp() {
  return `${Math.floor(Math.random() * 200 + 10)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
}

function formatTime(date: Date) {
  return date.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

const statusConfig = {
  flagged: {
    label: "Flagged",
    icon: Flag,
    className: "border-cyber-warn/40 bg-cyber-warn/10 text-cyber-warn",
  },
  mitigating: {
    label: "Mitigating…",
    icon: Loader2,
    className: "border-cyber-danger/40 bg-cyber-danger/10 text-cyber-danger",
  },
  mitigated: {
    label: "Mitigated",
    icon: ShieldCheck,
    className: "border-primary/40 bg-primary/10 text-primary",
  },
};

interface MitigationPanelProps {
  entries: TrafficEntry[];
}

export default function MitigationPanel({ entries }: MitigationPanelProps) {
  const [events, setEvents] = useState<MitigationEvent[]>([]);
  // useRef (not useState) so mutations don't trigger re-renders or dep-array churn
  const processedIds = useRef<Set<string>>(new Set());
  // Track all pending timeouts so we can clear them on unmount (memory-leak fix)
  const timerIds = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    return () => { timerIds.current.forEach(clearTimeout); };
  }, []);

  const advanceStatus = useCallback((id: string, to: MitigationEvent["status"]) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status: to } : e))
    );
  }, []);

  // Watch for new DDoS entries
  useEffect(() => {
    const ddosEntries = entries.filter(
      (e) => e.prediction === "DDoS" && !processedIds.current.has(e.id)
    );

    if (ddosEntries.length === 0) return;

    const newEvents: MitigationEvent[] = ddosEntries.map((e) => ({
      id: e.id,
      timestamp: e.timestamp,
      sourceIp: randomIp(),
      volume: e.volume,
      confidence: e.confidence,
      status: "flagged" as const,
    }));

    // Mutate the ref directly — no re-render triggered, no dep-array churn
    ddosEntries.forEach((e) => processedIds.current.add(e.id));

    setEvents((prev) => [...prev, ...newEvents].slice(-50));

    // Transition: flagged → mitigating after 2s, mitigated after 5s
    ddosEntries.forEach((e) => {
      timerIds.current.push(setTimeout(() => advanceStatus(e.id, "mitigating"), 2000));
      timerIds.current.push(setTimeout(() => advanceStatus(e.id, "mitigated"), 5000));
    });
  }, [entries, advanceStatus]);

  const activeCount = events.filter((e) => e.status !== "mitigated").length;

  return (
    <Card className="cyber-border bg-card/80 backdrop-blur-sm overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-mono flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-cyber-danger" />
            Mitigation Panel
          </CardTitle>
          <div className="flex items-center gap-2">
            {activeCount > 0 && (
              <Badge variant="outline" className="border-cyber-danger/40 text-cyber-danger text-xs font-mono animate-pulse">
                {activeCount} active
              </Badge>
            )}
            <span className="text-xs text-muted-foreground font-mono">
              {events.length} total events
            </span>
          </div>
        </div>
        <div className="grid grid-cols-5 gap-4 text-xs text-muted-foreground font-mono uppercase tracking-wider pt-2 px-3 border-b border-border/50 pb-2">
          <span>Time</span>
          <span>Source IP</span>
          <span>Volume</span>
          <span>Confidence</span>
          <span className="text-right">Status</span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[280px] px-3 pb-3">
          {events.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12 text-muted-foreground font-mono text-sm gap-2">
              <ShieldCheck className="h-8 w-8 text-primary/40" />
              <span>No mitigation events yet</span>
              <span className="text-xs">Events appear when DDoS is detected</span>
            </div>
          ) : (
            <div className="space-y-0.5">
              {[...events].reverse().map((event) => {
                const cfg = statusConfig[event.status];
                const StatusIcon = cfg.icon;
                return (
                  <div
                    key={event.id}
                    className={cn(
                      "grid grid-cols-5 gap-4 items-center py-2.5 px-3 rounded-md text-sm font-mono transition-all duration-500",
                      event.status === "mitigating" && "bg-cyber-danger/5 border border-cyber-danger/20",
                      event.status === "flagged" && "bg-cyber-warn/5 border border-cyber-warn/20",
                      event.status === "mitigated" && "hover:bg-secondary/50"
                    )}
                  >
                    <span className="text-muted-foreground">{formatTime(event.timestamp)}</span>
                    <span className="text-foreground">{event.sourceIp}</span>
                    <span className="text-cyber-danger font-semibold">{event.volume.toLocaleString()}</span>
                    <span className="text-muted-foreground">{event.confidence}%</span>
                    <Badge variant="outline" className={cn("w-fit text-xs ml-auto flex items-center gap-1", cfg.className)}>
                      <StatusIcon className={cn("h-3 w-3", event.status === "mitigating" && "animate-spin")} />
                      {cfg.label}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
