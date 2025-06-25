
export interface PromptHistory {
  id: string;
  name: string; // Display name for the prompt
  goal: string; // Original goal
  optimizedPrompt: string;
  timestamp: string; // ISO string or formatted date
  tags?: string[];
  qualityScore?: number; // Optional: For analytics
  targetModel?: string;  // Optional: For analytics
}
