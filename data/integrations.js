// shared/data/integrations.js
// Heroicons are large; in environments where the package isn't available (e.g. when this shared
// module is consumed by a workspace that didn't list @heroicons/react), we provide lightweight
// fallbacks. Attempt dynamic require inside a try/catch to avoid build resolution failures.
let CalendarIcon,
  VideoCameraIcon,
  EnvelopeIcon,
  CreditCardIcon,
  LinkIcon,
  Cog6ToothIcon,
  BuildingOfficeIcon,
  MegaphoneIcon;
try {
  // eslint-disable-next-line import/no-extraneous-dependencies
  ({
    CalendarIcon,
    VideoCameraIcon,
    EnvelopeIcon,
    CreditCardIcon,
    LinkIcon,
    Cog6ToothIcon,
    BuildingOfficeIcon,
    MegaphoneIcon,
  } = require("@heroicons/react/24/outline"));
} catch (e) {
  const Fallback = (name) => (props) =>
    React.createElement("span", { ...props, "data-icon": name });
  CalendarIcon = Fallback("calendar");
  VideoCameraIcon = Fallback("video");
  EnvelopeIcon = Fallback("envelope");
  CreditCardIcon = Fallback("credit-card");
  LinkIcon = Fallback("link");
  Cog6ToothIcon = Fallback("cog");
  BuildingOfficeIcon = Fallback("building");
  MegaphoneIcon = Fallback("megaphone");
}

// Brand icons from react-icons
import {
  FaGoogle,
  FaMicrosoft,
  FaMailchimp,
  FaStripe,
  FaPaypal,
  FaYoutube,
  FaFacebook,
} from "react-icons/fa";

import { SiSendgrid, SiQuickbooks, SiTwilio } from "react-icons/si";

import { TbBrandZoom } from "react-icons/tb";

// Integration categories
export const INTEGRATION_CATEGORIES = [
  { id: "all", name: "All Integrations", icon: Cog6ToothIcon },
  { id: "popular", name: "Popular", icon: MegaphoneIcon },
  { id: "calendar", name: "Calendar & Scheduling", icon: CalendarIcon },
  { id: "communication", name: "Communication", icon: VideoCameraIcon },
  { id: "email", name: "Email Marketing", icon: EnvelopeIcon },
  { id: "payment", name: "Payments & Donations", icon: CreditCardIcon },
  { id: "church", name: "Church Tools", icon: BuildingOfficeIcon },
  { id: "accounting", name: "Accounting", icon: CreditCardIcon },
  { id: "social", name: "Social & Streaming", icon: VideoCameraIcon },
];

