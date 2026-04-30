import { useEffect, useState } from "react";

// ─── URL type detection ────────────────────────────────────────────────────────
function isDriveUrl(url)      { return url && url.includes("drive.google.com"); }
function isCloudinaryPdf(url) { return url && url.includes("/image/upload/"); }

// Cloudinary page-as-image transformation
// PDFs stored under /image/upload/ support pg_N page transformations.
// We must change .pdf → .jpg so the browser renders it as a JPEG image.
function cloudinaryPageUrl(pdfUrl, pageNum) {
    return pdfUrl
        .replace("/upload/", `/upload/pg_${pageNum}/`)
        .replace(/\.pdf$/i, ".jpg");
}

// Extract Drive file ID from any Drive share/preview URL
function getDriveFileId(url) {
    const m = url.match(/drive\.google\.com\/file\/d\/([^/?#\s]+)/);
    return m ? m[1] : null;
}

/**
 * PDF Preview Modal — three strategies:
 *
 *  1. Google Drive URL  → styled "Open in Google Drive" card (iframe is unreliable)
 *  2. Cloudinary image  → <img pg_N> page-by-page viewer (zero browser restrictions)
 *  3. Everything else   → "Open in New Tab" fallback
 */
export default function PdfPreviewModal({ url, onClose }) {
    // Cloudinary page viewer state
    const [page, setPage]           = useState(1);
    const [maxPage, setMaxPage]     = useState(Infinity);
    const [loading, setLoading]     = useState(true);
    const [pageError, setPageError] = useState(false);

    const useDrive      = isDriveUrl(url);
    const useCloudinary = !useDrive && isCloudinaryPdf(url);
    const driveFileId   = useDrive ? getDriveFileId(url) : null;

    // Direct Drive URL (for thumbnail + open button)
    const driveOpenUrl  = driveFileId
        ? `https://drive.google.com/file/d/${driveFileId}/view?usp=sharing`
        : url;

    // Keyboard + scroll lock
    useEffect(() => {
        const onKey = (e) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("keydown", onKey);
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.style.overflow = "";
        };
    }, [onClose]);

    // Reset on URL change
    useEffect(() => {
        setPage(1); setMaxPage(Infinity); setLoading(true); setPageError(false);
    }, [url]);

    // ── Cloudinary image handlers ─────────────────────────────────────────────
    const handleLoad  = () => { setLoading(false); setPageError(false); };
    const handleError = () => {
        if (page === 1) { setPageError(true); setLoading(false); }
        else { setMaxPage(page - 1); setPage((p) => p - 1); setLoading(false); }
    };
    const goPrev = () => { if (page > 1)       { setLoading(true); setPage((p) => p - 1); } };
    const goNext = () => { if (page < maxPage) { setLoading(true); setPage((p) => p + 1); } };

    if (!url) return null;

    // ── Shared nav button style ───────────────────────────────────────────────
    const navBtn = (active) => ({
        padding: "8px 22px", borderRadius: "8px", border: "none",
        fontWeight: 700, fontSize: "0.9rem",
        cursor: active ? "pointer" : "not-allowed", transition: "all 0.2s",
        background: active ? "rgba(0,115,103,0.25)" : "rgba(255,255,255,0.05)",
        color:      active ? "#5eead4"              : "rgba(255,255,255,0.2)"
    });

    return (
        <div
            id="pdf-preview-overlay"
            onClick={onClose}
            style={{
                position: "fixed", inset: 0, zIndex: 99999,
                backgroundColor: "rgba(0,0,0,0.88)",
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: "20px", backdropFilter: "blur(6px)"
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: "100%", maxWidth: "900px",
                    maxHeight: "92vh",
                    background: "#0f1724", borderRadius: "18px",
                    overflow: "hidden", display: "flex", flexDirection: "column",
                    boxShadow: "0 30px 80px rgba(0,0,0,0.7)",
                    border: "1px solid rgba(0,115,103,0.3)"
                }}
            >
                {/* ── Header ─────────────────────────────────────────────── */}
                <div style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "13px 20px", flexShrink: 0, gap: "12px", flexWrap: "wrap",
                    borderBottom: "1px solid rgba(255,255,255,0.08)",
                    background: "rgba(0,115,103,0.12)"
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontSize: "1.2rem" }}>📄</span>
                        <span style={{ color: "#fff", fontWeight: 700, fontSize: "0.97rem" }}>PDF Preview</span>
                        <span style={{
                            fontSize: "0.72rem", color: "rgba(255,255,255,0.35)",
                            background: "rgba(255,255,255,0.06)", borderRadius: "99px", padding: "2px 10px"
                        }}>
                            {useDrive ? "Google Drive" : useCloudinary ? "Cloudinary" : "External"}
                        </span>
                    </div>
                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                        <a href={useDrive ? driveOpenUrl : url} target="_blank" rel="noreferrer" style={{
                            background: "rgba(0,115,103,0.2)", border: "1px solid rgba(0,115,103,0.4)",
                            borderRadius: "8px", color: "#5eead4", padding: "6px 14px",
                            fontWeight: 700, fontSize: "0.82rem", textDecoration: "none",
                            display: "inline-flex", alignItems: "center", gap: "5px"
                        }}>↗ Open in New Tab</a>
                        <button onClick={onClose} style={{
                            background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.35)",
                            borderRadius: "8px", color: "#ef4444", padding: "6px 14px",
                            cursor: "pointer", fontWeight: 700, fontSize: "0.85rem"
                        }}>✕ Close</button>
                    </div>
                </div>

                {/* ── Strategy 1: Google Drive — styled open-card ──────── */}
                {useDrive && (
                    <div style={{
                        flex: 1, display: "flex", flexDirection: "column",
                        alignItems: "center", justifyContent: "center",
                        gap: "0", padding: "40px 24px"
                    }}>
                        {/* Drive thumbnail via Google Docs preview service */}
                        <div style={{
                            width: "220px", height: "290px", borderRadius: "12px",
                            overflow: "hidden", boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
                            marginBottom: "32px", background: "#fff",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            position: "relative"
                        }}>
                            {driveFileId ? (
                                <img
                                    src={`https://lh3.googleusercontent.com/d/${driveFileId}`}
                                    alt="PDF preview"
                                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                    onError={(e) => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }}
                                />
                            ) : null}
                            {/* Fallback icon (shown if thumbnail fails) */}
                            <div style={{
                                display: driveFileId ? "none" : "flex",
                                flexDirection: "column", alignItems: "center", justifyContent: "center",
                                width: "100%", height: "100%",
                                background: "linear-gradient(135deg, #f0fdf4, #dcfce7)"
                            }}>
                                <span style={{ fontSize: "5rem", lineHeight: 1 }}>📄</span>
                            </div>
                        </div>

                        <p style={{
                            color: "rgba(255,255,255,0.5)", fontSize: "0.88rem", textAlign: "center",
                            maxWidth: "340px", lineHeight: 1.6, margin: "0 0 28px"
                        }}>
                            This PDF is hosted on Google Drive. Click below to open it in full — no downloads required.
                        </p>

                        <a
                            href={driveOpenUrl}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                                display: "inline-flex", alignItems: "center", gap: "12px",
                                padding: "14px 40px", borderRadius: "50px",
                                background: "linear-gradient(135deg, #007367, #10b981)",
                                color: "#fff", fontWeight: 800, fontSize: "1.05rem",
                                textDecoration: "none",
                                boxShadow: "0 8px 28px rgba(0,115,103,0.45)",
                                transition: "transform 0.2s, box-shadow 0.2s"
                            }}
                            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 36px rgba(0,115,103,0.55)"; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 8px 28px rgba(0,115,103,0.45)"; }}
                        >
                            <svg width="22" height="22" viewBox="0 0 87.3 78" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                                <path d="M43.65 25 29.9 1.2C28.55 2 27.4 3.1 26.6 4.5l-25.4 44a9.06 9.06 0 0 0-1.2 4.5h27.5z" fill="#00ac47"/>
                                <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H59.85l5.85 10.6z" fill="#ea4335"/>
                                <path d="M43.65 25 57.4 1.2C56.05.4 54.5 0 52.85 0H34.45c-1.65 0-3.2.45-4.55 1.2z" fill="#00832d"/>
                                <path d="M59.85 53H27.5L13.75 76.8c1.35.8 2.9 1.2 4.55 1.2h50.7c1.65 0 3.2-.45 4.55-1.2z" fill="#2684fc"/>
                                <path d="M73.4 26.5l-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3L43.65 25 59.85 53h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
                            </svg>
                            Open in Google Drive
                        </a>

                        <p style={{ color: "rgba(255,255,255,0.25)", fontSize: "0.75rem", marginTop: "16px" }}>
                            Opens in a new tab · No sign-in required if shared publicly
                        </p>
                    </div>
                )}

                {/* ── Strategy 2: Cloudinary page-as-image viewer ──────── */}
                {useCloudinary && !pageError && (
                    <>
                        <div style={{
                            flex: 1, overflow: "auto", background: "#e8e8e8",
                            display: "flex", alignItems: "flex-start",
                            justifyContent: "center", padding: "24px",
                            position: "relative"
                        }}>
                            {loading && (
                                <div style={{
                                    position: "absolute", inset: 0, zIndex: 2,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    background: "rgba(15,23,36,0.75)"
                                }}>
                                    <div style={{
                                        width: "46px", height: "46px",
                                        border: "4px solid rgba(255,255,255,0.1)",
                                        borderTopColor: "#007367",
                                        borderRadius: "50%", animation: "spin 0.8s linear infinite"
                                    }} />
                                </div>
                            )}
                            <img
                                key={cloudinaryPageUrl(url, page)}
                                src={cloudinaryPageUrl(url, page)}
                                alt={`PDF page ${page}`}
                                onLoad={handleLoad}
                                onError={handleError}
                                style={{
                                    maxWidth: "100%", height: "auto",
                                    display: loading ? "none" : "block",
                                    boxShadow: "0 8px 30px rgba(0,0,0,0.25)",
                                    borderRadius: "4px", background: "#fff"
                                }}
                            />
                        </div>
                        <div style={{
                            display: "flex", alignItems: "center", justifyContent: "center",
                            gap: "18px", padding: "12px 20px",
                            borderTop: "1px solid rgba(255,255,255,0.07)",
                            background: "#0d1420", flexShrink: 0
                        }}>
                            <button onClick={goPrev} disabled={page === 1} style={navBtn(page > 1)}>← Prev</button>
                            <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.88rem", minWidth: "90px", textAlign: "center" }}>
                                Page {page}{isFinite(maxPage) ? ` / ${maxPage}` : ""}
                            </span>
                            <button onClick={goNext} disabled={page >= maxPage} style={navBtn(page < maxPage)}>Next →</button>
                        </div>
                    </>
                )}

                {/* ── Strategy 3: Open-in-Tab fallback ─────────────────── */}
                {!useDrive && (!useCloudinary || pageError) && (
                    <div style={{
                        flex: 1, display: "flex", flexDirection: "column",
                        alignItems: "center", justifyContent: "center",
                        gap: "22px", padding: "48px 24px", textAlign: "center"
                    }}>
                        <span style={{ fontSize: "3.5rem" }}>📄</span>
                        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "1rem", maxWidth: "380px", lineHeight: 1.7, margin: 0 }}>
                            Click below to open the PDF directly.
                        </p>
                        <a href={url} target="_blank" rel="noreferrer" style={{
                            background: "linear-gradient(135deg, #007367, #10b981)",
                            color: "#fff", padding: "13px 38px", borderRadius: "50px",
                            fontWeight: 700, fontSize: "1rem", textDecoration: "none",
                            display: "inline-flex", alignItems: "center", gap: "8px",
                            boxShadow: "0 6px 22px rgba(0,115,103,0.4)"
                        }}>↗ Open PDF in New Tab</a>
                    </div>
                )}
            </div>
        </div>
    );
}
