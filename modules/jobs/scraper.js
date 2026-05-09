const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

/**
 * Scrapes LinkedIn for Marketing/Digital/Sales jobs in Barbados.
 * Uses the saved linkedin_state.json for authentication.
 */
const scrapeLinkedIn = async (context) => {
    const page = await context.newPage();
    const url = "https://www.linkedin.com/jobs/search/?keywords=Marketing&location=Barbados&f_AL=true";

    try {
        console.log("  [LinkedIn] Navigating...");
        await page.goto(url, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(5000);

        // LinkedIn may redirect to login if cookies expired
        if (page.url().includes('/login') || page.url().includes('/checkpoint')) {
            console.error("  [LinkedIn] Session expired. linkedin_state.json needs to be refreshed.");
            return [];
        }

        await page.waitForSelector(".job-card-container", { timeout: 12000 });
        const jobCards = await page.locator(".job-card-container").all();
        const results = [];

        for (const card of jobCards.slice(0, 5)) {
            try {
                const linkEl = card.locator("a.job-card-list__title--link, a.job-card-container__link").first();
                const href = await linkEl.getAttribute("href");
                if (!href) continue;

                const jobId = href.includes("view/")
                    ? href.split("view/")[1].split("/")[0].split("?")[0]
                    : null;
                if (!jobId) continue;

                const title = (await linkEl.textContent()).trim();

                const companyEl = card.locator(
                    ".job-card-container__primary-description, .artdeco-entity-lockup__subtitle span"
                ).first();
                const company = (await companyEl.count()) > 0
                    ? (await companyEl.textContent()).trim()
                    : "Unknown Company";

                results.push({
                    id: `li_${jobId}`,
                    title,
                    company,
                    url: `https://www.linkedin.com/jobs/view/${jobId}/`,
                    summary: `${title} at ${company} — via LinkedIn.`,
                    location: "Barbados",
                    source: "LinkedIn"
                });
            } catch (e) {
                console.error("  [LinkedIn] Card parse error:", e.message);
            }
        }

        console.log(`  [LinkedIn] Found ${results.length} jobs.`);
        return results;

    } catch (e) {
        console.error("  [LinkedIn] Scrape failed:", e.message);
        return [];
    } finally {
        await page.close();
    }
};

/**
 * Scrapes CaribbeanJobs for Marketing jobs in Barbados.
 * Uses the correct ShowResults.aspx URL with Barbados location filter.
 * Job listing selectors confirmed from live HTML: h2 > a and company link.
 */
const scrapeCaribbeanJobs = async (browser) => {
    const page = await browser.newPage();
    // Confirmed working URL from live page fetch
    const url = "https://www.caribbeanjobs.com/ShowResults.aspx?Keywords=Marketing&Location=Barbados&perpage=10&Page=1";

    try {
        console.log("  [CaribbeanJobs] Navigating...");
        await page.goto(url, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(4000);

        // Job listings appear as: <h2><a href="/Job-Title-Job-12345.aspx">Title</a></h2>
        // followed by a company link
        const jobLinks = await page.locator(".job-result-title a, h2 a[href*='-Job-']").all();
        const results = [];

        for (const link of jobLinks.slice(0, 5)) {
            try {
                const title = (await link.textContent()).trim();
                const href = await link.getAttribute("href");
                if (!href || !title) continue;

                const fullUrl = href.startsWith("http")
                    ? href
                    : `https://www.caribbeanjobs.com${href}`;

                // Try to get company from sibling element
                const parent = link.locator("..").locator("..");
                const companyEl = parent.locator("a[href*='-Jobs-']").first();
                const company = (await companyEl.count()) > 0
                    ? (await companyEl.textContent()).trim()
                    : "Caribbean Employer";

                // Generate a stable ID from the URL
                const jobId = href.match(/Job-(\d+)/)?.[1] || Math.random().toString(36).substr(2, 9);

                results.push({
                    id: `cj_${jobId}`,
                    title,
                    company,
                    url: fullUrl,
                    summary: `${title} at ${company} — via CaribbeanJobs.`,
                    location: "Barbados",
                    source: "CaribbeanJobs"
                });
            } catch (e) {
                console.error("  [CaribbeanJobs] Item parse error:", e.message);
            }
        }

        console.log(`  [CaribbeanJobs] Found ${results.length} jobs.`);
        return results;

    } catch (e) {
        console.error("  [CaribbeanJobs] Scrape failed:", e.message);
        return [];
    } finally {
        await page.close();
    }
};

/**
 * Scrapes the Barbados Job Register (government portal) — no login required.
 * URL: https://barbadosjobregister.gov.bb
 */
const scrapeBarbadosJobRegister = async (browser) => {
    const page = await browser.newPage();
    const url = "https://barbadosjobregister.gov.bb/vacancy/search?search=marketing";

    try {
        console.log("  [BarbadosJobRegister] Navigating...");
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
        await page.waitForTimeout(4000);

        // Try various common selectors for government job portals
        const jobItems = await page.locator(
            ".vacancy-card, .job-card, article.vacancy, .job-listing, tr.vacancy"
        ).all();

        const results = [];

        for (const item of jobItems.slice(0, 5)) {
            try {
                const titleEl = item.locator("h2, h3, .vacancy-title, .job-title, td a").first();
                const title = (await titleEl.textContent()).trim();
                const href = await titleEl.locator("a").first().getAttribute("href").catch(() => null)
                    || await item.locator("a").first().getAttribute("href").catch(() => null);

                if (!title) continue;

                const fullUrl = href
                    ? (href.startsWith("http") ? href : `https://barbadosjobregister.gov.bb${href}`)
                    : url;

                const companyEl = item.locator(".employer, .company, .organisation").first();
                const company = (await companyEl.count()) > 0
                    ? (await companyEl.textContent()).trim()
                    : "Barbados Employer";

                results.push({
                    id: `bjr_${Math.random().toString(36).substr(2, 9)}`,
                    title,
                    company,
                    url: fullUrl,
                    summary: `${title} at ${company} — via Barbados Job Register.`,
                    location: "Barbados",
                    source: "BarbadosJobRegister"
                });
            } catch (e) {
                console.error("  [BarbadosJobRegister] Item parse error:", e.message);
            }
        }

        console.log(`  [BarbadosJobRegister] Found ${results.length} jobs.`);
        return results;

    } catch (e) {
        console.error("  [BarbadosJobRegister] Scrape failed:", e.message);
        return [];
    } finally {
        await page.close();
    }
};

/**
 * Main scraper — combines LinkedIn, CaribbeanJobs, and Barbados Job Register.
 */
const scrapeJobs = async () => {
    console.log("\n🔍 Starting multi-source job scrape (Barbados focus)...");

    const statePath = path.resolve(__dirname, '../../linkedin_state.json');
    const browser = await chromium.launch({ headless: true });

    const liContext = fs.existsSync(statePath)
        ? await browser.newContext({ storageState: statePath })
        : await browser.newContext();

    // Run all scrapers in parallel for speed
    const [linkedInJobs, cjJobs, bjrJobs] = await Promise.all([
        scrapeLinkedIn(liContext),
        scrapeCaribbeanJobs(browser),
        scrapeBarbadosJobRegister(browser)
    ]);

    await browser.close();

    const allJobs = [...linkedInJobs, ...cjJobs, ...bjrJobs];
    console.log(`✅ Scrape finished. Total: ${allJobs.length} jobs found.\n`);
    return allJobs;
};

module.exports = { scrapeJobs };
