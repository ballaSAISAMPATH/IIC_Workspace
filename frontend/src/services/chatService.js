// src/services/chatService.js
// Single-paragraph input → POST to /FIR_filing API → structured IF1 report

const API_URL = "http://127.0.0.1:8000/FIR_filing";

const GREETING = {
  "en-US": "Hello! I'm your FIR filing assistant. Please describe the incident in your own words — include what happened, when, where, who was involved, and any other details you remember. You can speak or type freely.",
  "en-IN": "Hello! I'm your FIR filing assistant. Please describe the incident in your own words — include what happened, when, where, who was involved, and any other details you remember. You can speak or type freely.",
  "te-IN": "నమస్కారం! నేను మీ FIR దాఖలు సహాయకుడిని. దయచేసి జరిగిన సంఘటనను మీ సొంత మాటల్లో వివరించండి — ఏమి జరిగిందో, ఎప్పుడు, ఎక్కడ, ఎవరు పాల్గొన్నారో చెప్పండి.",
  "hi-IN": "नमस्ते! मैं आपका FIR दर्ज करने का सहायक हूँ। कृपया घटना को अपने शब्दों में बताएं — क्या हुआ, कब, कहाँ, कौन शामिल था — सब कुछ बताएं।",
  "ta-IN": "வணக்கம்! நான் உங்கள் FIR தாக்கல் உதவியாளர். நடந்த சம்பவத்தை உங்கள் சொந்த வார்த்தைகளில் விவரிக்கவும்.",
  "kn-IN": "ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ FIR ಸಲ್ಲಿಕೆ ಸಹಾಯಕ. ದಯವಿಟ್ಟು ಘಟನೆಯನ್ನು ನಿಮ್ಮ ಸ್ವಂತ ಮಾತುಗಳಲ್ಲಿ ವಿವರಿಸಿ.",
};

const PROCESSING_MSG = {
  "en-US": "Thank you. I'm processing your statement and generating your FIR report...",
  "en-IN": "Thank you. I'm processing your statement and generating your FIR report...",
  "te-IN": "ధన్యవాదాలు. మీ వివరణను ప్రాసెస్ చేస్తున్నాను మరియు FIR నివేదికను రూపొందిస్తున్నాను...",
  "hi-IN": "धन्यवाद। मैं आपका बयान प्रोसेस कर रहा हूँ और FIR रिपोर्ट बना रहा हूँ...",
  "ta-IN": "நன்றி. உங்கள் அறிக்கையை செயலாக்கி FIR அறிக்கையை உருவாக்குகிறேன்...",
  "kn-IN": "ಧನ್ಯವಾದ. ನಿಮ್ಮ ಹೇಳಿಕೆಯನ್ನು ಪ್ರಕ್ರಿಯೆಗೊಳಿಸಿ FIR ವರದಿಯನ್ನು ರಚಿಸುತ್ತಿದ್ದೇನೆ...",
};

const ERROR_MSG = {
  "en-US": "I'm sorry, there was an error processing your report. Please try again.",
  "en-IN": "I'm sorry, there was an error processing your report. Please try again.",
  "te-IN": "క్షమించండి, మీ నివేదికను ప్రాసెస్ చేయడంలో లోపం ఉంది. దయచేసి మళ్ళీ ప్రయత్నించండి.",
  "hi-IN": "क्षमा करें, रिपोर्ट प्रोसेस करने में त्रुटि हुई। कृपया पुनः प्रयास करें।",
  "ta-IN": "மன்னிக்கவும், உங்கள் அறிக்கையை செயலாக்குவதில் பிழை. மீண்டும் முயற்சிக்கவும்.",
  "kn-IN": "ಕ್ಷಮಿಸಿ, ನಿಮ್ಮ ವರದಿಯನ್ನು ಪ್ರಕ್ರಿಯೆಗೊಳಿಸುವಲ್ಲಿ ದೋಷ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
};

function generateFIRNumber() {
  const date = new Date();
  const year = date.getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `FIR-${year}-${rand}`;
}

