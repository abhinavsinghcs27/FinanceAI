import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { requestJson, uploadFile } from "../lib/api";

const defaultUploadData = {
  required_columns: [
    "Date (YYYY-MM-DD)",
    "Type (Buy/Sell)",
    "Symbol (Stock Ticker)",
    "Quantity (Number of shares)",
    "Price (Price per share)",
  ],
  supported_brokerages: [
    "Robinhood",
    "E*TRADE",
    "TD Ameritrade",
    "Fidelity",
    "Charles Schwab",
    "Interactive Brokers",
  ],
  recent_uploads: [
    {
      name: "transactions_jan_2026.csv",
      date: "Uploaded 2 hours ago",
      status: "Processed",
    },
    {
      name: "q4_broker_export.xlsx",
      date: "Uploaded yesterday",
      status: "Reviewing",
    },
    {
      name: "portfolio_rebalance.csv",
      date: "Uploaded Mar 20, 2026",
      status: "Processed",
    },
  ],
};

function UploadPage() {
  const [uploadData, setUploadData] = useState(defaultUploadData);
  const [transactions, setTransactions] = useState([]);
  const [formData, setFormData] = useState({
    date: "2026-04-01",
    type: "Buy",
    symbol: "AAPL",
    quantity: "1",
    price: "100",
  });
  const [uploadMessage, setUploadMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    requestJson("/api/uploads")
      .then((data) => setUploadData(data))
      .catch(() => {});
    loadTransactions();
  }, []);

  function loadTransactions() {
    requestJson("/api/transactions")
      .then((data) => setTransactions(data.transactions || []))
      .catch(() => {});
  }

  function updateField(event) {
    setFormData((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  }

  async function handleFileChange(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setIsUploading(true);
    setUploadMessage("");

    try {
      const result = await uploadFile("/api/uploads/transactions", file);
      setUploadMessage(result.message || "File uploaded successfully");
      loadTransactions();
      requestJson("/api/uploads")
        .then((data) => setUploadData(data))
        .catch(() => {});
    } catch (error) {
      setUploadMessage("Backend unavailable. UI kept in demo mode.");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  }

  async function addTransaction(event) {
    event.preventDefault();
    try {
      const result = await requestJson("/api/transactions", {
        method: "POST",
        body: JSON.stringify({
          ...formData,
          quantity: Number(formData.quantity),
          price: Number(formData.price),
        }),
      });
      setUploadMessage(result.message);
      loadTransactions();
    } catch (error) {
      setUploadMessage(error.message || "Unable to add transaction.");
    }
  }

  async function deleteTransaction(id) {
    try {
      const result = await requestJson(`/api/transactions/${id}`, { method: "DELETE" });
      setUploadMessage(result.message);
      loadTransactions();
    } catch (error) {
      setUploadMessage(error.message || "Unable to delete transaction.");
    }
  }

  return (
    <>
      <Navbar />

      <main style={styles.page}>
        <section style={styles.hero}>
          <h1 style={styles.heading}>Upload Transactions</h1>
          <p style={styles.subheading}>
            Import your transaction history to keep your portfolio up to date
          </p>
        </section>

        <section style={styles.grid}>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Import File</h2>
            <p style={styles.cardSubtitle}>
              Upload CSV or Excel files with your transaction data
            </p>

            <label style={styles.dropzone}>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                style={styles.hiddenInput}
                onChange={handleFileChange}
              />

              <div style={styles.uploadIcon}>
                <span style={styles.uploadArrow}></span>
              </div>

              <strong style={styles.dropzoneTitle}>
                {isUploading ? "Uploading file..." : "Click to upload or drag and drop"}
              </strong>
              <span style={styles.dropzoneText}>CSV, XLSX (max 10MB)</span>
              {uploadMessage ? <span style={styles.uploadMessage}>{uploadMessage}</span> : null}
            </label>
          </div>

          <div style={styles.card}>
            <h2 style={styles.cardTitle}>File Format Requirements</h2>
            <p style={styles.cardSubtitle}>
              Ensure your file includes the following columns
            </p>

            <div style={styles.requirementsBox}>
              <p style={styles.requirementsTitle}>Required Columns:</p>
              <ul style={styles.requirementsList}>
                {uploadData.required_columns.map((column) => (
                  <li key={column} style={styles.requirementItem}>
                    {column}
                  </li>
                ))}
              </ul>
            </div>

            <div style={styles.exampleBox}>
              <div style={styles.exampleHeader}>
                <div style={styles.infoIcon}>i</div>
                <span style={styles.exampleLabel}>Example CSV format:</span>
              </div>
              <code style={styles.codeLine}>Date,Type,Symbol,Quantity,Price</code>
              <code style={styles.codeLine}>2026-01-15,Buy,AAPL,10,150.25</code>
            </div>

            <div style={styles.divider}></div>

            <div>
              <p style={styles.supportedTitle}>Supported Brokerages:</p>
              <div style={styles.badges}>
                {uploadData.supported_brokerages.map((broker) => (
                  <span key={broker} style={styles.badge}>
                    {broker}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section style={{ ...styles.card, ...styles.manualCard }}>
          <h2 style={styles.cardTitle}>Manual Transaction</h2>
          <p style={styles.cardSubtitle}>Add a buy or sell without uploading a file</p>

          <form style={styles.manualForm} onSubmit={addTransaction}>
            <input name="date" type="date" style={styles.input} value={formData.date} onChange={updateField} />
            <select name="type" style={styles.input} value={formData.type} onChange={updateField}>
              <option>Buy</option>
              <option>Sell</option>
            </select>
            <input name="symbol" style={styles.input} value={formData.symbol} onChange={updateField} placeholder="Symbol" />
            <input name="quantity" type="number" min="0.0001" step="0.0001" style={styles.input} value={formData.quantity} onChange={updateField} placeholder="Quantity" />
            <input name="price" type="number" min="0.01" step="0.01" style={styles.input} value={formData.price} onChange={updateField} placeholder="Price" />
            <button type="submit" style={styles.primaryButton}>Add</button>
          </form>
        </section>

        <section style={{ ...styles.card, ...styles.recentCard }}>
          <h2 style={styles.cardTitle}>Recent Uploads</h2>
          <p style={styles.cardSubtitle}>
            Your transaction file upload history
          </p>

          <div style={styles.uploadList}>
            {uploadData.recent_uploads.map((upload) => (
              <div key={upload.name} style={styles.uploadRow}>
                <div style={styles.fileMeta}>
                  <div style={styles.fileIcon}>CSV</div>
                  <div>
                    <p style={styles.fileName}>{upload.name}</p>
                    <p style={styles.fileDate}>{upload.date}</p>
                  </div>
                </div>

                <span
                  style={{
                    ...styles.statusPill,
                    color: upload.status === "Processed" ? "#0f9f6e" : "#1d4ed8",
                    background: upload.status === "Processed" ? "#ecfdf5" : "#dbeafe",
                  }}
                >
                  {upload.status}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section style={{ ...styles.card, ...styles.recentCard }}>
          <h2 style={styles.cardTitle}>Transactions</h2>
          <p style={styles.cardSubtitle}>Imported and manually entered activity</p>

          <div style={styles.uploadList}>
            {transactions.map((transaction) => (
              <div key={transaction.id} style={styles.uploadRow}>
                <div style={styles.fileMeta}>
                  <div style={styles.fileIcon}>{transaction.symbol}</div>
                  <div>
                    <p style={styles.fileName}>
                      {transaction.type} {transaction.quantity} at ${transaction.price}
                    </p>
                    <p style={styles.fileDate}>
                      {transaction.date} | {transaction.source || "manual"} | ${transaction.trade_value}
                    </p>
                  </div>
                </div>

                <button type="button" style={styles.deleteButton} onClick={() => deleteTransaction(transaction.id)}>
                  Delete
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

const styles = {
  page: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "28px 20px 48px",
  },
  hero: {
    marginBottom: "26px",
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
  grid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) minmax(360px, 1fr)",
    gap: "24px",
    alignItems: "stretch",
  },
  card: {
    background: "rgba(255, 255, 255, 0.94)",
    border: "1px solid rgba(203, 213, 225, 0.85)",
    borderRadius: "22px",
    padding: "24px",
    boxShadow: "0 14px 30px rgba(15, 23, 42, 0.06)",
    animation: "fadeUp 0.55s ease both",
  },
  cardTitle: {
    margin: 0,
    fontSize: "18px",
    color: "#0f172a",
  },
  cardSubtitle: {
    margin: "8px 0 0",
    color: "#64748b",
    fontSize: "15px",
  },
  dropzone: {
    marginTop: "26px",
    minHeight: "420px",
    borderRadius: "20px",
    border: "2px dashed #dbe4f0",
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(248,250,252,0.96) 100%)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    cursor: "pointer",
    transition: "border-color 0.2s ease, transform 0.2s ease",
  },
  hiddenInput: {
    display: "none",
  },
  uploadIcon: {
    width: "64px",
    height: "64px",
    borderRadius: "18px",
    background: "#eff6ff",
    position: "relative",
    marginBottom: "20px",
  },
  uploadArrow: {
    position: "absolute",
    left: "50%",
    top: "18px",
    width: "22px",
    height: "22px",
    borderLeft: "4px solid #94a3b8",
    borderTop: "4px solid #94a3b8",
    transform: "translateX(-50%) rotate(45deg)",
  },
  dropzoneTitle: {
    fontSize: "16px",
    color: "#0f172a",
  },
  dropzoneText: {
    marginTop: "10px",
    fontSize: "14px",
    color: "#64748b",
  },
  uploadMessage: {
    marginTop: "12px",
    fontSize: "13px",
    color: "#1d4ed8",
  },
  requirementsBox: {
    marginTop: "24px",
    padding: "18px 18px 14px",
    borderRadius: "18px",
    background: "#f8fafc",
  },
  requirementsTitle: {
    margin: 0,
    fontSize: "15px",
    fontWeight: "600",
    color: "#0f172a",
  },
  requirementsList: {
    margin: "14px 0 0",
    paddingLeft: "18px",
    color: "#334155",
    lineHeight: 1.9,
  },
  requirementItem: {
    fontSize: "15px",
  },
  exampleBox: {
    marginTop: "18px",
    padding: "18px",
    borderRadius: "16px",
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
  },
  exampleHeader: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "12px",
  },
  infoIcon: {
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    border: "2px solid #2563eb",
    color: "#2563eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    fontWeight: "700",
  },
  exampleLabel: {
    fontSize: "15px",
    color: "#1d4ed8",
    fontWeight: "500",
  },
  codeLine: {
    display: "block",
    width: "fit-content",
    fontFamily: "Consolas, 'Courier New', monospace",
    fontSize: "14px",
    lineHeight: 1.8,
    color: "#1e3a8a",
    background: "rgba(255,255,255,0.72)",
    padding: "0 4px",
  },
  divider: {
    height: "1px",
    background: "#e2e8f0",
    margin: "18px 0",
  },
  supportedTitle: {
    margin: 0,
    fontSize: "15px",
    color: "#0f172a",
    fontWeight: "500",
  },
  badges: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    marginTop: "14px",
  },
  badge: {
    padding: "8px 12px",
    borderRadius: "999px",
    background: "#f1f5f9",
    color: "#0f172a",
    fontSize: "13px",
    fontWeight: "600",
  },
  recentCard: {
    marginTop: "24px",
  },
  manualCard: {
    marginTop: "24px",
  },
  manualForm: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
    gap: "12px",
    marginTop: "18px",
  },
  input: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: "12px",
    border: "1px solid #dbe4f0",
    background: "#ffffff",
    color: "#0f172a",
    fontSize: "14px",
    boxSizing: "border-box",
  },
  primaryButton: {
    padding: "12px 14px",
    borderRadius: "12px",
    border: "none",
    background: "#0f172a",
    color: "#ffffff",
    fontWeight: "700",
    cursor: "pointer",
  },
  uploadList: {
    display: "grid",
    gap: "14px",
    marginTop: "22px",
  },
  uploadRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    padding: "16px 18px",
    borderRadius: "18px",
    background: "#f8fafc",
    border: "1px solid #eef2f7",
  },
  fileMeta: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
  },
  fileIcon: {
    width: "46px",
    height: "46px",
    borderRadius: "14px",
    background: "#e0e7ff",
    color: "#3730a3",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    fontWeight: "700",
    letterSpacing: "0.06em",
  },
  fileName: {
    margin: 0,
    fontSize: "15px",
    fontWeight: "600",
    color: "#0f172a",
  },
  fileDate: {
    margin: "4px 0 0",
    fontSize: "13px",
    color: "#64748b",
  },
  statusPill: {
    padding: "8px 12px",
    borderRadius: "999px",
    fontSize: "13px",
    fontWeight: "700",
    whiteSpace: "nowrap",
  },
  deleteButton: {
    padding: "9px 12px",
    borderRadius: "10px",
    border: "1px solid #fecaca",
    background: "#fff1f2",
    color: "#be123c",
    fontWeight: "700",
    cursor: "pointer",
  },
};

export default UploadPage;
