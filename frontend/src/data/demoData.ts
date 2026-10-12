import { Scheme } from "@/types/scheme";
import { UserProfile, InterviewQuestion } from "@/types/profile";
import { CitizenDocument, DocumentReadinessStats } from "@/types/document";
import { ActionPlanStep, ApplicationDraft } from "@/types/application";

export const initialProfile: UserProfile = {
  name: "Aditi Lagad",
  occupation: "Student",
  age: 21,
  state: "Maharashtra",
  district: "Nashik",
  annualIncome: "< 1 Lakh",
  incomeNumeric: 95000,
  education: "B.E. (Final Year)",
  category: "General",
  fatherName: "Santosh Lagad",
  dateOfBirth: "12-05-2005",
  completenessPercent: 90,
  language: "en",
};

export const demoSchemes: Scheme[] = [
  {
    id: "pm-vidyalakshmi",
    name: "PM Vidyalakshmi Scheme",
    shortDescription: "Education loan for higher studies",
    description: "A single window electronic platform for students seeking education loans and scholarships. Covers course fees, living expenses, and tuition assistance for higher technical education.",
    category: "Education",
    department: "Ministry of Education",
    level: "Central Scheme",
    eligibilityStatus: "eligible",
    matchScore: 100,
    benefit: "Up to ₹6.5 Lakh",
    officialUrl: "https://www.vidyalakshmi.co.in",
    lastVerifiedDate: "01 Oct 2026",
    priority: "High Priority",
    criteria: [
      { id: "c1", name: "Age Limit", condition: "18 – 30 years", userValue: "21 years", passed: true },
      { id: "c2", name: "Annual Family Income", condition: "≤ 8 Lakh", userValue: "< 1 Lakh", passed: true },
      { id: "c3", name: "Education", condition: "12th Pass", userValue: "B.E. (Final Year)", passed: true },
      { id: "c4", name: "Other Criteria", condition: "Indian Citizen", userValue: "Indian Citizen", passed: true },
    ],
    requiredDocuments: ["Aadhaar Card", "Income Certificate", "Education Certificate", "Bank Passbook", "Photo"]
  },
  {
    id: "post-matric-scholarship",
    name: "Post Matric Scholarship (State Govt.)",
    shortDescription: "Financial support for students",
    description: "Financial assistance provided by the Maharashtra Government to students studying in post-matriculation courses, covering tuition fee reimbursement and exam fees.",
    category: "Education",
    department: "Dept. of Higher & Technical Education",
    level: "State Scheme",
    eligibilityStatus: "eligible",
    matchScore: 90,
    benefit: "₹5,000 – ₹20,000",
    officialUrl: "https://mahadbt.maharashtra.gov.in",
    lastVerifiedDate: "15 Sep 2026",
    priority: "High Priority",
    criteria: [
      { id: "c1", name: "Age Limit", condition: "17 – 25 years", userValue: "21 years", passed: true },
      { id: "c2", name: "Annual Family Income", condition: "≤ 2.5 Lakh", userValue: "< 1 Lakh", passed: true },
      { id: "c3", name: "Education", condition: "Post-Matric / Degree", userValue: "B.E. (Final Year)", passed: true },
      { id: "c4", name: "Domicile", condition: "Maharashtra Resident", userValue: "Maharashtra", passed: true },
    ],
    requiredDocuments: ["Aadhaar Card", "Income Certificate", "Education Certificate", "Bank Passbook", "Photo"]
  },
  {
    id: "skill-india-training",
    name: "Skill India — Training Program",
    shortDescription: "Skill development & certification",
    description: "Flagship scheme under PMKVY for skill development training, soft-skills enhancement, and NSQF accredited industry certification with placement support.",
    category: "Skill Development",
    department: "Ministry of Skill Development & Entrepreneurship",
    level: "Central Scheme",
    eligibilityStatus: "almost",
    matchScore: 75,
    benefit: "Free Training + Certificate",
    officialUrl: "https://www.skillindia.gov.in",
    lastVerifiedDate: "28 Sep 2026",
    priority: "Medium Priority",
    criteria: [
      { id: "c1", name: "Age Limit", condition: "18 – 35 years", userValue: "21 years", passed: true },
      { id: "c2", name: "Education", condition: "10th / 12th Pass", userValue: "B.E. (Final Year)", passed: true },
      { id: "c3", name: "Training Center", condition: "Enrolled in Approved Center", userValue: "Pending Center Selection", passed: false },
    ],
    requiredDocuments: ["Aadhaar Card", "Education Certificate", "Photo"]
  },
  {
    id: "mjp-jan-arogya",
    name: "Mahatma Jyotiba Phule Yojana",
    shortDescription: "Support for higher education",
    description: "State assistance and welfare scheme providing specialized education subsidy and financial coverage for selected categories.",
    category: "Education",
    department: "Govt. of Maharashtra",
    level: "State Scheme",
    eligibilityStatus: "ineligible",
    ineligibleReason: "Income limit exceeded",
    matchScore: 40,
    benefit: "Annual Subsidy",
    officialUrl: "https://www.jeevandayee.gov.in",
    lastVerifiedDate: "05 Oct 2026",
    criteria: [
      { id: "c1", name: "Annual Family Income", condition: "BPL / Antyodaya Card", userValue: "General Category (< 1 Lakh)", passed: false },
      { id: "c2", name: "Domicile", condition: "Maharashtra", userValue: "Maharashtra", passed: true },
    ],
    requiredDocuments: ["Aadhaar Card", "Ration Card"]
  },
  {
    id: "naps-apprenticeship",
    name: "National Apprenticeship Promotion Scheme (NAPS)",
    shortDescription: "Industrial training stipend & job placement",
    description: "Government-backed stipend sharing for graduate engineers and diploma holders in leading industrial establishments.",
    category: "Employment",
    department: "Ministry of Skill Development",
    level: "Central Scheme",
    eligibilityStatus: "eligible",
    matchScore: 92,
    benefit: "₹9,000 / month stipend",
    officialUrl: "https://www.apprenticeshipindia.gov.in",
    lastVerifiedDate: "12 Oct 2026",
    priority: "High Priority",
    criteria: [
      { id: "c1", name: "Age Limit", condition: "18 – 28 years", userValue: "21 years", passed: true },
      { id: "c2", name: "Degree", condition: "Diploma / Degree pursuing", userValue: "B.E. (Final Year)", passed: true },
    ],
    requiredDocuments: ["Aadhaar Card", "Education Certificate", "Bank Passbook"]
  },
  {
    id: "pm-internship-scheme",
    name: "PM Internship Scheme in Top 500 Companies",
    shortDescription: "12-month corporate internship with monthly allowance",
    description: "Provides youth with valuable real-world business exposure in top Indian enterprises with financial support.",
    category: "Employment",
    department: "Ministry of Corporate Affairs",
    level: "Central Scheme",
    eligibilityStatus: "eligible",
    matchScore: 88,
    benefit: "₹5,000/mo + ₹6,000 grant",
    officialUrl: "https://pminternship.mca.gov.in",
    lastVerifiedDate: "10 Oct 2026",
    criteria: [
      { id: "c1", name: "Age Limit", condition: "21 – 24 years", userValue: "21 years", passed: true },
      { id: "c2", name: "Family Income", condition: "≤ 8 Lakh", userValue: "< 1 Lakh", passed: true },
    ],
    requiredDocuments: ["Aadhaar Card", "Education Certificate", "Bank Passbook", "Photo"]
  },
  {
    id: "digital-india-internship",
    name: "Digital India Internship Scheme",
    shortDescription: "Exposure to e-Governance & IT policies",
    description: "Internship program by MeitY offering hands-on exposure to policy and tech development in e-Governance.",
    category: "Education",
    department: "Ministry of Electronics & IT",
    level: "Central Scheme",
    eligibilityStatus: "eligible",
    matchScore: 85,
    benefit: "₹10,000 / month",
    officialUrl: "https://meity.gov.in",
    lastVerifiedDate: "20 Sep 2026",
    criteria: [
      { id: "c1", name: "Education", condition: "B.E./B.Tech/MCA 60%+", userValue: "B.E. (Final Year)", passed: true },
    ],
    requiredDocuments: ["Aadhaar Card", "Education Certificate", "Photo"]
  },
  {
    id: "ai-for-india-upskill",
    name: "FutureSkills Prime AI Certification",
    shortDescription: "Government subsidized AI/ML skilling",
    description: "MeitY and NASSCOM joint initiative offering government subsidized emerging technology skills courses.",
    category: "Skill Development",
    department: "MeitY & NASSCOM",
    level: "Central Scheme",
    eligibilityStatus: "eligible",
    matchScore: 82,
    benefit: "50% course fee cashback",
    officialUrl: "https://futureskillsprime.in",
    lastVerifiedDate: "02 Oct 2026",
    criteria: [
      { id: "c1", name: "Education", condition: "Engineering / Science graduate", userValue: "B.E. (Final Year)", passed: true },
    ],
    requiredDocuments: ["Aadhaar Card", "Education Certificate"]
  },
  {
    id: "pm-yuva-entrepreneurship",
    name: "PM-YUVA Entrepreneurship Scheme",
    shortDescription: "Seed grant and mentorship for young innovators",
    description: "Mentorship and incubator access for student founders building technology and community solutions.",
    category: "Others",
    department: "Ministry of Skill Development",
    level: "Central Scheme",
    eligibilityStatus: "almost",
    matchScore: 68,
    benefit: "Up to ₹3 Lakh seed funding",
    officialUrl: "https://msde.gov.in",
    lastVerifiedDate: "14 Sep 2026",
    criteria: [
      { id: "c1", name: "Age Limit", condition: "18 – 30 years", userValue: "21 years", passed: true },
      { id: "c2", name: "Project Proposal", condition: "Approved Prototype", userValue: "Pending Prototype Submission", passed: false },
    ],
    requiredDocuments: ["Aadhaar Card", "Project Report", "Bank Passbook"]
  },
  {
    id: "swayam-prabha-scholars",
    name: "SWAYAM Plus Higher Education Grant",
    shortDescription: "Free credit transfer courses and exam fee waivers",
    description: "Online education platform with UGC-recognized academic credit transfer and subsidized proctored exam fees.",
    category: "Education",
    department: "Ministry of Education",
    level: "Central Scheme",
    eligibilityStatus: "almost",
    matchScore: 65,
    benefit: "100% exam fee waiver",
    officialUrl: "https://swayam.gov.in",
    lastVerifiedDate: "18 Sep 2026",
    criteria: [
      { id: "c1", name: "College Enrollment", condition: "Valid Student ID", userValue: "B.E. Final Year", passed: true },
      { id: "c2", name: "Course Completion", condition: "75% assignment score", userValue: "In progress", passed: false },
    ],
    requiredDocuments: ["College ID", "Aadhaar Card"]
  },
  {
    id: "pm-kisan-samman",
    name: "PM Kisan Samman Nidhi",
    shortDescription: "Income support for small & marginal landholders",
    description: "Direct benefit transfer of ₹6,000 annually to agricultural landholding farmer families.",
    category: "Others",
    department: "Ministry of Agriculture",
    level: "Central Scheme",
    eligibilityStatus: "ineligible",
    ineligibleReason: "Applicant does not own agricultural land",
    matchScore: 20,
    benefit: "₹6,000 / year",
    officialUrl: "https://pmkisan.gov.in",
    lastVerifiedDate: "01 Oct 2026",
    criteria: [
      { id: "c1", name: "Land Ownership", condition: "Registered Land Holder", userValue: "Non-agricultural student", passed: false },
    ],
    requiredDocuments: ["Land Records (7/12)", "Aadhaar Card"]
  },
  {
    id: "pm-svanidhi",
    name: "PM SVANidhi Micro-Credit",
    shortDescription: "Working capital loan for urban street vendors",
    description: "Collateral-free working capital micro-loans with interest subsidies for micro vendors.",
    category: "Others",
    department: "Ministry of Housing & Urban Affairs",
    level: "Central Scheme",
    eligibilityStatus: "ineligible",
    ineligibleReason: "Only for certified urban street vendors",
    matchScore: 15,
    benefit: "₹10,000 – ₹50,000 loan",
    officialUrl: "https://pmsvanidhi.mohua.gov.in",
    lastVerifiedDate: "25 Sep 2026",
    criteria: [
      { id: "c1", name: "Vending Certificate", condition: "Urban Local Body Vending Certificate", userValue: "Not a vendor", passed: false },
    ],
    requiredDocuments: ["Vending Certificate", "Aadhaar Card"]
  }
];

