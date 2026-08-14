import { AGRouterPromptResponse } from '@/lib/ai-studio/schema';
import { AspectRatioAnalysisResult } from '@/lib/ai-studio/aspect-ratio';

export interface StudioState {
  step: 'upload' | 'analyzing' | 'editing' | 'publishing' | 'done';
  sessionId: string | null;
  uploadedImageUrl: string | null;
  sourceWidth?: number | null;
  sourceHeight?: number | null;
  sourceMimeType?: string | null;
  sourceFileSize?: number | null;
  aspectRatioDetails?: AspectRatioAnalysisResult | null;
  activeVersion: number;
  aiResponse: AGRouterPromptResponse | null;
  isRestoringFromHistory: boolean;
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
  | {
      type: 'SET_IMAGE';
      url: string;
      sessionId: string;
      credits: number;
      aspectRatio?: string;
      aspectRatioDetails?: AspectRatioAnalysisResult;
      width?: number;
      height?: number;
      mimeType?: string;
      fileSize?: number;
    }
  | { type: 'START_ANALYSIS' }
  | { type: 'STREAM_FIELD'; field: string; value: string }
  | { type: 'SET_RESPONSE'; response: AGRouterPromptResponse }
  | {
      type: 'HYDRATE_SESSION';
      sessionId: string;
      url: string;
      response: AGRouterPromptResponse;
      activeVersion?: number;
      aspectRatio?: string;
    }
  | { type: 'SET_RESTORING'; isRestoring: boolean }
  | { type: 'EDIT_FIELD'; field: keyof StudioState['userEdits']; value: any }
  | { type: 'INCREMENT_VERSION'; response: AGRouterPromptResponse }
  | { type: 'SUBMIT_PUBLISH' }
  | { type: 'PUBLISH_SUCCESS'; promptId: string }
  | { type: 'SET_ERROR'; message: string }
  | { type: 'UPDATE_CREDITS'; credits: number }
  | { type: 'RESET_FLOW' };

export const initialStudioState: StudioState = {
  step: 'upload',
  sessionId: null,
  uploadedImageUrl: null,
  sourceWidth: null,
  sourceHeight: null,
  sourceMimeType: null,
  sourceFileSize: null,
  aspectRatioDetails: null,
  activeVersion: 1,
  aiResponse: null,
  isRestoringFromHistory: false,
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
    case 'UPDATE_CREDITS':
      return {
        ...state,
        credits: action.credits
      };

    case 'SET_RESTORING':
      return {
        ...state,
        isRestoringFromHistory: action.isRestoring
      };

    case 'SET_IMAGE':
      return {
        ...state,
        step: 'analyzing',
        uploadedImageUrl: action.url,
        sessionId: action.sessionId,
        credits: action.credits,
        aspectRatioDetails: action.aspectRatioDetails || null,
        sourceWidth: action.width || null,
        sourceHeight: action.height || null,
        sourceMimeType: action.mimeType || null,
        sourceFileSize: action.fileSize || null,
        isRestoringFromHistory: false,
        userEdits: {
          ...state.userEdits,
          aspectRatio: action.aspectRatio || state.userEdits.aspectRatio || '1:1'
        },
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

    case 'HYDRATE_SESSION':
      return {
        ...state,
        step: 'editing',
        sessionId: action.sessionId,
        uploadedImageUrl: action.url,
        activeVersion: action.activeVersion || 1,
        aiResponse: action.response,
        isRestoringFromHistory: false,
        userEdits: {
          title: action.response.metadata.title || '',
          promptText: action.response.prompt.main || '',
          negativePrompt: action.response.prompt.negative || '',
          category: action.response.metadata.category || '',
          tags: action.response.metadata.tags || [],
          aiTool: action.response.intelligence.recommendedPlatform || '',
          aspectRatio: action.aspectRatio || action.response.metadata.aspectRatio || '1:1'
        },
        error: null
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
        isRestoringFromHistory: false,
        error: action.message
      };

    case 'RESET_FLOW':
      return {
        ...initialStudioState,
        credits: state.credits
      };

    default:
      return state;
  }
}
