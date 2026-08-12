/**
 * Single source of truth for every company-specific value on the site.
 *
 * IMPORTANT — before launch:
 * Every value wrapped in square brackets (e.g. "[COMPANY EMAIL]") is a
 * PLACEHOLDER that has not been confirmed by Top Miles Logistics. Replace them
 * with real values, or remove the feature that uses them. Nothing in this file
 * should be invented: if a fact is not known, it stays a placeholder.
 */

export const PLACEHOLDER_PATTERN = /^\[.+\]$/;

/** True when a config value is still an unfilled placeholder. */
export function isPlaceholder(value: string | null | undefined): boolean {
  return typeof value === "string" && PLACEHOLDER_PATTERN.test(value.trim());
}

export const siteConfig = {
  // ---- Identity -----------------------------------------------------------
  name: "Top Miles Logistics",
  legalName: "Top Miles Logistics",
  /** Confirmed: the company is located in Ohio, USA. */
  state: "Ohio",
  stateAbbr: "OH",
  country: "USA",
  locationLabel: "Ohio, USA",

  // ---- Contact ------------------------------------------------------------
  /** Confirmed. */
  phone: "+1 929-706-4042",
  phoneHref: "tel:+19297064042",
  phoneDisplay: "(929) 706-4042",
  /** PLACEHOLDER — not provided. */
  email: "topmileslogistics@gmail.com",
  /** PLACEHOLDER — not provided. */
  officeAddress: "[OFFICE ADDRESS]",
  /** PLACEHOLDER — not provided. */
  mcNumber: "[MC NUMBER]",
  /** PLACEHOLDER — not provided. */
  dotNumber: "[DOT NUMBER]",
  /** PLACEHOLDER — not provided. */

  // ---- The role (all confirmed) ------------------------------------------
  position: "OTR CDL-A Truck Driver",
  positionPlural: "OTR CDL-A Truck Drivers",
  employmentType: "1099",
  employmentTypeNote: "This is a 1099 independent contractor position.",
  freightTypes: ["Dry Van", "Reefer"] as const,
  payRange: "70–80 CPM",
  payRangeNote: "70–80 cents per mile, based on experience.",
  paySchedule: "Weekly direct deposit",
  weeklyMiles: "3,500–4,500 miles per week",
  weeklyMilesMin: 3500,
  weeklyMilesMax: 4500,
  homeTime: "Drivers should be able to stay out 3–4 weeks at a time",
  freightMix: "Approximately 70% drop & hook, 30% live load",
  dropAndHookPercent: 70,
  liveLoadPercent: 30,
  sapPolicy: "SAP Step 6 drivers are welcome",
  transportAssistance:
    "Transportation assistance is available for approved drivers",

  // ---- Requirements (all confirmed) --------------------------------------
  minCdlExperienceMonths: 3,
  minOtrExperienceMonths: 1,
  minCdlExperienceLabel: "Minimum 3 months CDL-A experience",
  minOtrExperienceLabel: "Minimum 1 month OTR experience",

  // ---- Web ----------------------------------------------------------------
  url:
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://www.topmileslogistics.com",
  ogImage: "/opengraph-image",
  twitterHandle: null as string | null, // not provided — omit the tag entirely
} as const;

export type SiteConfig = typeof siteConfig;

/**
 * Job highlights rendered on the homepage and in the JobPosting structured
 * data. Every entry maps to a fact supplied by the company.
 */
export const jobHighlights = [
  {
    label: "Pay",
    value: siteConfig.payRange,
    detail: "Based on experience",
  },
  {
    label: "Weekly Miles",
    value: "3,500–4,500",
    detail: "Average per week",
  },
  {
    label: "Freight",
    value: "Dry Van & Reefer",
    detail: "70% drop & hook",
  },
  {
    label: "Pay Schedule",
    value: "Weekly",
    detail: "Direct deposit",
  },
] as const;

export const jobRequirements = [
  "Valid Class A CDL",
  "Minimum 3 months CDL-A experience",
  "Minimum 1 month OTR experience",
  "Able to stay out 3–4 weeks at a time",
  "Legally authorized to work in the United States",
  "SAP Step 6 drivers are welcome to apply",
] as const;

