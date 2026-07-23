export interface AGRouterPromptResponse {
  requestId: string;
  prompt: {
    main: string;
    negative: string;
    style: string;
    lighting: string;
    composition: string;
    camera: string;
    colorPalette: string[];
    mood: string;
  };
  metadata: {
    title: string;
    description: string;
    tags: string[];
    category: string;
    aspectRatio: string;
    promptType: 'image' | 'text' | 'video' | 'multimodal';
  };
  intelligence: {
    recommendedModel: string;
    recommendedPlatform: string;
    supportedModels: string[];
    launchUrl: string;
  };
  quality: {
    confidenceScore: number;
    qualityScore: number;
    promptClarity: number;
    estimatedOutputQuality: 'low' | 'medium' | 'high' | 'exceptional';
  };
  safety: {
    flagged: boolean;
    flags: string[];
    safetyScore: number;
  };
  generation: {
    modelUsed: string;
    provider: string;
    latencyMs: number;
    tokensUsed: number;
    version: string;
    timestamp: string;
  };
}

export interface AIStudioSession {
  id: string;
  user_id: string;
  status: 'pending' | 'processing' | 'complete' | 'published' | 'failed' | 'expired';
  cloudinary_url: string;
  cloudinary_public_id: string;
  request_id: string;
  active_version: number;
  credits_deducted: number;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  expires_at: string;
}

export interface AIPromptVersion {
  id: string;
  session_id: string;
  version_number: number;
  prompt_text: string;
  negative_prompt: string | null;
  generation_settings: Record<string, any>;
  ag_router_response: AGRouterPromptResponse | null;
  created_by_ai: boolean;
  created_at: string;
}

export interface AIPromptDelta {
  id: string;
  session_id: string;
  original_ai_prompt: string;
  user_modified_prompt: string;
  levenshtein_distance: number | null;
  character_added_count: number | null;
  character_removed_count: number | null;
  modified_fields: string[] | null;
  created_at: string;
}

export interface AICreditBalance {
  user_id: string;
  balance: number;
  updated_at: string;
}

export interface AICreditLedgerEntry {
  id: string;
  user_id: string;
  delta: number;
  reason: 'monthly_grant' | 'generation_debit' | 'timeout_refund' | 'topup_purchase';
  session_id: string | null;
  balance_after: number;
  created_at: string;
}
