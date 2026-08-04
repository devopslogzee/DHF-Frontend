import { useEffect, useRef, useState } from "react";
import { API_URL } from "../api";

function defaultWsUrl() {
  if (import.meta.env.VITE_WS_URL) return import.meta.env.VITE_WS_URL;
  if (typeof window !== "undefined") {
    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${proto}//${window.location.host}/ws/live`;
  }
  return "ws://localhost:8000/ws/live";
}

const WS_URL = defaultWsUrl();
const SNAPSHOT_URL = `${API_URL}/snapshot`;
const POLL_MS = 500;

/**
 * @param {boolean} liveEnabled - ON: poll/WS updates; OFF: freeze last snapshot (no API refresh)
 */
export function useLiveSocket(liveEnabled = true) {
  const [data, setData] = useState(null);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef(null);
  const retryRef = useRef(1000);
  const lastWsAt = useRef(0);
  const liveRef = useRef(liveEnabled);

  useEffect(() => {
    liveRef.current = liveEnabled;
  }, [liveEnabled]);

  useEffect(() => {
    let cancelled = false;
    let retryTimer = null;
    let pingTimer = null;
    let pollTimer = null;

    function clearTimers() {
      if (retryTimer) clearTimeout(retryTimer);
      if (pingTimer) clearInterval(pingTimer);
      if (pollTimer) clearInterval(pollTimer);
      retryTimer = null;
      pingTimer = null;
      pollTimer = null;
    }

    function applySnapshot(json) {
      if (!json || !liveRef.current) return;
      setData((prev) => {
        if (!prev) return json;
        const nextPrices = json.raw_prices;
        // Replace prices atomically — never merge old GOLfs with new XAUUSD
        // (that inflated GOLD delta vs PHP).
        return {
          ...prev,
          ...json,
          raw_prices:
            nextPrices && Object.keys(nextPrices).length
              ? nextPrices
              : prev.raw_prices,
          swap_and_ea: json.swap_and_ea ?? prev.swap_and_ea,
        };
      });
      if (json?.connected || (json?.raw_prices && Object.keys(json.raw_prices).length)) {
        setConnected(true);
      }
    }

    async function pollSnapshot() {
      if (cancelled || !liveRef.current) return;
      if (Date.now() - lastWsAt.current < POLL_MS * 0.8) return;
      try {
        const resp = await fetch(SNAPSHOT_URL);
        if (!resp.ok) return;
        const json = await resp.json();
        if (cancelled || !liveRef.current) return;
        applySnapshot(json);
      } catch {
        // ignore transient poll errors
      }
    }

    function connect() {
      if (cancelled || !liveRef.current) return;
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        if (cancelled || !liveRef.current) {
          ws.close();
          return;
        }
        setConnected(true);
        retryRef.current = 1000;
        pingTimer = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) ws.send("ping");
        }, 15000);
      };

      ws.onmessage = (evt) => {
        if (cancelled || !liveRef.current) return;
        try {
          lastWsAt.current = Date.now();
          applySnapshot(JSON.parse(evt.data));
        } catch {
          // ignore malformed frame
        }
      };

      ws.onclose = () => {
        clearInterval(pingTimer);
        pingTimer = null;
        if (cancelled || !liveRef.current) return;
        const delay = Math.min(retryRef.current, 10000);
        retryTimer = setTimeout(connect, delay);
        retryRef.current = Math.min(retryRef.current * 1.5, 10000);
      };

      ws.onerror = () => {};
    }

    if (liveEnabled) {
      connect();
      pollSnapshot();
      pollTimer = setInterval(pollSnapshot, POLL_MS);
    }

    return () => {
      cancelled = true;
      clearTimers();
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [liveEnabled]);

  return { data, connected };
}
