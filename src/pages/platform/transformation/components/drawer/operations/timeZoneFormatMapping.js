/**
 * Common timezones grouped by region
 */
export const TIMEZONES = {
  "Africa": [
    "Africa/Abidjan", "Africa/Accra", "Africa/Addis_Ababa", "Africa/Algiers",
    "Africa/Cairo", "Africa/Casablanca", "Africa/Johannesburg", "Africa/Lagos",
    "Africa/Nairobi", "Africa/Tunis"
  ],
  "America": [
    "America/Anchorage", "America/Bogota", "America/Buenos_Aires", "America/Caracas",
    "America/Chicago", "America/Denver", "America/Havana", "America/Los_Angeles",
    "America/Mexico_City", "America/New_York", "America/Phoenix", "America/Santiago",
    "America/Sao_Paulo", "America/Toronto"
  ],
  "Asia": [
    "Asia/Baghdad", "Asia/Baku", "Asia/Bangkok", "Asia/Beirut", "Asia/Dhaka",
    "Asia/Dubai", "Asia/Ho_Chi_Minh", "Asia/Hong_Kong", "Asia/Istanbul",
    "Asia/Jakarta", "Asia/Jerusalem", "Asia/Karachi", "Asia/Kolkata", "Asia/Kuwait",
    "Asia/Manila", "Asia/Muscat", "Asia/Riyadh", "Asia/Seoul", "Asia/Shanghai",
    "Asia/Singapore", "Asia/Taipei", "Asia/Tehran", "Asia/Tokyo"
  ],
  "Australia": [
    "Australia/Adelaide", "Australia/Brisbane", "Australia/Darwin",
    "Australia/Melbourne", "Australia/Perth", "Australia/Sydney"
  ],
  "Canada": [
    "Canada/Atlantic", "Canada/Central", "Canada/Eastern",
    "Canada/Mountain", "Canada/Newfoundland", "Canada/Pacific"
  ],
  "Europe": [
    "Europe/Amsterdam", "Europe/Athens", "Europe/Belgrade", "Europe/Berlin",
    "Europe/Brussels", "Europe/Budapest", "Europe/Copenhagen", "Europe/Dublin",
    "Europe/Helsinki", "Europe/Istanbul", "Europe/Kiev", "Europe/Lisbon",
    "Europe/London", "Europe/Madrid", "Europe/Moscow", "Europe/Oslo", "Europe/Paris",
    "Europe/Prague", "Europe/Rome", "Europe/Stockholm", "Europe/Vienna", "Europe/Warsaw",
    "Europe/Zurich"
  ],
  "Pacific": [
    "Pacific/Auckland", "Pacific/Fiji", "Pacific/Guam", "Pacific/Honolulu",
    "Pacific/Midway", "Pacific/Samoa", "Pacific/Tongatapu"
  ],
  "UTC": ["UTC"]
};

/**
 * Common date/time formats with examples
 */
export const DATE_FORMATS = [
  { format: "yyyy-MM-dd", example: "2025-06-15" },
  { format: "yyyy/MM/dd", example: "2025/06/15" },
  { format: "MM-dd-yyyy", example: "06-15-2025" },
  { format: "MM/dd/yyyy", example: "06/15/2025" },
  { format: "dd-MM-yyyy", example: "15-06-2025" },
  { format: "dd/MM/yyyy", example: "15/06/2025" },
  { format: "yyyy-MM-dd HH:mm:ss", example: "2025-06-15 14:30:45" },
  { format: "yyyy-MM-dd HH:mm:ss.SSS", example: "2025-07-01 00:00:00.000" },
  { format: "yyyy-MM-dd'T'HH:mm:ss", example: "2023-06-15T14:30:45" },
  { format: "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", example: "2025-06-15T14:30:45.123Z" },
  { format: "dd-MM-yyyy HH:mm:ss", example: "15-06-2025 14:30:45" },
  { format: "MM-dd-yyyy HH:mm:ss", example: "06-15-2025 14:30:45" },
  { format: "HH:mm:ss", example: "14:30:45" },
  { format: "hh:mm:ss a", example: "02:30:45 PM" },
  { format: "MMMM d, yyyy", example: "June 15, 2025" },
  { format: "EEE, MMM d, yyyy", example: "Thu, Jun 15, 2025" },
  { format: "EEEE, MMMM d, yyyy", example: "Thursday, June 15, 2025" }
];


export const getAllTimezones = () => {
  return Object.values(TIMEZONES).flat();
};

export const getAllDateFormats = () => {
  return DATE_FORMATS.map(df => df.format);
};

export const getFormatExample = (format) => {
  const found = DATE_FORMATS.find(df => df.format === format);
  return found ? found.example : "";
};
