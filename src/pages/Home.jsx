import React, { useLayoutEffect, useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ChevronRight, MapPin, Activity, Settings, Users, ArrowRight, Target, Eye, Cpu, MonitorPlay, Infinity as InfinityIcon, Mail } from 'lucide-react';

// LinkedIn SVG icon (not available in this lucide-react version)
const LinkedInIcon = ({ size = 18, color = 'currentColor' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);
import ThreeCanvas from '../components/ThreeCanvas';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { db } from "../firebase/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";


gsap.registerPlugin(ScrollTrigger);

const Home = () => {
  const mainRef = useRef();
  const [projects, setProjects] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [collaborators, setCollaborators] = useState([]);


  useEffect(() => {
    // ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ Instant cache load ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬
    // Show cached data immediately so the UI renders on first paint,
    // then silently refresh from Firestore in the background.
    const cachedInventory = localStorage.getItem('cxr_inventory');
    const cachedProjects = localStorage.getItem('cxr_projects');
    if (cachedInventory) setInventory(JSON.parse(cachedInventory));
    if (cachedProjects) setProjects(JSON.parse(cachedProjects));

    // ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ Background Firestore refresh ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬
    const fetchProjects = async () => {
      try {
        const snapshot = await getDocs(collection(db, "projects_showcase"));
        const list = [];
        snapshot.forEach((docSnap) => list.push({ id: docSnap.id, ...docSnap.data() }));
        setProjects(list);
        localStorage.setItem('cxr_projects', JSON.stringify(list));
      } catch (err) {
        console.error("Failed to fetch projects:", err);
      }
    };

    const fetchInventory = async () => {
      try {
        const snapshot = await getDocs(collection(db, "products"));
        const list = [];
        snapshot.forEach((docSnap) => list.push({ id: docSnap.id, ...docSnap.data() }));
        setInventory(list);
        localStorage.setItem('cxr_inventory', JSON.stringify(list));
      } catch (err) {
        console.error("Failed to fetch inventory:", err);
      }
    };

    const fetchAnnouncements = async () => {
      try {
        const snapshot = await getDocs(collection(db, "announcements"));
        const list = [];
        snapshot.forEach((docSnap) => list.push({ id: docSnap.id, ...docSnap.data() }));
        list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setAnnouncements(list);
      } catch (err) {
        console.error("Failed to fetch announcements:", err);
      }
    };

    fetchProjects();
    fetchInventory();
    fetchAnnouncements();

    const fetchCollaborators = async () => {
      try {
        const snapshot = await getDocs(collection(db, "collaborators"));
        const list = [];
        snapshot.forEach((docSnap) => list.push({ id: docSnap.id, ...docSnap.data() }));
        list.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
        setCollaborators(list);
      } catch (err) {
        console.error("Failed to fetch collaborators:", err);
      }
    };
    fetchCollaborators();
  }, []);

  useLayoutEffect(() => {
    let ctx = gsap.context(() => {
      // Fade in text effects
      const textRevealElements = gsap.utils.toArray('.reveal-text');
      textRevealElements.forEach((el) => {
        gsap.fromTo(el,
          { y: 50, opacity: 0 },
          {
            y: 0, opacity: 1, duration: 1, ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none reverse' }
          }
        );
      });

      // Counters
      const counters = gsap.utils.toArray('.stat-counter');
      counters.forEach((counter) => {
        gsap.fromTo(counter,
          { innerHTML: 0 },
          {
            innerHTML: counter.dataset.target,
            duration: 2,
            snap: { innerHTML: 1 },
            scrollTrigger: { trigger: counter, start: 'top 85%' }
          }
        );
      });

      // Horizontal Scroll for "Work Section"
      const horizontalContainer = document.querySelector('.horizontal-scroll-container');
      if (horizontalContainer) {
        gsap.to(horizontalContainer, {
          x: () => -(horizontalContainer.scrollWidth - window.innerWidth) + "px",
          ease: "none",
          scrollTrigger: {
            trigger: "#work-section",
            start: "top top",
            end: () => "+=" + horizontalContainer.scrollWidth,
            pin: true,
            scrub: 1,
            invalidateOnRefresh: true,
          }
        });
      }

      // Fade canvas out exactly after Work Section (trigged perfectly because it's defined after the pin)
      gsap.to('#canvas-container', {
        opacity: 0.15,
        filter: 'blur(5px)',
        ease: 'none',
        scrollTrigger: {
          trigger: '#facts-section',
          start: 'top bottom', // Executes genuinely when facts-section hits the bottom of the viewport
          end: 'top center',
          scrub: 1,
        }
      });

      // Crucial: after we construct the new pinned scrub timeline (which changes vertical heights),
      // we must force GSAP to refresh all external ScrollTriggers (like the 3D model)
      setTimeout(() => ScrollTrigger.refresh(), 100);

    }, mainRef);

    return () => ctx.revert();
  }, [projects]); // Re-run GSAP when projects load

  return (
    <div ref={mainRef} className="portfolio-wrapper">
      <ThreeCanvas />

      <Navbar />

      {/* SECTION: Hero */}
      <section id="hero-section" style={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 10%' }}>
        <h1 className="reveal-text text-gradient" style={{ fontSize: '5rem', maxWidth: '700px', marginBottom: '20px' }}>
          Centre for Extended Reality
        </h1>
        <p className="reveal-text" style={{ fontSize: '1.5rem', maxWidth: '500px', color: '#333' }}>
          Shaping the future of immersive computing through AR, VR, and mixed environments.
        </p>
        <div className="reveal-text" style={{ marginTop: '30px', display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button className="btn-primary" onClick={() => document.getElementById('mission-section').scrollIntoView({ behavior: 'smooth' })}>
            Explore Our Vision <ChevronRight size={20} style={{ marginLeft: '8px' }} />
          </button>

          {/* ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ Apply for Internship ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ animated themed button ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ */}
          <Link
            to="/contact"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="internship-btn"
          >
            <span className="internship-btn__shimmer" />
            <span className="internship-btn__label">Apply for Summer Internship</span>
            <ArrowRight size={18} style={{ marginLeft: '6px', flexShrink: 0 }} />
          </Link>

          <style dangerouslySetInnerHTML={{
            __html: `
            .internship-btn {
              position: relative;
              display: inline-flex;
              align-items: center;
              gap: 4px;
              padding: 13px 30px;
              border-radius: 50px;
              font-weight: 700;
              font-size: 1rem;
              text-decoration: none;
              color: #fff;
              background: linear-gradient(135deg, #007367 0%, #00b89c 50%, #007367 100%);
              background-size: 200% 200%;
              animation: internshipGradient 3s ease infinite, internshipPulse 2.5s ease-in-out infinite;
              box-shadow: 0 0 18px rgba(0,184,156,0.45), 0 4px 20px rgba(0,115,103,0.35);
              overflow: hidden;
              transition: transform 0.2s, box-shadow 0.2s;
              border: none;
            }
            .internship-btn:hover {
              transform: translateY(-3px) scale(1.04);
              box-shadow: 0 0 32px rgba(0,184,156,0.65), 0 8px 28px rgba(0,115,103,0.45);
              color: #fff;
            }
            .internship-btn__shimmer {
              position: absolute;
              top: 0; left: -75%;
              width: 50%;
              height: 100%;
              background: linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.28) 50%, transparent 100%);
              transform: skewX(-20deg);
              animation: internshipShimmer 2.8s ease-in-out infinite;
              pointer-events: none;
            }
            .internship-btn__label { position: relative; z-index: 1; }
            @keyframes internshipGradient {
              0%   { background-position: 0% 50%; }
              50%  { background-position: 100% 50%; }
              100% { background-position: 0% 50%; }
            }
            @keyframes internshipPulse {
              0%, 100% { box-shadow: 0 0 18px rgba(0,184,156,0.45), 0 4px 20px rgba(0,115,103,0.35); }
              50%       { box-shadow: 0 0 30px rgba(0,184,156,0.75), 0 6px 26px rgba(0,115,103,0.55); }
            }
            @keyframes internshipShimmer {
              0%   { left: -75%; }
              60%, 100% { left: 130%; }
            }
          `}} />
        </div>

      </section>

      {/* SECTION: Mission & Vision */}
      <section id="mission-section" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', padding: '100px 10%', background: 'linear-gradient(rgba(255,255,255,0), rgba(255,255,255,0.95))' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px', width: '100%' }}>

          <div className="glass-panel text-content reveal-text" style={{ padding: '60px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <Target size={48} color="var(--accent-color)" />
            <h2 className="text-gradient" style={{ fontSize: '2.5rem' }}>Our Mission</h2>
            <p style={{ fontSize: '1.2rem', color: '#444', lineHeight: 1.6 }}>
              To empower students, researchers, and industry leaders by providing cutting-edge infrastructure and expertise in spatial computing. We strive to solve real-world problems through multidisciplinary technical innovation and hands-on learning in AR, VR, and MR.
            </p>
          </div>

          <div className="glass-panel text-content reveal-text" style={{ padding: '60px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <Eye size={48} color="var(--accent-color)" />
            <h2 className="text-gradient" style={{ fontSize: '2.5rem' }}>Our Vision</h2>
            <p style={{ fontSize: '1.2rem', color: '#444', lineHeight: 1.6 }}>
              To be a globally recognized hub for extended reality research and development, bridging the gap between imaginative concepts and accessible digital realities. We envision a future where spatial interfaces seamlessly augment human intellect and capabilities.
            </p>
          </div>

        </div>
      </section>

      {/* SECTION: Fields of Work (Horizontal Scroll) */}
      <section id="work-section" style={{ height: '100vh', overflow: 'hidden', position: 'relative', background: 'transparent' }}>
        <h2 className="reveal-text text-gradient" style={{ fontSize: '3rem', position: 'absolute', top: '10%', left: '10%', zIndex: 2 }}>Fields of Work</h2>

        <div className="horizontal-scroll-container" style={{ display: 'flex', width: '400vw', height: '100%', alignItems: 'center', paddingLeft: '10vw' }}>

          <div className="glass-panel" style={{ width: '70vw', height: '50vh', flexShrink: 0, marginRight: '10vw', padding: '60px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <MonitorPlay size={64} color="var(--accent-color)" style={{ marginBottom: '30px' }} />
            <h3 style={{ fontSize: '2.5rem', marginBottom: '20px' }}>Virtual Reality (VR)</h3>
            <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>Creating fully immersive digital environments for training, simulation, and entertainment using state-of-the-art headsets.</p>
          </div>

          <div className="glass-panel" style={{ width: '70vw', height: '50vh', flexShrink: 0, marginRight: '10vw', padding: '60px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Eye size={64} color="var(--accent-color)" style={{ marginBottom: '30px' }} />
            <h3 style={{ fontSize: '2.5rem', marginBottom: '20px' }}>Augmented Reality (AR)</h3>
            <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>Overlaying dynamic digital information onto the physical world, enhancing situational awareness and interactivity.</p>
          </div>

          <div className="glass-panel" style={{ width: '70vw', height: '50vh', flexShrink: 0, marginRight: '10vw', padding: '60px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <InfinityIcon size={64} color="var(--accent-color)" style={{ marginBottom: '30px' }} />
            <h3 style={{ fontSize: '2.5rem', marginBottom: '20px' }}>Mixed Reality (MR)</h3>
            <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>Blending physical and digital worlds where physical and digital objects co-exist and interact in real-time.</p>
          </div>

          <div className="glass-panel" style={{ width: '70vw', height: '50vh', flexShrink: 0, marginRight: '20vw', padding: '60px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Cpu size={64} color="var(--accent-color)" style={{ marginBottom: '30px' }} />
            <h3 style={{ fontSize: '2.5rem', marginBottom: '20px' }}>Spatial Tracking</h3>
            <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>Advanced algorithmic research into inside-out tracking, hand tracking, and spatial mapping utilizing neural networks.</p>
          </div>

        </div>
      </section>

      {/* SECTION: Facts / Stats */}
      <section id="facts-section" style={{ padding: '100px 10%', display: 'flex', justifyContent: 'space-between', gap: '40px', flexWrap: 'wrap', background: 'transparent' }}>
        <div className="glass-panel" style={{ flex: 1, padding: '40px', textAlign: 'center' }}>
          <Activity size={40} color="var(--accent-color)" style={{ marginBottom: '20px' }} />
          <h3 style={{ fontSize: '4rem', margin: 0 }} className="stat-counter" data-target="50">0</h3>
          <p>Projects Completed</p>
        </div>
        <div className="glass-panel" style={{ flex: 1, padding: '40px', textAlign: 'center' }}>
          <Users size={40} color="var(--accent-color)" style={{ marginBottom: '20px' }} />
          <h3 style={{ fontSize: '4rem', margin: 0 }} className="stat-counter" data-target="5">0</h3>
          <p>Industry Partners</p>
        </div>
        <div className="glass-panel" style={{ flex: 1, padding: '40px', textAlign: 'center' }}>
          <Settings size={40} color="var(--accent-color)" style={{ marginBottom: '20px' }} />
          <h3 style={{ fontSize: '4rem', margin: 0 }} className="stat-counter" data-target="2">0</h3>
          <p>Active Patents</p>
        </div>
      </section>

      {/* SECTION: Announcements */}
      {announcements.length > 0 && (
        <section id="announcements-section" style={{ padding: '80px 10%', background: 'transparent' }}>
          <h2 className="reveal-text text-gradient" style={{ fontSize: '3rem', textAlign: 'center', marginBottom: '50px' }}>
            Announcements
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}>
            {announcements.map(a => (
              <div key={a.id} className="glass-panel reveal-text" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', borderRadius: '18px' }}>
                {a.imageUrl && (
                  <div style={{ height: '180px', backgroundImage: `url(${a.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                )}
                <div style={{ padding: '28px', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    {a.topic && (
                      <span style={{
                        padding: '3px 14px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 700,
                        background: 'rgba(0,115,103,0.15)', color: 'var(--accent-color)', whiteSpace: 'nowrap'
                      }}>
                        {a.topic}
                      </span>
                    )}
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {a.createdAt?.seconds ? new Date(a.createdAt.seconds * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                    </span>
                  </div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-main)' }}>{a.title}</h3>
                  <p style={{ color: 'var(--text-muted)', flex: 1, lineHeight: 1.7, whiteSpace: 'pre-wrap', margin: 0 }}>{a.content}</p>
                  {a.pdfUrl && (() => {
                    // Drive link → open in Google Drive directly (no iframe/viewer wrapping)
                    const isDrive = a.pdfUrl.includes("drive.google.com");
                    const driveId = isDrive && a.pdfUrl.match(/drive\.google\.com\/file\/d\/([^/?#\s]+)/)?.[1];
                    const href = isDrive && driveId
                      ? `https://drive.google.com/file/d/${driveId}/view?usp=sharing`
                      : a.pdfUrl; // Cloudinary or raw URL — open directly
                    return (
                      <a href={href} target="_blank" rel="noreferrer"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--accent-color)', fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none', marginTop: '8px', border: '1px solid var(--accent-color)', padding: '6px 14px', borderRadius: '20px' }}>
                        📄 {isDrive ? "Open in Google Drive" : "View PDF"}
                      </a>
                    );
                  })()}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* SECTION: Projects */}
      <section id="projects-section" style={{ padding: '100px 10%', background: 'transparent' }}>
        <h2 className="reveal-text text-gradient" style={{ fontSize: '3rem', textAlign: 'center', marginBottom: '60px' }}>Ongoing Innovations</h2>

        {projects.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No projects available yet.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px' }}>
            {projects.map((project) => (
              <div key={project.id} className="glass-panel reveal-text" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{
                  height: '200px',
                  backgroundColor: 'var(--accent-color)',
                  opacity: project.imageUrl ? 1 : 0.2,
                  backgroundImage: project.imageUrl ? `url(${project.imageUrl})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}></div>
                <div style={{ padding: '30px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ marginBottom: '10px' }}>{project.title}</h3>
                  <p style={{ color: 'var(--text-muted)', flex: 1 }}>{project.description}</p>

                  {project.repoLink && (
                    <a href={project.repoLink} target="_blank" rel="noreferrer" style={{
                      display: 'inline-flex', alignItems: 'center', color: 'var(--accent-color)', fontWeight: 600, textDecoration: 'none', marginTop: '20px'
                    }}>
                      View Repository <ArrowRight size={16} style={{ marginLeft: '8px' }} />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* SECTION: Hardware Inventory (Carousel) */}
      <section id="inventory-carousel-section" style={{ padding: '60px 0', backgroundColor: 'rgba(0, 115, 103, 0.08)' }}>
        <h2 className="reveal-text text-gradient" style={{ fontSize: '3rem', textAlign: 'center', marginBottom: '60px', padding: '0 10%' }}>Our Hardware Inventory</h2>

        {inventory.length > 0 ? (() => {
          const CARD_W = 292; // 260px card + 16px margin each side
          const oneSetPx = inventory.length * CARD_W;

          // Repeat enough copies so the strip is always wider than ~3 screen widths (ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â°Ãƒâ€šÃ‚Â¥ 5000px)
          // This eliminates any visible gap no matter how few items there are.
          const minCopies = Math.max(3, Math.ceil(5000 / oneSetPx) + 1);
          const allItems = Array.from({ length: minCopies }, () => inventory).flat();

          const duration = Math.max(14, inventory.length * 5);

          return (
            <div style={{ overflow: 'hidden', width: '100%' }}>
              <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes invScroll {
                  0%   { transform: translateX(0px); }
                  100% { transform: translateX(-${oneSetPx}px); }
                }
                #inventory-carousel-section .glass-panel {
                  transition: transform 0.25s ease, box-shadow 0.25s ease;
                }
                #inventory-carousel-section .glass-panel:hover {
                  transform: translateY(-6px) scale(1.04);
                  box-shadow: 0 14px 36px rgba(0,115,103,0.22);
                }
              `}} />
              <div style={{
                display: 'flex',
                width: `${allItems.length * CARD_W}px`,
                animation: `invScroll ${duration}s linear infinite`,
                willChange: 'transform',
              }}>
                {allItems.map((item, index) => (
                  <div key={`${item.id}-${index}`} className="glass-panel" style={{
                    width: '260px',
                    flexShrink: 0,
                    margin: '0 16px',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    borderRadius: '16px',
                    boxSizing: 'border-box',
                  }}>
                    <div style={{
                      width: '100%',
                      height: '180px',
                      flexShrink: 0,
                      backgroundColor: item.imageUrl ? 'transparent' : 'rgba(0,115,103,0.12)',
                      backgroundImage: item.imageUrl ? `url(${item.imageUrl})` : 'none',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      borderRadius: '10px',
                      marginBottom: '15px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '3rem',
                    }}>
                      {!item.imageUrl && 'ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸Ãƒâ€šÃ‚Â¥Ãƒâ€šÃ‚Â½'}
                    </div>
                    <h3 style={{ fontSize: '1.05rem', marginBottom: '6px', color: 'var(--text-main)', lineHeight: 1.3 }}>{item.name}</h3>
                  </div>
                ))}
              </div>
            </div>
          );
        })() : (
          <div style={{ display: 'flex', gap: '24px', padding: '0 10%', justifyContent: 'center' }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{
                width: '260px', height: '270px', borderRadius: '16px',
                background: 'linear-gradient(90deg, rgba(0,115,103,0.06) 25%, rgba(0,115,103,0.12) 50%, rgba(0,115,103,0.06) 75%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.5s infinite',
                flexShrink: 0,
              }} />
            ))}
            <style dangerouslySetInnerHTML={{
              __html: `
              @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
            `}} />
          </div>
        )}
      </section>

      {/* SECTION: Collaborators (Marquee) */}
      <section id="collaborators-section" style={{ padding: '60px 0', backgroundColor: 'rgba(0, 115, 103, 0.85)', backdropFilter: 'blur(5px)', color: '#fff', overflow: 'hidden' }}>
        <h3 style={{ textAlign: 'center', color: '#fff', marginBottom: '40px' }} className="reveal-text">Supported By Industry Leaders</h3>
        {(collaborators.length > 0 ? [...collaborators, ...collaborators] :
          ['Hindustan Shipyard Limited', 'INS KALINGA', 'ELURU POLICE', 'GITAM DENTAL',
            'Hindustan Shipyard Limited', 'INS KALINGA', 'ELURU POLICE', 'GITAM DENTAL']
        ).length > 0 && (
            <div style={{ display: 'flex', animation: 'marquee 18s linear infinite', width: 'max-content' }}>
              {(collaborators.length > 0
                ? [...collaborators.map(c => c.name), ...collaborators.map(c => c.name)]
                : ['Hindustan Shipyard Limited', 'INS KALINGA', 'ELURU POLICE', 'GITAM DENTAL',
                  'Hindustan Shipyard Limited', 'INS KALINGA', 'ELURU POLICE', 'GITAM DENTAL']
              ).map((name, i) => (
                <div key={i} style={{ whiteSpace: 'nowrap', fontSize: '1.5rem', fontWeight: 600, opacity: 0.7, padding: '0 60px' }}>
                  {name}
                </div>
              ))}
            </div>
          )}
        <style dangerouslySetInnerHTML={{
          __html: `
          @keyframes marquee { 
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
        `}} />
      </section>

      {/* SECTION: Management Body */}
      <section id="management-section" style={{ padding: '100px 10%', background: 'transparent' }}>
        <h2 className="reveal-text text-gradient" style={{ fontSize: '3rem', textAlign: 'center', marginBottom: '60px' }}>Team Centre For Extended Reality</h2>

        {/* ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ TOP ROW: Existing Engineering Team ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '40px', justifyContent: 'center', marginBottom: '80px' }}>
          {[
            { role: 'Heading CXR', name: 'Dr. M. Kranthi Kiran', img: 'https://media.licdn.com/dms/image/v2/C5603AQFbsnz0QRkLIQ/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1594181249518?e=1778716800&v=beta&t=VgpGX2P6q6RfWI3V7LXY148tR4bWa9AUNvHmSZEtHa4', email: 'kmandava@gitam.edu', linkedin: 'https://www.linkedin.com/in/dr-mandava-kranthi-kiran-45882617/' },
            { role: 'Project Engineer', name: 'M. Naveen', img: 'https://i.ibb.co/7ddNVRh1/Whats-App-Image-2026-04-15-at-14-30-22.jpg', email: 'nmeesala@gitam.edu', linkedin: 'https://www.linkedin.com/in/naveen-meesala-431a1b22b/?skipRedirect=true' },
            { role: 'Technical Assistant', name: 'T. Sunil Kumar', img: 'https://i.ibb.co/ynVNXRXP/image-2026-04-15-142024379.png', email: 'steeku@gitam.edu', linkedin: '' }
          ].map((member, i) => (
            <div key={i} className="glass-panel reveal-text" style={{ padding: '40px', width: '300px', textAlign: 'center' }}>
              <div style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                backgroundColor: '#ddd',
                margin: '0 auto 20px',
                backgroundImage: `url(${member.img})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                border: '4px solid var(--accent-color)'
              }}></div>
              <h3>{member.name}</h3>
              <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{member.role}</p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', marginTop: '14px' }}>
                {member.email && (
                  <a
                    href={`mailto:${member.email}`}
                    title={`Email ${member.name}`}
                    style={{ color: 'var(--accent-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', transition: 'opacity 0.2s', cursor: 'pointer', textDecoration: 'none' }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                    <Mail size={18} />
                    <span style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.01em' }}>{member.email}</span>
                  </a>
                )}
                {member.linkedin && (
                  <a href={member.linkedin} target="_blank" rel="noreferrer" title={`LinkedIn Ã¢â‚¬â€œ ${member.name}`} style={{ color: 'var(--accent-color)', display: 'flex', alignItems: 'center', transition: 'opacity 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                    <LinkedInIcon size={18} color="var(--accent-color)" />
                  </a>
                )}

              </div>
            </div>
          ))}
        </div>

        {/* ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ BOTTOM ROW: GSCSE Leadership ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ */}
        <h3 className="reveal-text text-gradient" style={{ fontSize: '2rem', textAlign: 'center', marginBottom: '40px' }}>Gitam School of Computer Science and Engineering</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '40px', justifyContent: 'center' }}>
          {[
            { role: 'Dean GSCSE', name: 'Prof. S. Arun Kumar', img: 'https://icacke.gitam.edu/assets/img/arun-kumar.jpg', email: 'arunkumar@gitam.edu', linkedin: '' },
            { role: 'Director GSCSE', name: 'K. Thirupathi Rao', img: 'https://media.licdn.com/dms/image/v2/C5103AQGwNmURHCbFLQ/profile-displayphoto-shrink_200_200/profile-displayphoto-shrink_200_200/0/1558004108351?e=1778716800&v=beta&t=54C1ZxAnZCRvtIP3R6jyCDnrdFyeoaFsxWtc5aspLbc', email: 'thirupathi@gitam.edu', },
            { role: 'HOD CSE', name: 'Dr. GVS Rajkumar', img: 'https://gitam.irins.org/profile_images/311423.jpg', email: 'gvsrajkumar@gitam.edu', },
            { role: 'HOD AI&DS', name: 'Dr. K. Naveen Kumar', img: 'https://scholar.googleusercontent.com/citations?view_op=view_photo&user=nxXbUkQAAAAJ&citpid=3', email: 'naveenkumar@gitam.edu', },
          ].map((member, i) => (
            <div key={`gscse-${i}`} className="glass-panel reveal-text" style={{ padding: '40px', width: '220px', textAlign: 'center' }}>
              <div style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                backgroundColor: member.img ? 'transparent' : 'rgba(0,115,103,0.15)',
                margin: '0 auto 20px',
                backgroundImage: member.img ? `url(${member.img})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                border: '4px solid var(--accent-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2.5rem',
                color: 'var(--accent-color)'
              }}>
                {!member.img && null}
              </div>
              <h3 style={{ fontSize: '1rem' }}>{member.name}</h3>
              <p style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.9rem' }}>{member.role}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION: Location & Lab */}
      <section id="location-section" style={{ padding: '100px 10%', display: 'flex', alignItems: 'center', gap: '40px', flexWrap: 'wrap', marginBottom: '50px' }}>
        <div className="reveal-text" style={{ flex: 1, minWidth: '300px' }}>
          <h2 className="text-gradient" style={{ fontSize: '3rem' }}>Our Laboratory</h2>
          <p>
            Nestled inside the CRL-2 Building in GITAM University , Vizag .The lab is well equipped with high end VR headsets, Haptic suits, AR devices, Motion Capture systems, and high end rendering systems to support the research and development in the field of Extended Reality.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '20px', fontWeight: 600 }}>
            <MapPin color="var(--accent-color)" /> CRL-2 Building, GITAM University, Vizag
          </div>
        </div>
        <div
          className="glass-panel reveal-text"
          style={{ flex: 1, minWidth: '300px', height: '400px', overflow: 'hidden', padding: 0 }}
        >
          <iframe
            src="https://www.google.com/maps?q=17.7806717,83.3752585&z=18&t=k&output=embed"
            width="100%"
            height="100%"
            style={{ border: 0, filter: 'contrast(1.1) brightness(0.9)' }}
            allowFullScreen=""
            loading="lazy"
          ></iframe>
        </div>
      </section>


      <Footer />
    </div>
  );
};

export default Home;
