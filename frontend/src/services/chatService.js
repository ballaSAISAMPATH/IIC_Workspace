// AI Chat Service — local simulation (replace with backend API in production)

class FIRChatBot {
  constructor() {
    this.reset();
  }

  reset() {
    this.collectedInfo = {};
    this.conversationHistory = [];
    this.questionIndex = 0;
    this.isComplete = false;
    this.language = "en-US";
  }

  setLanguage(lang) {
    this.language = lang;
  }

  _getQuestions() {
    return [
      {
        key: "complainantName",
        question: "Hello! I'm here to help you file an FIR. I'll guide you through the process step by step. Could you please tell me your full name?",
      },
      {
        key: "complainantAddress",
        question: "Thank you. Could you please provide your complete address?",
      },
      {
        key: "complainantPhone",
        question: "What is your phone number?",
      },
      {
        key: "incidentDate",
        question: "When did the incident happen? Please provide the date.",
      },
      {
        key: "incidentTime",
        question: "What time did the incident occur?",
      },
      {
        key: "incidentLocation",
        question: "Where did the incident take place? Please provide the full location.",
      },
      {
        key: "incidentDescription",
        question: "Please describe in detail what happened. Take your time.",
      },
      {
        key: "accusedDescription",
        question: "Can you describe the accused? If unknown, say 'unknown'.",
      },
      {
        key: "witnessDetails",
        question: "Were there any witnesses? If none, say 'none'.",
      },
      {
        key: "evidenceDetails",
        question: "Do you have any evidence? Photos, videos, documents? If none, say 'none'.",
      },
    ];
  }

  getGreeting() {
    const questions = this._getQuestions();
    const q = questions[0].question;
    this.questionIndex = 1;
    this.conversationHistory.push({ role: "assistant", content: q });
    return { message: q, firReport: null, isComplete: false };
  }

  getNextResponse(userMessage) {
    this.conversationHistory.push({ role: "user", content: userMessage });

    const questions = this._getQuestions();

    // Store previous answer
    if (this.questionIndex > 0 && this.questionIndex <= questions.length) {
      const prevQ = questions[this.questionIndex - 1];
      this.collectedInfo[prevQ.key] = userMessage;
    }

    // All done?
    if (this.questionIndex >= questions.length) {
      this.isComplete = true;
      return this._generateFIR();
    }

    const nextQ = questions[this.questionIndex];
    this.questionIndex++;
    this.conversationHistory.push({ role: "assistant", content: nextQ.question });

    return { message: nextQ.question, firReport: null, isComplete: false };
  }

  _generateFIR() {
    const now = new Date();
    const firNumber = `FIR-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`;

    const report = {
      firNumber,
      filingDate: now.toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" }),
      filingTime: now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      ...this.collectedInfo,
    };

    const msg = "Thank you for providing all the details. Your FIR report is ready. Please review it below.";

    this.conversationHistory.push({ role: "assistant", content: msg });
    return { message: msg, firReport: report, isComplete: true };
  }
}

export const chatBot = new FIRChatBot();
export default FIRChatBot;