function formatDate(d = new Date()) {
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatTime(d = new Date()) {
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

class ChatBot {
  constructor() {
    this.reset();
  }

  reset() {
    this._language = "en-US";
    this._awaiting = "statement"; // 'statement' | 'done'
    this.isComplete = false;
    this._firReport = null;
  }

  setLanguage(lang) {
    this._language = lang;
  }

  getGreeting() {
    return {
      message: GREETING[this._language] || GREETING["en-US"],
    };
  }

  // Called by ChatSection after user submits their paragraph
  // Returns { message, firReport } — firReport is null until API responds
  async getNextResponse(userText) {
    if (this._awaiting !== "statement") {
      return { message: "Your FIR has already been generated. Please start a new FIR to file another.", firReport: this._firReport };
    }

    // Tell user we're processing
    const processingMsg = PROCESSING_MSG[this._language] || PROCESSING_MSG["en-US"];

    try {
      const firReport = await this._callAPI(userText);
      this._firReport = firReport;
      this._awaiting = "done";
      this.isComplete = true;

      const successMsg =
        this._language === "te-IN"
          ? `మీ FIR విజయవంతంగా నమోదు చేయబడింది. FIR నంబర్: ${firReport.firNumber}`
          : this._language === "hi-IN"
          ? `आपकी FIR सफलतापूर्वक दर्ज की गई। FIR नंबर: ${firReport.firNumber}`
          : `Your FIR has been successfully generated. FIR Number: ${firReport.firNumber}. Please review the report below and download or print it.`;

      return { message: successMsg, firReport };
    } catch (err) {
      console.error("FIR API error:", err);
      const errMsg = ERROR_MSG[this._language] || ERROR_MSG["en-US"];
      return { message: errMsg, firReport: null };
    }
  }

  async _callAPI(statement) {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statement }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const json = await response.json();
    console.log("API response:", json);

    // Response is nested under json.message
    const d = json.message;
    const now = new Date();

    // ── Acts & Sections array → flat fields ──
    const acts = Array.isArray(d.acts_and_sections) ? d.acts_and_sections : [];
    const act1      = acts[0]?.act_name || "";
    const sections1 = acts[0]?.sections?.join(", ") || "";
    const act2      = acts[1]?.act_name || "";
    const sections2 = acts[1]?.sections?.join(", ") || "";
    const act3      = acts[2]?.act_name || "";
    const sections3 = acts[2]?.sections?.join(", ") || "";
    // Any extra acts beyond index 2 go into otherActs
    const otherActs = acts.slice(3).map(a => `${a.act_name} s.${a.sections?.join(", ")}`).join("; ")
                      || d.other_acts_and_sections
                      || "";

    // ── Accused list array → readable string ──
    const accusedDetails = Array.isArray(d.accused_list)
      ? d.accused_list.map((a, i) => {
          const parts = [];
          parts.push(`Accused ${i + 1}:`);
          parts.push(`Name: ${a.name || "Unknown"}`);
          parts.push(`Status: ${a.known_status || "unknown"}`);
          if (a.address)     parts.push(`Address: ${a.address}`);
          if (a.description) parts.push(`Description: ${a.description}`);
          return parts.join(" | ");
        }).join("\n")
      : "";

    // ── Property details array → readable string ──
    const propertiesStolen = Array.isArray(d.property_details)
      ? d.property_details.map((p, i) => {
          const parts = [`Item ${i + 1}: ${p.description || "—"}`];
          if (p.quantity)           parts.push(`Qty: ${p.quantity}`);
          if (p.value)              parts.push(`Value: ${p.value}`);
          if (p.identification_marks) parts.push(`ID Marks: ${p.identification_marks}`);
          return parts.join(" | ");
        }).join("\n")
      : "";

    return {
      firNumber:        d.fir_number                  || generateFIRNumber(),
      filingDate:       d.fir_date                    || formatDate(now),
      filingTime:       d.information_received_time   || formatTime(now),

      // Item 1
      district:         d.district                    || "",
      policeStation:    d.police_station              || "",
      year:             d.year                        || String(now.getFullYear()),

      // Item 2 — Acts & Sections
      act1, sections1,
      act2, sections2,
      act3, sections3,
      otherActs,

      // Item 3 — Occurrence (backend doesn't return occurrence date separately,
      // so we fall back to fir_date)
      occurrenceDay:    d.occurrence_day              || "",
      occurrenceDate:   d.occurrence_date             || d.fir_date || "",
      occurrenceTime:   d.occurrence_time             || "",
      infoReceivedDate: d.information_received_date   || formatDate(now),
      infoReceivedTime: d.information_received_time   || formatTime(now),
      gdEntryNo:        d.general_diary_entry_numbers || "",
      gdEntryTime:      d.general_diary_time          || "",

      // Item 4
      infoType:         d.info_type                   || "Oral",

      // Item 5 — Place
      directionDistance: d.distance_and_direction_from_ps || "",
      beatNo:            d.beat_no                    || "",
      placeAddress:      d.place_address              || d.complainant_address || "",
      outsidePS:         d.outside_ps                 || "",
      outsideDistrict:   d.outside_district           || "",

      // Item 6 — Complainant
      complainantName:      d.complainant_name        || "",
      fatherHusbandName:    d.father_husband_name     || "",
      complainantDOB:       d.complainant_dob         || "",
      nationality:          d.nationality             || "Indian",
      passportNo:           d.passport_no             || "",
      passportIssueDate:    d.passport_issue_date     || "",
      passportIssuePlace:   d.passport_issue_place    || "",
      occupation:           d.occupation              || "",
      complainantAddress:   d.complainant_address     || "",
      complainantPhone:     d.complainant_phone       || "",

      // Item 7 — Accused
      accusedDetails,

      // Item 8 — Delay reason
      delayReason:          d.delay_in_reporting_reason || "No delay",

      // Item 9 & 10 — Properties
      propertiesStolen,
      totalPropertyValue:   d.total_property_value    || "",

      // Item 11
      inquestReport:        d.inquest_report          || "",

      // Item 12 — Full narrative
      firContents:          d.fir_contents            || statement,
    };
  }
}

export const chatBot = new ChatBot();