import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

// Resolve any timestamp format to milliseconds
const toMs = (f) => {
    if (!f) return null;
    if (typeof f?.seconds === "number") return f.seconds * 1000; // Firestore Timestamp
    if (f instanceof Date) return f.getTime();
    const n = new Date(f).getTime();
    return isNaN(n) ? null : n;
};

const fmtDt = (ms) =>
    new Date(ms).toLocaleString("en-IN", {
        day: "numeric", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit", hour12: true,
    });

// ── Colorful countdown component ──────────────────────────────────────────────
function CountdownBlocks({ targetMs, mode }) {
    const [diff, setDiff] = useState(Math.max(0, targetMs - Date.now()));

    useEffect(() => {
        const t = setInterval(() => {
            const rem = Math.max(0, targetMs - Date.now());
            setDiff(rem);
            if (rem === 0) clearInterval(t);
        }, 1000);
        return () => clearInterval(t);
    }, [targetMs]);

    if (diff === 0) {
        if (mode === "until-start")
            return <span style={{ color: "#10b981", fontWeight: 800, fontSize: "0.9rem" }}>⚡ Starting now! Refresh the page.</span>;
        return <span style={{ color: "#dc2626", fontWeight: 800, fontSize: "0.9rem" }}>⏰ Quiz just closed!</span>;
    }

    // Determine color based on mode + urgency
    let color, bg, glow, borderColor;
    if (mode === "until-start") {
        color = "#007367"; bg = "rgba(0,115,103,0.09)"; glow = "rgba(0,115,103,0.25)"; borderColor = "rgba(0,115,103,0.3)";
    } else {
        const hrs = diff / 3600000;
        if (hrs < 1)       { color = "#dc2626"; bg = "rgba(220,38,38,0.08)"; glow = "rgba(220,38,38,0.3)"; borderColor = "rgba(220,38,38,0.3)"; }
        else if (hrs < 24) { color = "#d97706"; bg = "rgba(217,119,6,0.08)"; glow = "rgba(217,119,6,0.25)"; borderColor = "rgba(217,119,6,0.3)"; }
        else               { color = "#059669"; bg = "rgba(5,150,105,0.08)"; glow = "rgba(5,150,105,0.25)"; borderColor = "rgba(5,150,105,0.25)"; }
    }

    const days = Math.floor(diff / 86400000);
    const hrs  = Math.floor((diff % 86400000) / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    const units = days > 0
        ? [[days, "DAY"], [hrs, "HRS"], [mins, "MIN"]]
        : [[hrs, "HRS"], [mins, "MIN"], [secs, "SEC"]];

    return (
        <div style={{ display: "flex", gap: "5px", alignItems: "flex-end" }}>
            {units.map(([val, unit], i) => (
                <div key={unit} style={{ display: "flex", alignItems: "flex-end", gap: "5px" }}>
                    {i > 0 && (
                        <span style={{ color, fontWeight: 900, fontSize: "1.4rem", lineHeight: 1, paddingBottom: "16px", opacity: 0.7 }}>:</span>
                    )}
                    <div style={{
                        background: bg,
                        border: `1.5px solid ${borderColor}`,
                        borderRadius: "10px",
                        padding: "8px 10px",
                        minWidth: "50px",
                        textAlign: "center",
                        boxShadow: `0 2px 14px ${glow}`,
                    }}>
                        <div style={{
                            fontSize: "1.5rem", fontWeight: 900, color,
                            fontVariantNumeric: "tabular-nums", lineHeight: 1,
                            fontFamily: "'Courier New', monospace"
                        }}>
                            {String(val).padStart(2, "0")}
                        </div>
                        <div style={{ fontSize: "0.58rem", fontWeight: 800, color, opacity: 0.65, marginTop: "4px", letterSpacing: "0.08em" }}>
                            {unit}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

// ── Main Quizzes page ─────────────────────────────────────────────────────────
export default function Quizzes() {
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getDocs(collection(db, "quizzes")).then(snap => {
            const now = Date.now();
            const list = [];
            snap.forEach(d => {
                const data = d.data();
                // Backward compat: use startAt, fallback to legacy publishAt
                const startMs = toMs(data.startAt) ?? toMs(data.publishAt);
                const endMs   = toMs(data.endAt) || (startMs && data.timeLimit ? startMs + data.timeLimit * 60000 : null);

                const isClosed   = data.isActive !== false && endMs && endMs <= now;
                const isUpcoming = data.isActive !== false && startMs && startMs > now;
                const isLive     = data.isActive !== false && (!startMs || startMs <= now) && !isClosed;

                if (isLive || isUpcoming || isClosed) {
                    // Update display _endMs to match dynamic calculation so UI matches logic
                    list.push({ id: d.id, ...data, _startMs: startMs, _endMs: endMs, _isLive: isLive, _isUpcoming: isUpcoming, _isClosed: isClosed });
                }
            });

            list.sort((a, b) => {
                if (a._isLive && !b._isLive) return -1;
                if (!a._isLive && b._isLive) return 1;
                if (a._isUpcoming && !b._isUpcoming && !a._isClosed && b._isClosed) return -1;
                if (!a._isUpcoming && b._isUpcoming && a._isClosed && !b._isClosed) return 1;
                if (a._isClosed && !b._isClosed) return 1;
                if (!a._isClosed && b._isClosed) return -1;
                return (a._startMs || 0) - (b._startMs || 0);
            });
            setQuizzes(list);
            setLoading(false);
        });
    }, []);

    const hasLive     = quizzes.some(q => q._isLive);
    const hasUpcoming = quizzes.some(q => q._isUpcoming);

    return (
        <div style={{ minHeight: "100vh", background: "linear-gradient(180deg, #f0fdf9 0%, #f8fffe 100%)", fontFamily: "'Inter', sans-serif" }}>
            <Navbar />

            {/* Hero */}
            <section style={{ paddingTop: "120px", paddingBottom: "64px", background: "linear-gradient(135deg, #007367 0%, #003d37 100%)", textAlign: "center", color: "#fff", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 20% 60%, rgba(255,255,255,0.07) 0%, transparent 60%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.05) 0%, transparent 55%)" }} />
                <div style={{ maxWidth: "720px", margin: "0 auto", padding: "0 20px", position: "relative" }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.12)", borderRadius: "50px", padding: "6px 18px", marginBottom: "18px", fontSize: "0.82rem", fontWeight: 700, letterSpacing: "0.05em" }}>
                        📝 QUIZ PORTAL
                    </div>
                    <h1 style={{ fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 800, marginBottom: "14px", color: "#fff", lineHeight: 1.2 }}>
                        CXR Knowledge Quizzes
                    </h1>
                    <p style={{ fontSize: "1.05rem", color: "rgba(255,255,255,0.8)", lineHeight: 1.7, margin: 0 }}>
                        Test your radiology knowledge. All results are recorded — take them honestly!
                    </p>
                </div>
            </section>

            {/* Quiz list */}
            <section style={{ maxWidth: "940px", margin: "0 auto", padding: "60px 20px 80px" }}>
                {loading ? (
                    <div style={{ textAlign: "center", padding: "80px 20px" }}>
                        <div style={{ width: "48px", height: "48px", margin: "0 auto 16px", border: "4px solid rgba(0,115,103,0.15)", borderTopColor: "#007367", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                        <p style={{ color: "#888" }}>Loading quizzes…</p>
                    </div>
                ) : quizzes.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "80px 20px" }}>
                        <span style={{ fontSize: "4rem" }}>📝</span>
                        <h2 style={{ color: "#555", marginTop: "16px" }}>No quizzes available yet</h2>
                        <p style={{ color: "#888" }}>Check back soon!</p>
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

                        {/* Section headers */}
                        {hasLive && (
                            <p style={{ margin: "0 0 -10px", color: "#007367", fontSize: "0.78rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.07em" }}>
                                ✅ Available Now
                            </p>
                        )}

                        {quizzes.map((quiz, i) => {
                            const upcoming = quiz._isUpcoming;
                            const closed = quiz._isClosed;
                            const prevIsLive = i > 0 && quizzes[i - 1]._isLive;
                            const prevIsUpcoming = i > 0 && quizzes[i - 1]._isUpcoming;
                            const showUpcomingDivider = upcoming && prevIsLive;
                            const showClosedDivider = closed && (prevIsLive || prevIsUpcoming || (i === 0 && !quizzes.some(q => q._isLive || q._isUpcoming)));

                            return (
                                <div key={quiz.id}>
                                    {showUpcomingDivider && (
                                        <p style={{ margin: "8px 0 -8px", color: "#b45309", fontSize: "0.78rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.07em" }}>
                                            🕐 Upcoming Quizzes
                                        </p>
                                    )}
                                    {showClosedDivider && (
                                        <p style={{ margin: "8px 0 -8px", color: "#6b7280", fontSize: "0.78rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.07em" }}>
                                            🔒 Completed Quizzes
                                        </p>
                                    )}

                                    <div style={{
                                        background: "#fff",
                                        borderRadius: "20px",
                                        overflow: "hidden",
                                        boxShadow: upcoming
                                            ? "0 6px 28px rgba(217,119,6,0.13)"
                                            : "0 6px 28px rgba(0,115,103,0.1)",
                                        border: upcoming
                                            ? "1px solid rgba(217,119,6,0.22)"
                                            : "1px solid rgba(0,115,103,0.12)",
                                        transition: "box-shadow 0.2s",
                                    }}>
                                        {/* Color accent bar */}
                                        <div style={{ height: "5px", background: closed ? "linear-gradient(90deg,#9ca3af,#6b7280,#9ca3af)" : upcoming ? "linear-gradient(90deg,#f59e0b,#d97706,#fbbf24)" : "linear-gradient(90deg,#007367,#10b981,#34d399)" }} />

                                        <div style={{ padding: "26px 30px", display: "flex", alignItems: "flex-start", gap: "20px", flexWrap: "wrap", opacity: closed ? 0.6 : 1 }}>
                                            {/* Badge */}
                                            <div style={{
                                                width: "54px", height: "54px", borderRadius: "14px", flexShrink: 0,
                                                background: closed ? "linear-gradient(135deg,#9ca3af,#6b7280)" : upcoming ? "linear-gradient(135deg,#f59e0b,#d97706)" : "linear-gradient(135deg,#007367,#10b981)",
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                color: "#fff", fontWeight: 800, fontSize: "1.4rem"
                                            }}>
                                                {closed ? "🔒" : upcoming ? "🕐" : (i + 1)}
                                            </div>

                                            {/* Content */}
                                            <div style={{ flex: 1, minWidth: "240px" }}>
                                                <h3 style={{ margin: "0 0 6px", color: "#1a1a1a", fontSize: "1.18rem", fontWeight: 800, lineHeight: 1.3 }}>
                                                    {quiz.title}
                                                </h3>
                                                {quiz.description && (
                                                    <p style={{ margin: "0 0 14px", color: "#666", fontSize: "0.88rem", lineHeight: 1.55 }}>{quiz.description}</p>
                                                )}

                                                {/* Start / End time row */}
                                                {(() => {
                                                    const displayEndMs = quiz._endMs;
                                                    
                                                    if (!quiz._startMs && !displayEndMs) return null;

                                                    return (
                                                        <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", marginBottom: "16px", padding: "10px 14px", borderRadius: "10px", background: "rgba(0,0,0,0.025)", border: "1px solid rgba(0,0,0,0.06)" }}>
                                                            {quiz._startMs && (
                                                                <div>
                                                                    <div style={{ fontSize: "0.68rem", fontWeight: 800, color: "#007367", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "2px" }}>🟢 Opens</div>
                                                                    <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#1a1a1a" }}>{fmtDt(quiz._startMs)}</div>
                                                                </div>
                                                            )}
                                                            {displayEndMs && (
                                                                <div>
                                                                    <div style={{ fontSize: "0.68rem", fontWeight: 800, color: "#dc2626", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "2px" }}>🔴 Closes</div>
                                                                    <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#1a1a1a" }}>{fmtDt(displayEndMs)}</div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })()}

                                                {/* Countdown for upcoming quizzes */}
                                                {upcoming && quiz._startMs && (
                                                    <div style={{ marginBottom: "16px" }}>
                                                        <div style={{ fontSize: "0.72rem", fontWeight: 800, color: "#b45309", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "8px" }}>
                                                            ⏳ Opens In
                                                        </div>
                                                        <CountdownBlocks targetMs={quiz._startMs} mode="until-start" />
                                                    </div>
                                                )}

                                                {/* Countdown for live quizzes with endAt */}
                                                {!upcoming && quiz._endMs && (
                                                    <div style={{ marginBottom: "16px" }}>
                                                        <div style={{ fontSize: "0.72rem", fontWeight: 800, color: "#dc2626", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "8px" }}>
                                                            ⏰ Closes In
                                                        </div>
                                                        <CountdownBlocks targetMs={quiz._endMs} mode="until-end" />
                                                    </div>
                                                )}

                                                {/* Meta badges */}
                                                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                                                    <span style={{ fontSize: "0.76rem", color: "#007367", fontWeight: 700, background: "rgba(0,115,103,0.08)", padding: "4px 12px", borderRadius: "20px" }}>
                                                        {quiz.questions?.length || 0} Questions
                                                    </span>
                                                    {quiz.timeLimit > 0 && (
                                                        <span style={{ fontSize: "0.76rem", color: "#b45309", fontWeight: 700, background: "rgba(245,158,11,0.1)", padding: "4px 12px", borderRadius: "20px" }}>
                                                            ⏱ {quiz.timeLimit} min
                                                        </span>
                                                    )}
                                                    {quiz.createdAt?.seconds && (
                                                        <span style={{ fontSize: "0.72rem", color: "#aaa" }}>
                                                            Added {new Date(quiz.createdAt.seconds * 1000).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* CTA */}
                                            <div style={{ flexShrink: 0, alignSelf: "center" }}>
                                                {closed ? (
                                                    <div style={{
                                                        padding: "12px 24px", borderRadius: "50px", textAlign: "center",
                                                        background: "rgba(107,114,128,0.1)", color: "#4b5563",
                                                        fontWeight: 700, fontSize: "0.88rem",
                                                        border: "1.5px solid rgba(107,114,128,0.3)",
                                                        minWidth: "136px"
                                                    }}>
                                                        🔒 Completed
                                                    </div>
                                                ) : upcoming ? (
                                                    <div style={{
                                                        padding: "12px 24px", borderRadius: "50px", textAlign: "center",
                                                        background: "rgba(245,158,11,0.1)", color: "#92400e",
                                                        fontWeight: 700, fontSize: "0.88rem",
                                                        border: "1.5px solid rgba(245,158,11,0.3)",
                                                        minWidth: "136px"
                                                    }}>
                                                        🔒 Not Open Yet
                                                    </div>
                                                ) : (
                                                    <Link to={`/quiz/${quiz.id}`} style={{
                                                        display: "inline-flex", alignItems: "center", gap: "8px",
                                                        padding: "13px 30px", borderRadius: "50px",
                                                        background: "linear-gradient(135deg,#007367,#10b981)",
                                                        color: "#fff", fontWeight: 700, fontSize: "0.95rem",
                                                        textDecoration: "none",
                                                        boxShadow: "0 5px 18px rgba(0,115,103,0.38)",
                                                        transition: "transform 0.15s, box-shadow 0.15s"
                                                    }}>
                                                        Start Quiz →
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                a:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,115,103,0.45) !important; }
            `}</style>
            <Footer />
        </div>
    );
}
