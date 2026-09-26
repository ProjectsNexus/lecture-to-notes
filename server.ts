import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// Enable CORS for external hosts (e.g. Vercel client-server routing)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Server-side Google GenAI initialization with required telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Health check endpoint
app.get(['/api/health', '/health'], (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasKey: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString(),
    environment: process.env.VERCEL ? 'vercel' : 'node',
  });
});

// Helper function to call Gemini with immediate model fallback on transient demand spikes
async function generateContentWithRetry(params: any) {
  const primaryModel = params.model || 'gemini-3.8-flash';
  const modelsToTry = [primaryModel, 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
  let lastError: any = null;

  for (const modelName of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        ...params,
        model: modelName,
      });
      return response;
    } catch (err: any) {
      lastError = err;
      const errStr = String(err?.message || err);
      console.warn(`[Gemini API] Model ${modelName} encountered error:`, errStr.slice(0, 120));
      // Continue to next fallback model immediately if high demand or unavailable
    }
  }

  throw lastError;
}

// Primary Endpoint: Multilingual Transcript Analysis
app.post(['/api/analyze-transcript', '/analyze-transcript'], async (req: Request, res: Response) => {
  try {
    const { transcript, contextNotes } = req.body;

    if (!transcript || typeof transcript !== 'string' || transcript.trim().length === 0) {
      return res.status(400).json({ error: 'Transcript text is required.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY environment variable is not configured on the server.',
      });
    }

    const systemPrompt = `You are an elite multilingual linguistic intelligence analyst and executive researcher.
You are analyzing a transcript from a multi-language discussion.
Your mission is to perform a comprehensive, rigorous multi-dimensional breakdown addressing 4 core objectives:
1. Identify the Core Concepts: Extract the primary topics, ideas, and themes discussed, categorizing them, gauging their significance, and identifying which speakers led or engaged in them.
2. Conceptual Summary: Explain the relationship between these concepts — how they interconnect, cause-and-effect dependencies, complementary paradigms, or ideological/practical tensions.
3. Structured Notes: Provide a bulleted breakdown of key takeaways (with impact level), formal definitions of concepts introduced, a thorough breakdown of technical jargon and domain acronyms, and actionable decisions/next steps.
4. Language Insights: Detect every language and dialect used, calculate approximate distribution, and critically analyze context-dependent concepts (words, idioms, or cultural terms that lose essential nuance or semantics in direct translation, why they were chosen, and how they shaped the discussion dynamics).

Provide insightful, nuanced analysis without boilerplate fluff. Ensure technical jargon and cultural terms are accurately parsed.`;

    const userPrompt = `Please analyze the following multi-language transcript:
${contextNotes ? `[Additional Context/Background: ${contextNotes}]\n\n` : ''}
--- BEGIN TRANSCRIPT ---
${transcript}
--- END TRANSCRIPT ---`;

    const response = await generateContentWithRetry({
      model: 'gemini-3.8-flash',
      contents: [
        { role: 'user', parts: [{ text: userPrompt }] }
      ],
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.2,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            detectedLanguages: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  code: { type: Type.STRING },
                  percentage: { type: Type.NUMBER },
                  speakers: { type: Type.ARRAY, items: { type: Type.STRING } },
                  roleInConversation: { type: Type.STRING }
                },
                required: ['name', 'code', 'percentage', 'roleInConversation']
              }
            },
            speakers: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  primaryLanguage: { type: Type.STRING },
                  languagesUsed: { type: Type.ARRAY, items: { type: Type.STRING } },
                  apparentRole: { type: Type.STRING }
                },
                required: ['name', 'primaryLanguage']
              }
            },
            coreConcepts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  category: { type: Type.STRING },
                  relevanceScore: { type: Type.INTEGER },
                  description: { type: Type.STRING },
                  speakersInvolved: { type: Type.ARRAY, items: { type: Type.STRING } },
                  keyQuotes: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ['id', 'title', 'category', 'relevanceScore', 'description']
              }
            },
            conceptualSummary: {
              type: Type.OBJECT,
              properties: {
                executiveSummary: { type: Type.STRING },
                relationalSynthesis: { type: Type.STRING },
                conceptRelationships: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      sourceConceptId: { type: Type.STRING },
                      sourceConceptTitle: { type: Type.STRING },
                      targetConceptId: { type: Type.STRING },
                      targetConceptTitle: { type: Type.STRING },
                      relationshipType: { 
                        type: Type.STRING,
                        description: "One of: enables, reinforces, conflicts_with, depends_on, contextualizes"
                      },
                      explanation: { type: Type.STRING }
                    },
                    required: ['sourceConceptTitle', 'targetConceptTitle', 'relationshipType', 'explanation']
                  }
                },
                causalChains: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                }
              },
              required: ['executiveSummary', 'relationalSynthesis', 'conceptRelationships']
            },
            structuredNotes: {
              type: Type.OBJECT,
              properties: {
                keyTakeaways: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      takeaway: { type: Type.STRING },
                      category: { type: Type.STRING },
                      impactLevel: { type: Type.STRING, description: "High, Medium, or Strategic" },
                      speakerAttribution: { type: Type.STRING }
                    },
                    required: ['takeaway', 'category', 'impactLevel']
                  }
                },
                definitions: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      term: { type: Type.STRING },
                      originalLanguage: { type: Type.STRING },
                      formalDefinition: { type: Type.STRING },
                      appliedContext: { type: Type.STRING }
                    },
                    required: ['term', 'formalDefinition', 'appliedContext']
                  }
                },
                technicalJargon: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      jargon: { type: Type.STRING },
                      domain: { type: Type.STRING },
                      standardMeaning: { type: Type.STRING },
                      practicalImplication: { type: Type.STRING },
                      occurrenceQuote: { type: Type.STRING }
                    },
                    required: ['jargon', 'domain', 'standardMeaning', 'practicalImplication']
                  }
                },
                decisionsAndNextSteps: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      decisionOrAction: { type: Type.STRING },
                      owner: { type: Type.STRING },
                      status: { type: Type.STRING }
                    },
                    required: ['decisionOrAction']
                  }
                }
              },
              required: ['keyTakeaways', 'definitions', 'technicalJargon']
            },
            languageInsights: {
              type: Type.OBJECT,
              properties: {
                overview: { type: Type.STRING },
                contextDependentConcepts: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      term: { type: Type.STRING },
                      language: { type: Type.STRING },
                      literalTranslation: { type: Type.STRING },
                      contextualMeaning: { type: Type.STRING },
                      culturalNuance: { type: Type.STRING },
                      whyDirectTranslationFails: { type: Type.STRING },
                      strategicImpactOnDiscussion: { type: Type.STRING }
                    },
                    required: ['term', 'language', 'literalTranslation', 'contextualMeaning', 'culturalNuance', 'whyDirectTranslationFails']
                  }
                },
                codeSwitchingDynamics: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      speaker: { type: Type.STRING },
                      shiftDescription: { type: Type.STRING },
                      triggerContext: { type: Type.STRING },
                      pragmaticReason: { type: Type.STRING }
                    },
                    required: ['speaker', 'shiftDescription', 'triggerContext', 'pragmaticReason']
                  }
                },
                crossCulturalRecommendations: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                }
              },
              required: ['overview', 'contextDependentConcepts', 'codeSwitchingDynamics']
            }
          },
          required: ['detectedLanguages', 'coreConcepts', 'conceptualSummary', 'structuredNotes', 'languageInsights']
        }
      }
    });

    const textOutput = response.text;
    if (!textOutput) {
      throw new Error('No response text received from Gemini API');
    }

    const parsedData = JSON.parse(textOutput);
    return res.json(parsedData);
  } catch (error: any) {
    console.error('Error analyzing transcript:', error);
    return res.status(500).json({
      error: error.message || 'An error occurred while analyzing the transcript.',
    });
  }
});