export const demoDocuments: CitizenDocument[] = [
  { id: "doc-1", name: "Aadhaar Card", type: "Identity Proof", status: "uploaded", fileName: "aadhaar_card.pdf", fileSize: "1.4 MB", uploadedAt: "Today, 10:30 AM", isRequiredFor: ["all"] },
  { id: "doc-2", name: "Income Certificate", type: "Financial Proof", status: "missing", isRequiredFor: ["pm-vidyalakshmi", "post-matric-scholarship"] },
  { id: "doc-3", name: "Education Certificate", type: "Academic Proof", status: "uploaded", fileName: "be_marksheet.pdf", fileSize: "2.1 MB", uploadedAt: "Yesterday", isRequiredFor: ["pm-vidyalakshmi", "skill-india-training"] },
  { id: "doc-4", name: "Bank Passbook", type: "Financial Proof", status: "missing", isRequiredFor: ["pm-vidyalakshmi", "post-matric-scholarship"] },
  { id: "doc-5", name: "Photo", type: "Identity Proof", status: "uploaded", fileName: "passport_photo.jpg", fileSize: "420 KB", uploadedAt: "Yesterday", isRequiredFor: ["all"] },
  { id: "doc-6", name: "Domicile Certificate", type: "Residence Proof", status: "uploaded", fileName: "domicile_certificate.pdf", fileSize: "980 KB", uploadedAt: "3 days ago", isRequiredFor: ["post-matric-scholarship"] },
  { id: "doc-7", name: "10th Marksheet", type: "Academic Proof", status: "uploaded", fileName: "ssc_certificate.pdf", fileSize: "1.1 MB", uploadedAt: "3 days ago", isRequiredFor: ["pm-vidyalakshmi"] },
  { id: "doc-8", name: "12th Marksheet", type: "Academic Proof", status: "uploaded", fileName: "hsc_certificate.pdf", fileSize: "1.2 MB", uploadedAt: "3 days ago", isRequiredFor: ["pm-vidyalakshmi"] },
  { id: "doc-9", name: "College ID Card", type: "Academic Proof", status: "uploaded", fileName: "college_id.jpg", fileSize: "650 KB", uploadedAt: "Last week", isRequiredFor: ["pm-vidyalakshmi"] },
];

