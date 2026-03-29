const Groq = require('groq-sdk');
const pdfParse = require('pdf-parse');

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Extracts text from a PDF buffer, then calls Groq to parse it into
 * a structured CandidateProfile-compatible object.
 *
 * @param {Buffer} pdfBuffer
 * @returns {Promise<Object>} parsed profile fields
 */
const parseResume = async (pdfBuffer) => {
  const { text } = await pdfParse(pdfBuffer);

  if (!text || text.trim().length < 50) {
    throw new Error('Could not extract readable text from the PDF.');
  }

  const completion = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: `Extract structured data from the following resume text and return ONLY a valid JSON object with no extra commentary.

The JSON must match this exact schema (omit fields you cannot find, never invent data):
{
  "headline": "string — job title / professional tagline",
  "summary": "string — professional summary or objective",
  "currentLocation": "string — city, state/country",
  "experienceYears": number,
  "skills": ["string"],
  "githubUrl": "string",
  "linkedinUrl": "string",
  "portfolioUrl": "string",
  "experience": [
    {
      "title": "string",
      "company": "string",
      "location": "string",
      "startDate": "ISO date string YYYY-MM-DD",
      "endDate": "ISO date string YYYY-MM-DD or null if current",
      "isCurrent": boolean,
      "description": "string",
      "skills": ["string"]
    }
  ],
  "education": [
    {
      "institution": "string",
      "degree": "string",
      "fieldOfStudy": "string",
      "startYear": number,
      "endYear": number or null if currently studying,
      "isCurrentlyStudying": boolean,
      "grade": "string"
    }
  ],
  "projects": [
    {
      "title": "string",
      "description": "string",
      "url": "string",
      "startDate": "ISO date string",
      "endDate": "ISO date string",
      "skills": ["string"]
    }
  ],
  "certifications": [
    {
      "name": "string",
      "issuer": "string",
      "issueDate": "ISO date string"
    }
  ],
  "languages": [
    {
      "language": "string",
      "proficiency": "beginner|intermediate|advanced|native"
    }
  ]
}

Resume text:
${text}`,
      },
    ],
  });

  const raw = completion.choices[0].message.content.trim();

  // Strip markdown code fences if Claude wrapped the JSON
  const jsonStr = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');

  return JSON.parse(jsonStr);
};

module.exports = { parseResume };
