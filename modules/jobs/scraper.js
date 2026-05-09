const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

/**
 * Scrapes LinkedIn for Marketing jobs in Barbados.
 */
const scrapeLinkedIn = async (context) => {
    const page = await context.newPage();
    const url = "https://www.linkedin.com/jobs/search/?keywords=Marketing&location=Barbados&f_AL=true";
    
    try {
        await page.goto(url);
        await page.waitForTimeout(4000);
        await page.waitForSelector(".job-card-container", { timeout: 10000 });
        
        const jobCards = await page.locator(".job-card-container").all();
        const results = [];
        
        for (const card of jobCards.slice(0, 5)) {
            try {
                const linkEl = card.locator("a.job-card-list__title, a.job-card-container__link").first();
                const href = await linkEl.getAttribute("href");
                const jobId = href.includes("view/") ? href.split("view/")[1].split("/")[0].split("?")[0] : "unknown";
                const title = (await linkEl.textContent()).trim();
                const companyEl = card.locator(".job-card-container__primary-description, .artdeco-entity-lockup__subtitle").first();
                const company = (await companyEl.count()) > 0 ? (await companyEl.textContent()).trim() : "Unknown Company";
                
                if (jobId !== "unknown") {
                    results.push({
                        id: `li_${jobId}`,
                        title,
                        company,
                        url: `https://www.linkedin.com/jobs/view/${jobId}/`,
                        summary: `LinkedIn Lead: ${title} at ${company}.`,
                        location: "Barbados",
                        source: "LinkedIn"
                    });
                }
            } catch (e) {}
        }
        return results;
    } catch (e) {
        console.error("LinkedIn scrape failed:", e.message);
        return [];
    } finally {
        await page.close();
    }
};

/**
 * Scrapes CaribbeanJobs for Marketing jobs in Barbados.
 */
const scrapeCaribbeanJobs = async (browser) => {
    const page = await browser.newPage();
    const url = "https://www.caribbeanjobs.com/jobs/barbados/marketing";
    
    try {
        await page.goto(url);
        await page.waitForTimeout(4000);
        
        const jobItems = await page.locator(".job-result").all();
        const results = [];
        
        for (const item of jobItems.slice(0, 5)) {
            try {
                const titleEl = item.locator("h2 a").first();
                const title = (await titleEl.textContent()).trim();
                const href = await titleEl.getAttribute("href");
                const companyEl = item.locator(".job-result-overview li a").first();
                const company = (await companyEl.count()) > 0 ? (await companyEl.textContent()).trim() : "Confidential";
                
                results.push({
                    id: `cj_${Math.random().toString(36).substr(2, 9)}`,
                    title,
                    company,
                    url: href.startsWith("http") ? href : `https://www.caribbeanjobs.com${href}`,
                    summary: `CaribbeanJobs Lead: ${title} at ${company}.`,
                    location: "Barbados",
                    source: "CaribbeanJobs"
                });
            } catch (e) {}
        }
        return results;
    } catch (e) {
        console.error("CaribbeanJobs scrape failed:", e.message);
        return [];
    } finally {
        await page.close();
    }
};

/**
 * Scrapes BajanJobs for vacancies.
 */
const scrapeBajanJobs = async (browser) => {
    const page = await browser.newPage();
    const url = "https://bajanjobs.com/vacancies/";
    
    try {
        await page.goto(url);
        await page.waitForTimeout(4000);
        
        const jobItems = await page.locator(".vacancy-item, .job_listing").all();
        const results = [];
        
        for (const item of jobItems.slice(0, 5)) {
            try {
                const titleEl = item.locator("h3 a, .job_listing-title a").first();
                const title = (await titleEl.textContent()).trim();
                const href = await titleEl.getAttribute("href");
                
                // Only include if "Marketing" is in title or description (simple filter)
                if (title.toLowerCase().includes("marketing") || title.toLowerCase().includes("digital") || title.toLowerCase().includes("sales")) {
                    results.push({
                        id: `bj_${Math.random().toString(36).substr(2, 9)}`,
                        title,
                        company: "Barbados Local Company",
                        url: href,
                        summary: `BajanJobs Vacancy: ${title}.`,
                        location: "Barbados",
                        source: "BajanJobs"
                    });
                }
            } catch (e) {}
        }
        return results;
    } catch (e) {
        console.error("BajanJobs scrape failed:", e.message);
        return [];
    } finally {
        await page.close();
    }
};

/**
 * Main scraper function that combines multiple sources.
 */
const scrapeJobs = async () => {
    console.log("Starting multi-source job scrape (Barbados focus)...");
    
    const statePath = path.resolve(__dirname, '../../linkedin_state.json');
    const browser = await chromium.launch({ headless: true });
    
    const context = fs.existsSync(statePath) 
        ? await browser.newContext({ storageState: statePath })
        : await browser.newContext();
        
    const [linkedInJobs, cjJobs, bjJobs] = await Promise.all([
        scrapeLinkedIn(context),
        scrapeCaribbeanJobs(browser),
        scrapeBajanJobs(browser)
    ]);
    
    await browser.close();
    
    const allJobs = [...linkedInJobs, ...cjJobs, ...bjJobs];
    console.log(`Scrape finished. Found ${allJobs.length} total jobs in Barbados.`);
    return allJobs;
};

module.exports = { scrapeJobs };