// Comprehensive integration database
export const INTEGRATION_DATABASE = {
  // Calendar & Scheduling
  googleCalendar: {
    id: "googleCalendar",
    name: "Google Calendar",
    description: "Sync church events and services with Google Calendar",
    category: "calendar",
    icon: FaGoogle,
    color: "blue",
    popular: true,
    verified: true,
    features: [
      "Event sync",
      "Service scheduling",
      "Room booking",
      "Automatic reminders",
    ],
    pricing: "Free",
    setupTime: "5 minutes",
    website: "https://calendar.google.com",
    documentation: "https://developers.google.com/calendar",
  },
  outlookCalendar: {
    id: "outlookCalendar",
    name: "Outlook Calendar",
    description: "Microsoft calendar integration with Office 365",
    category: "calendar",
    icon: FaMicrosoft,
    color: "blue",
    popular: true,
    verified: true,
    features: ["Event sync", "Office 365 integration", "Teams meetings"],
    pricing: "Included with Office 365",
    setupTime: "10 minutes",
    website: "https://outlook.com",
    documentation:
      "https://docs.microsoft.com/en-us/graph/api/resources/calendar",
  },

  // Communication & Video
  zoom: {
    id: "zoom",
    name: "Zoom",
    description: "Video conferencing for online services and meetings",
    category: "communication",
    icon: TbBrandZoom,
    color: "blue",
    popular: true,
    verified: true,
    features: ["Video conferencing", "Webinars", "Screen sharing", "Recording"],
    pricing: "Free/Paid plans",
    setupTime: "5 minutes",
    website: "https://zoom.us",
    documentation: "https://marketplace.zoom.us/docs/api-reference",
  },
  microsoftTeams: {
    id: "microsoftTeams",
    name: "Microsoft Teams",
    description: "Team communication and video meetings",
    category: "communication",
    icon: FaMicrosoft,
    color: "purple",
    popular: true,
    verified: true,
    features: [
      "Video calls",
      "Chat",
      "File sharing",
      "Integration with Office",
    ],
    pricing: "Free/Included with Office 365",
    setupTime: "10 minutes",
    website: "https://teams.microsoft.com",
    documentation: "https://docs.microsoft.com/en-us/microsoftteams/platform/",
  },

  // Email Marketing
  mailchimp: {
    id: "mailchimp",
    name: "Mailchimp",
    description: "Email marketing and newsletter automation",
    category: "email",
    icon: FaMailchimp,
    color: "yellow",
    popular: true,
    verified: true,
    features: ["Email campaigns", "Automation", "Analytics", "Templates"],
    pricing: "Free up to 2,000 contacts",
    setupTime: "15 minutes",
    website: "https://mailchimp.com",
    documentation: "https://mailchimp.com/developer/",
  },
  sendgrid: {
    id: "sendgrid",
    name: "SendGrid",
    description: "Reliable transactional email delivery service",
    category: "email",
    icon: SiSendgrid,
    color: "blue",
    popular: false,
    verified: true,
    features: ["Email delivery", "Templates", "Analytics", "API integration"],
    pricing: "Free up to 100 emails/day",
    setupTime: "20 minutes",
    website: "https://sendgrid.com",
    documentation: "https://docs.sendgrid.com/",
  },

  // Payments
  stripe: {
    id: "stripe",
    name: "Stripe",
    description: "Online payments and donation processing",
    category: "payment",
    icon: FaStripe,
    color: "purple",
    popular: true,
    verified: true,
    features: [
      "Online donations",
      "Recurring payments",
      "Analytics",
      "Mobile payments",
    ],
    pricing: "2.9% + 30¢ per transaction",
    setupTime: "30 minutes",
    website: "https://stripe.com",
    documentation: "https://stripe.com/docs",
  },
  paypal: {
    id: "paypal",
    name: "PayPal",
    description: "PayPal payment processing for donations",
    category: "payment",
    icon: FaPaypal,
    color: "blue",
    popular: true,
    verified: true,
    features: [
      "Donations",
      "Payment processing",
      "Invoicing",
      "Mobile payments",
    ],
    pricing: "2.9% + fixed fee per transaction",
    setupTime: "20 minutes",
    website: "https://paypal.com",
    documentation: "https://developer.paypal.com/",
  },

  // Church-Specific
  ccli: {
    id: "ccli",
    name: "CCLI",
    description: "Christian Copyright Licensing International",
    category: "church",
    icon: BuildingOfficeIcon,
    color: "green",
    popular: true,
    verified: true,
    features: [
      "Song licensing",
      "Reporting",
      "Lyrics database",
      "Copyright compliance",
    ],
    pricing: "Annual license fee",
    setupTime: "45 minutes",
    website: "https://ccli.com",
    documentation: "https://ccli.com/resources/",
  },
  planningCenter: {
    id: "planningCenter",
    name: "Planning Center",
    description: "Complete church management platform",
    category: "church",
    icon: BuildingOfficeIcon,
    color: "green",
    popular: true,
    verified: true,
    features: ["Service planning", "Check-ins", "Giving", "People management"],
    pricing: "Free/Paid plans",
    setupTime: "2 hours",
    website: "https://planningcenter.com",
    documentation: "https://developer.planningcenter.com/",
  },

  // Accounting
  quickbooks: {
    id: "quickbooks",
    name: "QuickBooks",
    description: "Accounting and financial management software",
    category: "accounting",
    icon: SiQuickbooks,
    color: "green",
    popular: true,
    verified: true,
    features: [
      "Bookkeeping",
      "Expense tracking",
      "Financial reports",
      "Tax preparation",
    ],
    pricing: "$15-200/month",
    setupTime: "1 hour",
    website: "https://quickbooks.intuit.com",
    documentation:
      "https://developer.intuit.com/app/developer/qbo/docs/api/accounting",
  },

  // Social Media & Streaming
  youtube: {
    id: "youtube",
    name: "YouTube",
    description: "Live streaming and video hosting platform",
    category: "social",
    icon: FaYoutube,
    color: "red",
    popular: true,
    verified: true,
    features: [
      "Live streaming",
      "Video hosting",
      "Analytics",
      "Community features",
    ],
    pricing: "Free",
    setupTime: "30 minutes",
    website: "https://youtube.com",
    documentation: "https://developers.google.com/youtube",
  },
  facebook: {
    id: "facebook",
    name: "Facebook",
    description: "Social media integration and live streaming",
    category: "social",
    icon: FaFacebook,
    color: "blue",
    popular: true,
    verified: true,
    features: [
      "Live streaming",
      "Event promotion",
      "Community building",
      "Pages management",
    ],
    pricing: "Free",
    setupTime: "20 minutes",
    website: "https://facebook.com",
    documentation: "https://developers.facebook.com/",
  },

  // SMS & Communication
  twilio: {
    id: "twilio",
    name: "Twilio",
    description: "SMS messaging and communication platform",
    category: "communication",
    icon: SiTwilio,
    color: "red",
    popular: false,
    verified: true,
    features: [
      "SMS messaging",
      "Voice calls",
      "Automation",
      "Two-way messaging",
    ],
    pricing: "Pay per message/call",
    setupTime: "45 minutes",
    website: "https://twilio.com",
    documentation: "https://www.twilio.com/docs",
  },
};

// Helper functions
export const getIntegrationsByCategory = (category) => {
  if (category === "all") return Object.values(INTEGRATION_DATABASE);
  if (category === "popular")
    return Object.values(INTEGRATION_DATABASE).filter((i) => i.popular);
  return Object.values(INTEGRATION_DATABASE).filter(
    (i) => i.category === category,
  );
};

export const searchIntegrations = (searchTerm) => {
  if (!searchTerm.trim()) return Object.values(INTEGRATION_DATABASE);

  const term = searchTerm.toLowerCase();
  return Object.values(INTEGRATION_DATABASE).filter(
    (integration) =>
      integration.name.toLowerCase().includes(term) ||
      integration.description.toLowerCase().includes(term) ||
      integration.features.some((feature) =>
        feature.toLowerCase().includes(term),
      ),
  );
};

export const getIntegrationById = (id) => {
  return INTEGRATION_DATABASE[id];
};

export const getCategoryStats = () => {
  return INTEGRATION_CATEGORIES.map((category) => ({
    ...category,
    count: getIntegrationsByCategory(category.id).length,
  }));
};
