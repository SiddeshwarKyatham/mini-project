import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Monitor, Brain, Database, ArrowRight } from "lucide-react";

const steps = [
  {
    icon: Brain,
    title: "CNN Model (Python & TensorFlow)",
    description:
      "A 1D Convolutional Neural Network trained offline on labeled network traffic datasets. It learns to distinguish normal patterns from DDoS attack signatures with high accuracy.",
  },
  {
    icon: Database,
    title: "Flask REST API",
    description:
      "A Python/Flask backend receives rolling 20-step traffic sequences over HTTP. It utilizes a StandardScaler and Hybrid-Heuristic clipping before forwarding the tensor to TensorFlow to construct a live prediction.",
  },
  {
    icon: Monitor,
    title: "React Dashboard",
    description:
      "This frontend polls the Python backend every 6 seconds. It visualizes the live inference results, traffic volume payloads, and mitigation bounds using React, Recharts, and Tailwind CSS.",
  },
];

const SystemArchitecture = () => (
  <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
    <CardHeader>
      <CardTitle className="font-mono text-lg flex items-center gap-2">
        <Monitor className="h-5 w-5 text-primary" />
        System Architecture
      </CardTitle>
      <p className="text-sm text-muted-foreground">
        How the AI-powered DDoS detection pipeline works — from model training to live dashboard.
      </p>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {steps.map((step, i) => (
          <div key={step.title} className="relative flex flex-col items-center text-center gap-3">
            {/* Connector arrow (hidden on mobile & after last item) */}
            {i < steps.length - 1 && (
              <ArrowRight className="hidden md:block absolute -right-5 top-6 h-5 w-5 text-primary/40" />
            )}
            <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-primary/10 border border-primary/20">
              <step.icon className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-mono text-sm font-semibold text-foreground">{step.title}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{step.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-lg border border-border/40 bg-secondary/30 px-4 py-3">
        <p className="text-xs text-muted-foreground leading-relaxed">
          <span className="font-semibold text-foreground">Note:</span> The data displayed on this
          dashboard is <span className="font-bold text-primary">LIVE INFERENCE EVALUATION</span>. 
          The React client is generating synthetic network flow features on the fly, emitting them to the Python backend on `localhost:5000`, 
          and receiving mathematically scaled Neural Network predictions. There are no mock calculations in the client.
        </p>
      </div>
    </CardContent>
  </Card>
);

export default SystemArchitecture;
