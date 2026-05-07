import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { requestJson, setAuthSession } from "../lib/api";
import useViewport from "../lib/useViewport";

function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isTablet, isMobile } = useViewport();
  const [mode, setMode] = useState("signup");
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    goal: "Long-term growth",
  });
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (location.pathname === "/login") {
      setMode("login");
    } else if (location.pathname === "/signup") {
      setMode("signup");
    }
  }, [location.pathname]);

  function updateField(event) {
    setFormData((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    const path = mode === "signup" ? "/api/auth/signup" : "/api/auth/login";
    const payload =
      mode === "signup"
        ? formData
        : {
            email: formData.email,
            password: formData.password,
          };

    try {
      const result = await requestJson(path, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setAuthSession({ token: result.token, user: result.user });
      setMessage(result.message || "Success");
      setTimeout(() => navigate("/dashboard"), 500);
    } catch (error) {
      setMessage(error.message || "Unable to complete authentication.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Navbar />

      <main style={{ ...styles.page, ...(isMobile ? styles.pageMobile : {}) }}>
        <section
          style={{
            ...styles.shell,
            ...(isTablet ? styles.shellTablet : {}),
          }}
        >
          <div style={styles.infoPanel}>
            <span style={styles.badge}>Welcome to FinanceAI</span>
            <h1 style={{ ...styles.heading, ...(isMobile ? styles.headingMobile : {}) }}>
              Start managing your investments with a cleaner workflow
            </h1>
            <p style={styles.copy}>
              Create an account to upload transactions, track portfolio
              performance, analyze risk, and explore AI-powered recommendations.
            </p>

            <div style={styles.infoList}>
              <div style={styles.infoItem}>Unified dashboard for portfolio tracking</div>
              <div style={styles.infoItem}>Risk analysis and report generation</div>
              <div style={styles.infoItem}>AI suggestions tailored to your portfolio</div>
            </div>
          </div>

          <div style={{ ...styles.formPanel, ...(isMobile ? styles.formPanelMobile : {}) }}>
            <div style={styles.tabRow}>
              <button
                type="button"
                style={{ ...styles.tab, ...(mode === "signup" ? styles.activeTab : {}) }}
                onClick={() => setMode("signup")}
              >
                Sign Up
              </button>
              <button
                type="button"
                style={{ ...styles.tab, ...(mode === "login" ? styles.activeTab : {}) }}
                onClick={() => setMode("login")}
              >
                Login
              </button>
            </div>

            <form style={styles.form} onSubmit={handleSubmit}>
              {mode === "signup" ? (
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Full Name</label>
                  <input
                    name="full_name"
                    style={styles.input}
                    placeholder="Enter your full name"
                    value={formData.full_name}
                    onChange={updateField}
                  />
                </div>
              ) : null}

              <div style={styles.fieldGroup}>
                <label style={styles.label}>Email</label>
                <input
                  name="email"
                  style={styles.input}
                  placeholder="Enter your email"
                  type="email"
                  value={formData.email}
                  onChange={updateField}
                />
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>Password</label>
                <input
                  name="password"
                  style={styles.input}
                  placeholder={mode === "signup" ? "Create a password" : "Enter your password"}
                  type="password"
                  value={formData.password}
                  onChange={updateField}
                />
              </div>

              {mode === "signup" ? (
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Investor Goal</label>
                  <select
                    name="goal"
                    style={styles.input}
                    value={formData.goal}
                    onChange={updateField}
                  >
                    <option>Long-term growth</option>
                    <option>Balanced portfolio</option>
                    <option>Income investing</option>
                  </select>
                </div>
              ) : null}

              <button type="submit" style={styles.primaryButton} disabled={isSubmitting}>
                {isSubmitting
                  ? "Please wait..."
                  : mode === "signup"
                  ? "Create Account"
                  : "Login"}
              </button>
            </form>

            {message ? <p style={styles.message}>{message}</p> : null}

            <p style={styles.helperText}>
              Demo credentials: profile@financeai.app / demo1234
            </p>

            <p style={styles.helperText}>
              Ready to explore?{" "}
              <Link to={mode === "signup" ? "/login" : "/signup"} style={styles.helperLink}>
                {mode === "signup" ? "Switch to login" : "Create a new account"}
              </Link>
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

const styles = {
  page: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "36px 20px 0",
  },
  pageMobile: {
    paddingTop: "28px",
  },
  shell: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) minmax(360px, 460px)",
    gap: "24px",
    alignItems: "stretch",
  },
  shellTablet: {
    gridTemplateColumns: "1fr",
  },
  infoPanel: {
    padding: "36px",
    borderRadius: "24px",
    background: "linear-gradient(160deg, #0f172a 0%, #1e3a8a 100%)",
    color: "#ffffff",
    boxShadow: "0 24px 50px rgba(15, 23, 42, 0.18)",
  },
  badge: {
    display: "inline-flex",
    padding: "7px 12px",
    borderRadius: "999px",
    background: "rgba(255,255,255,0.14)",
    fontSize: "12px",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  },
  heading: {
    margin: "22px 0 0",
    fontSize: "40px",
    lineHeight: 1.08,
  },
  headingMobile: {
    fontSize: "32px",
  },
  copy: {
    margin: "16px 0 0",
    fontSize: "16px",
    lineHeight: 1.75,
    color: "rgba(255,255,255,0.8)",
    maxWidth: "540px",
  },
  infoList: {
    display: "grid",
    gap: "12px",
    marginTop: "30px",
  },
  infoItem: {
    padding: "14px 16px",
    borderRadius: "14px",
    background: "rgba(255,255,255,0.1)",
    fontSize: "15px",
  },
  formPanel: {
    padding: "28px",
    borderRadius: "24px",
    background: "rgba(255,255,255,0.96)",
    border: "1px solid rgba(203, 213, 225, 0.85)",
    boxShadow: "0 14px 30px rgba(15, 23, 42, 0.06)",
  },
  formPanelMobile: {
    padding: "22px",
  },
  tabRow: {
    display: "flex",
    gap: "10px",
    marginBottom: "24px",
  },
  tab: {
    flex: 1,
    padding: "12px 16px",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    background: "#f8fafc",
    color: "#475569",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
  },
  activeTab: {
    background: "#0f172a",
    borderColor: "#0f172a",
    color: "#ffffff",
  },
  form: {
    display: "grid",
    gap: "18px",
  },
  fieldGroup: {
    display: "grid",
    gap: "8px",
  },
  label: {
    fontSize: "14px",
    color: "#334155",
    fontWeight: "600",
  },
  input: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: "12px",
    border: "1px solid #dbe4f0",
    background: "#f8fafc",
    fontSize: "15px",
    color: "#0f172a",
    boxSizing: "border-box",
  },
  primaryButton: {
    marginTop: "8px",
    padding: "14px 18px",
    borderRadius: "12px",
    border: "none",
    background: "#0f172a",
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
  },
  message: {
    margin: "16px 0 0",
    color: "#2563eb",
    fontSize: "14px",
  },
  helperText: {
    margin: "18px 0 0",
    color: "#64748b",
    fontSize: "14px",
  },
  helperLink: {
    color: "#2563eb",
    textDecoration: "none",
    fontWeight: "600",
  },
};

export default AuthPage;
