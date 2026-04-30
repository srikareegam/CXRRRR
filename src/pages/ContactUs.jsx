import React, { useState } from "react";
import { db } from "../firebase/firebaseConfig";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Mail, MapPin, Send, BookOpen, Sun } from "lucide-react";

export default function ContactUs() {
    const [formData, setFormData] = useState({
        name: "", email: "", phone: "", reason: "",
        yearOfStudy: "", fieldOfStudy: "", userType: "", internship: "", resumeLink: "",
        campus: "", accommodation: "", hostelRequired: ""
    });
    const [status, setStatus] = useState("");
    const [focused, setFocused] = useState("");

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const selectType = (type) => {
        setFormData(f => ({ ...f, userType: type }));
        setTimeout(() => {
            document.getElementById("contact-form-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 80);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus("sending");
        try {
            const emailSnap = await getDocs(query(collection(db, "contact_messages"), where("email", "==", formData.email.trim().toLowerCase())));
            const nameSnap = await getDocs(query(collection(db, "contact_messages"), where("name", "==", formData.name.trim())));

            if (!emailSnap.empty || !nameSnap.empty) {
                setStatus("duplicate");
                return;
            }

            await addDoc(collection(db, "contact_messages"), {
                ...formData,
                email: formData.email.trim().toLowerCase(),
                name: formData.name.trim(),
                createdAt: new Date()
            });
            setStatus("success");
            setFormData({ name: "", email: "", phone: "", reason: "", yearOfStudy: "", fieldOfStudy: "", userType: "", internship: "", resumeLink: "", campus: "", accommodation: "", hostelRequired: "" });
            setTimeout(() => setStatus(""), 5000);
        } catch (error) {
            console.error("Error submitting contact form: ", error);
            setStatus("error");
        }
    };

    const typeCards = [
        {
            type: "Student",
            title: "Student",
            subtitle: "Internship applications, research queries, project collaborations"
        },
        {
            type: "Faculty/Staff",
            title: "Faculty / Staff",
            subtitle: "Academic collaboration, research partnerships, faculty inquiries"
        },
        {
            type: "Other",
            title: "Others",
            subtitle: "Industry partners, researchers, general inquiries"
        }
    ];

    return (
        <div className="portfolio-wrapper" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
            <Navbar />

            <style>{`
                .contact-page {
                    flex: 1;
                    padding: 120px 8% 80px;
                    display: flex;
                    flex-direction: column;
                    gap: 60px;
                }

                /* Summer Banner */
                .summer-banner {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    padding: 20px 32px;
                    border-radius: 16px;
                    background: linear-gradient(135deg, #005a52, #00a88e);
                    color: #ffffff;
                    box-shadow: 0 8px 32px rgba(0,184,156,0.35);
                    animation: bannerPulse 3s ease-in-out infinite;
                    position: relative;
                    overflow: hidden;
                }
                .summer-banner * { color: #ffffff !important; text-shadow: 0 1px 3px rgba(0,0,0,0.25); }
                .summer-banner::after {
                    content: '';
                    position: absolute;
                    top: 0; left: -60%;
                    width: 40%; height: 100%;
                    background: linear-gradient(120deg, transparent, rgba(255,255,255,0.18), transparent);
                    transform: skewX(-20deg);
                    animation: bannerShimmer 3.5s ease-in-out infinite;
                }
                @keyframes bannerPulse {
                    0%,100% { box-shadow: 0 8px 32px rgba(0,184,156,0.35); }
                    50%      { box-shadow: 0 8px 48px rgba(0,184,156,0.6); }
                }
                @keyframes bannerShimmer {
                    0%      { left: -60%; }
                    60%,100%{ left: 120%; }
                }

                /* Two-column layout */
                .contact-grid {
                    display: grid;
                    grid-template-columns: 1fr 1.4fr;
                    gap: 50px;
                    align-items: start;
                }
                @media (max-width: 860px) {
                    .contact-grid { grid-template-columns: 1fr; }
                }

                /* Info Cards (no icon) */
                .info-card {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    padding: 20px 24px;
                    border-radius: 14px;
                    background: rgba(255,255,255,0.55);
                    backdrop-filter: blur(12px);
                    border: 1px solid rgba(0,115,103,0.15);
                    box-shadow: 0 4px 20px rgba(0,0,0,0.06);
                    transition: transform 0.2s, box-shadow 0.2s;
                }
                .info-card:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 8px 28px rgba(0,115,103,0.18);
                }

                /* Type Selector Cards */
                .type-card {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    padding: 20px 24px;
                    border-radius: 14px;
                    background: rgba(255,255,255,0.55);
                    backdrop-filter: blur(12px);
                    border: 2px solid rgba(0,115,103,0.15);
                    box-shadow: 0 4px 20px rgba(0,0,0,0.06);
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .type-card:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 8px 28px rgba(0,115,103,0.18);
                    border-color: rgba(0,115,103,0.4);
                }
                .type-card.selected {
                    border-color: var(--accent-color);
                    background: rgba(0,115,103,0.07);
                    box-shadow: 0 6px 24px rgba(0,115,103,0.2);
                }

                /* Form Panel */
                .form-panel {
                    background: rgba(255,255,255,0.6);
                    backdrop-filter: blur(16px);
                    border: 1px solid rgba(0,115,103,0.15);
                    border-radius: 24px;
                    padding: 44px;
                    box-shadow: 0 12px 48px rgba(0,0,0,0.08);
                    animation: slideIn 0.35s ease;
                }
                @keyframes slideIn {
                    from { opacity: 0; transform: translateY(18px); }
                    to   { opacity: 1; transform: translateY(0); }
                }

                /* Inputs */
                .field-wrap { position: relative; margin-bottom: 6px; }
                .field-label {
                    display: block;
                    font-size: 0.82rem;
                    font-weight: 600;
                    color: var(--accent-color);
                    margin-bottom: 6px;
                    letter-spacing: 0.03em;
                    text-transform: uppercase;
                }
                .field-input {
                    width: 100%;
                    padding: 13px 16px;
                    border-radius: 10px;
                    border: 1.5px solid rgba(0,115,103,0.2);
                    background: rgba(255,255,255,0.8);
                    color: var(--text-main);
                    font-size: 0.97rem;
                    outline: none;
                    transition: border-color 0.25s, box-shadow 0.25s;
                    box-sizing: border-box;
                }
                .field-input:focus {
                    border-color: var(--accent-color);
                    box-shadow: 0 0 0 3px rgba(0,115,103,0.12);
                }
                .field-input::placeholder { color: #aaa; }

                /* Radio pills */
                .radio-group { display: flex; gap: 12px; flex-wrap: wrap; }
                .radio-pill input { display: none; }
                .radio-pill span {
                    display: inline-block;
                    padding: 8px 20px;
                    border-radius: 50px;
                    border: 1.5px solid rgba(0,115,103,0.3);
                    cursor: pointer;
                    font-size: 0.9rem;
                    font-weight: 600;
                    color: var(--text-muted);
                    transition: all 0.2s;
                    background: rgba(255,255,255,0.7);
                }
                .radio-pill input:checked + span {
                    background: linear-gradient(135deg, #007367, #00b89c);
                    color: #fff;
                    border-color: transparent;
                    box-shadow: 0 4px 14px rgba(0,184,156,0.35);
                }

                /* Submit button */
                .submit-btn {
                    width: 100%;
                    padding: 15px;
                    border-radius: 12px;
                    border: none;
                    background: linear-gradient(135deg, #007367, #00b89c);
                    color: #fff;
                    font-size: 1rem;
                    font-weight: 700;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    transition: opacity 0.2s, transform 0.2s;
                    box-shadow: 0 6px 20px rgba(0,184,156,0.35);
                }
                .submit-btn:hover:not(:disabled) { opacity: 0.88; transform: translateY(-2px); }
                .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }

                /* Toasts */
                .toast-success {
                    padding: 14px 20px; border-radius: 12px;
                    background: rgba(16,185,129,0.1); color: #047857;
                    border: 1px solid rgba(16,185,129,0.3);
                    font-weight: 600; animation: toastIn 0.4s ease;
                }
                .toast-error {
                    padding: 14px 20px; border-radius: 12px;
                    background: rgba(239,68,68,0.1); color: #b91c1c;
                    border: 1px solid rgba(239,68,68,0.3);
                    font-weight: 600; animation: toastIn 0.4s ease;
                }
                @keyframes toastIn {
                    from { opacity: 0; transform: translateY(-8px); }
                    to   { opacity: 1; transform: translateY(0); }
                }

                /* Student extra fields reveal */
                .student-fields {
                    display: flex; flex-direction: column; gap: 18px;
                    border-top: 1px dashed rgba(0,115,103,0.2);
                    padding-top: 18px; margin-top: 4px;
                }
            `}</style>

            <div className="contact-page">

                {/* Summer Internship Banner */}
                <div className="summer-banner">
                    <Sun size={32} style={{ flexShrink: 0 }} />
                    <div>
                        <p style={{ fontWeight: 800, fontSize: '1.1rem', margin: 0 }}>Summer Internship 2026 Applications Open!</p>
                        <p style={{ margin: '4px 0 0', fontSize: '0.9rem', opacity: 0.9 }}>
                            Students can apply directly â€” click <strong>"Student"</strong> below and mark <strong>"Applying for Internship: Yes"</strong>.
                            Check the Announcements section for topics and more info.
                        </p>
                    </div>
                </div>

                <div className="contact-grid">

                    {/* LEFT: Info + Type Selector */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                        <div>
                            <h1 className="text-gradient" style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '14px', lineHeight: 1.2 }}>
                                Get in Touch
                            </h1>
                            <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: 1.7 }}>
                                Whether you're a student looking to intern, a researcher collaborating with us, or an industry partner â€” we'd love to hear from you!
                            </p>
                        </div>

                        <div className="info-card">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Mail size={18} color="var(--accent-color)" />
                                <p style={{ fontWeight: 700, margin: 0 }}>Email Us</p>
                            </div>
                            <a href="mailto:kmandava@gitam.edu" style={{ color: 'var(--accent-color)', textDecoration: 'none', fontSize: '0.9rem' }}>kmandava@gitam.edu</a>
                            <a href="mailto:nmeesala@gitam.edu" style={{ color: 'var(--accent-color)', textDecoration: 'none', fontSize: '0.9rem' }}>nmeesala@gitam.edu</a>
                        </div>

                        <div className="info-card">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <MapPin size={18} color="var(--accent-color)" />
                                <p style={{ fontWeight: 700, margin: 0 }}>Visit Us</p>
                            </div>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>CRL-1 Building, Room 508, GITAM University, Visakhapatnam</p>
                        </div>

                        {/* Who are you? */}
                        <div>
                            <p style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-main)', marginBottom: '14px' }}>
                                Who are you? Select to open the form:
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {typeCards.map(({ type, title, subtitle }) => (
                                    <div
                                        key={type}
                                        className={`type-card${formData.userType === type ? ' selected' : ''}`}
                                        onClick={() => selectType(type)}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={e => e.key === 'Enter' && selectType(type)}
                                    >
                                        <p style={{ fontWeight: 700, margin: 0, color: formData.userType === type ? 'var(--accent-color)' : 'var(--text-main)', fontSize: '1rem' }}>
                                            {title}
                                        </p>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>{subtitle}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: Form â€” only renders when type is selected */}
                    {formData.userType ? (
                        <div className="form-panel" id="contact-form-section">
                            <h2 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '28px' }}>
                                Send us a Message
                                <span style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: 'var(--accent-color)', marginTop: '4px' }}>
                                    {formData.userType === 'Student' ? 'Student form' : formData.userType === 'Faculty/Staff' ? 'Faculty / Staff form' : 'General enquiry form'}
                                </span>
                            </h2>

                            {status === 'success' && (
                                <div className="toast-success" style={{ marginBottom: '20px' }}>
                                    Message sent successfully! We'll get back to you soon.
                                </div>
                            )}
                            {status === 'error' && (
                                <div className="toast-error" style={{ marginBottom: '20px' }}>
                                    Failed to send message. Please try again.
                                </div>
                            )}
                            {status === 'duplicate' && (
                                <div style={{
                                    padding: '16px 20px', borderRadius: '12px', marginBottom: '20px',
                                    background: 'rgba(245,158,11,0.12)', color: '#b45309',
                                    border: '1px solid rgba(245,158,11,0.3)', fontWeight: 600,
                                    display: 'flex', alignItems: 'flex-start', gap: '10px',
                                    animation: 'toastIn 0.4s ease'
                                }}>
                                    <div>
                                        <p style={{ margin: 0, fontWeight: 700 }}>You've already applied!</p>
                                        <p style={{ margin: '4px 0 0', fontSize: '0.88rem', fontWeight: 400 }}>
                                            Our records show a submission with this email or name already exists. If you think this is a mistake, contact us at{' '}
                                            <a href="mailto:nmeesala@gitam.edu" style={{ color: '#b45309' }}>nmeesala@gitam.edu</a>.
                                        </p>
                                    </div>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div className="field-wrap">
                                        <label className="field-label">Full Name</label>
                                        <input name="name" value={formData.name} onChange={handleChange} required
                                            placeholder="Your full name" className="field-input" />
                                    </div>
                                    <div className="field-wrap">
                                        <label className="field-label">Email Address</label>
                                        <input type="email" name="email" value={formData.email} onChange={handleChange} required
                                            placeholder="you@email.com" className="field-input" />
                                    </div>
                                </div>

                                {formData.userType === "Student" && (
                                    <div className="field-wrap">
                                        <label className="field-label">Phone Number</label>
                                        <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required
                                            placeholder="+91 XXXXX XXXXX" className="field-input" />
                                    </div>
                                )}

                                {/* Hidden radio â€” keeps form data consistent, type selected from left card */}
                                <input type="hidden" name="userType" value={formData.userType} />

                                <div className="field-wrap">
                                    <label className="field-label">Reason of Contact</label>
                                    <textarea name="reason" value={formData.reason} onChange={handleChange} required rows="3"
                                        placeholder="Tell us why you're reaching out..." className="field-input"
                                        style={{ resize: 'vertical' }} />
                                </div>

                                {formData.userType === "Student" && (
                                    <div className="student-fields">
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                            <div className="field-wrap">
                                                <label className="field-label">Year of Study</label>
                                                <select name="yearOfStudy" value={formData.yearOfStudy} onChange={handleChange} required className="field-input">
                                                    <option value="">Select Year</option>
                                                    <option value="1">1st Year</option>
                                                    <option value="2">2nd Year</option>
                                                    <option value="3">3rd Year</option>
                                                    <option value="4">4th Year</option>
                                                </select>
                                            </div>
                                            <div className="field-wrap">
                                                <label className="field-label">Field of Study</label>
                                                <input name="fieldOfStudy" value={formData.fieldOfStudy} onChange={handleChange} required
                                                    placeholder="e.g. CSE, ECE..." className="field-input" />
                                            </div>
                                        </div>
                                        <div className="field-wrap">
                                            <label className="field-label">Applying for Summer Internship?</label>
                                            <select name="internship" value={formData.internship} onChange={handleChange} required className="field-input">
                                                <option value="">Select</option>
                                                <option value="Yes">Yes - I want to apply!</option>
                                                <option value="No">No</option>
                                            </select>
                                        </div>

                                        {/* GITAM Campus */}
                                        <div className="field-wrap">
                                            <label className="field-label">GITAM Campus *</label>
                                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '6px' }}>
                                                {['Visakhapatnam', 'Hyderabad', 'Bengaluru'].map(c => (
                                                    <label key={c} style={{
                                                        display: 'flex', alignItems: 'center', gap: '7px',
                                                        padding: '8px 16px', borderRadius: '8px', cursor: 'pointer',
                                                        border: formData.campus === c ? '2px solid var(--accent-color)' : '2px solid var(--border-color)',
                                                        background: formData.campus === c ? 'rgba(0,115,103,0.08)' : 'transparent',
                                                        fontWeight: formData.campus === c ? 700 : 400,
                                                        transition: 'all 0.15s'
                                                    }}>
                                                        <input type="radio" name="campus" value={c}
                                                            checked={formData.campus === c}
                                                            onChange={handleChange} required
                                                            style={{ accentColor: 'var(--accent-color)', width: '15px', height: '15px' }} />
                                                        <span style={{ fontSize: '0.88rem', color: 'var(--text-main)' }}>{c}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Hostel / Day Scholar */}
                                        <div className="field-wrap">
                                            <label className="field-label">Accommodation Type *</label>
                                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '6px' }}>
                                                {['Hostler', 'Day Scholar'].map(t => (
                                                    <label key={t} style={{
                                                        display: 'flex', alignItems: 'center', gap: '7px',
                                                        padding: '8px 16px', borderRadius: '8px', cursor: 'pointer',
                                                        border: formData.accommodation === t ? '2px solid var(--accent-color)' : '2px solid var(--border-color)',
                                                        background: formData.accommodation === t ? 'rgba(0,115,103,0.08)' : 'transparent',
                                                        fontWeight: formData.accommodation === t ? 700 : 400,
                                                        transition: 'all 0.15s'
                                                    }}>
                                                        <input type="radio" name="accommodation" value={t}
                                                            checked={formData.accommodation === t}
                                                            onChange={handleChange} required
                                                            style={{ accentColor: 'var(--accent-color)', width: '15px', height: '15px' }} />
                                                        <span style={{ fontSize: '0.88rem', color: 'var(--text-main)' }}>
                                                            {t === 'Hostler' ? ' Hostler' : ' Day Scholar'}
                                                        </span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Hostel Required â€” only shown for Day Scholars applying for internship */}
                                        {formData.accommodation === 'Day Scholar' && formData.internship === 'Yes' && (
                                            <div className="field-wrap" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '10px', padding: '14px' }}>
                                                <label className="field-label">Will you require hostel accommodation during internship? *</label>
                                                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                                                    {['Yes - Need Hostel', 'No - Have Arrangement'].map(opt => (
                                                        <label key={opt} style={{
                                                            display: 'flex', alignItems: 'center', gap: '7px',
                                                            padding: '8px 16px', borderRadius: '8px', cursor: 'pointer',
                                                            border: formData.hostelRequired === opt ? '2px solid #d97706' : '2px solid var(--border-color)',
                                                            background: formData.hostelRequired === opt ? 'rgba(245,158,11,0.1)' : 'transparent',
                                                            fontWeight: formData.hostelRequired === opt ? 700 : 400,
                                                            fontSize: '0.86rem'
                                                        }}>
                                                            <input type="radio" name="hostelRequired" value={opt}
                                                                checked={formData.hostelRequired === opt}
                                                                onChange={handleChange} required
                                                                style={{ accentColor: '#d97706', width: '15px', height: '15px' }} />
                                                            <span style={{ color: 'var(--text-main)' }}>{opt}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Resume link â€” only when internship = Yes */}
                                        {formData.internship === "Yes" && (
                                            <div className="field-wrap">
                                                <label className="field-label">Resume / CV Link *</label>
                                                <input
                                                    type="url"
                                                    name="resumeLink"
                                                    value={formData.resumeLink}
                                                    onChange={handleChange}
                                                    required
                                                    placeholder="https://drive.google.com/file/d/... or LinkedIn, etc."
                                                    className="field-input"
                                                />
                                                <p style={{ margin: '5px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                                    Share a Google Drive, LinkedIn, or any public link to your resume/CV.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <button type="submit" className="submit-btn" disabled={status === 'sending'}>
                                    {status === 'sending' ? 'Sending...' : <><Send size={18} /> Send Message</>}
                                </button>
                            </form>
                        </div>
                    ) : (
                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            minHeight: '300px', borderRadius: '24px',
                            border: '2px dashed rgba(0,115,103,0.2)',
                            background: 'rgba(0,115,103,0.03)'
                        }}>
                            <p style={{ color: 'var(--text-muted)', textAlign: 'center', fontSize: '1rem', padding: '20px' }}>
                                Select who you are on the left<br />to open the contact form
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <Footer />
        </div>
    );
}