export const demoActionPlanSteps: ActionPlanStep[] = [
  {
    stepNumber: 1,
    title: "Prepare Documents",
    statusText: "Aadhaar Card (Uploaded) · Income Certificate (missing)",
    actionLabel: "Upload Document",
    actionUrl: "/documents",
    badgeType: "alert",
    badgeText: "1 Missing"
  },
  {
    stepNumber: 2,
    title: "Apply on Official Portal",
    description: "Visit vidyalakshmi.co.in",
    actionLabel: "View Portal",
    actionUrl: "https://www.vidyalakshmi.co.in",
    badgeType: "neutral"
  },
  {
    stepNumber: 3,
    title: "Fill Application Form",
    description: "Use our pre-filled draft",
    actionLabel: "Download Draft",
    actionUrl: "/application-draft",
    badgeType: "neutral"
  },
  {
    stepNumber: 4,
    title: "Track Application",
    description: "Save your reference number",
    actionLabel: "Track Status",
    actionUrl: "/applications",
    badgeType: "neutral"
  }
];

export const demoApplicationDraft: ApplicationDraft = {
  id: "DRAFT-2026-VL-8941",
  schemeId: "pm-vidyalakshmi",
  schemeName: "PM Vidyalakshmi Scheme",
  applicantName: "Aditi Lagad",
  fatherName: "Santosh Lagad",
  dateOfBirth: "12-05-2005",
  education: "B.E. (Final Year)",
  familyIncome: "< 1 Lakh",
  state: "Maharashtra",
  district: "Nashik",
  status: "draft",
  createdAt: "11 Oct 2026",
};

