import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

// ─────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────
const POLL_MS = 8_000;
const SEVERITY_STYLE = {
  Critical: "text-red-500 bg-red-500/10",
  High:     "text-orange-400 bg-orange-400/10",
  Medium:   "text-amber-500 bg-amber-500/10",
  Low:      "text-emerald-500 bg-emerald-500/10",
};
const METHOD_STYLE = {
  GET:    "bg-emerald-500/10 text-emerald-600",
  POST:   "bg-blue-500/10 text-blue-600",
  PUT:    "bg-amber-500/10 text-amber-600",
  DELETE: "bg-red-500/10 text-red-500",
};
const ATTACK_PATHS = [
  "/monitoring/summary/", "/auth/token/", "/users/me/",
  "/anomalies/results/", "/alerts/", "/hacker-exploit/",
  "/monitoring/logs/", "/monitoring/events/", "/health/",
];

// ─────────────────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────────────────
export default function Dashboard() {
  const { profile, roles, logout, tokenParsed } = useAuth();

  const [summary, setSummary]   = useState(null);
  const [logs, setLogs]         = useState([]);
  const [events, setEvents]     = useState([]);
  const [offline, setOffline]   = useState(false);
  const [lastPoll, setLastPoll] = useState(null);
  const [generating, setGenerating] = useState(false);
  const pollRef = useRef(null);

  const username    = profile?.firstName || tokenParsed?.preferred_username || "Admin User";
  const email       = profile?.email || tokenParsed?.email || "—";
  const displayRole = roles.length > 0 ? roles[0] : "Security Admin";

  // ── Central data fetcher — uses native fetch as primary, axios as fallback ──
  const fetchDashboardData = useCallback(async () => {
    try {
      const [sumRes, logRes, evtRes] = await Promise.allSettled([
        fetch("/api/monitoring/summary/").then((r) => r.ok ? r.json() : Promise.reject(r.status)),
        fetch("/api/monitoring/logs/?limit=20").then((r) => r.ok ? r.json() : Promise.reject(r.status)),
        fetch("/api/monitoring/events/?limit=8").then((r) => r.ok ? r.json() : Promise.reject(r.status)),
      ]);

      if (sumRes.status === "fulfilled") {
        setSummary(sumRes.value);
        setOffline(false);
      } else {
        setOffline(true);
      }

      if (logRes.status === "fulfilled") {
        const d = logRes.value;
        setLogs((Array.isArray(d) ? d : d?.results || []).slice(0, 20));
      }

      if (evtRes.status === "fulfilled") {
        const d = evtRes.value;
        setEvents((Array.isArray(d) ? d : d?.results || []).slice(0, 8));
      }

      setLastPoll(new Date());
    } catch {
      setOffline(true);
    }
  }, []);

  // ── Polling lifecycle ──
  useEffect(() => {
    fetchDashboardData();
    pollRef.current = setInterval(fetchDashboardData, POLL_MS);
    return () => clearInterval(pollRef.current);
  }, [fetchDashboardData]);

  // ── Generate SOC Activity ──
  async function generateActivity() {
    setGenerating(true);
    const calls = [];
    for (let i = 0; i < 18; i++) {
      const path = ATTACK_PATHS[i % ATTACK_PATHS.length];
      const isPost = i % 3 === 0;
      calls.push(
        fetch(`/api${path}`, {
          method: isPost ? "POST" : "GET",
          headers: isPost ? { "Content-Type": "application/json" } : {},
          body: isPost ? JSON.stringify({ probe: "x".repeat(2000), vector: `synth-${i}` }) : undefined,
        }).catch(() => {})
      );
    }
    await Promise.all(calls);
    setTimeout(() => { fetchDashboardData(); setGenerating(false); }, 1500);
  }

  // ── Derived values ──
  const totalReqs    = summary?.total_requests ?? 0;
  const blocked      = summary?.blocked_attempts ?? 0;
  const activeUsers  = summary?.active_users ?? 0;
  const anomalyScore = summary?.anomaly_score ?? 0;
  const anomalies    = summary?.anomalies_detected ?? summary?.high_severity_events ?? 0;
  const isThreat     = anomalyScore > 0.7;

  const trafficChart      = buildTrafficChart(logs);
  const serviceDistChart  = buildServiceDist(logs);

  // ── Render ──
  return (
    <div className="flex h-screen font-sans">
      {/* ══════════ SIDEBAR ══════════ */}
      <aside className="flex w-[68px] shrink-0 flex-col items-center justify-between bg-forest-dark py-5">
        {/* Logo */}
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
          <Icon name="shield" className="h-5 w-5 text-sage-olive" />
        </div>

        {/* Nav */}
        <nav className="mt-8 flex flex-col items-center gap-1.5">
          <SideBtn icon="grid"     label="Dashboard" active />
          <SideBtn icon="activity" label="Activity" />
          <SideBtn icon="bell"     label="Alerts" />
          <SideBtn icon="shield"   label="Admin" />
        </nav>

        {/* Bottom: Generate + Logout */}
        <div className="mt-auto flex flex-col items-center gap-2">
          <button
            onClick={generateActivity}
            disabled={generating}
            title="Generate SOC Activity"
            className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl transition-all duration-200 ${
              generating
                ? "animate-pulse bg-sage-olive/25 text-sage-olive"
                : "text-sage-olive/40 hover:bg-sage-olive/15 hover:text-sage-olive"
            }`}
          >
            <Icon name="zap" className="h-5 w-5" />
          </button>
          <button
            onClick={logout}
            title="Logout"
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl text-white/25 transition-colors hover:bg-red-500/10 hover:text-red-400"
          >
            <Icon name="logout" className="h-5 w-5" />
          </button>
        </div>
      </aside>

      {/* ══════════ MAIN ══════════ */}
      <div className="flex flex-1 flex-col overflow-hidden">

        {/* ── Top Bar ── */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-light-stone bg-white px-7">
          <div className="flex items-center gap-3">
            <h1 className="text-[15px] font-black tracking-tight text-forest-dark">
              SecureAI MicroShield SOC
            </h1>
            {/* LIVE pill */}
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
              <span className="text-[9px] font-bold tracking-[0.15em] text-emerald-600 uppercase">Live</span>
            </span>
            {isThreat && (
              <span className="animate-pulse rounded-full bg-red-100 px-2.5 py-0.5 text-[9px] font-bold tracking-wider text-red-600 uppercase">
                Active Threat
              </span>
            )}
          </div>
          <div className="flex items-center gap-3.5">
            <span className="text-xs font-medium text-slate-grey">
              {username} <span className="text-slate-grey/30">|</span>{" "}
              <span className="text-forest-dark">{displayRole}</span>
            </span>
            <button onClick={logout} className="cursor-pointer rounded-md border border-light-stone px-3 py-1 text-[11px] font-semibold text-slate-grey transition hover:border-red-300 hover:text-red-500">
              Logout
            </button>
          </div>
        </header>

        {/* ── Content ── */}
        <main className="relative flex-1 overflow-y-auto bg-paper-white p-7">

          {/* SOC OFFLINE overlay */}
          {offline && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-paper-white/80 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100">
                  <Icon name="offline" className="h-7 w-7 text-red-400" />
                </div>
                <p className="text-lg font-black text-forest-dark">SOC OFFLINE</p>
                <p className="max-w-xs text-xs text-slate-grey">Backend unreachable. Retrying every {POLL_MS / 1000}s...</p>
              </div>
            </div>
          )}

          {/* ── KPI Row ── */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Kpi label="Total Requests"    value={totalReqs.toLocaleString()}   border="border-l-emerald-500" />
            <Kpi label="Blocked Attempts"  value={blocked.toLocaleString()}     border={blocked > 0 ? "border-l-red-400" : "border-l-emerald-500"} />
            <Kpi label="Active Users"      value={activeUsers.toLocaleString()} border="border-l-sage-olive" />
            <Kpi label="Anomaly Score"     value={anomalyScore.toFixed(2)}      border={isThreat ? "border-l-red-500" : "border-l-sage-olive"} highlight={isThreat} />
          </div>

          {/* ── Charts + Gauge ── */}
          <div className="mt-6 grid gap-5 lg:grid-cols-3">
            {/* Traffic Volume */}
            <Panel title="Traffic Volume">
              {trafficChart.length > 0 ? (
                <ResponsiveContainer width="100%" height={190}>
                  <LineChart data={trafficChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#D8D4D5" />
                    <XAxis dataKey="t" tick={{ fontSize: 9, fill: "#6E7271" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: "#6E7271" }} axisLine={false} tickLine={false} width={28} />
                    <Tooltip contentStyle={{ background: "#384D48", border: "none", borderRadius: 8, color: "#fff", fontSize: 11 }} itemStyle={{ color: "#ACAD94" }} />
                    <Line type="monotone" dataKey="n" name="Requests" stroke="#ACAD94" strokeWidth={2} dot={{ r: 2.5, fill: "#384D48", stroke: "#ACAD94", strokeWidth: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : <Empty />}
            </Panel>

            {/* Service Distribution */}
            <Panel title="Service Distribution">
              {serviceDistChart.length > 0 ? (
                <ResponsiveContainer width="100%" height={190}>
                  <BarChart data={serviceDistChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#D8D4D5" />
                    <XAxis dataKey="svc" tick={{ fontSize: 9, fill: "#6E7271" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: "#6E7271" }} axisLine={false} tickLine={false} width={28} />
                    <Tooltip contentStyle={{ background: "#384D48", border: "none", borderRadius: 8, color: "#fff", fontSize: 11 }} itemStyle={{ color: "#ACAD94" }} />
                    <Bar dataKey="n" name="Requests" fill="#ACAD94" radius={[4, 4, 0, 0]} barSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <Empty />}
            </Panel>

            {/* AI Gauge */}
            <div className={`rounded-2xl border bg-white p-5 transition-all duration-700 ${isThreat ? "border-red-300 shadow-[0_0_24px_rgba(239,68,68,0.12)]" : "border-light-stone"}`}>
              <h3 className="mb-3 text-[10px] font-semibold tracking-[0.15em] text-slate-grey uppercase">AI Anomaly Index</h3>
              <Gauge value={anomalyScore} />
              <div className="mt-4 space-y-1.5 text-[11px]">
                <Row label="System" value={summary?.system_status || "—"} />
                <Row label="Anomalies" value={anomalies} mono />
                <Row label="Polled" value={lastPoll ? lastPoll.toLocaleTimeString() : "—"} mono />
              </div>
            </div>
          </div>

          {/* ── Alerts + Identity ── */}
          <div className="mt-6 grid gap-5 lg:grid-cols-3">
            {/* Security Alerts */}
            <div className="rounded-2xl border border-light-stone bg-white p-5 lg:col-span-2">
              <h3 className="mb-4 text-[10px] font-semibold tracking-[0.15em] text-slate-grey uppercase">Security Alerts</h3>
              <div className="space-y-2">
                <AnimatePresence initial={false}>
                  {events.map((ev, i) => (
                    <motion.div
                      key={ev.id ?? i}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="flex items-start gap-2.5 rounded-xl border border-light-stone/60 bg-paper-white/50 px-3.5 py-2.5"
                    >
                      <span className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${SEVERITY_STYLE[ev.severity] || "text-slate-grey bg-slate-grey/10"}`}>
                        {ev.severity}
                      </span>
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium leading-snug text-forest-dark">{ev.description}</p>
                        <p className="mt-0.5 text-[10px] text-slate-grey/50">{ev.timestamp ? timeAgo(ev.timestamp) : "—"}</p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {events.length === 0 && <p className="py-5 text-center text-xs text-slate-grey/40">No alerts</p>}
              </div>
            </div>

            {/* Identity + Status */}
            <div className="flex flex-col gap-5">
              <div className="rounded-2xl border border-l-4 border-light-stone border-l-sage-olive bg-white p-5">
                <h3 className="mb-3 text-[10px] font-semibold tracking-[0.15em] text-slate-grey uppercase">Identity</h3>
                <p className="text-[10px] text-slate-grey/50">Email</p>
                <p className="text-[13px] font-semibold text-forest-dark break-all">{email}</p>
                <p className="mt-2.5 text-[10px] text-slate-grey/50">Roles</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {roles.length > 0 ? roles.map((r) => (
                    <span key={r} className="rounded-full bg-forest-dark/8 px-2 py-0.5 text-[10px] font-medium text-forest-dark">{r}</span>
                  )) : <span className="text-[10px] text-slate-grey/35">None</span>}
                </div>
              </div>
              <div className={`rounded-2xl border border-l-4 bg-white p-5 ${isThreat ? "border-light-stone border-l-red-500" : "border-light-stone border-l-emerald-500"}`}>
                <h3 className="mb-3 text-[10px] font-semibold tracking-[0.15em] text-slate-grey uppercase">System Status</h3>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${isThreat ? "bg-red-400" : "bg-emerald-400"}`} />
                    <span className={`relative inline-flex h-2 w-2 rounded-full ${isThreat ? "bg-red-500" : "bg-emerald-500"}`} />
                  </span>
                  <p className="text-base font-black text-forest-dark">{summary?.system_status || "—"}</p>
                </div>
                <p className="mt-2 text-[11px] text-slate-grey">
                  Blocked <span className="font-mono font-bold text-forest-dark">{blocked}</span> attempts
                </p>
              </div>
            </div>
          </div>

          {/* ── Live Audit Log ── */}
          <div className="mt-6 rounded-2xl border border-light-stone bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[10px] font-semibold tracking-[0.15em] text-slate-grey uppercase">Live Audit Log</h3>
              <span className="font-mono text-[9px] text-slate-grey/35">{lastPoll ? lastPoll.toLocaleTimeString() : ""}</span>
            </div>
            {logs.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-light-stone text-[9px] font-semibold tracking-[0.12em] text-slate-grey/45 uppercase">
                      <th className="pb-2.5 pr-3 pl-1">Time</th>
                      <th className="pb-2.5 pr-3">Method</th>
                      <th className="pb-2.5 pr-3">Endpoint</th>
                      <th className="pb-2.5 pr-3 text-right">Status</th>
                      <th className="pb-2.5 pr-3 text-right">Latency</th>
                      <th className="pb-2.5 text-right">AI</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence initial={false}>
                      {logs.map((log, i) => {
                        const code = log.status_code || 0;
                        const err = code >= 400;
                        const ai = err ? (code === 401 || code === 403 ? "Blocked" : "Flagged") : "Clean";
                        return (
                          <motion.tr
                            key={log.id ?? `l${i}`}
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2, delay: i * 0.02 }}
                            className="border-b border-light-stone/50 last:border-0"
                          >
                            <td className="py-2 pr-3 pl-1 font-mono text-[11px] text-slate-grey/55">
                              {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : "—"}
                            </td>
                            <td className="py-2 pr-3">
                              <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${METHOD_STYLE[log.method] || "bg-slate-grey/10 text-slate-grey"}`}>
                                {log.method || "—"}
                              </span>
                            </td>
                            <td className="max-w-[220px] truncate py-2 pr-3 text-[12px] font-medium text-forest-dark">
                              {log.endpoint || log.path || "—"}
                            </td>
                            <td className="py-2 pr-3 text-right font-mono text-[11px] font-semibold text-slate-grey">
                              {code || "—"}
                            </td>
                            <td className="py-2 pr-3 text-right font-mono text-[11px] text-slate-grey/45">
                              {log.response_time_ms != null ? `${Math.round(log.response_time_ms * 10) / 10}ms` : "—"}
                            </td>
                            <td className="py-2 text-right">
                              <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${err ? "bg-red-500/10 text-red-500" : "bg-emerald-500/10 text-emerald-600"}`}>
                                {ai}
                              </span>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            ) : <p className="py-6 text-center text-xs text-slate-grey/40">Awaiting data...</p>}
          </div>
        </main>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────

function Kpi({ label, value, border, highlight }) {
  return (
    <div className={`rounded-xl border border-l-4 border-light-stone bg-white p-4 ${border} ${highlight ? "ring-1 ring-red-200" : ""}`}>
      <p className="text-[9px] font-semibold tracking-[0.15em] text-slate-grey/50 uppercase">{label}</p>
      <p className="mt-1.5 font-mono text-2xl font-bold tracking-tight text-forest-dark">{value}</p>
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <div className="rounded-2xl border border-light-stone bg-white p-5">
      <h3 className="mb-4 text-[10px] font-semibold tracking-[0.15em] text-slate-grey uppercase">{title}</h3>
      {children}
    </div>
  );
}

function Empty() {
  return <p className="flex h-[190px] items-center justify-center text-xs text-slate-grey/35">Awaiting data...</p>;
}

function Row({ label, value, mono }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-grey/45">{label}</span>
      <span className={`font-semibold text-forest-dark ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}

