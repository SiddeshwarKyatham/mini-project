import { useState, useEffect, useCallback, useRef } from "react";
import { checkBackendHealth, fetchPrediction } from "../lib/api";

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

// Convert a TrafficEntry to the [flow_dur, fwd_packets, ...] format expected by model
function entryToFeatures(e: TrafficEntry): number[] {
  // We mock the other CICDDoS2019 features since the simulation only produced 'volume'
  // When upgrading to full real data stream, you would feed REAL packet captures here.
  const isSimulatedDDoS = e.prediction === "DDoS";
  
  const flowDuration = isSimulatedDDoS ? Math.random() * 100 : Math.random() * 10000 + 1000;
  const fwdPackets = isSimulatedDDoS ? e.volume * 0.5 : e.volume * 0.1;
  const totalLength = fwdPackets * (isSimulatedDDoS ? 50 : 200);
  const bytesPerSec = isSimulatedDDoS ? e.volume * 1000 : e.volume * 200;
  const packetsPerSec = e.volume;
  const avgFwdSegSize = isSimulatedDDoS ? 50 : 200;

  return [flowDuration, fwdPackets, totalLength, bytesPerSec, packetsPerSec, avgFwdSegSize];
}

export function useTrafficFeed(intervalMs = 3000, maxEntries = 30) {
  const [mode, setMode] = useState<"live" | "simulated">("simulated");

  const [entries, setEntries] = useState<TrafficEntry[]>(() => {
    const initial: TrafficEntry[] = [];
    const now = Date.now();
    for (let i = 19; i >= 0; i--) {
      const entry = generateEntry();
      entry.timestamp = new Date(now - i * intervalMs);
      initial.push(entry);
    }
    return initial;
  });

  const [latest, setLatest] = useState<TrafficEntry | null>(null);
  const entriesRef = useRef(entries); // Keep a ref to read current entries inside async

  // Health check on mount
  useEffect(() => {
    let mounted = true;
    checkBackendHealth().then((isHealthy) => {
      if (mounted) {
        setMode(isHealthy ? "live" : "simulated");
        console.log(`Backend health check: ${isHealthy ? 'ALIVE (Live Mode)' : 'DOWN (Simulated Mode)'}`);
      }
    });
    return () => { mounted = false; };
  }, []);

  const tick = useCallback(async () => {
    let newEntry: TrafficEntry;

    if (mode === "simulated") {
      newEntry = generateEntry();
    } else {
      // LIVE MODE: build a sequence of 20 and ask the Flask API
      // First generate a raw entry to represent current "traffic" volume
      const rawTraffic = generateEntry(); 
      
      const currentList = entriesRef.current;
      // take last 19 + the current one
      const recent = [...currentList.slice(-19), rawTraffic];
      const sequence = recent.map(entryToFeatures);

      // Pad sequence if we somehow don't have 20 (we should always have 20 because of init)
      while (sequence.length < 20) {
        sequence.unshift(sequence[0]);
      }

      try {
        const mlResult = await fetchPrediction(sequence);
        newEntry = {
          id: crypto.randomUUID(),
          timestamp: new Date(),
          volume: mlResult.volume || rawTraffic.volume,
          prediction: mlResult.prediction || "Normal",
          confidence: mlResult.confidence || 85.0,
        };
      } catch (err) {
        console.error("API failed. Falling back to simulated entry for this tick.");
        newEntry = rawTraffic; // fallback
      }
    }

    setLatest(newEntry);
    setEntries((prev) => {
      const updated = [...prev.slice(-(maxEntries - 1)), newEntry];
      entriesRef.current = updated;
      return updated;
    });
  }, [mode, maxEntries]);

  useEffect(() => {
    const id = setInterval(tick, intervalMs);
    return () => clearInterval(id);
  }, [tick, intervalMs]);

  return { entries, latest: latest ?? entries[entries.length - 1], mode };
}
