
export const WORKSPACE_TYPES = ['written-content', 'prompt', 'component-wizard', 'structured-data'] as const;
export type WorkspaceType = typeof WORKSPACE_TYPES[number];

export interface WorkspaceInput {
  // This is a flexible object that will hold the inputs for any given feature.
  // For example: { topic: '...', tone: '...' } for written content,
  // or { description: '...' } for the component wizard.
  [key: string]: any;
}

export interface Workspace {
  id: string;
  userId: string;
  name: string;
  summary: string;
  type: WorkspaceType;
  input?: WorkspaceInput;  // Now optional, as it will be in a separate doc
  output?: string | object; // Now optional
  featurePath: string;
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
}
