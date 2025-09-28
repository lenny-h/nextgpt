export type Upload = {
  id: string;
  name: string;
  state: "uploading" | "success" | "failure";
  progress?: number;
  error?: string;
};
