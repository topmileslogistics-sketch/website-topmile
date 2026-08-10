import { siteConfig, isPlaceholder } from "@/config/site";

/**
 * schema.org JSON-LD.
 *
 * Only facts supplied by Top Miles Logistics are emitted. Fields we do not
 * have confirmed values for (street address, email, founding date, employee
 * count) are omitted entirely rather than guessed — bad structured data is
 * worse than none, and Google penalises job postings that misstate terms.
 */

function jsonLd(data: Record<string, unknown>) {
  return {
    // JSON.stringify escaping plus the `<` replacement prevents a
    // </script> sequence from ever breaking out of the tag.
    __html: JSON.stringify(data).replace(/</g, "\\u003c"),
  };
}

export function OrganizationSchema() {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
    telephone: siteConfig.phone,
    address: {
      "@type": "PostalAddress",
      addressRegion: siteConfig.stateAbbr,
      addressCountry: "US",
    },
    areaServed: "US",
  };

  if (!isPlaceholder(siteConfig.email)) {
    data.email = siteConfig.email;
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={jsonLd(data)}
    />
  );
}

export function JobPostingSchema() {
  // Google requires datePosted; a rolling window keeps the listing fresh
  // without claiming a specific posting history we do not have.
  const now = new Date();
  const datePosted = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
  const validThrough = new Date(now.getFullYear(), now.getMonth() + 3, 1)
    .toISOString()
    .slice(0, 10);

  const data = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: "OTR CDL-A Truck Driver — Dry Van & Reefer",
    description: [
      `<p>${siteConfig.name} is hiring OTR CDL-A truck drivers to haul Dry Van and Reefer freight.</p>`,
      "<ul>",
      `<li>Pay: ${siteConfig.payRangeNote}</li>`,
      `<li>Pay schedule: ${siteConfig.paySchedule}.</li>`,
      `<li>Miles: ${siteConfig.weeklyMiles}.</li>`,
      `<li>Freight: ${siteConfig.freightMix}.</li>`,
      `<li>Home time: ${siteConfig.homeTime}.</li>`,
      `<li>${siteConfig.sapPolicy}.</li>`,
      `<li>${siteConfig.transportAssistance}.</li>`,
      `<li>${siteConfig.employmentTypeNote}</li>`,
      "</ul>",
      "<p><strong>Requirements:</strong> Valid Class A CDL, minimum 3 months CDL-A experience, minimum 1 month OTR experience.</p>",
    ].join(""),
    datePosted,
    validThrough,
    employmentType: "CONTRACTOR",
    industry: "Transportation and Trucking",
    occupationalCategory: "53-3032.00 Heavy and Tractor-Trailer Truck Drivers",
    hiringOrganization: {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.url,
      telephone: siteConfig.phone,
    },
    jobLocationType: "TELECOMMUTE",
    applicantLocationRequirements: {
      "@type": "Country",
      name: "United States",
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressRegion: siteConfig.stateAbbr,
        addressCountry: "US",
      },
    },
    baseSalary: {
      "@type": "MonetaryAmount",
      currency: "USD",
      value: {
        "@type": "QuantitativeValue",
        minValue: 0.7,
        maxValue: 0.8,
        unitText: "MILE",
      },
    },
    directApply: true,
    url: `${siteConfig.url}/apply`,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={jsonLd(data)}
    />
  );
}

export function FaqSchema({
  faqs,
}: {
  faqs: ReadonlyArray<{ question: string; answer: string }>;
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={jsonLd(data)}
    />
  );
}
