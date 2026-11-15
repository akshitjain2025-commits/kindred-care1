export type SpatialCareMode = "overview" | "medications" | "safety" | "voice";

export interface CareTaskItem {
  id: string;
  time: string;
  title: string;
  detail: string;
  category: "Medication" | "Hydration" | "Mobility" | "Family";
  completed: boolean;
}

export interface FamilyMember {
  id: string;
  name: string;
  role: string;
  location: string;
  lastCheckIn: string;
  phone?: string;
}

export interface CareNote {
  id: string;
  author: string;
  timestamp: string;
  text: string;
}

export type SecurityAlertStatus = "Resolved" | "Acknowledged" | "Monitoring";

export interface SecurityLogEntry {
  id: string;
  timestamp: string;
  eventType:
    | "Fall Detection"
    | "Unusual Movement"
    | "Nighttime Wandering"
    | "Pathway Check"
    | "Quick Alert";
  zone: string;
  description: string;
  responseTime: string;
  status: SecurityAlertStatus;
  resolvedBy: string;
}

export interface WellnessDayPoint {
  day: string;
  activityScore: number;
  sleepScore: number;
  hydrationScore: number;
}

export interface VitalReading {
  id: string;
  label: string;
  value: string;
  unit: string;
  measuredAt: string;
  status: "Normal" | "Watch";
}

export interface PrescriptionItem {
  id: string;
  name: string;
  dosage: string;
  timing: string;
  prescriber: string;
  daysRemaining: number;
  refillRequested: boolean;
}

export interface AppointmentItem {
  id: string;
  date: string;
  time: string;
  title: string;
  withPerson: string;
  mode: "In-Person" | "Video Visit" | "Home Visit";
}

export interface ComfortPreferences {
  favoriteDrink: string;
  preferredTopics: string;
  quietHours: string;
  voicePace: "Unhurried" | "Standard";
  eveningLampCue: boolean;
}

export interface ResidentProfile {
  id: string;
  name: string;
  age: number;
  dateOfBirth: string;
  bloodType: string;
  primaryLanguage: string;
  mobilityAid: string;
  residence: string;
  careFocus: string;
  statusLevel: "Calm" | "Active" | "Resting";
  avatarUrl: string;
  safetySummary: string;
  restingHeartRate: string;
  hydrationGlasses: number;
  hydrationTarget: number;
  upcomingVisit: string;
  homeLat: number;
  homeLng: number;
  patientEmail?: string;
  patientPhone?: string;
  doctorName?: string;
  doctorSpecialty?: string;
  doctorPhone?: string;
  doctorEmail?: string;
  allergies: string[];
  conditions: string[];
  vitals: VitalReading[];
  prescriptions: PrescriptionItem[];
  appointments: AppointmentItem[];
  comfortPreferences: ComfortPreferences;
  wellnessHistory: WellnessDayPoint[];
  tasks: CareTaskItem[];
  circleMembers: FamilyMember[];
  notes: CareNote[];
  securityLogs: SecurityLogEntry[];
}