function SideBtn({ icon, label, active }) {
  return (
    <button
      title={label}
      className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg transition-all duration-150 ${
        active ? "bg-sage-olive/20 text-sage-olive" : "text-white/30 hover:bg-white/5 hover:text-white/60"
      }`}
    >
      <Icon name={icon} className="h-[18px] w-[18px]" />
    </button>
  );
}

// ─────────────────────────────────────────────────────────
// GAUGE
// ─────────────────────────────────────────────────────────
function Gauge({ value }) {
  const v = Math.min(Math.max(value, 0), 1);
  const R = 52;
  const C = Math.PI * R;
  const offset = C * (1 - v);
  const color = v > 0.7 ? "#EF4444" : v > 0.4 ? "#F59E0B" : "#10B981";
  const tag   = v > 0.7 ? "CRITICAL" : v > 0.4 ? "ELEVATED" : "NORMAL";
  const tagCl = v > 0.7 ? "text-red-500" : v > 0.4 ? "text-amber-500" : "text-emerald-500";

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 120 72" className="w-full max-w-[180px]">
        <path d="M 8 66 A 52 52 0 0 1 112 66" fill="none" stroke="#D8D4D5" strokeWidth="7" strokeLinecap="round" />
        <path d="M 8 66 A 52 52 0 0 1 112 66" fill="none" stroke={color} strokeWidth="7" strokeLinecap="round"
          strokeDasharray={C} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.8s ease-out, stroke 0.4s ease" }} />
        <text x="60" y="56" textAnchor="middle" className="font-mono text-[20px] font-bold" fill="#384D48">
          {v.toFixed(2)}
        </text>
      </svg>
      <span className={`mt-0.5 text-[10px] font-bold tracking-[0.2em] uppercase ${tagCl}`}>{tag}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// ICONS
// ─────────────────────────────────────────────────────────
function Icon({ name, className }) {
  const d = {
    grid:     "M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z",
    shield:   "M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z",
    bell:     "M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z",
    zap:      "M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.381z",
    logout:   "M3 3a1 1 0 00-1 1v12a1 1 0 001 1h5a1 1 0 100-2H4V5h4a1 1 0 100-2H3zm11.707 4.293a1 1 0 010 1.414L13.414 10l1.293 1.293a1 1 0 01-1.414 1.414l-2-2a1 1 0 010-1.414l2-2a1 1 0 011.414 0zM17 10a1 1 0 00-1-1H9a1 1 0 100 2h7a1 1 0 001-1z",
    offline:  "M13.477 14.89A6 6 0 015.11 6.524M8.062 4.435A6 6 0 0114.89 13.477M3.5 3.5l13 13",
  };
  const stroke = name === "activity" || name === "offline";
  if (name === "activity") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12h4l3-9 4 18 3-9h4" />
      </svg>
    );
  }
  if (name === "offline") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
        {d[name].split("M").filter(Boolean).map((seg, i) => <path key={i} d={`M${seg}`} />)}
      </svg>
    );
  }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d={d[name]} clipRule="evenodd" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────
// DATA TRANSFORMS
// ─────────────────────────────────────────────────────────
function buildTrafficChart(logs) {
  if (!logs.length) return [];
  const buckets = {};
  for (const l of logs) {
    if (!l.timestamp) continue;
    const d = new Date(l.timestamp);
    const key = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    buckets[key] = (buckets[key] || 0) + 1;
  }
  return Object.entries(buckets)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([t, n]) => ({ t, n }));
}

function buildServiceDist(logs) {
  if (!logs.length) return [];
  const buckets = {};
  for (const l of logs) {
    const p = l.endpoint || l.path || "";
    const parts = p.split("/").filter(Boolean);
    const svc = parts[1] || parts[0] || "other";
    const label = svc.charAt(0).toUpperCase() + svc.slice(1);
    buckets[label] = (buckets[label] || 0) + 1;
  }
  return Object.entries(buckets)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([svc, n]) => ({ svc, n }));
}

function timeAgo(iso) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