export const demoCategoryDistribution = [
  { name: "Education", count: 5, fill: "#2563EB" },
  { name: "Skill Development", count: 3, fill: "#2DC6B1" },
  { name: "Employment", count: 2, fill: "#F59E0B" },
  { name: "Others", count: 2, fill: "#94A3B8" },
];

export const demoRecentActivities = [
  { id: "act-1", title: "Profile completed", timestamp: "2 hours ago", type: "profile" },
  { id: "act-2", title: "Viewed PM Vidyalakshmi Scheme", timestamp: "1 hour ago", type: "scheme" },
  { id: "act-3", title: "Uploaded Income Certificate", timestamp: "30 mins ago", type: "document" },
];

export const interviewQuestions: InterviewQuestion[] = [
  {
    id: "q_occupation",
    field: "occupation",
    prompt: {
      en: "Hello! I'm Yojana Hunter 👋 I'll ask you a few questions to understand your profile and find the best schemes for you. Let's start! What is your current occupation?",
      hi: "नमस्ते! मैं योजना हंटर हूँ 👋 मैं आपकी प्रोफ़ाइल समझकर आपके लिए सर्वोत्तम योजनाएं खोजने के लिए कुछ सवाल पूछूँगा। शुरू करते हैं! आपका वर्तमान व्यवसाय क्या है?",
      mr: "नमस्कार! मी योजना हंटर आहे 👋 तुमच्यासाठी योग्य सरकारी योजना शोधण्यासाठी मी काही सोपे प्रश्न विचारेन. सुरुवात करूया! तुमचा सध्याचा व्यवसाय काय आहे?"
    },
    options: [
      { label: { en: "I am a student", hi: "मैं एक छात्र हूँ", mr: "मी विद्यार्थी आहे" }, value: "Student" },
      { label: { en: "Farmer / Agriculture", hi: "किसान / कृषि", mr: "शेतकरी / कृषी" }, value: "Farmer" },
      { label: { en: "Self-Employed / Business", hi: "स्वरोजगार / व्यापार", mr: "स्वयंरोजगार / व्यवसाय" }, value: "Self-Employed" },
      { label: { en: "Job Seeker / Unemployed", hi: "नौकरी तलाशने वाला", mr: "नोकरी शोधणारा" }, value: "Job Seeker" },
    ]
  },
  {
    id: "q_income",
    field: "annualIncome",
    prompt: {
      en: "Great! What is your annual family income?",
      hi: "बहुत बढ़िया! आपकी वार्षिक पारिवारिक आय कितनी है?",
      mr: "छान! तुमच्या कुटुंबाचे वार्षिक उत्पन्न किती आहे?"
    },
    options: [
      { label: { en: "Less than 1 lakh", hi: "1 लाख से कम", mr: "1 लाखांपेक्षा कमी" }, value: "< 1 Lakh" },
      { label: { en: "1 – 3 lakh", hi: "1 – 3 लाख", mr: "1 – 3 लाख" }, value: "1 – 3 Lakh" },
      { label: { en: "3 – 5 lakh", hi: "3 – 5 लाख", mr: "3 – 5 लाख" }, value: "3 – 5 Lakh" },
      { label: { en: "More than 5 lakh", hi: "5 लाख से अधिक", mr: "5 लाखांपेक्षा जास्त" }, value: "> 5 Lakh" },
    ]
  },
  {
    id: "q_age",
    field: "age",
    prompt: {
      en: "What is your current age?",
      hi: "आपकी वर्तमान आयु कितनी है?",
      mr: "तुमचे सध्याचे वय किती आहे?"
    },
    options: [
      { label: { en: "18 – 21 years", hi: "18 – 21 वर्ष", mr: "18 – 21 वर्षे" }, value: "21" },
      { label: { en: "22 – 25 years", hi: "22 – 25 वर्ष", mr: "22 – 25 वर्षे" }, value: "24" },
      { label: { en: "26 – 35 years", hi: "26 – 35 वर्ष", mr: "26 – 35 वर्षे" }, value: "30" },
      { label: { en: "Above 35 years", hi: "35 वर्ष से अधिक", mr: "35 वर्षांपेक्षा जास्त" }, value: "38" },
    ]
  },
  {
    id: "q_state",
    field: "state",
    prompt: {
      en: "Which state are you residing in?",
      hi: "आप किस राज्य के निवासी हैं?",
      mr: "तुम्ही कोणत्या राज्यात राहता?"
    },
    options: [
      { label: { en: "Maharashtra", hi: "महाराष्ट्र", mr: "महाराष्ट्र" }, value: "Maharashtra" },
      { label: { en: "Uttar Pradesh", hi: "उत्तर प्रदेश", mr: "उत्तर प्रदेश" }, value: "Uttar Pradesh" },
      { label: { en: "Karnataka", hi: "कर्नाटक", mr: "कर्नाटक" }, value: "Karnataka" },
      { label: { en: "Other State", hi: "अन्य राज्य", mr: "इतर राज्य" }, value: "Other" },
    ]
  },
  {
    id: "q_education",
    field: "education",
    prompt: {
      en: "What is your highest or current education level?",
      hi: "आपकी उच्चतम या वर्तमान शिक्षा क्या है?",
      mr: "तुमचे सर्वोच्च किंवा सध्याचे शिक्षण काय आहे?"
    },
    options: [
      { label: { en: "B.E. (Final Year) / Graduate", hi: "बी.ई. / स्नातक", mr: "B.E. (अंतिम वर्ष) / पदवीधर" }, value: "B.E. (Final Year)" },
      { label: { en: "12th Pass (Higher Secondary)", hi: "12वीं पास", mr: "12 वी उत्तीर्ण" }, value: "12th Pass" },
      { label: { en: "10th Pass (Matriculation)", hi: "10वीं पास", mr: "10 वी उत्तीर्ण" }, value: "10th Pass" },
      { label: { en: "Postgraduate / Diploma", hi: "परास्नातक / डिप्लोमा", mr: "पदव्युत्तर / डिप्लोमा" }, value: "Postgraduate" },
    ]
  },
  {
    id: "q_category",
    field: "category",
    prompt: {
      en: "Which social category do you belong to? (Helps match quota-specific scholarships)",
      hi: "आप किस सामाजिक वर्ग से आते हैं? (यह आरक्षित छात्रवृत्ति खोजने में मदद करता है)",
      mr: "तुम्ही कोणत्या प्रवर्गात मोडता? (आरक्षित शिष्यवृत्ती शोधण्यासाठी उपयुक्त)"
    },
    options: [
      { label: { en: "General", hi: "सामान्य (General)", mr: "खुला प्रवर्ग (General)" }, value: "General" },
      { label: { en: "OBC", hi: "ओबीसी (OBC)", mr: "इतर मागासवर्गीय (OBC)" }, value: "OBC" },
      { label: { en: "SC", hi: "एससी (SC)", mr: "अनुसूचित जाती (SC)" }, value: "SC" },
      { label: { en: "ST", hi: "एसटी (ST)", mr: "अनुसूचित जमाती (ST)" }, value: "ST" },
    ]
  }
];
