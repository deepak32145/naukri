jest.mock('pdf-parse', () => jest.fn());

const mockCreate = jest.fn();
jest.mock('groq-sdk', () => {
  return jest.fn().mockImplementation(() => ({
    chat: { completions: { create: mockCreate } },
  }));
});

const pdfParse = require('pdf-parse');
const { parseResume } = require('../src/utils/resumeParser');

describe('parseResume', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('parses valid JSON wrapped in markdown fences', async () => {
    pdfParse.mockResolvedValue({ text: 'A'.repeat(80) });
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: '```json\n{"headline":"Backend Engineer","skills":["node"]}\n```' } }],
    });

    const parsed = await parseResume(Buffer.from('fake-pdf'));
    expect(parsed.headline).toBe('Backend Engineer');
    expect(parsed.skills).toEqual(['node']);
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  it('throws when extracted text is too short', async () => {
    pdfParse.mockResolvedValue({ text: 'short text' });
    await expect(parseResume(Buffer.from('fake'))).rejects.toThrow(/Could not extract readable text/i);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('throws when model returns invalid JSON', async () => {
    pdfParse.mockResolvedValue({ text: 'B'.repeat(90) });
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: 'not-a-json-response' } }],
    });

    await expect(parseResume(Buffer.from('fake'))).rejects.toThrow();
  });
});
