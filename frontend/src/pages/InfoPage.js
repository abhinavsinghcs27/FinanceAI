import { Link, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const content = {
  features: {
    title: "Features",
    copy: "FinanceAI includes portfolio tracking, transaction imports, risk analysis, AI explanations, recommendations, reports, and an assistant grounded in your holdings.",
    actions: [{ label: "Open Dashboard", to: "/dashboard" }],
  },
  pricing: {
    title: "Pricing",
    copy: "This student MVP runs as a demo product. A production version would usually offer a free starter tier and paid plans for live data, advanced reports, and integrations.",
    actions: [{ label: "Create Account", to: "/auth" }],
  },
  security: {
    title: "Security",
    copy: "The app hashes passwords, protects account routes with bearer sessions, limits AI advice with disclaimers, and keeps API keys on the backend.",
    actions: [{ label: "Review Profile", to: "/profile" }],
  },
  about: {
    title: "About",
    copy: "FinanceAI is a portfolio intelligence workspace built to help investors understand risk, organize transactions, and generate educational AI insights.",
    actions: [{ label: "Ask FinanceAI", to: "/assistant" }],
  },
  blog: {
    title: "Blog",
    copy: "Blog publishing is not connected in this MVP yet. Use Reports to generate portfolio summaries and AI commentary.",
    actions: [{ label: "Generate Report", to: "/reports" }],
  },
  careers: {
    title: "Careers",
    copy: "Hiring pages are not active for this demo. The project is ready to showcase frontend, backend, AI, and deployment skills.",
    actions: [{ label: "View Features", to: "/info/features" }],
  },
  privacy: {
    title: "Privacy",
    copy: "Uploaded transactions and generated reports are stored for the signed-in user. Do not upload sensitive real brokerage files to a demo deployment.",
    actions: [{ label: "Manage Uploads", to: "/upload" }],
  },
  terms: {
    title: "Terms",
    copy: "FinanceAI insights are educational only and are not financial, investment, tax, or legal advice. No returns are guaranteed.",
    actions: [{ label: "Read Risk View", to: "/risk" }],
  },
  compliance: {
    title: "Compliance",
    copy: "A real financial product would need stronger audit logging, provider agreements, data retention policy, and legal review before serving real users.",
    actions: [{ label: "View Risk Analysis", to: "/risk" }],
  },
};

function InfoPage() {
  const { slug = "features" } = useParams();
  const page = content[slug] || content.features;

  return (
    <>
      <Navbar />
      <main style={styles.page}>
        <section style={styles.card}>
          <span style={styles.badge}>FinanceAI</span>
          <h1 style={styles.heading}>{page.title}</h1>
          <p style={styles.copy}>{page.copy}</p>
          <div style={styles.actions}>
            {page.actions.map((action) => (
              <Link key={action.to} to={action.to} style={styles.button}>
                {action.label}
              </Link>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

const styles = {
  page: {
    maxWidth: "980px",
    margin: "0 auto",
    padding: "40px 20px 24px",
    minHeight: "60vh",
  },
  card: {
    background: "#ffffff",
    border: "1px solid #dbeafe",
    borderRadius: "22px",
    padding: "32px",
    boxShadow: "0 14px 30px rgba(15, 23, 42, 0.06)",
  },
  badge: {
    display: "inline-flex",
    padding: "6px 12px",
    borderRadius: "999px",
    background: "#eef2ff",
    color: "#4338ca",
    fontSize: "12px",
    fontWeight: "700",
    textTransform: "uppercase",
  },
  heading: {
    margin: "18px 0 0",
    fontSize: "42px",
    color: "#0f172a",
  },
  copy: {
    margin: "14px 0 0",
    maxWidth: "760px",
    color: "#475569",
    fontSize: "16px",
    lineHeight: 1.7,
  },
  actions: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    marginTop: "24px",
  },
  button: {
    padding: "12px 16px",
    borderRadius: "12px",
    background: "#0f172a",
    color: "#ffffff",
    textDecoration: "none",
    fontWeight: "700",
  },
};

export default InfoPage;
