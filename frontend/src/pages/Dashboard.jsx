import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const POLL_INTERVAL = 10_000;

// ── Sidebar nav items ──
const NAV_ITEMS = [
  { label: "Dashboard", icon: "grid", active: true },
];

function NavIcon({ name, className }) {
  const icons = {
    grid: <path d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />,
    activity: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12h4l3-9 4 18 3-9h4" />,
    bell: <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />,
    shield: <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />,
    settings: <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />,
    zap: <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.381z" clipRule="evenodd" />,
  };
  const isStroke = name === "activity";
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill={isStroke ? "none" : "currentColor"} stroke={isStroke ? "currentColor" : "none"}>
      {icons[name]}
    </svg>
  );
}

// ── Anomaly Gauge ──
function AnomalyGauge({ score }) {
  const pct = Math.min(Math.max(score, 0), 1);
  const radius = 54;
  const circumference = Math.PI * radius;
  const offset = circumference * (1 - pct);
  const isCritical = pct > 0.8;
  const isWarning = pct >= 0.5;
  const color = isCritical ? "#EF4444" : isWarning ? "#F59E0B" : "#10B981";
  const label = isCritical ? "CRITICAL" : isWarning ? "WARNING" : "NORMAL";
  const labelColor = isCritical ? "text-red-500" : isWarning ? "text-amber-500" : "text-emerald-500";

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 120 72" className="w-full max-w-[200px]">
        {/* Background arc */}
        <path
          d="M 6 66 A 54 54 0 0 1 114 66"
          fill="none"
          stroke="#E2E2E2"
          strokeWidth="8"
          strokeLinecap="round"
        />
        {/* Value arc */}
        <path
          d="M 6 66 A 54 54 0 0 1 114 66"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s ease-out, stroke 0.5s ease" }}
        />
        <text x="60" y="58" textAnchor="middle" className="fill-forest-dark font-mono text-[22px] font-bold">
          {pct.toFixed(2)}
        </text>
      </svg>
      <span className={`mt-1 text-xs font-bold tracking-widest uppercase ${labelColor}`}>
        {label}
      </span>
    </div>
  );
}