export const INITIAL_RESIDENTS: ResidentProfile[] = [
  {
    id: "arthur",
    name: "Arthur Pendelton",
    age: 79,
    dateOfBirth: "May 14, 1947",
    bloodType: "O+",
    primaryLanguage: "English",
    mobilityAid: "Ashwood Walking Cane (Outdoors)",
    residence: "Oakridge Residence · Living Room Sanctuary",
    careFocus: "Morning blood pressure rhythm, hydration pacing, and daily garden walks",
    statusLevel: "Calm",
    avatarUrl: "/assets/images/eldercare_living_sunlight_1794715912243.jpg",
    safetySummary: "Living room and hallway motion calm · Evening path lighting active at dusk",
    restingHeartRate: "68 bpm",
    hydrationGlasses: 5,
    hydrationTarget: 7,
    upcomingVisit: "Clara Pendelton (Daughter) · Video tea today at 4:30 PM",
    homeLat: 45.5231,
    homeLng: -122.6765,
    patientEmail: "arthur.pendelton@familycare.example",
    patientPhone: "(503) 555-0119",
    doctorName: "Dr. Hannah Sato, MD",
    doctorSpecialty: "Geriatric Internal Medicine · Cedar Valley Clinic",
    doctorPhone: "(503) 555-0192",
    doctorEmail: "dr.sato@cedarvalleyclinic.example",
    allergies: ["Penicillin (Rash)", "Shellfish"],
    conditions: ["Mild Hypertension (Controlled)", "Vitamin D Deficiency"],
    vitals: [
      {
        id: "v-a-1",
        label: "Blood Pressure",
        value: "124/76",
        unit: "mmHg",
        measuredAt: "Today · 08:15 AM",
        status: "Normal",
      },
      {
        id: "v-a-2",
        label: "Resting Heart Rate",
        value: "68",
        unit: "bpm",
        measuredAt: "Today · 08:15 AM",
        status: "Normal",
      },
      {
        id: "v-a-3",
        label: "Fasting Glucose",
        value: "96",
        unit: "mg/dL",
        measuredAt: "Yesterday · 07:50 AM",
        status: "Normal",
      },
      {
        id: "v-a-4",
        label: "Body Weight",
        value: "164.2",
        unit: "lbs",
        measuredAt: "Nov 12 · Morning",
        status: "Normal",
      },
    ],
    prescriptions: [
      {
        id: "rx-a-1",
        name: "Lisinopril",
        dosage: "10 mg tablet",
        timing: "08:00 AM with breakfast",
        prescriber: "Dr. Hannah Sato",
        daysRemaining: 18,
        refillRequested: false,
      },
      {
        id: "rx-a-2",
        name: "Vitamin D3",
        dosage: "1000 IU softgel",
        timing: "06:30 PM after dinner",
        prescriber: "Dr. Hannah Sato",
        daysRemaining: 5,
        refillRequested: false,
      },
      {
        id: "rx-a-3",
        name: "Magnesium Glycinate",
        dosage: "200 mg capsule",
        timing: "06:30 PM with water",
        prescriber: "Cedar Valley Integrative",
        daysRemaining: 24,
        refillRequested: false,
      },
    ],
    appointments: [
      {
        id: "apt-a-1",
        date: "Today",
        time: "04:30 PM",
        title: "Afternoon Video Tea & Photo Check-in",
        withPerson: "Clara Pendelton",
        mode: "Video Visit",
      },
      {
        id: "apt-a-2",
        date: "Nov 18",
        time: "10:15 AM",
        title: "Quarterly Blood Pressure Review",
        withPerson: "Dr. Hannah Sato, MD",
        mode: "In-Person",
      },
      {
        id: "apt-a-3",
        date: "Nov 21",
        time: "02:00 PM",
        title: "Home Balance & Porch Safety Check",
        withPerson: "Marcus Rivera",
        mode: "Home Visit",
      },
    ],
    comfortPreferences: {
      favoriteDrink: "Chamomile & lemon tea at 3:00 PM",
      preferredTopics: "Botanical gardening, 1960s jazz records, family travels",
      quietHours: "09:30 PM – 07:00 AM",
      voicePace: "Unhurried",
      eveningLampCue: true,
    },
    wellnessHistory: [
      { day: "Mon", activityScore: 76, sleepScore: 82, hydrationScore: 86 },
      { day: "Tue", activityScore: 81, sleepScore: 79, hydrationScore: 71 },
      { day: "Wed", activityScore: 74, sleepScore: 84, hydrationScore: 86 },
      { day: "Thu", activityScore: 85, sleepScore: 88, hydrationScore: 100 },
      { day: "Fri", activityScore: 79, sleepScore: 85, hydrationScore: 86 },
      { day: "Sat", activityScore: 88, sleepScore: 90, hydrationScore: 92 },
      { day: "Sun", activityScore: 82, sleepScore: 86, hydrationScore: 71 },
    ],
    tasks: [
      {
        id: "a-1",
        time: "08:00 AM",
        title: "Lisinopril 10 mg with breakfast",
        detail: "Taken with warm oatmeal and chamomile tea",
        category: "Medication",
        completed: true,
      },
      {
        id: "a-2",
        time: "10:30 AM",
        title: "20-minute courtyard walk",
        detail: "Gentle pace with walking cane; mild sunshine",
        category: "Mobility",
        completed: true,
      },
      {
        id: "a-3",
        time: "02:00 PM",
        title: "Afternoon hydration & electrolyte glass",
        detail: "250 ml filtered water with lemon slice",
        category: "Hydration",
        completed: true,
      },
      {
        id: "a-4",
        time: "04:30 PM",
        title: "Afternoon check-in call with Clara",
        detail: "Share photos from Sunday's botanical conservatory trip",
        category: "Family",
        completed: false,
      },
      {
        id: "a-5",
        time: "06:30 PM",
        title: "Vitamin D3 1000 IU & Magnesium Glycinate",
        detail: "Scheduled after dinner with full glass of water",
        category: "Medication",
        completed: false,
      },
      {
        id: "a-6",
        time: "08:00 PM",
        title: "Evening reading & quiet wind-down",
        detail: "30 minutes of botanical history reading with warm lamp cue",
        category: "Family",
        completed: false,
      },
    ],
    circleMembers: [
      {
        id: "cm-1",
        name: "Clara Pendelton",
        role: "Primary Family Coordinator",
        location: "Portland, OR",
        lastCheckIn: "Today · 11:15 AM",
        phone: "(503) 555-0148",
      },
      {
        id: "cm-2",
        name: "Dr. Hannah Sato",
        role: "Geriatric Care Clinician",
        location: "Cedar Valley Clinic",
        lastCheckIn: "Nov 12 · Routine review",
        phone: "(503) 555-0192",
      },
      {
        id: "cm-3",
        name: "Marcus Rivera",
        role: "Visiting Home Aide",
        location: "Tue / Thu / Sat",
        lastCheckIn: "Yesterday · 03:40 PM",
        phone: "(503) 555-0167",
      },
    ],
    notes: [
      {
        id: "n-1",
        author: "Marcus Rivera",
        timestamp: "Today · 10:55 AM",
        text: "Arthur enjoyed his morning courtyard walk and steady balance exercises. Restocked chamomile tea and checked hallway nightlights.",
      },
      {
        id: "n-2",
        author: "Clara Pendelton",
        timestamp: "Yesterday · 07:20 PM",
        text: "Spoke before bedtime—asked Kindred to remind him about his 4:30 PM video call tomorrow.",
      },
    ],
    securityLogs: [
      {
        id: "sec-a-1",
        timestamp: "Today · 02:14 PM",
        eventType: "Unusual Movement",
        zone: "Kitchen & Tea Counter",
        description:
          "Extended 18-minute stillness detected near tea kettle outside usual afternoon rest window. Voice check-in confirmed Arthur was reading by the window.",
        responseTime: "12s voice check",
        status: "Monitoring",
        resolvedBy: "Pending evening review",
      },
      {
        id: "sec-a-2",
        timestamp: "Yesterday · 11:42 PM",
        eventType: "Nighttime Wandering",
        zone: "Upstairs Hallway",
        description:
          "Repeated hallway pacing for 9 minutes after bedtime; warm path lighting guided return to bedroom safely.",
        responseTime: "14s alert triage",
        status: "Acknowledged",
        resolvedBy: "Clara Pendelton",
      },
      {
        id: "sec-a-3",
        timestamp: "Nov 11 · 07:18 AM",
        eventType: "Fall Detection",
        zone: "Courtyard Porch Step",
        description:
          "Sudden downward acceleration registered near porch threshold. Arthur caught the handrail and confirmed no injury via speaker.",
        responseTime: "11s response",
        status: "Resolved",
        resolvedBy: "Marcus Rivera (Handrail inspected)",
      },
      {
        id: "sec-a-4",
        timestamp: "Nov 08 · 03:05 PM",
        eventType: "Pathway Check",
        zone: "Living Room",
        description:
          "Routine millimeter-wave gait cadence calibration completed with steady stride symmetry.",
        responseTime: "Automated",
        status: "Resolved",
        resolvedBy: "System Calibration",
      },
    ],
  },
  {
    id: "eleanor",
    name: "Eleanor Vance",
    age: 83,
    dateOfBirth: "September 03, 1943",
    bloodType: "A-",
    primaryLanguage: "English",
    mobilityAid: "Lightweight Rollator (Outdoors)",
    residence: "Maple Street Cottage · Sunroom Sanctuary",
    careFocus: "Post-hip recovery mobility, evening eye drops, and social engagement",
    statusLevel: "Resting",
    avatarUrl: "/assets/images/senior_portrait_eleanor_1794715912898.jpg",
    safetySummary: "Sunroom and kitchen rhythm steady · Bedside pressure mat calibrated",
    restingHeartRate: "72 bpm",
    hydrationGlasses: 4,
    hydrationTarget: 6,
    upcomingVisit: "Julian Vance (Son) · Grocery drop-off Friday at 10:00 AM",
    homeLat: 47.6205,
    homeLng: -122.3493,
    patientEmail: "eleanor.vance@familycare.example",
    patientPhone: "(206) 555-0174",
    doctorName: "Dr. Mei Lin, MD",
    doctorSpecialty: "Primary & Senior Orthopedic Care · Northwest Medical",
    doctorPhone: "(206) 555-0155",
    doctorEmail: "dr.lin@northwestmed.example",
    allergies: ["Sulfa Antibiotics", "Latex"],
    conditions: ["Right Hip Replacement Recovery (Week 9)", "Open-Angle Glaucoma"],
    vitals: [
      {
        id: "v-e-1",
        label: "Blood Pressure",
        value: "118/72",
        unit: "mmHg",
        measuredAt: "Today · 09:00 AM",
        status: "Normal",
      },
      {
        id: "v-e-2",
        label: "Resting Heart Rate",
        value: "72",
        unit: "bpm",
        measuredAt: "Today · 09:00 AM",
        status: "Normal",
      },
      {
        id: "v-e-3",
        label: "Oxygen Saturation",
        value: "97",
        unit: "%",
        measuredAt: "Today · 09:00 AM",
        status: "Normal",
      },
      {
        id: "v-e-4",
        label: "Pain / Comfort",
        value: "2/10",
        unit: "mild",
        measuredAt: "Yesterday · PT Note",
        status: "Watch",
      },
    ],
    prescriptions: [
      {
        id: "rx-e-1",
        name: "Levothyroxine",
        dosage: "50 mcg tablet",
        timing: "08:30 AM empty stomach",
        prescriber: "Dr. Mei Lin",
        daysRemaining: 14,
        refillRequested: false,
      },
      {
        id: "rx-e-2",
        name: "Latanoprost Eye Drops",
        dosage: "0.005% 1 drop/eye",
        timing: "07:00 PM nightly",
        prescriber: "Northwest Eye Associates",
        daysRemaining: 4,
        refillRequested: false,
      },
    ],
    appointments: [
      {
        id: "apt-e-1",
        date: "Tomorrow",
        time: "10:00 AM",
        title: "Weekly Grocery Drop-off & Tea",
        withPerson: "Julian Vance",
        mode: "Home Visit",
      },
      {
        id: "apt-e-2",
        date: "Nov 19",
        time: "01:30 PM",
        title: "Hip Mobility Gait Assessment",
        withPerson: "Nadia Okafor, PT",
        mode: "Home Visit",
      },
    ],
    comfortPreferences: {
      favoriteDrink: "Warm peppermint tea with honey",
      preferredTopics: "Crossword clues, classic literature audiobooks, neighborhood birds",
      quietHours: "09:00 PM – 07:30 AM",
      voicePace: "Unhurried",
      eveningLampCue: true,
    },
    wellnessHistory: [
      { day: "Mon", activityScore: 64, sleepScore: 76, hydrationScore: 67 },
      { day: "Tue", activityScore: 68, sleepScore: 78, hydrationScore: 83 },
      { day: "Wed", activityScore: 72, sleepScore: 81, hydrationScore: 83 },
      { day: "Thu", activityScore: 71, sleepScore: 74, hydrationScore: 67 },
      { day: "Fri", activityScore: 75, sleepScore: 83, hydrationScore: 100 },
      { day: "Sat", activityScore: 78, sleepScore: 85, hydrationScore: 83 },
      { day: "Sun", activityScore: 74, sleepScore: 80, hydrationScore: 67 },
    ],
    tasks: [
      {
        id: "e-1",
        time: "08:30 AM",
        title: "Levothyroxine 50 mcg",
        detail: "Taken 30 minutes prior to morning toast",
        category: "Medication",
        completed: true,
      },
      {
        id: "e-2",
        time: "11:00 AM",
        title: "Seated physical therapy stretches",
        detail: "Ankle circles and gentle hip extensions (12 mins)",
        category: "Mobility",
        completed: true,
      },
      {
        id: "e-3",
        time: "03:00 PM",
        title: "Herbal tea & crossword reading",
        detail: "Voice companion read today's community bulletin aloud",
        category: "Hydration",
        completed: false,
      },
      {
        id: "e-4",
        time: "07:00 PM",
        title: "Evening Latanoprost eye drops",
        detail: "One drop per eye before evening audiobook",
        category: "Medication",
        completed: false,
      },
      {
        id: "e-5",
        time: "08:15 PM",
        title: "Evening reading in the sunroom",
        detail: "Classic literature chapter before 9:00 PM quiet hours",
        category: "Family",
        completed: false,
      },
    ],
    circleMembers: [
      {
        id: "cm-4",
        name: "Julian Vance",
        role: "Son & Legal Proxy",
        location: "Seattle, WA",
        lastCheckIn: "Today · 09:05 AM",
        phone: "(206) 555-0134",
      },
      {
        id: "cm-5",
        name: "Nadia Okafor, PT",
        role: "Home Physical Therapist",
        location: "Mon / Wed Visits",
        lastCheckIn: "Nov 13 · Gait steady",
        phone: "(206) 555-0181",
      },
    ],
    notes: [
      {
        id: "n-3",
        author: "Nadia Okafor, PT",
        timestamp: "Yesterday · 02:15 PM",
        text: "Step cadence improved along the garden path. Recommended continuing 12-minute morning seated stretches.",
      },
    ],
    securityLogs: [
      {
        id: "sec-e-1",
        timestamp: "Today · 06:48 AM",
        eventType: "Unusual Movement",
        zone: "Bedside & Bath Corridor",
        description:
          "Slower transition speed noted upon rising; gentle voice reminder prompted seated pause before walking.",
        responseTime: "15s prompt",
        status: "Acknowledged",
        resolvedBy: "Julian Vance",
      },
      {
        id: "sec-e-2",
        timestamp: "Nov 12 · 09:30 PM",
        eventType: "Fall Detection",
        zone: "Sunroom Rug Edge",
        description:
          "Low-impact slip near sunroom rug corner; Eleanor remained seated on armchair and spoke with Julian within 20 seconds.",
        responseTime: "13s alert triage",
        status: "Resolved",
        resolvedBy: "Nadia Okafor, PT (Rug secured)",
      },
      {
        id: "sec-e-3",
        timestamp: "Nov 09 · 01:12 AM",
        eventType: "Nighttime Wandering",
        zone: "Kitchenette",
        description:
          "Brief 4-minute kitchen visit for water; motion pattern matched normal hydration check.",
        responseTime: "Automated",
        status: "Resolved",
        resolvedBy: "Confirmed safe via voice",
      },
    ],
  },
];

