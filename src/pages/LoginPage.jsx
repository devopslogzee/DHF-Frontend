import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { getSessionNotice, useAuth } from "../auth/AuthContext";
import { api } from "../api";
import "./LoginPage.css";

export default function LoginPage() {
  const { login, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [showEnable, setShowEnable] = useState(false);
  const [setup, setSetup] = useState(null);
  const [enableOtp, setEnableOtp] = useState("");
  const [enableMsg, setEnableMsg] = useState("");

  useEffect(() => {
    const msg = getSessionNotice();
    if (msg) setNotice(msg);
  }, []);

  if (!loading && isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setNotice("");
    const user = username.trim();
    const pass = password.trim();
    const code = otp.trim();
    if (!user) {
      setError("Username is required");
      return;
    }
    if (!pass && !code) {
      setError("Enter password or authenticator code");
      return;
    }
    setBusy(true);
    try {
      await login(user, pass, code);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setBusy(false);
    }
  }

  async function startEnable(e) {
    e.preventDefault();
    setError("");
    setEnableMsg("");
    if (!username.trim() || !password.trim()) {
      setError("Enter username and password to enable authenticator");
      return;
    }
    setBusy(true);
    try {
      const data = await api.setupAuthenticatorPublic(username.trim(), password);
      setSetup(data);
      setEnableOtp("");
      setShowEnable(true);
    } catch (err) {
      setError(err.message || "Could not start authenticator setup");
    } finally {
      setBusy(false);
    }
  }

  async function confirmEnable(e) {
    e.preventDefault();
    setError("");
    setEnableMsg("");
    setBusy(true);
    try {
      const data = await api.enableAuthenticatorPublic(
        username.trim(),
        password,
        enableOtp.trim(),
      );
      setSetup(null);
      setShowEnable(false);
      setEnableOtp("");
      setEnableMsg(data.message || "Authenticator enabled — you can login with password or code");
      setNotice("");
    } catch (err) {
      setError(err.message || "Enable failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <img className="login-logo" src="/img/Logo.png" alt="DHF Icon" />
        </div>

        {notice && <div className="login-notice">{notice}</div>}
        {enableMsg && <div className="login-ok">{enableMsg}</div>}

        <form className="login-form" onSubmit={onSubmit}>
          <input
            type="text"
            name="username"
            placeholder="login"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="password (or use authenticator)"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <input
            type="text"
            name="otp"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="authenticator code (or use password)"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            maxLength={8}
          />
          <p className="login-hint">Use either password or authenticator code — not both required.</p>
          {error && <div className="login-error">{error}</div>}
          <button type="submit" disabled={busy}>
            {busy ? "Signing in…" : "Login"}
          </button>
        </form>

        {!showEnable && (
          <button
            type="button"
            className="login-link-btn"
            disabled={busy}
            onClick={startEnable}
          >
            Enable Authenticator
          </button>
        )}

        {showEnable && setup && (
          <form className="login-enable" onSubmit={confirmEnable}>
            <p className="login-hint">Scan QR in Google / Microsoft Authenticator:</p>
            {setup.qr_url && (
              <img className="login-qr" src={setup.qr_url} alt="Authenticator QR" />
            )}
            <input type="text" readOnly value={setup.secret} onFocus={(e) => e.target.select()} />
            <input
              type="text"
              inputMode="numeric"
              placeholder="enter 6-digit code to confirm"
              value={enableOtp}
              onChange={(e) => setEnableOtp(e.target.value)}
              maxLength={8}
              required
            />
            <div className="login-enable-actions">
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setShowEnable(false);
                  setSetup(null);
                }}
              >
                Cancel
              </button>
              <button type="submit" disabled={busy}>
                {busy ? "Saving…" : "Confirm & Enable"}
              </button>
            </div>
          </form>
        )}

        <div className="login-footer">DUBAI HEDGE FUND</div>
      </div>
    </div>
  );
}
