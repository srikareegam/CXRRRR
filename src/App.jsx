import { BrowserRouter, Routes, Route } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";

import Home from "./pages/Home";
import RequestForm from "./pages/RequestForm";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import ContactUs from "./pages/ContactUs";
import Tutorials from "./pages/Tutorials";
import Quizzes from "./pages/Quizzes";
import QuizAttempt from "./pages/QuizAttempt";

function App() {

  return (

    <BrowserRouter>
      <ScrollToTop />
      <Routes>

        <Route path="/" element={<Home />} />
        <Route path="/request" element={<RequestForm />} />
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/dashboard" element={<AdminDashboard />} />
        <Route path="/contact" element={<ContactUs />} />
        <Route path="/tutorials" element={<Tutorials />} />
        <Route path="/quizzes" element={<Quizzes />} />
        <Route path="/quiz/:quizId" element={<QuizAttempt />} />

      </Routes>

    </BrowserRouter>

  );

}

export default App;