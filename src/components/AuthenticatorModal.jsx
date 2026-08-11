import { useEffect, useState } from "react";
import { api } from "../api";
import "./AuthenticatorModal.css";

export default function AuthenticatorModal({ open, onClose }) {
  const [enabled, setEnabled] = useState(false);
  const [setup, setSetup] = useState(null);
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSetup(null);
    setOtp("");
    setPassword("");
    setError("");
    setMessage("");
    let cancelled = false;
    (async () => {
      try {
        const status = await api.getAuthenticator();
        if (!cancelled) setEnabled(!!status.enabled);
      } catch (e) {
        if (!cancelled) setError(e.message || "Failed to load status");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  if (!open) return null;

  async function startSetup() {
    setError("");
    setMessage("");
    setBusy(true);
    try {
      const data = await api.setupAuthenticator();
      setSetup(data);
      setOtp("");
    } catch (e) {
      setError(e.message || "Setup failed");
    } finally {
      setBusy(false);
    }
  }

  async function confirmEnable(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);
    try {
      const data = await api.enableAuthenticator(otp.trim());
      setEnabled(true);
      setSetup(null);
      setOtp("");
      setMessage(data.message || "Authenticator enabled");
    } catch (err) {
      setError(err.message || "Enable failed");
    } finally {
      setBusy(false);
    }
  }

  async function confirmDisable(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);
    try {
      const data = await api.disableAuthenticator(otp.trim(), password);
      setEnabled(false);
      setSetup(null);
      setOtp("");
      setPassword("");
      setMessage(data.message || "Authenticator disabled");
    } catch (err) {
      setError(err.message || "Disable failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="pair-modal-backdrop" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <div className="pair-modal-header">
          <h2>Authenticator</h2>
          <button type="button" className="icon-btn" onClick={onClose} title="Close">
            ✕
          </button>
        </div>

        <div className="auth-modal-body">
          <p className="auth-status">
            Status:{" "}
            <strong className={enabled ? "on" : "off"}>
              {enabled ? "Enabled" : "Disabled"}
            </strong>
          </p>
          <p className="pair-modal-help" style={{ margin: 0 }}>
            Use Google Authenticator, Microsoft Authenticator, or Authy. When
            enabled, login requires the 6-digit code.
          </p>

          {message && <div className="auth-ok">{message}</div>}
          {error && <div className="login-error">{error}</div>}

          {!enabled && !setup && (
            <button type="button" className="auth-primary" disabled={busy} onClick={startSetup}>
              {busy ? "Preparing…" : "Enable Authenticator"}
            </button>
          )}

          {!enabled && setup && (
            <form className="auth-form" onSubmit={confirmEnable}>
              <p>Scan this QR code in your authenticator app:</p>
              {setup.qr_url && (
                <img className="auth-qr" src={setup.qr_url} alt="Authenticator QR code" />
              )}
              <label>
                Or enter this key manually
                <input type="text" readOnly value={setup.secret} onFocus={(e) => e.target.select()} />
              </label>
              <label>
                Enter the 6-digit code to confirm
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={8}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  placeholder="123456"
                />
              </label>
              <div className="auth-actions">
                <button type="button" disabled={busy} onClick={() => setSetup(null)}>
                  Cancel
                </button>
                <button type="submit" className="auth-primary" disabled={busy}>
                  {busy ? "Saving…" : "Confirm & Enable"}
                </button>
              </div>
            </form>
          )}

          {enabled && (
            <form className="auth-form" onSubmit={confirmDisable}>
              <p>To disable, enter a current authenticator code or your password.</p>
              <label>
                Authenticator code
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={8}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                />
              </label>
              <label>
                Or password
                <input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="password"
                />
              </label>
              <button type="submit" className="auth-danger" disabled={busy}>
                {busy ? "Working…" : "Disable Authenticator"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
