import { showRoutes } from 'hono/dev'
import { stream } from 'hono/streaming'
import { createApp } from 'honox/server'
import { GoogleGenAI } from "@google/genai";
import 'dotenv/config'

const app = createApp()

showRoutes(app)

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite'

if (!API_KEY) { console.error('GEMINI_API_KEY is not set') }

const ai = new GoogleGenAI({ apiKey: API_KEY! });

app.post('/api/chat', async (c) => {
  try {
    const body = await c.req.json();
    const contents = body.contents || [];
    const systemInstruction = body.systemInstruction || undefined;

    if (!contents.length) return c.text('No contents provided', 400)

    // Streaming 呼び出し
    const result = await ai.models.generateContentStream({
      model: MODEL_NAME,
      contents,
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }]
      },
    })

    return stream(c, async (streamWriter) => {
      try {
        for await (const chunk of result) {
          const text = chunk.text;
          if (text) await streamWriter.write(text)
        }
      } catch (err) {
        console.error('Streaming error:', err)
      }
    })


  } catch (err) {
    console.error(err);
    return c.text('Internal Server Error', 500);
  }
})

export default app