export const CARE_MODE_META: Record<
  SpatialCareMode,
  {
    label: string;
    headline: string;
    description: string;
    metricLabel: string;
    metricValue: string;
  }
> = {
  overview: {
    label: "Sanctuary Overview",
    headline: "Ambient home harmony without intrusive cameras",
    description:
      "Acoustic and motion presence sensors softly map daily living rhythms into a calm household cadence.",
    metricLabel: "Active Home Zones",
    metricValue: "4 / 4 Calm",
  },
  medications: {
    label: "Medication Rhythm",
    headline: "Gentle voice cues aligned to meals and rest",
    description:
      "Scheduled doses synchronize across the tabletop ceramic speaker and shared family care circle.",
    metricLabel: "On-Time Adherence",
    metricValue: "96.4% (30d)",
  },
  safety: {
    label: "Fall & Path Guard",
    headline: "Millimeter-wave awareness with instant family triage",
    description:
      "Detects unusual nighttime stillness or hallway stumbles without capturing optical video.",
    metricLabel: "Median Response",
    metricValue: "14 seconds",
  },
  voice: {
    label: "Gemini Voice Companion",
    headline: "Patient, natural conversation anytime day or night",
    description:
      "Powered by Gemini speech synthesis and live schedule memory so seniors never navigate tiny menus.",
    metricLabel: "Voice Clarity",
    metricValue: "24 kHz Warm",
  },
};

