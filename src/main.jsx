import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Award,
  BarChart3,
  ChevronRight,
  Clock3,
  Flame,
  Gamepad2,
  Gift,
  History,
  LockKeyhole,
  LogIn,
  LogOut,
  Play,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
  UserRound,
  X,
} from "lucide-react";
import "./styles.css";
import "./platform.css";
import "./platform-account.css";
import { games } from "./games/catalog";
import { arcadeStore } from "./shared/platform/store";
import {
  backendAvailable,
  changePassword,
  getAccountData,
  getLeaderboard,
  login,
  logout,
  register,
  syncRuns,
} from "./shared/platform/api";

const nf = new Intl.NumberFormat("tr-TR");
const labels = { "getir-rush": "Getir Rush", "depo-tetris": "Depo Tetris" };
let syncing = false;
async function syncPendingRuns() {
  if (syncing || !backendAvailable) return;
  const snapshot = arcadeStore.getSnapshot();
  if (snapshot.profile.mode !== "account") return;
  syncing = true;
  arcadeStore.markSyncing();
  try {
    if (snapshot.outbox.length) {
      const { synced, rejected } = await syncRuns(snapshot.outbox);
      arcadeStore.markSynced(synced, rejected);
    }
    const remote = await getAccountData();
    if (remote) {
      arcadeStore.mergeRemote(remote);
      if (!snapshot.outbox.length) arcadeStore.markSynced([]);
    } else arcadeStore.clearSession();
  } catch (error) {
    arcadeStore.markSyncFailed(error.message);
  } finally {
    syncing = false;
  }
}
if (typeof window !== "undefined") {
  addEventListener("arcade:updated", syncPendingRuns);
  addEventListener("online", syncPendingRuns);
  setTimeout(syncPendingRuns, 0);
}
function useArcade() {
  const [state, setState] = useState(() => arcadeStore.getSnapshot());
  useEffect(() => {
    const update = () => setState(arcadeStore.getSnapshot());
    addEventListener("arcade:updated", update);
    return () => removeEventListener("arcade:updated", update);
  }, []);
  return state;
}
function GameCard({ game, stats, onPlay }) {
  return (
    <article
      className={`game-card ${!game.ready ? "locked" : ""}`}
      style={{ "--accent": game.color, "--ink": game.ink }}
    >
      <div className="game-art">
        <img src={game.image} alt={`${game.name} oyun kapağı`} loading="lazy" />
        <span className="game-badge">{game.badge}</span>
        {!game.ready && <LockKeyhole className="lock" size={22} />}
      </div>
      <div className="game-copy">
        <span>{game.type}</span>
        <h3>{game.name}</h3>
        <p>{game.description}</p>
        {game.ready && (
          <div className="game-stats">
            <span>
              <b>{nf.format(stats?.bestScore || 0)}</b>Rekor
            </span>
            <span>
              <b>{stats?.plays || 0}</b>Tur
            </span>
            <span>
              <b>{nf.format(stats?.lastScore || 0)}</b>Son skor
            </span>
          </div>
        )}
        <button disabled={!game.ready} onClick={() => onPlay(game)}>
          {game.ready ? (
            <>
              Oyuna gir <ChevronRight size={17} />
            </>
          ) : (
            "Çok yakında"
          )}
        </button>
      </div>
    </article>
  );
}
function AuthModal({ onClose, onSuccess }) {
  const [mode, setMode] = useState("login"),
    [nickname, setNickname] = useState(""),
    [password, setPassword] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!/^[a-z0-9._]{3,20}$/.test(nickname)) {
      setError(
        "Nickname 3–20 karakter olmalı; küçük harf, rakam, _ ve . kullanılabilir.",
      );
      return;
    }
    if (password.length < 8) {
      setError("Şifre en az 8 karakter olmalı.");
      return;
    }
    setBusy(true);
    try {
      const data =
        mode === "login"
          ? await login(nickname, password)
          : await register(nickname, password);
      arcadeStore.setAccount({
        nickname: data.profile?.nickname || nickname,
        userId: data.profile?.id || data.user?.id,
        mustChangePassword: data.profile?.must_change_password,
      });
      onSuccess?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <section className="auth-modal">
        <button className="modal-close" onClick={onClose}>
          <X />
        </button>
        <div className="auth-mark">
          <Gamepad2 />
        </div>
        <span className="kicker">GETİR ARCADE HESABI</span>
        <h2>
          {mode === "login" ? "Tekrar hoş geldin" : "Oyuncu hesabını oluştur"}
        </h2>
        <p>Skorlarını koru, görevleri tamamla ve aylık lige katıl.</p>
        <div className="auth-tabs">
          <button
            className={mode === "login" ? "active" : ""}
            onClick={() => setMode("login")}
          >
            Giriş yap
          </button>
          <button
            className={mode === "register" ? "active" : ""}
            onClick={() => setMode("register")}
          >
            Yeni hesap
          </button>
        </div>
        <form onSubmit={submit}>
          <label>
            Nickname
            <input
              autoFocus
              autoComplete="username"
              value={nickname}
              onChange={(e) => setNickname(e.target.value.toLowerCase())}
              placeholder="ör. ahmetarcade"
            />
          </label>
          <label>
            Şifre
            <input
              type="password"
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="En az 8 karakter"
            />
          </label>
          {error && <div className="form-error">{error}</div>}
          <button className="auth-submit" disabled={busy}>
            {busy
              ? "Bağlanıyor…"
              : mode === "login"
                ? "Giriş yap"
                : "Hesap oluştur"}
          </button>
        </form>
        {!backendAvailable && (
          <div className="offline-note">
            <ShieldCheck size={16} />
            <span>
              Ortak lig henüz yapılandırılmadı. Misafir ilerlemen cihazında
              güvenle devam ediyor.
            </span>
          </div>
        )}
        <button className="guest-link" onClick={onClose}>
          Misafir olarak devam et
        </button>
      </section>
    </div>
  );
}
function ProfileDrawer({ state, onClose, onAuth }) {
  const account = state.profile.mode === "account",
    [showPassword, setShowPassword] = useState(
      Boolean(state.profile.mustChangePassword),
    ),
    [password, setPassword] = useState(""),
    [message, setMessage] = useState(
      state.profile.mustChangePassword
        ? "Devam etmek için geçici şifreni değiştir."
        : "",
    );
  const updatePassword = async (e) => {
    e.preventDefault();
    if (password.length < 8) {
      setMessage("Şifre en az 8 karakter olmalı.");
      return;
    }
    try {
      await changePassword(password);
      arcadeStore.markPasswordChanged();
      setPassword("");
      setShowPassword(false);
      setMessage("Şifren güncellendi.");
    } catch (err) {
      setMessage(err.message);
    }
  };
  return (
    <div
      className="drawer-backdrop"
      onMouseDown={(e) =>
        e.target === e.currentTarget &&
        !state.profile.mustChangePassword &&
        onClose()
      }
    >
      <aside className="profile-drawer">
        {!state.profile.mustChangePassword && (
          <button className="modal-close" onClick={onClose}>
            <X />
          </button>
        )}
        <div className="profile-avatar">
          {account ? state.profile.nickname.slice(0, 2).toUpperCase() : "M"}
        </div>
        <span className="kicker">
          {account ? "ARCADE OYUNCUSU" : "MİSAFİR PROFİLİ"}
        </span>
        <h2>{state.profile.nickname}</h2>
        <div className="profile-level">
          <b>Seviye {state.level}</b>
          <span>
            <i style={{ width: `${(state.careerXp % 1000) / 10}%` }} />
          </span>
          <small>{state.careerXp % 1000} / 1.000 XP</small>
        </div>
        <div className="profile-metrics">
          <div>
            <b>{nf.format(state.careerXp)}</b>
            <small>Kariyer XP</small>
          </div>
          <div>
            <b>{state.totalRuns}</b>
            <small>Toplam tur</small>
          </div>
          <div>
            <b>{nf.format(state.totalScore)}</b>
            <small>Oyun puanı</small>
          </div>
        </div>
        {account && state.sync.status !== "idle" && (
          <div className="drawer-message">
            {state.sync.status === "syncing" && "İlerlemen eşitleniyor…"}
            {state.sync.status === "pending" &&
              `${state.outbox.length} tur bağlantı bekliyor.`}
            {state.sync.status === "synced" &&
              (state.sync.rejected
                ? `${state.sync.rejected} şüpheli tur yerelde bırakıldı; lige eklenmedi.`
                : "İlerlemen güncel.")}
            {state.sync.status === "error" &&
              `${state.sync.lastError} Bekleyen turlar cihazında saklanıyor.`}
          </div>
        )}
        <h3>Kişisel rekorlar</h3>
        {Object.entries(state.gameStats).map(([id, s]) => (
          <div className="record-row" key={id}>
            <span>{labels[id]}</span>
            <b>{nf.format(s.bestScore)}</b>
          </div>
        ))}
        {account ? (
          <>
            {showPassword ? (
              <form className="password-form" onSubmit={updatePassword}>
                <input
                  type="password"
                  minLength="8"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Yeni şifre (en az 8 karakter)"
                />
                <button>Güncelle</button>
              </form>
            ) : (
              <button
                className="drawer-action secondary"
                onClick={() => setShowPassword(true)}
              >
                Şifre değiştir
              </button>
            )}
            {message && <div className="drawer-message">{message}</div>}
            <button
              className="drawer-action danger"
              onClick={() => {
                logout();
                arcadeStore.clearSession();
                onClose();
              }}
            >
              <LogOut size={17} />
              Çıkış yap
            </button>
          </>
        ) : (
          <>
            <div className="guest-callout">
              İlerlemeni farklı cihazlarda korumak ve ortak lige katılmak için
              hesap oluştur.
            </div>
            <button className="drawer-action" onClick={onAuth}>
              <LogIn size={17} />
              Giriş yap veya hesap oluştur
            </button>
          </>
        )}
      </aside>
    </div>
  );
}
function TaskList({ tasks }) {
  return (
    <div>
      {tasks.map((task) => {
        const value = task.value || 0,
          pct = Math.min(100, (value / task.target) * 100);
        return (
          <div className={`task ${task.completed ? "done" : ""}`} key={task.id}>
            <span className="task-icon">{task.completed ? "✓" : "🎯"}</span>
            <div>
              <b>{task.title}</b>
              <small>{task.description}</small>
              <div className="bar">
                <i style={{ width: `${pct}%` }} />
              </div>
            </div>
            <strong>
              {value}/{task.target}
            </strong>
            <span className="xp-tag">
              {task.rewarded ? "ALINDI" : `+${task.reward} XP`}
            </span>
          </div>
        );
      })}
    </div>
  );
}
function App() {
  const state = useArcade(),
    [notice, setNotice] = useState(""),
    [authOpen, setAuthOpen] = useState(false),
    [profileOpen, setProfileOpen] = useState(false),
    [taskTab, setTaskTab] = useState("daily"),
    [leaderTab, setLeaderTab] = useState("season"),
    [leaders, setLeaders] = useState([]),
    [leaderStatus, setLeaderStatus] = useState(
      backendAvailable ? "loading" : "unconfigured",
    );
  const account = state.profile.mode === "account";
  useEffect(() => {
    if (!backendAvailable) {
      setLeaderStatus("unconfigured");
      return;
    }
    setLeaderStatus("loading");
    getLeaderboard(leaderTab, account ? state.profile.nickname : "")
      .then((rows) => {
        setLeaders(rows);
        setLeaderStatus(rows.length ? "ready" : "empty");
      })
      .catch(() => {
        setLeaders([]);
        setLeaderStatus(navigator.onLine ? "error" : "offline");
      });
  }, [leaderTab, state.totalRuns, account]);
  const play = (game) => {
    if (game.ready && game.route) location.assign(game.route);
    else {
      setNotice(`${game.name} çok yakında.`);
      setTimeout(() => setNotice(""), 2500);
    }
  };
  const recent = state.runs.slice(0, 4);
  const seasonProgress = (state.seasonXp % 1000) / 10;
  return (
    <div className="app-shell">
      <header>
        <a className="brand" href="#top">
          <span className="brand-mark">
            <Gamepad2 />
          </span>
          <span>
            <b>getir</b>
            <strong>arcade</strong>
          </span>
        </a>
        <nav>
          <a href="#games">Oyunlar</a>
          <a href="#tasks">Görevler</a>
          <a href="#leaders">Sıralama</a>
        </nav>
        {!account && (
          <button className="login-cta" onClick={() => setAuthOpen(true)}>
            <LogIn size={15} />
            Giriş yap
          </button>
        )}
        <button className="profile-pill" onClick={() => setProfileOpen(true)}>
          <span>
            {account ? state.profile.nickname.slice(0, 2).toUpperCase() : "M"}
          </span>
          <span>
            <small>Seviye {state.level}</small>
            {state.profile.nickname}
          </span>
          <ChevronRight size={16} />
        </button>
      </header>
      <main id="top">
        <section className="hero platform-hero">
          <div className="hero-copy">
            <div className="eyebrow">
              <Sparkles size={15} /> SEZON 01 · AYLIK LİG
            </div>
            <h1>
              Merhaba,
              <br />
              <em>{state.profile.nickname}.</em>
            </h1>
            <p>
              {account
                ? "Skorların, görevlerin ve sezon ilerlemen tek yerde. Zirve için yeni bir tur zamanı."
                : "Hemen oyna. İlerlemen bu cihazda kaydolur; lige katılmak için dilediğinde hesap oluştur."}
            </p>
            <div className="hero-actions">
              <button className="primary" onClick={() => play(games[0])}>
                <Play fill="currentColor" size={17} /> Getir Rush oyna
              </button>
              {!account && (
                <button className="hero-auth" onClick={() => setAuthOpen(true)}>
                  İlerlememi koru
                </button>
              )}
            </div>
          </div>
          <div className="hero-panel">
            <div className="season-title">
              <span>AYLIK SEZON</span>
              <strong>{account ? "Ortak lig" : "Misafir modu"}</strong>
            </div>
            <div className="level-row">
              <div>
                <small>SEVİYE</small>
                <b>{state.level}</b>
              </div>
              <div className="xp">
                <span>
                  <i style={{ width: `${seasonProgress}%` }} />
                </span>
                <small>{nf.format(state.seasonXp)} sezon XP</small>
              </div>
              <div className="reward">
                <Gift size={22} />
                <small>SONRAKİ</small>
              </div>
            </div>
            <div className="stat-grid">
              <div>
                <Trophy />
                <span>
                  <b>{account ? "—" : "Yerel"}</b>
                  <small>Genel sıra</small>
                </span>
              </div>
              <div>
                <BarChart3 />
                <span>
                  <b>{nf.format(state.totalScore)}</b>
                  <small>Toplam puan</small>
                </span>
              </div>
              <div>
                <Award />
                <span>
                  <b>{state.totalRuns}</b>
                  <small>Toplam tur</small>
                </span>
              </div>
            </div>
          </div>
        </section>
        <section className="quick-stats">
          <div>
            <Flame />
            <span>
              <small>KARİYER XP</small>
              <b>{nf.format(state.careerXp)}</b>
            </span>
          </div>
          <div>
            <Trophy />
            <span>
              <small>EN İYİ RUSH</small>
              <b>{nf.format(state.gameStats["getir-rush"].bestScore)}</b>
            </span>
          </div>
          <div>
            <Star />
            <span>
              <small>EN İYİ DEPO</small>
              <b>{nf.format(state.gameStats["depo-tetris"].bestScore)}</b>
            </span>
          </div>
          <div>
            <History />
            <span>
              <small>SON AKTİVİTE</small>
              <b>{recent[0] ? labels[recent[0].gameId] : "Henüz yok"}</b>
            </span>
          </div>
        </section>
        <section className="section" id="games">
          <div className="section-head">
            <div>
              <span>ARCADE KÜTÜPHANESİ</span>
              <h2>Bir oyun seç</h2>
            </div>
          </div>
          <div className="games-grid">
            {games.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                stats={state.gameStats[game.id]}
                onPlay={play}
              />
            ))}
          </div>
        </section>
        <section className="dashboard" id="tasks">
          <div className="daily card">
            <div className="card-head">
              <div>
                <span>İLERLEME</span>
                <h2>Görevler</h2>
              </div>
              <div className="segmented">
                <button
                  className={taskTab === "daily" ? "active" : ""}
                  onClick={() => setTaskTab("daily")}
                >
                  Günlük
                </button>
                <button
                  className={taskTab === "weekly" ? "active" : ""}
                  onClick={() => setTaskTab("weekly")}
                >
                  Haftalık
                </button>
              </div>
            </div>
            <TaskList
              tasks={taskTab === "daily" ? state.dailyTasks : state.weeklyTasks}
            />
          </div>
          <div className="leaderboard card" id="leaders">
            <div className="card-head">
              <div>
                <span>AYLIK SEZON</span>
                <h2>Sıralama</h2>
              </div>
              <Trophy size={23} />
            </div>
            <div className="leader-tabs">
              {[
                ["season", "Arcade XP"],
                ["getir-rush", "Rush"],
                ["depo-tetris", "Depo"],
              ].map(([id, label]) => (
                <button
                  className={leaderTab === id ? "active" : ""}
                  onClick={() => setLeaderTab(id)}
                  key={id}
                >
                  {label}
                </button>
              ))}
            </div>
            {leaderStatus === "ready" ? (
              leaders.map((p, i) => (
                <div className="leader" key={p.nickname || i}>
                  <b className={`rank r${p.rank || i + 1}`}>
                    {p.rank || i + 1}
                  </b>
                  <span className="avatar">
                    {p.nickname?.slice(0, 2).toUpperCase()}
                  </span>
                  <div>
                    <strong>{p.nickname}</strong>
                    <small>Sezon oyuncusu</small>
                  </div>
                  <b>
                    {nf.format(p.xp || p.score || 0)}{" "}
                    <small>{leaderTab === "season" ? "XP" : "puan"}</small>
                  </b>
                </div>
              ))
            ) : (
              <div className="empty-league">
                <ShieldCheck />
                <b>
                  {leaderStatus === "loading" && "Lig yükleniyor…"}
                  {leaderStatus === "empty" && "Lig henüz boş"}
                  {leaderStatus === "offline" && "Bağlantı yok"}
                  {leaderStatus === "error" && "Lig şu anda yüklenemiyor"}
                  {leaderStatus === "unconfigured" &&
                    "Ortak lig henüz yapılandırılmadı"}
                </b>
                <p>
                  {leaderStatus === "loading" && "Sıralama hazırlanıyor."}
                  {leaderStatus === "empty" && "İlk skoru sen gönder."}
                  {leaderStatus === "offline" &&
                    "İlerlemen cihazında güvende; bağlantı gelince tekrar deneyeceğiz."}
                  {leaderStatus === "error" &&
                    "Biraz sonra yeniden deneyebilirsin."}
                  {leaderStatus === "unconfigured" &&
                    "Şimdilik skorların ve görevlerin bu cihazda kaydediliyor."}
                </p>
              </div>
            )}
          </div>
        </section>
        {recent.length > 0 && (
          <section className="activity card">
            <div className="card-head">
              <div>
                <span>SON OYUNLAR</span>
                <h2>Aktivite</h2>
              </div>
            </div>
            {recent.map((run) => (
              <div className="activity-row" key={run.clientRunId}>
                <span className="activity-icon">
                  {run.gameId === "getir-rush" ? "🛵" : "📦"}
                </span>
                <div>
                  <b>{labels[run.gameId]}</b>
                  <small>
                    {new Date(run.completedAt).toLocaleString("tr-TR")}
                  </small>
                </div>
                <strong>{nf.format(run.score)} puan</strong>
                <span>+{run.xp} XP</span>
              </div>
            ))}
          </section>
        )}
      </main>
      <footer>
        <div className="brand mini">
          <span className="brand-mark">
            <Gamepad2 />
          </span>
          <span>
            <b>getir</b>
            <strong>arcade</strong>
          </span>
        </div>
        <p>Oyna, eğlen, zirveye çık.</p>
        <span>© 2026 Getir Arcade</span>
      </footer>
      {notice && (
        <div className="toast">
          <Star size={18} fill="currentColor" />
          {notice}
        </div>
      )}
      {authOpen && (
        <AuthModal
          onClose={() => setAuthOpen(false)}
          onSuccess={() => setAuthOpen(false)}
        />
      )}{" "}
      {profileOpen && (
        <ProfileDrawer
          state={state}
          onClose={() => setProfileOpen(false)}
          onAuth={() => {
            setProfileOpen(false);
            setAuthOpen(true);
          }}
        />
      )}
    </div>
  );
}
createRoot(document.getElementById("root")).render(<App />);