// Audio File Transcription Endpoint
app.post(['/api/transcribe-audio', '/transcribe-audio'], async (req: Request, res: Response) => {
  try {
    const { audioBase64, mimeType = 'audio/mp3', contextNotes } = req.body;

    if (!audioBase64) {
      return res.status(400).json({ error: 'Audio data is required.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY environment variable is not configured on the server.',
      });
    }

    const transcriptionPrompt = `You are an elite multilingual audio transcriber and computational linguist.
Transcribe this recorded multi-language discussion audio verbatim into structured dialogue text.

Critical Transcription Rules:
1. Speaker Diarization & Timestamps:
   - Identify distinct speakers and format each turn as: "[MM:SS] Speaker Name (or Speaker 1, Speaker 2): spoken words"
2. Multilingual Verbatim Fidelity:
   - Preserve all spoken languages authentically (e.g. Japanese, Spanish, German, Hindi, French, Tamil, English, etc.) in their original native scripts or romanization as spoken.
   - NEVER force-translate non-English segments into English. Retain code-switching, bilingual sentences, and natural dialectical expressions.
3. Technical & Cultural Terminology:
   - Accurately preserve technical jargon, acronyms, and culturally embedded concepts without omission.
4. Clean Output:
   - Output ONLY the formatted dialogue transcript text with timestamps. Do not add conversational conversational intro/outro or wrap in markdown fences.`;

    const audioPart = {
      inlineData: {
        mimeType: mimeType,
        data: audioBase64,
      },
    };

    // Try gemini-3.5-transcribe first, then fallback to gemini-3.8-flash, gemini-3.1-flash-lite
    const modelsToTry = ['gemini-3.5-transcribe', 'gemini-3.8-flash', 'gemini-3.1-flash-lite'];
    let transcriptText = '';
    let lastError: any = null;

    for (const model of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: {
            parts: [
              audioPart,
              { text: transcriptionPrompt + (contextNotes ? `\n\n[Meeting Context: ${contextNotes}]` : '') }
            ],
          },
        });

        const text = response.text || response.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text && text.trim().length > 0) {
          transcriptText = text.trim();
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`[Transcription] Model ${model} failed, trying fallback:`, String(err?.message || err).slice(0, 120));
      }
    }

    if (!transcriptText) {
      throw lastError || new Error('No transcript could be extracted from the audio file.');
    }

    return res.json({ transcript: transcriptText });
  } catch (error: any) {
    console.error('Audio transcription error:', error);
    return res.status(500).json({
      error: error.message || 'An error occurred while transcribing the audio file.',
    });
  }
});

