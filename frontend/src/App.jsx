import { useState } from "react";
import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import HowItWorks from "./components/HowItWorks";
import ChatSection from "./components/ChatSection";
import ReportSection from "./components/ReportSection";
import Footer from "./components/Footer";
import VoiceDemo from "./components/VoiceDemo";

function App() {
  const [firReport, setFirReport] = useState(null);

  return (
    <div className="app-shell">
      <Navbar />
      <HeroSection />
      <HowItWorks />
      <ChatSection onFIRReady={setFirReport} />
      <ReportSection report={firReport} />
      <Footer />
      <VoiceDemo/>
    </div>
  );
}

export default App;
