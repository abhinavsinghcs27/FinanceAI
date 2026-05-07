import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { downloadFile, requestJson } from "../lib/api";
import useViewport from "../lib/useViewport";

const defaultSections = [
  { title: "Portfolio Summary", subtitle: "Overview and key metrics", checked: true },
  { title: "Performance Analysis", subtitle: "Returns and benchmarks", checked: true },
  { title: "Current Holdings", subtitle: "Complete positions list", checked: true },
  { title: "Transaction History", subtitle: "Buy/sell activity", checked: false },
  { title: "Risk Analysis", subtitle: "Risk metrics and scores", checked: false },
  { title: "Tax Summary", subtitle: "Capital gains/losses", checked: false },
  { title: "Dividend Income", subtitle: "Dividend payments received", checked: false },
];

const defaultReportsData = {
  templates: [
    { title: "Monthly Summary", subtitle: "Performance and holdings" },
    { title: "Tax Report", subtitle: "Capital gains and losses" },
    { title: "Quarterly Review", subtitle: "Comprehensive analysis" },
    { title: "Transaction Export", subtitle: "All trades and activity" },
  ],
  recent: [
    { title: "Portfolio Report - January 2026", meta: "2026-02-01 | 2.4 MB" },
    { title: "Tax Summary - 2025", meta: "2026-01-15 | 856 KB" },
    { title: "Q4 2025 Performance Report", meta: "2026-01-02 | 3.1 MB" },
  ],
  scheduled: {
    title: "Monthly Performance",
    subtitle: "Every 1st of the month",
    status: "Active",
  },
};

