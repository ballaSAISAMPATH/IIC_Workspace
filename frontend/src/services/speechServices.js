// Speech-to-Text using Web Speech API (free, works in Chrome/Edge, supports Telugu)

export class SpeechToTextService {
  constructor() {
    this.recognition = null;
    this.isListening = false;
    this.onResult = null;
    this.onInterim = null;
    this.onError = null;
    this.onEnd = null;
    this.onStart = null;
    this.language = "en-US"; // Default English
    this._restarting = false;
  }

  isSupported() {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  init(language) {
    if (!this.isSupported()) {
      console.error("Speech Recognition not supported.");
      return false;
    }

    // Destroy old instance if any
    if (this.recognition) {
      try { this.recognition.abort(); } catch (_e) { /* ignore */ }
      this.recognition = null;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false; // single utterance — more reliable
    this.recognition.interimResults = true;
    this.recognition.maxAlternatives = 1;
    this.language = language || this.language;
    this.recognition.lang = this.language;

    this.recognition.onstart = () => {
      this.isListening = true;
      if (this.onStart) this.onStart();
    };

    this.recognition.onresult = (event) => {
      let interimTranscript = "";
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }
      if (finalTranscript && this.onResult) this.onResult(finalTranscript.trim());
      if (interimTranscript && this.onInterim) this.onInterim(interimTranscript);
    };

    this.recognition.onerror = (event) => {
      // "no-speech" and "aborted" are not real errors for UX
      if (event.error === "no-speech" || event.error === "aborted") {
        this.isListening = false;
        if (this.onEnd) this.onEnd();
        return;
      }
      console.error("STT error:", event.error);
      this.isListening = false;
      if (this.onError) this.onError(event.error);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      if (this.onEnd) this.onEnd();
    };

    return true;
  }

  start() {
    // Always create a fresh instance — avoids "already started" bugs
    this.init(this.language);
    if (!this.recognition) return false;
    try {
      this.recognition.start();
      return true;
    } catch (err) {
      console.error("Failed to start STT:", err);
      return false;
    }
  }

  stop() {
    if (this.recognition) {
      try { this.recognition.stop(); } catch (_e) { /* ignore */ }
      this.isListening = false;
    }
  }

  setLanguage(lang) {
    this.language = lang;
  }

  destroy() {
    this.stop();
    this.recognition = null;
  }
}

// Text-to-Speech — more natural settings
export class TextToSpeechService {
  constructor() {
    this.synth = window.speechSynthesis;
    this.currentUtterance = null;
    this.language = "en-US"; // Default English
    this.rate = 0.92; // Slightly slower = more natural
    this.pitch = 1.05;
    this.isSpeaking = false;
    this._voicesLoaded = false;

    // Pre-load voices (Chrome loads them async)
    if (this.synth) {
      this.synth.onvoiceschanged = () => { this._voicesLoaded = true; };
      this.synth.getVoices(); // trigger load
    }
  }

  isSupported() {
    return !!window.speechSynthesis;
  }

  getVoices() {
    return this.synth ? this.synth.getVoices() : [];
  }

  getBestVoice(lang) {
    const voices = this.getVoices();
    // Prefer Google / natural voices
    const preferred = voices.filter(v => v.lang === lang);
    const google = preferred.find(v => v.name.toLowerCase().includes("google"));
    if (google) return google;
    // Fallback: any voice that matches lang
    if (preferred.length) return preferred[0];
    // Partial match
    const prefix = lang.split("-")[0];
    const partial = voices.find(v => v.lang.startsWith(prefix));
    return partial || null;
  }

  speak(text, language) {
    return new Promise((resolve) => {
      if (!this.isSupported() || !text) { resolve(); return; }
      this.stop();

      const utterance = new SpeechSynthesisUtterance(text);
      const lang = language || this.language;
      utterance.lang = lang;
      utterance.rate = this.rate;
      utterance.pitch = this.pitch;
      utterance.volume = 1;

      const voice = this.getBestVoice(lang);
      if (voice) utterance.voice = voice;

      utterance.onend = () => { this.isSpeaking = false; this.currentUtterance = null; resolve(); };
      utterance.onerror = () => { this.isSpeaking = false; this.currentUtterance = null; resolve(); };

      this.currentUtterance = utterance;
      this.isSpeaking = true;

      // Chrome bug: synth sometimes pauses forever — workaround
      const resumeInterval = setInterval(() => {
        if (!this.synth.speaking) { clearInterval(resumeInterval); return; }
        this.synth.pause();
        this.synth.resume();
      }, 10000);

      utterance.onend = () => { clearInterval(resumeInterval); this.isSpeaking = false; this.currentUtterance = null; resolve(); };
      utterance.onerror = () => { clearInterval(resumeInterval); this.isSpeaking = false; this.currentUtterance = null; resolve(); };

      this.synth.speak(utterance);
    });
  }

  stop() {
    if (this.synth && this.synth.speaking) this.synth.cancel();
    this.isSpeaking = false;
    this.currentUtterance = null;
  }

  setLanguage(lang) { this.language = lang; }
  setRate(r) { this.rate = r; }
}

export const sttService = new SpeechToTextService();
export const ttsService = new TextToSpeechService();