export const CLINICAL_OUTCOMES = [
  {
    metric: "96.4%",
    label: "30-day medication adherence across 420 enrolled households",
    context: "Compared against 68% baseline prior to voice-guided mealtime cues",
  },
  {
    metric: "14 sec",
    label: "Median family alert delivery during nighttime mobility anomalies",
    context: "Measured across Q1–Q3 2026 residential pilot cohort",
  },
  {
    metric: "4.2 hrs",
    label: "Weekly caregiver coordination time saved per adult child",
    context: "Shared shift logs eliminate duplicate pharmacy calls and check-in texts",
  },
];

export const CAREGIVER_STORIES = [
  {
    quote:
      "Before Kindred, I called my father three times a day just to confirm he took his blood pressure pill and felt guilty interrupting his afternoons. Now the tabletop companion gives him a gentle voice reminder over tea, and I simply glance at our shared circle.",
    name: "Clara Pendelton",
    role: "Daughter & Care Coordinator",
    organization: "Portland Family Circle · 8 months active",
  },
  {
    quote:
      "My patients refuse cameras in their bedrooms, and rightly so. Ambient spatial sensing paired with patient voice check-ins lets us spot hydration dips and sleep disruption four days before an urgent clinic visit.",
    name: "Dr. Hannah Sato, MD",
    role: "Lead Geriatrician",
    organization: "Cedar Valley Senior Care",
  },
];
