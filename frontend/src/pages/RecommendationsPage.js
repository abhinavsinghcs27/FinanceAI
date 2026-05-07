import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { requestJson } from "../lib/api";

const defaultRecommendations = {
  summary: {
    opportunities_found: 12,
    message: "Top 3 recommendations shown below with highest confidence scores.",
  },
  filters: ["AI Picks", "Trending", "High Dividend"],
  stocks: [
    {
      ticker: "NVDA",
      company: "NVIDIA Corporation",
      price: "$485.2",
      change: "2.8%",
      change_color: "#16a34a",
      action: "Strong Buy",
      risk: "Medium Risk",
      ai_score: 92,
      description:
        "Leading AI chip maker with strong earnings growth and market dominance in data center GPUs.",
      target_price: "$550",
      upside: "+13.4%",
      confidence_label: "Very High",
    },
    {
      ticker: "AMD",
      company: "Advanced Micro Devices",
      price: "$142.5",
      change: "1.5%",
      change_color: "#16a34a",
      action: "Buy",
      risk: "Medium Risk",
      ai_score: 85,
      description:
        "Gaining market share in CPUs and GPUs, strong pipeline for AI accelerators.",
      target_price: "$160",
      upside: "+12.3%",
      confidence_label: "High",
    },
    {
      ticker: "JNJ",
      company: "Johnson & Johnson",
      price: "$168.3",
      change: "0.3%",
      change_color: "#dc2626",
      action: "Buy",
      risk: "Low Risk",
      ai_score: 78,
      description:
        "Defensive healthcare stock with consistent dividend growth and stable earnings.",
      target_price: "$180",
      upside: "+7.0%",
      confidence_label: "Moderate",
    },
  ],
  fit_analysis: [
    { label: "Risk Alignment", value: 85 },
    { label: "Sector Diversification", value: 72 },
    { label: "Growth Potential", value: 90 },
    { label: "Dividend Yield", value: 45 },
    { label: "Valuation", value: 68 },
  ],
};

