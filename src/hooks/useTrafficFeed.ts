import { useState, useEffect, useCallback, useRef } from "react";
import { checkBackendHealth, fetchPrediction } from "../lib/api";

export interface TrafficEntry {
  id: string;
  timestamp: Date;
  volume: number;
  prediction: "Normal" | "DDoS";
  confidence: number;
}

/**
 * Generates 6 raw, independent network flow features.
 * Ranges intentionally span both normal and attack-like territory
 * so the CNN model (or heuristic) makes a genuine classification decision.
 *
 * Feature order matches CICDDoS2019 / preprocess.py FEATURES list:
 *   [Flow Duration, Total Fwd Packets, Total Length of Fwd Packets,
 *    Flow Bytes/s, Flow Packets/s, Avg Fwd Segment Size]
 */
function generateRawFeatures(): number[] {
  // Generate DDoS traffic 25% of the time, Normal 75% of the time
  const isDDoS = Math.random() < 0.25;

  if (isDDoS) {
    const flowDuration   = Math.random() * 299 + 1;           // 1 - 300 ms
    const fwdPackets     = Math.random() * 4800 + 200;      // 200 - 5_000 packets
    const totalLength    = Math.random() * 1950000 + 50000;   // 50k - 2M bytes
    const bytesPerSec    = Math.random() * 49500000 + 500000; // 500k - 50M bytes/s
    const packetsPerSec  = Math.random() * 950000 + 50000;    // 50k - 1M pkts/s
    const avgFwdSegSize  = Math.random() * 60 + 20;           // 20 - 80 bytes
    return [flowDuration, fwdPackets, totalLength, bytesPerSec, packetsPerSec, avgFwdSegSize];
  } else {
    // Exact boundaries mirroring _normal_rows in preprocess.py
    const flowDuration   = Math.random() * 195000 + 5000;     // 5_000 - 200_000 ms
    const fwdPackets     = Math.random() * 49 + 1;            // 1 - 50 packets
    const totalLength    = Math.random() * 2960 + 40;         // 40 - 3_000 bytes
    const bytesPerSec    = Math.random() * 7990 + 10;         // 10 - 8_000 bytes/s
    const packetsPerSec  = Math.random() * 199 + 1;           // 1 - 200 pkts/s
    const avgFwdSegSize  = Math.random() * 1440 + 60;         // 60 - 1_500 bytes
    return [flowDuration, fwdPackets, totalLength, bytesPerSec, packetsPerSec, avgFwdSegSize];
  }
}

export function useTrafficFeed(intervalMs = 6000, maxEntries = 30) {
  const [mode, setMode] = useState<"live" | "backend_down">("live");
  const forceDDoSRef = useRef(false);

  const triggerDDoS = useCallback(() => {
    forceDDoSRef.current = true;
  }, []);

  // Initial 20 raw entries
  const [entries, setEntries] = useState<TrafficEntry[]>(() => {
    const now = Date.now();
    return Array.from({ length: 20 }, (_, i) => {
      const features = generateRawFeatures();
      return {
        id: crypto.randomUUID(),
        timestamp: new Date(now - (19 - i) * intervalMs),
        volume: Math.round(features[4]),   // packetsPerSec as a display proxy for "volume"
        prediction: "Normal", // Temporary placeholder until first payload resolves
        confidence: 0,
      };
    });
  });

  const [latest, setLatest] = useState<TrafficEntry | null>(null);

  /**
   * Rolling buffer of the last 20 raw feature vectors.
   * This is what gets sent to /api/predict — completely independent of any label.
   */
  const featuresWindowRef = useRef<number[][]>(
    Array.from({ length: 20 }, () => generateRawFeatures())
  );

  // Health check on mount — verify Flask backend is reachable
  useEffect(() => {
    let mounted = true;
    checkBackendHealth().then((isHealthy) => {
      if (mounted) {
        setMode(isHealthy ? "live" : "backend_down");
        console.log(`Backend: ${isHealthy ? "ALIVE -> Live Mode (CNN)" : "DOWN -> Model Offline"}`);
      }
    });
    return () => { mounted = false; };
  }, []);

  const tick = useCallback(async () => {
    let newFeatures: number[];
    if (forceDDoSRef.current) {
      // Force an extreme UDP Amplification Attack
      newFeatures = [1.5, 20000.0, 24000000.0, 95000000.0, 80000.0, 1200.0];
      forceDDoSRef.current = false;
    } else {
      newFeatures = generateRawFeatures();
    }

    // Step 2: Slide the features window forward
    const updatedWindow = [...featuresWindowRef.current.slice(-19), newFeatures];
    featuresWindowRef.current = updatedWindow;

    let prediction: "Normal" | "DDoS" = "Normal";  // safe default; overwritten below
    let confidence: number = 0;                  // safe default; overwritten below

    if (mode === "live") {
      // Step 3a — LIVE: send the 20-step window to Flask -> 1D-CNN decides
      try {
        const mlResult = await fetchPrediction(updatedWindow);
        prediction = mlResult.prediction ?? "Normal";
        confidence = mlResult.confidence ?? 0;
      } catch {
        // API hiccup this tick
        console.warn("API call failed this tick. Backend offline.");
        setMode("backend_down");
      }
    } else {
       // Step 3b -- Backend down / not reachable. We shouldn't evaluate via heuristic.
       console.warn("Backend is down. Traffic is not being evaluated by the model.");
       // Re-check backend health for recovery
       checkBackendHealth().then(isH => isH && setMode("live"));
    }

    const newEntry: TrafficEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      volume: Math.round(newFeatures[4]),  // packetsPerSec → display volume
      prediction,
      confidence,
    };

    setLatest(newEntry);
    setEntries((prev) => [...prev.slice(-(maxEntries - 1)), newEntry]);
  }, [mode, maxEntries]);

  useEffect(() => {
    const id = setInterval(tick, intervalMs);
    return () => clearInterval(id);
  }, [tick, intervalMs]);

  return { entries, latest: latest ?? entries[entries.length - 1], mode, triggerDDoS };
}
