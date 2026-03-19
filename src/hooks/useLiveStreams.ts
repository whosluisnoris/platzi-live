"use client";

import { useState, useEffect, useCallback } from "react";
import type { LiveStream } from "@/lib/invidious";

interface State {
  streams: LiveStream[];
  loading: boolean;
  error: string | null;
  lastChecked: Date | null;
}

const POLL_INTERVAL = 300_000; // 5 minutes

export function useLiveStreams() {
  const [state, setState] = useState<State>({
    streams: [],
    loading: true,
    error: null,
    lastChecked: null,
  });

  const fetchStreams = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const params = new URLSearchParams(window.location.search);
      const testId = params.get("test");
      const url = testId ? `/api/live?test=${encodeURIComponent(testId)}` : "/api/live";
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to fetch");
      setState({
        streams: data.streams,
        loading: false,
        error: null,
        lastChecked: new Date(),
      });
    } catch (err) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : "Unknown error",
        lastChecked: new Date(),
      }));
    }
  }, []);

  useEffect(() => {
    fetchStreams();
    const id = setInterval(fetchStreams, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [fetchStreams]);

  return { ...state, refresh: fetchStreams };
}
