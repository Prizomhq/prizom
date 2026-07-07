export interface CreatorProfile {
  id?: string;
  username: string;
  full_name?: string | null;
  avatar_url?: string | null;
  role?: string | null;
  badges?: string[] | null;
  bio?: string | null;
}

export interface DBPrompt {
  id: string;
  title: string;
  image_url?: string | null;
  ai_tool: string;
  likes_count: number;
  saves_count: number;
  description?: string | null;
  tags?: string[] | null;
  remix_of?: string | null;
  remix_count?: number | null;
  aspect_ratio?: string | null;
  category: string;
  image_width?: number | null;
  image_height?: number | null;
  profiles?: CreatorProfile | null;
}

export interface AITool {
  id: string;
  name: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string | null;
  cover_image?: string | null;
}

export interface FollowUser {
  id: string;
  username: string;
  full_name?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  role?: string | null;
  badges?: string[] | null;
}
