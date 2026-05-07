import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import useViewport from "../lib/useViewport";

function HomePage() {
  const { isTablet, isMobile } = useViewport();

  const features = [
    {
      title: "Portfolio Dashboard",
      desc: "Track allocation, growth, and portfolio momentum in one clean view.",
      color: "#dbeafe",
      icon: "PI",
    },
    {
      title: "Transaction Uploads",
      desc: "Import broker exports fast and keep your portfolio data updated.",
      color: "#dcfce7",
      icon: "UP",
    },
    {
      title: "Risk Analysis",
      desc: "See concentration, volatility, and market exposure before they hurt performance.",
      color: "#fee2e2",
      icon: "RS",
    },
    {
      title: "AI Recommendations",
      desc: "Get stock ideas and portfolio insights tailored to your investing profile.",
      color: "#ede9fe",
      icon: "AI",
    },
  ];

  const quickStats = [
    { label: "Assets Tracked", value: "$2.4B+" },
    { label: "Active Investors", value: "50K+" },
    { label: "User Satisfaction", value: "98%" },
  ];

  return (
    <>
      <Navbar />

      <main style={{ ...styles.page, ...(isMobile ? styles.pageMobile : {}) }}>
        <section
          style={{
            ...styles.hero,
            ...(isTablet ? styles.heroTablet : {}),
            ...(isMobile ? styles.heroMobile : {}),
          }}
        >
          <div style={styles.heroCopy}>
            <span style={styles.badge}>Smarter Investing Workspace</span>
            <h1 style={{ ...styles.title, ...(isMobile ? styles.titleMobile : {}) }}>
              AI financial management built for modern investors
            </h1>
            <p style={{ ...styles.subtitle, ...(isMobile ? styles.subtitleMobile : {}) }}>
              FinanceAI helps you organize portfolio data, understand risk, and
              act on recommendations with a fast, focused interface.
            </p>

            <div style={{ ...styles.buttons, ...(isMobile ? styles.buttonsMobile : {}) }}>
              <Link to="/auth" style={{ ...styles.buttonLink, ...(isMobile ? styles.buttonLinkMobile : {}) }}>
                <button style={{ ...styles.primaryBtn, ...(isMobile ? styles.buttonMobile : {}) }}>
                  Get Started
                </button>
              </Link>

              <Link
                to="/dashboard"
                style={{ ...styles.buttonLink, ...(isMobile ? styles.buttonLinkMobile : {}) }}
              >
                <button style={{ ...styles.secondaryBtn, ...(isMobile ? styles.buttonMobile : {}) }}>
                  View Demo
                </button>
              </Link>
            </div>
          </div>

          <div style={{ ...styles.heroCard, ...(isMobile ? styles.heroCardMobile : {}) }}>
            <div style={styles.heroCardTop}>
              <span style={styles.heroCardLabel}>Portfolio Snapshot</span>
              <span style={styles.heroPill}>Live Demo</span>
            </div>

            <div style={styles.heroValueBlock}>
              <strong style={{ ...styles.heroValue, ...(isMobile ? styles.heroValueMobile : {}) }}>
                $62,400
              </strong>
              <span style={styles.heroChange}>+12.4% this quarter</span>
            </div>

            <div style={styles.heroBars}>
              <HeroBar label="Stocks" width="45%" color="#2563eb" />
              <HeroBar label="Bonds" width="25%" color="#10b981" />
              <HeroBar label="Cash" width="10%" color="#64748b" />
            </div>
          </div>
        </section>

        <section style={styles.demoStrip}>
          <DemoCard title="Fast signup" copy="Create an account and enter the dashboard in seconds." />
          <DemoCard title="Live uploads" copy="CSV imports immediately refresh portfolio analytics." />
          <DemoCard title="Presentation ready" copy="Clean charts and report views are ready for demo day." />
        </section>

        <section style={styles.grid}>
          {features.map((feature) => (
            <article key={feature.title} style={styles.card}>
              <div style={{ ...styles.icon, background: feature.color }}>{feature.icon}</div>
              <h3 style={styles.cardTitle}>{feature.title}</h3>
              <p style={styles.desc}>{feature.desc}</p>
            </article>
          ))}
        </section>

        <section style={styles.stats}>
          {quickStats.map((item) => (
            <div key={item.label} style={styles.statCard}>
              <h2 style={styles.statValue}>{item.value}</h2>
              <p style={styles.statLabel}>{item.label}</p>
            </div>
          ))}
        </section>
      </main>

      <Footer />
    </>
  );
}

function HeroBar({ label, width, color }) {
  return (
    <div style={styles.heroBarRow}>
      <span style={styles.heroBarLabel}>{label}</span>
      <div style={styles.heroTrack}>
        <div style={{ ...styles.heroFill, width, background: color }}></div>
      </div>
    </div>
  );
}

function DemoCard({ title, copy }) {
  return (
    <div style={styles.demoCard}>
      <p style={styles.demoTitle}>{title}</p>
      <p style={styles.demoCopy}>{copy}</p>
    </div>
  );
}

