import { GoogleGenAI, Type, Chat, Content } from "@google/genai";
import { UserProfile, AnalysisResult } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const ANALYSIS_MODEL = "gemini-2.5-flash";

export const analyzeProfile = async (profile: UserProfile): Promise<AnalysisResult> => {
  const prompt = `
    Analyze the following high school student profile to generate a "Skills Report Card" and suggested "Career Paths".
    
    Student Profile:
    - Grade: ${profile.gradeLevel}
    - Favorite Subjects: ${profile.favoriteSubjects}
    - Hobbies/Extracurriculars: ${profile.hobbies}
    - Self-identified Skills: ${profile.skills}
    - Ambitions/Dreams: ${profile.dream}

    Task:
    1. Create a skills assessment (0-100) for these 5 categories: Critical Thinking, Creativity, Communication, Technical Proficiency, Leadership. Provide a short reasoning for each based on their profile.
    2. Suggest 3 distinct career paths that fit this profile. For each, provide a match score, description, typical salary range (US average), education needed, and a 3-step high school roadmap (what to do now).
    3. Write a brief encouraging summary (2 sentences).
  `;

  const response = await ai.models.generateContent({
    model: ANALYSIS_MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          skillsReport: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                category: { type: Type.STRING },
                score: { type: Type.NUMBER },
                reasoning: { type: Type.STRING },
              },
              required: ["category", "score", "reasoning"]
            }
          },
          careers: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                matchScore: { type: Type.NUMBER },
                description: { type: Type.STRING },
                salaryRange: { type: Type.STRING },
                educationRequired: { type: Type.STRING },
                roadmap: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                }
              },
              required: ["title", "matchScore", "description", "salaryRange", "educationRequired", "roadmap"]
            }
          },
          summary: { type: Type.STRING }
        },
        required: ["skillsReport", "careers", "summary"]
      }
    }
  });

  if (!response.text) {
    throw new Error("No response from AI");
  }

  return JSON.parse(response.text) as AnalysisResult;
};

export const createInterviewSession = (careerTitle: string, history: Content[] = []): Chat => {
  return ai.chats.create({
    model: ANALYSIS_MODEL,
    config: {
      systemInstruction: `You are an encouraging career coach conducting a mock interview for a high school student aspiring to be a ${careerTitle}.

      Your goal is to help them improve their interview skills in a safe environment.
      
      For each turn:
      1. Analyze the user's answer to your previous question.
      2. "feedback": Provide specific, constructive feedback. Highlight what they did well and one thing to improve.
         - If this is the START of the conversation, "feedback" should be a warm welcome message.
      3. "nextQuestion": Ask the next relevant interview question.
      
      SPECIAL INSTRUCTION - ENDING THE INTERVIEW:
      If the user sends "FINISH_INTERVIEW" or indicates they want to stop:
      1. Set "feedback" to a brief closing remark (e.g. "Great job practicing today!").
      2. Set "nextQuestion" to "END".
      3. Set "interviewSummary" to a structured text summary (using bullet points) containing:
         - Top Strengths demonstrated.
         - Key Areas for Improvement.
         - Actionable Next Steps for the student.
      
      Always return the response in JSON format.`,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          feedback: { type: Type.STRING },
          nextQuestion: { type: Type.STRING },
          interviewSummary: { type: Type.STRING, description: "Only provided when interview ends" }
        },
        required: ["feedback", "nextQuestion"]
      }
    },
    history: history
  });
};
