import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import emailjs from '@emailjs/browser'
import './index.css'
import App from './App.jsx'

// Initialize EmailJS with your public key — MUST run before any emailjs.send() calls
emailjs.init({ publicKey: 'CxtFzvtGd24TLXplS' })

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
