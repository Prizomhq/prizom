import { AGRouterPromptResponse } from '@/lib/ai-studio/schema';

export interface StudioState {
  step: 'upload' | 'analyzing' | 'editing' | 'publishing' | 'done';
  sessionId: string | null;
  uploadedImageUrl: string | null;
  activeVersion: number;
  aiResponse: AGRouterPromptResponse | null;
  userEdits: {
    title: string;
    promptText: string;
    negativePrompt: string;
    category: string;
    tags: string[];
    aiTool: string;
    aspectRatio: string;
  };
  credits: number;
  error: string | null;
  streamingField: string | null;
}

export type StudioAction =
  | { type: 'SET_IMAGE'; url: string; sessionId: string; credits: number }
  | { type: 'START_ANALYSIS' }
  | { type: 'STREAM_FIELD'; field: string; value: string }
  | { type: 'SET_RESPONSE'; response: AGRouterPromptResponse }
  | { type: 'EDIT_FIELD'; field: keyof StudioState['userEdits']; value: any }
  | { type: 'INCREMENT_VERSION'; response: AGRouterPromptResponse }
  | { type: 'SUBMIT_PUBLISH' }
  | { type: 'PUBLISH_SUCCESS'; promptId: string }
  | { type: 'SET_ERROR'; message: string }
  | { type: 'RESET_FLOW' };

export const initialStudioState: StudioState = {
  step: 'upload',
  sessionId: null,
  uploadedImageUrl: null,
  activeVersion: 1,
  aiResponse: null,
  userEdits: {
    title: '',
    promptText: '',
    negativePrompt: '',
    category: '',
    tags: [],
    aiTool: '',
    aspectRatio: '1:1'
  },
  credits: 10,
  error: null,
  streamingField: null
};

export function studioReducer(state: StudioState, action: StudioAction): StudioState {
  switch (action.type) {
    case 'SET_IMAGE':
      return {
        ...state,
        step: 'analyzing',
        uploadedImageUrl: action.url,
        sessionId: action.sessionId,
        credits: action.credits,
        error: null
      };

    case 'START_ANALYSIS':
      return {
        ...state,
        step: 'analyzing',
        error: null
      };

    case 'STREAM_FIELD':
      return {
        ...state,
        streamingField: action.field,
        userEdits: {
          ...state.userEdits,
          [action.field]: action.value
        }
      };

    case 'SET_RESPONSE':
      return {
        ...state,
        step: 'editing',
        streamingField: null,
        aiResponse: action.response,
        userEdits: {
          title: action.response.metadata.title || '',
          promptText: action.response.prompt.main || '',
          negativePrompt: action.response.prompt.negative || '',
          category: action.response.metadata.category || '',
          tags: action.response.metadata.tags || [],
          aiTool: action.response.intelligence.recommendedPlatform || '',
          aspectRatio: action.response.metadata.aspectRatio || '1:1'
        }
      };

    case 'EDIT_FIELD':
      return {
        ...state,
        userEdits: {
          ...state.userEdits,
          [action.field]: action.value
        }
      };

    case 'INCREMENT_VERSION':
      return {
        ...state,
        activeVersion: state.activeVersion + 1,
        aiResponse: action.response,
        userEdits: {
          title: action.response.metadata.title || '',
          promptText: action.response.prompt.main || '',
          negativePrompt: action.response.prompt.negative || '',
          category: action.response.metadata.category || '',
          tags: action.response.metadata.tags || [],
          aiTool: action.response.intelligence.recommendedPlatform || '',
          aspectRatio: action.response.metadata.aspectRatio || '1:1'
        }
      };

    case 'SUBMIT_PUBLISH':
      return {
        ...state,
        step: 'publishing',
        error: null
      };

    case 'PUBLISH_SUCCESS':
      return {
        ...state,
        step: 'done',
        error: null
      };

    case 'SET_ERROR':
      return {
        ...state,
        step: 'upload',
        error: action.message
      };

    case 'RESET_FLOW':
      return {
        ...initialStudioState,
        credits: state.credits // Retain credit snapshot across resets
      };

    default:
      return state;
  }
}
