import TickValue from "./TickValue";

export default function PriceCard({ label, bid, ask, delta, missing = false }) {
  const deltaTone =
    delta === null || delta === undefined
      ? ""
      : delta > 0
        ? "value-green"
        : delta < 0
          ? "value-red"
          : "";

  return (
    <div className={`price-card ${missing ? "missing" : ""}`}>
      <div className="price-card-header">{label}</div>
      <div className="price-card-body">
        <div className="price-row">
          <strong>Bid:</strong> <TickValue value={bid} />
        </div>
        <div className="price-row">
          <strong>Ask:</strong> <TickValue value={ask} />
        </div>
        <div className="price-row delta-row">
          <strong>Delta:</strong>{" "}
          <TickValue value={delta} className={deltaTone} />
        </div>
      </div>
    </div>
  );
}
