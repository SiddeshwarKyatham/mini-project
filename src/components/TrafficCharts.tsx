import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceArea,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Brain } from "lucide-react";
import type { TrafficEntry } from "@/hooks/useTrafficFeed";

function formatTime(date: Date) {
  return date.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

interface TrafficChartsProps {
  entries: TrafficEntry[];
}

export default function TrafficCharts({ entries }: TrafficChartsProps) {
  const chartData = useMemo(
    () =>
      entries.map((e) => ({
        time: formatTime(e.timestamp),
        volume: e.volume,
        confidence: e.confidence,
        isDDoS: e.prediction === "DDoS",
      })),
    [entries]
  );

  // Build attack intervals for red highlighting
  const attackIntervals = useMemo(() => {
    const intervals: { start: string; end: string }[] = [];
    let current: { start: string; end: string } | null = null;
    for (const d of chartData) {
      if (d.isDDoS) {
        if (!current) current = { start: d.time, end: d.time };
        else current.end = d.time;
      } else if (current) {
        intervals.push(current);
        current = null;
      }
    }
    if (current) intervals.push(current);
    return intervals;
  }, [chartData]);

  interface TooltipPayloadItem {
    color: string;
    name: string;
    value: number;
    payload: { time: string; volume: number; confidence: number; isDDoS: boolean };
  }
  interface CustomTooltipProps {
    active?: boolean;
    payload?: TooltipPayloadItem[];
    label?: string;
  }

  const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (!active || !payload?.length) return null;
    const data = payload[0]?.payload;
    return (
      <div className="rounded-lg border border-border/50 bg-card/95 backdrop-blur-sm p-3 shadow-lg font-mono text-xs space-y-1">
        <p className="text-muted-foreground">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }} className="font-semibold">
            {p.name}: {p.value.toLocaleString()}
            {p.name === "Confidence" ? "%" : " req/s"}
          </p>
        ))}
        {data?.isDDoS && (
          <p className="text-cyber-danger font-bold">⚠ DDoS Detected</p>
        )}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Traffic Volume Chart */}
      <Card className="cyber-border bg-card/80 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-mono flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            Traffic Volume
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="volumeFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} />
              <XAxis
                dataKey="time"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10, fontFamily: "monospace" }}
                axisLine={{ stroke: "hsl(var(--border))" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10, fontFamily: "monospace" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              {attackIntervals.map((interval, i) => (
                <ReferenceArea
                  key={i}
                  x1={interval.start}
                  x2={interval.end}
                  fill="hsl(var(--cyber-danger))"
                  fillOpacity={0.12}
                  stroke="hsl(var(--cyber-danger))"
                  strokeOpacity={0.3}
                />
              ))}
              <ReferenceLine
                y={3000}
                stroke="hsl(var(--cyber-warn))"
                strokeDasharray="6 3"
                strokeOpacity={0.5}
                label={{
                  value: "Threshold",
                  position: "insideTopRight",
                  fill: "hsl(var(--cyber-warn))",
                  fontSize: 10,
                  fontFamily: "monospace",
                }}
              />
              <Area
                type="monotone"
                dataKey="volume"
                name="Volume"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#volumeFill)"
                dot={false}
                activeDot={{ r: 4, fill: "hsl(var(--primary))" }}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Confidence Score Chart */}
      <Card className="cyber-border bg-card/80 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-mono flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            Model Confidence Trend
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="confFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} />
              <XAxis
                dataKey="time"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10, fontFamily: "monospace" }}
                axisLine={{ stroke: "hsl(var(--border))" }}
                tickLine={false}
              />
              <YAxis
                domain={[80, 100]}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10, fontFamily: "monospace" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              {attackIntervals.map((interval, i) => (
                <ReferenceArea
                  key={i}
                  x1={interval.start}
                  x2={interval.end}
                  fill="hsl(var(--cyber-danger))"
                  fillOpacity={0.12}
                  stroke="hsl(var(--cyber-danger))"
                  strokeOpacity={0.3}
                />
              ))}
              <Area
                type="monotone"
                dataKey="confidence"
                name="Confidence"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#confFill)"
                dot={false}
                activeDot={{ r: 4, fill: "hsl(var(--primary))" }}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