// Follow-up Q&A Chat regarding the transcript
app.post(['/api/chat-transcript', '/chat-transcript'], async (req: Request, res: Response) => {
  try {
    const { transcript, query, history = [] } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required.' });
    }

    const conversationHistory = history.map((item: any) => `${item.role === 'user' ? 'User' : 'Assistant'}: ${item.text}`).join('\n');

    const prompt = `You are a specialist conversational AI analyzing this specific multi-language discussion transcript.
Answer the user's question directly, precisely citing speakers, timestamps, or quotes where appropriate.
If the question touches on multi-lingual shifts, linguistic nuance, untranslatable words, or technical decisions, explain the underlying dynamic clearly.

Transcript:
---
${transcript || '(Transcript unavailable, answer based on knowledge if possible)'}
---

Recent Conversation:
${conversationHistory}

User Question: ${query}
`;

    const response = await generateContentWithRetry({
      model: 'gemini-3.8-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        temperature: 0.3,
      }
    });

    return res.json({ answer: response.text });
  } catch (error: any) {
    console.error('Error in chat:', error);
    return res.status(500).json({ error: error.message || 'Failed to answer question.' });
  }
});

// Audio TTS Briefing Generation
app.post(['/api/generate-audio-briefing', '/generate-audio-briefing'], async (req: Request, res: Response) => {
  try {
    const { text, voice = 'Kore' } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text is required for TTS briefing.' });
    }

    // Limit briefing text to ~1200 characters for snappy TTS generation
    const trimmedText = text.slice(0, 1200);

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: trimmedText,
              speechMetadata: {
                style: 'Professional, articulate briefing analyst with engaging cadence',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice || 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      throw new Error('TTS did not return audio data.');
    }

    return res.json({ audioBase64: base64Audio, sampleRate: 24000 });
  } catch (error: any) {
    console.error('Error generating audio briefing:', error);
    return res.status(500).json({ error: error.message || 'Failed to generate audio briefing.' });
  }
});

// Export Express app for Vercel Serverless Functions
export default app;
export { app };

// Setup Vite middleware in development or serve static files in production
async function startServer() {
  if (process.env.VERCEL) {
    return;
  }

  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

// Only start standalone server when executed locally or in full Node environments (not Vercel serverless)
if (!process.env.VERCEL) {
  startServer();
}