const styles = {
  page: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "40px 20px 0",
    minHeight: "100vh",
  },
  pageMobile: {
    paddingTop: "28px",
  },
  hero: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.2fr) minmax(320px, 420px)",
    gap: "28px",
    alignItems: "center",
  },
  heroTablet: {
    gridTemplateColumns: "1fr",
  },
  heroMobile: {
    gap: "20px",
  },
  heroCopy: {
    maxWidth: "680px",
  },
  badge: {
    display: "inline-flex",
    padding: "7px 12px",
    borderRadius: "999px",
    background: "#dbeafe",
    color: "#1d4ed8",
    fontSize: "12px",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    marginBottom: "18px",
  },
  title: {
    margin: 0,
    fontSize: "52px",
    lineHeight: 1.02,
    color: "#0f172a",
  },
  titleMobile: {
    fontSize: "38px",
    lineHeight: 1.08,
  },
  subtitle: {
    margin: "18px 0 0",
    color: "#475569",
    fontSize: "18px",
    lineHeight: 1.7,
  },
  subtitleMobile: {
    fontSize: "16px",
    lineHeight: 1.6,
  },
  buttons: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    marginTop: "28px",
  },
  buttonsMobile: {
    flexDirection: "column",
  },
  buttonLink: {
    textDecoration: "none",
  },
  buttonLinkMobile: {
    width: "100%",
  },
  primaryBtn: {
    padding: "14px 20px",
    background: "#0f172a",
    color: "#ffffff",
    border: "none",
    borderRadius: "12px",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
  },
  secondaryBtn: {
    padding: "14px 20px",
    border: "1px solid #cbd5e1",
    borderRadius: "12px",
    background: "#ffffff",
    color: "#0f172a",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
  },
  buttonMobile: {
    width: "100%",
  },
  heroCard: {
    background: "linear-gradient(160deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 58, 138, 0.95) 100%)",
    color: "#ffffff",
    borderRadius: "24px",
    padding: "24px",
    boxShadow: "0 24px 50px rgba(15, 23, 42, 0.18)",
  },
  heroCardMobile: {
    padding: "20px",
  },
  heroCardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
  },
  heroCardLabel: {
    fontSize: "13px",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "rgba(255,255,255,0.7)",
  },
  heroPill: {
    padding: "6px 10px",
    borderRadius: "999px",
    background: "rgba(255,255,255,0.14)",
    fontSize: "12px",
    fontWeight: "700",
  },
  heroValueBlock: {
    marginTop: "28px",
    display: "grid",
    gap: "8px",
  },
  heroValue: {
    fontSize: "42px",
    lineHeight: 1,
  },
  heroValueMobile: {
    fontSize: "34px",
  },
  heroChange: {
    color: "#86efac",
    fontSize: "15px",
  },
  heroBars: {
    display: "grid",
    gap: "14px",
    marginTop: "28px",
  },
  heroBarRow: {
    display: "grid",
    gap: "8px",
  },
  heroBarLabel: {
    fontSize: "14px",
    color: "rgba(255,255,255,0.8)",
  },
  heroTrack: {
    width: "100%",
    height: "10px",
    borderRadius: "999px",
    background: "rgba(255,255,255,0.16)",
    overflow: "hidden",
  },
  heroFill: {
    height: "100%",
    borderRadius: "999px",
  },
  grid: {
    marginTop: "44px",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "20px",
  },
  demoStrip: {
    marginTop: "24px",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "16px",
  },
  demoCard: {
    background: "rgba(255,255,255,0.85)",
    border: "1px solid rgba(191, 219, 254, 0.7)",
    borderRadius: "18px",
    padding: "18px 20px",
    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.05)",
  },
  demoTitle: {
    margin: 0,
    fontSize: "15px",
    fontWeight: "700",
    color: "#0f172a",
  },
  demoCopy: {
    margin: "8px 0 0",
    color: "#64748b",
    fontSize: "14px",
    lineHeight: 1.6,
  },
  card: {
    background: "rgba(255,255,255,0.95)",
    padding: "22px",
    borderRadius: "20px",
    border: "1px solid rgba(203, 213, 225, 0.8)",
    boxShadow: "0 12px 24px rgba(15, 23, 42, 0.05)",
  },
  icon: {
    width: "48px",
    height: "48px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "14px",
    marginBottom: "14px",
    fontSize: "14px",
    fontWeight: "700",
    color: "#0f172a",
    letterSpacing: "0.08em",
  },
  cardTitle: {
    margin: 0,
    fontSize: "20px",
    color: "#0f172a",
  },
  desc: {
    color: "#64748b",
    margin: "10px 0 0",
    lineHeight: 1.6,
  },
  stats: {
    marginTop: "28px",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "18px",
  },
  statCard: {
    background: "#ffffff",
    padding: "24px",
    borderRadius: "20px",
    border: "1px solid rgba(203, 213, 225, 0.8)",
    textAlign: "center",
  },
  statValue: {
    margin: 0,
    color: "#0f172a",
    fontSize: "30px",
  },
  statLabel: {
    margin: "8px 0 0",
    color: "#64748b",
    fontSize: "14px",
  },
};

export default HomePage;
