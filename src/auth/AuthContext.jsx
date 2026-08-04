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

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getStoredToken());
  const [username, setUsername] = useState("");
  const [flags, setFlags] = useState(EMPTY_FLAGS);
  const [pairs, setPairs] = useState([]);
  const [loading, setLoading] = useState(!!getStoredToken());

  const applySession = useCallback((data, nextToken) => {
    if (nextToken) {
      setStoredToken(nextToken);
      setToken(nextToken);
    }
    setUsername(data.username || "");
    setFlags({ ...EMPTY_FLAGS, ...(data.flags || {}) });
    setPairs(Array.isArray(data.pairs) ? data.pairs : []);
  }, []);

  const logout = useCallback(() => {
    setStoredToken("");
    setToken("");
    setUsername("");
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
      } catch {
        if (!cancelled) logout();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, applySession, logout]);

  const login = useCallback(
    async (user, password) => {
      const data = await api.login(user, password);
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
      flags,
      pairs,
      loading,
      isAuthenticated: !!token && !!username,
      login,
      logout,
      refreshPairs,
      savePairs,
      setPairs,
    }),
    [token, username, flags, pairs, loading, login, logout, refreshPairs, savePairs],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
