// Application-wide constants and configuration

export const APP_NAME = "FIR";
export const APP_FULL_NAME = "File It Responsibly";

// STT: Using Web Speech API (browser-native, free, supports Telugu)
// For production, you'd use Whisper API or Google Cloud Speech-to-Text

// TTS: Using Web Speech API (browser-native, free)

export const LANGUAGES = [
  { code: "en-US", label: "English", shortLabel: "EN" },
];

export const FIR_SECTIONS = [
  "complainantName",
  "complainantAddress",
  "complainantPhone",
  "incidentDate",
  "incidentTime",
  "incidentLocation",
  "incidentDescription",
  "accusedDescription",
  "witnessDetails",
  "evidenceDetails",
];

export const FIR_SECTION_LABELS = {
  complainantName: "Complainant Name",
  complainantAddress: "Complainant Address",
  complainantPhone: "Complainant Phone",
  incidentDate: "Date of Incident",
  incidentTime: "Time of Incident",
  incidentLocation: "Location of Incident",
  incidentDescription: "Description of Incident",
  accusedDescription: "Description of Accused",
  witnessDetails: "Witness Details",
  evidenceDetails: "Evidence Details",
};

// System prompt for the FIR chatbot
export const SYSTEM_PROMPT = `You are an AI assistant helping to file a First Information Report (FIR). Your job is to collect all necessary information from the complainant in a conversational, empathetic manner.

You need to collect the following information:
1. Complainant's full name
2. Complainant's address
3. Complainant's phone number
4. Date of the incident
5. Time of the incident
6. Location/place of the incident
7. Detailed description of what happened
8. Description of the accused (if known)
9. Witness details (if any)
10. Evidence details (if any)

Guidelines:
- Ask ONE question at a time
- Be empathetic and professional
- If the user provides multiple pieces of information at once, acknowledge all of them
- After collecting all information, generate a structured FIR report
- When you have ALL the required information, respond with the FIR report in a SPECIFIC JSON format

When you have enough information to generate the FIR, your response MUST include a JSON block wrapped in \`\`\`json ... \`\`\` with this structure:
{
  "firReport": {
    "complainantName": "...",
    "complainantAddress": "...",
    "complainantPhone": "...",
    "incidentDate": "...",
    "incidentTime": "...",
    "incidentLocation": "...",
    "incidentDescription": "...",
    "accusedDescription": "...",
    "witnessDetails": "...",
    "evidenceDetails": "..."
  }
}

Start by greeting the user and asking for their name.`;
