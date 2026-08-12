#!/usr/bin/env node
/**
 * Drives the real UI in Chromium: fills the seven-step application the way a
 * driver would, submits it, then signs in to the dashboard and confirms the
 * record is there. Also captures mobile and desktop screenshots.
 *
 * Usage: node scripts/browser-test.mjs [baseUrl]
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = (process.argv[2] || "http://127.0.0.1:3000").replace(/\/$/, "");
const SHOTS = "screenshots";
mkdirSync(SHOTS, { recursive: true });

let passed = 0;
let failed = 0;
const failures = [];

function check(name, condition, detail = "") {
  if (condition) {
    passed++;
    console.log(`  \x1b[32m✓\x1b[0m ${name}`);
  } else {
    failed++;
    failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
    console.log(`  \x1b[31m✗\x1b[0m ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

function section(title) {
  console.log(`\n\x1b[1m${title}\x1b[0m`);
}

const stamp = Date.now();

async function fillByLabel(page, label, value) {
  await page.getByLabel(label, { exact: false }).first().fill(value);
}

async function run() {
  const browser = await chromium.launch();

  /* ---------------------------------------------------------------- mobile */
  section("1. Mobile rendering (390×844)");
  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const m = await mobile.newPage();
  await m.goto(BASE, { waitUntil: "networkidle" });

  const hasHorizontalScroll = await m.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1,
  );
  check("no horizontal overflow on mobile", !hasHorizontalScroll);

  const applyVisible = await m
    .getByRole("link", { name: /apply now/i })
    .first()
    .isVisible();
  check("Apply Now is visible without scrolling", applyVisible);

  // Touch targets. WCAG 2.2 SC 2.5.8 sets a 24px floor for any control; the
  // primary call to action is held to the stricter 44px comfort target.
  const targets = await m.evaluate(() => {
    const skip = (el) => el.classList.contains("skip-link");
    return [...document.querySelectorAll("a, button")]
      .filter((el) => !skip(el))
      .map((el) => {
        const r = el.getBoundingClientRect();
        return {
          h: Math.round(r.height),
          text: (el.innerText || el.getAttribute("aria-label") || "").slice(0, 30),
        };
      })
      .filter((t) => t.h > 0);
  });
  const under24 = targets.filter((t) => t.h < 24);
  check(
    "every control meets the 24px minimum target size",
    under24.length === 0,
    under24.map((t) => `${t.text} (${t.h}px)`).join(", "),
  );

  const cta = await m
    .getByRole("link", { name: /apply now/i })
    .first()
    .boundingBox();
  check(
    "the primary CTA is at least 44px tall",
    cta !== null && cta.height >= 44,
    `${Math.round(cta?.height ?? 0)}px`,
  );

  await m.screenshot({ path: `${SHOTS}/01-home-mobile.png`, fullPage: true });

  // Mobile menu
  await m.getByRole("button", { name: /open main menu/i }).click();
  await m.waitForTimeout(300);
  check(
    "mobile menu opens",
    await m.getByRole("navigation", { name: "Mobile" }).isVisible(),
  );
  await mobile.close();

  /* --------------------------------------------------------------- desktop */
  section("2. Desktop rendering (1440×900)");
  const desktop = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await desktop.newPage();

  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => consoleErrors.push(String(err)));

  await page.goto(BASE, { waitUntil: "networkidle" });
  check("homepage h1 is correct", /OTR CDL-A Truck Driver Jobs/.test(await page.locator("h1").innerText()));
  await page.screenshot({ path: `${SHOTS}/02-home-desktop.png`, fullPage: true });

  // Heading order: no level should be skipped.
  const headingOrder = await page.evaluate(() => {
    const levels = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].map((h) =>
      Number(h.tagName[1]),
    );
    for (let i = 1; i < levels.length; i++) {
      if (levels[i] - levels[i - 1] > 1) return false;
    }
    return levels[0] === 1;
  });
  check("heading hierarchy has no skipped levels", headingOrder);

  const imagesWithoutAlt = await page.evaluate(
    () => [...document.querySelectorAll("img")].filter((i) => !i.hasAttribute("alt")).length,
  );
  check("all images have alt text", imagesWithoutAlt === 0);

  // FAQ accordion
  await page.getByText("How much does this position pay?").click();
  await page.waitForTimeout(200);
  check(
    "FAQ expands",
    await page.getByText(/70–80 CPM \(cents per mile\)/).first().isVisible(),
  );

  /* ------------------------------------------------------------ the wizard */
  section("3. Application — step 1 (eligibility)");
  await page.getByRole("link", { name: /apply now/i }).first().click();
  await page.waitForFunction(
    () => location.pathname === "/apply",
    undefined,
    { timeout: 20000 },
  );
  await page.waitForLoadState("networkidle");
  check("navigated to the application", page.url().endsWith("/apply"));

  // Try to advance with nothing filled in — validation must stop us.
  await page.getByRole("button", { name: "Continue" }).click();
  await page.waitForTimeout(300);
  check(
    "empty step is blocked",
    await page.getByText(/correct the highlighted fields/i).isVisible(),
  );
  check(
    "still on step 1",
    (await page.getByText("Step 1 of 7").count()) > 0,
  );

  // Under-qualified applicant must be rejected with the company's minimum.
  await fillByLabel(page, "Months of CDL-A experience", "1");
  await fillByLabel(page, "Months of OTR experience", "1");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.waitForTimeout(300);
  check(
    "3-month CDL-A minimum is enforced in the browser",
    await page.getByText(/at least 3 months of CDL-A experience/i).isVisible(),
  );

  await fillByLabel(page, "Months of CDL-A experience", "26");
  await fillByLabel(page, "Months of OTR experience", "20");
  for (const label of [
    "I am at least 21 years old.",
    "I am legally authorized to work in the United States.",
    "I can stay out 3–4 weeks at a time.",
    "I understand this is a 1099 independent contractor position.",
    "I am able to pass a DOT drug screen.",
  ]) {
    await page.getByLabel(label).check();
  }
  await page.screenshot({ path: `${SHOTS}/03-apply-step1.png`, fullPage: true });
  await page.getByRole("button", { name: "Continue" }).click();

  section("4. Application — step 2 (personal)");
  await page.getByText("Step 2 of 7").waitFor();
  check("advanced to step 2", true);
  await fillByLabel(page, "First name", "Dana");
  await fillByLabel(page, "Last name", "Whitfield");
  await fillByLabel(page, "Email", `browser.test.${stamp}@example.com`);
  await fillByLabel(page, "Phone", "6145550199");
  await fillByLabel(page, "Date of birth", "1985-09-12");
  await fillByLabel(page, "Street address", "77 Riverside Drive");
  await fillByLabel(page, "City", "Dayton");
  await page.getByLabel("State", { exact: false }).first().selectOption("OH");
  await fillByLabel(page, "ZIP code", "45402");
  await page.getByRole("button", { name: "Continue" }).click();

  section("5. Application — step 3 (CDL)");
  await page.getByText("Step 3 of 7").waitFor();
  await fillByLabel(page, "CDL number", "OH5590231");
  await page.getByLabel("Issuing state").selectOption("OH");
  await fillByLabel(page, "CDL expiration date", "2030-01-31");

  // Freight is required — confirm the rule fires before selecting anything.
  await page.getByRole("button", { name: "Continue" }).click();
  await page.waitForTimeout(300);
  check(
    "freight experience is required",
    await page.getByText(/at least one type of freight/i).isVisible(),
  );

  await page.getByRole("checkbox", { name: "Dry Van" }).check();
  await page.getByRole("checkbox", { name: "Reefer" }).check();
  await page.getByRole("checkbox", { name: "Hazmat (H)" }).check();
  await page.getByRole("radio", { name: "Yes" }).first().check();
  await page.waitForTimeout(200);
  await fillByLabel(page, "Medical card expiration date", "2027-08-01");
  await page.screenshot({ path: `${SHOTS}/04-apply-step3.png`, fullPage: true });
  await page.getByRole("button", { name: "Continue" }).click();

  section("6. Application — step 4 (address history)");
  await page.getByText("Step 4 of 7").waitFor();
  await fillByLabel(page, "Street address", "77 Riverside Drive");
  await fillByLabel(page, "City", "Dayton");
  await page.getByLabel("State", { exact: false }).first().selectOption("OH");
  await fillByLabel(page, "ZIP code", "45402");
  await fillByLabel(page, "From", "2019-06-01");

  // Exercise the repeater.
  await page.getByRole("button", { name: /add another address/i }).click();
  await page.waitForTimeout(200);
  check(
    "a second address row is added",
    (await page.getByText("Address 2").count()) === 1,
  );
  await page.getByRole("button", { name: "Remove address" }).last().click();
  await page.waitForTimeout(200);
  check(
    "the second address row can be removed",
    (await page.getByText("Address 2").count()) === 0,
  );
  await page.getByRole("button", { name: "Continue" }).click();

  section("7. Application — step 5 (employment history)");
  await page.getByText("Step 5 of 7").waitFor();
  await fillByLabel(page, "Employer name", "Miami Valley Carriers");
  await fillByLabel(page, "Position held", "OTR Driver");
  await fillByLabel(page, "City", "Dayton");
  await page.getByLabel("State", { exact: false }).first().selectOption("OH");
  await fillByLabel(page, "Employer phone", "9375550143");
  await fillByLabel(page, "From", "2021-02-15");
  await page.getByRole("button", { name: "Continue" }).click();

  section("8. Application — step 6 (driving record)");
  await page.getByText("Step 6 of 7").waitFor();

  // Answer "Yes" to violations and confirm a row appears and is required.
  const violationGroup = page.getByRole("group", {
    name: /moving violations or traffic convictions/i,
  });
  await violationGroup.getByRole("radio", { name: "Yes" }).check();
  await page.waitForTimeout(300);
  check(
    "answering Yes reveals a violation row",
    (await page.getByText("Violation 1").count()) === 1,
  );
  await page.getByRole("button", { name: "Continue" }).click();
  await page.waitForTimeout(300);
  check(
    "an empty violation row blocks progress",
    await page.getByText(/correct the highlighted fields/i).isVisible(),
  );

  // Switch back to No and continue.
  await violationGroup.getByRole("radio", { name: "No" }).check();
  await page.waitForTimeout(200);
  await page.screenshot({ path: `${SHOTS}/05-apply-step6.png`, fullPage: true });
  await page.getByRole("button", { name: "Continue" }).click();

  section("9. Application — step 7 (review & sign)");
  await page.getByText("Step 7 of 7").waitFor();
  check(
    "summary shows the applicant name",
    await page.getByText("Dana Whitfield").first().isVisible(),
  );

  await page.getByLabel("How did you hear about us?").selectOption("Facebook");

  for (const partial of [
    "I certify that the information",
    "I authorize Top Miles Logistics",
    "I consent to a query of the FMCSA",
  ]) {
    await page.getByLabel(new RegExp(partial, "i")).check();
  }

  // A mismatched signature must be rejected.
  await fillByLabel(page, "Electronic signature", "D. Whitfield");
  await page.getByRole("button", { name: /submit application/i }).click();
  await page.waitForTimeout(500);
  check(
    "a mismatched signature is rejected",
    await page
      .getByText(
        "Type your full legal name exactly as entered on the personal information step",
      )
      .isVisible(),
  );

  await fillByLabel(page, "Electronic signature", "Dana Whitfield");
  await page.screenshot({ path: `${SHOTS}/06-apply-step7.png`, fullPage: true });

  section("10. Submission & confirmation");
  await page.getByRole("button", { name: /submit application/i }).click();
  // App Router does a soft navigation here, so wait on the URL itself rather
  // than a document load event.
  await page.waitForFunction(
    () => location.pathname.startsWith("/apply/submitted"),
    undefined,
    { timeout: 20000 },
  );
  await page.waitForLoadState("networkidle");
  check("redirected to the confirmation page", page.url().includes("/apply/submitted"));
  check(
    "confirmation is shown",
    await page.getByRole("heading", { name: /application received/i }).isVisible(),
  );
  const reference = (await page.locator("span.font-mono").first().innerText()).trim();
  check("a reference number is shown", /^[A-Z0-9]{8}$/.test(reference), reference);
  await page.screenshot({ path: `${SHOTS}/07-confirmation.png`, fullPage: true });

  section("11. Admin dashboard");
  await page.goto(`${BASE}/admin`, { waitUntil: "networkidle" });
  check("anonymous access redirects to sign-in", page.url().includes("/admin/login"));

  await page.getByLabel("Email").fill("recruiting@topmileslogistics.test");
  await page.getByLabel("Password").fill("TopMilesTest!2026#e2e");
  await page.screenshot({ path: `${SHOTS}/08-admin-login.png` });
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForFunction(
    () => location.pathname === "/admin",
    undefined,
    { timeout: 20000 },
  );
  await page.waitForLoadState("networkidle");
  check("sign-in succeeds", page.url().endsWith("/admin"));

  check(
    "the new application is listed",
    await page.getByRole("link", { name: "Dana Whitfield" }).isVisible(),
  );
  await page.screenshot({ path: `${SHOTS}/09-admin-dashboard.png`, fullPage: true });

  // Search
  await page.getByLabel("Search").fill("Whitfield");
  await page.getByRole("button", { name: "Apply" }).click();
  await page.waitForLoadState("networkidle");
  check(
    "search finds the applicant",
    await page.getByRole("link", { name: "Dana Whitfield" }).isVisible(),
  );

  // Phone search takes a different code path (digits only), so exercise it.
  await page.getByLabel("Search").fill("6145550199");
  await page.getByRole("button", { name: "Apply" }).click();
  await page.waitForLoadState("networkidle");
  check(
    "search by phone number finds the applicant",
    await page.getByRole("link", { name: "Dana Whitfield" }).isVisible(),
  );

  await page.getByLabel("Search").fill("Dayton");
  await page.getByRole("button", { name: "Apply" }).click();
  await page.waitForLoadState("networkidle");
  check(
    "search by city finds the applicant",
    await page.getByRole("link", { name: "Dana Whitfield" }).isVisible(),
  );

  await page.getByLabel("Search").fill("zzz-nobody-by-this-name");
  await page.getByRole("button", { name: "Apply" }).click();
  await page.waitForLoadState("networkidle");
  check(
    "search with no matches shows an empty state",
    await page.getByText(/no applications found/i).isVisible(),
  );

  section("12. Application detail & status update");
  await page.goto(`${BASE}/admin`, { waitUntil: "networkidle" });
  await page.getByRole("link", { name: "Dana Whitfield" }).click();
  await page.waitForFunction(
    () => location.pathname.startsWith("/admin/applications/"),
    undefined,
    { timeout: 20000 },
  );
  await page.waitForLoadState("networkidle");
  check("detail page opens", true);
  check(
    "CDL details are shown",
    await page.getByText("OH5590231").isVisible(),
  );
  check(
    "employment history is shown",
    await page.getByText("Miami Valley Carriers").isVisible(),
  );
  check(
    "the signature is recorded",
    await page.getByText("Dana Whitfield").first().isVisible(),
  );
  await page.screenshot({ path: `${SHOTS}/10-admin-detail.png`, fullPage: true });

  await page.getByLabel("Status").selectOption("CONTACTED");
  await page
    .getByLabel("Internal notes")
    .fill("Called and left a voicemail. Verified 26 months CDL-A.");
  await page.getByRole("button", { name: "Save" }).click();
  await page.waitForTimeout(1500);
  check("status update saves", await page.getByText("Saved.").isVisible());

  await page.reload({ waitUntil: "networkidle" });
  check(
    "the new status persists after reload",
    await page.getByText("Contacted").first().isVisible(),
  );
  check(
    "internal notes persist",
    (await page.getByLabel("Internal notes").inputValue()).includes("voicemail"),
  );
  await page.screenshot({ path: `${SHOTS}/11-admin-detail-updated.png`, fullPage: true });

  section("13. Sign out");
  await page.getByRole("button", { name: /sign out/i }).click();
  await page.waitForFunction(
    () => location.pathname.startsWith("/admin/login"),
    undefined,
    { timeout: 20000 },
  );
  await page.waitForLoadState("networkidle");
  check("sign-out returns to the login page", page.url().includes("/admin/login"));

  await page.goto(`${BASE}/admin`, { waitUntil: "networkidle" });
  check(
    "the session is really gone",
    page.url().includes("/admin/login"),
  );

  section("14. Console health");
  const realErrors = consoleErrors.filter(
    (e) => !/favicon|Download the React DevTools|hydrat.*extension/i.test(e),
  );
  check(
    "no JavaScript errors during the whole flow",
    realErrors.length === 0,
    realErrors.slice(0, 3).join(" | "),
  );

  await browser.close();

  console.log(`\n${"=".repeat(50)}`);
  console.log(`\x1b[1m${passed} passed, ${failed} failed\x1b[0m`);
  if (failures.length) {
    console.log("\nFailures:");
    for (const f of failures) console.log(`  • ${f}`);
  }
  console.log(`\nScreenshots written to ./${SHOTS}/`);
  process.exit(failed === 0 ? 0 : 1);
}

run().catch(async (error) => {
  console.error("\nBrowser test crashed:", error);
  process.exit(1);
});
