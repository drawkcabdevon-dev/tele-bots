const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

/**
 * Scrapes Marketing jobs in Barbados from LinkedIn using Playwright.
 * Uses a saved storage state for authentication.
 */
const scrapeJobs = async () => {
    console.log("Starting real LinkedIn scrape...");
    
    const statePath = path.resolve(__dirname, '../../linkedin_state.json');
    const browser = await chromium.launch({ headless: true }); // Headless for tablet compatibility
    
    try {
        const context = fs.existsSync(statePath) 
            ? await browser.newContext({ storageState: statePath })
            : await browser.newContext();
            
        const page = await context.newPage();
        
        // LinkedIn search URL for Marketing jobs in Barbados with Easy Apply filter
        const url = "https://www.linkedin.com/jobs/search/?keywords=Marketing&location=Barbados&f_AL=true";
        await page.goto(url);
        
        // Wait for job cards to load
        await page.waitForTimeout(4000);
        try {
            await page.waitForSelector(".job-card-container", { timeout: 15000 });
        } catch (e) {
            console.error("No jobs loaded or timeout. Check linkedin_state.json.");
            await browser.close();
            return [];
        }
        
        const jobCards = await page.locator(".job-card-container").all();
        const results = [];
        
        // Process up to 5 jobs
        for (const card of jobCards.slice(0, 5)) {
            try {
                const linkEl = card.locator("a.job-card-list__title, a.job-card-container__link").first();
                const href = await linkEl.getAttribute("href");
                let jobId = "unknown";
                if (href && href.includes("view/")) {
                    jobId = href.split("view/")[1].split("/")[0].split("?")[0];
                }
                
                const title = (await linkEl.textContent()).trim();
                
                const companyEl = card.locator(".job-card-container__primary-description, .artdeco-entity-lockup__subtitle").first();
                const company = (await companyEl.count()) > 0 
                    ? (await companyEl.textContent()).trim() 
                    : "Unknown Company";
                
                if (jobId !== "unknown") {
                    results.push({
                        job_id: jobId,
                        title: title,
                        company: company,
                        url: `https://www.linkedin.com/jobs/view/${jobId}/`,
                        summary: `New job lead at ${company} for a ${title} position.`,
                        location: "Barbados"
                    });
                }
            } catch (err) {
                console.error("Error parsing job card:", err);
                continue;
            }
        }
        
        await browser.close();
        return results;
    } catch (error) {
        console.error("Scraping error:", error);
        await browser.close();
        return [];
    }
};

module.exports = { scrapeJobs };
