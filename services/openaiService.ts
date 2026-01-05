import { UserProfile, AnalysisResult } from "../types";

const MODEL = "gpt-5-nano";
const OPENAI_BASE_URL = import.meta.env.VITE_OPENAI_BASE_URL || "/api/openai";

type ChatRole = "system" | "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface ChatSession {
  sendMessage: (params: { message: string }) => Promise<{ text: string | null }>;
}

const extractText = (content: unknown): string | null => {
  if (!content) return null;
  if (typeof content === "string") return content;

  if (Array.isArray(content)) {
    const textPart = content.find((part) => typeof part === "object" && part !== null && "text" in part) as
      | { text?: string }
      | undefined;
    return textPart?.text ?? null;
  }

  return null;
};

const callChatCompletion = async (messages: ChatMessage[], schema: Record<string, unknown>) => {
  const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      response_format: {
        type: "json_schema",
        json_schema: schema,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI request failed: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const content = extractText(data?.choices?.[0]?.message?.content);

  if (!content) {
    throw new Error("No response from AI");
  }

  return content;
};

const analysisSchema = {
  name: "AnalysisResult",
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      skillsReport: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            category: { type: "string" },
            score: { type: "number" },
            reasoning: { type: "string" },
          },
          required: ["category", "score", "reasoning"],
        },
      },
      careers: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            title: { type: "string" },
            matchScore: { type: "number" },
            description: { type: "string" },
            salaryRange: { type: "string" },
            educationRequired: { type: "string" },
            roadmap: {
              type: "array",
              items: { type: "string" },
            },
          },
          required: ["title", "matchScore", "description", "salaryRange", "educationRequired", "roadmap"],
        },
      },
      summary: { type: "string" },
    },
    required: ["skillsReport", "careers", "summary"],
  },
  strict: true,
};

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
1) Create a skills assessment (0-100) for these 5 categories: Critical Thinking, Creativity, Communication, Technical Proficiency, Leadership. Provide a short reasoning for each based on their profile.
2) Suggest 3 distinct career paths that fit this profile. For each, provide a match score, description, typical salary range (US average), education needed, and a 3-step high school roadmap (what to do now).
3) Write a brief encouraging summary (2 sentences).
`;

  const content = await callChatCompletion(
    [
      {
        role: "system",
        content: "You are an expert career counselor who always returns well-structured JSON following the provided schema.",
      },
      { role: "user", content: prompt },
    ],
    analysisSchema
  );

  return JSON.parse(content) as AnalysisResult;
};

const interviewSchema = {
  name: "InterviewTurn",
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      feedback: { type: "string" },
      nextQuestion: { type: "string" },
      interviewSummary: {
        type: "string",
        description: "Only provided when the interview ends",
      },
    },
    required: ["feedback", "nextQuestion"],
  },
  strict: true,
};

const buildInterviewSystemPrompt = (careerTitle: string) => `
You are an encouraging career coach conducting a mock interview for a high school student aspiring to be a ${careerTitle}.

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

Always return the response in JSON format.`;

class InterviewChatSession implements ChatSession {
  private history: ChatMessage[];

  constructor(careerTitle: string, history: ChatMessage[] = []) {
    const sanitizedHistory = history.filter((entry) => entry.role !== "system");
    this.history = [
      {
        role: "system",
        content: buildInterviewSystemPrompt(careerTitle),
      },
      ...sanitizedHistory,
    ];
  }

  async sendMessage(params: { message: string }) {
    this.history.push({ role: "user", content: params.message });

    const text = await callChatCompletion(this.history, interviewSchema);

    if (text) {
      this.history.push({ role: "assistant", content: text });
    }

    return { text };
  }
}

export const createInterviewSession = (careerTitle: string, history: ChatMessage[] = []): ChatSession => {
  return new InterviewChatSession(careerTitle, history);
};
