import type { TrafficEntry } from "../hooks/useTrafficFeed";

const FLASK_URL = "http://127.0.0.1:5000"; // fallback

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const res = await fetch(`/health`);
    if (res.ok) {
      const data = await res.json();
      return data.status === "ok";
    }
    return false;
  } catch (error) {
    return false;
  }
}

export async function fetchPrediction(sequence: number[][]): Promise<Partial<TrafficEntry>> {
  try {
    const res = await fetch(`/api/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sequence }),
    });
    
    if (!res.ok) {
      throw new Error(`API error: ${res.statusText}`);
    }
    
    const data = await res.json();
    
    return {
      prediction: data.prediction as "Normal" | "DDoS",
      confidence: data.confidence,
      // fallback volume if not provided by backend
      volume: data.volume || 1000
    };
  } catch (error) {
    console.error("Backend prediction failed:", error);
    throw error;
  }
}
