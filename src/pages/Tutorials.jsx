import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function Tutorials() {
    const [lessons, setLessons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedLesson, setExpandedLesson] = useState(null);
    const [expandedTopic, setExpandedTopic] = useState({});  // { lessonId: topicIdx }
    const [activeVideo, setActiveVideo] = useState({});       // { lessonId_topicIdx: videoIdx }

    useEffect(() => {
        getDocs(collection(db, "lessons")).then(snap => {
            const list = [];
            snap.forEach(d => list.push({ id: d.id, ...d.data() }));
            list.sort((a, b) => (a.order || 0) - (b.order || 0));
            setLessons(list);
            setLoading(false);
        });
    }, []);

    const toggleLesson = id => setExpandedLesson(prev => prev === id ? null : id);
    const toggleTopic  = (lid, ti) => setExpandedTopic(prev => ({ ...prev, [lid]: prev[lid] === ti ? null : ti }));
    const setVideo     = (lid, ti, vi) => setActiveVideo(prev => ({ ...prev, [`${lid}_${ti}`]: vi }));

    return (
        <div style={{ minHeight: "100vh", background: "#f8f9fa", fontFamily: "Inter, sans-serif" }}>
            <Navbar />

            {/* Hero */}
            <section style={{ paddingTop: "120px", paddingBottom: "60px", background: "linear-gradient(135deg, #007367 0%, #004d45 100%)", textAlign: "center", color: "#fff" }}>
                <div style={{ maxWidth: "720px", margin: "0 auto", padding: "0 20px" }}>
                    <h1 style={{ fontSize: "clamp(2rem,5vw,3rem)", fontWeight: 800, marginBottom: "14px", color: "#fff" }}>
                        🎬 CXR Tutorials
                    </h1>
                    <p style={{ fontSize: "1.1rem", color: "rgba(255,255,255,0.8)", lineHeight: 1.7, margin: 0 }}>
                        Learn XR related stuff from lessons crafted by the CXR Lab team.
                    </p>
                </div>
            </section>

            {/* Lessons */}
            <section style={{ maxWidth: "1000px", margin: "0 auto", padding: "60px 20px" }}>
                {loading ? (
                    <div style={{ textAlign: "center", padding: "80px 20px" }}>
                        <div style={{ width: "48px", height: "48px", margin: "0 auto 16px", border: "4px solid rgba(0,115,103,0.15)", borderTopColor: "#007367", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                        <p style={{ color: "#888" }}>Loading lessons…</p>
                    </div>
                ) : lessons.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "80px 20px" }}>
                        <span style={{ fontSize: "3.5rem" }}>🎬</span>
                        <h2 style={{ marginTop: "16px", color: "#555" }}>No lessons yet</h2>
                        <p style={{ color: "#888" }}>Check back soon — new lessons are being added.</p>
                    </div>
                ) : (
                    <div style={{ display: "grid", gap: "20px" }}>
                        {lessons.map((lesson, li) => {
                            const isOpen = expandedLesson === lesson.id;
                            return (
                                <div key={lesson.id} style={{ background: "#fff", borderRadius: "18px", overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.07)", border: "1px solid rgba(0,115,103,0.12)" }}>
                                    {/* Lesson header */}
                                    <button onClick={() => toggleLesson(lesson.id)} style={{ width: "100%", display: "flex", alignItems: "center", gap: "16px", padding: "22px 24px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
                                        <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "linear-gradient(135deg,#007367,#10b981)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: "1.1rem", flexShrink: 0 }}>
                                            {li + 1}
                                        </div>
                                        <div style={{ flex: 1, textAlign: "left" }}>
                                            <h3 style={{ margin: "0 0 4px", fontSize: "1.05rem", fontWeight: 700, color: "#1a1a1a" }}>{lesson.title}</h3>
                                            {lesson.description && <p style={{ margin: 0, fontSize: "0.85rem", color: "#888", lineHeight: 1.4 }}>{lesson.description}</p>}
                                            <div style={{ marginTop: "6px", fontSize: "0.75rem", color: "#007367", fontWeight: 700 }}>
                                                {lesson.topics?.length || 0} Topics · {lesson.topics?.reduce((a, t) => a + (t.videos?.length || 0), 0) || 0} Videos
                                            </div>
                                        </div>
                                        <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "rgba(0,115,103,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#007367", transition: "transform 0.3s", transform: isOpen ? "rotate(180deg)" : "none", flexShrink: 0 }}>▼</div>
                                    </button>

                                    {/* Lesson content */}
                                    {isOpen && (
                                        <div style={{ borderTop: "1px solid rgba(0,115,103,0.08)", padding: "12px 24px 24px" }}>
                                            {lesson.topics?.map((topic, ti) => {
                                                const topicOpen = expandedTopic[lesson.id] === ti;
                                                const vidKey = `${lesson.id}_${ti}`;
                                                const activeVi = activeVideo[vidKey] || 0;
                                                return (
                                                    <div key={ti} style={{ marginTop: "12px", borderRadius: "12px", border: "1px solid #e5e7eb", overflow: "hidden" }}>
                                                        {/* Topic header */}
                                                        <button onClick={() => toggleTopic(lesson.id, ti)} style={{ width: "100%", display: "flex", alignItems: "center", gap: "12px", padding: "14px 18px", background: topicOpen ? "rgba(0,115,103,0.06)" : "#fafafa", border: "none", cursor: "pointer", textAlign: "left" }}>
                                                            <span style={{ width: "26px", height: "26px", borderRadius: "8px", background: topicOpen ? "#007367" : "#e5e7eb", color: topicOpen ? "#fff" : "#666", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 700, flexShrink: 0 }}>
                                                                {ti + 1}
                                                            </span>
                                                            <span style={{ flex: 1, fontWeight: 600, color: "#1a1a1a", fontSize: "0.95rem" }}>{topic.title}</span>
                                                            <span style={{ fontSize: "0.75rem", color: "#888", marginRight: "8px" }}>{topic.videos?.length || 0} videos</span>
                                                            <span style={{ color: "#007367", transition: "transform 0.2s", transform: topicOpen ? "rotate(180deg)" : "none" }}>▼</span>
                                                        </button>

                                                        {/* Topic content */}
                                                        {topicOpen && (
                                                            <div style={{ padding: "18px" }}>
                                                                {/* Active video embed */}
                                                                {topic.videos?.[activeVi]?.embedId && (
                                                                    <div style={{ borderRadius: "12px", overflow: "hidden", boxShadow: "0 4px 16px rgba(0,0,0,0.12)", marginBottom: "16px" }}>
                                                                        <iframe
                                                                            src={`https://www.youtube.com/embed/${topic.videos[activeVi].embedId}?rel=0&modestbranding=1`}
                                                                            title={topic.videos[activeVi].title}
                                                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                                            allowFullScreen
                                                                            style={{ width: "100%", height: "400px", border: "none", display: "block" }}
                                                                        />
                                                                    </div>
                                                                )}

                                                                {/* Video selector (thumbnails) — scrollable row */}
                                                                {topic.videos?.length > 1 && (
                                                                    <div style={{ display: "flex", gap: "10px", overflowX: "auto", paddingBottom: "8px", marginBottom: "14px" }}>
                                                                        {topic.videos.map((v, vi) => (
                                                                            <button key={vi} onClick={() => setVideo(lesson.id, ti, vi)}
                                                                                style={{ flexShrink: 0, background: "none", border: vi === activeVi ? "2px solid #007367" : "2px solid #e5e7eb", borderRadius: "10px", padding: "4px", cursor: "pointer", opacity: vi === activeVi ? 1 : 0.7 }}>
                                                                                <img src={`https://img.youtube.com/vi/${v.embedId}/mqdefault.jpg`} alt={v.title}
                                                                                    style={{ width: "110px", height: "62px", borderRadius: "6px", objectFit: "cover", display: "block" }} />
                                                                                <p style={{ margin: "4px 0 0", fontSize: "0.72rem", color: "#444", textAlign: "center", maxWidth: "110px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.title || `Video ${vi + 1}`}</p>
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                )}

                                                                {/* What you'll learn + Notes row */}
                                                                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "flex-start" }}>
                                                                    {topic.description && (
                                                                        <div style={{ flex: 1, minWidth: "200px", background: "rgba(0,115,103,0.05)", borderRadius: "10px", padding: "12px 16px", border: "1px solid rgba(0,115,103,0.12)" }}>
                                                                            <p style={{ margin: 0, fontSize: "0.85rem", color: "#444", lineHeight: 1.6 }}>
                                                                                <strong style={{ color: "#007367" }}>📚 What you'll learn:</strong><br />
                                                                                {topic.description}
                                                                            </p>
                                                                        </div>
                                                                    )}
                                                                    {topic.notesUrl && (
                                                                        <a href={topic.notesUrl} target="_blank" rel="noreferrer"
                                                                            style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "10px 22px", borderRadius: "50px", background: "linear-gradient(135deg,#007367,#10b981)", color: "#fff", fontWeight: 700, fontSize: "0.9rem", textDecoration: "none", boxShadow: "0 4px 14px rgba(0,115,103,0.3)", flexShrink: 0 }}>
                                                                            📄 Download Notes
                                                                        </a>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <Footer />
        </div>
    );
}