export const jobDetails = [
  {
    title: "Pay",
    body: "70–80 CPM based on experience, paid weekly by direct deposit. This is a 1099 independent contractor position.",
  },
  {
    title: "Miles",
    body: "Approximately 3,500–4,500 miles per week.",
  },
  {
    title: "Freight",
    body: "Dry Van and Reefer freight, approximately 70% drop & hook and 30% live load.",
  },
  {
    title: "Home Time",
    body: "This is an over-the-road position. Drivers should be able to stay out 3–4 weeks at a time.",
  },
  {
    title: "SAP Drivers",
    body: "SAP Step 6 drivers are welcome to apply.",
  },
  {
    title: "Transportation Assistance",
    body: "Transportation assistance is available for approved drivers.",
  },
] as const;

/** US states + DC, used by address and CDL fields. */
export const US_STATES = [
  ["AL", "Alabama"], ["AK", "Alaska"], ["AZ", "Arizona"], ["AR", "Arkansas"],
  ["CA", "California"], ["CO", "Colorado"], ["CT", "Connecticut"],
  ["DE", "Delaware"], ["DC", "District of Columbia"], ["FL", "Florida"],
  ["GA", "Georgia"], ["HI", "Hawaii"], ["ID", "Idaho"], ["IL", "Illinois"],
  ["IN", "Indiana"], ["IA", "Iowa"], ["KS", "Kansas"], ["KY", "Kentucky"],
  ["LA", "Louisiana"], ["ME", "Maine"], ["MD", "Maryland"],
  ["MA", "Massachusetts"], ["MI", "Michigan"], ["MN", "Minnesota"],
  ["MS", "Mississippi"], ["MO", "Missouri"], ["MT", "Montana"],
  ["NE", "Nebraska"], ["NV", "Nevada"], ["NH", "New Hampshire"],
  ["NJ", "New Jersey"], ["NM", "New Mexico"], ["NY", "New York"],
  ["NC", "North Carolina"], ["ND", "North Dakota"], ["OH", "Ohio"],
  ["OK", "Oklahoma"], ["OR", "Oregon"], ["PA", "Pennsylvania"],
  ["RI", "Rhode Island"], ["SC", "South Carolina"], ["SD", "South Dakota"],
  ["TN", "Tennessee"], ["TX", "Texas"], ["UT", "Utah"], ["VT", "Vermont"],
  ["VA", "Virginia"], ["WA", "Washington"], ["WV", "West Virginia"],
  ["WI", "Wisconsin"], ["WY", "Wyoming"],
] as const;

export const ENDORSEMENTS = [
  "Hazmat (H)",
  "Tanker (N)",
  "Doubles/Triples (T)",
  "Tanker + Hazmat (X)",
  "Passenger (P)",
  "School Bus (S)",
] as const;

export const FREIGHT_EXPERIENCE = [
  "Dry Van",
  "Reefer",
  "Flatbed",
  "Tanker",
  "Intermodal",
  "Other",
] as const;

export const REFERRAL_SOURCES = [
  "Google search",
  "Facebook",
  "Indeed",
  "Referred by a driver",
  "Truck stop / word of mouth",
  "Other",
] as const;
/**
 * Photos shown in the "On the road" strip on the homepage.
 *
 * An empty array hides the whole section — no broken images, no empty boxes.
 * To add one: upload the file into `public/`, then add a line here.
 *
 * `alt` is read aloud by screen readers and shown if the image fails to load,
 * so describe the picture rather than repeating the company name.
 */
export const sitePhotos: ReadonlyArray<{ src: string; alt: string }> = [
  { src: "/truck-road.jpg", alt: "Black Class 8 tractor on a two-lane road" },
  { src: "/truck-fog.jpg", alt: "Semi truck running through heavy fog on the highway" },
];
{ src: "/truck-road.jpg", alt: "Black Class 8 tractor on a two-lane road" },
  { src: "/truck-fog.jpg", alt: "Semi truck running through heavy fog on the highway" },
