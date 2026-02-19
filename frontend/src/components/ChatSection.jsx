import { useState, useEffect, useRef, useCallback } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { sttService, ttsService } from "../services/speechServices";
import { chatBot } from "../services/chatService";

gsap.registerPlugin(ScrollTrigger);

export default function ChatSection({ onFIRReady }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [language, setLanguage] = useState("en-US");
  const [hasStarted, setHasStarted] = useState(false);
  const [micPermission, setMicPermission] = useState("unknown");
  const [isFocused, setIsFocused] = useState(false);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const sectionRef = useRef(null);
  const chatBoxRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll only WITHIN the chat messages div, not the page
  const scrollToBottom = useCallback(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  // When the chat box is focused/active, keep the section visible
  useEffect(() => {
    if (isFocused && chatBoxRef.current) {
      // Scroll the chat section to center in viewport
      const rect = chatBoxRef.current.getBoundingClientRect();
      const viewportH = window.innerHeight;
      const elCenter = rect.top + rect.height / 2;
      const viewCenter = viewportH / 2;
      const offset = elCenter - viewCenter;
      if (Math.abs(offset) > 40) {
        window.scrollBy({ top: offset, behavior: "smooth" });
      }
    }
  }, [isFocused]);

   const speakText = async (text) => {
      setIsSpeaking(true);
      await ttsService.speak(text, language);
      setIsSpeaking(false);
    };
  const startConversation = async () => {
    if (hasStarted) return;
    setHasStarted(true);
    chatBot.reset();
    chatBot.setLanguage(language);
    const greeting = chatBot.getGreeting();
    setMessages([{ role: "assistant", content: greeting.message, id: Date.now() }]);
    await speakText(greeting.message);
  };
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Section header entrance
      gsap.from(".chat-header-anim", {
        scrollTrigger: { trigger: sectionRef.current, start: "top 82%", toggleActions: "play none none none" },
        y: 30, opacity: 0, stagger: 0.12, duration: 0.7, ease: "power2.out",
      });

      // Chat box entrance
      gsap.from(".chat-box", {
        scrollTrigger: { trigger: sectionRef.current, start: "top 70%", toggleActions: "play none none none" },
        y: 40, opacity: 0, duration: 0.8, delay: 0.3, ease: "power3.out",
      });
    }, sectionRef);
    
    const trigger = ScrollTrigger.create({
      trigger: sectionRef.current,
      start: "top 60%",
      onEnter: () => { if (!hasStarted) startConversation(); },
      once: true,
    });
    return () => { trigger.kill(); ctx.revert(); };
  }, []); 

  // Prevent page scroll when user scrolls inside chat
  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const preventPageScroll = (e) => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      const atTop = scrollTop === 0 && e.deltaY < 0;
      const atBottom = scrollTop + clientHeight >= scrollHeight - 1 && e.deltaY > 0;
      if (!atTop && !atBottom) {
        e.stopPropagation();
      }
    };
    el.addEventListener("wheel", preventPageScroll, { passive: false });
    return () => el.removeEventListener("wheel", preventPageScroll);
  }, []);

  // Click outside to unfocus
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (chatBoxRef.current && !chatBoxRef.current.contains(e.target)) {
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  
   

  const stopSpeaking = () => { ttsService.stop(); setIsSpeaking(false); };

  const toggleListening = async () => {
    if (isListening) { sttService.stop(); setIsListening(false); return; }
    stopSpeaking();
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicPermission("granted");
    } catch { setMicPermission("denied"); return; }

    sttService.setLanguage(language);
    sttService.onResult = (text) => { setInputText((p) => (p ? p + " " + text : text)); setInterimText(""); };
    sttService.onInterim = (text) => setInterimText(text);
    sttService.onEnd = () => setIsListening(false);
    sttService.onError = () => setIsListening(false);
    sttService.onStart = () => setIsListening(true);
    if (!sttService.start()) setMicPermission("denied");
  };

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || isProcessing) return;
    if (isListening) { sttService.stop(); setIsListening(false); }
    stopSpeaking();

    setMessages((prev) => [...prev, { role: "user", content: text, id: Date.now() }]);
    setInputText(""); setInterimText(""); setIsProcessing(true);

    await new Promise((r) => setTimeout(r, 600 + Math.random() * 600));

    const response = chatBot.getNextResponse(text);
    setMessages((prev) => [...prev, { role: "assistant", content: response.message, id: Date.now() + 1 }]);
    setIsProcessing(false);
    await speakText(response.message);

    if (response.firReport) {
      onFIRReady(response.firReport);
      setIsFocused(false);
      setTimeout(() => document.getElementById("report")?.scrollIntoView({ behavior: "smooth" }), 800);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleNewFIR = () => {
    chatBot.reset(); chatBot.setLanguage(language);
    setMessages([]); setHasStarted(false); onFIRReady(null);
    setTimeout(() => startConversation(), 200);
  };

  const handleChatBoxFocus = () => {
    setIsFocused(true);
  };

  return (
    <section id="chat" ref={sectionRef} className="chat-section">
      <div className="section-divider" />
      <div className="chat-inner">
        <div className="section-header">
          <span className="section-badge chat-header-anim">File Your FIR</span>
          <h2 className="section-title chat-header-anim">Tell us what happened</h2>
          <p className="section-desc chat-header-anim">
            Use the microphone to speak or type your responses below. The assistant will guide you.
          </p>
        </div>

        <div
          ref={chatBoxRef}
          className={`chat-box ${isFocused ? "chat-box-focused" : ""}`}
          onClick={handleChatBoxFocus}
        >
          <div className="chat-messages" ref={messagesContainerRef}>
            {!hasStarted && (
              <div className="chat-empty">
                <div className="chat-empty-icon">🎙️</div>
                <p className="chat-empty-text">Scroll here to start the conversation...</p>
              </div>
            )}

            {messages.map((msg) => (
              <ChatBubble key={msg.id} message={msg} onSpeak={() => speakText(msg.content)} />
            ))}

            {isProcessing && (
              <div className="typing-row">
                <div className="chat-avatar bot">
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5" />
                  </svg>
                </div>
                <div className="typing-dots">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input-area">
            {isSpeaking && (
              <div className="chat-speaking-bar">
                <div className="chat-speaking-waves">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="chat-wave-bar" style={{ animation: `wave-bar 0.8s ${i * 0.1}s ease-in-out infinite alternate`, height: "4px" }} />
                  ))}
                </div>
                <span className="chat-speaking-text">Assistant is speaking...</span>
                <button className="chat-speaking-stop" onClick={stopSpeaking}>Stop</button>
              </div>
            )}

            {interimText && (
              <div className="chat-interim">🎙️ {interimText}...</div>
            )}

            {micPermission === "denied" && (
              <div className="chat-mic-denied">
                ⚠️ Microphone access denied. Please allow microphone in browser settings, or type your response below.
              </div>
            )}

            {hasStarted && (
              <div className="chat-status-label">
                {isListening ? (
                  <span className="recording">🔴 Recording... tap to stop</span>
                ) : !isProcessing ? (
                  <span className="tap-hint">Tap to speak</span>
                ) : null}
              </div>
            )}

            <div className="chat-input-row">
              <button
                className={`chat-mic-btn ${isListening ? "recording" : ""}`}
                onClick={toggleListening}
                disabled={isProcessing || !hasStarted}
                title={isListening ? "Stop recording" : "Tap to speak"}
              >
                {isListening && (
                  <>
                    <span className="pulse-ring-el" />
                    <span className="pulse-ring-el" style={{ animationDelay: "0.5s" }} />
                  </>
                )}
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ position: "relative", zIndex: 2 }}>
                  {isListening ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                  )}
                </svg>
              </button>

              <textarea
                ref={inputRef}
                className="chat-textarea"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={handleChatBoxFocus}
                placeholder={isListening ? "Listening... speak now" : hasStarted ? "Type your response here..." : "Conversation will start automatically..."}
                rows={1}
                disabled={!hasStarted}
                onInput={(e) => { e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 96) + "px"; }}
              />

              <button
                className={`chat-send-btn ${inputText.trim() ? "active" : "inactive"}`}
                onClick={handleSend}
                disabled={!inputText.trim() || isProcessing || !hasStarted}
                title="Send message"
              >
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {hasStarted && chatBot.isComplete && (
          <button className="chat-restart" onClick={handleNewFIR}>
            ↻ File Another FIR
          </button>
        )}
      </div>
    </section>
  );
}


function ChatBubble({ message, onSpeak }) {
  const ref = useRef(null);
  const isBot = message.role === "assistant";

  useEffect(() => {
    gsap.fromTo(ref.current, { opacity: 0, y: 10, scale: 0.98 }, { opacity: 1, y: 0, scale: 1, duration: 0.35, ease: "power2.out" });
  }, []);

  return (
    <div ref={ref} className={`chat-bubble-row ${isBot ? "bot" : "user"}`}>
      <div className={`chat-avatar ${isBot ? "bot" : "user"}`}>
        {isBot ? (
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5" />
          </svg>
        ) : (
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
        )}
      </div>
      <div className="chat-bubble-wrap">
        <div className={`chat-bubble ${isBot ? "bot" : "user"}`}>
          {message.content}
        </div>
        {isBot && (
          <button className="chat-listen-btn" onClick={onSpeak} title="Read aloud">
            🔊 Listen
          </button>
        )}
      </div>
    </div>
  );
}
