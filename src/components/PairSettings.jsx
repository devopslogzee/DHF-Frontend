import { useEffect, useState } from "react";
import "./PairSettings.css";

function blankPair() {
  return {
    id: `pair_${Date.now()}`,
    left_label: "",
    left_symbol: "",
    right_label: "",
    right_symbol: "",
  };
}

export default function PairSettings({ open, pairs, onClose, onSave }) {
  const [draft, setDraft] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setDraft(pairs.map((p) => ({ ...p })));
      setError("");
    }
  }, [open, pairs]);

  if (!open) return null;

  function updateRow(index, field, value) {
    setDraft((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    );
  }

  function addRow() {
    setDraft((prev) => [...prev, blankPair()]);
  }

  function removeRow(index) {
    setDraft((prev) => prev.filter((_, i) => i !== index));
  }

  function moveRow(index, dir) {
    setDraft((prev) => {
      const next = [...prev];
      const j = index + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[index], next[j]] = [next[j], next[index]];
      return next;
    });
  }

  async function handleSave() {
    setError("");
    for (const row of draft) {
      if (!row.left_symbol?.trim() || !row.right_symbol?.trim()) {
        setError("Every pair needs left and right MT5 symbols.");
        return;
      }
    }
    setBusy(true);
    try {
      await onSave(
        draft.map((row, i) => ({
          id: row.id || `pair_${i + 1}`,
          left_label: row.left_label?.trim() || row.left_symbol.trim(),
          left_symbol: row.left_symbol.trim(),
          right_label: row.right_label?.trim() || row.right_symbol.trim(),
          right_symbol: row.right_symbol.trim(),
        })),
      );
      onClose();
    } catch (e) {
      setError(e.message || "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="pair-modal-backdrop" onClick={onClose}>
      <div className="pair-modal" onClick={(e) => e.stopPropagation()}>
        <div className="pair-modal-header">
          <h2>Pair settings</h2>
          <button type="button" className="icon-btn" onClick={onClose}>
            ✕
          </button>
        </div>
        <p className="pair-modal-help">
          Labels are shown on cards. Symbols must match MT5 Market Watch names exactly.
        </p>

        <div className="pair-table-wrap">
          <table className="pair-table">
            <thead>
              <tr>
                <th>Left label</th>
                <th>Left symbol</th>
                <th>Right label</th>
                <th>Right symbol</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {draft.map((row, index) => (
                <tr key={row.id || index}>
                  <td>
                    <input
                      value={row.left_label}
                      onChange={(e) => updateRow(index, "left_label", e.target.value)}
                      placeholder="COMEX"
                    />
                  </td>
                  <td>
                    <input
                      value={row.left_symbol}
                      onChange={(e) => updateRow(index, "left_symbol", e.target.value)}
                      placeholder="GOLfs"
                    />
                  </td>
                  <td>
                    <input
                      value={row.right_label}
                      onChange={(e) => updateRow(index, "right_label", e.target.value)}
                      placeholder="GOLD"
                    />
                  </td>
                  <td>
                    <input
                      value={row.right_symbol}
                      onChange={(e) => updateRow(index, "right_symbol", e.target.value)}
                      placeholder="XAUUSD"
                    />
                  </td>
                  <td className="pair-row-actions">
                    <button type="button" title="Up" onClick={() => moveRow(index, -1)}>
                      ↑
                    </button>
                    <button type="button" title="Down" onClick={() => moveRow(index, 1)}>
                      ↓
                    </button>
                    <button type="button" title="Remove" onClick={() => removeRow(index)}>
                      ⌫
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {error && <div className="pair-error">{error}</div>}

        <div className="pair-modal-footer">
          <button type="button" className="btn-secondary" onClick={addRow}>
            + Add pair
          </button>
          <div className="pair-modal-footer-right">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="button" className="btn-primary" disabled={busy} onClick={handleSave}>
              {busy ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
