import { useState } from "react";
import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import HowItWorks from "./components/HowItWorks";
import ChatSection from "./components/ChatSection";
import ReportSection from "./components/ReportSection";
import Footer from "./components/Footer";
import VoiceDemo from "./components/VoiceDemo";
import FIRAnalysisPage from "./pages/FIRAnalysisPage";
import { Routes, Route } from "react-router-dom";
function Home() {
  const [firReport, setFirReport] = useState(null);

  return (
    <div className="app-shell">
      <Navbar />
      <HeroSection />
      <HowItWorks />
      <ChatSection onFIRReady={setFirReport} />
      <ReportSection report={firReport} />
      <Footer />
      <VoiceDemo />
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/fir-analysis" element={<FIRAnalysisPage />} />
    </Routes>
  );
}

export default App;