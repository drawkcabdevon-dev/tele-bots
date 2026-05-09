const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const config = require('../../config');

/**
 * Generates a professional cover letter using the Gemini API.
 * @param {object} job - The job object with title, company, summary, location
 * @returns {Promise<string>} The generated cover letter text
 */
const generateCoverLetter = async (job) => {
    const cvPath = path.resolve(__dirname, '../../cv_text.txt');
    const cvText = fs.existsSync(cvPath) ? fs.readFileSync(cvPath, 'utf8') : "Experienced Digital Marketer and Developer.";

    const prompt = `You are a professional cover letter writer. Write a concise, compelling cover letter for the following job in Barbados based on the applicant's CV.
    
Applicant's CV:
${cvText}

Job Title: ${job.title}
Company: ${job.company}
Job Description: ${job.summary}
Location: ${job.location}

Write a 3-paragraph cover letter in a professional but personable tone. 
Address it "Dear Hiring Manager," and sign off "Sincerely, Devon Clarke".
Keep it under 250 words. Output ONLY the cover letter text, nothing else.`;

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${config.GEMINI_API_KEY}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        }
    );

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Gemini API error: ${err}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text.trim();
};

/**
 * Creates a Gmail draft using the gws CLI.
 * @param {string} subject - Email subject
 * @param {string} body - Email body (plain text)
 * @returns {string} The draft ID from Gmail
 */
const createGmailDraft = (subject, body) => {
    // Build MIME message and base64url encode it
    const mimeMessage = [
        `Subject: ${subject}`,
        `Content-Type: text/plain; charset=UTF-8`,
        ``,
        body
    ].join('\r\n');

    const encoded = Buffer.from(mimeMessage)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

    const payload = JSON.stringify({
        message: { raw: encoded }
    });

    const params = JSON.stringify({ userId: 'me' });

    // Run gws with the file keyring backend so it works headlessly
    const result = execSync(
        `GOOGLE_WORKSPACE_CLI_KEYRING_BACKEND=file gws gmail users drafts create --params '${params}' --json '${payload}'`,
        { encoding: 'utf8', timeout: 30000 }
    );

    const parsed = JSON.parse(result);
    return parsed.id;
};

module.exports = { generateCoverLetter, createGmailDraft };
