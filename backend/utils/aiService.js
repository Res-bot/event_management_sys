import axios from 'axios';

export const generateDescription = async (title, basicInfo) => {
  try {
    const API_KEY = process.env.GEMINI_API_KEY;
    const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

    const response = await axios.post(
      URL,
      {
        contents: [
          {
            parts: [
              {
                text: `Create an engaging event description for: "${title}". ${
                  basicInfo ? `Additional context: ${basicInfo}` : ''
                } Keep it concise and appealing.`
              }
            ]
          }
        ],
        generationConfig: {
          maxOutputTokens: 500,
          temperature: 0.7
        }
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data.candidates[0].content.parts[0].text;
  } catch (err) {
    console.error('Gemini generation failed:', err.response?.data || err.message);
    return null;
  }
};