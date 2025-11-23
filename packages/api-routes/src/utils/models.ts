// TODO: Select your chat models here

export const chatModels = [
  {
    id: 0,
    name: "gpt-4o", // "gpt-4o"
    label: "GPT-4o", // GPT-4o
    description: "Powerful model with fast response times",
    images: true,
    pdfs: true,
    reasoning: false,
  },
  {
    id: 1,
    name: "gpt-5", // "gpt-5"
    label: "GPT-5", // GPT-5
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
