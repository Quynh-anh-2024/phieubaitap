import { GoogleGenAI } from "@google/genai";
import { SYSTEM_INSTRUCTION, READING_SYSTEM_INSTRUCTION } from '../constants';
import { WorksheetRequest } from '../types';

const getGeminiClient = (apiKey: string) => {
    if (!apiKey) {
        throw new Error("API Key is missing. Please provide a valid API Key.");
    }
    return new GoogleGenAI({ apiKey });
};

export const validateApiKey = async (apiKey: string): Promise<boolean> => {
    try {
        const client = getGeminiClient(apiKey);
        // We make a minimal request to check if the key is valid
        // Using generateContent with a tiny prompt on the flash model
        await client.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: 'Test',
        });
        return true;
    } catch (error) {
        console.error("API Key Validation Failed:", error);
        return false;
    }
};

export const generateWorksheet = async (request: WorksheetRequest, apiKey: string): Promise<ReadableStream<string>> => {
    const client = getGeminiClient(apiKey);
    
    // Using gemini-3-flash-preview for fast text generation
    const model = 'gemini-3-flash-preview'; 

    let systemInstruction = SYSTEM_INSTRUCTION;
    let userPrompt = `Hãy tạo phiếu bài tập cho môn ${request.subject} - Lớp ${request.grade}, bài/chủ đề: "${request.topic}".`;

    if (request.exerciseType === 'reading' && request.subject === 'Tiếng Việt') {
        systemInstruction = READING_SYSTEM_INSTRUCTION;
        userPrompt = `Hãy tạo phiếu luyện đọc hiểu cho học sinh Lớp ${request.grade}, chủ đề: "${request.topic}".`;
    }

    try {
        const responseStream = await client.models.generateContentStream({
            model: model,
            contents: userPrompt,
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.7, // Creativity balance for educational content
            }
        });

        // Create a ReadableStream to stream the text back to the component
        return new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of responseStream) {
                        const text = chunk.text;
                        if (text) {
                            controller.enqueue(text);
                        }
                    }
                    controller.close();
                } catch (error) {
                    controller.error(error);
                }
            }
        });

    } catch (error) {
        console.error("Gemini API Error:", error);
        throw error;
    }
};