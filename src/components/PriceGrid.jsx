import PriceCard from "./PriceCard";
import { assemblePairs } from "../lib/assemblePairs";

export default function PriceGrid({ userPairs, rawPrices }) {
  const rows = assemblePairs(userPairs, rawPrices);

  if (!rows.length) {
    return (
      <main className="pair-grid empty-grid">
        <p>No symbol pairs configured. Open Pair Settings to add some.</p>
      </main>
    );
  }

  return (
    <main className="pair-grid">
      {rows.map((pair) => (
        <div className="pair-group" key={pair.id}>
          <PriceCard
            label={pair.left.label}
            bid={pair.left.bid}
            ask={pair.left.ask}
            delta={pair.left.delta}
            missing={pair.missing}
          />
          <PriceCard
            label={pair.right.label}
            bid={pair.right.bid}
            ask={pair.right.ask}
            delta={pair.right.delta}
            missing={pair.missing}
          />
        </div>
      ))}
    </main>
  );
}
