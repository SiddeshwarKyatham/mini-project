import { useEffect, useRef } from "react";
import { Shield, Activity, Brain, Wifi } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import StatusCard from "@/components/StatusCard";
import TrafficFeed from "@/components/TrafficFeed";
import TrafficCharts from "@/components/TrafficCharts";
import AttackBanner from "@/components/AttackBanner";
import MitigationPanel from "@/components/MitigationPanel";
import SystemArchitecture from "@/components/SystemArchitecture";
import { useTrafficFeed } from "@/hooks/useTrafficFeed";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const { entries, latest, mode } = useTrafficFeed(3000, 30);
  const { toast } = useToast();
  const prevPrediction = useRef(latest?.prediction);

  const isUnderAttack = latest?.prediction === "DDoS";
  const networkStatus = isUnderAttack ? "danger" : "normal";

  useEffect(() => {
    if (latest?.prediction === "DDoS" && prevPrediction.current !== "DDoS") {
      toast({
        title: "⚠️ DDoS Attack Detected",
        description: `Confidence: ${latest.confidence}% — Volume: ${latest.volume.toLocaleString()} req/s`,
        variant: "destructive",
      });
    }
    prevPrediction.current = latest?.prediction;
  }, [latest, toast]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-10 bg-background/80">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-lg font-bold tracking-tight font-mono">DDoS Detection</h1>
              <p className="text-xs text-muted-foreground font-mono">Real-Time Monitoring</p>
            </div>
          </div>
          {mode === "live" ? (
            <Badge variant="outline" className="border-primary/30 text-primary font-mono text-xs animate-pulse-glow">
              <span className="mr-1.5 h-2 w-2 rounded-full bg-primary inline-block" />
              SYSTEM ONLINE — LIVE
            </Badge>
          ) : (
            <Badge variant="outline" className="border-cyber-warn/30 text-cyber-warn font-mono text-xs">
              <span className="mr-1.5 h-2 w-2 rounded-full bg-cyber-warn inline-block animate-pulse" />
              SYSTEM ONLINE — SIMULATED
            </Badge>
          )}
        </div>
      </header>

      <AttackBanner isUnderAttack={isUnderAttack} />

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Title Section */}
        <section className="text-center space-y-4 py-8">
          <h1 className="text-3xl md:text-5xl font-bold font-mono tracking-tight">
            <span className="text-primary">AI-Driven</span>{" "}
            <span className="text-foreground">DDoS Attack</span>
            <br />
            <span className="text-foreground">Detection System</span>
          </h1>
          <p className="max-w-2xl mx-auto text-muted-foreground leading-relaxed">
            This system visualizes deep-learning-based DDoS detection using real-time inference data.
            A 1D CNN model analyzes network traffic patterns to classify activity as normal or malicious.
          </p>
        </section>

        {/* Status Cards - driven by latest feed entry */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatusCard
            title="Network Status"
            value={latest?.prediction ?? "Normal"}
            subtitle={latest?.prediction === "DDoS" ? "Threat detected!" : "No threats detected"}
            icon={Wifi}
            status={networkStatus}
          />
          <StatusCard
            title="Traffic Rate"
            value={latest?.volume.toLocaleString() ?? "—"}
            subtitle="requests / sec"
            icon={Activity}
            status={latest && latest.volume > 3000 ? "warning" : "normal"}
          />
          <StatusCard
            title="Model Confidence"
            value={`${latest?.confidence ?? 0}%`}
            subtitle="CNN inference score"
            icon={Brain}
            status="normal"
          />
        </section>

        {/* Traffic & Confidence Charts */}
        <TrafficCharts entries={entries} />

        {/* Attack Log */}
        <TrafficFeed entries={entries} />

        {/* Mitigation Panel */}
        <MitigationPanel entries={entries} />

        {/* System Architecture */}
        <SystemArchitecture />
        <footer className="text-center py-8 border-t border-border/30">
          <p className="text-xs text-muted-foreground font-mono">
            CNN Model v1.0 &bull; TensorFlow Backend &bull; Real-Time Inference
          </p>
        </footer>
      </main>
    </div>
  );
};

export default Index;
