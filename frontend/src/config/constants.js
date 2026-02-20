// src/config/constants.js

export const LANGUAGES = [
  { code: "en-US",  label: "English (US)",    shortLabel: "EN" },
  { code: "en-IN",  label: "English (India)",  shortLabel: "EN-IN" },
  { code: "te-IN",  label: "Telugu",           shortLabel: "తెలుగు" },
  { code: "hi-IN",  label: "Hindi",            shortLabel: "हिंदी" },
  { code: "ta-IN",  label: "Tamil",            shortLabel: "தமிழ்" },
  { code: "kn-IN",  label: "Kannada",          shortLabel: "ಕನ್ನಡ" },
];

export const FIR_SECTION_LABELS = {
  // Header
  firNumber:            "FIR No.",
  filingDate:           "Date",
  filingTime:           "Time",

  // Item 1
  district:             "District",
  policeStation:        "P.S.",
  year:                 "Year",

  // Item 2
  act1:                 "Act (i)",
  sections1:            "Sections (i)",
  act2:                 "Act (ii)",
  sections2:            "Sections (ii)",
  act3:                 "Act (iii)",
  sections3:            "Sections (iii)",
  otherActs:            "Other Acts & Sections (iv)",

  // Item 3
  occurrenceDay:        "Day of Occurrence",
  occurrenceDate:       "Date of Occurrence",
  occurrenceTime:       "Time of Occurrence",
  infoReceivedDate:     "Information Received at P.S. — Date",
  infoReceivedTime:     "Information Received at P.S. — Time",
  gdEntryNo:            "General Diary Entry No.",
  gdEntryTime:          "G.D. Entry Time",

  // Item 4
  infoType:             "Type of Information",

  // Item 5
  directionDistance:    "Direction & Distance from P.S.",
  beatNo:               "Beat No.",
  placeAddress:         "Place of Occurrence — Address",
  outsidePS:            "Outside P.S. Name (if applicable)",
  outsideDistrict:      "Outside District (if applicable)",

  // Item 6 — Complainant
  complainantName:      "Complainant Name",
  fatherHusbandName:    "Father's / Husband's Name",
  complainantDOB:       "Date / Year of Birth",
  nationality:          "Nationality",
  passportNo:           "Passport No.",
  passportIssueDate:    "Passport Date of Issue",
  passportIssuePlace:   "Passport Place of Issue",
  occupation:           "Occupation",
  complainantAddress:   "Complainant Address",
  complainantPhone:     "Phone",

  // Item 7
  accusedDetails:       "Details of Known / Suspected / Unknown Accused",

  // Item 8
  delayReason:          "Reasons for Delay in Reporting",

  // Item 9 & 10
  propertiesStolen:     "Particulars of Properties Stolen / Involved",
  totalPropertyValue:   "Total Value of Properties Stolen / Involved",

  // Item 11
  inquestReport:        "Inquest Report / U.D. Case No.",

  // Item 12
  firContents:          "F.I.R. Contents",
};
