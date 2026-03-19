import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function generateImage(prompt, filename) {
  console.log(`Generating image for: ${prompt}`);
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: prompt,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9",
        }
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const base64EncodeString = part.inlineData.data;
        const buffer = Buffer.from(base64EncodeString, 'base64');
        const filepath = path.join(process.cwd(), 'public', filename);
        fs.mkdirSync(path.dirname(filepath), { recursive: true });
        fs.writeFileSync(filepath, buffer);
        console.log(`Saved ${filename}`);
      }
    }
  } catch (err) {
    console.error(`Failed to generate ${filename}:`, err);
  }
}

async function main() {
  await generateImage("A glowing, high-tech digital vault in a dark, cyberpunk environment, neon amber and emerald accents, cinematic lighting, 8k resolution, photorealistic", "hero-vault.jpg");
  await generateImage("A futuristic server room with glowing blue and violet lights, representing secure distributed architecture, abstract, highly detailed", "architecture.jpg");
  await generateImage("A glowing digital padlock made of complex geometric shapes, floating in a dark void, symbolizing unbreakable encryption, neon colors", "encryption.jpg");
  await generateImage("A sleek, modern hacker terminal with glowing green code on a dark screen, representing edge AI and local security analysis, cinematic", "terminal.jpg");
}

main();
