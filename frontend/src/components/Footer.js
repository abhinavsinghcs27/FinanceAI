import { Link } from "react-router-dom";
import useViewport from "../lib/useViewport";

function Footer() {
  const { isTablet, isMobile } = useViewport();

  const sections = [
    {
      title: "Product",
      links: [
        { label: "Features", to: "/info/features" },
        { label: "Pricing", to: "/info/pricing" },
        { label: "Security", to: "/info/security" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "About", to: "/info/about" },
        { label: "Blog", to: "/info/blog" },
        { label: "Careers", to: "/info/careers" },
      ],
    },
    {
      title: "Legal",
      links: [
        { label: "Privacy", to: "/info/privacy" },
        { label: "Terms", to: "/info/terms" },
        { label: "Compliance", to: "/info/compliance" },
      ],
    },
  ];

  return (
    <footer style={styles.wrapper}>
      <div style={{ ...styles.inner, ...(isMobile ? styles.innerMobile : {}) }}>
        <div
          style={{
            ...styles.grid,
            ...(isTablet ? styles.gridTablet : {}),
            ...(isMobile ? styles.gridMobile : {}),
          }}
        >
          <div style={{ ...styles.brandColumn, ...(isTablet ? styles.brandColumnTablet : {}) }}>
            <div style={styles.brandRow}>
              <div style={styles.logoMark}>
                <span style={styles.logoLine}></span>
              </div>
              <span style={styles.brandName}>FinanceAI</span>
            </div>
            <p style={styles.brandText}>
              Intelligent financial management powered by AI
            </p>
          </div>

          {sections.map((section) => (
            <div key={section.title} style={styles.linkColumn}>
              <h4 style={styles.columnTitle}>{section.title}</h4>
              <div style={styles.linkList}>
                {section.links.map((link) => (
                  <Link key={link.label} to={link.to} style={styles.linkText}>
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={styles.divider}></div>
        <p style={styles.copyright}>© 2026 FinanceAI. All rights reserved.</p>
      </div>
    </footer>
  );
}

const styles = {
  wrapper: {
    width: "100%",
    marginTop: "48px",
    padding: "0 20px 28px",
  },
  inner: {
    maxWidth: "1200px",
    margin: "0 auto",
    background: "rgba(255, 255, 255, 0.92)",
    border: "1px solid rgba(203, 213, 225, 0.8)",
    borderRadius: "24px",
    padding: "28px 28px 18px",
    boxShadow: "0 14px 30px rgba(15, 23, 42, 0.05)",
  },
  innerMobile: {
    padding: "22px 18px 16px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "minmax(220px, 1.2fr) repeat(3, minmax(120px, 1fr))",
    gap: "28px",
  },
  gridTablet: {
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  },
  gridMobile: {
    gridTemplateColumns: "1fr",
    gap: "20px",
  },
  brandColumn: {
    maxWidth: "260px",
  },
  brandColumnTablet: {
    maxWidth: "100%",
  },
  brandRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "14px",
  },
  logoMark: {
    width: "30px",
    height: "30px",
    borderRadius: "9px",
    background: "#16213e",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  logoLine: {
    width: "13px",
    height: "13px",
    borderLeft: "2px solid white",
    borderTop: "2px solid white",
    transform: "rotate(45deg) skew(-12deg, -12deg)",
    marginTop: "2px",
  },
  brandName: {
    fontSize: "17px",
    fontWeight: "500",
    color: "#0f172a",
  },
  brandText: {
    margin: 0,
    color: "#475569",
    fontSize: "14px",
    lineHeight: 1.6,
  },
  linkColumn: {
    display: "grid",
    alignContent: "start",
    gap: "12px",
  },
  columnTitle: {
    margin: 0,
    fontSize: "15px",
    color: "#0f172a",
  },
  linkList: {
    display: "grid",
    gap: "10px",
  },
  linkText: {
    color: "#475569",
    fontSize: "14px",
    textDecoration: "none",
    cursor: "pointer",
  },
  divider: {
    height: "1px",
    background: "#e2e8f0",
    margin: "24px 0 18px",
  },
  copyright: {
    margin: 0,
    textAlign: "center",
    fontSize: "14px",
    color: "#475569",
  },
};

export default Footer;
