// Empty VITE_API_URL = same-origin (nginx on EC2). Dev default = local backend.
const API_URL =
  import.meta.env.VITE_API_URL !== undefined && import.meta.env.VITE_API_URL !== ""
    ? import.meta.env.VITE_API_URL
    : import.meta.env.DEV
      ? "http://localhost:8000"
      : "";
const API_KEY = import.meta.env.VITE_API_KEY || "";

const TOKEN_KEY = "td_token";

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY) || "";
}

export function setStoredToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request(path, { method = "GET", body, auth = "user", headers = {} } = {}) {
  const h = { "Content-Type": "application/json", ...headers };
  if (auth === "user") {
    const token = getStoredToken();
    if (token) h.Authorization = `Bearer ${token}`;
  } else if (auth === "apiKey") {
    h.Authorization = `Bearer ${API_KEY}`;
  }

  const resp = await fetch(`${API_URL}${path}`, {
    method,
    headers: h,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`${resp.status}: ${text}`);
  }
  if (resp.status === 204) return null;
  return resp.json();
}

export const api = {
  login: (username, password) =>
    request("/auth/login", {
      method: "POST",
      body: { username, password },
      auth: "none",
    }),
  me: () => request("/auth/me"),
  getPairs: () => request("/me/pairs"),
  savePairs: (pairs) =>
    request("/me/pairs", { method: "PUT", body: { pairs } }),
  setEaSwitch: (onOff) =>
    request("/controls/ea-switch", {
      method: "POST",
      body: { on_off: onOff },
    }),
  setTargets: (openValue, closeValue) =>
    request("/controls/targets", {
      method: "POST",
      body: { open_value: openValue, close_value: closeValue },
    }),
  trade: (payload) =>
    request("/controls/trade", {
      method: "POST",
      body: payload || {},
    }),
};

export { API_URL };
