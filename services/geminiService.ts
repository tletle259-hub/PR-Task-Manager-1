
import { GoogleGenAI } from "@google/genai";

export async function askGemini(prompt: string, history: { role: string; parts: { text: string }[] }[]): Promise<string> {
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    console.warn("Gemini API key is not set. Using fallback response.");
    return "ขออภัยค่ะ ขณะนี้ระบบ AI ไม่สามารถใช้งานได้ เนื่องจากไม่ได้ตั้งค่า API Key กรุณาลองใหม่อีกครั้งในภายหลังค่ะ";
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    // For simplicity, this example does not use the full history. 
    // A more advanced implementation would format the history correctly for the chat context.
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `คำถาม: ${prompt}. โปรดตอบเป็นภาษาไทย`,
        config: {
            systemInstruction: "คุณคือ 'เลขาไตเติ้ล' ผู้ช่วย AI อัจฉริยะสำหรับระบบ PR Task Manager หน้าที่ของคุณคือตอบคำถามและให้ความช่วยเหลือผู้ใช้งานเกี่ยวกับระบบจัดการงานนี้อย่างสุภาพและเป็นมิตร",
        }
    });

    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return "เกิดข้อผิดพลาดในการเชื่อมต่อกับ AI ค่ะ กรุณาตรวจสอบการตั้งค่าและลองอีกครั้ง";
  }
}
