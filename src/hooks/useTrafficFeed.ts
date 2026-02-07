import { useState, useEffect, useCallback, useRef } from "react";

export interface TrafficEntry {
  id: string;
  timestamp: Date;
  volume: number;
  prediction: "Normal" | "DDoS";
  confidence: number;
}

const randomVolume = () => Math.floor(800 + Math.random() * 1200);
const randomConfidence = () => Math.round((85 + Math.random() * 14.5) * 10) / 10;

function generateEntry(): TrafficEntry {
  const isDDoS = Math.random() < 0.15;
  return {
    id: crypto.randomUUID(),
    timestamp: new Date(),
    volume: isDDoS ? Math.floor(3000 + Math.random() * 5000) : randomVolume(),
    prediction: isDDoS ? "DDoS" : "Normal",
    confidence: randomConfidence(),
  };
}

export function useTrafficFeed(intervalMs = 3000, maxEntries = 30) {
  const [entries, setEntries] = useState<TrafficEntry[]>(() => {
    const initial: TrafficEntry[] = [];
    const now = Date.now();
    for (let i = 9; i >= 0; i--) {
      const entry = generateEntry();
      entry.timestamp = new Date(now - i * intervalMs);
      initial.push(entry);
    }
    return initial;
  });

  const latestRef = useRef<TrafficEntry | null>(null);

  const tick = useCallback(() => {
    const entry = generateEntry();
    latestRef.current = entry;
    setEntries((prev) => [...prev.slice(-(maxEntries - 1)), entry]);
  }, [maxEntries]);

  useEffect(() => {
    const id = setInterval(tick, intervalMs);
    return () => clearInterval(id);
  }, [tick, intervalMs]);

  return { entries, latest: latestRef.current ?? entries[entries.length - 1] };
}
