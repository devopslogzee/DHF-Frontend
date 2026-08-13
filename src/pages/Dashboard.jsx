import { useCallback, useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import ControlsBar from "../components/ControlsBar";
import PriceGrid from "../components/PriceGrid";
import PairSettings from "../components/PairSettings";
import CreateUserModal from "../components/CreateUserModal";
import TradeModal from "../components/TradeModal";
import { useLiveSocket } from "../hooks/useLiveSocket";
import { useAuth } from "../auth/AuthContext";
import { api } from "../api";
import "../App.css";

export default function Dashboard() {
  const { username, role, flags, pairs, loading, isAuthenticated, isAdmin, logout, savePairs } = useAuth();
  const navigate = useNavigate();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [tradeOpen, setTradeOpen] = useState(false);
  // Optimistic live switch — OFF freezes last snapshot and stops WS/poll
  const [liveOn, setLiveOn] = useState(true);
  const [syncedEa, setSyncedEa] = useState(false);

  const { data, connected } = useLiveSocket(liveOn);

  const swapAndEa = data?.swap_and_ea || {};
  const openTarget = swapAndEa?.targets?.open_value;
  const closeTarget = swapAndEa?.targets?.close_value;
  const avgOpen = swapAndEa?.algozest_latest?.avg_open_value;
  const avgClose = swapAndEa?.algozest_latest?.avg_close_value;

  // Seed toggle from server EA once (before user takes over)
  useEffect(() => {
    if (syncedEa) return;
    const sw = data?.swap_and_ea?.ea_switch;
    if (sw && typeof sw.on_off === "number") {
      setLiveOn(sw.on_off === 1);
      setSyncedEa(true);
    }
  }, [data, syncedEa]);

  const handleToggleEa = useCallback(async (onOff) => {
    const next = onOff === 1;
    setLiveOn(next);
    setSyncedEa(true);
    try {
      await api.setEaSwitch(onOff);
    } catch (e) {
      alert(`Failed to toggle EA: ${e.message}`);
    }
  }, []);

  const handleSetOpen = useCallback(async (value) => {
    try {
      await api.setTargets(value, undefined);
    } catch (e) {
      alert(`Failed to set open target: ${e.message}`);
    }
  }, []);

  const handleSetClose = useCallback(async (value) => {
    try {
      await api.setTargets(undefined, value);
    } catch (e) {
      alert(`Failed to set close target: ${e.message}`);
    }
  }, []);

  const handleTradeSubmit = useCallback(async (payload) => {
    await api.trade(payload);
  }, []);

  const handleLogout = useCallback(() => {
    logout();
    navigate("/login", { replace: true });
  }, [logout, navigate]);

  if (loading) {
    return <div className="boot-screen">Loading…</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="dashboard">
      <Header
        userName={username}
        userRole={role}
        eaOn={liveOn}
        liveOn={liveOn}
        onToggleEa={handleToggleEa}
        connected={connected}
        showEa={flags.ea === 1}
        onOpenSettings={() => setSettingsOpen(true)}
        onCreateUser={isAdmin ? () => setCreateUserOpen(true) : undefined}
        onLogout={handleLogout}
      />

      <ControlsBar
        openTarget={openTarget}
        closeTarget={closeTarget}
        avgOpen={avgOpen}
        avgClose={avgClose}
        onSetOpen={handleSetOpen}
        onSetClose={handleSetClose}
        onTrade={() => setTradeOpen(true)}
        showTradeBar={flags.tradebar === 1}
        showAvgPrice={flags.avprice === 1}
      />

      {flags.table === 1 ? (
        <PriceGrid userPairs={pairs} rawPrices={data?.raw_prices || {}} />
      ) : (
        <main className="pair-grid empty-grid">
          <p>Price tables are disabled for this user.</p>
        </main>
      )}

      <PairSettings
        open={settingsOpen}
        pairs={pairs}
        onClose={() => setSettingsOpen(false)}
        onSave={savePairs}
      />

      <CreateUserModal open={createUserOpen} onClose={() => setCreateUserOpen(false)} />

      <TradeModal
        open={tradeOpen}
        onClose={() => setTradeOpen(false)}
        onSubmit={handleTradeSubmit}
        username={username}
        defaultOpen={openTarget}
        defaultClose={closeTarget}
      />
    </div>
  );
}
