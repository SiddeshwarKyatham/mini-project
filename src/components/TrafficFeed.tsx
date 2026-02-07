import { useTrafficFeed, type TrafficEntry } from "@/hooks/useTrafficFeed";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Radio } from "lucide-react";

function formatTime(date: Date) {
  return date.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function EntryRow({ entry }: { entry: TrafficEntry }) {
  const isDDoS = entry.prediction === "DDoS";
  return (
    <div className={cn(
      "grid grid-cols-4 gap-4 items-center py-2.5 px-3 rounded-md text-sm font-mono transition-colors",
      isDDoS ? "bg-cyber-danger/5 border border-cyber-danger/20" : "hover:bg-secondary/50"
    )}>
      <span className="text-muted-foreground">{formatTime(entry.timestamp)}</span>
      <span className={cn("font-semibold", isDDoS ? "text-cyber-danger" : "text-foreground")}>
        {entry.volume.toLocaleString()}
      </span>
      <Badge
        variant="outline"
        className={cn(
          "w-fit text-xs",
          isDDoS
            ? "border-cyber-danger/40 text-cyber-danger"
            : "border-primary/30 text-primary"
        )}
      >
        {entry.prediction}
      </Badge>
      <span className={cn(
        "text-right",
        entry.confidence > 95 ? "text-primary" : "text-muted-foreground"
      )}>
        {entry.confidence}%
      </span>
    </div>
  );
}

export default function TrafficFeed() {
  const { entries } = useTrafficFeed(3000, 30);

  return (
    <Card className="cyber-border bg-card/80 backdrop-blur-sm overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-mono flex items-center gap-2">
            <Radio className="h-4 w-4 text-primary animate-pulse-glow" />
            Live Traffic Feed
          </CardTitle>
          <span className="text-xs text-muted-foreground font-mono">
            {entries.length} entries &bull; 3s interval
          </span>
        </div>
        <div className="grid grid-cols-4 gap-4 text-xs text-muted-foreground font-mono uppercase tracking-wider pt-2 px-3 border-b border-border/50 pb-2">
          <span>Time</span>
          <span>Volume</span>
          <span>Prediction</span>
          <span className="text-right">Confidence</span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[360px] px-3 pb-3">
          <div className="space-y-0.5">
            {[...entries].reverse().map((entry) => (
              <EntryRow key={entry.id} entry={entry} />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
