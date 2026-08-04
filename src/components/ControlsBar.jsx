import { useState } from "react";

export default function ControlsBar({
  openTarget,
  closeTarget,
  avgOpen,
  avgClose,
  onSetOpen,
  onSetClose,
  onTrade,
  showTradeBar = true,
  showAvgPrice = true,
}) {
  const [openInput, setOpenInput] = useState("");
  const [closeInput, setCloseInput] = useState("");

  const fmt = (v) => (v === null || v === undefined || Number.isNaN(v) ? "—" : Number(v).toFixed(3));

  if (!showTradeBar && !showAvgPrice) return null;

  return (
    <div className="controls-bar">
      {showTradeBar && (
        <>
          <div className="control-group">
            <input
              type="number"
              step="any"
              placeholder="Enter Open value"
              value={openInput}
              onChange={(e) => setOpenInput(e.target.value)}
            />
            <button
              className="btn-set"
              type="button"
              onClick={() => {
                if (openInput !== "") onSetOpen(parseFloat(openInput));
              }}
            >
              SET
            </button>
            <button className="btn-reset" title="Reset" type="button" onClick={() => setOpenInput("")}>
              ⟲
            </button>
            <span className="target-label">
              Current Open Target Value: <strong className="value-green">{fmt(openTarget)}</strong>
            </span>
          </div>

          <div className="control-group">
            <input
              type="number"
              step="any"
              placeholder="Enter Close value"
              value={closeInput}
              onChange={(e) => setCloseInput(e.target.value)}
            />
            <button
              className="btn-set"
              type="button"
              onClick={() => {
                if (closeInput !== "") onSetClose(parseFloat(closeInput));
              }}
            >
              SET
            </button>
            <button className="btn-reset" title="Reset" type="button" onClick={() => setCloseInput("")}>
              ⟲
            </button>
            <span className="target-label">
              Current Close Target Value: <strong className="value-red">{fmt(closeTarget)}</strong>
            </span>
          </div>

          <button className="btn-trade" type="button" onClick={onTrade}>
            TRADE
          </button>
        </>
      )}

      {showAvgPrice && (
        <div className="avg-price-line">
          Current Average Price&nbsp;&nbsp;
          Open :{" "}
          <strong className={avgOpen < 0 ? "value-red" : "value-green"}>{fmt(avgOpen)}</strong>
          &nbsp;&nbsp;&nbsp;
          Close :{" "}
          <strong className={avgClose < 0 ? "value-red" : "value-green"}>{fmt(avgClose)}</strong>
        </div>
      )}
    </div>
  );
}
