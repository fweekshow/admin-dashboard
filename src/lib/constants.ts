

/** Short day abbreviations used across schedule / meal / activity pages */
export const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"] as const;

/** Full day-of-week names (housekeeping, laundry) */
export const DOW = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;

/** Meal categories */
export const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner", "Snack"] as const;

/** Schedule block types */
export const BLOCK_TYPES = [
  "WakeUp", "MedicationWindow", "Meal", "GroupSession",
  "FreeTime", "QuietHours", "LightsOut", "Other",
] as const;

/** Housekeeping task categories */
export const TASK_TYPES = ["Daily", "Deep"] as const;

/** Override action definitions used on the overrides page */
export const ACTIONS = [
  { id: "mainmenu-schedule", label: "Schedule", emoji: "📅", hasSmartUpdate: false },
  { id: "mainmenu-meals", label: "Meals", emoji: "🍴", hasSmartUpdate: true },
  { id: "mainmenu-activities", label: "Activities", emoji: "🏃", hasSmartUpdate: true },
  { id: "mainmenu-logistics", label: "Logistics", emoji: "🧳", hasSmartUpdate: false },
  { id: "mainmenu-medication", label: "Medications", emoji: "💊", hasSmartUpdate: false },
  { id: "mainmenu-guidelines", label: "Guidelines", emoji: "📖", hasSmartUpdate: true },
  { id: "mainmenu-houserules", label: "House Rules", emoji: "🏠", hasSmartUpdate: true },
  { id: "mainmenu-support-request", label: "Request Support", emoji: "🆘", hasSmartUpdate: false },
  { id: "mainmenu-advocates", label: "Advocates", emoji: "🙋", hasSmartUpdate: false },
] as const;

/** Expected CSV headers per table – used for upload validation */
export const EXPECTED_HEADERS: Record<string, string[]> = {
  meals: ["Date", "Day of Week", "Meal Type", "Items", "Start Time", "End Time", "Nutrition Highlights", "Notes"],
  activities: ["Date", "Day of Week", "Activity Name", "Description", "Start Time", "End Time", "Location", "Facilitator", "Notes"],
  schedule: ["Start Time", "End Time", "Block Type", "Activity", "Location", "Notes", "Days of Week", "Refers to Meal", "Refers to Activity", "Refers to Meds"],
  staff: ["Name", "Title", "Division", "Email", "Phone", "Reports To"],
  guidelines: ["Title", "Content", "Category"],
  houserules: ["Title", "Content", "Category"],
  emergency: ["Name", "Phone Number", "Type", "Notes", "Priority"],
  housekeeping: ["Date", "Day of Week", "Room/Area", "Task Type", "Daily Tasks Completed", "Assigned Staff", "Time In", "Time Out", "Supervisor Initials", "Notes"],
  laundry: ["Date", "Day of Week", "Member Name", "Room Number", "Laundry Type", "Laundry Vendor", "Expected Return Date", "Returned Date", "Condition Check", "Notes"],
  medications: ["User", "Medication", "Dosage", "Time", "Frequency", "Prescribing Doctor", "Notes"],
};

/** Cookie name used for admin authentication */
export const AUTH_COOKIE = "admin_auth" as const;

/** Cookie max-age in seconds (7 days) */
export const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

/** Header name for API secret authentication */
export const AUTH_HEADER = "x-admin-secret" as const;

/** Salt used for hashing admin token */
export const TOKEN_SALT = "_admin_session" as const;

/** Laundry type options */
export const LAUNDRY_TYPES = ["Personal", "Linens", "Towels"] as const;

/** CSV boolean truthy values */
export const TRUTHY_VALUES = ["yes", "true", "1", "y"] as const;

/** CSV boolean falsy values */
export const FALSY_VALUES = ["no", "false", "0", "n"] as const;

/** Block-type alias map for CSV import normalisation */
export const BLOCK_TYPE_ALIASES: Record<string, string> = {
  "wake up": "WakeUp", "wakeup": "WakeUp",
  "medication": "MedicationWindow", "medication window": "MedicationWindow", "medicationwindow": "MedicationWindow", "meds": "MedicationWindow",
  "meal": "Meal", "meals": "Meal",
  "group session": "GroupSession", "groupsession": "GroupSession", "group": "GroupSession",
  "free time": "FreeTime", "freetime": "FreeTime", "free": "FreeTime",
  "quiet hours": "QuietHours", "quiethours": "QuietHours", "quiet": "QuietHours",
  "lights out": "LightsOut", "lightsout": "LightsOut",
  "other": "Other",
};

/** Smart-update action→table mapping */
export const ACTION_TABLE_MAP: Record<string, { table: string; description: string }> = {
  "mainmenu-meals": {
    table: "MealTemplate",
    description: "Meals with fields: mealType (breakfast/lunch/dinner/snack), items (string array), startTime (e.g. '08:00'), endTime (e.g. '09:00'), daysOfWeek (array of MON/TUE/WED/THU/FRI/SAT/SUN), notes (optional string)",
  },
  "mainmenu-activities": {
    table: "ActivityTemplate",
    description: "Activities with fields: name (string), description (optional), startTime (e.g. '09:00'), endTime (e.g. '10:00'), location (optional), daysOfWeek (array of MON/TUE/WED/THU/FRI/SAT/SUN), notes (optional)",
  },
  "mainmenu-guidelines": {
    table: "Guideline",
    description: "Guidelines with fields: title (string), content (string), category (optional string)",
  },
  "mainmenu-houserules": {
    table: "HouseRule",
    description: "House rules with fields: title (string), content (string), category (optional string)",
  },
};

/** CSV table options (labels + default filenames) */
export const TABLES = [
  { value: "meals", label: "Meal Templates", file: "meal-menu.csv" },
  { value: "activities", label: "Activity Templates", file: "group-schedule.csv" },
  { value: "schedule", label: "Daily Schedule", file: "daily-schedule.csv" },
  { value: "staff", label: "Staff Members", file: "team-roster.csv" },
  { value: "guidelines", label: "Guidelines", file: "" },
  { value: "houserules", label: "House Rules", file: "" },
  { value: "emergency", label: "Emergency Contacts", file: "emergency-contacts.csv" },
  { value: "housekeeping", label: "Housekeeping Schedule", file: "housekeeping-schedule.csv" },
  { value: "laundry", label: "Laundry Schedule", file: "laundry-schedule.csv" },
  { value: "medications", label: "Medications", file: "medications.csv" },
] as const;

/** User role names */
export const ROLES = ["admin", "staff", "advocate", "client", "family"] as const;

/** OpenAI model used for smart-updates */
export const OPENAI_MODEL = "gpt-4o" as const;

/** OpenAI temperature for smart-updates */
export const OPENAI_TEMPERATURE = 0.1;

/** localStorage key for theme preference */
export const THEME_STORAGE_KEY = "theme" as const;
