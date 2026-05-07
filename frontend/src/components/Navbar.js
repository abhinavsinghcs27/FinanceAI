import { Link, useLocation, useNavigate } from "react-router-dom";
import { clearAuthSession, getStoredUser, requestJson } from "../lib/api";
import useViewport from "../lib/useViewport";

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = getStoredUser();
  const { isTablet, isMobile } = useViewport();

  const navLinks = [
    { to: "/", label: "Home" },
    { to: "/dashboard", label: "Dashboard" },
    { to: "/upload", label: "Upload" },
    { to: "/risk", label: "Risk Analysis" },
    { to: "/stocks", label: "Recommendations" },
    { to: "/assistant", label: "AI Assistant" },
    { to: "/reports", label: "Reports" },
  ];

  async function handleLogout() {
    try {
      await requestJson("/api/auth/logout", { method: "POST" });
    } catch (error) {
    } finally {
      clearAuthSession();
      navigate("/auth");
    }
  }

  return (
    <div style={styles.wrapper}>
      <nav
        style={{
          ...styles.navbar,
          ...(isTablet ? styles.navbarTablet : {}),
          ...(isMobile ? styles.navbarMobile : {}),
        }}
      >
        <Link to="/" style={styles.brandLink}>
          <h2 style={styles.logo}>FinanceAI</h2>
        </Link>

        <div
          style={{
            ...styles.links,
            ...(isTablet ? styles.linksTablet : {}),
            ...(isMobile ? styles.linksMobile : {}),
          }}
        >
          {navLinks.map((link) => {
            const isActive = location.pathname === link.to;

            return (
              <Link
                key={link.to}
                to={link.to}
                style={{
                  ...styles.link,
                  ...(isActive ? styles.activeLink : {}),
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {user ? (
          <div
            style={{
              ...styles.profileCluster,
              ...(isTablet ? styles.profileClusterTablet : {}),
              ...(isMobile ? styles.profileClusterMobile : {}),
            }}
          >
            <Link to="/profile" style={styles.profileLink}>
              <div style={styles.avatar}>
                {user.full_name?.charAt(0)?.toUpperCase() || "P"}
              </div>
              <div style={styles.profileText}>
                <span style={styles.profileLabel}>{user.full_name}</span>
                <span style={styles.profileSubtext}>{user.email}</span>
              </div>
            </Link>

            <button type="button" style={styles.logoutButton} onClick={handleLogout}>
              Logout
            </button>
          </div>
        ) : (
          <Link to="/auth" style={styles.authButton}>
            Sign In
          </Link>
        )}
      </nav>
    </div>
  );
}

const styles = {
  wrapper: {
    width: "100%",
    background: "white",
    borderBottom: "1px solid #eee",
    boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
  },
  navbar: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "15px 20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
  },
  navbarTablet: {
    flexWrap: "wrap",
    justifyContent: "center",
  },
  navbarMobile: {
    alignItems: "stretch",
    gap: "14px",
  },
  brandLink: {
    textDecoration: "none",
  },
  logo: {
    margin: 0,
    fontSize: "22px",
    fontWeight: "600",
    color: "#0f172a",
  },
  links: {
    display: "flex",
    gap: "30px",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  linksTablet: {
    width: "100%",
    order: 3,
    gap: "18px",
  },
  linksMobile: {
    justifyContent: "flex-start",
    gap: "14px",
  },
  link: {
    textDecoration: "none",
    color: "#334155",
    fontWeight: "500",
    transition: "all 0.3s",
    cursor: "pointer",
  },
  activeLink: {
    color: "#3b82f6",
    fontWeight: "600",
  },
  profileCluster: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  profileClusterTablet: {
    marginLeft: "auto",
  },
  profileClusterMobile: {
    width: "100%",
    justifyContent: "space-between",
  },
  profileLink: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    textDecoration: "none",
  },
  avatar: {
    width: "34px",
    height: "34px",
    borderRadius: "50%",
    background: "#0f172a",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
    fontWeight: "600",
    flexShrink: 0,
  },
  profileText: {
    display: "grid",
    gap: "2px",
  },
  profileLabel: {
    fontSize: "14px",
    color: "#0f172a",
    fontWeight: "600",
  },
  profileSubtext: {
    fontSize: "12px",
    color: "#64748b",
    maxWidth: "180px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  authButton: {
    textDecoration: "none",
    padding: "10px 14px",
    borderRadius: "10px",
    background: "#0f172a",
    color: "#ffffff",
    fontWeight: "600",
  },
  logoutButton: {
    padding: "10px 14px",
    borderRadius: "10px",
    border: "1px solid #dbe4f0",
    background: "#ffffff",
    color: "#0f172a",
    fontWeight: "600",
    cursor: "pointer",
  },
};

export default Navbar;
