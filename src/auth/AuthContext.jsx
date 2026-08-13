import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, getStoredToken, setStoredToken } from "../api";

const AuthContext = createContext(null);

const EMPTY_FLAGS = {
  ea: 0,
  tradebar: 0,
  avprice: 0,
  table: 0,
  chart: 0,
  historyorder: 0,
  liveorder: 0,
  closedorder: 0,
};

const SESSION_NOTICE_KEY = "td_session_notice";
const SESSION_POLL_MS = 5000;

export function getSessionNotice() {
  const msg = sessionStorage.getItem(SESSION_NOTICE_KEY) || "";
  if (msg) sessionStorage.removeItem(SESSION_NOTICE_KEY);
  return msg;
}

export function setSessionNotice(message) {
  if (message) sessionStorage.setItem(SESSION_NOTICE_KEY, message);
  else sessionStorage.removeItem(SESSION_NOTICE_KEY);
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getStoredToken());
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("user");
  const [flags, setFlags] = useState(EMPTY_FLAGS);
  const [pairs, setPairs] = useState([]);
  const [loading, setLoading] = useState(!!getStoredToken());

  const applySession = useCallback((data, nextToken) => {
    if (nextToken) {
      setStoredToken(nextToken);
      setToken(nextToken);
    }
    setUsername(data.username || "");
    setRole(data.role || (data.is_admin ? "admin" : "user"));
    setFlags({ ...EMPTY_FLAGS, ...(data.flags || {}) });
    setPairs(Array.isArray(data.pairs) ? data.pairs : []);
  }, []);

  const logout = useCallback((notice) => {
    if (notice) setSessionNotice(notice);
    setStoredToken("");
    setToken("");
    setUsername("");
    setRole("user");
    setFlags(EMPTY_FLAGS);
    setPairs([]);
  }, []);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const data = await api.me();
        if (!cancelled) applySession(data, token);
      } catch (err) {
        if (!cancelled) {
          const kicked = err?.code === "SESSION_REPLACED";
          logout(
            kicked
              ? err.message
              : "",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, applySession, logout]);

  // PHP-style session poll — kick local user when another login takes over
  useEffect(() => {
    if (!token) return undefined;
    let cancelled = false;

    async function poll() {
      try {
        const data = await api.checkSession();
        if (cancelled) return;
        if (data?.output === "logout") {
          logout(
            data.message ||
              "You were logged out because this account signed in from another device or browser.",
          );
        }
      } catch (err) {
        if (cancelled) return;
        if (err?.code === "SESSION_REPLACED" || err?.status === 401) {
          logout(
            err.message ||
              "You were logged out because this account signed in from another device or browser.",
          );
        }
      }
    }

    const id = setInterval(poll, SESSION_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [token, logout]);

  const login = useCallback(
    async (user, password, otp) => {
      const data = await api.login(user, password, otp);
      applySession(data, data.token);
      return data;
    },
    [applySession],
  );

  const refreshPairs = useCallback(async () => {
    const data = await api.getPairs();
    setPairs(data.pairs || []);
    return data.pairs || [];
  }, []);

  const savePairs = useCallback(async (nextPairs) => {
    const data = await api.savePairs(nextPairs);
    setPairs(data.pairs || []);
    return data.pairs || [];
  }, []);

  const value = useMemo(
    () => ({
      token,
      username,
      role,
      flags,
      pairs,
      loading,
      isAuthenticated: !!token && !!username,
      isAdmin: role === "admin",
      login,
      logout,
      refreshPairs,
      savePairs,
      setPairs,
    }),
    [token, username, role, flags, pairs, loading, login, logout, refreshPairs, savePairs],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
