"use client";
// app/admin/health/page.tsx
// Webmaster only. Shows RUM analysis + raw reports + user-triggered bug reports.

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useHealth } from "@/context/HealthContext";
import {
  LuActivity,
  LuMonitor,
  LuSmartphone,
  LuTablet,
  LuWifi,
  LuTriangleAlert,
  LuBug,
  LuLoader,
  LuChevronDown,
  LuImage,
  LuRefreshCcw,
  LuClock,
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import Image from "next/image";

type Tab = "overview" | "browsers" | "pages" | "errors" | "bugreports";

export default function HealthDashboardPage() {
  const { token } = useAuth();
  const {
    analysis,
    rawReports,
    rawPagination,
    loadingAnalysis,
    loadingRaw,
    loadHealthAnalysis,
    loadRawReports,
  } = useHealth();

  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [days, setDays] = useState(30);
  const [bugPage, setBugPage] = useState(1);
  const [viewScreenshot, setViewScreenshot] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    loadHealthAnalysis(token, days);
  }, [token, days]);

  useEffect(() => {
    if (!token || activeTab !== "bugreports") return;
    loadRawReports(token, {
      days,
      pageNum: bugPage,
      limit: 20,
      hasErrors: false,
    });
  }, [token, activeTab, days, bugPage]);

  // Separate fetch for user-triggered bug reports — we filter client-side
  // since the API doesn't have a triggeredByUser filter yet
  const bugReports = rawReports.filter(
    (r) => (r as never as { triggeredByUser?: boolean }).triggeredByUser,
  );

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "overview", label: "Overview", icon: LuActivity },
    { id: "browsers", label: "Browsers", icon: LuMonitor },
    { id: "pages", label: "Pages", icon: LuWifi },
    { id: "errors", label: "JS Errors", icon: LuTriangleAlert },
    { id: "bugreports", label: "Bug Reports", icon: LuBug },
  ];

  const lcpColor = (rating: string | null | undefined) =>
    rating === "good"
      ? "text-emerald-600"
      : rating === "needs-improvement"
        ? "text-amber-600"
        : "text-rose-600";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.7 }}
      className="max-w-[1600px] w-full mt-20 p-5 mx-auto space-y-8"
    >
      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-foreground flex items-center justify-center shadow-xl shadow-foreground/20">
            <LuActivity className="w-7 h-7 text-background" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-foreground tracking-tighter uppercase">
              Platform Health
            </h1>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">
              Real User Monitoring —{" "}
              {analysis?.totalReports.toLocaleString() ?? "…"} reports
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Days selector */}
          <select
            value={days}
            onChange={(e) => setDays(parseInt(e.target.value))}
            className="bg-muted border border-border rounded-2xl px-4 py-3 text-[10px] font-black uppercase tracking-widest outline-none focus:border-primary transition-all cursor-pointer"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <button
            onClick={() => token && loadHealthAnalysis(token, days)}
            className="flex items-center gap-2 px-6 py-3 bg-foreground text-background rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-foreground transition-all cursor-pointer"
          >
            <LuRefreshCcw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 bg-muted p-1.5 rounded-2xl border border-border overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all cursor-pointer",
                activeTab === tab.id
                  ? "bg-background text-foreground shadow-md border border-border"
                  : "text-muted-foreground hover:text-slate-600",
              )}
            >
              <Icon className="w-3.5 h-3.5" /> {tab.label}
              {tab.id === "bugreports" && bugReports.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-rose-500 text-background rounded-full text-[8px] font-black">
                  {bugReports.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {loadingAnalysis && !analysis ? (
        <div className="flex items-center justify-center py-20">
          <LuLoader className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : (
        <>
          {/* ── Overview tab ── */}
          {activeTab === "overview" && analysis && (
            <div className="space-y-6">
              {/* Summary stats */}
              <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                {[
                  {
                    label: "Total Reports",
                    value: analysis.totalReports.toLocaleString(),
                    color: "text-foreground",
                  },
                  {
                    label: "Browsers Tracked",
                    value: String(analysis.browsers.length),
                    color: "text-blue-600",
                  },
                  {
                    label: "Slowest Page",
                    value: analysis.slowestPages[0]?.page ?? "—",
                    color: "text-amber-600",
                  },
                  {
                    label: "Top JS Error",
                    value:
                      analysis.topJsErrors[0]?.message?.slice(0, 30) ?? "None",
                    color: "text-rose-600",
                  },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="p-6 bg-background border-2 border-border rounded-[2rem]"
                  >
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-2">
                      {s.label}
                    </p>
                    <p
                      className={cn(
                        "text-lg font-black tracking-tight truncate",
                        s.color,
                      )}
                    >
                      {s.value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Device breakdown */}
              <div className="bg-background border-2 border-border rounded-[2.5rem] p-8">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-6">
                  Device Breakdown
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {analysis.devices.map((d) => {
                    const Icon =
                      d.device === "mobile"
                        ? LuSmartphone
                        : d.device === "tablet"
                          ? LuTablet
                          : LuMonitor;
                    return (
                      <div
                        key={d.device}
                        className="flex items-center gap-4 p-4 bg-muted rounded-2xl"
                      >
                        <div className="w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center">
                          <Icon className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-[11px] font-black text-foreground uppercase">
                            {d.device}
                          </p>
                          <p className="text-[9px] font-bold text-muted-foreground">
                            {d.visits} visits
                          </p>
                          {d.avgLcpMs && (
                            <p className="text-[9px] font-bold text-muted-foreground">
                              LCP: {Math.round(d.avgLcpMs)}ms
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Network breakdown */}
              <div className="bg-background border-2 border-border rounded-[2.5rem] p-8">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-6">
                  Network Types
                </p>
                <div className="space-y-3">
                  {analysis.network.map((n) => {
                    const maxVisits = Math.max(
                      ...analysis.network.map((x) => x.visits),
                    );
                    const pct = Math.round((n.visits / maxVisits) * 100);
                    return (
                      <div key={n.type} className="flex items-center gap-4">
                        <span className="w-12 text-[10px] font-black text-muted-foreground uppercase">
                          {n.type}
                        </span>
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 1 }}
                            className="h-full bg-primary rounded-full"
                          />
                        </div>
                        <span className="text-[10px] font-black text-foreground w-16 text-right">
                          {n.visits} visits
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── Browsers tab ── */}
          {activeTab === "browsers" && analysis && (
            <div className="bg-background border-2 border-border rounded-[2.5rem] overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-muted/50 border-b border-border">
                      {[
                        "#",
                        "Browser",
                        "Visits",
                        "Avg LCP",
                        "LCP Rating",
                        "Error Rate",
                      ].map((h, i) => (
                        <th
                          key={h}
                          className={cn(
                            "px-6 py-5 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]",
                            i === 0 && "w-12",
                          )}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {analysis.browserRanking.map((b) => (
                      <tr
                        key={b.browser}
                        className="group hover:bg-muted/50 transition-all"
                      >
                        <td className="px-6 py-4">
                          <span className="text-[10px] font-black text-muted-foreground">
                            #{b.rank}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-black text-foreground">
                            {b.browser}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[11px] font-bold text-foreground">
                            {b.visits.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={cn(
                              "text-[11px] font-black",
                              lcpColor(b.lcpRating),
                            )}
                          >
                            {b.avgLcpMs ? `${Math.round(b.avgLcpMs)}ms` : "—"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={cn(
                              "px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest",
                              b.lcpRating === "good"
                                ? "bg-emerald-50 text-emerald-600"
                                : b.lcpRating === "needs-improvement"
                                  ? "bg-amber-50 text-amber-600"
                                  : "bg-rose-50 text-rose-600",
                            )}
                          >
                            {b.lcpRating ?? "unknown"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={cn(
                              "text-[11px] font-bold",
                              b.errorRatePct > 5
                                ? "text-rose-600"
                                : "text-muted-foreground",
                            )}
                          >
                            {b.errorRatePct.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Pages tab ── */}
          {activeTab === "pages" && analysis && (
            <div className="space-y-6">
              <SectionTable
                title="Slowest Pages"
                rows={analysis.slowestPages.map((p) => ({
                  label: p.page,
                  a: p.avgLcpMs ? `${Math.round(p.avgLcpMs)}ms LCP` : "—",
                  b: `${p.visits} visits`,
                  highlight: p.rating === "poor",
                }))}
              />
              <SectionTable
                title="Most Error-Prone Pages"
                rows={analysis.errorPages.map((p) => ({
                  label: p.page,
                  a: `${(p.errorRatePct ?? 0).toFixed(1)}% error rate`,
                  b: `${p.visits} visits`,
                  highlight: (p.errorRatePct ?? 0) > 10,
                }))}
              />
            </div>
          )}

          {/* ── JS Errors tab ── */}
          {activeTab === "errors" && analysis && (
            <div className="bg-background border-2 border-border rounded-[2.5rem] overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="bg-muted/50 border-b border-border">
                      {["Error Message", "Browser", "Count"].map((h, i) => (
                        <th
                          key={h}
                          className={cn(
                            "px-6 py-5 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]",
                            i === 2 && "text-right",
                          )}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {analysis.topJsErrors.map((e, i) => (
                      <tr
                        key={i}
                        className="group hover:bg-muted/50 transition-all"
                      >
                        <td className="px-6 py-4 max-w-[400px]">
                          <p className="text-[11px] font-mono font-bold text-rose-600 truncate">
                            {e.message}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[10px] font-bold text-muted-foreground">
                            {e.browser}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-sm font-black text-foreground">
                            {e.count}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Bug Reports tab ── */}
          {activeTab === "bugreports" && (
            <div className="space-y-4">
              {loadingRaw ? (
                <div className="flex items-center justify-center py-20">
                  <LuLoader className="w-8 h-8 text-primary animate-spin" />
                </div>
              ) : bugReports.length === 0 ? (
                <div className="py-20 text-center">
                  <LuBug className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                  <p className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">
                    No user-triggered bug reports yet
                  </p>
                </div>
              ) : (
                bugReports.map((r) => {
                  const report = r as typeof r & {
                    triggeredByUser?: boolean;
                    screenshot?: string;
                    consoleLog?: string[];
                    networkLog?: {
                      url: string;
                      method: string;
                      status: number | null;
                      ms: number;
                    }[];
                    debugDuration?: number;
                  };
                  return (
                    <div
                      key={r.id}
                      className="bg-background border-2 border-border rounded-[2rem] overflow-hidden"
                    >
                      {/* Report header */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-rose-50 border-b border-rose-100">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-rose-500 flex items-center justify-center">
                            <LuBug className="w-5 h-5 text-background" />
                          </div>
                          <div>
                            <p className="text-[11px] font-black text-rose-900 uppercase tracking-widest">
                              {r.page}
                            </p>
                            <p className="text-[9px] font-bold text-rose-600 uppercase tracking-widest mt-0.5">
                              {r.browser.name} {r.browser.version} · {r.os.name}{" "}
                              · {r.device}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-rose-600">
                          <LuClock className="w-3.5 h-3.5" />
                          <span className="text-[9px] font-bold uppercase tracking-widest">
                            {new Date(r.reportedAt).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div className="p-6 space-y-4">
                        {/* Screenshot */}
                        {report.screenshot && (
                          <div>
                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-1.5">
                              <LuImage className="w-3 h-3" /> Screenshot
                            </p>
                            <div
                              className="relative rounded-2xl overflow-hidden border border-border cursor-pointer"
                              onClick={() =>
                                setViewScreenshot(report.screenshot ?? null)
                              }
                            >
                              <Image
                                height={300}
                                width={500}
                                src={report.screenshot}
                                alt="Bug screenshot"
                                className="w-full max-h-48 object-cover object-top opacity-80 hover:opacity-100 transition-opacity"
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-foreground/20 opacity-0 hover:opacity-100 transition-opacity">
                                <p className="text-background text-[10px] font-black uppercase tracking-widest">
                                  View Full
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Console log */}
                        {report.consoleLog && report.consoleLog.length > 0 && (
                          <details className="group">
                            <summary className="text-[9px] font-black text-muted-foreground uppercase tracking-widest cursor-pointer flex items-center gap-1.5 list-none">
                              <LuChevronDown className="w-3 h-3 group-open:rotate-180 transition-transform" />
                              Console Log ({report.consoleLog.length} entries)
                            </summary>
                            <div className="mt-2 bg-foreground rounded-2xl p-4 max-h-40 overflow-y-auto">
                              {report.consoleLog.map((line, i) => (
                                <p
                                  key={i}
                                  className={cn(
                                    "text-[9px] font-mono leading-relaxed",
                                    line.startsWith("[ERR]")
                                      ? "text-rose-400"
                                      : line.startsWith("[WARN]")
                                        ? "text-amber-400"
                                        : "text-slate-400",
                                  )}
                                >
                                  {line}
                                </p>
                              ))}
                            </div>
                          </details>
                        )}

                        {/* Network log */}
                        {report.networkLog && report.networkLog.length > 0 && (
                          <details className="group">
                            <summary className="text-[9px] font-black text-muted-foreground uppercase tracking-widest cursor-pointer flex items-center gap-1.5 list-none">
                              <LuChevronDown className="w-3 h-3 group-open:rotate-180 transition-transform" />
                              Network Log ({report.networkLog.length} requests)
                            </summary>
                            <div className="mt-2 bg-foreground rounded-2xl p-4 max-h-40 overflow-y-auto space-y-1">
                              {report.networkLog.map((n, i) => (
                                <div
                                  key={i}
                                  className="flex items-center gap-3"
                                >
                                  <span
                                    className={cn(
                                      "text-[8px] font-black w-6",
                                      n.method === "GET"
                                        ? "text-blue-400"
                                        : "text-amber-400",
                                    )}
                                  >
                                    {n.method.slice(0, 4)}
                                  </span>
                                  <span
                                    className={cn(
                                      "text-[8px] font-black w-8",
                                      !n.status || n.status >= 400
                                        ? "text-rose-400"
                                        : "text-emerald-400",
                                    )}
                                  >
                                    {n.status ?? "ERR"}
                                  </span>
                                  <span className="text-[9px] font-mono text-slate-400 truncate flex-1">
                                    {n.url}
                                  </span>
                                  <span className="text-[8px] text-slate-500 shrink-0">
                                    {n.ms}ms
                                  </span>
                                </div>
                              ))}
                            </div>
                          </details>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </>
      )}

      {/* Screenshot lightbox */}
      <AnimatePresence>
        {viewScreenshot && (
          <div
            className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-foreground/90 backdrop-blur-md"
            onClick={() => setViewScreenshot(null)}
          >
            <motion.img
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              src={viewScreenshot}
              alt="Full screenshot"
              className="max-w-full max-h-[90vh] rounded-2xl shadow-2xl object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Helper component ─────────────────────────────────────────────────────────
const SectionTable: React.FC<{
  title: string;
  rows: { label: string; a: string; b: string; highlight?: boolean }[];
}> = ({ title, rows }) => (
  <div className="bg-background border-2 border-border rounded-[2.5rem] overflow-hidden shadow-sm">
    <div className="px-8 py-5 border-b border-border">
      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
        {title}
      </p>
    </div>
    <div className="divide-y divide-slate-50">
      {rows.map((r, i) => (
        <div
          key={i}
          className={cn(
            "flex items-center justify-between px-8 py-4 hover:bg-muted/50 transition-all",
            r.highlight && "bg-rose-50/50",
          )}
        >
          <span
            className={cn(
              "text-[11px] font-mono font-bold truncate max-w-[60%]",
              r.highlight ? "text-rose-600" : "text-foreground",
            )}
          >
            {r.label}
          </span>
          <div className="flex items-center gap-4">
            <span
              className={cn(
                "text-[10px] font-black uppercase",
                r.highlight ? "text-rose-500" : "text-amber-600",
              )}
            >
              {r.a}
            </span>
            <span className="text-[10px] font-bold text-muted-foreground">
              {r.b}
            </span>
          </div>
        </div>
      ))}
    </div>
  </div>
);