function ReportsPage() {
  const { isTablet, isMobile } = useViewport();
  const [sections, setSections] = useState(defaultSections);
  const [reportsData, setReportsData] = useState(defaultReportsData);
  const [formData, setFormData] = useState({
    format: "PDF Document",
    date_range: "Last Month",
  });
  const [message, setMessage] = useState("");
  const [aiInsight, setAiInsight] = useState(null);

  useEffect(() => {
    requestJson("/api/reports")
      .then((data) => setReportsData(data))
      .catch(() => {});
  }, []);

  function toggleSection(title) {
    setSections((current) =>
      current.map((section) =>
        section.title === title
          ? { ...section, checked: !section.checked }
          : section
      )
    );
  }

  function updateField(event) {
    setFormData((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  }

  async function generateReport() {
    const activeSections = sections
      .filter((section) => section.checked)
      .map((section) => section.title);

    try {
      const result = await requestJson("/api/reports/generate", {
        method: "POST",
        body: JSON.stringify({
          format: formData.format,
          date_range: formData.date_range,
          sections: activeSections,
        }),
      });
      setReportsData((current) => ({
        ...current,
        recent: [result.report, ...current.recent],
      }));
      setMessage(result.message);
      
      // Automatically download the report after it's generated
      await downloadReport(result.report);

      requestJson("/api/ai/report-insights", {
        method: "POST",
        body: JSON.stringify({
          format: formData.format,
          date_range: formData.date_range,
          sections: activeSections,
        }),
      })
        .then((data) => setAiInsight(data))
        .catch(() => {});
    } catch (error) {
      setMessage(error.message || "Unable to generate report.");
    }
  }

  async function emailReport() {
    try {
      const result = await requestJson("/api/reports/email", {
        method: "POST",
        body: JSON.stringify({
          email: "profile@financeai.app",
          report_name: "FinanceAI Demo Report",
        }),
      });
      setMessage(result.message);
    } catch (error) {
      setMessage(error.message || "Unable to queue email delivery.");
    }
  }

  function addSchedule() {
    setReportsData((current) => ({
      ...current,
      scheduled: {
        title: `${formData.date_range} ${formData.format}`,
        subtitle: "Every 1st of the month",
        status: "Active",
      },
    }));
    setMessage("Report schedule activated for the selected format and date range.");
  }

  function contactSupport() {
    setMessage("Support request prepared. Email support@financeai.app with your custom report requirements.");
    window.location.href = "mailto:support@financeai.app?subject=Custom%20FinanceAI%20Report";
  }

  async function downloadReport(report) {
    if (!report.id) {
      setMessage("This older demo report does not have a generated file yet.");
      return;
    }
    try {
      await downloadFile(`/api/reports/${report.id}/download`, report.title);
      setMessage("Report download started.");
    } catch (error) {
      setMessage(error.message || "Unable to download report.");
    }
  }

  const selectedCount = sections.filter((section) => section.checked).length;

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
          <div>
            <span style={styles.heroBadge}>Export Center</span>
            <h1 style={{ ...styles.heading, ...(isMobile ? styles.headingMobile : {}) }}>
              Reports and Export
            </h1>
            <p style={styles.subheading}>
              Generate polished portfolio reports for your presentation, review,
              or client-ready export workflow.
            </p>
          </div>

          <div style={{ ...styles.heroStatCard, ...(isMobile ? styles.heroStatCardMobile : {}) }}>
            <span style={styles.heroStatLabel}>Selected sections</span>
            <strong style={styles.heroStatValue}>{selectedCount}</strong>
            <span style={styles.heroStatMeta}>{formData.format}</span>
          </div>
        </section>

        {message ? <p style={styles.message}>{message}</p> : null}

        {aiInsight ? (
          <section style={styles.aiCard}>
            <div style={styles.aiHeader}>
              <div>
                <h2 style={styles.cardTitle}>FinanceAI Report Summary</h2>
                <p style={styles.cardSubtitle}>
                  {aiInsight.source === "openai" ? "Generated with live AI" : "Generated with local AI rules"}
                </p>
              </div>
            </div>
            <p style={styles.aiSummary}>{aiInsight.summary}</p>
            <div style={styles.aiActions}>
              {(aiInsight.key_points || []).map((point) => (
                <p key={point} style={styles.aiAction}>{point}</p>
              ))}
            </div>
            <p style={styles.aiDisclaimer}>{aiInsight.disclaimer}</p>
          </section>
        ) : null}

        <section style={styles.summaryGrid}>
          <SummaryCard label="Recent reports" value={String(reportsData.recent.length)} tone="#2563eb" />
          <SummaryCard label="Templates" value={String(reportsData.templates.length)} tone="#16a34a" />
          <SummaryCard label="Delivery mode" value={reportsData.scheduled.status} tone="#7c3aed" />
        </section>

        <section
          style={{
            ...styles.topGrid,
            ...(isTablet ? styles.topGridTablet : {}),
          }}
        >
          <div style={{ ...styles.card, ...styles.configureCard }}>
            <div style={styles.cardHeaderRow}>
              <div>
                <h2 style={styles.cardTitle}>Configure Report</h2>
                <p style={styles.cardSubtitle}>
                  Select the sections and format for your report
                </p>
              </div>
              <span style={styles.previewPill}>Presentation Ready</span>
            </div>

            <div style={styles.sectionBlock}>
              <h3 style={styles.sectionHeading}>Report Sections</h3>

              <div style={styles.sectionList}>
                {sections.map((section) => (
                  <label
                    key={section.title}
                    style={{
                      ...styles.checkRow,
                      ...(section.checked ? styles.checkRowActive : {}),
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={section.checked}
                      onChange={() => toggleSection(section.title)}
                      style={styles.checkbox}
                    />
                    <div>
                      <p style={styles.checkTitle}>{section.title}</p>
                      <p style={styles.checkSubtitle}>{section.subtitle}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div style={styles.divider}></div>

            <div style={{ ...styles.formGrid, ...(isMobile ? styles.formGridMobile : {}) }}>
              <div>
                <label style={styles.fieldLabel}>Export Format</label>
                <select
                  name="format"
                  style={styles.select}
                  value={formData.format}
                  onChange={updateField}
                >
                  <option>PDF Document</option>
                  <option>Excel Spreadsheet</option>
                  <option>CSV Export</option>
                </select>
              </div>

              <div>
                <label style={styles.fieldLabel}>Date Range</label>
                <select
                  name="date_range"
                  style={styles.select}
                  value={formData.date_range}
                  onChange={updateField}
                >
                  <option>Last Month</option>
                  <option>Last Quarter</option>
                  <option>Last Year</option>
                </select>
              </div>
            </div>

            <div style={{ ...styles.actionRow, ...(isMobile ? styles.actionRowMobile : {}) }}>
              <button type="button" style={styles.primaryButton} onClick={generateReport}>
                Export Report
              </button>
              <button type="button" style={styles.secondaryButton} onClick={emailReport}>
                Email Report
              </button>
            </div>
          </div>

          <div style={styles.sideColumn}>
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>Quick Templates</h2>
              <p style={styles.cardSubtitle}>Pre-configured report layouts</p>

              <div style={styles.templateList}>
                {reportsData.templates.map((template, index) => (
                  <div key={template.title} style={styles.templateItem}>
                    <div
                      style={{
                        ...styles.templateIcon,
                        background: templateColors[index % templateColors.length].bg,
                        color: templateColors[index % templateColors.length].color,
                      }}
                    >
                      {template.title.charAt(0)}
                    </div>
                    <div>
                      <p style={styles.templateTitle}>{template.title}</p>
                      <p style={styles.templateSubtitle}>{template.subtitle}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={styles.card}>
              <h2 style={styles.cardTitle}>Scheduled Reports</h2>
              <p style={styles.cardSubtitle}>Automated delivery overview</p>

              <div style={styles.scheduleCard}>
                <div style={styles.scheduleIcon}>OK</div>
                <div>
                  <p style={styles.scheduleTitle}>{reportsData.scheduled.title}</p>
                  <p style={styles.scheduleSubtitle}>{reportsData.scheduled.subtitle}</p>
                </div>
                <span style={styles.activeBadge}>{reportsData.scheduled.status}</span>
              </div>

              <button type="button" style={styles.scheduleButton} onClick={addSchedule}>
                Add Schedule
              </button>
            </div>

            <div style={{ ...styles.card, ...styles.supportCard }}>
              <div style={styles.supportIcon}>R</div>
              <h2 style={styles.supportTitle}>Need a custom report?</h2>
              <p style={styles.supportText}>
                Contact support for specialized reporting options
              </p>
              <button type="button" style={styles.secondaryButton} onClick={contactSupport}>
                Contact Support
              </button>
            </div>
          </div>
        </section>

        <section style={{ ...styles.card, ...styles.recentCard }}>
          <div style={styles.recentHeader}>
            <div>
              <h2 style={styles.cardTitle}>Recent Reports</h2>
              <p style={styles.cardSubtitle}>Previously generated exports</p>
            </div>
            <span style={styles.historyPill}>Latest activity</span>
          </div>

          <div style={styles.recentList}>
            {reportsData.recent.map((report, index) => (
              <div key={`${report.title}-${index}`} style={styles.recentItem}>
                <div style={styles.recentMeta}>
                  <div
                    style={{
                      ...styles.recentIcon,
                      background: templateColors[index % templateColors.length].bg,
                      color: templateColors[index % templateColors.length].color,
                    }}
                  >
                    R
                  </div>
                  <div>
                    <p style={styles.recentTitle}>{report.title}</p>
                    <p style={styles.recentSubtitle}>{report.meta}</p>
                  </div>
                </div>
                <button type="button" style={styles.downloadButton} onClick={() => downloadReport(report)}>
                  Get
                </button>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

function SummaryCard({ label, value, tone }) {
  return (
    <div style={styles.summaryCard}>
      <span style={styles.summaryLabel}>{label}</span>
      <strong style={{ ...styles.summaryValue, color: tone }}>{value}</strong>
    </div>
  );
}

const templateColors = [
  { color: "#2563eb", bg: "#dbeafe" },
  { color: "#16a34a", bg: "#dcfce7" },
  { color: "#9333ea", bg: "#f3e8ff" },
  { color: "#ea580c", bg: "#ffedd5" },
];

const styles = {
  page: {
    maxWidth: "1220px",
    margin: "0 auto",
    padding: "28px 20px 0",
  },
  pageMobile: {
    paddingTop: "24px",
  },
  hero: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: "20px",
    marginBottom: "20px",
    flexWrap: "wrap",
  },
  heroTablet: {
    alignItems: "stretch",
  },
  heroMobile: {
    gap: "16px",
  },
  heroBadge: {
    display: "inline-flex",
    padding: "6px 12px",
    borderRadius: "999px",
    background: "#e0f2fe",
    color: "#0369a1",
    fontSize: "12px",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    marginBottom: "14px",
  },
  heading: {
    margin: 0,
    fontSize: "44px",
    lineHeight: 1.05,
    color: "#0f172a",
  },
  headingMobile: {
    fontSize: "34px",
  },
  subheading: {
    margin: "10px 0 0",
    fontSize: "16px",
    color: "#64748b",
    maxWidth: "700px",
    lineHeight: 1.65,
  },
  heroStatCard: {
    minWidth: "220px",
    padding: "18px 20px",
    borderRadius: "22px",
    background: "linear-gradient(135deg, #0f172a 0%, #1d4ed8 100%)",
    color: "#ffffff",
    boxShadow: "0 18px 40px rgba(15, 23, 42, 0.18)",
  },
  heroStatCardMobile: {
    width: "100%",
  },
  heroStatLabel: {
    display: "block",
    fontSize: "12px",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.74)",
  },
  heroStatValue: {
    display: "block",
    marginTop: "8px",
    fontSize: "34px",
    lineHeight: 1,
  },
  heroStatMeta: {
    display: "block",
    marginTop: "8px",
    fontSize: "13px",
    color: "rgba(255,255,255,0.8)",
  },
  message: {
    margin: "0 0 16px",
    color: "#2563eb",
    fontSize: "14px",
  },
  aiCard: {
    marginBottom: "18px",
    padding: "22px 24px",
    borderRadius: "22px",
    background: "#ffffff",
    border: "1px solid #bfdbfe",
    boxShadow: "0 12px 28px rgba(15, 23, 42, 0.05)",
  },
  aiHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    alignItems: "flex-start",
  },
  aiSummary: {
    margin: "14px 0 0",
    color: "#334155",
    lineHeight: 1.65,
  },
  aiActions: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
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
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "16px",
    marginBottom: "22px",
  },
  summaryCard: {
    background: "rgba(255, 255, 255, 0.96)",
    border: "1px solid rgba(203, 213, 225, 0.85)",
    borderRadius: "18px",
    padding: "18px 20px",
    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.05)",
  },
  summaryLabel: {
    display: "block",
    fontSize: "13px",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  },
  summaryValue: {
    display: "block",
    marginTop: "10px",
    fontSize: "26px",
  },
  topGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.8fr) 390px",
    gap: "24px",
    alignItems: "start",
  },
  topGridTablet: {
    gridTemplateColumns: "1fr",
  },
  sideColumn: {
    display: "grid",
    gap: "24px",
  },
  card: {
    background: "rgba(255, 255, 255, 0.96)",
    border: "1px solid rgba(203, 213, 225, 0.85)",
    borderRadius: "22px",
    padding: "24px",
    boxShadow: "0 14px 30px rgba(15, 23, 42, 0.06)",
  },
  configureCard: {
    background:
      "radial-gradient(circle at top left, rgba(219, 234, 254, 0.55), rgba(255, 255, 255, 0.97) 45%)",
  },
  cardHeaderRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    alignItems: "flex-start",
    flexWrap: "wrap",
  },
  previewPill: {
    padding: "8px 12px",
    borderRadius: "999px",
    background: "#eef2ff",
    color: "#4338ca",
    fontSize: "13px",
    fontWeight: "700",
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
  sectionBlock: {
    marginTop: "28px",
  },
  sectionHeading: {
    margin: 0,
    fontSize: "16px",
    color: "#0f172a",
  },
  sectionList: {
    display: "grid",
    gap: "14px",
    marginTop: "22px",
  },
  checkRow: {
    display: "flex",
    gap: "12px",
    alignItems: "flex-start",
    padding: "14px 16px",
    borderRadius: "16px",
    background: "rgba(255,255,255,0.72)",
    border: "1px solid rgba(226, 232, 240, 0.85)",
  },
  checkRowActive: {
    borderColor: "#bfdbfe",
    background: "#eff6ff",
    boxShadow: "inset 0 0 0 1px rgba(191, 219, 254, 0.7)",
  },
  checkbox: {
    width: "18px",
    height: "18px",
    marginTop: "3px",
    accentColor: "#050816",
    flexShrink: 0,
  },
  checkTitle: {
    margin: 0,
    fontSize: "15px",
    color: "#0f172a",
    fontWeight: "600",
  },
  checkSubtitle: {
    margin: "4px 0 0",
    fontSize: "14px",
    color: "#64748b",
    lineHeight: 1.5,
  },
  divider: {
    height: "1px",
    background: "#e2e8f0",
    margin: "28px 0",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "18px",
  },
  formGridMobile: {
    gridTemplateColumns: "1fr",
  },
  fieldLabel: {
    display: "block",
    marginBottom: "10px",
    fontSize: "15px",
    color: "#0f172a",
    fontWeight: "600",
  },
  select: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: "14px",
    border: "1px solid #e2e8f0",
    background: "#f8fafc",
    fontSize: "15px",
    color: "#0f172a",
    outline: "none",
  },
  actionRow: {
    display: "grid",
    gridTemplateColumns: "1.5fr 1fr",
    gap: "14px",
    marginTop: "18px",
  },
  actionRowMobile: {
    gridTemplateColumns: "1fr",
  },
  primaryButton: {
    padding: "14px 16px",
    borderRadius: "12px",
    border: "none",
    background: "#050816",
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
  },
  secondaryButton: {
    padding: "14px 16px",
    borderRadius: "12px",
    border: "1px solid #d4d4d8",
    background: "#ffffff",
    color: "#0f172a",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
  },
  templateList: {
    display: "grid",
    gap: "12px",
    marginTop: "22px",
  },
  templateItem: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
    padding: "12px 14px",
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    background: "#ffffff",
  },
  templateIcon: {
    width: "34px",
    height: "34px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
    fontWeight: "700",
    flexShrink: 0,
  },
  templateTitle: {
    margin: 0,
    fontSize: "15px",
    color: "#0f172a",
    fontWeight: "600",
  },
  templateSubtitle: {
    margin: "3px 0 0",
    fontSize: "14px",
    color: "#64748b",
  },
  scheduleCard: {
    display: "grid",
    gridTemplateColumns: "32px 1fr auto",
    gap: "12px",
    alignItems: "center",
    marginTop: "24px",
    padding: "16px",
    borderRadius: "14px",
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
  },
  scheduleIcon: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    border: "2px solid #16a34a",
    color: "#16a34a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "10px",
    fontWeight: "700",
  },
  scheduleTitle: {
    margin: 0,
    fontSize: "15px",
    color: "#0f172a",
  },
  scheduleSubtitle: {
    margin: "4px 0 0",
    fontSize: "14px",
    color: "#475569",
  },
  activeBadge: {
    padding: "6px 10px",
    borderRadius: "999px",
    background: "#dcfce7",
    color: "#15803d",
    fontSize: "13px",
    fontWeight: "700",
  },
  scheduleButton: {
    width: "100%",
    marginTop: "16px",
    padding: "12px 16px",
    borderRadius: "12px",
    border: "1px solid #d4d4d8",
    background: "#ffffff",
    color: "#0f172a",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
  },
  supportCard: {
    textAlign: "center",
    justifyItems: "center",
  },
  supportIcon: {
    width: "56px",
    height: "56px",
    borderRadius: "50%",
    background: "#e2e8f0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "26px",
    margin: "4px auto 16px",
  },
  supportTitle: {
    margin: 0,
    fontSize: "18px",
    color: "#0f172a",
  },
  supportText: {
    margin: "10px 0 20px",
    fontSize: "14px",
    color: "#64748b",
    lineHeight: 1.6,
  },
  recentCard: {
    marginTop: "24px",
  },
  recentHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    alignItems: "flex-start",
    flexWrap: "wrap",
  },
  historyPill: {
    padding: "8px 12px",
    borderRadius: "999px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    color: "#475569",
    fontSize: "13px",
    fontWeight: "700",
  },
  recentList: {
    display: "grid",
    gap: "14px",
    marginTop: "22px",
  },
  recentItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    padding: "16px",
    borderRadius: "16px",
    background: "#f8fafc",
  },
  recentMeta: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
    minWidth: 0,
  },
  recentIcon: {
    width: "40px",
    height: "40px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px",
    fontWeight: "700",
    flexShrink: 0,
  },
  recentTitle: {
    margin: 0,
    fontSize: "15px",
    color: "#0f172a",
    fontWeight: "600",
  },
  recentSubtitle: {
    margin: "4px 0 0",
    fontSize: "14px",
    color: "#64748b",
  },
  downloadButton: {
    minWidth: "56px",
    height: "36px",
    borderRadius: "10px",
    border: "none",
    background: "#ffffff",
    color: "#0f172a",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(15, 23, 42, 0.06)",
  },
};

export default ReportsPage;
