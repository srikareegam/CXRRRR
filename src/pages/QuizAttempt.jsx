import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, addDoc, getDocs, collection, query, where } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

const STEP = { REGISTER: "register", INSTRUCTIONS: "instructions", QUIZ: "quiz", DONE: "done" };

function shuffleArray(arr) { return [...arr].sort(() => Math.random() - 0.5); }
function fmtTime(sec) {
    const m = Math.floor(sec / 60), s = sec % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
}

export default function QuizAttempt() {
    const { quizId } = useParams();
    const navigate = useNavigate();

    const [quiz, setQuiz]       = useState(null);
    const [loading, setLoading] = useState(true);
    const [step, setStep]       = useState(STEP.REGISTER);
    const [student, setStudent] = useState({ name: "", studentId: "", email: "" });
    const [questions, setQuestions] = useState([]);  // shuffled, displayOptions + mappedCorrect
    const [answers, setAnswers]     = useState({});  // { qIdx: optionIdx }
    const [currentQ, setCurrentQ]   = useState(0);
    const [timeLeft, setTimeLeft]   = useState(0);
    const [tabCount, setTabCount]   = useState(0);
    const [warning, setWarning]     = useState("");
    const [result, setResult]       = useState(null);
    const [agreed, setAgreed]       = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Registration duplicate-check state
    const [checking, setChecking] = useState(false);
    const [dupError, setDupError] = useState("");
    const [closedMsg, setClosedMsg] = useState(""); // quiz closed / not yet open

    const startTimeRef      = useRef(null);
    const submittedRef      = useRef(false);
    const timerRef          = useRef(null);
    const fsEnteredRef      = useRef(false);   // true once fullscreen successfully entered

    // ── Load quiz ────────────────────────────────────────────────────────────
    useEffect(() => {
        const toMs = (f) => {
            if (!f) return null;
            if (typeof f?.seconds === "number") return f.seconds * 1000;
            const n = new Date(f).getTime();
            return isNaN(n) ? null : n;
        };
        const load = async () => {
            const snap = await getDoc(doc(db, "quizzes", quizId));
            if (!snap.exists()) { navigate("/quizzes"); return; }
            const data = snap.data();
            const now = Date.now();
            // Backward compat: use startAt or legacy publishAt
            const startMs = toMs(data.startAt) ?? toMs(data.publishAt);
            const endMs   = toMs(data.endAt) || (startMs && data.timeLimit ? startMs + data.timeLimit * 60000 : null);

            // Check if quiz window is open
            const isActive = data.isActive !== false;
            if (!isActive) { navigate("/quizzes"); return; }
            if (startMs && startMs > now) { navigate("/quizzes"); return; }  // not started yet
            if (endMs && endMs <= now) {
                setClosedMsg("This quiz has ended. The submission window is now closed.");
                setLoading(false);
                return;
            }

            setQuiz({ id: snap.id, ...data });
            setLoading(false);
        };
        load().catch(() => navigate("/quizzes"));
    }, [quizId, navigate]);

    // ── Submit quiz (shared by manual + auto) ────────────────────────────────
    const submitQuiz = useCallback(async (note = "") => {
        if (submittedRef.current) return;
        submittedRef.current = true;
        clearInterval(timerRef.current);
        setSubmitting(true);

        const score    = questions.reduce((acc, q, i) => acc + (answers[i] === q.mappedCorrect ? 1 : 0), 0);
        const total    = questions.length;
        const timeTaken = Math.floor((Date.now() - startTimeRef.current) / 1000);

        const payload = {
            quizId: quiz.id, quizTitle: quiz.title,
            studentName: student.name, studentId: student.studentId, studentEmail: student.email,
            score, total,
            percentage: total > 0 ? Math.round((score / total) * 100) : 0,
            timeTaken, note,
            submittedAt: new Date()
        };

        try { await addDoc(collection(db, "quiz_results"), payload); } catch (e) { console.error(e); }

        setResult(payload);
        setStep(STEP.DONE);
        setSubmitting(false);

        // Exit fullscreen cleanly
        try {
            if (document.fullscreenElement) await document.exitFullscreen();
        } catch (_) {}
    }, [questions, answers, quiz, student]);

    // ── Anti-cheat: tab switch detection ─────────────────────────────────────
    useEffect(() => {
        if (step !== STEP.QUIZ) return;
        const handler = () => {
            if (!document.hidden || submittedRef.current) return;
            setTabCount(prev => {
                const next = prev + 1;
                if (next >= 3) {
                    submitQuiz("Auto-submitted: 3 tab switches detected.");
                } else {
                    setWarning(`⚠️ Warning ${next}/3: Do NOT switch tabs!`);
                    setTimeout(() => setWarning(""), 5000);
                }
                return next;
            });
        };
        document.addEventListener("visibilitychange", handler);
        return () => document.removeEventListener("visibilitychange", handler);
    }, [step, submitQuiz]);

    // ── Anti-cheat: fullscreen exit = instant auto-submit ────────────────────
    // NOTE: fsEnteredRef is set in startQuiz() AFTER requestFullscreen() resolves.
    // The handler only needs to detect EXIT (not enter), avoiding the race condition
    // where the enter-event fires before this useEffect listener is even attached.
    useEffect(() => {
        if (step !== STEP.QUIZ) return;
        const handleFsChange = () => {
            const inFs = !!(
                document.fullscreenElement ||
                document.webkitFullscreenElement ||
                document.mozFullScreenElement
            );
            if (!inFs && fsEnteredRef.current && !submittedRef.current) {
                setWarning("🚨 Fullscreen exited — submitting quiz!");
                submitQuiz("Auto-submitted: Fullscreen exited.");
            }
        };
        document.addEventListener("fullscreenchange", handleFsChange);
        document.addEventListener("webkitfullscreenchange", handleFsChange);
        document.addEventListener("mozfullscreenchange", handleFsChange);
        return () => {
            document.removeEventListener("fullscreenchange", handleFsChange);
            document.removeEventListener("webkitfullscreenchange", handleFsChange);
            document.removeEventListener("mozfullscreenchange", handleFsChange);
        };
    }, [step, submitQuiz]);

    // ── Anti-cheat: right-click, copy/paste, keyboard shortcuts ──────────────
    useEffect(() => {
        if (step !== STEP.QUIZ) return;
        const noCtx   = e => e.preventDefault();
        const noCopy  = e => e.preventDefault();
        const noKeys  = e => {
            if (
                e.key === "F12" || e.key === "PrintScreen" ||
                (e.ctrlKey && ["c","v","a","u","s","p"].includes(e.key.toLowerCase())) ||
                (e.ctrlKey && e.shiftKey && ["i","j","c"].includes(e.key.toLowerCase()))
            ) { e.preventDefault(); e.stopPropagation(); }
        };
        document.addEventListener("contextmenu", noCtx);
        document.addEventListener("copy", noCopy);
        document.addEventListener("paste", noCopy);
        document.addEventListener("cut", noCopy);
        document.addEventListener("keydown", noKeys);
        return () => {
            document.removeEventListener("contextmenu", noCtx);
            document.removeEventListener("copy", noCopy);
            document.removeEventListener("paste", noCopy);
            document.removeEventListener("cut", noCopy);
            document.removeEventListener("keydown", noKeys);
        };
    }, [step]);

    // ── Auto-submit when quiz endAt is reached ──────────────────────────────
    useEffect(() => {
        if (step !== STEP.QUIZ || !quiz) return;
        const toMs = (f) => {
            if (!f) return null;
            if (typeof f?.seconds === "number") return f.seconds * 1000;
            const n = new Date(f).getTime();
            return isNaN(n) ? null : n;
        };
        const endMs = toMs(quiz.endAt);
        if (!endMs) return;
        const delay = endMs - Date.now();
        if (delay <= 0) {
            submitQuiz("Auto-submitted: Quiz end time reached.");
            return;
        }
        const t = setTimeout(() => {
            setWarning("🚨 Quiz closed — time window ended. Submitting automatically!");
            submitQuiz("Auto-submitted: Quiz end time reached.");
        }, delay);
        return () => clearTimeout(t);
    }, [step, quiz, submitQuiz]);

    // ── Countdown timer ───────────────────────────────────────────────────────
    useEffect(() => {
        if (step !== STEP.QUIZ || !quiz?.timeLimit) return;
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    submitQuiz("Auto-submitted: time expired.");
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timerRef.current);
    }, [step, quiz, submitQuiz]);

    // ── Duplicate attempt check ───────────────────────────────────────────────
    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        if (!student.name.trim() || !student.studentId.trim()) return;
        setChecking(true);
        setDupError("");
        try {
            const q = query(
                collection(db, "quiz_results"),
                where("quizId", "==", quizId),
                where("studentId", "==", student.studentId.trim())
            );
            const snap = await getDocs(q);
            if (!snap.empty) {
                setDupError(`Student ID "${student.studentId}" has already attempted this quiz. Contact your instructor to allow a retake.`);
                setChecking(false);
                return;
            }
            setStep(STEP.INSTRUCTIONS);
        } catch (err) {
            setDupError("Error checking attempt history. Please try again.");
        }
        setChecking(false);
    };

    // ── Start quiz ────────────────────────────────────────────────────────────
    const startQuiz = async () => {
        const shuffled = shuffleArray([...(quiz.questions || [])]).map(q => {
            const optIndices    = shuffleArray([0, 1, 2, 3].slice(0, q.options.length));
            const displayOptions = optIndices.map(i => q.options[i]);
            const mappedCorrect  = optIndices.indexOf(q.answer);
            return { ...q, displayOptions, mappedCorrect };
        });
        setQuestions(shuffled);
        setAnswers({});
        setCurrentQ(0);
        setTimeLeft((quiz.timeLimit || 0) * 60);
        startTimeRef.current = Date.now();
        fsEnteredRef.current = false;
        setStep(STEP.QUIZ);

        // MUST await so fsEnteredRef is set AFTER fullscreen actually enters,
        // which is AFTER the useEffect listener is installed (post-render).
        try {
            await document.documentElement.requestFullscreen?.();
            fsEnteredRef.current = true;  // ← set here, not in the event handler
        } catch (e) {
            console.warn("Fullscreen not granted:", e);
            // If browser blocks fullscreen, fsEnteredRef stays false → no auto-submit on exit
        }
    };

    // ── Next / Submit ─────────────────────────────────────────────────────────
    const handleNext = async () => {
        if (currentQ < questions.length - 1) {
            setCurrentQ(p => p + 1);
        } else {
            await submitQuiz();
        }
    };

    // ── Styles ────────────────────────────────────────────────────────────────
    const card = {
        background: "#fff", borderRadius: "20px", boxShadow: "0 12px 40px rgba(0,0,0,0.12)",
        padding: "40px", maxWidth: "620px", margin: "0 auto"
    };
    const inputSt = {
        width: "100%", padding: "12px 16px", borderRadius: "10px",
        border: "1px solid #dde", fontSize: "1rem", outline: "none",
        boxSizing: "border-box", fontFamily: "inherit"
    };
    const btnPrimary = {
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px",
        padding: "13px 32px", borderRadius: "50px", border: "none", cursor: "pointer",
        background: "linear-gradient(135deg, #007367, #10b981)",
        color: "#fff", fontWeight: 700, fontSize: "1rem",
        boxShadow: "0 4px 16px rgba(0,115,103,0.35)"
    };

    if (loading) return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8f9fa" }}>
            <div style={{ width: "48px", height: "48px", border: "4px solid rgba(0,115,103,0.2)", borderTopColor: "#007367", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
    );

    if (closedMsg) return (
        <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#f0fdf9,#f8f9fa)", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            <div style={{ background: "#fff", borderRadius: "20px", boxShadow: "0 12px 40px rgba(0,0,0,0.1)", padding: "48px 44px", maxWidth: "480px", textAlign: "center" }}>
                <div style={{ fontSize: "4rem", marginBottom: "16px" }}>🔒</div>
                <h2 style={{ fontSize: "1.7rem", fontWeight: 800, color: "#1a1a1a", margin: "0 0 12px" }}>Quiz Closed</h2>
                <p style={{ color: "#666", lineHeight: 1.65, marginBottom: "28px" }}>{closedMsg}</p>
                <button onClick={() => navigate("/quizzes")} style={{ padding: "12px 32px", borderRadius: "50px", border: "none", background: "linear-gradient(135deg,#007367,#10b981)", color: "#fff", fontWeight: 700, fontSize: "1rem", cursor: "pointer", boxShadow: "0 4px 14px rgba(0,115,103,0.3)" }}>
                    ← Back to Quizzes
                </button>
            </div>
        </div>
    );

    // ─── STEP: Register ───────────────────────────────────────────────────────
    if (step === STEP.REGISTER) return (
        <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #f0fdf9, #f8f9fa)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 20px 40px" }}>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}} input:focus{border-color:#007367!important;outline:none;}`}</style>
            <div style={card}>
                <div style={{ textAlign: "center", marginBottom: "28px" }}>
                    <span style={{ fontSize: "3rem" }}>📝</span>
                    <h1 style={{ fontSize: "1.6rem", fontWeight: 800, margin: "12px 0 8px", color: "#1a1a1a" }}>{quiz.title}</h1>
                    {quiz.description && <p style={{ color: "#666", lineHeight: 1.6, margin: 0 }}>{quiz.description}</p>}
                    <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginTop: "12px", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "0.8rem", background: "rgba(0,115,103,0.1)", color: "#007367", padding: "3px 12px", borderRadius: "20px", fontWeight: 700 }}>
                            {quiz.questions?.length || 0} Questions
                        </span>
                        {quiz.timeLimit > 0 && (
                            <span style={{ fontSize: "0.8rem", background: "rgba(245,158,11,0.1)", color: "#b45309", padding: "3px 12px", borderRadius: "20px", fontWeight: 700 }}>
                                ⏱ {quiz.timeLimit} min
                            </span>
                        )}
                    </div>
                </div>

                <form onSubmit={handleRegisterSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div>
                        <label style={{ fontWeight: 600, fontSize: "0.88rem", color: "#444", display: "block", marginBottom: "6px" }}>Full Name *</label>
                        <input required style={inputSt} placeholder="e.g. Ravi Kumar" value={student.name}
                            onChange={e => { setStudent(p => ({ ...p, name: e.target.value })); setDupError(""); }} />
                    </div>
                    <div>
                        <label style={{ fontWeight: 600, fontSize: "0.88rem", color: "#444", display: "block", marginBottom: "6px" }}>Student ID / Roll Number *</label>
                        <input required style={inputSt} placeholder="e.g. 22CS001" value={student.studentId}
                            onChange={e => { setStudent(p => ({ ...p, studentId: e.target.value })); setDupError(""); }} />
                    </div>
                    <div>
                        <label style={{ fontWeight: 600, fontSize: "0.88rem", color: "#444", display: "block", marginBottom: "6px" }}>Email (optional)</label>
                        <input type="email" style={inputSt} placeholder="student@email.com" value={student.email}
                            onChange={e => setStudent(p => ({ ...p, email: e.target.value }))} />
                    </div>

                    {/* Duplicate attempt error */}
                    {dupError && (
                        <div style={{ padding: "12px 16px", borderRadius: "10px", background: "rgba(220,38,38,0.07)", border: "1px solid rgba(220,38,38,0.3)", fontSize: "0.88rem", color: "#dc2626", lineHeight: 1.5 }}>
                            🚫 {dupError}
                        </div>
                    )}

                    <button type="submit" disabled={checking} style={{ ...btnPrimary, marginTop: "8px", opacity: checking ? 0.7 : 1 }}>
                        {checking ? "Checking…" : "Continue →"}
                    </button>
                </form>
            </div>
        </div>
    );

    // ─── STEP: Instructions ───────────────────────────────────────────────────
    if (step === STEP.INSTRUCTIONS) return (
        <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #f0fdf9, #f8f9fa)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 20px 40px" }}>
            <div style={{ ...card, maxWidth: "680px" }}>
                <h2 style={{ fontWeight: 800, margin: "0 0 20px", color: "#1a1a1a" }}>📋 Quiz Instructions</h2>
                <div style={{ background: "rgba(0,115,103,0.05)", borderRadius: "12px", padding: "20px", marginBottom: "24px", border: "1px solid rgba(0,115,103,0.15)" }}>
                    <p style={{ margin: "0 0 14px", fontWeight: 700, color: "#007367" }}>Hello, {student.name} ({student.studentId})</p>
                    <ul style={{ margin: 0, paddingLeft: "20px", lineHeight: 2.1, color: "#333" }}>
                        <li>This quiz has <strong>{quiz.questions?.length}</strong> questions{quiz.timeLimit > 0 ? ` with a ${quiz.timeLimit}-minute countdown timer` : ""}.</li>
                        <li>Questions and options are <strong>randomized</strong> every session.</li>
                        <li><strong>One question at a time</strong> — you cannot go back.</li>
                        <li><strong>🖥 Mandatory fullscreen</strong> — the quiz will enter fullscreen. Exiting fullscreen = instant auto-submit.</li>
                        <li><strong>Do NOT switch tabs</strong> — 3 violations = auto-submit.</li>
                        <li>Right-click, copy/paste, F12 and keyboard shortcuts are <strong>disabled</strong>.</li>
                        <li>Your result is <strong>saved automatically</strong>. You may only attempt this quiz <strong>once</strong>.</li>
                    </ul>
                </div>
                <div style={{ padding: "12px 16px", borderRadius: "10px", background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.2)", marginBottom: "20px", fontSize: "0.87rem", color: "#dc2626", fontWeight: 600 }}>
                    ⚠️ Once you click Start, the quiz will go fullscreen. Do NOT press Escape or exit fullscreen — your quiz will be auto-submitted immediately.
                </div>
                <label style={{ display: "flex", alignItems: "flex-start", gap: "12px", cursor: "pointer", marginBottom: "24px" }}>
                    <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
                        style={{ marginTop: "3px", width: "18px", height: "18px", flexShrink: 0, accentColor: "#007367" }} />
                    <span style={{ fontSize: "0.9rem", color: "#444", lineHeight: 1.6 }}>
                        I understand all the rules. This is my own work. I will not attempt to cheat.
                    </span>
                </label>
                <div style={{ display: "flex", gap: "12px" }}>
                    <button onClick={() => setStep(STEP.REGISTER)} style={{ padding: "12px 24px", borderRadius: "50px", border: "1px solid #ccc", background: "transparent", color: "#666", cursor: "pointer", fontWeight: 600 }}>← Back</button>
                    <button onClick={startQuiz} disabled={!agreed} style={{ ...btnPrimary, opacity: agreed ? 1 : 0.5, cursor: agreed ? "pointer" : "not-allowed", flex: 1 }}>
                        🖥 Enter Fullscreen & Start Quiz
                    </button>
                </div>
            </div>
        </div>
    );

    // ─── STEP: Quiz ───────────────────────────────────────────────────────────
    if (step === STEP.QUIZ) {
        const q        = questions[currentQ];
        const progress = ((currentQ + 1) / questions.length) * 100;
        const timeDanger = quiz.timeLimit > 0 && timeLeft < 60;

        return (
            <div style={{ minHeight: "100vh", background: "#f0fdf9", userSelect: "none", WebkitUserSelect: "none", fontFamily: "Inter, sans-serif" }}
                onContextMenu={e => e.preventDefault()}>
                <style>{`
                    @keyframes spin{to{transform:rotate(360deg)}}
                    @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
                    * { user-select: none !important; -webkit-user-select: none !important; }
                `}</style>

                {/* Warning banner */}
                {warning && (
                    <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 9999, background: "#dc2626", color: "#fff", textAlign: "center", padding: "14px", fontWeight: 700, fontSize: "1rem" }}>
                        {warning}
                    </div>
                )}

                {/* Header */}
                <div style={{ position: "sticky", top: 0, zIndex: 100, background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "12px 24px", display: "flex", alignItems: "center", gap: "16px" }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "0.8rem", color: "#888", marginBottom: "4px" }}>Question {currentQ + 1} of {questions.length}</div>
                        <div style={{ background: "#e5e7eb", borderRadius: "999px", height: "6px", overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${progress}%`, background: "linear-gradient(90deg,#007367,#10b981)", borderRadius: "999px", transition: "width 0.3s" }} />
                        </div>
                    </div>
                    {quiz.timeLimit > 0 && (
                        <div style={{ fontWeight: 800, fontSize: "1.2rem", color: timeDanger ? "#dc2626" : "#007367", minWidth: "64px", textAlign: "right", animation: timeDanger ? "pulse 1s ease-in-out infinite" : "none" }}>
                            ⏱ {fmtTime(timeLeft)}
                        </div>
                    )}
                    <div style={{ fontSize: "0.78rem", color: "#888" }}>👤 {student.name}</div>
                </div>

                {/* Question */}
                <div style={{ maxWidth: "700px", margin: "40px auto", padding: "0 20px 80px" }}>
                    <div style={{ background: "#fff", borderRadius: "20px", padding: "36px", boxShadow: "0 8px 32px rgba(0,0,0,0.09)", marginBottom: "20px" }}>
                        <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#007367", background: "rgba(0,115,103,0.1)", padding: "3px 12px", borderRadius: "20px" }}>Q{currentQ + 1}</span>
                        <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#1a1a1a", lineHeight: 1.5, margin: "16px 0 24px" }}>{q?.question}</h2>

                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            {q?.displayOptions.map((opt, i) => {
                                const selected = answers[currentQ] === i;
                                return (
                                    <button key={i} onClick={() => setAnswers(prev => ({ ...prev, [currentQ]: i }))}
                                        style={{
                                            textAlign: "left", padding: "14px 20px", borderRadius: "12px", cursor: "pointer",
                                            border: selected ? "2px solid #007367" : "2px solid #e5e7eb",
                                            background: selected ? "rgba(0,115,103,0.08)" : "#fafafa",
                                            fontWeight: selected ? 700 : 400, fontSize: "0.97rem", color: "#1a1a1a",
                                            transition: "all 0.15s", display: "flex", alignItems: "center", gap: "14px"
                                        }}>
                                        <span style={{ width: "28px", height: "28px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.82rem", flexShrink: 0, background: selected ? "#007367" : "#e5e7eb", color: selected ? "#fff" : "#666" }}>
                                            {String.fromCharCode(65 + i)}
                                        </span>
                                        {opt}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                        <button onClick={handleNext} disabled={answers[currentQ] === undefined || submitting}
                            style={{ ...btnPrimary, opacity: answers[currentQ] === undefined ? 0.45 : 1, cursor: answers[currentQ] === undefined ? "not-allowed" : "pointer" }}>
                            {submitting ? "Submitting…" : currentQ < questions.length - 1 ? "Next Question →" : "✅ Submit Quiz"}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ─── STEP: Done ───────────────────────────────────────────────────────────
    if (step === STEP.DONE && result) {
        const passed = result.percentage >= 50;
        return (
            <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #f0fdf9, #f8f9fa)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 20px" }}>
                <style>{`@keyframes pop{0%{transform:scale(0.7);opacity:0}100%{transform:scale(1);opacity:1}}`}</style>
                <div style={{ ...card, textAlign: "center", animation: "pop 0.4s ease" }}>
                    <div style={{ fontSize: "4rem", marginBottom: "16px" }}>{passed ? "🎉" : "📖"}</div>
                    <h2 style={{ fontWeight: 800, margin: "0 0 8px", color: "#1a1a1a" }}>{passed ? "Well Done!" : "Keep Studying!"}</h2>
                    <p style={{ color: "#666", marginBottom: "28px" }}>Your quiz has been submitted and saved.</p>

                    <div style={{ background: "linear-gradient(135deg, #007367, #10b981)", borderRadius: "16px", padding: "28px", marginBottom: "24px", color: "#fff" }}>
                        <div style={{ fontSize: "3.5rem", fontWeight: 900 }}>{result.percentage}%</div>
                        <div style={{ fontSize: "1.1rem", opacity: 0.9, marginTop: "4px" }}>{result.score} / {result.total} correct</div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "28px" }}>
                        {[
                            ["👤 Name", result.studentName],
                            ["🎓 Student ID", result.studentId],
                            ["⏱ Time", fmtTime(result.timeTaken)],
                            ["📅 Date", new Date(result.submittedAt).toLocaleDateString("en-IN")]
                        ].map(([label, val]) => (
                            <div key={label} style={{ background: "#f9fafb", borderRadius: "10px", padding: "12px", textAlign: "left" }}>
                                <div style={{ fontSize: "0.75rem", color: "#888", marginBottom: "4px" }}>{label}</div>
                                <div style={{ fontWeight: 700, color: "#1a1a1a", fontSize: "0.95rem" }}>{val}</div>
                            </div>
                        ))}
                    </div>

                    <button onClick={() => navigate("/quizzes")} style={btnPrimary}>← Back to Quizzes</button>
                </div>
            </div>
        );
    }

    return null;
}
