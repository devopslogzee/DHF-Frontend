import { useEffect, useState } from "react";
import { api } from "../api";
import "./CreateUserModal.css";

export default function CreateUserModal({ open, onClose }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) return;
    setUsername("");
    setPassword("");
    setRole("user");
    setError("");
    setMessage("");
    setBusy(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setError("");
    setMessage("");
    let cancelled = false;
    (async () => {
      try {
        const data = await api.listUsers();
        if (!cancelled) setUsers(data.users || []);
      } catch (e) {
        if (!cancelled) setError(e.message || "Failed to load users");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  if (!open) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);
    try {
      const createdName = username.trim();
      const data = await api.createUser(createdName, password, role);
      setMessage(data.message || `User ${data.username} created`);
      setUsername("");
      setPassword("");
      setRole("user");
      const list = await api.listUsers();
      const next = list.users || [];
      // Keep the new user visible at the top of the list
      setUsers([
        ...next.filter((u) => u.username.toLowerCase() === createdName.toLowerCase()),
        ...next.filter((u) => u.username.toLowerCase() !== createdName.toLowerCase()),
      ]);
      // Close only after successful create (not on error)
      setTimeout(() => onClose(), 600);
    } catch (err) {
      setError(err.message || "Create user failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="pair-modal-backdrop">
      <div className="create-user-modal">
        <div className="pair-modal-header">
          <h2>Create User</h2>
          <button type="button" className="icon-btn" onClick={onClose} title="Close">
            ✕
          </button>
        </div>

        <div className="create-user-body">
          <p className="pair-modal-help">
            Admin only — create dashboard login with role Admin or User.
          </p>

          <form className="create-user-form" onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="off"
            />
            <input
              type="password"
              placeholder="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={4}
            />
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
            {error && <div className="login-error">{error}</div>}
            {message && <div className="login-ok">{message}</div>}
            <button type="submit" disabled={busy}>
              {busy ? "Creating…" : "Create User"}
            </button>
          </form>

          {users.length > 0 && (
            <div className="create-user-list">
              <h3>Existing users</h3>
              <ul>
                {users.map((u) => (
                  <li key={u.username}>
                    <strong>{u.username}</strong>
                    <span className={`role-badge role-${u.role}`}>{u.role}</span>
                    <span className="user-source">{u.source}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