function RecommendationsPage() {
  const [recommendationData, setRecommendationData] = useState(defaultRecommendations);
  const [aiInsight, setAiInsight] = useState(null);
  const [activeFilter, setActiveFilter] = useState("AI Picks");
  const [selectedStock, setSelectedStock] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    requestJson("/api/recommendations")
      .then((data) => setRecommendationData(data))
      .catch(() => {});
    requestJson("/api/ai/recommendations", { method: "POST" })
      .then((data) => setAiInsight(data))
      .catch(() => {});
  }, []);

  async function addToWatchlist(ticker) {
    try {
      const result = await requestJson(`/api/recommendations/${ticker}/watchlist`, {
        method: "POST",
      });
      setMessage(result.message);
    } catch (error) {
      setMessage("Backend unavailable. Watchlist action simulated.");
    }
  }

  function applyFilter(filter) {
    setActiveFilter(filter);
    if (filter === "AI Picks") {
      setMessage("Showing highest-scored AI recommendations.");
    } else if (filter === "Trending") {
      setMessage("Showing ideas with the strongest recent signal in this demo dataset.");
    } else {
      setMessage("Showing lower-risk income and dividend-oriented candidates where available.");
    }
  }

  const visibleStocks = [...recommendationData.stocks].sort((a, b) => {
    if (activeFilter === "Trending") {
      return parseFloat(b.change) - parseFloat(a.change);
    }
    if (activeFilter === "High Dividend") {
      return a.risk.localeCompare(b.risk);
    }
    return b.ai_score - a.ai_score;
  });

  return (
    <>
      <Navbar />

      <main style={styles.page}>
        <section style={styles.hero}>
          <h1 style={styles.heading}>Stock Recommendations</h1>
          <p style={styles.subheading}>
            AI-powered investment suggestions tailored to your portfolio
          </p>
        </section>

        <section style={styles.summaryCard}>
          <div style={styles.summaryIcon}>AI</div>
          <div>
            <h2 style={styles.summaryTitle}>AI Analysis Complete</h2>
            <p style={styles.summaryText}>
              Based on your portfolio composition, risk profile, and current
              market conditions, our AI has identified{" "}
              {recommendationData.summary.opportunities_found} potential
              opportunities. {recommendationData.summary.message}
            </p>
          </div>
        </section>

        {aiInsight ? (
          <section style={styles.aiCard}>
            <div style={styles.aiHeader}>
              <h2 style={styles.summaryTitle}>FinanceAI Recommendation Rationale</h2>
              <span style={styles.aiSource}>{aiInsight.source === "openai" ? "Live AI" : "Local AI"}</span>
            </div>
            <p style={styles.summaryText}>{aiInsight.summary}</p>
            <div style={styles.aiActions}>
              {(aiInsight.actions || []).map((action) => (
                <p key={action} style={styles.aiAction}>{action}</p>
              ))}
            </div>
            <p style={styles.aiDisclaimer}>{aiInsight.disclaimer}</p>
          </section>
        ) : null}

        {message ? <p style={styles.message}>{message}</p> : null}

        <div style={styles.filterRow}>
          {recommendationData.filters.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => applyFilter(filter)}
              style={{
                ...styles.filterChip,
                ...(activeFilter === filter ? styles.activeChip : {}),
              }}
            >
              {filter}
            </button>
          ))}
        </div>

        <section style={styles.cards}>
          {visibleStocks.map((item) => (
            <RecommendationCard
              key={item.ticker}
              item={item}
              onWatchlist={() => addToWatchlist(item.ticker)}
              onDetails={() => setSelectedStock(item)}
            />
          ))}
        </section>

        {selectedStock ? (
          <section style={styles.detailCard}>
            <div style={styles.detailHeader}>
              <div>
                <h2 style={styles.cardTitle}>{selectedStock.ticker} Details</h2>
                <p style={styles.cardSubtitle}>{selectedStock.company}</p>
              </div>
              <button type="button" style={styles.closeButton} onClick={() => setSelectedStock(null)}>
                Close
              </button>
            </div>
            <div style={styles.detailGrid}>
              <Detail label="Action" value={selectedStock.action} />
              <Detail label="Risk" value={selectedStock.risk} />
              <Detail label="Target" value={selectedStock.target_price} />
              <Detail label="Upside" value={selectedStock.upside} />
            </div>
            <p style={styles.description}>{selectedStock.description}</p>
          </section>
        ) : null}

        <section style={styles.fitCard}>
          <h2 style={styles.cardTitle}>Portfolio Fit Analysis</h2>
          <p style={styles.cardSubtitle}>
            How well these recommendations align with your current portfolio
          </p>

          <div style={styles.fitMetrics}>
            {recommendationData.fit_analysis.map((metric) => (
              <div key={metric.label} style={styles.metricItem}>
                <div style={styles.metricHeader}>
                  <span style={styles.metricLabel}>{metric.label}</span>
                  <span style={styles.metricValue}>{metric.value}%</span>
                </div>
                <div style={styles.metricTrack}>
                  <div
                    style={{ ...styles.metricFill, width: `${metric.value}%` }}
                  ></div>
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

function RecommendationCard({ item, onWatchlist, onDetails }) {
  const isNegative = item.change_color === "#dc2626";

  return (
    <article style={styles.recommendCard}>
      <div style={styles.recommendBody}>
        <div style={styles.companyRow}>
          <div style={styles.tickerBox}>{item.ticker}</div>
          <div>
            <h3 style={styles.companyName}>{item.company}</h3>
            <div style={styles.priceRow}>
              <span style={styles.price}>{item.price}</span>
              <span style={{ ...styles.change, color: item.change_color }}>
                {isNegative ? "Down" : "Up"} {item.change}
              </span>
            </div>
          </div>
        </div>

        <div style={styles.badgeRow}>
          <span
            style={{
              ...styles.inlineBadge,
              background: item.action === "Strong Buy" ? "#dcfce7" : "#dbeafe",
              color: item.action === "Strong Buy" ? "#15803d" : "#2563eb",
            }}
          >
            {item.action}
          </span>
          <span style={{ ...styles.inlineBadge, background: "#f1f5f9" }}>
            {item.risk}
          </span>
          <span style={styles.aiBadge}>AI Score: {item.ai_score}</span>
        </div>

        <p style={styles.description}>{item.description}</p>

        <div style={styles.metaGrid}>
          <div>
            <p style={styles.metaLabel}>Target Price</p>
            <p style={styles.metaValue}>{item.target_price}</p>
          </div>
          <div>
            <p style={styles.metaLabel}>Upside Potential</p>
            <p style={{ ...styles.metaValue, color: "#16a34a" }}>{item.upside}</p>
          </div>
        </div>

        <div style={styles.actions}>
          <button type="button" style={styles.primaryButton} onClick={onWatchlist}>
            Add to Watchlist
          </button>
          <button type="button" style={styles.secondaryButton} onClick={onDetails}>
            View Details
          </button>
        </div>
      </div>

      <div style={styles.confidenceCard}>
        <p style={styles.confidenceLabel}>AI Confidence</p>
        <div style={styles.confidenceCircle}>{item.ai_score}</div>
        <div style={styles.confidenceTrack}>
          <div
            style={{ ...styles.confidenceFill, width: `${item.ai_score}%` }}
          ></div>
        </div>
        <p style={styles.confidenceText}>{item.confidence_label}</p>
      </div>
    </article>
  );
}

function Detail({ label, value }) {
  return (
    <div style={styles.detailItem}>
      <span style={styles.metaLabel}>{label}</span>
      <strong style={styles.metaValue}>{value}</strong>
    </div>
  );
}

const styles = {
  page: {
    maxWidth: "1220px",
    margin: "0 auto",
    padding: "28px 20px 0",
  },
  hero: {
    marginBottom: "22px",
  },
  heading: {
    margin: 0,
    fontSize: "44px",
    lineHeight: 1.05,
    color: "#0f172a",
  },
  subheading: {
    margin: "10px 0 0",
    fontSize: "16px",
    color: "#64748b",
  },
  summaryCard: {
    display: "flex",
    gap: "18px",
    alignItems: "flex-start",
    padding: "24px",
    borderRadius: "22px",
    background: "linear-gradient(90deg, #eff6ff 0%, #f5f3ff 100%)",
    border: "1px solid #bfdbfe",
    boxShadow: "0 12px 28px rgba(15, 23, 42, 0.05)",
  },
  aiCard: {
    marginTop: "16px",
    padding: "22px 24px",
    borderRadius: "22px",
    background: "#ffffff",
    border: "1px solid #c7d2fe",
    boxShadow: "0 12px 28px rgba(15, 23, 42, 0.05)",
  },
  aiHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    alignItems: "center",
  },
  aiSource: {
    padding: "7px 10px",
    borderRadius: "999px",
    background: "#eef2ff",
    color: "#4338ca",
    fontSize: "12px",
    fontWeight: "700",
  },
  aiActions: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
    gap: "12px",
    marginTop: "16px",
  },
  aiAction: {
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
  summaryIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "14px",
    background: "#2563eb",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    fontWeight: "700",
    flexShrink: 0,
  },
  summaryTitle: {
    margin: 0,
    fontSize: "18px",
    color: "#0f172a",
  },
  summaryText: {
    margin: "10px 0 0",
    color: "#334155",
    lineHeight: 1.65,
    fontSize: "15px",
  },
  message: {
    margin: "14px 0 0",
    color: "#2563eb",
    fontSize: "14px",
  },
  filterRow: {
    display: "flex",
    gap: "10px",
    margin: "24px 0 32px",
    flexWrap: "wrap",
  },
  filterChip: {
    padding: "10px 16px",
    borderRadius: "999px",
    border: "none",
    background: "#e2e8f0",
    color: "#0f172a",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
  },
  activeChip: {
    background: "#ffffff",
    boxShadow: "0 4px 14px rgba(15, 23, 42, 0.08)",
  },
  cards: {
    display: "grid",
    gap: "18px",
  },
  recommendCard: {
    background: "rgba(255, 255, 255, 0.96)",
    border: "1px solid rgba(203, 213, 225, 0.85)",
    borderRadius: "22px",
    padding: "24px",
    boxShadow: "0 14px 30px rgba(15, 23, 42, 0.06)",
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) 190px",
    gap: "24px",
    alignItems: "center",
  },
  recommendBody: {
    display: "grid",
    gap: "16px",
  },
  companyRow: {
    display: "flex",
    gap: "14px",
    alignItems: "flex-start",
  },
  tickerBox: {
    minWidth: "48px",
    height: "48px",
    borderRadius: "12px",
    background: "#f1f5f9",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px",
    color: "#334155",
  },
  companyName: {
    margin: 0,
    fontSize: "18px",
    color: "#0f172a",
  },
  priceRow: {
    display: "flex",
    gap: "12px",
    alignItems: "baseline",
    marginTop: "8px",
  },
  price: {
    fontSize: "22px",
    color: "#0f172a",
  },
  change: {
    fontSize: "15px",
  },
  badgeRow: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
  inlineBadge: {
    padding: "4px 10px",
    borderRadius: "10px",
    fontSize: "14px",
    color: "#334155",
    border: "1px solid rgba(148, 163, 184, 0.16)",
  },
  aiBadge: {
    padding: "4px 10px",
    borderRadius: "10px",
    fontSize: "14px",
    background: "#f3e8ff",
    color: "#7e22ce",
    border: "1px solid #e9d5ff",
  },
  description: {
    margin: 0,
    fontSize: "15px",
    lineHeight: 1.65,
    color: "#334155",
  },
  metaGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(120px, 220px))",
    gap: "18px",
  },
  metaLabel: {
    margin: 0,
    fontSize: "14px",
    color: "#475569",
  },
  metaValue: {
    margin: "6px 0 0",
    fontSize: "15px",
    color: "#0f172a",
  },
  actions: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
  },
  primaryButton: {
    padding: "12px 16px",
    borderRadius: "10px",
    border: "none",
    background: "#050816",
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
  },
  secondaryButton: {
    padding: "12px 16px",
    borderRadius: "10px",
    border: "1px solid #d4d4d8",
    background: "#ffffff",
    color: "#0f172a",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
  },
  confidenceCard: {
    padding: "18px 16px",
    borderRadius: "18px",
    background: "#f8fafc",
    display: "grid",
    justifyItems: "center",
    gap: "12px",
  },
  confidenceLabel: {
    margin: 0,
    color: "#475569",
    fontSize: "14px",
  },
  confidenceCircle: {
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #4f46e5 0%, #9333ea 100%)",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    boxShadow: "0 14px 24px rgba(124, 58, 237, 0.22)",
  },
  confidenceTrack: {
    width: "100%",
    height: "8px",
    borderRadius: "999px",
    background: "#d1d5db",
    overflow: "hidden",
  },
  confidenceFill: {
    height: "100%",
    background: "#111827",
  },
  confidenceText: {
    margin: 0,
    fontSize: "14px",
    color: "#64748b",
  },
  fitCard: {
    marginTop: "28px",
    background: "rgba(255, 255, 255, 0.96)",
    border: "1px solid rgba(203, 213, 225, 0.85)",
    borderRadius: "22px",
    padding: "24px",
    boxShadow: "0 14px 30px rgba(15, 23, 42, 0.06)",
  },
  detailCard: {
    marginTop: "18px",
    background: "#ffffff",
    border: "1px solid #bfdbfe",
    borderRadius: "22px",
    padding: "22px 24px",
    boxShadow: "0 14px 30px rgba(15, 23, 42, 0.06)",
  },
  detailHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    alignItems: "flex-start",
    marginBottom: "16px",
  },
  detailGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: "12px",
    marginBottom: "14px",
  },
  detailItem: {
    padding: "12px 14px",
    borderRadius: "14px",
    background: "#f8fafc",
  },
  closeButton: {
    padding: "9px 12px",
    borderRadius: "10px",
    border: "1px solid #d4d4d8",
    background: "#ffffff",
    color: "#0f172a",
    fontWeight: "700",
    cursor: "pointer",
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
  fitMetrics: {
    display: "grid",
    gap: "18px",
    marginTop: "28px",
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
};

export default RecommendationsPage;
