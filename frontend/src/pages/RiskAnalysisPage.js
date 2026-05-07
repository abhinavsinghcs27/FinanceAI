import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { requestJson } from "../lib/api";

const defaultRiskData = {
  score: {
    overall: 68,
    industry_average: 55,
    recommended_range: "45-60",
    label: "Medium Risk",
  },
  radar: [
    { label: "Volatility", value: 62 },
    { label: "Diversification", value: 75 },
    { label: "Sector Concentration", value: 55 },
    { label: "Market Exposure", value: 70 },
    { label: "Liquidity", value: 72 },
    { label: "Currency Risk", value: 68 },
  ],
  trend: [
    { month: "Aug", portfolio: 45, benchmark: 43 },
    { month: "Sep", portfolio: 48, benchmark: 45 },
    { month: "Oct", portfolio: 52, benchmark: 47 },
    { month: "Nov", portfolio: 50, benchmark: 46 },
    { month: "Dec", portfolio: 55, benchmark: 49 },
    { month: "Jan", portfolio: 58, benchmark: 51 },
    { month: "Feb", portfolio: 62, benchmark: 54 },
  ],
  sectors: [
    { label: "Technology", value: 92 },
    { label: "Healthcare", value: 54 },
    { label: "Finance", value: 40 },
    { label: "Consumer", value: 32 },
    { label: "Energy", value: 26 },
    { label: "Other", value: 21 },
  ],
  detail_metrics: [
    { label: "Volatility", value: 65 },
    { label: "Diversification", value: 78 },
    { label: "Sector Concentration", value: 55 },
    { label: "Market Exposure", value: 72 },
    { label: "Liquidity", value: 85 },
  ],
  alerts: [
    {
      title: "High Concentration Alert",
      message:
        "Your technology sector allocation (35%) exceeds recommended limits. Consider diversifying.",
      tone: "warning",
    },
    {
      title: "Volatility Warning",
      message:
        "Recent market volatility has increased your portfolio risk by 8% this month.",
      tone: "info",
    },
  ],
  recommendations: [
    {
      title: "Reduce Technology Exposure",
      description:
        "Consider reducing technology holdings by 10-15% and reallocating to defensive sectors like utilities or consumer staples to improve diversification.",
      color: "#2563eb",
      bg: "#dbeafe",
      icon: "shield",
    },
    {
      title: "Add Bonds for Stability",
      description:
        "Increase bond allocation from 25% to 30-35% to reduce overall portfolio volatility and provide downside protection during market corrections.",
      color: "#16a34a",
      bg: "#dcfce7",
      icon: "trendDown",
    },
    {
      title: "Implement Stop-Loss Orders",
      description:
        "Set stop-loss orders at 8-10% below current prices for your high-risk holdings to limit potential downside exposure.",
      color: "#9333ea",
      bg: "#f3e8ff",
      icon: "line",
    },
  ],
};

