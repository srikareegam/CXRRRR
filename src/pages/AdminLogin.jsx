import { useState } from "react"
import { signInWithPopup } from "firebase/auth"
import { auth, googleProvider } from "../firebase/firebaseConfig"
import { useNavigate, Link } from "react-router-dom"
import { ALLOWED_EMAILS } from "../config/adminEmails"

export default function AdminLogin() {

    const navigate = useNavigate()
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)


    const handleGoogleLogin = async () => {
        setLoading(true)
        setError("")

        try {
            const result = await signInWithPopup(auth, googleProvider)
            const userEmail = result.user?.email || ""

            console.log("Logged in:", userEmail)

            if (ALLOWED_EMAILS.includes(userEmail)) {
                navigate("/dashboard")
            } else {
                await auth.signOut()
                setError(`Access denied: ${userEmail}`)
            }

        } catch (err) {
            console.error(err)
            setError("Google sign-in failed")
        }

        setLoading(false)
    }

    return (
        <div className="inventory-sys-wrapper" style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "100vh",
            position: "relative"
        }}>

            {/* Back Button */}
            <Link to="/" className="btn-primary" style={{
                position: "absolute",
                top: "20px",
                left: "20px",
                textDecoration: "none"
            }}>
                &larr; Home
            </Link>

            {/* Glass Card */}
            <div className="glass-panel" style={{
                width: "100%",
                maxWidth: "400px",
                padding: "40px"
            }}>

                <h2 className="text-gradient" style={{
                    textAlign: "center",
                    marginBottom: "30px",
                    fontSize: "2rem"
                }}>
                    Admin Portal
                </h2>

                {error && (
                    <p style={{
                        color: "#d93025",
                        backgroundColor: "#fce8e6",
                        padding: "10px",
                        borderRadius: "5px",
                        textAlign: "center",
                        fontSize: "0.9rem"
                    }}>
                        {error}
                    </p>
                )}

                <div style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "15px",
                    marginTop: "20px"
                }}>

                    <button
                        type="button"
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        className="btn-primary"
                        style={{
                            width: "100%",
                            padding: "12px",
                            borderRadius: "8px",
                            opacity: loading ? 0.7 : 1
                        }}
                    >
                        {loading ? "Signing in..." : "Sign in with Google"}
                    </button>

                </div>
            </div>
        </div>
    )
}