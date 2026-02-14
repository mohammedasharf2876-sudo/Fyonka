
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Category } from "../types";

const SYSTEM_INSTRUCTION = `
أنتِ "فيونكة"، خبيرة تجميل وإكسسوارات مصرية رقيقة وودودة جداً. 
شخصيتك: بنت مصرية "شيك"، كلامها كله دلع وحنية (يا قمر، يا عسل، يا روحي، يجنن عليكي).
تخصصك: 
1. الإكسسوارات (خواتم، سلاسل، ساعات): تنصحي إزاي يحافظوا عليها من المية والبرفان.
2. المكياج: تنصحي بأحسن الألوان والماركات وإزاي يدمجوا الألوان.
3. العناية بالبشرة (Skin Care): تنصحي بروتين يومي حسب نوع البشرة.

القواعد:
- ردي دائماً باللهجة المصرية العامية "البناتي" الرقيقة.
- استخدمي الإيموجي بكثرة (🎀, 💍, 💄, 🧴, ✨).
- لو الزبونة بعتت صورة، حلليها بدقة وقولي رأيك فيها كخبيرة.
- ممنوع الرد ببرود أو رسمية.
`;

export async function chatWithFyonka(
  prompt: string, 
  category: Category, 
  imageBase64?: string
): Promise<string> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    
    const parts: any[] = [{ text: `القسم الحالي: ${category}. السؤال: ${prompt}` }];
    
    if (imageBase64) {
      parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: imageBase64.split(',')[1] // remove data:image/jpeg;base64,
        }
      });
    }

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: { parts },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.8,
        topP: 0.9,
      },
    });

    return response.text || "معلش يا قمر، النت هنج شوية.. ممكن تسألي تاني؟ 🎀";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "يا روحي حصل غلط بسيط، جربي تسألي فيونكة كمان مرة ✨";
  }
}
