import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import {
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { requestJson } from "../lib/api";
import useViewport from "../lib/useViewport";

const defaultDashboard = {
  summary_cards: [
    {
      title: "Total Portfolio Value",
      value: "$62,400",
      change: "+12.4%",
      tone: "#0f9f6e",
      detail: "Up $6,910 this quarter",
    },
    {
      title: "Total Gain/Loss",
      value: "+$8,240",
      change: "+15.2%",
      tone: "#0f9f6e",
      detail: "Best performer: NVDA",
    },
    {
      title: "Day's Gain/Loss",
      value: "+$420",
      change: "+0.68%",
      tone: "#2563eb",
      detail: "Markets closed higher",
    },
    {
      title: "Cash Available",
      value: "$6,240",
      change: "10%",
      tone: "#b45309",
      detail: "Ready for reallocation",
    },
  ],
  performance: [
    { month: "Apr", value: 42 },
    { month: "May", value: 48 },
    { month: "Jun", value: 46 },
    { month: "Jul", value: 55 },
    { month: "Aug", value: 58 },
    { month: "Sep", value: 64 },
    { month: "Oct", value: 61 },
    { month: "Nov", value: 70 },
    { month: "Dec", value: 76 },
    { month: "Jan", value: 82 },
    { month: "Feb", value: 88 },
    { month: "Mar", value: 94 },
  ],
  allocation: [
    { label: "Stocks", value: 45, color: "#2563eb" },
    { label: "Bonds", value: 25, color: "#10b981" },
    { label: "ETFs", value: 20, color: "#f59e0b" },
    { label: "Cash", value: 10, color: "#64748b" },
  ],
};

function Dashboard() {
  const { isTablet, isMobile } = useViewport();
  const [dashboardData, setDashboardData] = useState(null);
  const [aiInsight, setAiInsight] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    requestJson("/api/dashboard")
      .then((data) => {
        setDashboardData(data);
        setLoading(false);
      })
      .catch(() => {
        setDashboardData(defaultDashboard);
        setLoading(false);
      });
    requestJson("/api/ai/portfolio-summary", { method: "POST" })
      .then((data) => setAiInsight(data))
      .catch(() => {});
  }, []);

  if (loading) {
    return (
      <>
        <Navbar />
        <div style={{ ...styles.page, display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
          <div style={{ textAlign: "center", color: "#64748b", fontSize: "18px", fontWeight: "500" }}>
            <div style={{ width: "40px", height: "40px", border: "3px solid #e2e8f0", borderTopColor: "#3b82f6", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }}></div>
            <style>{"@keyframes spin { 100% { transform: rotate(360deg); } }"}</style>
            Loading dashboard data...
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />

      <div style={{ ...styles.page, ...(isMobile ? styles.pageMobile : {}) }}>
        <div style={{ ...styles.hero, ...(isMobile ? styles.heroMobile : {}) }}>
          <div>
            <span style={styles.badge}>Portfolio Overview</span>
            <h1 style={{ ...styles.heading, ...(isMobile ? styles.headingMobile : {}) }}>
              Portfolio Dashboard
            </h1>
            <p style={styles.subheading}>
              Track performance, spot allocation drift, and act on the
              strongest signals faster.
            </p>
          </div>

          <div style={{ ...styles.heroStat, ...(isMobile ? styles.heroStatMobile : {}) }}>
            <span style={styles.heroLabel}>Monthly growth</span>
            <strong style={styles.heroValue}>+8.7%</strong>
            <span style={styles.heroMeta}>Updated from your latest positions</span>
          </div>
        </div>

        <div style={styles.insightStrip}>
          <InsightChip label="Best allocation trend" value="Balanced equity mix" tone="#2563eb" />
          <InsightChip label="Available cash" value={dashboardData.summary_cards[3]?.value || "$0"} tone="#b45309" />
          <InsightChip label="Portfolio signal" value="Bullish momentum" tone="#16a34a" />
        </div>

        {aiInsight ? <AIInsight insight={aiInsight} /> : null}

        <div style={styles.cards}>
          {dashboardData.summary_cards.map((card, index) => (
            <Card key={card.title} {...card} index={index} />
          ))}
        </div>

        <div style={{ ...styles.grid, ...(isTablet ? styles.gridTablet : {}) }}>
          <section style={{ ...styles.panel, ...styles.performancePanel }}>
            <div style={styles.panelHeader}>
              <div>
                <p style={styles.panelEyebrow}>Performance</p>
                <h3 style={styles.panelTitle}>Portfolio momentum</h3>
              </div>
              <div style={styles.inlineStats}>
                <div>
                  <span style={styles.inlineLabel}>YTD</span>
                  <strong style={styles.inlineValue}>+18.9%</strong>
                </div>
                <div>
                  <span style={styles.inlineLabel}>Volatility</span>
                  <strong style={styles.inlineValue}>Low</strong>
                </div>
              </div>
            </div>

            <PerformanceChart data={dashboardData.performance} />

            <div style={styles.chartFooter}>
              <div style={styles.footerMetric}>
                <span style={styles.footerLabel}>Peak value</span>
                <strong style={styles.footerValue}>$64,120</strong>
              </div>
              <div style={styles.footerMetric}>
                <span style={styles.footerLabel}>Best month</span>
                <strong style={styles.footerValue}>March</strong>
              </div>
              <div style={styles.footerMetric}>
                <span style={styles.footerLabel}>Signal</span>
                <strong style={styles.footerValue}>Bullish trend</strong>
              </div>
            </div>
          </section>

          <section style={styles.panel}>
            <div style={styles.panelHeader}>
              <div>
                <p style={styles.panelEyebrow}>Allocation</p>
                <h3 style={styles.panelTitle}>Asset mix</h3>
              </div>
              <span style={styles.rebalanceTag}>Balanced</span>
            </div>

            <div style={styles.allocationTop}>
              <div style={styles.pieWrap}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dashboardData.allocation}
                      dataKey="value"
                      nameKey="label"
                      innerRadius={42}
                      outerRadius={66}
                      paddingAngle={3}
                      stroke="none"
                    >
                      {dashboardData.allocation.map((item) => (
                        <Cell key={item.label} fill={item.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [`${value}%`, "Allocation"]}
                      contentStyle={styles.tooltipCard}
                    />
                  </PieChart>
                </ResponsiveContainer>

                <div style={styles.donutCenter}>
                  <strong style={styles.donutValue}>90%</strong>
                  <span style={styles.donutLabel}>Invested</span>
                </div>
              </div>

              <div style={styles.allocationSummary}>
                <p style={styles.summaryTitle}>Allocation health</p>
                <p style={styles.summaryText}>
                  Your portfolio is diversified with a healthy equity bias and
                  enough cash for tactical moves.
                </p>
              </div>
            </div>

            <div style={styles.allocationList}>
              {dashboardData.allocation.map((item) => (
                <Allocation key={item.label} {...item} />
              ))}
            </div>
          </section>
        </div>
      </div>

      <Footer />
    </>
  );
}

function Card({ title, value, change, detail, tone, index }) {
  return (
    <div
      style={{
        ...styles.card,
        animationDelay: `${index * 80}ms`,
      }}
    >
      <div style={styles.cardTopRow}>
        <h4 style={styles.cardTitle}>{title}</h4>
        <span style={{ ...styles.changePill, color: tone }}>{change}</span>
      </div>
      <h2 style={styles.cardValue}>{value}</h2>
      <p style={styles.cardDetail}>{detail}</p>
    </div>
  );
}

function InsightChip({ label, value, tone }) {
  return (
    <div style={styles.insightChip}>
      <span style={styles.insightLabel}>{label}</span>
      <strong style={{ ...styles.insightValue, color: tone }}>{value}</strong>
    </div>
  );
}

function AIInsight({ insight }) {
  return (
    <section style={styles.aiPanel}>
      <div style={styles.aiHeader}>
        <div>
          <p style={styles.panelEyebrow}>FinanceAI</p>
          <h3 style={styles.panelTitle}>Portfolio insight</h3>
        </div>
        <span style={styles.aiSource}>{insight.source === "openai" ? "Live AI" : "Local AI"}</span>
      </div>
      <p style={styles.aiSummary}>{insight.summary}</p>
      <div style={styles.aiGrid}>
        {(insight.key_points || []).map((point) => (
          <p key={point} style={styles.aiPoint}>{point}</p>
        ))}
      </div>
      <p style={styles.aiDisclaimer}>{insight.disclaimer}</p>
    </section>
  );
}

function PerformanceChart({ data }) {
  return (
    <div style={styles.chartShell}>
      <div style={styles.chartBox}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748b", fontSize: 12 }}
            />
            <YAxis hide domain={["dataMin - 5", "dataMax + 5"]} />
            <Tooltip
              formatter={(value) => [`${value} pts`, "Performance"]}
              contentStyle={styles.tooltipCard}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#2563eb"
              strokeWidth={3}
              dot={{ r: 4, fill: "#2563eb", stroke: "#ffffff", strokeWidth: 2 }}
              activeDot={{ r: 6, fill: "#1d4ed8", stroke: "#ffffff", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function Allocation({ label, value, color }) {
  return (
    <div style={styles.allocItem}>
      <div style={styles.allocHeader}>
        <div style={styles.allocTitleWrap}>
          <span style={{ ...styles.dot, background: color }}></span>
          <span style={styles.allocLabel}>{label}</span>
        </div>
        <span style={styles.allocValue}>{value}%</span>
      </div>
      <div style={styles.allocTrack}>
        <div
          style={{
            ...styles.allocFill,
            width: `${value}%`,
            background: color,
          }}
        ></div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "32px 20px 48px",
    minHeight: "100vh",
  },
  pageMobile: {
    paddingTop: "24px",
  },
  hero: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: "24px",
    marginBottom: "28px",
    flexWrap: "wrap",
  },
  heroMobile: {
    marginBottom: "22px",
  },
  badge: {
    display: "inline-flex",
    padding: "6px 12px",
    borderRadius: "999px",
    background: "#dbeafe",
    color: "#1d4ed8",
    fontSize: "12px",
    fontWeight: "700",
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    marginBottom: "14px",
  },
  heading: {
    margin: 0,
    fontSize: "38px",
    lineHeight: 1.05,
    color: "#0f172a",
  },
  headingMobile: {
    fontSize: "32px",
  },
  subheading: {
    margin: "12px 0 0",
    maxWidth: "650px",
    color: "#475569",
    fontSize: "16px",
    lineHeight: 1.6,
  },
  heroStat: {
    minWidth: "220px",
    padding: "18px 20px",
    borderRadius: "20px",
    background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)",
    color: "#f8fafc",
    boxShadow: "0 18px 40px rgba(15, 23, 42, 0.18)",
    animation: "fadeUp 0.6s ease both",
  },
  heroStatMobile: {
    width: "100%",
  },
  insightStrip: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "14px",
    marginBottom: "24px",
  },
  aiPanel: {
    padding: "20px",
    borderRadius: "22px",
    background: "#ffffff",
    border: "1px solid rgba(147, 197, 253, 0.8)",
    boxShadow: "0 14px 30px rgba(15, 23, 42, 0.07)",
    marginBottom: "24px",
  },
  aiHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    alignItems: "flex-start",
    marginBottom: "12px",
  },
  aiSource: {
    padding: "7px 10px",
    borderRadius: "999px",
    background: "#eef2ff",
    color: "#4338ca",
    fontSize: "12px",
    fontWeight: "700",
  },
  aiSummary: {
    margin: 0,
    color: "#334155",
    lineHeight: 1.65,
  },
  aiGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "12px",
    marginTop: "16px",
  },
  aiPoint: {
    margin: 0,
    padding: "12px 14px",
    borderRadius: "14px",
    background: "#f8fafc",
    color: "#334155",
    fontSize: "14px",
    lineHeight: 1.5,
  },
  aiDisclaimer: {
    margin: "14px 0 0",
    color: "#64748b",
    fontSize: "12px",
  },
  insightChip: {
    padding: "16px 18px",
    borderRadius: "18px",
    background: "rgba(255,255,255,0.88)",
    border: "1px solid rgba(191, 219, 254, 0.7)",
    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.05)",
  },
  insightLabel: {
    display: "block",
    fontSize: "12px",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  },
  insightValue: {
    display: "block",
    marginTop: "10px",
    fontSize: "18px",
  },
  heroLabel: {
    display: "block",
    fontSize: "12px",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "rgba(248, 250, 252, 0.72)",
  },
  heroValue: {
    display: "block",
    marginTop: "8px",
    fontSize: "30px",
  },
  heroMeta: {
    display: "block",
    marginTop: "6px",
    fontSize: "13px",
    color: "rgba(248, 250, 252, 0.76)",
  },
  cards: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "18px",
    marginBottom: "26px",
  },
  card: {
    background: "rgba(255, 255, 255, 0.9)",
    border: "1px solid rgba(148, 163, 184, 0.16)",
    borderRadius: "20px",
    padding: "20px",
    boxShadow: "0 12px 28px rgba(15, 23, 42, 0.08)",
    animation: "fadeUp 0.55s ease both",
    backdropFilter: "blur(12px)",
  },
  cardTopRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    alignItems: "center",
  },
  cardTitle: {
    margin: 0,
    fontSize: "14px",
    fontWeight: "600",
    color: "#64748b",
  },
  changePill: {
    padding: "6px 10px",
    borderRadius: "999px",
    background: "rgba(255, 255, 255, 0.9)",
    fontSize: "13px",
    fontWeight: "700",
  },
  cardValue: {
    margin: "14px 0 6px",
    fontSize: "30px",
    lineHeight: 1.1,
    color: "#0f172a",
  },
  cardDetail: {
    margin: 0,
    color: "#475569",
    fontSize: "14px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.7fr) minmax(300px, 1fr)",
    gap: "20px",
    alignItems: "start",
  },
  gridTablet: {
    gridTemplateColumns: "1fr",
  },
  panel: {
    background: "rgba(255, 255, 255, 0.92)",
    border: "1px solid rgba(148, 163, 184, 0.16)",
    borderRadius: "24px",
    padding: "22px",
    boxShadow: "0 16px 32px rgba(15, 23, 42, 0.08)",
    animation: "fadeUp 0.65s ease both",
    backdropFilter: "blur(10px)",
  },
  performancePanel: {
    background:
      "radial-gradient(circle at top left, rgba(191, 219, 254, 0.55), rgba(255, 255, 255, 0.95) 42%)",
  },
  panelHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "18px",
    alignItems: "flex-start",
    marginBottom: "18px",
    flexWrap: "wrap",
  },
  panelEyebrow: {
    margin: 0,
    color: "#64748b",
    fontSize: "12px",
    fontWeight: "700",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  panelTitle: {
    margin: "8px 0 0",
    color: "#0f172a",
    fontSize: "24px",
  },
  inlineStats: {
    display: "flex",
    gap: "20px",
    flexWrap: "wrap",
  },
  inlineLabel: {
    display: "block",
    fontSize: "12px",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  },
  inlineValue: {
    display: "block",
    marginTop: "6px",
    fontSize: "18px",
    color: "#0f172a",
  },
  chartShell: {
    borderRadius: "20px",
    padding: "14px 14px 8px",
    background: "linear-gradient(180deg, #ffffff 0%, #eff6ff 100%)",
    border: "1px solid rgba(191, 219, 254, 0.8)",
  },
  chartBox: {
    height: "280px",
  },
  chartFooter: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
    gap: "14px",
    marginTop: "18px",
  },
  footerMetric: {
    padding: "14px 16px",
    borderRadius: "16px",
    background: "rgba(255, 255, 255, 0.84)",
    border: "1px solid rgba(191, 219, 254, 0.7)",
  },
  footerLabel: {
    display: "block",
    fontSize: "12px",
    color: "#64748b",
    marginBottom: "6px",
  },
  footerValue: {
    color: "#0f172a",
    fontSize: "16px",
  },
  rebalanceTag: {
    padding: "8px 12px",
    borderRadius: "999px",
    background: "#ecfdf5",
    color: "#0f9f6e",
    fontWeight: "700",
    fontSize: "13px",
  },
  allocationTop: {
    display: "flex",
    gap: "18px",
    alignItems: "center",
    flexWrap: "wrap",
    marginBottom: "22px",
  },
  pieWrap: {
    width: "150px",
    height: "150px",
    position: "relative",
    flexShrink: 0,
  },
  donutCenter: {
    position: "absolute",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    pointerEvents: "none",
  },
  donutValue: {
    fontSize: "26px",
    color: "#0f172a",
  },
  donutLabel: {
    fontSize: "12px",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  allocationSummary: {
    flex: "1 1 200px",
  },
  summaryTitle: {
    margin: "0 0 8px",
    fontSize: "16px",
    fontWeight: "700",
    color: "#0f172a",
  },
  summaryText: {
    margin: 0,
    fontSize: "14px",
    lineHeight: 1.6,
    color: "#475569",
  },
  allocationList: {
    display: "grid",
    gap: "14px",
  },
  allocItem: {
    padding: "14px 16px",
    borderRadius: "16px",
    background: "#f8fafc",
  },
  allocHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px",
    gap: "12px",
  },
  allocTitleWrap: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  allocLabel: {
    color: "#0f172a",
    fontWeight: "600",
  },
  allocValue: {
    color: "#334155",
    fontWeight: "700",
  },
  allocTrack: {
    width: "100%",
    height: "10px",
    borderRadius: "999px",
    background: "#e2e8f0",
    overflow: "hidden",
  },
  allocFill: {
    height: "100%",
    borderRadius: "999px",
  },
  dot: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
  },
  tooltipCard: {
    borderRadius: "12px",
    border: "1px solid #dbeafe",
    boxShadow: "0 10px 25px rgba(15, 23, 42, 0.08)",
    background: "#ffffff",
  },
};

export default Dashboard;
