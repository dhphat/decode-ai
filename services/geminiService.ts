import { GoogleGenAI } from "@google/genai";

export const generateArchaeologyImage = async (
  imageBase64: string,
  prompt: string
): Promise<string> => {
  // Ensure we have an API key selected
  // @ts-ignore - aistudio is injected by the environment
  if (window.aistudio && window.aistudio.hasSelectedApiKey) {
      // @ts-ignore
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
          throw new Error("API Key not selected");
      }
  }

  // Create a new instance to pick up the injected key
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Clean the base64 string
  const cleanBase64 = imageBase64.replace(/^data:image\/(png|jpg|jpeg);base64,/, "");

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [
          {
            text: `Follow these instructions strictly to generate an image. 
            Aspect Ratio Requirement: The output image MUST act as a 4:5 portrait ratio structurally, even if the file is 3:4.
            
            Style Prompt: ${prompt}`
          },
          {
            inlineData: {
              data: cleanBase64,
              mimeType: 'image/jpeg' 
            }
          }
        ]
      },
      config: {
        imageConfig: {
          aspectRatio: "3:4", // Closest supported enum to 4:5
          imageSize: "1K"
        }
      }
    });

    // Iterate parts to find the image
    const parts = response.candidates?.[0]?.content?.parts;
    if (parts) {
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }

    throw new Error("No image data returned from Gemini");
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
