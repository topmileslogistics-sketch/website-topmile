#!/usr/bin/env node
/**
 * End-to-end check of the full flow:
 *
 *   Homepage → Apply → Validation → Submission → Confirmation → Admin dashboard
 *
 * Plus the security behaviour that matters: auth gates, duplicate prevention,
 * spam traps and SEO endpoints.
 *
 * Usage:  node scripts/e2e-test.mjs [baseUrl]
 * The server must already be running, with a migrated database.
 */

const BASE = (process.argv[2] || "http://127.0.0.1:3000").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD;

let passed = 0;
let failed = 0;
const failures = [];

function check(name, condition, detail = "") {
  if (condition) {
    passed++;
    console.log(`  \x1b[32m✓\x1b[0m ${name}`);
  } else {
    failed++;
    failures.push(name);
    console.log(`  \x1b[31m✗\x1b[0m ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

function section(title) {
  console.log(`\n\x1b[1m${title}\x1b[0m`);
}

const token = () =>
  [...crypto.getRandomValues(new Uint8Array(16))]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

const unique = Date.now();

function validApplication(overrides = {}) {
  return {
    submissionToken: token(),
    website: "",
    elapsedMs: 120000,

    isAtLeast21: true,
    legallyAuthorized: true,
    monthsCdlExperience: "18",
    monthsOtrExperience: "12",
    canStayOut3To4Weeks: true,
    understands1099: true,
    canPassDrugScreen: true,
    inSapProgram: false,
    sapStep: "",
    needsTransportAssistance: true,

    firstName: "Marcus",
    lastName: "Reed",
    email: `e2e.driver.${unique}@example.com`,
    phone: "(614) 555-0142",
    dateOfBirth: "1988-04-17",
    addressLine1: "1420 Buckeye Road",
    addressLine2: "",
    city: "Columbus",
    state: "OH",
    postalCode: "43215",

    cdlNumber: "OH8842119",
    cdlState: "OH",
    cdlExpiration: "2029-06-30",
    endorsements: ["Tanker (N)"],
    freightExperience: ["Dry Van", "Reefer"],
    hasValidMedicalCard: true,
    medicalCardExpiration: "2027-02-11",

    addressHistory: [
      {
        addressLine1: "1420 Buckeye Road",
        city: "Columbus",
        state: "OH",
        postalCode: "43215",
        fromDate: "2021-03-01",
        toDate: "",
        isCurrent: true,
      },
    ],

    employmentHistory: [
      {
        employerName: "Great Lakes Freight",
        position: "OTR Driver",
        city: "Toledo",
        state: "OH",
        phone: "4195550188",
        fromDate: "2022-01-10",
        toDate: "",
        isCurrent: true,
        reasonForLeaving: "",
        wasSafetySensitive: true,
        wasSubjectToDrugTesting: true,
      },
    ],
    hasEmploymentGaps: false,
    employmentGapExplanation: "",

    hasAccidents: false,
    accidents: [],
    hasViolations: false,
    violations: [],
    licenseEverSuspended: false,
    licenseEverDenied: false,
    recordExplanation: "",

    certifiesAccurate: true,
    consentsToBackgroundCheck: true,
    consentsToFmcsaQuery: true,
    signature: "Marcus Reed",
    referralSource: "Google search",
    notes: "Submitted by the automated end-to-end test.",

    ...overrides,
  };
}

async function post(path, body, headers = {}) {
  return fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
    redirect: "manual",
  });
}

/* -------------------------------------------------------------------------- */

async function run() {
  console.log(`\nTesting ${BASE}\n${"=".repeat(50)}`);

  /* ---- Public pages ---- */
  section("1. Homepage");
  const home = await fetch(BASE);
  const homeHtml = await home.text();
  check("returns 200", home.status === 200, `got ${home.status}`);
  check(
    "has the SEO title",
    /<title>[^<]*OTR CDL-A Truck Driver Jobs in Ohio[^<]*Top Miles Logistics/i.test(
      homeHtml,
    ),
  );
  check(
    "has a meta description",
    /<meta name="description" content="[^"]{80,}"/i.test(homeHtml),
  );
  check("has exactly one <h1>", (homeHtml.match(/<h1/g) || []).length === 1);
  check("has Open Graph tags", /property="og:title"/i.test(homeHtml));
  check("has a Twitter card", /name="twitter:card"/i.test(homeHtml));
  check(
    "has JobPosting structured data",
    /"@type":"JobPosting"/.test(homeHtml),
  );
  check("has FAQ structured data", /"@type":"FAQPage"/.test(homeHtml));
  check("links to the application", /href="\/apply"/.test(homeHtml));
  check(
    "shows the real phone number",
    homeHtml.includes("(929) 706-4042"),
  );
  check(
    "shows confirmed pay information",
    homeHtml.includes("70–80 CPM") || homeHtml.includes("70–80 CPM"),
  );
  check(
    "invents no testimonials",
    !/testimonial|"[^"]{20,}"\s*—\s*[A-Z][a-z]+ [A-Z]\./i.test(homeHtml),
  );
  check(
    "security headers present",
    home.headers.get("x-frame-options") === "DENY" &&
      Boolean(home.headers.get("content-security-policy")),
  );

  section("2. Apply page");
  const apply = await fetch(`${BASE}/apply`);
  const applyHtml = await apply.text();
  check("returns 200", apply.status === 200, `got ${apply.status}`);
  check("renders the form", /Months of CDL-A experience/.test(applyHtml));
  check("has a canonical URL", /rel="canonical"/.test(applyHtml));

  /* ---- Auth gates (before anything is stored) ---- */
  section("3. Admin is locked down");
  const adminAnon = await fetch(`${BASE}/admin`, { redirect: "manual" });
  check(
    "GET /admin redirects anonymous users",
    adminAnon.status === 307 || adminAnon.status === 302,
    `got ${adminAnon.status}`,
  );
  check(
    "redirect targets the login page",
    (adminAnon.headers.get("location") || "").includes("/admin/login"),
  );

  const exportAnon = await fetch(`${BASE}/api/admin/export`, {
    redirect: "manual",
  });
  check(
    "CSV export returns 401 without a session",
    exportAnon.status === 401,
    `got ${exportAnon.status}`,
  );

  const detailAnon = await fetch(`${BASE}/admin/applications/abc123`, {
    redirect: "manual",
  });
  check(
    "application detail redirects anonymous users",
    detailAnon.status === 307 || detailAnon.status === 302,
    `got ${detailAnon.status}`,
  );

  /* ---- Validation ---- */
  section("4. Server-side validation");

  const empty = await post("/api/apply", {
    submissionToken: token(),
    elapsedMs: 60000,
  });
  const emptyBody = await empty.json();
  check("rejects an empty submission", empty.status === 422, `got ${empty.status}`);
  check(
    "returns per-field errors",
    emptyBody.fieldErrors && Object.keys(emptyBody.fieldErrors).length > 5,
  );

  const badEmail = await post(
    "/api/apply",
    validApplication({ email: "not-an-email" }),
  );
  const badEmailBody = await badEmail.json();
  check("rejects a malformed email", badEmail.status === 422);
  check(
    "names the email field",
    Boolean(badEmailBody.fieldErrors?.email),
  );

  const tooGreen = await post(
    "/api/apply",
    validApplication({ monthsCdlExperience: "1", monthsOtrExperience: "1" }),
  );
  const tooGreenBody = await tooGreen.json();
  check(
    "enforces the 3-month CDL-A minimum",
    tooGreen.status === 422 &&
      /3 months/.test(tooGreenBody.fieldErrors?.monthsCdlExperience ?? ""),
  );

  const badSignature = await post(
    "/api/apply",
    validApplication({ signature: "Someone Else" }),
  );
  check(
    "requires the signature to match the applicant name",
    badSignature.status === 422,
  );

  const noConsent = await post(
    "/api/apply",
    validApplication({ consentsToFmcsaQuery: false }),
  );
  check("requires FMCSA consent", noConsent.status === 422);

  section("5. Spam and abuse defences");

  const honeypot = await post(
    "/api/apply",
    validApplication({ website: "https://spam.example" }),
  );
  check(
    "honeypot field blocks the submission",
    honeypot.status === 422,
    `got ${honeypot.status}`,
  );

  const tooFast = await post("/api/apply", validApplication({ elapsedMs: 300 }));
  check(
    "impossibly fast submissions are blocked",
    tooFast.status === 400,
    `got ${tooFast.status}`,
  );

  const crossSite = await post("/api/apply", validApplication(), {
    Origin: "https://evil.example",
  });
  check(
    "cross-origin submissions are blocked",
    crossSite.status === 403,
    `got ${crossSite.status}`,
  );

  const wrongMethod = await fetch(`${BASE}/api/apply`);
  check("GET /api/apply is rejected", wrongMethod.status === 405);

  /* ---- Successful submission ---- */
  section("6. Submission");

  const payload = validApplication();
  const created = await post("/api/apply", payload);
  const createdBody = await created.json();
  check("accepts a valid application", created.status === 201, `got ${created.status} ${JSON.stringify(createdBody).slice(0, 300)}`);
  check("returns ok", createdBody.ok === true);
  check(
    "returns a reference number",
    typeof createdBody.reference === "string" &&
      createdBody.reference.length === 8,
  );
  check(
    "does not echo back stored data",
    !JSON.stringify(createdBody).includes(payload.cdlNumber),
  );

  section("7. Duplicate prevention");

  const replay = await post("/api/apply", payload);
  const replayBody = await replay.json();
  check(
    "replaying the same token is idempotent (no second record)",
    replay.status === 200 && replayBody.duplicate === true,
    `got ${replay.status}`,
  );
  check(
    "the replay returns the original reference",
    replayBody.reference === createdBody.reference,
  );

  const sameEmail = await post(
    "/api/apply",
    validApplication({ submissionToken: token() }),
  );
  const sameEmailBody = await sameEmail.json();
  check(
    "a second application from the same email is refused",
    sameEmail.status === 409,
    `got ${sameEmail.status}`,
  );
  check("the refusal is explained to the driver", Boolean(sameEmailBody.error));

  section("8. Confirmation page");
  const confirm = await fetch(
    `${BASE}/apply/submitted?ref=${createdBody.reference}`,
  );
  const confirmHtml = await confirm.text();
  check("returns 200", confirm.status === 200);
  check("confirms receipt", /Application received/i.test(confirmHtml));
  check(
    "shows the reference number",
    confirmHtml.includes(createdBody.reference),
  );
  check("is excluded from search engines", /noindex/i.test(confirmHtml));

  /* ---- Admin ---- */
  section("9. Admin sign-in");

  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.log(
      "  ! Skipping — set ADMIN_EMAIL and E2E_ADMIN_PASSWORD to test the dashboard",
    );
  } else {
    const badLogin = await post("/api/auth/login", {
      email: ADMIN_EMAIL,
      password: "definitely-the-wrong-password",
    });
    check("rejects a wrong password", badLogin.status === 401);
    const badBody = await badLogin.json();
    check(
      "the error does not reveal which field was wrong",
      /invalid email or password/i.test(badBody.error ?? ""),
    );

    const login = await post("/api/auth/login", {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });
    check("accepts the correct password", login.status === 200, `got ${login.status}`);

    const setCookie = login.headers.get("set-cookie") || "";
    check("sets an httpOnly session cookie", /httponly/i.test(setCookie));
    check("sets SameSite on the cookie", /samesite=lax/i.test(setCookie));

    const cookie = setCookie.split(";")[0];

    section("10. Dashboard");
    const dash = await fetch(`${BASE}/admin`, { headers: { cookie } });
    const dashHtml = await dash.text();
    check("dashboard loads with a session", dash.status === 200, `got ${dash.status}`);
    check(
      "the new application appears",
      dashHtml.includes("Marcus") && dashHtml.includes("Reed"),
    );
    check("is marked noindex", /noindex/i.test(dashHtml));
    check(
      "is not cached by shared caches",
      /no-store/i.test(dash.headers.get("cache-control") || ""),
    );

    const idMatch = dashHtml.match(/\/admin\/applications\/([a-z0-9]{20,40})/i);
    check("links through to the detail page", Boolean(idMatch));

    if (idMatch) {
      const detail = await fetch(`${BASE}/admin/applications/${idMatch[1]}`, {
        headers: { cookie },
      });
      const detailHtml = await detail.text();
      check("detail page loads", detail.status === 200);
      check(
        "shows the full application",
        detailHtml.includes("OH8842119") &&
          detailHtml.includes("Great Lakes Freight"),
      );
      check(
        "shows the certification",
        /Certification/i.test(detailHtml),
      );
    }

    const csv = await fetch(`${BASE}/api/admin/export`, {
      headers: { cookie },
    });
    const csvText = await csv.text();
    check("CSV export works with a session", csv.status === 200);
    check(
      "CSV is served as a download",
      (csv.headers.get("content-disposition") || "").includes("attachment"),
    );
    check("CSV contains the applicant", csvText.includes("Marcus"));

    section("11. Sign out");
    const logout = await fetch(`${BASE}/api/auth/logout`, {
      method: "POST",
      headers: { cookie },
    });
    check("logout succeeds", logout.status === 200);
    const cleared = logout.headers.get("set-cookie") || "";
    check(
      "the session cookie is cleared",
      /tml_admin_session=;/.test(cleared) || /max-age=0/i.test(cleared),
    );
  }

  /* ---- SEO endpoints ---- */
  section("12. SEO endpoints");

  const robots = await fetch(`${BASE}/robots.txt`);
  const robotsText = await robots.text();
  check("robots.txt is served", robots.status === 200);
  check("robots.txt disallows /admin", /Disallow:\s*\/admin/.test(robotsText));
  check("robots.txt references the sitemap", /Sitemap:/i.test(robotsText));

  const sitemap = await fetch(`${BASE}/sitemap.xml`);
  const sitemapText = await sitemap.text();
  check("sitemap.xml is served", sitemap.status === 200);
  check("sitemap lists /apply", sitemapText.includes("/apply"));
  check("sitemap omits /admin", !sitemapText.includes("/admin"));

  const og = await fetch(`${BASE}/opengraph-image`);
  check("Open Graph image renders", og.status === 200, `got ${og.status}`);
  check(
    "Open Graph image is a PNG",
    (og.headers.get("content-type") || "").includes("image/png"),
  );

  const icon = await fetch(`${BASE}/icon.svg`);
  check("favicon is served", icon.status === 200);

  const missing = await fetch(`${BASE}/this-page-does-not-exist`);
  check("unknown URLs return 404", missing.status === 404);

  const privacy = await fetch(`${BASE}/privacy`);
  check("privacy policy is served", privacy.status === 200);

  /* ---- Summary ---- */
  console.log(`\n${"=".repeat(50)}`);
  console.log(
    `\x1b[1m${passed} passed, ${failed} failed\x1b[0m`,
  );
  if (failures.length) {
    console.log("\nFailures:");
    for (const f of failures) console.log(`  • ${f}`);
  }
  process.exit(failed === 0 ? 0 : 1);
}

run().catch((error) => {
  console.error("\nTest run crashed:", error);
  process.exit(1);
});