function RiskAnalysisPage() {
  const [riskData, setRiskData] = useState(defaultRiskData);
  const [aiInsight, setAiInsight] = useState(null);

  useEffect(() => {
    requestJson("/api/risk")
      .then((data) => setRiskData(data))
      .catch(() => {});
    requestJson("/api/ai/risk-explanation", { method: "POST" })
      .then((data) => setAiInsight(data))
      .catch(() => {});
  }, []);

  return (
    <>
      <Navbar />

      <main style={styles.page}>
        <section style={styles.hero}>
          <h1 style={styles.heading}>Risk Analysis</h1>
          <p style={styles.subheading}>
            AI-powered assessment of your portfolio risk profile
          </p>
        </section>

        <section style={styles.topGrid}>
          <div style={{ ...styles.card, ...styles.scoreCard }}>
            <h2 style={styles.cardTitle}>Overall Risk Score</h2>
            <p style={styles.cardSubtitle}>Based on multiple factors</p>

            <div style={styles.scoreCircle}>
              <div style={styles.scoreGlow}></div>
              <div style={styles.scoreInner}>
                <strong style={styles.scoreValue}>{riskData.score.overall}</strong>
                <span style={styles.scoreOutOf}>/ 100</span>
              </div>
            </div>

            <div style={styles.scoreBadge}>{riskData.score.label}</div>

            <div style={styles.scoreDivider}></div>

            <div style={styles.scoreRows}>
              <ScoreRow label="Your Score" value={riskData.score.overall} accent />
              <ScoreRow label="Industry Avg" value={riskData.score.industry_average} />
              <ScoreRow label="Recommended" value={riskData.score.recommended_range} />
            </div>
          </div>

          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Risk Factor Breakdown</h2>
            <p style={styles.cardSubtitle}>Multi-dimensional risk assessment</p>

            <div style={styles.radarWrap}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={riskData.radar}>
                  <PolarGrid stroke="#dbe4f0" />
                  <PolarAngleAxis
                    dataKey="label"
                    tick={{ fill: "#64748b", fontSize: 13 }}
                  />
                  <PolarRadiusAxis
                    domain={[0, 100]}
                    tick={{ fill: "#64748b", fontSize: 12 }}
                  />
                  <Tooltip
                    formatter={(value) => [`${value}/100`, "Risk score"]}
                    contentStyle={styles.tooltipCard}
                  />
                  <Radar
                    name="Risk Score"
                    dataKey="value"
                    stroke="#2563eb"
                    fill="#3b82f6"
                    fillOpacity={0.35}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        <section style={styles.alertGrid}>
          {riskData.alerts.map((alert) => (
            <AlertCard
              key={alert.title}
              title={alert.title}
              message={alert.message}
              tone={alert.tone}
            />
          ))}
        </section>

        {aiInsight ? (
          <section style={{ ...styles.card, ...styles.aiCard }}>
            <div style={styles.aiHeader}>
              <div>
                <h2 style={styles.cardTitle}>FinanceAI Risk Explanation</h2>
                <p style={styles.cardSubtitle}>
                  {aiInsight.source === "openai" ? "Generated with live AI" : "Generated with local AI rules"}
                </p>
              </div>
            </div>
            <p style={styles.aiSummary}>{aiInsight.summary}</p>
            <div style={styles.aiActionGrid}>
              {(aiInsight.actions || []).map((action) => (
                <p key={action} style={styles.aiAction}>{action}</p>
              ))}
            </div>
            <p style={styles.aiDisclaimer}>{aiInsight.disclaimer}</p>
          </section>
        ) : null}

        <section style={{ ...styles.card, ...styles.trendCard }}>
          <h2 style={styles.cardTitle}>Risk Trend Analysis</h2>
          <p style={styles.cardSubtitle}>
            Portfolio risk vs. market benchmark over time
          </p>

          <div style={styles.trendWrap}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={riskData.trend}>
                <CartesianGrid stroke="#dbe4f0" strokeDasharray="4 5" />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 13 }}
                />
                <YAxis
                  domain={[20, 80]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                />
                <Tooltip contentStyle={styles.tooltipCard} />
                <Legend wrapperStyle={styles.legendWrap} />
                <Line
                  type="monotone"
                  dataKey="portfolio"
                  name="Your Portfolio Risk"
                  stroke="#ef4444"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#ef4444" }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="benchmark"
                  name="Market Benchmark"
                  stroke="#2563eb"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#2563eb" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section style={styles.lowerGrid}>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Sector Exposure & Risk</h2>
            <p style={styles.cardSubtitle}>Risk distribution across sectors</p>

            <div style={styles.barChartWrap}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={riskData.sectors}
                  layout="vertical"
                  margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                >
                  <CartesianGrid stroke="#dbe4f0" strokeDasharray="4 5" horizontal={false} />
                  <XAxis type="number" hide domain={[0, 100]} />
                  <YAxis
                    type="category"
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 14 }}
                    width={90}
                  />
                  <Tooltip
                    formatter={(value) => [`${value}/100`, "Exposure"]}
                    contentStyle={styles.tooltipCard}
                  />
                  <Bar
                    dataKey="value"
                    fill="#3b82f6"
                    radius={[0, 8, 8, 0]}
                    barSize={34}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Detailed Risk Metrics</h2>
            <p style={styles.cardSubtitle}>Individual component analysis</p>
            <MetricBars items={riskData.detail_metrics} />
          </div>
        </section>

        <section style={{ ...styles.card, ...styles.recommendCard }}>
          <h2 style={styles.cardTitle}>AI-Generated Recommendations</h2>
          <p style={styles.cardSubtitle}>
            Personalized suggestions to optimize your risk profile
          </p>

          <div style={styles.recommendationList}>
            {riskData.recommendations.map((item) => (
              <div key={item.title} style={styles.recommendationItem}>
                <div
                  style={{
                    ...styles.recommendIcon,
                    background: item.bg || "#dbeafe",
                  }}
                >
                  <RecommendationIcon
                    type={item.icon || "shield"}
                    color={item.color || "#2563eb"}
                  />
                </div>
                <div>
                  <p style={styles.recommendTitle}>{item.title}</p>
                  <p style={styles.recommendText}>{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

function ScoreRow({ label, value, accent = false }) {
  return (
    <div style={styles.scoreRow}>
      <span style={styles.scoreLabel}>{label}</span>
      <span
        style={{ ...styles.scoreRowValue, color: accent ? "#d97706" : "#0f172a" }}
      >
        {value}
      </span>
    </div>
  );
}

function AlertCard({ title, message, tone }) {
  const toneStyles =
    tone === "warning"
      ? {
          background: "#fffbeb",
          border: "1px solid #fde68a",
          accent: "#b45309",
          iconBg: "#fef3c7",
        }
      : {
          background: "#eff6ff",
          border: "1px solid #bfdbfe",
          accent: "#1d4ed8",
          iconBg: "#dbeafe",
        };

  return (
    <div
      style={{
        ...styles.alertCard,
        background: toneStyles.background,
        border: toneStyles.border,
      }}
    >
      <div
        style={{
          ...styles.alertIcon,
          background: toneStyles.iconBg,
          color: toneStyles.accent,
        }}
      >
        {tone === "warning" ? "!" : "i"}
      </div>
      <div>
        <p style={{ ...styles.alertTitle, color: toneStyles.accent }}>{title}</p>
        <p style={styles.alertText}>{message}</p>
      </div>
    </div>
  );
}

function MetricBars({ items }) {
  return (
    <div style={styles.metricGroup}>
      {items.map((item) => (
        <div key={item.label} style={styles.metricItem}>
          <div style={styles.metricHeader}>
            <span style={styles.metricLabel}>{item.label}</span>
            <span style={styles.metricValue}>{item.value}/100</span>
          </div>
          <div style={styles.metricTrack}>
            <div style={{ ...styles.metricFill, width: `${item.value}%` }}></div>
          </div>
        </div>
      ))}
    </div>
  );
}

function RecommendationIcon({ type, color }) {
  if (type === "shield") {
    return (
      <svg viewBox="0 0 24 24" style={styles.iconSvg}>
        <path
          d="M12 3l6 2.5v5.6c0 4.1-2.5 7.7-6 9-3.5-1.3-6-4.9-6-9V5.5L12 3z"
          fill="none"
          stroke={color}
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (type === "trendDown") {
    return (
      <svg viewBox="0 0 24 24" style={styles.iconSvg}>
        <path
          d="M4 8l5 5 4-4 7 7"
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M16 16h4v-4"
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" style={styles.iconSvg}>
      <path
        d="M4 16l5-5 4 4 7-7"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const styles = {
  page: {
    maxWidth: "1220px",
    margin: "0 auto",
    padding: "28px 20px 48px",
  },
  hero: {
    marginBottom: "22px",
  },
  heading: {
    margin: 0,
    fontSize: "48px",
    lineHeight: 1.05,
    color: "#0f172a",
  },
  subheading: {
    margin: "10px 0 0",
    fontSize: "16px",
    color: "#64748b",
  },
  topGrid: {
    display: "grid",
    gridTemplateColumns: "390px minmax(0, 1fr)",
    gap: "22px",
    alignItems: "stretch",
  },
  lowerGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "24px",
    marginTop: "24px",
  },
  card: {
    background: "rgba(255, 255, 255, 0.96)",
    border: "1px solid rgba(203, 213, 225, 0.85)",
    borderRadius: "22px",
    padding: "24px",
    boxShadow: "0 14px 30px rgba(15, 23, 42, 0.06)",
    animation: "fadeUp 0.55s ease both",
  },
  scoreCard: {
    display: "flex",
    flexDirection: "column",
  },
  cardTitle: {
    margin: 0,
    fontSize: "18px",
    color: "#0f172a",
  },
  cardSubtitle: {
    margin: "8px 0 0",
    fontSize: "15px",
    color: "#64748b",
  },
  scoreCircle: {
    width: "170px",
    height: "170px",
    margin: "48px auto 18px",
    borderRadius: "50%",
    background: "radial-gradient(circle at 35% 35%, #fef9c3, #fde68a)",
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  scoreGlow: {
    position: "absolute",
    inset: "-12px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(250, 204, 21, 0.18), transparent 70%)",
  },
  scoreInner: {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    color: "#d97706",
  },
  scoreValue: {
    fontSize: "56px",
    lineHeight: 1,
    fontWeight: "500",
  },
  scoreOutOf: {
    fontSize: "24px",
    marginTop: "6px",
  },
  scoreBadge: {
    alignSelf: "center",
    padding: "6px 12px",
    borderRadius: "999px",
    border: "1px solid #f59e0b",
    color: "#b45309",
    fontSize: "14px",
    background: "#fff7ed",
  },
  scoreDivider: {
    height: "1px",
    background: "#e2e8f0",
    margin: "32px 0 20px",
  },
  scoreRows: {
    display: "grid",
    gap: "16px",
  },
  scoreRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    fontSize: "15px",
  },
  scoreLabel: {
    color: "#334155",
  },
  scoreRowValue: {
    fontWeight: "500",
  },
  radarWrap: {
    width: "100%",
    height: "320px",
    marginTop: "20px",
  },
  alertGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
    marginTop: "24px",
  },
  alertCard: {
    borderRadius: "16px",
    padding: "14px 16px",
    display: "flex",
    gap: "12px",
    alignItems: "flex-start",
  },
  alertIcon: {
    width: "24px",
    height: "24px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
    fontWeight: "700",
    flexShrink: 0,
  },
  alertTitle: {
    margin: 0,
    fontSize: "14px",
    fontWeight: "700",
  },
  alertText: {
    margin: "6px 0 0",
    fontSize: "14px",
    lineHeight: 1.5,
    color: "#334155",
  },
  trendCard: {
    marginTop: "24px",
  },
  aiCard: {
    marginTop: "24px",
    borderColor: "#bfdbfe",
    background: "linear-gradient(180deg, #ffffff 0%, #eff6ff 100%)",
  },
  aiHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    alignItems: "flex-start",
  },
  aiSummary: {
    margin: "18px 0 0",
    color: "#334155",
    lineHeight: 1.65,
  },
  aiActionGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "12px",
    marginTop: "16px",
  },
  aiAction: {
    margin: 0,
    padding: "13px 14px",
    borderRadius: "14px",
    background: "#ffffff",
    border: "1px solid #dbeafe",
    color: "#334155",
    fontSize: "14px",
    lineHeight: 1.5,
  },
  aiDisclaimer: {
    margin: "14px 0 0",
    color: "#64748b",
    fontSize: "12px",
  },
  trendWrap: {
    height: "320px",
    marginTop: "22px",
  },
  legendWrap: {
    paddingTop: "12px",
    fontSize: "14px",
  },
  barChartWrap: {
    height: "320px",
    marginTop: "22px",
  },
  metricGroup: {
    display: "grid",
    gap: "18px",
    marginTop: "24px",
  },
  metricItem: {
    display: "grid",
    gap: "8px",
  },
  metricHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    fontSize: "14px",
  },
  metricLabel: {
    color: "#334155",
  },
  metricValue: {
    color: "#0f172a",
    fontWeight: "500",
  },
  metricTrack: {
    height: "8px",
    borderRadius: "999px",
    background: "#d4d4d8",
    overflow: "hidden",
  },
  metricFill: {
    height: "100%",
    background: "#111827",
  },
  recommendCard: {
    marginTop: "24px",
  },
  recommendationList: {
    display: "grid",
    gap: "16px",
    marginTop: "24px",
  },
  recommendationItem: {
    background: "#f8fafc",
    borderRadius: "18px",
    padding: "16px",
    display: "flex",
    gap: "16px",
    alignItems: "flex-start",
  },
  recommendIcon: {
    width: "40px",
    height: "40px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  iconSvg: {
    width: "20px",
    height: "20px",
  },
  recommendTitle: {
    margin: 0,
    fontSize: "16px",
    fontWeight: "500",
    color: "#0f172a",
  },
  recommendText: {
    margin: "6px 0 0",
    fontSize: "14px",
    lineHeight: 1.55,
    color: "#334155",
  },
  tooltipCard: {
    borderRadius: "12px",
    border: "1px solid #dbeafe",
    boxShadow: "0 10px 25px rgba(15, 23, 42, 0.08)",
    background: "#ffffff",
  },
};

export default RiskAnalysisPage;
