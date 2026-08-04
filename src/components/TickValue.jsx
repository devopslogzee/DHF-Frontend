import { useEffect, useRef, useState } from "react";

/** Live number: green flash on rise, red on fall, brief blink. */
export default function TickValue({ value, decimals = 5, className = "" }) {
  const prevRef = useRef(null);
  const [flash, setFlash] = useState(""); // "up" | "down" | ""
  const timerRef = useRef(null);

  useEffect(() => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
      return;
    }
    const next = Number(value);
    const prev = prevRef.current;
    if (prev !== null && Number.isFinite(prev) && next !== prev) {
      setFlash(next > prev ? "up" : "down");
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setFlash(""), 520);
    }
    prevRef.current = next;
  }, [value]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const text =
    value === null || value === undefined || Number.isNaN(Number(value))
      ? "—"
      : Number(value).toFixed(decimals);

  const flashClass =
    flash === "up" ? "tick-up tick-blink" : flash === "down" ? "tick-down tick-blink" : "";

  return <span className={`tick-value ${flashClass} ${className}`.trim()}>{text}</span>;
}
