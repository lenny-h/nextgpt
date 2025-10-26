// TODO: Select your chat models here

export const chatModels = [
  {
    id: 1,
    name: "gemini-2.5-flash",
    label: "Gemini 2.5 Flash",
    description: "Powerful model with fast response times",
    images: true,
    pdfs: true,
    reasoning: false,
  },
  {
    id: 1,
    name: "gemini-2.5-pro",
    label: "Gemini 2.5 Pro",
    description: "Powerful model, but slow response times",
    images: true,
    pdfs: true,
    reasoning: false,
  },
];

export const chatTitleModelIdx = 0;
export const documentModifierModelIdx = 1;
export const completionModelIdx = 0;
export const studentEvaluationModelIdx = 1;
