import { useEffect, useState } from "react";
import "./TradeModal.css";

const SYMBOLS1 = ["XAUUSD.1", "XAUUSD.2", "XAUUSD.3", "XAUUSD.4", "XAUUSD.5"];
const SYMBOLS2 = ["GC.G24", "GCJ4", "GOLfs"];

const emptyForm = {
  accountnumber: "",
  open_value: "",
  close_value: "",
  symbols1: "",
  symbols2: "",
  lot: "",
  lot2: "",
  orders_count: "",
  action_symbols1: "",
  action_symbols2: "",
};

export default function TradeModal({
  open,
  onClose,
  onSubmit,
  username,
  defaultOpen,
  defaultClose,
}) {
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [okMsg, setOkMsg] = useState("");

  const lockedAccount = username === "Saverio" ? "501384" : null;

  useEffect(() => {
    if (!open) return;
    setError("");
    setOkMsg("");
    setForm({
      ...emptyForm,
      accountnumber: lockedAccount || "",
      open_value: defaultOpen != null && defaultOpen !== "" ? String(defaultOpen) : "",
      close_value: defaultClose != null && defaultClose !== "" ? String(defaultClose) : "",
    });
  }, [open, lockedAccount, defaultOpen, defaultClose]);

  if (!open) return null;

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSend() {
    setError("");
    setOkMsg("");
    setBusy(true);
    try {
      await onSubmit({
        accountnumber: form.accountnumber.trim(),
        open_value: parseFloat(form.open_value),
        close_value: parseFloat(form.close_value),
        symbols1: form.symbols1,
        symbols2: form.symbols2,
        lot: parseFloat(form.lot),
        lot2: parseFloat(form.lot2),
        orders_count: parseFloat(form.orders_count),
        action_symbols1: parseInt(form.action_symbols1, 10),
        action_symbols2: parseInt(form.action_symbols2, 10),
        stage: "0",
      });
      setOkMsg("Request sent to EA");
      setTimeout(() => onClose(), 800);
    } catch (e) {
      setError(e.message || "Trade request failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="trade-modal-backdrop" onClick={onClose}>
      <div className="trade-modal" onClick={(e) => e.stopPropagation()}>
        <div className="trade-modal-header">
          <h2>TRADE</h2>
          <button type="button" className="icon-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="trade-modal-body">
          <label>
            Account Number
            <input
              value={form.accountnumber}
              onChange={(e) => setField("accountnumber", e.target.value)}
              placeholder="12345"
              readOnly={!!lockedAccount}
            />
          </label>
          <label>
            Open Value
            <input
              value={form.open_value}
              onChange={(e) => setField("open_value", e.target.value)}
              placeholder="0.00000"
            />
          </label>
          <label>
            Close Value
            <input
              value={form.close_value}
              onChange={(e) => setField("close_value", e.target.value)}
              placeholder="0.00000"
            />
          </label>

          <hr />

          <label>
            Symbols 1
            <select value={form.symbols1} onChange={(e) => setField("symbols1", e.target.value)}>
              <option value="" disabled>
                Choose
              </option>
              {SYMBOLS1.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <div className="trade-radio-row">
            <span>Symbol 1 Action</span>
            <label className="inline">
              <input
                type="radio"
                name="a1"
                checked={form.action_symbols1 === "0"}
                onChange={() => setField("action_symbols1", "0")}
              />
              Buy
            </label>
            <label className="inline">
              <input
                type="radio"
                name="a1"
                checked={form.action_symbols1 === "1"}
                onChange={() => setField("action_symbols1", "1")}
              />
              Sell
            </label>
          </div>
          <label>
            Symbol 1 Lot
            <input
              value={form.lot}
              onChange={(e) => setField("lot", e.target.value)}
              placeholder="0.01"
            />
          </label>

          <hr />

          <label>
            Symbols 2
            <select value={form.symbols2} onChange={(e) => setField("symbols2", e.target.value)}>
              <option value="" disabled>
                Choose
              </option>
              {SYMBOLS2.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <div className="trade-radio-row">
            <span>Symbol 2 Action</span>
            <label className="inline">
              <input
                type="radio"
                name="a2"
                checked={form.action_symbols2 === "0"}
                onChange={() => setField("action_symbols2", "0")}
              />
              Buy
            </label>
            <label className="inline">
              <input
                type="radio"
                name="a2"
                checked={form.action_symbols2 === "1"}
                onChange={() => setField("action_symbols2", "1")}
              />
              Sell
            </label>
          </div>
          <label>
            Symbol 2 Lot
            <input
              value={form.lot2}
              onChange={(e) => setField("lot2", e.target.value)}
              placeholder="0.01"
            />
          </label>

          <hr />

          <label>
            Orders Count
            <input
              value={form.orders_count}
              onChange={(e) => setField("orders_count", e.target.value)}
              placeholder="10"
            />
          </label>

          {error && <div className="trade-error">{error}</div>}
          {okMsg && <div className="trade-ok">{okMsg}</div>}
        </div>

        <div className="trade-modal-footer">
          <button type="button" className="btn-secondary" onClick={() => setForm(emptyForm)}>
            ↺
          </button>
          <div className="trade-modal-footer-right">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Close
            </button>
            <button type="button" className="btn-primary" disabled={busy} onClick={handleSend}>
              {busy ? "Sending…" : "Send request"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
