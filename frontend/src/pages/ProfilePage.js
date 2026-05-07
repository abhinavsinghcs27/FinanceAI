import { useEffect, useState } from "react";
import { getAuthToken, requestJson, setAuthSession } from "../lib/api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import useViewport from "../lib/useViewport";

const defaultProfile = {
  full_name: "Portfolio User",
  email: "profile@financeai.app",
  plan: "Starter",
  member_since: "March 2026",
  risk_preference: "Moderate",
  primary_goal: "Long-term growth",
  base_currency: "USD",
  reports: "Monthly summary enabled",
};

function ProfilePage() {
  const { isTablet, isMobile } = useViewport();
  const [profile, setProfile] = useState(defaultProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    requestJson("/api/profile/me")
      .then((data) => setProfile(data))
      .catch(() => {});
  }, []);

  function updateField(event) {
    setProfile((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  }

  async function saveProfile() {
    try {
      const result = await requestJson("/api/profile/me", {
        method: "PUT",
        body: JSON.stringify({
          full_name: profile.full_name,
          email: profile.email,
          risk_preference: profile.risk_preference,
          primary_goal: profile.primary_goal,
          base_currency: profile.base_currency,
          reports: profile.reports,
        }),
      });
      setProfile(result.profile);
      setMessage("Profile updated");
      setAuthSession({ token: getAuthToken(), user: result.profile });
    } catch (error) {
      setMessage(error.message || "Unable to save profile.");
    } finally {
      setIsEditing(false);
    }
  }

  const settings = [
    { label: "Risk Preference", key: "risk_preference" },
    { label: "Primary Goal", key: "primary_goal" },
    { label: "Base Currency", key: "base_currency" },
    { label: "Reports", key: "reports" },
  ];

  return (
    <>
      <Navbar />

      <main style={{ ...styles.page, ...(isMobile ? styles.pageMobile : {}) }}>
        <section style={styles.hero}>
          <div>
            <h1 style={styles.heading}>Profile</h1>
            <p style={styles.subheading}>
              Manage your account details and investing preferences
            </p>
          </div>
          <button
            type="button"
            style={styles.editButton}
            onClick={() => (isEditing ? saveProfile() : setIsEditing(true))}
          >
            {isEditing ? "Save Profile" : "Edit Profile"}
          </button>
        </section>

        {message ? <p style={styles.message}>{message}</p> : null}

        <section style={{ ...styles.grid, ...(isTablet ? styles.gridTablet : {}) }}>
          <div style={styles.card}>
            <div style={styles.profileHeader}>
              <div style={styles.avatar}>
                {profile.full_name?.charAt(0)?.toUpperCase() || "P"}
              </div>
              <div>
                <h2 style={styles.name}>{profile.full_name}</h2>
                <p style={styles.email}>{profile.email}</p>
              </div>
            </div>

            <div style={styles.divider}></div>

            <div style={styles.fieldGrid}>
              <FieldCard
                label="Full Name"
                name="full_name"
                value={profile.full_name}
                isEditing={isEditing}
                onChange={updateField}
              />
              <FieldCard
                label="Email"
                name="email"
                value={profile.email}
                isEditing={isEditing}
                onChange={updateField}
              />
              <StaticField label="Member Since" value={profile.member_since} />
              <StaticField label="Plan" value={profile.plan} />
            </div>
          </div>

          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Investor Preferences</h2>
            <p style={styles.cardSubtitle}>
              These settings help tailor dashboards and AI suggestions
            </p>

            <div style={styles.preferenceList}>
              {settings.map((item) => (
                <div key={item.key} style={styles.preferenceRow}>
                  <span style={styles.preferenceLabel}>{item.label}</span>
                  {isEditing ? (
                    <input
                      name={item.key}
                      value={profile[item.key]}
                      onChange={updateField}
                      style={styles.preferenceInput}
                    />
                  ) : (
                    <span style={styles.preferenceValue}>{profile[item.key]}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

function FieldCard({ label, name, value, isEditing, onChange }) {
  return (
    <div style={styles.field}>
      <span style={styles.fieldLabel}>{label}</span>
      {isEditing ? (
        <input name={name} value={value} onChange={onChange} style={styles.fieldInput} />
      ) : (
        <span style={styles.fieldValue}>{value}</span>
      )}
    </div>
  );
}

function StaticField({ label, value }) {
  return (
    <div style={styles.field}>
      <span style={styles.fieldLabel}>{label}</span>
      <span style={styles.fieldValue}>{value}</span>
    </div>
  );
}

const styles = {
  page: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "32px 20px 0",
  },
  pageMobile: {
    paddingTop: "24px",
  },
  hero: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: "20px",
    marginBottom: "18px",
    flexWrap: "wrap",
  },
  heading: {
    margin: 0,
    fontSize: "44px",
    color: "#0f172a",
  },
  subheading: {
    margin: "10px 0 0",
    color: "#64748b",
    fontSize: "16px",
  },
  editButton: {
    padding: "12px 16px",
    borderRadius: "12px",
    border: "1px solid #d4d4d8",
    background: "#ffffff",
    color: "#0f172a",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
  },
  message: {
    margin: "0 0 18px",
    color: "#2563eb",
    fontSize: "14px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.2fr) minmax(320px, 0.8fr)",
    gap: "24px",
  },
  gridTablet: {
    gridTemplateColumns: "1fr",
  },
  card: {
    background: "rgba(255,255,255,0.96)",
    border: "1px solid rgba(203, 213, 225, 0.85)",
    borderRadius: "22px",
    padding: "24px",
    boxShadow: "0 14px 30px rgba(15, 23, 42, 0.06)",
  },
  profileHeader: {
    display: "flex",
    gap: "16px",
    alignItems: "center",
  },
  avatar: {
    width: "68px",
    height: "68px",
    borderRadius: "20px",
    background: "linear-gradient(135deg, #1d4ed8 0%, #7c3aed 100%)",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "28px",
    fontWeight: "700",
  },
  name: {
    margin: 0,
    fontSize: "24px",
    color: "#0f172a",
  },
  email: {
    margin: "6px 0 0",
    color: "#64748b",
    fontSize: "15px",
  },
  divider: {
    height: "1px",
    background: "#e2e8f0",
    margin: "24px 0",
  },
  fieldGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "18px",
  },
  field: {
    display: "grid",
    gap: "6px",
    padding: "16px",
    borderRadius: "16px",
    background: "#f8fafc",
  },
  fieldLabel: {
    fontSize: "13px",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  fieldValue: {
    color: "#0f172a",
    fontSize: "16px",
    fontWeight: "600",
  },
  fieldInput: {
    padding: "10px 12px",
    borderRadius: "10px",
    border: "1px solid #dbe4f0",
    background: "#ffffff",
    fontSize: "15px",
    color: "#0f172a",
  },
  cardTitle: {
    margin: 0,
    fontSize: "20px",
    color: "#0f172a",
  },
  cardSubtitle: {
    margin: "8px 0 0",
    color: "#64748b",
    fontSize: "15px",
  },
  preferenceList: {
    display: "grid",
    gap: "14px",
    marginTop: "22px",
  },
  preferenceRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    padding: "14px 16px",
    borderRadius: "16px",
    background: "#f8fafc",
    alignItems: "center",
  },
  preferenceLabel: {
    color: "#475569",
    fontSize: "15px",
  },
  preferenceValue: {
    color: "#0f172a",
    fontSize: "15px",
    fontWeight: "600",
    textAlign: "right",
  },
  preferenceInput: {
    width: "170px",
    padding: "10px 12px",
    borderRadius: "10px",
    border: "1px solid #dbe4f0",
    background: "#ffffff",
    fontSize: "14px",
    color: "#0f172a",
  },
};

export default ProfilePage;