function Dashboard() {
  const { profile, roles, logout, tokenParsed } = useAuth();
  const [summary, setSummary] = useState(null);
  const [logs, setLogs] = useState([]);
  const [events, setEvents] = useState([]);
  const [error, setError] = useState(null);
  const [attacking, setAttacking] = useState(false);
  const [lastPoll, setLastPoll] = useState(null);
  const prevLogIds = useRef(new Set());

  const username = profile?.firstName || tokenParsed?.preferred_username || "Admin User";
  const email = profile?.email || tokenParsed?.email || "—";
  const displayRole = roles.length > 0 ? roles[0] : "Security Admin";

  // ── Data fetcher ──
  const fetchData = useCallback(() => {
    api.get("/monitoring/summary/")
      .then((res) => { setSummary(res.data); setError(null); })
      .catch((err) => setError(err.message));

    api.get("/monitoring/logs/", { params: { limit: 15 } })
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
        setLogs(data.slice(0, 15));
      });

    api.get("/monitoring/events/", { params: { limit: 6 } })
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
        setEvents(data.slice(0, 6));
      });

    setLastPoll(new Date());
  }, []);

  // ── Initial + polling ──
  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [fetchData]);

  // ── Track new log IDs for animation ──
  useEffect(() => {
    const currentIds = new Set(logs.map((l) => l.id).filter(Boolean));
    prevLogIds.current = currentIds;
  }, [logs]);

  // ── Synthetic attack ──
  async function triggerAttack() {
    setAttacking(true);
    const payload = { exploit: "x".repeat(5000), vector: "synthetic-pentest", timestamp: Date.now() };
    const promises = Array.from({ length: 10 }, () =>
      api.post("/hacker-exploit/", payload).catch(() => {})
    );
    await Promise.all(promises);
    // Let the backend process, then refresh
    setTimeout(() => {
      fetchData();
      setAttacking(false);
    }, 2000);
  }

  const totalRequests = summary?.total_requests ?? 0;
  const failedLogins = summary?.blocked_attempts ?? 0;
  const activeUsers = summary?.active_users ?? 0;
  const anomalies = summary?.high_severity_events ?? 0;
  const anomalyScore = summary?.anomaly_score ?? summary?.system_anomaly_score ?? 0;
  const isCritical = anomalyScore > 0.8;

  const requestChart = buildRequestChart(logs);
  const serviceErrors = buildServiceErrors(logs);

  const severityColor = {
    Critical: "text-red-500 bg-red-500/10",
    High: "text-orange-400 bg-orange-400/10",
    Medium: "text-amber-400 bg-amber-400/10",
    Low: "text-emerald-400 bg-emerald-400/10",
  };

  return (
    <div className={`animate-fade-in flex h-screen font-sans transition-colors duration-1000 ${isCritical ? "bg-red-950/5" : ""}`}>
      {/* ── Sidebar ── */}
      <aside className="flex w-[72px] flex-col items-center bg-forest-dark py-6">
        <div className="mb-8 flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
          <NavIcon name="shield" className="h-5 w-5 text-sage-olive" />
        </div>

        <nav className="flex flex-1 flex-col items-center gap-2">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.label}
              title={item.label}
              className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl transition-all duration-200 ${
                item.active ? "bg-sage-olive/20 text-sage-olive" : "text-white/40 hover:bg-white/5 hover:text-white/70"
              }`}
            >
              <NavIcon name={item.icon} className="h-5 w-5" />
            </button>
          ))}

          {/* Divider */}
          <div className="my-3 h-px w-6 bg-white/10" />

          {/* Simulation trigger */}
          <button
            onClick={triggerAttack}
            disabled={attacking}
            title="Trigger Synthetic Attack"
            className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl transition-all duration-200 ${
              attacking
                ? "animate-pulse bg-red-500/20 text-red-400"
                : "text-red-400/50 hover:bg-red-500/10 hover:text-red-400"
            }`}
          >
            <NavIcon name="zap" className="h-5 w-5" />
          </button>
        </nav>

        <button
          onClick={logout}
          title="Logout"
          className="mt-auto flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl text-white/30 transition-colors duration-200 hover:bg-red-500/10 hover:text-red-400"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h5a1 1 0 100-2H4V5h4a1 1 0 100-2H3zm11.707 4.293a1 1 0 010 1.414L13.414 10l1.293 1.293a1 1 0 01-1.414 1.414l-2-2a1 1 0 010-1.414l2-2a1 1 0 011.414 0zM17 10a1 1 0 00-1-1H9a1 1 0 100 2h7a1 1 0 001-1z" clipRule="evenodd" />
          </svg>
        </button>
      </aside>

      {/* ── Main ── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-grey/15 bg-white px-8">
          <div className="flex items-center gap-4">
            <h1 className="text-base font-black tracking-tight text-forest-dark">
              Security Operations Center
            </h1>
            {/* LIVE indicator */}
            <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span className="text-[10px] font-bold tracking-widest text-emerald-600 uppercase">Live</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {error && (
              <span className="rounded-full bg-red-50 px-3 py-1 text-[11px] font-semibold text-red-500">
                API Unreachable
              </span>
            )}
            {isCritical && (
              <span className="animate-pulse rounded-full bg-red-100 px-3 py-1 text-[11px] font-bold text-red-600">
                CRITICAL ALERT
              </span>
            )}
            <p className="text-sm font-medium text-slate-grey">
              {username}
              <span className="mx-1.5 text-slate-grey/30">|</span>
              <span className="text-forest-dark">{displayRole}</span>
            </p>
            <button
              onClick={logout}
              className="cursor-pointer rounded-lg border border-slate-grey/20 px-3.5 py-1.5 text-xs font-semibold text-slate-grey transition-all duration-200 hover:border-red-400/40 hover:bg-red-50 hover:text-red-500"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto bg-paper-white p-8">
          {/* ── KPI Row ── */}
          <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
            <KpiCard label="Total Requests" value={totalRequests.toLocaleString()} borderColor="border-l-emerald-500" accent="text-forest-dark" />
            <KpiCard label="Failed Logins" value={failedLogins.toLocaleString()} borderColor={failedLogins > 0 ? "border-l-red-500" : "border-l-emerald-500"} accent="text-red-500" />
            <KpiCard label="Active Users" value={activeUsers.toLocaleString()} borderColor="border-l-sage-olive" accent="text-emerald-600" />
            <KpiCard label="Anomalies Detected" value={anomalies.toLocaleString()} borderColor={anomalies > 0 ? "border-l-amber-500" : "border-l-emerald-500"} accent="text-amber-600" />
          </div>

          {/* ── Charts + Gauge Row ── */}
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {/* Requests Over Time */}
            <div className="rounded-2xl border border-slate-grey/10 bg-white p-6">
              <h3 className="mb-5 text-xs font-semibold tracking-widest text-slate-grey uppercase">Requests Over Time</h3>
              {requestChart.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={requestChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E2E2" />
                    <XAxis dataKey="time" tick={{ fontSize: 10, fill: "#6E7271" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#6E7271" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: "#384D48", border: "none", borderRadius: 8, color: "#fff", fontSize: 12 }} itemStyle={{ color: "#ACAD94" }} />
                    <Line type="monotone" dataKey="requests" stroke="#ACAD94" strokeWidth={2.5} dot={{ r: 3, fill: "#384D48", stroke: "#ACAD94", strokeWidth: 2 }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="flex h-[200px] items-center justify-center text-sm text-slate-grey/40">No data</p>
              )}
            </div>

            {/* Service Errors */}
            <div className="rounded-2xl border border-slate-grey/10 bg-white p-6">
              <h3 className="mb-5 text-xs font-semibold tracking-widest text-slate-grey uppercase">Service Errors</h3>
              {serviceErrors.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={serviceErrors}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E2E2" />
                    <XAxis dataKey="service" tick={{ fontSize: 10, fill: "#6E7271" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#6E7271" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: "#384D48", border: "none", borderRadius: 8, color: "#fff", fontSize: 12 }} itemStyle={{ color: "#ACAD94" }} />
                    <Bar dataKey="errors" fill="#ACAD94" radius={[6, 6, 0, 0]} barSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="flex h-[200px] items-center justify-center text-sm text-slate-grey/40">No errors</p>
              )}
            </div>

            {/* Anomaly Gauge */}
            <div className={`rounded-2xl border bg-white p-6 transition-all duration-700 ${isCritical ? "border-red-300 shadow-[0_0_30px_rgba(239,68,68,0.15)]" : "border-slate-grey/10"}`}>
              <h3 className="mb-4 text-xs font-semibold tracking-widest text-slate-grey uppercase">AI Anomaly Score</h3>
              <AnomalyGauge score={anomalyScore} />
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-grey/50">System Status</span>
                  <span className="font-semibold text-forest-dark">{summary?.system_status || "—"}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-grey/50">High Severity</span>
                  <span className="font-mono font-semibold text-forest-dark">{anomalies}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-grey/50">Last Polled</span>
                  <span className="font-mono text-slate-grey/70">{lastPoll ? lastPoll.toLocaleTimeString() : "—"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Alerts + Identity ── */}
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {/* Recent Alerts */}
            <div className="rounded-2xl border border-slate-grey/10 bg-white p-6 lg:col-span-2">
              <h3 className="mb-5 text-xs font-semibold tracking-widest text-slate-grey uppercase">Recent Alerts</h3>
              <div className="space-y-2.5">
                <AnimatePresence initial={false}>
                  {events.map((ev, i) => (
                    <motion.div
                      key={ev.id ?? i}
                      initial={{ opacity: 0, y: -12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="flex items-start gap-3 rounded-xl border border-slate-grey/8 bg-paper-white/60 px-4 py-3"
                    >
                      <span className={`mt-0.5 shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${severityColor[ev.severity] || "text-slate-grey bg-slate-grey/10"}`}>
                        {ev.severity}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-forest-dark">{ev.description}</p>
                        <p className="mt-0.5 text-xs text-slate-grey/60">{ev.timestamp ? timeAgo(ev.timestamp) : "—"}</p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {events.length === 0 && <p className="py-4 text-sm text-slate-grey/50">No recent alerts</p>}
              </div>
            </div>

            {/* Identity + System */}
            <div className="flex flex-col gap-6">
              <div className="rounded-2xl border border-l-4 border-slate-grey/10 border-l-sage-olive bg-white p-6">
                <h3 className="mb-4 text-xs font-semibold tracking-widest text-slate-grey uppercase">Identity</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-[11px] font-medium text-slate-grey/50">Email</p>
                    <p className="text-sm font-semibold text-forest-dark break-all">{email}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-slate-grey/50">Roles</p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {roles.length > 0 ? roles.map((r) => (
                        <span key={r} className="rounded-full bg-forest-dark/10 px-2.5 py-0.5 text-xs font-medium text-forest-dark">{r}</span>
                      )) : (
                        <span className="text-xs text-slate-grey/40">No roles</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className={`rounded-2xl border border-l-4 bg-white p-6 ${isCritical ? "border-l-red-500 border-slate-grey/10" : "border-l-emerald-500 border-slate-grey/10"}`}>
                <h3 className="mb-4 text-xs font-semibold tracking-widest text-slate-grey uppercase">System Status</h3>
                <div className="flex items-center gap-2.5">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${isCritical ? "bg-red-400" : summary?.system_status === "Warning" ? "bg-amber-400" : "bg-emerald-400"}`} />
                    <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${isCritical ? "bg-red-500" : summary?.system_status === "Warning" ? "bg-amber-500" : "bg-emerald-500"}`} />
                  </span>
                  <p className="text-lg font-black text-forest-dark">{summary?.system_status || "—"}</p>
                </div>
                <div className="mt-3 flex items-center gap-2 rounded-lg bg-paper-white px-3 py-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-sage-olive" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.828a1 1 0 101.415-1.414L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  <p className="text-xs font-medium text-slate-grey">
                    Blocked: <span className="font-mono font-bold text-forest-dark">{failedLogins}</span> attempts
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Audit Log Table ── */}
          <div className="mt-8 rounded-2xl border border-slate-grey/10 bg-white p-6">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-xs font-semibold tracking-widest text-slate-grey uppercase">API Request Log</h3>
              <span className="font-mono text-[10px] text-slate-grey/40">
                {lastPoll ? `Polled ${lastPoll.toLocaleTimeString()}` : ""}
              </span>
            </div>

            {logs.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-grey/10 text-[10px] font-semibold tracking-widest text-slate-grey/50 uppercase">
                      <th className="pb-3 pr-4">Timestamp</th>
                      <th className="pb-3 pr-4">Method</th>
                      <th className="pb-3 pr-4">Endpoint</th>
                      <th className="pb-3 pr-4 text-right">Status</th>
                      <th className="pb-3 pr-4 text-right">Latency</th>
                      <th className="pb-3 text-right">AI Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence initial={false}>
                      {logs.map((log, i) => {
                        const statusCode = log.status_code || log.status || 0;
                        const isError = statusCode >= 400;
                        const aiLabel = isError ? (statusCode === 401 || statusCode === 403 ? "Blocked" : "Flagged") : "Clean";
                        const aiColor = isError ? "text-red-500 bg-red-500/10" : "text-emerald-600 bg-emerald-500/10";

                        return (
                          <motion.tr
                            key={log.id ?? `log-${i}`}
                            initial={{ opacity: 0, x: -16 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.25, delay: i * 0.03 }}
                            className="border-b border-slate-grey/5 last:border-0"
                          >
                            <td className="py-2.5 pr-4 font-mono text-xs text-slate-grey/60">
                              {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : "—"}
                            </td>
                            <td className="py-2.5 pr-4">
                              <span className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                                log.method === "GET" ? "bg-emerald-500/10 text-emerald-600"
                                  : log.method === "POST" ? "bg-blue-500/10 text-blue-600"
                                  : log.method === "DELETE" ? "bg-red-500/10 text-red-500"
                                  : log.method === "PUT" ? "bg-amber-500/10 text-amber-600"
                                  : "bg-slate-grey/10 text-slate-grey"
                              }`}>
                                {log.method || "REQ"}
                              </span>
                            </td>
                            <td className="max-w-[240px] truncate py-2.5 pr-4 text-sm font-medium text-forest-dark">
                              {log.path || log.endpoint || log.url || "—"}
                            </td>
                            <td className="py-2.5 pr-4 text-right font-mono text-xs font-semibold text-slate-grey">
                              {statusCode || "—"}
                            </td>
                            <td className="py-2.5 pr-4 text-right font-mono text-xs text-slate-grey/50">
                              {log.response_time_ms !== undefined ? `${log.response_time_ms}ms` : "—"}
                            </td>
                            <td className="py-2.5 text-right">
                              <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${aiColor}`}>
                                {aiLabel}
                              </span>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="py-6 text-sm text-slate-grey/50">No recent API requests</p>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

// ── KPI Card with left border ──
function KpiCard({ label, value, borderColor, accent }) {
  return (
    <div className={`rounded-2xl border border-l-4 border-slate-grey/10 bg-white p-5 ${borderColor}`}>
      <p className="text-[10px] font-semibold tracking-widest text-slate-grey/50 uppercase">{label}</p>
      <p className={`mt-2 font-mono text-3xl font-bold tracking-tight ${accent}`}>{value}</p>
    </div>
  );
}

// ── Build charts from real data ──
function buildRequestChart(logs) {
  if (logs.length === 0) return [];
  const buckets = {};
  for (const log of logs) {
    const ts = log.timestamp ? new Date(log.timestamp) : null;
    const key = ts ? `${String(ts.getHours()).padStart(2, "0")}:${String(ts.getMinutes()).padStart(2, "0")}` : "?";
    buckets[key] = (buckets[key] || 0) + 1;
  }
  return Object.entries(buckets).map(([time, requests]) => ({ time, requests }));
}

function buildServiceErrors(logs) {
  if (logs.length === 0) return [];
  const errorLogs = logs.filter((l) => l.status_code >= 400);
  if (errorLogs.length === 0) return [];
  const buckets = {};
  for (const log of errorLogs) {
    const path = log.path || log.endpoint || log.url || "";
    const service = path.split("/").filter(Boolean)[1] || "Other";
    buckets[service.charAt(0).toUpperCase() + service.slice(1)] = (buckets[service.charAt(0).toUpperCase() + service.slice(1)] || 0) + 1;
  }
  return Object.entries(buckets).map(([service, errors]) => ({ service, errors }));
}

function timeAgo(isoString) {
  const seconds = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default Dashboard;
