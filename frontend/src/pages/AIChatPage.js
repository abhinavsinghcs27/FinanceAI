import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { requestJson } from "../lib/api";

const starters = [
  "Why is my portfolio risky?",
  "What should I rebalance first?",
  "Summarize my current holdings.",
];

function AIChatPage() {
  const [question, setQuestion] = useState(starters[0]);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function loadInitialAnswer() {
      setMessages([{ role: "user", text: starters[0] }]);
      setIsLoading(true);
      try {
        const result = await requestJson("/api/ai/chat", {
          method: "POST",
          body: JSON.stringify({ question: starters[0] }),
        });
        setMessages((current) => [
          ...current,
          {
            role: "assistant",
            text: result.summary,
            points: result.actions || result.key_points || [],
            disclaimer: result.disclaimer,
            source: result.source,
          },
        ]);
      } catch (error) {
        setMessages((current) => [
          ...current,
          { role: "assistant", text: error.message || "Unable to reach FinanceAI." },
        ]);
      } finally {
        setIsLoading(false);
      }
    }

    loadInitialAnswer();
  }, []);

  async function askQuestion(value = question) {
    const trimmed = value.trim();
    if (!trimmed || isLoading) {
      return;
    }

    setMessages((current) => [...current, { role: "user", text: trimmed }]);
    setQuestion("");
    setIsLoading(true);

    try {
      const result = await requestJson("/api/ai/chat", {
        method: "POST",
        body: JSON.stringify({ question: trimmed }),
      });
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: result.summary,
          points: result.actions || result.key_points || [],
          disclaimer: result.disclaimer,
          source: result.source,
        },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        { role: "assistant", text: error.message || "Unable to reach FinanceAI." },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <Navbar />

      <main style={styles.page}>
        <section style={styles.hero}>
          <span style={styles.badge}>FinanceAI Assistant</span>
          <h1 style={styles.heading}>Ask about your portfolio</h1>
          <p style={styles.subheading}>
            Get educational explanations grounded in your holdings, risk score,
            allocation, and recent recommendations.
          </p>
        </section>

        <section style={styles.shell}>
          <div style={styles.starters}>
            {starters.map((starter) => (
              <button
                key={starter}
                type="button"
                style={styles.starterButton}
                onClick={() => askQuestion(starter)}
              >
                {starter}
              </button>
            ))}
          </div>

          <div style={styles.messages}>
            {messages.map((message, index) => (
              <article
                key={`${message.role}-${index}`}
                style={{
                  ...styles.message,
                  ...(message.role === "user" ? styles.userMessage : styles.aiMessage),
                }}
              >
                <p style={styles.role}>{message.role === "user" ? "You" : "FinanceAI"}</p>
                <p style={styles.messageText}>{message.text}</p>
                {message.points?.length ? (
                  <div style={styles.pointGrid}>
                    {message.points.map((point) => (
                      <p key={point} style={styles.point}>{point}</p>
                    ))}
                  </div>
                ) : null}
                {message.disclaimer ? <p style={styles.disclaimer}>{message.disclaimer}</p> : null}
              </article>
            ))}
            {isLoading ? <p style={styles.loading}>FinanceAI is thinking...</p> : null}
          </div>

          <form
            style={styles.form}
            onSubmit={(event) => {
              event.preventDefault();
              askQuestion();
            }}
          >
            <input
              style={styles.input}
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Ask a portfolio question"
            />
            <button type="submit" style={styles.button} disabled={isLoading}>
              Ask
            </button>
          </form>
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
    padding: "28px 20px 48px",
  },
  hero: {
    marginBottom: "22px",
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
    margin: "14px 0 0",
    fontSize: "42px",
    color: "#0f172a",
  },
  subheading: {
    margin: "10px 0 0",
    color: "#64748b",
    lineHeight: 1.65,
  },
  shell: {
    background: "#ffffff",
    border: "1px solid #dbeafe",
    borderRadius: "22px",
    padding: "20px",
    boxShadow: "0 14px 30px rgba(15, 23, 42, 0.06)",
  },
  starters: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    marginBottom: "18px",
  },
  starterButton: {
    padding: "10px 12px",
    borderRadius: "999px",
    border: "1px solid #c7d2fe",
    background: "#eef2ff",
    color: "#3730a3",
    fontWeight: "600",
    cursor: "pointer",
  },
  messages: {
    display: "grid",
    gap: "14px",
    minHeight: "360px",
  },
  message: {
    padding: "16px",
    borderRadius: "18px",
    border: "1px solid #e2e8f0",
  },
  userMessage: {
    background: "#f8fafc",
  },
  aiMessage: {
    background: "linear-gradient(180deg, #ffffff 0%, #eff6ff 100%)",
    borderColor: "#bfdbfe",
  },
  role: {
    margin: 0,
    fontSize: "13px",
    fontWeight: "700",
    color: "#475569",
  },
  messageText: {
    margin: "8px 0 0",
    color: "#0f172a",
    lineHeight: 1.65,
  },
  pointGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "10px",
    marginTop: "12px",
  },
  point: {
    margin: 0,
    padding: "10px 12px",
    borderRadius: "12px",
    background: "#ffffff",
    color: "#334155",
    fontSize: "14px",
    lineHeight: 1.5,
  },
  disclaimer: {
    margin: "12px 0 0",
    color: "#64748b",
    fontSize: "12px",
  },
  loading: {
    margin: 0,
    color: "#2563eb",
    fontSize: "14px",
  },
  form: {
    display: "grid",
    gridTemplateColumns: "1fr auto",
    gap: "10px",
    marginTop: "18px",
  },
  input: {
    padding: "14px 16px",
    borderRadius: "14px",
    border: "1px solid #cbd5e1",
    fontSize: "15px",
  },
  button: {
    padding: "14px 18px",
    borderRadius: "14px",
    border: "none",
    background: "#0f172a",
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
  },
};

export default AIChatPage;
