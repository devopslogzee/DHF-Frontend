export default function Header({
  userName,
  eaOn,
  onToggleEa,
  connected,
  liveOn = true,
  showEa = true,
  onOpenSettings,
  onLogout,
}) {
  return (
    <header className="topbar">
      <div className="brand">
        <img className="brand-logo" src="/img/dhf-mark.png" alt="DHF" />
      </div>

      <div className="topbar-center">
        <span className="user-label">
          USER : <strong>{userName}</strong>
        </span>
        {!connected && liveOn && <span className="offline-pill">OFFLINE</span>}
        {!liveOn && <span className="paused-pill">PAUSED</span>}
      </div>

      <div className="topbar-right">
        {showEa && (
          <>
            <span className="ea-label">EA</span>
            <button
              className={`ea-toggle ${eaOn ? "on" : "off"}`}
              onClick={() => onToggleEa(eaOn ? 0 : 1)}
              type="button"
              title={eaOn ? "ON: live data" : "OFF: last updated data (API paused)"}
            >
              {eaOn ? "ON" : "OFF"}
            </button>
          </>
        )}
        {onOpenSettings && (
          <button className="icon-btn" title="Pair settings" type="button" onClick={onOpenSettings}>
            ⚙
          </button>
        )}
        {onLogout && (
          <button className="icon-btn logout-btn" title="Logout" type="button" onClick={onLogout}>
            ⎋
          </button>
        )}
      </div>
    </header>
  );
}
