import { useEffect, useState, useRef } from "react"
import { Link, useNavigate } from "react-router-dom"
import { db, auth } from "../firebase/firebaseConfig"
import { onAuthStateChanged } from "firebase/auth"
import { ALLOWED_EMAILS } from "../config/adminEmails"
import {
    collection, getDocs, updateDoc, addDoc, doc,
    query, where, deleteDoc, orderBy, Timestamp
} from "firebase/firestore"
import emailjs from "@emailjs/browser"
import * as faceapi from "@vladmandic/face-api"

const formatDate = (dateValue) => {
    if (!dateValue) return "N/A";
    let d;
    if (dateValue.seconds) {
        d = new Date(dateValue.seconds * 1000);
    } else {
        d = new Date(dateValue);
    }
    if (isNaN(d.getTime())) return String(dateValue);
    
    return d.toLocaleString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: 'numeric', minute: '2-digit', hour12: true
    });
};

// ALLOWED_EMAILS imported from ../config/adminEmails

export default function AdminDashboard() {

    const navigate = useNavigate()

    const [requests, setRequests] = useState([])
    const [inventory, setInventory] = useState([])
    const [newProduct, setNewProduct] = useState({ name: "", available: 0, imageUrl: "" })
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        approved: 0
    })

    // PROJECT SHOWCASE
    const [showcaseProjects, setShowcaseProjects] = useState([])
    const [newProject, setNewProject] = useState({ title: "", description: "", repoLink: "", imageUrl: "" })

    // CONTACT MESSAGES
    const [contactRequests, setContactRequests] = useState([])

    // ERROR / LOADING
    const [dbError, setDbError] = useState(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState("requests")

    // QUIZZES
    const [quizzes, setQuizzes]     = useState([])
    const [quizResults, setQuizResults] = useState(null)  // { title, results[] }
    const [newQuiz, setNewQuiz] = useState({
        title: "", timeLimit: 10, isActive: true,
        startAt: "", endAt: "",
        questions: [{ question: "", options: ["","","",""], answer: 0 }]
    })

    // LESSONS / TUTORIALS
    const [lessons, setLessons] = useState([])
    const [newLesson, setNewLesson] = useState({
        title: "", description: "", order: 1,
        topics: [{ title: "", videos: [""], materials: [""] }]
    })

    // ATTENDANCE
    const [attendanceRecords, setAttendanceRecords] = useState([])
    const [newAttendanceUser, setNewAttendanceUser] = useState("")
    const [isAttendanceRunning, setIsAttendanceRunning] = useState(false)
    const [modelsLoaded, setModelsLoaded] = useState(false)
    const videoRef = useRef(null)
    const [cameraStream, setCameraStream] = useState(null)
    const [scanStatus, setScanStatus] = useState("")

    // ANNOUNCEMENTS
    const [announcements, setAnnouncements] = useState([])
    const [newAnnouncement, setNewAnnouncement] = useState({ title: "", content: "", topic: "", imageUrl: "", pdfUrl: "" })

    // COLLABORATORS
    const [collaborators, setCollaborators] = useState([])
    const [newCollaborator, setNewCollaborator] = useState({ name: "", imgUrl: "" })

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (!user || !ALLOWED_EMAILS.includes(user.email)) {
                navigate("/admin", { replace: true })
            } else {
                setLoading(true)
                Promise.all([
                    loadRequests(),
                    loadInventory(),
                    loadShowcaseProjects(),
                    loadContactRequests(),
                    loadQuizzes(),
                    loadLessons(),
                    loadAttendance(),
                    loadFaceModels(),
                    loadAnnouncements(),
                    loadCollaborators()
                ]).finally(() => setLoading(false))
            }
        })
        return () => unsubscribe()
    }, [navigate])

    const loadRequests = async () => {
        try {
            const snapshot = await getDocs(collection(db, "requests"))
            const list = []
            let pending = 0, approved = 0
            snapshot.forEach((d) => {
                const data = d.data()
                if (data.status === "pending") pending++
                if (data.status === "approved") approved++
                list.push({ id: d.id, ...data })
            })
            setRequests(list)
            setStats({ total: list.length, pending, approved })
        } catch (err) {
            console.error("loadRequests:", err)
            setDbError(err.code || err.message)
        }
    }

    // INVENTORY FUNCTIONS
    const loadInventory = async () => {
        try {
            const snapshot = await getDocs(collection(db, "products"))
            const list = []
            snapshot.forEach(docSnap => list.push({ id: docSnap.id, ...docSnap.data() }))
            setInventory(list)
        } catch (err) { console.error("loadInventory:", err); setDbError(err.code || err.message) }
    }

    const handleAddProduct = async (e) => {
        e.preventDefault()
        if (!newProduct.name.trim() || newProduct.available < 0) return
        await addDoc(collection(db, "products"), {
            name: newProduct.name.trim(),
            available: Number(newProduct.available),
            imageUrl: newProduct.imageUrl || ""
        })
        setNewProduct({ name: "", available: 0, imageUrl: "" })
        loadInventory()
    }

    const handleUpdateQuantity = async (id, currentQty, amount) => {
        const newQty = currentQty + amount
        if (newQty < 0) return
        const productRef = doc(db, "products", id)
        await updateDoc(productRef, { available: newQty })
        loadInventory()
    }

    // PROJECT FUNCTIONS
    const loadShowcaseProjects = async () => {
        try {
            const snapshot = await getDocs(collection(db, "projects_showcase"))
            const list = []
            snapshot.forEach(docSnap => list.push({ id: docSnap.id, ...docSnap.data() }))
            setShowcaseProjects(list)
        } catch (err) { console.error("loadProjects:", err); setDbError(err.code || err.message) }
    }

    const loadContactRequests = async () => {
        try {
            const snapshot = await getDocs(collection(db, "contact_messages"));
            const list = [];
            snapshot.forEach(docSnap => list.push({ id: docSnap.id, ...docSnap.data() }));
            list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
            setContactRequests(list);
        } catch (err) { console.error("loadContacts:", err); setDbError(err.code || err.message) }
    }

    const handleAddProject = async (e) => {
        e.preventDefault()
        if (!newProject.title.trim() || !newProject.description.trim()) return
        await addDoc(collection(db, "projects_showcase"), {
            title: newProject.title,
            description: newProject.description,
            repoLink: newProject.repoLink,
            imageUrl: newProject.imageUrl,
            createdAt: new Date()
        })
        setNewProject({ title: "", description: "", repoLink: "", imageUrl: "" })
        loadShowcaseProjects()
    }

    const handleDeleteProject = async (id) => {
        if (window.confirm("Are you sure you want to delete this project?")) {
            await deleteDoc(doc(db, "projects_showcase", id))
            loadShowcaseProjects()
        }
    }

    const handleDeleteProduct = async (id) => {
        if (window.confirm("Are you sure you want to delete this device?")) {
            await deleteDoc(doc(db, "products", id))
            loadInventory()
        }
    }

    // EMAIL FUNCTION
    const sendApprovalMail = (request) => {
        const templateParams = {
            name: request.name,
            email: request.email,
            product: request.product,
            start: request.startTime,
            end: request.endTime
        }
        console.log("Sending approval email with params:", templateParams)
        emailjs.send("service_7jr63zq", "template_zqtua62", templateParams)
            .then((res) => console.log("✅ Approval email sent!", res.status, res.text))
            .catch((err) => console.error("❌ Approval email error:", err))
    }

    const sendRejectionMail = (request) => {
        const templateParams = {
            name: request.name,
            email: request.email,
            product: request.product,
            start: request.startTime,
            end: request.endTime,
            status: "Rejected"
        }
        console.log("Sending rejection email with params:", templateParams)
        emailjs.send("service_7jr63zq", "template_zqtua62", templateParams)
            .then((res) => console.log("✅ Rejection email sent!", res.status, res.text))
            .catch((err) => console.error("❌ Rejection email error:", err))
    }

    // APPROVE REQUEST
    const approveRequest = async (request) => {

        const snapshot = await getDocs(collection(db, "requests"))

        const start = new Date(request.startTime)
        const end = new Date(request.endTime)

        for (let docSnap of snapshot.docs) {

            const r = docSnap.data()

            if (
                r.product === request.product &&
                r.status === "approved"
            ) {

                const existingStart = new Date(r.startTime)
                const existingEnd = new Date(r.endTime)

                const overlap =
                    start < existingEnd &&
                    end > existingStart

                if (overlap) {

                    alert("Booking conflict! Device already reserved for this time.")

                    return

                }

            }

        }

        // If no conflict → approve

        const requestRef = doc(db, "requests", request.id)

        await updateDoc(requestRef, {
            status: "approved"
        })

        // decrease hardware count
        const q = query(
            collection(db, "products"),
            where("name", "==", request.product)
        )

        const productSnap = await getDocs(q)

        for (const p of productSnap.docs) {
            const productRef = doc(db, "products", p.id)
            const current = p.data().available

            await updateDoc(productRef, {
                available: current - 1
            })
        }

        sendApprovalMail(request)

        loadRequests()
        loadInventory()

    }

    // REJECT REQUEST
    const rejectRequest = async (request) => {

        const ref = doc(db, "requests", request.id)

        await updateDoc(ref, {
            status: "rejected"
        })

        sendRejectionMail(request)

        loadRequests()

    }
    const returnDevice = async (request) => {

        const requestRef = doc(db, "requests", request.id)

        await updateDoc(requestRef, {
            status: "returned"
        })

        // increase product availability
        const q = query(
            collection(db, "products"),
            where("name", "==", request.product)
        )

        const snapshot = await getDocs(q)

        for (const p of snapshot.docs) {
            const productRef = doc(db, "products", p.id)
            const current = p.data().available

            await updateDoc(productRef, {
                available: current + 1
            })
        }

        loadRequests()
        loadInventory()

    }

    // ─── QUIZ FUNCTIONS ────────────────────────────────────────────────────────
    const loadQuizzes = async () => {
        try {
            const snap = await getDocs(collection(db, "quizzes"))
            const list = []
            snap.forEach(d => list.push({ id: d.id, ...d.data() }))
            list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
            setQuizzes(list)
        } catch (err) { console.error("loadQuizzes:", err); setDbError(err.code || err.message) }
    }

    const handleSaveQuiz = async (e) => {
        e.preventDefault()
        if (!newQuiz.title.trim() || newQuiz.questions.length === 0) return
        const toTs = (str) => str ? Timestamp.fromDate(new Date(str)) : null
        await addDoc(collection(db, "quizzes"), {
            title: newQuiz.title.trim(),
            timeLimit: Number(newQuiz.timeLimit) || 10,
            isActive: newQuiz.isActive,
            startAt: toTs(newQuiz.startAt),
            endAt:   toTs(newQuiz.endAt),
            questions: newQuiz.questions,
            createdAt: Timestamp.now()
        })
        setNewQuiz({ title: "", timeLimit: 10, isActive: true, startAt: "", endAt: "",
            questions: [{ question: "", options: ["","","",""], answer: 0 }] })
        loadQuizzes()
    }

    const handleDeleteQuiz = async (id) => {
        if (window.confirm("Delete this quiz?")) {
            await deleteDoc(doc(db, "quizzes", id))
            loadQuizzes()
        }
    }

    const loadQuizResults = async (quizId, title) => {
        try {
            const q = query(collection(db, "quiz_results"), where("quizId", "==", quizId))
            const snap = await getDocs(q)
            const list = []
            snap.forEach(d => list.push({ id: d.id, ...d.data() }))
            list.sort((a, b) => (b.submittedAt?.seconds || 0) - (a.submittedAt?.seconds || 0))
            setQuizResults({ title, results: list })
        } catch (err) {
            alert("Could not load results. Firebase error: " + (err.code || err.message))
        }
    }

    const downloadQuizCSV = (title, results) => {
        if (!results.length) { alert("No results to export."); return }
        const headers = ["Name", "Student ID", "Email", "Score", "Total", "Percentage", "Time (sec)", "Submitted", "Note"]
        const rows = results.map(r => [
            r.studentName, r.studentId, r.studentEmail || "",
            r.score, r.total, r.percentage + "%", r.timeTaken,
            r.submittedAt?.seconds ? new Date(r.submittedAt.seconds * 1000).toLocaleString("en-IN") : "",
            r.note || ""
        ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(","))
        const blob = new Blob([[headers.join(","), ...rows].join("\n")], { type: "text/csv" })
        const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: `${title}_results.csv` })
        a.click()
    }

    // ─── LESSON FUNCTIONS ──────────────────────────────────────────────────────
    const loadLessons = async () => {
        try {
            const snap = await getDocs(collection(db, "lessons"))
            const list = []
            snap.forEach(d => list.push({ id: d.id, ...d.data() }))
            list.sort((a, b) => (a.order || 0) - (b.order || 0))
            setLessons(list)
        } catch (err) { console.error("loadLessons:", err); setDbError(err.code || err.message) }
    }

    const handleSaveLesson = async (e) => {
        e.preventDefault()
        if (!newLesson.title.trim()) return
        await addDoc(collection(db, "lessons"), {
            title: newLesson.title.trim(),
            description: newLesson.description.trim(),
            order: Number(newLesson.order) || 1,
            topics: newLesson.topics.map(t => ({
                title: t.title.trim(),
                videos: t.videos.filter(v => v.trim()),
                materials: t.materials.filter(m => m.trim())
            })),
            createdAt: Timestamp.now()
        })
        setNewLesson({ title: "", description: "", order: 1, topics: [{ title: "", videos: [""], materials: [""] }] })
        loadLessons()
    }

    const handleDeleteLesson = async (id) => {
        if (window.confirm("Delete this lesson?")) {
            await deleteDoc(doc(db, "lessons", id))
            loadLessons()
        }
    }

    const loadFaceModels = async () => {
        try {
            await Promise.all([
                faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
                faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
                faceapi.nets.faceRecognitionNet.loadFromUri('/models')
            ]);
            setModelsLoaded(true);
        } catch (err) {
            console.error("Error loading face-api models:", err);
            alert("Failed to load face recognition models. Ensure they are in /public/models");
        }
    }

    // ─── ATTENDANCE FUNCTIONS ──────────────────────────────────────────────────
    const loadAttendance = async () => {
        try {
            const snap = await getDocs(collection(db, "attendance"))
            const list = []
            snap.forEach(d => list.push({ id: d.id, ...d.data() }))
            list.sort((a, b) => (b.timestamp || "").localeCompare(a.timestamp || ""))
            setAttendanceRecords(list)
        } catch (err) { console.error("loadAttendance:", err); setDbError(err.code || err.message) }
    }

    const handleDeleteAttendance = async (id) => {
        if (window.confirm("Are you sure you want to delete this record?")) {
            await deleteDoc(doc(db, "attendance", id))
            loadAttendance()
        }
    }

    const startCamera = async () => {
        if (!modelsLoaded) { alert("Models are still loading..."); return null; }
        if (cameraStream) return cameraStream;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            setCameraStream(stream);
            return stream;
        } catch (err) {
            console.error("Camera error:", err);
            alert("Could not access webcam. Please allow permissions.");
            return null;
        }
    }

    const stopCamera = () => {
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            setCameraStream(null);
            if (videoRef.current) videoRef.current.srcObject = null;
        }
        setIsAttendanceRunning(false);
        setScanStatus("");
    }

    const handleRegisterUser = async () => {
        if (!newAttendanceUser.trim()) { alert("Enter a name"); return; }
        const stream = await startCamera();
        if (!stream) return;
        
        setScanStatus("Please look at the camera... Capturing in 3 seconds.");
        
        setTimeout(async () => {
            if (!videoRef.current) return;
            setScanStatus("Capturing face...");
            
            // Detect face
            const detection = await faceapi.detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
                .withFaceLandmarks()
                .withFaceDescriptor();
                
            if (!detection) {
                setScanStatus("Failed: No face detected. Try again.");
                stopCamera();
                return;
            }
            
            try {
                // Save descriptor to Firebase
                const descriptorArray = Array.from(detection.descriptor);
                await addDoc(collection(db, "face_encodings"), {
                    name: newAttendanceUser.trim(),
                    descriptor: descriptorArray,
                    createdAt: Timestamp.now()
                });
                setScanStatus(`Successfully registered ${newAttendanceUser.trim()}!`);
                setNewAttendanceUser("");
                setTimeout(() => { stopCamera() }, 2000);
            } catch (err) {
                console.error("Registration error:", err);
                setScanStatus("Failed to save to database.");
            }
        }, 3000);
    }

    const getFaceMatcher = async () => {
        const snap = await getDocs(collection(db, "face_encodings"));
        const labeledDescriptors = [];
        
        // Group by name just in case there are multiple registrations for one person
        const grouped = {};
        snap.forEach(d => {
            const data = d.data();
            if (!grouped[data.name]) grouped[data.name] = [];
            grouped[data.name].push(new Float32Array(data.descriptor));
        });
        
        for (const [name, descriptors] of Object.entries(grouped)) {
            labeledDescriptors.push(new faceapi.LabeledFaceDescriptors(name, descriptors));
        }
        
        if (labeledDescriptors.length === 0) return null;
        return new faceapi.FaceMatcher(labeledDescriptors, 0.5); // 0.5 threshold
    }

    const handleStartAttendance = async () => {
        const matcher = await getFaceMatcher();
        if (!matcher) {
            alert("No users registered! Please register a user first.");
            return;
        }

        const stream = await startCamera();
        if (!stream) return;

        setIsAttendanceRunning(true);
        setScanStatus("Scanning active...");
        
        // Polling loop
        const interval = setInterval(async () => {
            if (!videoRef.current) return;
            
            const detection = await faceapi.detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
                .withFaceLandmarks()
                .withFaceDescriptor();
                
            if (detection) {
                const match = matcher.findBestMatch(detection.descriptor);
                if (match.label !== "unknown") {
                    setScanStatus(`Detected: ${match.label}`);
                    
                    // Add to attendance if not added recently (debounce handled simply here, could be improved)
                    const now = Date.now();
                    const oneMinute = 60 * 1000;
                    
                    // Check if already logged recently
                    const recentLogs = attendanceRecords.filter(r => r.name === match.label && (now - new Date(r.timestamp).getTime()) < oneMinute);
                    if (recentLogs.length === 0) {
                        await addDoc(collection(db, "attendance"), {
                            name: match.label,
                            timestamp: new Date().toISOString(),
                            status: "IN"
                        });
                        loadAttendance();
                        setScanStatus(`Logged IN: ${match.label}`);
                    }
                } else {
                    setScanStatus("Detected: Unknown person");
                }
            }
        }, 2000); // Check every 2 seconds

        // Store interval ID on the video element for easy cleanup
        videoRef.current.scanInterval = interval;
    }

    const handleStopAttendance = () => {
        if (videoRef.current && videoRef.current.scanInterval) {
            clearInterval(videoRef.current.scanInterval);
        }
        stopCamera();
    }

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopCamera();
        }
    }, [])

    const downloadAttendanceCSV = () => {
        if (!attendanceRecords.length) { alert("No attendance records to export."); return }
        const headers = ["Name", "Timestamp", "Status"]
        const rows = attendanceRecords.map(r => 
            `"${r.name}","${new Date(r.timestamp).toLocaleString("en-IN")}","${r.status}"`
        )
        const blob = new Blob([[headers.join(","), ...rows].join("\n")], { type: "text/csv" })
        const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: `attendance.csv` })
        a.click()
    }

    const fmtTs = (ts) => ts?.seconds ? new Date(ts.seconds * 1000).toLocaleString("en-IN", { day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" }) : "—"

    // ─── ANNOUNCEMENTS FUNCTIONS ───────────────────────────────────────────────
    const loadAnnouncements = async () => {
        try {
            const snap = await getDocs(collection(db, "announcements"))
            const list = []
            snap.forEach(d => list.push({ id: d.id, ...d.data() }))
            list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
            setAnnouncements(list)
        } catch (err) { console.error("loadAnnouncements:", err); }
    }

    const handleSaveAnnouncement = async (e) => {
        e.preventDefault()
        if (!newAnnouncement.title.trim() || !newAnnouncement.content.trim()) return
        await addDoc(collection(db, "announcements"), {
            title: newAnnouncement.title.trim(),
            content: newAnnouncement.content.trim(),
            topic: newAnnouncement.topic.trim(),
            imageUrl: newAnnouncement.imageUrl.trim(),
            pdfUrl: newAnnouncement.pdfUrl.trim(),
            createdAt: Timestamp.now()
        })
        setNewAnnouncement({ title: "", content: "", topic: "", imageUrl: "", pdfUrl: "" })
        loadAnnouncements()
    }

    const handleDeleteAnnouncement = async (id) => {
        if (window.confirm("Delete this announcement?")) {
            await deleteDoc(doc(db, "announcements", id))
            loadAnnouncements()
        }
    }

    // ─── COLLABORATORS FUNCTIONS ───────────────────────────────────────────────
    const loadCollaborators = async () => {
        try {
            const snap = await getDocs(collection(db, "collaborators"))
            const list = []
            snap.forEach(d => list.push({ id: d.id, ...d.data() }))
            list.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0))
            setCollaborators(list)
        } catch (err) { console.error("loadCollaborators:", err); }
    }

    const handleSaveCollaborator = async (e) => {
        e.preventDefault()
        if (!newCollaborator.name.trim()) return
        await addDoc(collection(db, "collaborators"), {
            name: newCollaborator.name.trim(),
            imgUrl: newCollaborator.imgUrl?.trim() || "",
            createdAt: Timestamp.now()
        })
        setNewCollaborator({ name: "", imgUrl: "" })
        loadCollaborators()
    }

    const handleDeleteCollaborator = async (id) => {
        if (window.confirm("Delete this collaborator?")) {
            await deleteDoc(doc(db, "collaborators", id))
            loadCollaborators()
        }
    }

    const pending = requests.filter(r => r.status === "pending")
    const history = requests.filter(
        r => r.status === "approved" || r.status === "rejected" || r.status === "returned"
    )


    const downloadCSV = () => {
        if (history.length === 0) {
            alert("No history to download");
            return;
        }

        const headers = ["Name", "Email", "Product", "Status", "Start Time", "End Time"];
        const rows = history.map(r => {
            const start = formatDate(r.startTime);
            const end = formatDate(r.endTime);
            return `"${r.name}","${r.email}","${r.product}","${r.status}","${start}","${end}"`;
        });

        const csvContent = headers.join(",") + "\n" + rows.join("\n");
        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.setAttribute("href", url);
        a.setAttribute("download", "renting_history.csv");
        a.click();
    };

    return (
        <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0f1117 0%, #1a1f2e 50%, #0f1117 100%)", fontFamily: "Inter, sans-serif" }}>

            {/* ─── Firebase Rules Error Banner ─── */}
            {dbError && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 9998, background: "linear-gradient(90deg, #7f1d1d, #991b1b)", padding: "12px 24px", display: "flex", alignItems: "flex-start", gap: "14px", boxShadow: "0 4px 20px rgba(0,0,0,0.5)" }}>
                    <span style={{ fontSize: "1.4rem", flexShrink: 0 }}>🔐</span>
                    <div style={{ flex: 1 }}>
                        <strong style={{ color: "#fca5a5", fontSize: "0.95rem" }}>Firebase Permission Denied — Firestore rules are blocking reads</strong>
                        <p style={{ color: "#fcd5d5", fontSize: "0.8rem", margin: "4px 0 0", lineHeight: 1.5 }}>
                            Error: <code style={{ background: "rgba(0,0,0,0.3)", padding: "1px 6px", borderRadius: "4px" }}>{dbError}</code> &nbsp;|&nbsp;
                            Go to <strong>Firebase Console → Firestore → Rules</strong> and paste the rules from <code>firestore.rules</code> in your project folder, then click Publish.
                        </p>
                    </div>
                    <button onClick={() => setDbError(null)} style={{ background: "none", border: "none", color: "#fca5a5", fontSize: "1.3rem", cursor: "pointer", flexShrink: 0 }}>✕</button>
                </div>
            )}

            {/* ─── Top Bar ─── */}
            <div style={{ padding: `${dbError ? "70px" : "0"} 0 0` }}>
                <div style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.08)", padding: "0 32px", display: "flex", alignItems: "center", gap: "20px", position: "sticky", top: dbError ? "72px" : 0, zIndex: 100, backdropFilter: "blur(12px)" }}>
                    <div style={{ padding: "18px 0", flex: 1 }}>
                        <span style={{ background: "linear-gradient(135deg, #00b89c, #007367)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontWeight: 900, fontSize: "1.3rem", letterSpacing: "-0.02em" }}>CXR Admin</span>
                    </div>

                    {/* Tab navigation */}
                    {[
                        { id: "requests",  label: "Requests",  badge: stats.pending },
                        { id: "contacts",  label: "Contacts",  badge: contactRequests.length },
                        { id: "quizzes",   label: "Quizzes",   badge: quizzes.length },
                        { id: "lessons",   label: "Lessons",   badge: lessons.length },
                        { id: "attendance", label: "Attendance", badge: attendanceRecords.length },
                        { id: "inventory", label: "Inventory", badge: null },
                        { id: "projects",  label: "Projects",  badge: null },
                        { id: "announcements", label: "Announcements", badge: announcements.length },
                        { id: "collaborators", label: "Industry Leaders", badge: collaborators.length },
                    ].map(t => (
                        <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                            background: "none", border: "none", cursor: "pointer",
                            padding: "18px 16px", borderBottom: `3px solid ${activeTab === t.id ? "#00b89c" : "transparent"}`,
                            color: activeTab === t.id ? "#00b89c" : "rgba(255,255,255,0.5)",
                            fontWeight: activeTab === t.id ? 700 : 500, fontSize: "0.87rem",
                            whiteSpace: "nowrap", transition: "all 0.2s", position: "relative"
                        }}>
                            {t.label}
                            {t.badge > 0 && (
                                <span style={{ position: "absolute", top: "10px", right: "2px", background: t.id === "requests" ? "#f59e0b" : "#00b89c", color: "#fff", borderRadius: "50%", width: "18px", height: "18px", fontSize: "0.65rem", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{t.badge > 99 ? "99+" : t.badge}</span>
                            )}
                        </button>
                    ))}

                    <div style={{ display: "flex", gap: "10px", alignItems: "center", paddingLeft: "12px", borderLeft: "1px solid rgba(255,255,255,0.1)" }}>
                        <button onClick={() => {
                            setLoading(true); setDbError(null);
                            Promise.all([loadRequests(), loadInventory(), loadShowcaseProjects(), loadContactRequests(), loadQuizzes(), loadLessons(), loadAnnouncements(), loadCollaborators()]).finally(() => setLoading(false))
                        }} style={{ background: "rgba(0,184,156,0.12)", border: "1px solid rgba(0,184,156,0.3)", borderRadius: "8px", color: "#00b89c", padding: "7px 14px", cursor: "pointer", fontSize: "0.82rem", fontWeight: 700 }}>
                            {loading ? "Loading..." : "Refresh"}
                        </button>
                        <Link to="/" style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", color: "rgba(255,255,255,0.7)", padding: "7px 14px", textDecoration: "none", fontSize: "0.82rem", fontWeight: 600 }}>Home</Link>
                    </div>
                </div>
            </div>

            {/* ─── CONTENT AREA ─── */}
            <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "32px 32px 80px" }}>

                {/* Stats strip */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "16px", marginBottom: "32px" }}>
                    {[
                        { label: "Total Requests", value: stats.total, color: "#00b89c" },
                        { label: "Pending", value: stats.pending, color: "#f59e0b" },
                        { label: "Approved", value: stats.approved, color: "#10b981" },
                        { label: "Contacts", value: contactRequests.length, color: "#8b5cf6" },
                        { label: "Quizzes", value: quizzes.length, color: "#06b6d4" },
                        { label: "Lessons", value: lessons.length, color: "#ec4899" },
                    ].map(s => (
                        <div key={s.label} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "14px", padding: "20px 22px", transition: "transform 0.2s" }}
                            onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
                            onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>
                            <p style={{ margin: 0, color: "rgba(255,255,255,0.4)", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</p>
                            <p style={{ margin: "8px 0 0", fontSize: "2rem", fontWeight: 800, color: s.color }}>{s.value}</p>
                        </div>
                    ))}
                </div>

                {/* ─── REQUESTS TAB ─── */}
                {activeTab === "requests" && <>
                <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "24px 28px", marginBottom: "24px", overflowX: "auto" }}>
                    <h2 style={{ marginBottom: "20px", color: "#fff", fontWeight: 800, fontSize: "1.2rem" }}>Pending Requests <span style={{ color: "#f59e0b", marginLeft: "8px", fontSize: "0.95rem" }}>{pending.length > 0 ? `(${pending.length})` : ""}</span></h2>

                    <table style={tableStyle}>
                        <thead>
                            <tr>
                                <th style={thStyle}>Name</th>
                                <th style={thStyle}>Email</th>
                                <th style={thStyle}>Product</th>
                                <th style={thStyle}>Purpose</th>
                                <th style={thStyle}>Start</th>
                                <th style={thStyle}>End</th>
                                <th style={thStyle}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pending.map((r) => (
                                <tr key={r.id} style={trStyle}>
                                    <td style={tdStyle}>{r.name}</td>
                                    <td style={tdStyle}>{r.email}</td>
                                    <td style={tdStyle}><strong>{r.product}</strong></td>
                                    <td style={tdStyle}>{r.purpose}</td>
                                    <td style={tdStyle}>{formatDate(r.startTime)}</td>
                                    <td style={tdStyle}>{formatDate(r.endTime)}</td>
                                    <td style={tdStyle}>
                                        <div style={{ display: "flex", gap: "10px" }}>
                                            <button onClick={() => approveRequest(r)} className="btn-primary" style={{ padding: "8px 15px", backgroundColor: "#10b981" }}>
                                                Approve
                                            </button>
                                            <button onClick={() => rejectRequest(r)} className="btn-primary" style={{ padding: "8px 15px", backgroundColor: "#ef4444" }}>
                                                Reject
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {pending.length === 0 && (
                                <tr>
                                    <td colSpan="7" style={{ ...tdStyle, textAlign: "center", color: "var(--text-muted)" }}>No pending requests.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* History Section */}
                <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "24px 28px", overflowX: "auto", marginBottom: "24px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                        <h2 style={{ color: "#fff", margin: 0, fontWeight: 800, fontSize: "1.2rem" }}>Request History</h2>
                        <button onClick={downloadCSV} style={{ background: "rgba(0,184,156,0.15)", border: "1px solid rgba(0,184,156,0.3)", borderRadius: "8px", color: "#00b89c", padding: "8px 16px", cursor: "pointer", fontWeight: 700 }}>
                            Download CSV
                        </button>
                    </div>

                    <table style={tableStyle}>
                        <thead>
                            <tr>
                                <th style={thStyle}>Name</th>
                                <th style={thStyle}>Email</th>
                                <th style={thStyle}>Product</th>
                                <th style={thStyle}>Status</th>
                                <th style={thStyle}>Start</th>
                                <th style={thStyle}>End</th>
                                <th style={thStyle}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {history.map((r) => (
                                <tr key={r.id} style={trStyle}>
                                    <td style={tdStyle}>{r.name}</td>
                                    <td style={tdStyle}>{r.email}</td>
                                    <td style={tdStyle}><strong>{r.product}</strong></td>
                                    <td style={tdStyle}>
                                        <span style={{
                                            padding: "5px 10px",
                                            borderRadius: "15px",
                                            fontSize: "0.85rem",
                                            fontWeight: "600",
                                            backgroundColor: r.status === "approved" ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)",
                                            color: r.status === "approved" ? "#10b981" : "#ef4444"
                                        }}>
                                            {r.status.toUpperCase()}
                                        </span>
                                    </td>
                                    <td style={tdStyle}>{formatDate(r.startTime)}</td>
                                    <td style={tdStyle}>{formatDate(r.endTime)}</td>
                                    <td style={tdStyle}>
                                        {r.status === "approved" && (
                                            <button onClick={() => returnDevice(r)} className="btn-primary" style={{ padding: "8px 15px" }}>
                                                Return Device
                                            </button>
                                        )}
                                        {r.status === "returned" && (
                                            <span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Returned</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {history.length === 0 && (
                                <tr>
                                    <td colSpan="7" style={{ ...tdStyle, textAlign: "center", color: "var(--text-muted)" }}>No request history.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                </>}

                {/* ─── CONTACTS TAB ─── */}
                {activeTab === "contacts" && <>
                {(() => {
                    const students   = contactRequests.filter(c => c.userType === "Student")
                    const faculty    = contactRequests.filter(c => c.userType === "Faculty/Staff")
                    const others     = contactRequests.filter(c => c.userType !== "Student" && c.userType !== "Faculty/Staff")

                    const exportCSV = (list, filename) => {
                        if (!list.length) { alert("No data to export."); return; }
                        const headers = ["Date","Name","Email","Phone","Reason","Year","Field","Internship","Campus","Accommodation","CV Link"]
                        const rows = list.map(c => [
                            c.createdAt?.seconds ? new Date(c.createdAt.seconds*1000).toLocaleString("en-IN") : "",
                            c.name, c.email, c.phone, c.reason,
                            c.yearOfStudy, c.fieldOfStudy, c.internship, c.campus, c.accommodation, c.resumeLink
                        ].map(v => `"${String(v||"").replace(/"/g,'""')}"`).join(","))
                        const blob = new Blob([[headers.join(","), ...rows].join("\n")], { type: "text/csv" })
                        Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: filename }).click()
                    }

                    const deleteContact = async (c) => {
                        if (window.confirm(`Delete entry for ${c.name}?`)) {
                            try { await deleteDoc(doc(db, "contact_messages", c.id)); loadContactRequests() }
                            catch(err) { alert("Delete failed: " + err.message) }
                        }
                    }

                    // Reusable panel renderer
                    const ContactPanel = ({ title, icon, list, accent, bg, cols, renderRow, emptyMsg }) => (
                        <div style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${accent}30`, borderRadius: "16px", overflow: "hidden", marginBottom: "24px" }}>
                            {/* Panel header */}
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px", background: `${bg}`, borderBottom: `1px solid ${accent}22`, flexWrap: "wrap", gap: "10px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                    <span style={{ fontSize: "1.5rem" }}>{icon}</span>
                                    <div>
                                        <h3 style={{ margin: 0, color: "#fff", fontWeight: 800, fontSize: "1.05rem" }}>
                                            {title}
                                            <span style={{ marginLeft: "10px", background: `${accent}22`, color: accent, padding: "2px 10px", borderRadius: "20px", fontSize: "0.8rem", fontWeight: 700 }}>{list.length}</span>
                                        </h3>
                                        <p style={{ margin: "2px 0 0", color: "rgba(255,255,255,0.35)", fontSize: "0.75rem" }}>{list.length} submission{list.length !== 1 ? "s" : ""}</p>
                                    </div>
                                </div>
                                <button onClick={() => exportCSV(list, `${title.replace(/\//g,"-")}_contacts.csv`)}
                                    style={{ background: `${accent}18`, border: `1px solid ${accent}40`, borderRadius: "8px", color: accent, padding: "7px 14px", cursor: "pointer", fontWeight: 700, fontSize: "0.8rem", whiteSpace: "nowrap" }}>
                                    ⬇ Export CSV
                                </button>
                            </div>

                            {/* Table */}
                            <div style={{ overflowX: "auto" }}>
                                <table style={{ ...tableStyle, minWidth: "900px" }}>
                                    <thead>
                                        <tr>
                                            {cols.map(col => <th key={col} style={{ ...thStyle, color: accent }}>{col}</th>)}
                                            <th style={{ ...thStyle, color: accent }}>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {list.length === 0 ? (
                                            <tr><td colSpan={cols.length + 1} style={{ ...tdStyle, textAlign: "center", color: "rgba(255,255,255,0.25)", padding: "32px" }}>
                                                {emptyMsg}
                                            </td></tr>
                                        ) : list.map(c => (
                                            <tr key={c.id} style={trStyle}
                                                onMouseEnter={e => e.currentTarget.style.background = `${accent}08`}
                                                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                                                {renderRow(c)}
                                                <td style={tdStyle}>
                                                    <button onClick={() => deleteContact(c)}
                                                        style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444", border: "none", borderRadius: "8px", padding: "5px 11px", cursor: "pointer", fontWeight: 700, fontSize: "0.78rem" }}>
                                                        Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )

                    const fmtDate = (c) => c.createdAt?.seconds
                        ? new Date(c.createdAt.seconds*1000).toLocaleString("en-IN", { day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" })
                        : "—"

                    return (<>
                        {/* Stats row */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px", marginBottom: "24px" }}>
                            {[
                                { label: "Students", count: students.length, color: "#06b6d4", icon: "🎓" },
                                { label: "Faculty / Staff", count: faculty.length, color: "#f59e0b", icon: "👨‍🏫" },
                                { label: "Others", count: others.length, color: "#10b981", icon: "🌐" },
                            ].map(s => (
                                <div key={s.label} style={{ background: `${s.color}0d`, border: `1px solid ${s.color}28`, borderRadius: "14px", padding: "18px 22px", display: "flex", alignItems: "center", gap: "14px" }}>
                                    <span style={{ fontSize: "2rem" }}>{s.icon}</span>
                                    <div>
                                        <p style={{ margin: 0, color: "rgba(255,255,255,0.45)", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</p>
                                        <p style={{ margin: "4px 0 0", fontSize: "1.8rem", fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.count}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* ── STUDENTS panel ── */}
                        {ContactPanel({
                            title: "Students",
                            icon: "🎓",
                            list: students,
                            accent: "#06b6d4",
                            bg: "rgba(6,182,212,0.05)",
                            emptyMsg: "No student submissions yet.",
                            cols: ["Date", "Name", "Email", "Phone", "Reason", "Year · Field", "Internship", "Campus", "Stay", "CV"],
                            renderRow: (c) => <>
                                <td style={{ ...tdStyle, whiteSpace: "nowrap", fontSize: "0.78rem", color: "rgba(255,255,255,0.5)" }}>{fmtDate(c)}</td>
                                <td style={{ ...tdStyle, whiteSpace: "nowrap" }}><strong style={{ color: "#fff" }}>{c.name}</strong></td>
                                <td style={{ ...tdStyle, fontSize: "0.8rem" }}>{c.email}</td>
                                <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>{c.phone}</td>
                                <td style={{ ...tdStyle, maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={c.reason}>{c.reason || "—"}</td>
                                <td style={{ ...tdStyle, whiteSpace: "nowrap", fontSize: "0.8rem" }}>{c.yearOfStudy ? `Yr ${c.yearOfStudy}` : "—"}{c.fieldOfStudy ? ` · ${c.fieldOfStudy}` : ""}</td>
                                <td style={tdStyle}>
                                    <span style={{ background: c.internship?.startsWith("Yes") ? "rgba(16,185,129,0.15)" : "rgba(100,100,100,0.1)", color: c.internship?.startsWith("Yes") ? "#10b981" : "rgba(255,255,255,0.35)", padding: "3px 9px", borderRadius: "20px", fontSize: "0.73rem", fontWeight: 700, whiteSpace: "nowrap" }}>
                                        {c.internship?.startsWith("Yes") ? "✓ Yes" : c.internship || "—"}
                                    </span>
                                </td>
                                <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>
                                    {c.campus ? <span style={{ background: "rgba(139,92,246,0.12)", color: "#a78bfa", padding: "3px 8px", borderRadius: "20px", fontSize: "0.73rem", fontWeight: 700 }}>{c.campus}</span> : "—"}
                                </td>
                                <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>
                                    {c.accommodation ? <span style={{ background: "rgba(245,158,11,0.12)", color: "#f59e0b", padding: "3px 8px", borderRadius: "20px", fontSize: "0.73rem", fontWeight: 700 }}>{c.accommodation}</span> : "—"}
                                </td>
                                <td style={tdStyle}>
                                    {c.resumeLink ? <a href={c.resumeLink} target="_blank" rel="noreferrer" style={{ color: "#00b89c", fontWeight: 700, fontSize: "0.78rem", textDecoration: "none", whiteSpace: "nowrap" }}>📄 View CV</a> : "—"}
                                </td>
                            </>
                        })}

                        {/* ── FACULTY / STAFF panel ── */}
                        {ContactPanel({
                            title: "Faculty / Staff",
                            icon: "👨‍🏫",
                            list: faculty,
                            accent: "#f59e0b",
                            bg: "rgba(245,158,11,0.05)",
                            emptyMsg: "No faculty / staff submissions yet.",
                            cols: ["Date", "Name", "Email", "Phone", "Reason"],
                            renderRow: (c) => <>
                                <td style={{ ...tdStyle, whiteSpace: "nowrap", fontSize: "0.78rem", color: "rgba(255,255,255,0.5)" }}>{fmtDate(c)}</td>
                                <td style={{ ...tdStyle, whiteSpace: "nowrap" }}><strong style={{ color: "#fff" }}>{c.name}</strong></td>
                                <td style={{ ...tdStyle, fontSize: "0.8rem" }}>{c.email}</td>
                                <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>{c.phone}</td>
                                <td style={{ ...tdStyle, maxWidth: "340px" }}>{c.reason || "—"}</td>
                            </>
                        })}

                        {/* ── OTHERS panel ── */}
                        {ContactPanel({
                            title: "Others",
                            icon: "🌐",
                            list: others,
                            accent: "#10b981",
                            bg: "rgba(16,185,129,0.05)",
                            emptyMsg: "No other submissions yet.",
                            cols: ["Date", "Name", "Email", "Phone", "Reason"],
                            renderRow: (c) => <>
                                <td style={{ ...tdStyle, whiteSpace: "nowrap", fontSize: "0.78rem", color: "rgba(255,255,255,0.5)" }}>{fmtDate(c)}</td>
                                <td style={{ ...tdStyle, whiteSpace: "nowrap" }}><strong style={{ color: "#fff" }}>{c.name}</strong></td>
                                <td style={{ ...tdStyle, fontSize: "0.8rem" }}>{c.email}</td>
                                <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>{c.phone}</td>
                                <td style={{ ...tdStyle, maxWidth: "340px" }}>{c.reason || "—"}</td>
                            </>
                        })}
                    </>)
                })()}
                </>}

                {/* ─── ATTENDANCE TAB ─── */}
                {activeTab === "attendance" && <>
                <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "24px 28px", overflowX: "auto", marginBottom: "24px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                        <h2 style={{ color: "#fff", margin: 0, fontWeight: 800, fontSize: "1.2rem" }}>Face Recognition Attendance</h2>
                        <button onClick={downloadAttendanceCSV} style={{ background: "rgba(0,184,156,0.15)", border: "1px solid rgba(0,184,156,0.3)", borderRadius: "8px", color: "#00b89c", padding: "8px 16px", cursor: "pointer", fontWeight: 700 }}>
                            Download CSV
                        </button>
                    </div>

                    {/* Controls */}
                    <div style={{ display: "flex", gap: "20px", marginBottom: "30px", flexWrap: "wrap", alignItems: "flex-end" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "5px", flex: "1", minWidth: "300px" }}>
                            
                            {/* Webcam View Area */}
                            <div style={{ width: "100%", maxWidth: "400px", height: "300px", backgroundColor: "#000", borderRadius: "12px", overflow: "hidden", position: "relative", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <video ref={videoRef} autoPlay muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover", display: cameraStream ? "block" : "none" }} />
                                {!cameraStream && (
                                    <span style={{ color: "rgba(255,255,255,0.3)" }}>Webcam Off</span>
                                )}
                                {scanStatus && (
                                    <div style={{ position: "absolute", bottom: "10px", left: "10px", right: "10px", background: "rgba(0,0,0,0.7)", padding: "8px 12px", borderRadius: "8px", color: "#fff", fontSize: "0.85rem", textAlign: "center", backdropFilter: "blur(4px)" }}>
                                        {scanStatus}
                                    </div>
                                )}
                            </div>

                            <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
                                <input type="text" placeholder="New User Name" value={newAttendanceUser} onChange={e => setNewAttendanceUser(e.target.value)} disabled={cameraStream !== null} style={{ flex: 1, padding: "10px 15px", borderRadius: "8px", border: "1px solid var(--border-color)", backgroundColor: "rgba(255, 255, 255, 0.05)", color: "var(--text-main)" }} />
                                <button onClick={handleRegisterUser} disabled={cameraStream !== null || !modelsLoaded} style={{ background: "#06b6d4", border: "none", borderRadius: "8px", color: "#fff", padding: "10px 20px", cursor: (cameraStream !== null || !modelsLoaded) ? "not-allowed" : "pointer", fontWeight: 700, opacity: (cameraStream !== null || !modelsLoaded) ? 0.5 : 1 }}>
                                    Register Face
                                </button>
                            </div>
                        </div>

                        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "10px", justifyContent: "flex-end" }}>
                            <div style={{ background: "rgba(16,185,129,0.05)", padding: "20px", borderRadius: "12px", border: "1px solid rgba(16,185,129,0.2)", marginBottom: "20px" }}>
                                <h3 style={{ color: "#10b981", margin: "0 0 10px 0", fontSize: "1rem" }}>Attendance Scanner</h3>
                                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.85rem", margin: "0 0 15px 0" }}>Start the scanner to automatically detect registered users and log their attendance to the table below.</p>
                                
                                <div style={{ display: "flex", gap: "10px" }}>
                                    <button onClick={handleStartAttendance} disabled={isAttendanceRunning || !modelsLoaded} style={{ background: isAttendanceRunning ? "#374151" : "#10b981", border: "none", borderRadius: "8px", color: "#fff", padding: "10px 20px", cursor: (isAttendanceRunning || !modelsLoaded) ? "not-allowed" : "pointer", fontWeight: 700 }}>
                                        {isAttendanceRunning ? "Scanning Active..." : "Start Attendance Scan"}
                                    </button>

                                    {cameraStream && (
                                        <button onClick={handleStopAttendance} style={{ background: "#ef4444", border: "none", borderRadius: "8px", color: "#fff", padding: "10px 20px", cursor: "pointer", fontWeight: 700 }}>
                                            Stop Camera
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <table style={tableStyle}>
                        <thead>
                            <tr>
                                <th style={thStyle}>Name</th>
                                <th style={thStyle}>Timestamp</th>
                                <th style={thStyle}>Status</th>
                                <th style={thStyle}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {attendanceRecords.map((r) => (
                                <tr key={r.id} style={trStyle}>
                                    <td style={tdStyle}><strong>{r.name}</strong></td>
                                    <td style={tdStyle}>{new Date(r.timestamp).toLocaleString("en-IN")}</td>
                                    <td style={tdStyle}>
                                        <span style={{ padding: "5px 10px", borderRadius: "15px", fontSize: "0.85rem", fontWeight: "600", backgroundColor: "rgba(16, 185, 129, 0.2)", color: "#10b981" }}>
                                            {r.status || "IN"}
                                        </span>
                                    </td>
                                    <td style={tdStyle}>
                                        <button onClick={() => handleDeleteAttendance(r.id)} style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "8px", color: "#f87171", padding: "6px 12px", cursor: "pointer", fontWeight: 700, fontSize: "0.8rem" }}>Delete</button>
                                    </td>
                                </tr>
                            ))}
                            {attendanceRecords.length === 0 && (
                                <tr>
                                    <td colSpan="4" style={{ ...tdStyle, textAlign: "center", color: "var(--text-muted)" }}>No attendance records found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                </>}

                {/* ─── INVENTORY TAB ─── */}
                {activeTab === "inventory" && <>
                <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "24px 28px", marginBottom: "24px", overflowX: "auto" }}>
                    <h2 style={{ marginBottom: "20px", color: "#fff", fontWeight: 800, fontSize: "1.2rem" }}>Inventory Management</h2>

                    {/* Add Product Form */}
                    <form onSubmit={handleAddProduct} style={{
                        display: "flex", gap: "15px", marginBottom: "30px", alignItems: "flex-end", flexWrap: "wrap"
                    }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "5px", flex: "1", minWidth: "200px" }}>
                            <label style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>New Device Name</label>
                            <input
                                type="text"
                                placeholder="e.g. Meta Quest 3"
                                value={newProduct.name}
                                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                                style={{
                                    padding: "10px 15px", borderRadius: "8px", border: "1px solid var(--border-color)",
                                    backgroundColor: "rgba(255, 255, 255, 0.05)", color: "var(--text-main)"
                                }}
                                required
                            />
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "5px", flex: "1", minWidth: "150px" }}>
                            <label style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Image URL (optional)</label>
                            <input
                                type="url"
                                placeholder="https://..."
                                value={newProduct.imageUrl}
                                onChange={(e) => setNewProduct({ ...newProduct, imageUrl: e.target.value })}
                                style={{
                                    padding: "10px 15px", borderRadius: "8px", border: "1px solid var(--border-color)",
                                    backgroundColor: "rgba(255, 255, 255, 0.05)", color: "var(--text-main)"
                                }}
                            />
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "5px", width: "120px" }}>
                            <label style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Initial Qty</label>
                            <input
                                type="number"
                                min="0"
                                value={newProduct.available}
                                onChange={(e) => setNewProduct({ ...newProduct, available: e.target.value })}
                                style={{
                                    padding: "10px 15px", borderRadius: "8px", border: "1px solid var(--border-color)",
                                    backgroundColor: "rgba(255, 255, 255, 0.05)", color: "var(--text-main)"
                                }}
                                required
                            />
                        </div>
                        <button type="submit" className="btn-primary" style={{ padding: "10px 20px", height: "42px" }}>
                            Add Device
                        </button>
                    </form>

                    <table style={tableStyle}>
                        <thead>
                            <tr>
                                <th style={thStyle}>Image</th>
                                <th style={thStyle}>Device Name</th>
                                <th style={thStyle}>Available Quantity</th>
                                <th style={thStyle}>Update Stock</th>
                                <th style={thStyle}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {inventory.map((item) => (
                                <tr key={item.id} style={trStyle}>
                                    <td style={tdStyle}>
                                        {item.imageUrl ? <img src={item.imageUrl} alt={item.name} style={{ width: "50px", height: "50px", objectFit: "cover", borderRadius: "5px" }} /> : "N/A"}
                                    </td>
                                    <td style={tdStyle}><strong>{item.name}</strong></td>
                                    <td style={tdStyle}>
                                        <span style={{
                                            padding: "5px 15px",
                                            borderRadius: "15px",
                                            backgroundColor: item.available > 0 ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                                            color: item.available > 0 ? "#10b981" : "#ef4444",
                                            fontWeight: "bold"
                                        }}>
                                            {item.available} Units
                                        </span>
                                    </td>
                                    <td style={tdStyle}>
                                        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                                            <button
                                                onClick={() => handleUpdateQuantity(item.id, item.available, -1)}
                                                className="btn-primary"
                                                style={{ padding: "5px 15px", backgroundColor: "rgba(255, 255, 255, 0.1)", color: "var(--text-main)" }}
                                                disabled={item.available <= 0}
                                            >
                                                -
                                            </button>
                                            <span style={{ width: "20px", textAlign: "center", color: "var(--text-main)" }}>{item.available}</span>
                                            <button
                                                onClick={() => handleUpdateQuantity(item.id, item.available, 1)}
                                                className="btn-primary"
                                                style={{ padding: "5px 15px", backgroundColor: "rgba(255, 255, 255, 0.1)", color: "var(--text-main)" }}
                                            >
                                                +
                                            </button>
                                        </div>
                                    </td>
                                    <td style={tdStyle}>
                                        <button onClick={() => handleDeleteProduct(item.id)} className="btn-primary" style={{ backgroundColor: "#ef4444", padding: "5px 15px" }}>Delete</button>
                                    </td>
                                </tr>
                            ))}
                            {inventory.length === 0 && (
                                <tr>
                                    <td colSpan="5" style={{ ...tdStyle, textAlign: "center", color: "var(--text-muted)" }}>No inventory devices found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                </>}

                {/* ─── PROJECTS TAB ─── */}
                {activeTab === "projects" && <>
                <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "24px 28px", marginTop: "0", overflowX: "auto" }}>
                    <h2 style={{ marginBottom: "20px", color: "#fff", fontWeight: 800, fontSize: "1.2rem" }}>Project Showcase Management</h2>

                    <form onSubmit={handleAddProject} style={{
                        display: "flex", gap: "15px", marginBottom: "30px", alignItems: "flex-end", flexWrap: "wrap"
                    }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "5px", flex: "1", minWidth: "200px" }}>
                            <label style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Project Title</label>
                            <input
                                type="text"
                                value={newProject.title}
                                onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                                style={{
                                    padding: "10px 15px", borderRadius: "8px", border: "1px solid var(--border-color)",
                                    backgroundColor: "rgba(255, 255, 255, 0.05)", color: "var(--text-main)"
                                }}
                                required
                            />
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "5px", flex: "2", minWidth: "300px" }}>
                            <label style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Description</label>
                            <input
                                type="text"
                                value={newProject.description}
                                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                                style={{
                                    padding: "10px 15px", borderRadius: "8px", border: "1px solid var(--border-color)",
                                    backgroundColor: "rgba(255, 255, 255, 0.05)", color: "var(--text-main)"
                                }}
                                required
                            />
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "5px", flex: "1", minWidth: "150px" }}>
                            <label style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Repository Link</label>
                            <input
                                type="url"
                                value={newProject.repoLink}
                                onChange={(e) => setNewProject({ ...newProject, repoLink: e.target.value })}
                                style={{
                                    padding: "10px 15px", borderRadius: "8px", border: "1px solid var(--border-color)",
                                    backgroundColor: "rgba(255, 255, 255, 0.05)", color: "var(--text-main)"
                                }}
                            />
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "5px", flex: "1", minWidth: "150px" }}>
                            <label style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Image URL</label>
                            <input
                                type="url"
                                value={newProject.imageUrl}
                                onChange={(e) => setNewProject({ ...newProject, imageUrl: e.target.value })}
                                style={{
                                    padding: "10px 15px", borderRadius: "8px", border: "1px solid var(--border-color)",
                                    backgroundColor: "rgba(255, 255, 255, 0.05)", color: "var(--text-main)"
                                }}
                            />
                        </div>
                        <button type="submit" className="btn-primary" style={{ padding: "10px 20px", height: "42px" }}>
                            Add Project
                        </button>
                    </form>

                    <table style={tableStyle}>
                        <thead>
                            <tr>
                                <th style={thStyle}>Image</th>
                                <th style={thStyle}>Title</th>
                                <th style={thStyle}>Description</th>
                                <th style={thStyle}>Link</th>
                                <th style={thStyle}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {showcaseProjects.map((p) => (
                                <tr key={p.id} style={trStyle}>
                                    <td style={tdStyle}>
                                        {p.imageUrl ? <img src={p.imageUrl} alt={p.title} style={{ width: "50px", height: "50px", objectFit: "cover", borderRadius: "5px" }} /> : "N/A"}
                                    </td>
                                    <td style={tdStyle}><strong>{p.title}</strong></td>
                                    <td style={tdStyle}>{(p.description || "").substring(0, 50)}...</td>
                                    <td style={tdStyle}>{p.repoLink ? <a href={p.repoLink} target="_blank" rel="noreferrer" style={{ color: "var(--accent-color)" }}>Repo</a> : "None"}</td>
                                    <td style={tdStyle}>
                                        <button onClick={() => handleDeleteProject(p.id)} className="btn-primary" style={{ backgroundColor: "#ef4444", padding: "5px 15px" }}>Delete</button>
                                    </td>
                                </tr>
                            ))}
                            {showcaseProjects.length === 0 && (
                                <tr>
                                    <td colSpan="5" style={{ ...tdStyle, textAlign: "center", color: "var(--text-muted)" }}>No projects found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                </>}

                {/* ─── QUIZZES TAB ─── */}
                {activeTab === "quizzes" && <>
                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

                    {/* ── Create Quiz Form ── */}
                    <div style={{ background: "rgba(6,182,212,0.05)", border: "1px solid rgba(6,182,212,0.2)", borderRadius: "16px", padding: "24px" }}>
                        <h3 style={{ margin: "0 0 20px", color: "#06b6d4", fontWeight: 800, fontSize: "1rem", letterSpacing: "0.04em", textTransform: "uppercase" }}>➕ Create New Quiz</h3>
                        <form onSubmit={handleSaveQuiz} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                                <input placeholder="Quiz Title *" value={newQuiz.title} required
                                    onChange={e => setNewQuiz(p => ({ ...p, title: e.target.value }))}
                                    style={{ flex: 2, minWidth: "220px", padding: "11px 14px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.08)", color: "#fff", fontSize: "0.92rem", outline: "none" }} />
                                <input type="number" min="1" placeholder="Minutes"
                                    value={newQuiz.timeLimit} onChange={e => setNewQuiz(p => ({ ...p, timeLimit: e.target.value }))}
                                    style={{ width: "100px", padding: "11px 12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.08)", color: "#fff", outline: "none" }} />
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", marginBottom: "5px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Start (blank = now)</label>
                                <input type="datetime-local" value={newQuiz.startAt}
                                    onChange={e => setNewQuiz(p => ({ ...p, startAt: e.target.value }))}
                                    style={{ width: "100%", maxWidth: "300px", padding: "10px 12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.08)", color: "#fff", boxSizing: "border-box", colorScheme: "dark" }} />
                            </div>
                            <label style={{ display: "flex", gap: "10px", alignItems: "center", cursor: "pointer" }}>
                                <input type="checkbox" checked={newQuiz.isActive}
                                    onChange={e => setNewQuiz(p => ({ ...p, isActive: e.target.checked }))}
                                    style={{ width: "16px", height: "16px", accentColor: "#06b6d4" }} />
                                <span style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.88rem" }}>Publish immediately (Active)</span>
                            </label>

                            {/* Questions */}
                            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "4px" }}>
                                {newQuiz.questions.map((q, qi) => (
                                    <div key={qi} style={{ padding: "16px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                                            <span style={{ fontWeight: 800, color: "#06b6d4", fontSize: "0.82rem" }}>Q{qi + 1}</span>
                                            {newQuiz.questions.length > 1 && (
                                                <button type="button" onClick={() => setNewQuiz(p => ({ ...p, questions: p.questions.filter((_, i) => i !== qi) }))}
                                                    style={{ background: "rgba(239,68,68,0.15)", border: "none", borderRadius: "6px", color: "#ef4444", padding: "3px 10px", cursor: "pointer", fontSize: "0.78rem", fontWeight: 700 }}>Remove</button>
                                            )}
                                        </div>
                                        <input placeholder="Question text *" value={q.question} required
                                            onChange={e => { const qs = [...newQuiz.questions]; qs[qi].question = e.target.value; setNewQuiz(p => ({ ...p, questions: qs })) }}
                                            style={{ width: "100%", padding: "9px 12px", borderRadius: "7px", border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.07)", color: "#fff", marginBottom: "10px", boxSizing: "border-box", fontSize: "0.88rem" }} />
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                                            {q.options.map((opt, oi) => (
                                                <label key={oi} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "2px" }}>
                                                    <input type="radio" name={`q${qi}answer`} checked={q.answer === oi}
                                                        onChange={() => { const qs = [...newQuiz.questions]; qs[qi].answer = oi; setNewQuiz(p => ({ ...p, questions: qs })) }}
                                                        style={{ accentColor: "#10b981", width: "15px", height: "15px", flexShrink: 0 }} />
                                                    <input placeholder={`Option ${oi + 1}`} value={opt} required
                                                        onChange={e => { const qs = [...newQuiz.questions]; qs[qi].options[oi] = e.target.value; setNewQuiz(p => ({ ...p, questions: qs })) }}
                                                        style={{ flex: 1, padding: "7px 10px", borderRadius: "6px", border: `1.5px solid ${q.answer === oi ? "#10b981" : "rgba(255,255,255,0.12)"}`, background: q.answer === oi ? "rgba(16,185,129,0.08)" : "rgba(255,255,255,0.05)", color: "#fff", fontSize: "0.85rem" }} />
                                                </label>
                                            ))}
                                        </div>
                                        <p style={{ margin: "7px 0 0", fontSize: "0.72rem", color: "rgba(255,255,255,0.35)" }}>🔘 Click the radio button next to the correct answer</p>
                                    </div>
                                ))}
                            </div>
                            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "4px" }}>
                                <button type="button" onClick={() => setNewQuiz(p => ({ ...p, questions: [...p.questions, { question: "", options: ["","","",""], answer: 0 }] }))}
                                    style={{ background: "rgba(6,182,212,0.12)", border: "1px solid rgba(6,182,212,0.3)", borderRadius: "8px", color: "#06b6d4", padding: "9px 18px", cursor: "pointer", fontWeight: 700, fontSize: "0.85rem" }}>+ Add Question</button>
                                <button type="submit"
                                    style={{ background: "linear-gradient(135deg, #06b6d4, #0891b2)", border: "none", borderRadius: "8px", color: "#fff", padding: "9px 24px", cursor: "pointer", fontWeight: 800, fontSize: "0.88rem" }}>Save Quiz</button>
                            </div>
                        </form>
                    </div>

                    {/* ── Quiz List ── */}
                    {quizzes.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "40px", color: "rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.02)", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.06)" }}>
                            No quizzes created yet. Use the form above to create one.
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            <h3 style={{ margin: "0 0 4px", color: "rgba(255,255,255,0.7)", fontWeight: 700, fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                                All Quizzes ({quizzes.length})
                            </h3>
                            {quizzes.map(quiz => {
                                const startMs = quiz.startAt?.seconds ? quiz.startAt.seconds * 1000 : quiz.startAt ? new Date(quiz.startAt).getTime() : null
                                const endMs   = quiz.endAt?.seconds   ? quiz.endAt.seconds * 1000   : quiz.endAt   ? new Date(quiz.endAt).getTime()   : (startMs && quiz.timeLimit ? startMs + quiz.timeLimit * 60000 : null)
                                const now = Date.now()
                                const isClosed   = quiz.isActive !== false && endMs && endMs <= now
                                const isUpcoming = quiz.isActive !== false && startMs && startMs > now
                                const isDraft    = quiz.isActive === false
                                const isLive     = !isDraft && (!startMs || startMs <= now) && !isClosed

                                const statusLabel = isClosed ? "Completed" : isDraft ? "Draft" : isUpcoming ? "Upcoming" : "Live"
                                const statusColor = isClosed ? "#a78bfa" : isDraft ? "#f87171" : isUpcoming ? "#fbbf24" : "#34d399"
                                const statusBg    = isClosed ? "rgba(167,139,250,0.12)" : isDraft ? "rgba(248,113,113,0.12)" : isUpcoming ? "rgba(251,191,36,0.12)" : "rgba(52,211,153,0.12)"

                                return (
                                    <div key={quiz.id} style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${statusColor}28`, borderRadius: "14px", padding: "16px 20px", display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                                        <div style={{ flex: 1, minWidth: "200px" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px", flexWrap: "wrap" }}>
                                                <strong style={{ color: "#fff", fontSize: "1rem" }}>{quiz.title}</strong>
                                                <span style={{ background: statusBg, color: statusColor, padding: "3px 10px", borderRadius: "20px", fontSize: "0.73rem", fontWeight: 800, letterSpacing: "0.03em" }}>{statusLabel}</span>
                                            </div>
                                            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", fontSize: "0.78rem" }}>
                                                <span style={{ background: "rgba(6,182,212,0.1)", color: "#67e8f9", padding: "2px 9px", borderRadius: "20px", fontWeight: 700 }}>{quiz.questions?.length || 0} Qs</span>
                                                <span style={{ background: "rgba(251,191,36,0.1)", color: "#fcd34d", padding: "2px 9px", borderRadius: "20px", fontWeight: 700 }}>{quiz.timeLimit || 10} min</span>
                                                {quiz.createdAt?.seconds && <span style={{ color: "rgba(255,255,255,0.35)" }}>Created {fmtTs(quiz.createdAt)}</span>}
                                                {startMs && <span style={{ color: "rgba(255,255,255,0.4)" }}>Starts {fmtTs(quiz.startAt)}</span>}
                                                {endMs && <span style={{ color: isClosed ? "rgba(255,255,255,0.4)" : "#fca5a5" }}>Ends {new Date(endMs).toLocaleString('en-US', {day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'}).replace(',', '')}</span>}
                                            </div>
                                        </div>
                                        <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                                            <button onClick={async () => {
                                                const ref = doc(db, "quizzes", quiz.id);
                                                await updateDoc(ref, { isActive: !quiz.isActive });
                                                loadQuizzes();
                                            }}
                                            style={{ background: isDraft ? "rgba(52,211,153,0.12)" : "rgba(248,113,113,0.12)", border: `1px solid ${isDraft ? "rgba(52,211,153,0.3)" : "rgba(248,113,113,0.3)"}`, borderRadius: "8px", color: isDraft ? "#34d399" : "#f87171", padding: "7px 14px", cursor: "pointer", fontWeight: 700, fontSize: "0.82rem", whiteSpace: "nowrap" }}>
                                                {isDraft ? "▶ Publish" : "⏸ Unpublish"}
                                            </button>
                                            <button onClick={() => loadQuizResults(quiz.id, quiz.title)}
                                                style={{ background: isClosed ? "rgba(167,139,250,0.15)" : "rgba(52,211,153,0.12)", border: `1px solid ${isClosed ? "rgba(167,139,250,0.3)" : "rgba(52,211,153,0.3)"}`, borderRadius: "8px", color: isClosed ? "#a78bfa" : "#34d399", padding: "7px 14px", cursor: "pointer", fontWeight: 700, fontSize: "0.82rem", whiteSpace: "nowrap" }}>
                                                📊 Results
                                            </button>
                                            <button onClick={() => handleDeleteQuiz(quiz.id)}
                                                style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "8px", color: "#f87171", padding: "7px 12px", cursor: "pointer", fontWeight: 700, fontSize: "0.82rem" }}>Delete</button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}

                    {/* Results Modal */}
                    {quizResults && (
                        <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.82)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "28px 16px", backdropFilter: "blur(8px)" }}
                            onClick={e => e.target === e.currentTarget && setQuizResults(null)}>
                            <div style={{ background: "#141824", borderRadius: "20px", width: "100%", maxWidth: "1000px", maxHeight: "calc(100vh - 56px)", display: "flex", flexDirection: "column", boxShadow: "0 28px 90px rgba(0,0,0,0.7)", border: "1px solid rgba(6,182,212,0.2)", overflow: "hidden" }}>
                                {/* Modal header */}
                                <div style={{ padding: "20px 26px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: "16px", background: "rgba(6,182,212,0.06)", flexShrink: 0 }}>
                                    <div style={{ flex: 1 }}>
                                        <h3 style={{ margin: 0, color: "#fff", fontWeight: 800, fontSize: "1.1rem" }}>📊 {quizResults.title}</h3>
                                        <p style={{ margin: "3px 0 0", color: "rgba(255,255,255,0.45)", fontSize: "0.8rem" }}>{quizResults.results.length} submission{quizResults.results.length !== 1 ? "s" : ""}</p>
                                    </div>
                                    <button onClick={() => downloadQuizCSV(quizResults.title, quizResults.results)}
                                        style={{ background: "rgba(6,182,212,0.15)", border: "1px solid rgba(6,182,212,0.35)", borderRadius: "10px", color: "#06b6d4", padding: "9px 18px", cursor: "pointer", fontWeight: 700, whiteSpace: "nowrap" }}>⬇ Download CSV</button>
                                    <button onClick={() => setQuizResults(null)}
                                        style={{ background: "rgba(239,68,68,0.12)", border: "none", borderRadius: "10px", color: "#f87171", padding: "9px 14px", cursor: "pointer", fontWeight: 800, fontSize: "1.1rem", lineHeight: 1 }}>✕</button>
                                </div>
                                {/* Modal body */}
                                <div style={{ flex: 1, overflowY: "auto", overflowX: "auto" }}>
                                    {quizResults.results.length === 0 ? (
                                        <div style={{ padding: "60px 20px", textAlign: "center" }}>
                                            <p style={{ fontSize: "2rem" }}>📭</p>
                                            <p style={{ color: "rgba(255,255,255,0.35)", marginTop: "10px" }}>No submissions yet for this quiz.</p>
                                        </div>
                                    ) : (
                                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.87rem", minWidth: "780px" }}>
                                            <thead style={{ position: "sticky", top: 0, zIndex: 2, background: "#1a1f2e" }}>
                                                <tr style={{ borderBottom: "2px solid rgba(255,255,255,0.08)" }}>
                                                    {["#","Name","Student ID","Email","Score","%","Time","Submitted"].map(h => (
                                                        <th key={h} style={{ textAlign: "left", padding: "12px 16px", color: "#06b6d4", fontWeight: 700, fontSize: "0.72rem", whiteSpace: "nowrap", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {quizResults.results.map((r, i) => {
                                                    const pass = r.percentage >= 50
                                                    const sc = pass ? "#34d399" : "#f87171"
                                                    const sbg = pass ? "rgba(52,211,153,0.12)" : "rgba(248,113,113,0.12)"
                                                    return (
                                                        <tr key={r.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent" }}>
                                                            <td style={{ padding: "11px 16px", color: "rgba(255,255,255,0.35)", fontWeight: 700 }}>{i + 1}</td>
                                                            <td style={{ padding: "11px 16px", color: "#fff", fontWeight: 700, whiteSpace: "nowrap" }}>{r.studentName}</td>
                                                            <td style={{ padding: "11px 16px", color: "#06b6d4", fontFamily: "monospace", whiteSpace: "nowrap" }}>{r.studentId}</td>
                                                            <td style={{ padding: "11px 16px", color: "rgba(255,255,255,0.45)", fontSize: "0.82rem", whiteSpace: "nowrap" }}>{r.studentEmail || "—"}</td>
                                                            <td style={{ padding: "11px 16px", whiteSpace: "nowrap" }}>
                                                                <span style={{ background: sbg, color: sc, padding: "3px 10px", borderRadius: "20px", fontWeight: 800, fontSize: "0.82rem" }}>{r.score}/{r.total}</span>
                                                            </td>
                                                            <td style={{ padding: "11px 16px", fontWeight: 800, color: sc, fontSize: "1rem" }}>{r.percentage}%</td>
                                                            <td style={{ padding: "11px 16px", color: "rgba(255,255,255,0.45)", whiteSpace: "nowrap" }}>{Math.floor(r.timeTaken / 60)}m {r.timeTaken % 60}s</td>
                                                            <td style={{ padding: "11px 16px", color: "rgba(255,255,255,0.45)", whiteSpace: "nowrap", fontSize: "0.8rem" }}>
                                                                {r.submittedAt?.seconds ? new Date(r.submittedAt.seconds * 1000).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}
                                                            </td>
                                                        </tr>
                                                    )
                                                })}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                </>}


                {/* ─── LESSONS TAB ─── */}
                {activeTab === "lessons" && <>
                <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "24px 28px", marginTop: "0" }}>
                    <h2 style={{ marginBottom: "24px", color: "#fff", fontWeight: 800, fontSize: "1.2rem" }}>Lesson / Tutorial Management <span style={{ color: "#ec4899", fontSize: "0.9rem" }}>({lessons.length} lessons)</span></h2>

                    {/* Create Lesson Form */}
                    <form onSubmit={handleSaveLesson} style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "36px", padding: "24px", borderRadius: "12px", background: "rgba(0,115,103,0.04)", border: "1px solid var(--border-color)" }}>
                        <h3 style={{ margin: 0, color: "var(--accent-color)", fontSize: "1rem" }}>Create New Lesson</h3>

                        <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
                            <input placeholder="Lesson Title *" value={newLesson.title} required onChange={e => setNewLesson(p => ({ ...p, title: e.target.value }))}
                                style={{ flex: 3, minWidth: "220px", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "rgba(255,255,255,0.05)", color: "var(--text-main)" }} />
                            <input type="number" min="1" placeholder="Order" value={newLesson.order} onChange={e => setNewLesson(p => ({ ...p, order: e.target.value }))}
                                style={{ width: "80px", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "rgba(255,255,255,0.05)", color: "var(--text-main)" }} />
                        </div>

                        <textarea placeholder="Lesson description (optional)" value={newLesson.description} onChange={e => setNewLesson(p => ({ ...p, description: e.target.value }))} rows="2"
                            style={{ padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "rgba(255,255,255,0.05)", color: "var(--text-main)", resize: "vertical" }} />

                        {/* Topics */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                            {newLesson.topics.map((topic, ti) => (
                                <div key={ti} style={{ padding: "16px", borderRadius: "10px", border: "1px solid var(--border-color)", background: "rgba(255,255,255,0.03)" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                                        <span style={{ fontWeight: 700, color: "var(--accent-color)", fontSize: "0.88rem" }}>Topic {ti + 1}</span>
                                        {newLesson.topics.length > 1 && (
                                            <button type="button" onClick={() => setNewLesson(p => ({ ...p, topics: p.topics.filter((_, i) => i !== ti) }))}
                                                style={{ background: "rgba(239,68,68,0.12)", border: "none", borderRadius: "6px", color: "#ef4444", padding: "4px 10px", cursor: "pointer", fontSize: "0.8rem" }}>Remove</button>
                                        )}
                                    </div>
                                    <input placeholder="Topic title *" value={topic.title} required onChange={e => { const ts = [...newLesson.topics]; ts[ti].title = e.target.value; setNewLesson(p => ({ ...p, topics: ts })) }}
                                        style={{ width: "100%", padding: "9px 12px", borderRadius: "7px", border: "1px solid var(--border-color)", background: "rgba(255,255,255,0.05)", color: "var(--text-main)", marginBottom: "10px", boxSizing: "border-box" }} />

                                    <p style={{ margin: "0 0 6px", fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600 }}>Video URLs (YouTube embed / direct)</p>
                                    {topic.videos.map((v, vi) => (
                                        <div key={vi} style={{ display: "flex", gap: "8px", marginBottom: "6px" }}>
                                            <input placeholder={`Video URL ${vi + 1}`} value={v} onChange={e => { const ts = [...newLesson.topics]; ts[ti].videos[vi] = e.target.value; setNewLesson(p => ({ ...p, topics: ts })) }}
                                                style={{ flex: 1, padding: "7px 10px", borderRadius: "6px", border: "1px solid var(--border-color)", background: "rgba(255,255,255,0.05)", color: "var(--text-main)", fontSize: "0.88rem" }} />
                                            {topic.videos.length > 1 && (
                                                <button type="button" onClick={() => { const ts = [...newLesson.topics]; ts[ti].videos = ts[ti].videos.filter((_, i) => i !== vi); setNewLesson(p => ({ ...p, topics: ts })) }}
                                                    style={{ background: "rgba(239,68,68,0.12)", border: "none", borderRadius: "6px", color: "#ef4444", padding: "4px 8px", cursor: "pointer" }}>X</button>
                                            )}
                                        </div>
                                    ))}
                                    <button type="button" onClick={() => { const ts = [...newLesson.topics]; ts[ti].videos.push(""); setNewLesson(p => ({ ...p, topics: ts })) }}
                                        style={{ background: "transparent", border: "1px dashed var(--border-color)", borderRadius: "6px", color: "var(--text-muted)", padding: "4px 10px", cursor: "pointer", fontSize: "0.8rem", marginTop: "4px" }}>+ Add Video</button>

                                    <p style={{ margin: "10px 0 6px", fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600 }}>Material Links (PDF, Drive, etc.)</p>
                                    {topic.materials.map((m, mi) => (
                                        <div key={mi} style={{ display: "flex", gap: "8px", marginBottom: "6px" }}>
                                            <input placeholder={`Material URL ${mi + 1}`} value={m} onChange={e => { const ts = [...newLesson.topics]; ts[ti].materials[mi] = e.target.value; setNewLesson(p => ({ ...p, topics: ts })) }}
                                                style={{ flex: 1, padding: "7px 10px", borderRadius: "6px", border: "1px solid var(--border-color)", background: "rgba(255,255,255,0.05)", color: "var(--text-main)", fontSize: "0.88rem" }} />
                                            {topic.materials.length > 1 && (
                                                <button type="button" onClick={() => { const ts = [...newLesson.topics]; ts[ti].materials = ts[ti].materials.filter((_, i) => i !== mi); setNewLesson(p => ({ ...p, topics: ts })) }}
                                                    style={{ background: "rgba(239,68,68,0.12)", border: "none", borderRadius: "6px", color: "#ef4444", padding: "4px 8px", cursor: "pointer" }}>X</button>
                                            )}
                                        </div>
                                    ))}
                                    <button type="button" onClick={() => { const ts = [...newLesson.topics]; ts[ti].materials.push(""); setNewLesson(p => ({ ...p, topics: ts })) }}
                                        style={{ background: "transparent", border: "1px dashed var(--border-color)", borderRadius: "6px", color: "var(--text-muted)", padding: "4px 10px", cursor: "pointer", fontSize: "0.8rem", marginTop: "4px" }}>+ Add Material</button>
                                </div>
                            ))}
                        </div>

                        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                            <button type="button" onClick={() => setNewLesson(p => ({ ...p, topics: [...p.topics, { title: "", videos: [""], materials: [""] }] }))}
                                style={{ background: "rgba(0,115,103,0.12)", border: "none", borderRadius: "8px", color: "var(--accent-color)", padding: "9px 18px", cursor: "pointer", fontWeight: 700, fontSize: "0.87rem" }}>
                                + Add Topic
                            </button>
                            <button type="submit" className="btn-primary" style={{ padding: "9px 24px", backgroundColor: "var(--accent-color)" }}>Save Lesson</button>
                        </div>
                    </form>

                    {/* Existing Lessons */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {lessons.length === 0 && <p style={{ color: "rgba(255,255,255,0.3)", textAlign: "center", padding: "24px" }}>No lessons yet.</p>}
                        {lessons.map(lesson => (
                            <div key={lesson.id} style={{ display: "flex", alignItems: "center", gap: "14px", padding: "14px 18px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <strong style={{ color: "#fff" }}>#{lesson.order} — {lesson.title}</strong>
                                    <div style={{ display: "flex", gap: "8px", marginTop: "4px", flexWrap: "wrap", fontSize: "0.78rem" }}>
                                        <span style={{ background: "rgba(236,72,153,0.15)", color: "#ec4899", padding: "2px 8px", borderRadius: "20px", fontWeight: 700 }}>{lesson.topics?.length || 0} topics</span>
                                        {lesson.description && <span style={{ color: "rgba(255,255,255,0.4)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "300px" }}>{lesson.description}</span>}
                                    </div>
                                </div>
                                <button onClick={() => handleDeleteLesson(lesson.id)} style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444", border: "none", borderRadius: "8px", padding: "7px 12px", cursor: "pointer", fontWeight: 700 }}>Delete</button>
                            </div>
                        ))}
                    </div>
                </div>
                </>}

                {/* ─── ANNOUNCEMENTS TAB ─── */}
                {activeTab === "announcements" && <>
                <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "24px 28px", marginTop: "0" }}>
                    <h2 style={{ marginBottom: "24px", color: "#fff", fontWeight: 800, fontSize: "1.2rem" }}>Announcements Management</h2>
                    <form onSubmit={handleSaveAnnouncement} style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "36px", padding: "24px", borderRadius: "12px", background: "rgba(0,115,103,0.04)", border: "1px solid var(--border-color)" }}>
                        <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
                            <input placeholder="Title *" value={newAnnouncement.title} required onChange={e => setNewAnnouncement(p => ({ ...p, title: e.target.value }))} style={{ flex: 2, padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "rgba(255,255,255,0.05)", color: "var(--text-main)" }} />
                            <input placeholder="Topic (e.g. Workshop)" value={newAnnouncement.topic} onChange={e => setNewAnnouncement(p => ({ ...p, topic: e.target.value }))} style={{ flex: 1, padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "rgba(255,255,255,0.05)", color: "var(--text-main)" }} />
                        </div>
                        <textarea placeholder="Content *" required value={newAnnouncement.content} onChange={e => setNewAnnouncement(p => ({ ...p, content: e.target.value }))} rows="3" style={{ padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "rgba(255,255,255,0.05)", color: "var(--text-main)", resize: "vertical" }} />
                        <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
                            <input type="url" placeholder="Image URL (optional)" value={newAnnouncement.imageUrl} onChange={e => setNewAnnouncement(p => ({ ...p, imageUrl: e.target.value }))} style={{ flex: 1, padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "rgba(255,255,255,0.05)", color: "var(--text-main)" }} />
                            <input type="url" placeholder="PDF/Drive URL (optional)" value={newAnnouncement.pdfUrl} onChange={e => setNewAnnouncement(p => ({ ...p, pdfUrl: e.target.value }))} style={{ flex: 1, padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "rgba(255,255,255,0.05)", color: "var(--text-main)" }} />
                        </div>
                        <button type="submit" className="btn-primary" style={{ padding: "9px 24px", backgroundColor: "var(--accent-color)", alignSelf: "flex-start" }}>Post Announcement</button>
                    </form>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {announcements.length === 0 && <p style={{ color: "rgba(255,255,255,0.3)", textAlign: "center" }}>No announcements.</p>}
                        {announcements.map(a => (
                            <div key={a.id} style={{ display: "flex", alignItems: "center", gap: "14px", padding: "14px 18px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)", flexWrap: "wrap" }}>
                                <div style={{ flex: 1, minWidth: "250px" }}>
                                    <strong style={{ color: "#fff" }}>{a.title || "Untitled"}</strong>
                                    <span style={{ marginLeft: "10px", fontSize: "0.8rem", color: "var(--accent-color)", background: "rgba(0,115,103,0.15)", padding: "2px 8px", borderRadius: "10px" }}>{a.topic || ""}</span>
                                    <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "rgba(255,255,255,0.5)", wordBreak: "break-word" }}>{(a.content || "").substring(0, 150)}{(a.content || "").length > 150 ? "..." : ""}</p>
                                </div>
                                <button onClick={() => handleDeleteAnnouncement(a.id)} style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444", border: "none", borderRadius: "8px", padding: "7px 12px", cursor: "pointer", fontWeight: 700 }}>Delete</button>
                            </div>
                        ))}
                    </div>
                </div>
                </>}

                {/* ─── COLLABORATORS TAB ─── */}
                {activeTab === "collaborators" && <>
                <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "24px 28px", marginTop: "0" }}>
                    <h2 style={{ marginBottom: "24px", color: "#fff", fontWeight: 800, fontSize: "1.2rem" }}>Industry Leaders Management</h2>
                    <form onSubmit={handleSaveCollaborator} style={{ display: "flex", gap: "14px", marginBottom: "36px", padding: "24px", borderRadius: "12px", background: "rgba(0,115,103,0.04)", border: "1px solid var(--border-color)", alignItems: "flex-end", flexWrap: "wrap" }}>
                        <div style={{ flex: 1, minWidth: "200px" }}>
                            <label style={{ display: "block", marginBottom: "6px", fontSize: "0.85rem", color: "var(--text-muted)" }}>Company Name *</label>
                            <input value={newCollaborator.name} required onChange={e => setNewCollaborator(p => ({ ...p, name: e.target.value }))} style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "rgba(255,255,255,0.05)", color: "var(--text-main)", boxSizing: "border-box" }} />
                        </div>
                        <div style={{ flex: 2, minWidth: "200px" }}>
                            <label style={{ display: "block", marginBottom: "6px", fontSize: "0.85rem", color: "var(--text-muted)" }}>Logo URL (optional)</label>
                            <input type="url" value={newCollaborator.imgUrl} onChange={e => setNewCollaborator(p => ({ ...p, imgUrl: e.target.value }))} style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "rgba(255,255,255,0.05)", color: "var(--text-main)", boxSizing: "border-box" }} />
                        </div>
                        <button type="submit" className="btn-primary" style={{ padding: "10px 24px", backgroundColor: "var(--accent-color)", height: "42px" }}>Add Company</button>
                    </form>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "14px" }}>
                        {collaborators.length === 0 && <p style={{ color: "rgba(255,255,255,0.3)", textAlign: "center", gridColumn: "1 / -1" }}>No industry leaders added.</p>}
                        {collaborators.map(c => (
                            <div key={c.id} style={{ display: "flex", alignItems: "center", gap: "14px", padding: "14px 18px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
                                {c.imgUrl ? <img src={c.imgUrl} alt={c.name} style={{ width: "40px", height: "40px", objectFit: "contain", background: "#fff", borderRadius: "6px", padding: "4px" }} /> : <div style={{ width: "40px", height: "40px", background: "rgba(255,255,255,0.1)", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>🏢</div>}
                                <strong style={{ color: "#fff", flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</strong>
                                <button onClick={() => handleDeleteCollaborator(c.id)} style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444", border: "none", borderRadius: "8px", padding: "7px 12px", cursor: "pointer", fontWeight: 700 }}>Delete</button>
                            </div>
                        ))}
                    </div>
                </div>
                </>}

            </div>
        </div>
    )
}

const tableStyle = {
    width: "100%",
    borderCollapse: "collapse",
    textAlign: "left"
}

const thStyle = {
    backgroundColor: "rgba(0,184,156,0.06)",
    padding: "13px 15px",
    fontWeight: "700",
    color: "#00b89c",
    borderBottom: "2px solid rgba(255,255,255,0.08)",
    fontSize: "0.8rem",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    whiteSpace: "nowrap"
}

const tdStyle = {
    padding: "13px 15px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    color: "rgba(255,255,255,0.85)",
    fontSize: "0.88rem"
}

const trStyle = {
    transition: "background-color 0.15s ease"
}