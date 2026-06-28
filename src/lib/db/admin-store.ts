import { createAdminClient } from '@/lib/supabase/server';

export interface AdminUser {
  email: string;
  role: 'super_admin' | 'admin' | 'moderator';
}

export interface BannedUser {
  userId: string;
  email: string;
  reason: string;
  bannedAt: string;
}

export interface ModerationLog {
  id: string;
  adminEmail: string;
  action: string;
  targetId: string;
  reason: string;
  timestamp: string;
}

export interface WhyCard {
  id: string;
  icon: string;
  title: string;
  description: string;
  order: number;
}

export interface HowStep {
  id: string;
  step_number: number;
  title: string;
  description: string;
  order: number;
}

export interface PromoBlock {
  id: string;
  title: string;
  content: string;
  image_url?: string;
  link_text?: string;
  link_url?: string;
  style: 'banner' | 'card' | 'feature';
  order: number;
  is_active: boolean;
}

export interface HomepageSettings {
  hero_title: string;
  hero_subtitle: string;
  hero_cta_text?: string;
  hero_cta_link?: string;
  hero_bg_images?: string[];
  hero_layout?: 'centered' | 'split';
  announcement: string;
  show_announcement: boolean;
  announcement_cta_text?: string;
  banner_text: string;
  banner_link: string;
  show_banner: boolean;
  spotlight_creators: string[];
  why_prizom_cards?: WhyCard[];
  how_it_works_steps?: HowStep[];
  promo_blocks?: PromoBlock[];
}

export interface MeetDeveloperSettings {
  name: string;
  bio: string;
  avatar_url: string;
  twitter?: string;
  github?: string;
  linkedin: string;
  instagram?: string;
  show_section: boolean;
  custom_text: string;
}

export interface FooterSettings {
  about_text: string;
  copyright_text?: string;
  twitter_link: string;
  instagram_link: string;
  youtube_link: string;
  legal_links: { label: string; url: string }[];
  support_links: { label: string; url: string }[];
  external_links?: { label: string; url: string }[];
}

export interface ContactMessageReply {
  body: string;
  repliedAt: string;
  adminEmail: string;
}

export interface ContactMessage {
  id: string;
  email: string;
  message: string;
  status: 'unread' | 'read' | 'archived';
  createdAt: string;
  replies?: ContactMessageReply[];
}

export interface Category {
  id: string; // URL-safe slug e.g. 'cinematic'
  name: string; // Display name e.g. 'Cinematic'
  description?: string;
  cover_image?: string; // Cover image URL
  order: number;
  is_featured: boolean;
  show_on_explore: boolean;
  approved: boolean;
  suggestedBy?: string;
}

export interface AiTool {
  id: string; // slug e.g. 'midjourney'
  name: string; // display name e.g. 'Midjourney v6'
  approved: boolean;
  suggestedBy?: string;
  show_on_explore?: boolean;
  order?: number;
}

export interface AspectRatioOption {
  id: string; // e.g. '1:1'
  label: string; // e.g. '1:1 (Square)'
  icon: string; // e.g. '□'
  order: number;
}

export interface ExploreSection {
  id: string;
  title: string;
  type: 'curated' | 'dynamic';
  algorithm?: 'trending' | 'most_remixed' | 'new_creators' | 'recent';
  prompt_ids?: string[];
  is_hidden: boolean;
  is_featured: boolean;
  order: number;
}

export interface AboutSettings {
  platform_mission: string;
  what_is_prizom: string;
  creator_ecosystem: string;
  twitter_link: string;
  instagram_link: string;
  youtube_link: string;
  discord_link: string;
}

export interface AdminStore {
  admin_users: AdminUser[];
  banned_users: BannedUser[];
  hidden_prompts: string[];
  featured_prompts: string[];
  manual_boosts: Record<string, number>;
  homepage_settings: HomepageSettings;
  meet_developer: MeetDeveloperSettings;
  footer_settings: FooterSettings;
  about_settings?: AboutSettings;
  moderation_logs: ModerationLog[];
  contact_messages: ContactMessage[];
  categories?: Category[];
  ai_tools?: AiTool[];
  explore_sections?: ExploreSection[];
  aspect_ratios?: AspectRatioOption[];
  suspended_users?: SuspendedUser[];
  appeals?: Appeal[];
}

// Default initial state matching initial JSON write
export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'anime', name: 'Anime', order: 1, is_featured: true, show_on_explore: true, approved: true },
  { id: 'cinematic', name: 'Cinematic', order: 2, is_featured: true, show_on_explore: true, approved: true },
  { id: 'realistic', name: 'Realistic', order: 3, is_featured: true, show_on_explore: true, approved: true },
  { id: 'fantasy', name: 'Fantasy', order: 4, is_featured: true, show_on_explore: true, approved: true },
  { id: 'portrait', name: 'Portrait', order: 5, is_featured: true, show_on_explore: true, approved: true },
  { id: 'character-design', name: 'Character Design', order: 6, is_featured: false, show_on_explore: true, approved: true },
  { id: 'fashion', name: 'Fashion', order: 7, is_featured: false, show_on_explore: true, approved: true },
  { id: 'product-photography', name: 'Product Photography', order: 8, is_featured: false, show_on_explore: true, approved: true },
  { id: 'architecture', name: 'Architecture', order: 9, is_featured: false, show_on_explore: true, approved: true },
  { id: 'landscape', name: 'Landscape', order: 10, is_featured: false, show_on_explore: true, approved: true },
  { id: 'sci-fi', name: 'Sci-Fi', order: 11, is_featured: false, show_on_explore: true, approved: true },
  { id: 'cyberpunk', name: 'Cyberpunk', order: 12, is_featured: false, show_on_explore: true, approved: true },
  { id: 'concept-art', name: 'Concept Art', order: 13, is_featured: false, show_on_explore: true, approved: true },
  { id: 'logo-design', name: 'Logo Design', order: 14, is_featured: false, show_on_explore: true, approved: true },
  { id: '3d-render', name: '3D Render', order: 15, is_featured: true, show_on_explore: true, approved: true }
];

export const DEFAULT_AI_TOOLS: AiTool[] = [
  { id: 'chatgpt', name: 'ChatGPT', approved: true, order: 1 },
  { id: 'gemini', name: 'Gemini', approved: true, order: 2 },
  { id: 'claude', name: 'Claude', approved: true, order: 3 },
  { id: 'midjourney', name: 'Midjourney', approved: true, order: 4 },
  { id: 'flux', name: 'Flux', approved: true, order: 5 },
  { id: 'veo', name: 'Veo', approved: true, order: 6 },
  { id: 'runway', name: 'Runway', approved: true, order: 7 },
  { id: 'leonardo-ai', name: 'Leonardo AI', approved: true, order: 8 },
  { id: 'ideogram', name: 'Ideogram', approved: true, order: 9 },
  { id: 'recraft', name: 'Recraft', approved: true, order: 10 }
];

export const DEFAULT_EXPLORE_SECTIONS: ExploreSection[] = [
  { id: 'featured', title: 'Featured Prompts', type: 'curated', prompt_ids: [], is_hidden: false, is_featured: true, order: 1 },
  { id: 'trending', title: 'Trending This Week', type: 'dynamic', algorithm: 'trending', is_hidden: false, is_featured: false, order: 2 },
  { id: 'most-remixed', title: 'Most Remixed', type: 'dynamic', algorithm: 'most_remixed', is_hidden: false, is_featured: false, order: 3 },
  { id: 'video-ai', title: 'AI Video Prompts', type: 'curated', prompt_ids: [], is_hidden: false, is_featured: false, order: 4 },
  { id: 'image-gen', title: 'Image Generation Prompts', type: 'curated', prompt_ids: [], is_hidden: false, is_featured: false, order: 5 },
  { id: 'chatgpt', title: 'ChatGPT Prompts', type: 'curated', prompt_ids: [], is_hidden: false, is_featured: false, order: 6 },
  { id: 'new-creators', title: 'New Creators To Follow', type: 'dynamic', algorithm: 'new_creators', is_hidden: false, is_featured: false, order: 7 },
  { id: 'recently-uploaded', title: 'Recently Created', type: 'dynamic', algorithm: 'recent', is_hidden: false, is_featured: false, order: 8 }
];

export const DEFAULT_ASPECT_RATIOS: AspectRatioOption[] = [
  { id: '1:1', label: '1:1 (Square)', icon: '□', order: 1 },
  { id: '4:5', label: '4:5 (Portrait)', icon: '▯', order: 2 },
  { id: '3:4', label: '3:4 (Portrait)', icon: '▯', order: 3 },
  { id: '9:16', label: '9:16 (Vertical)', icon: '▮', order: 4 },
  { id: '16:9', label: '16:9 (Landscape)', icon: '▯', order: 5 },
  { id: '21:9', label: '21:9 (Ultra Wide)', icon: '▬', order: 6 },
  { id: '2:3', label: '2:3', icon: '▯', order: 7 },
  { id: '3:2', label: '3:2', icon: '▯', order: 8 }
];

const DEFAULT_WHY_CARDS: WhyCard[] = [
  { id: 'discover', icon: '🎨', title: 'Discover AI Prompts', description: 'Browse and search prompt templates for Midjourney, Flux, and ChatGPT.', order: 1 },
  { id: 'learn', icon: '🎓', title: 'Learn from Creators', description: 'Inspect exact settings, seed weights, negative templates, and styles used by prompt engineers.', order: 2 },
  { id: 'remix', icon: '⚡', title: 'Remix Ideas', description: 'Remix any prompt to create variations and track the evolutionary lineage of artistic ideas.', order: 3 },
  { id: 'build', icon: '📸', title: 'Build Better Images', description: 'Combine community templates and generator tools to build stunning visuals instantly.', order: 4 }
];

const DEFAULT_HOW_STEPS: HowStep[] = [
  { id: 'step-1', step_number: 1, title: 'Discover Prompts', description: 'Browse categories or search tags to find the visual style you need.', order: 1 },
  { id: 'step-2', step_number: 2, title: 'Copy Prompt', description: 'Click copy to retrieve the exact generator text and negative settings.', order: 2 },
  { id: 'step-3', step_number: 3, title: 'Generate Images', description: 'Paste the template into your favorite generator tool to render assets.', order: 3 },
  { id: 'step-4', step_number: 4, title: 'Create Your Own', description: 'Publish your own prompt masterworks to build a creator following.', order: 4 }
];

const DEFAULT_PROMO_BLOCKS: PromoBlock[] = [
  { id: 'promo-access-key', title: 'Request an Access Key', content: 'Prizom is currently in an invite-only beta. If you are an AI prompt creator and want early access, please fill out our request form.', link_text: 'Request Access', link_url: 'https://forms.gle/popf1A15ktYrJhoA9', style: 'banner', order: 1, is_active: true }
];

const DEFAULT_STORE: AdminStore = {
  admin_users: [
    { email: 'superadmin@prizom.in', role: 'super_admin' },
    { email: 'admin@prizom.in', role: 'admin' },
    { email: 'moderator@prizom.in', role: 'moderator' }
  ],
  banned_users: [],
  hidden_prompts: [],
  featured_prompts: [],
  manual_boosts: {},
  homepage_settings: {
    hero_title: "Discover, Remix, and Share Next-Generation AI Prompts",
    hero_subtitle: "Prizom is the creative home for next-generation AI creators. A collaborative open-source canvas to discover and dynamically remix prompt engineering masterpieces.",
    hero_cta_text: "Discover Prompts",
    hero_cta_link: "/discover",
    hero_bg_images: [
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=1200&auto=format&fit=crop"
    ],
    hero_layout: "split",
    announcement: "Invite-only beta is live! Fill up the access request form.",
    show_announcement: true,
    announcement_cta_text: "Get Access Key",
    banner_text: "Invite-only is live! For access key, fill up this form.",
    banner_link: "https://forms.gle/popf1A15ktYrJhoA9",
    show_banner: false,
    spotlight_creators: [],
    why_prizom_cards: DEFAULT_WHY_CARDS,
    how_it_works_steps: DEFAULT_HOW_STEPS,
    promo_blocks: DEFAULT_PROMO_BLOCKS
  },
  meet_developer: {
    name: "Darshan Vaghela",
    bio: "Founder of Prizom, Video Editor, pursuing M.Sc. IT at MKBU University.",
    avatar_url: "/developer_avatar.png",
    linkedin: "https://www.linkedin.com/in/darshan-vaghela-1141a6359",
    instagram: "https://instagram.com/darshan.edits45",
    show_section: true,
    custom_text: "Connecting creators & developers globally"
  },
  footer_settings: {
    about_text: "The creative home for next-generation AI prompt engineering and collaborative remix culture. Evolve your prompt workflows together.",
    copyright_text: `© ${new Date().getFullYear()} Prizom. All rights reserved.`,
    twitter_link: "https://x.com/prizomHQ",
    instagram_link: "https://instagram.com/prizomHQ",
    youtube_link: "https://youtube.com/prizomhq",
    legal_links: [
      { label: "Terms of Service", url: "/terms" },
      { label: "Privacy Policy", url: "/privacy" }
    ],
    support_links: [
      { label: "Contact Us", url: "/settings?tab=contact-support" }
    ],
    external_links: [
      { label: "Discover", url: "/discover" },
      { label: "Trending", url: "/trending" },
      { label: "Settings", url: "/settings" }
    ]
  },
  about_settings: {
    platform_mission: "Empowering the next generation of AI artists and creators through a collaborative, visual-first canvas.",
    what_is_prizom: "Prizom is an open collaborative registry for AI prompts. We are a social prompt discovery platform built around endless visual exploration, personalized recommendations, and evolutionary prompt remixing.",
    creator_ecosystem: "A thriving community of prompt creators, digital artists, and generative developers. Share your masterpieces, build a following, and track the genetic lineage of your creative variations.",
    twitter_link: "https://x.com/prizomHQ",
    instagram_link: "https://instagram.com/prizomHQ",
    youtube_link: "https://youtube.com/prizomhq",
    discord_link: "https://discord.gg"
  },
  moderation_logs: [],
  contact_messages: [],
  categories: DEFAULT_CATEGORIES,
  ai_tools: DEFAULT_AI_TOOLS,
  explore_sections: DEFAULT_EXPLORE_SECTIONS,
  aspect_ratios: DEFAULT_ASPECT_RATIOS,
  suspended_users: [],
  appeals: []
};

// --- HELPER FUNCTION: GET SPECIFIC SETTINGS KEY ---
async function getSettingsVal<T>(key: string, defaultValue: T): Promise<T> {
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from('admin_settings')
    .select('value')
    .eq('key', key)
    .maybeSingle();
  if (error || !data) return defaultValue;
  return data.value as T;
}

// --- HELPER FUNCTION: SAVE SPECIFIC SETTINGS KEY ---
async function saveSettingsVal<T>(key: string, value: T): Promise<boolean> {
  const supabase = await createAdminClient();
  const { error } = await supabase
    .from('admin_settings')
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
  return !error;
}

// --- CORE STORE LOAD/SAVE ---
export async function getStore(): Promise<AdminStore> {
  try {
    const categories = await getCategories();
    const aiTools = await getAiTools();
    const adminUsers = await getAdminUsersList();
    const bannedUsers = await getBannedUsers();
    const suspendedUsers = await getSuspendedUsers();
    
    const homepageSettings = await getSettingsVal<HomepageSettings>('homepage_settings', DEFAULT_STORE.homepage_settings);
    const meetDeveloper = await getSettingsVal<MeetDeveloperSettings>('meet_developer', DEFAULT_STORE.meet_developer);
    const footerSettings = await getSettingsVal<FooterSettings>('footer_settings', DEFAULT_STORE.footer_settings);
    const aboutSettings = await getSettingsVal<AboutSettings>('about_settings', DEFAULT_STORE.about_settings!);
    const exploreSections = await getSettingsVal<ExploreSection[]>('explore_sections', DEFAULT_STORE.explore_sections!);
    const aspectRatios = await getSettingsVal<AspectRatioOption[]>('aspect_ratios', DEFAULT_STORE.aspect_ratios!);
    const manualBoosts = await getSettingsVal<Record<string, number>>('manual_boosts', DEFAULT_STORE.manual_boosts);

    const contactMessages = await getContactMessages();
    const moderationLogs = await getModerationLogs();

    const supabase = await createAdminClient();

    // Query active prompt IDs that are hidden or featured
    const { data: hiddenData } = await supabase.from('prompts').select('id').eq('is_hidden', true);
    const hiddenPrompts = (hiddenData || []).map(p => p.id);

    const { data: featuredData } = await supabase.from('prompts').select('id').eq('is_featured', true);
    const featuredPrompts = (featuredData || []).map(p => p.id);

    return {
      admin_users: adminUsers,
      banned_users: bannedUsers,
      hidden_prompts: hiddenPrompts,
      featured_prompts: featuredPrompts,
      manual_boosts: manualBoosts,
      homepage_settings: homepageSettings,
      meet_developer: meetDeveloper,
      footer_settings: footerSettings,
      about_settings: aboutSettings,
      moderation_logs: moderationLogs,
      contact_messages: contactMessages,
      categories,
      ai_tools: aiTools,
      explore_sections: exploreSections,
      aspect_ratios: aspectRatios,
      suspended_users: suspendedUsers,
      appeals: []
    };
  } catch (err) {
    console.error('Error fetching admin store:', err);
    return DEFAULT_STORE;
  }
}

async function getAdminUsersList(): Promise<AdminUser[]> {
  const supabase = await createAdminClient();
  const { data, error } = await supabase.from('whitelist_users').select('email, role');
  if (error || !data) return DEFAULT_STORE.admin_users;
  return data.map(u => ({ email: u.email, role: u.role as any }));
}

export async function saveStore(store: AdminStore): Promise<boolean> {
  try {
    const supabase = await createAdminClient();

    await saveSettingsVal('homepage_settings', store.homepage_settings);
    await saveSettingsVal('meet_developer', store.meet_developer);
    await saveSettingsVal('footer_settings', store.footer_settings);
    if (store.about_settings) await saveSettingsVal('about_settings', store.about_settings);
    if (store.explore_sections) await saveSettingsVal('explore_sections', store.explore_sections);
    if (store.aspect_ratios) await saveSettingsVal('aspect_ratios', store.aspect_ratios);
    if (store.manual_boosts) await saveSettingsVal('manual_boosts', store.manual_boosts);

    if (store.categories) {
      for (const cat of store.categories) {
        await supabase.from('categories').upsert({
          name: cat.name,
          slug: cat.id,
          description: cat.description || '',
          cover_image: cat.cover_image || '',
          "order": cat.order ?? 0,
          is_featured: cat.is_featured ?? false,
          show_on_explore: cat.show_on_explore ?? true,
          approved: cat.approved ?? true,
          suggested_by: cat.suggestedBy || ''
        }, { onConflict: 'slug' });
      }
    }

    if (store.ai_tools) {
      for (const tool of store.ai_tools) {
        await supabase.from('ai_tools').upsert({
          name: tool.name,
          slug: tool.id,
          approved: tool.approved ?? true,
          suggested_by: tool.suggestedBy || '',
          show_on_explore: tool.show_on_explore ?? true,
          "order": tool.order ?? 0
        }, { onConflict: 'slug' });
      }
    }

    if (store.admin_users) {
      for (const u of store.admin_users) {
        await supabase.from('whitelist_users').upsert({
          email: u.email.toLowerCase().trim(),
          role: u.role
        }, { onConflict: 'email' });
      }
    }

    return true;
  } catch (err) {
    console.error('Error writing to admin database:', err);
    return false;
  }
}

// Banned User Helpers
export async function getBannedUsers(): Promise<BannedUser[]> {
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, ban_reason, updated_at')
    .in('role', ['banned', 'permanently_banned']);
  if (error || !data) return [];
  return data.map(u => ({
    userId: u.id,
    email: `${u.username}@prizom.com`,
    reason: u.ban_reason || 'Banned by admin',
    bannedAt: u.updated_at || new Date().toISOString()
  }));
}

export async function isUserBanned(userId: string): Promise<boolean> {
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle();
  if (error || !data) return false;
  return data.role === 'banned' || data.role === 'permanently_banned';
}

export async function banUser(userId: string, email: string, reason: string): Promise<boolean> {
  const supabase = await createAdminClient();
  const { error } = await supabase
    .from('profiles')
    .update({ role: 'permanently_banned', ban_reason: reason })
    .eq('id', userId);
  return !error;
}

export async function unbanUser(userId: string): Promise<boolean> {
  const supabase = await createAdminClient();
  const { error } = await supabase
    .from('profiles')
    .update({ role: 'user', ban_reason: null })
    .eq('id', userId);
  return !error;
}

// Featured Prompts Helpers
export async function getFeaturedPrompts(): Promise<string[]> {
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from('prompts')
    .select('id')
    .eq('is_featured', true);
  if (error || !data) return [];
  return data.map(p => p.id);
}

export async function featurePrompt(promptId: string, featured: boolean): Promise<boolean> {
  const supabase = await createAdminClient();
  const { error } = await supabase
    .from('prompts')
    .update({ is_featured: featured })
    .eq('id', promptId);

  // Sync to featured explore section
  const exploreSections = await getSettingsVal<ExploreSection[]>('explore_sections', DEFAULT_EXPLORE_SECTIONS);
  const featuredSec = exploreSections.find(s => s.id === 'featured');
  if (featuredSec) {
    if (!featuredSec.prompt_ids) featuredSec.prompt_ids = [];
    const idx = featuredSec.prompt_ids.indexOf(promptId);
    if (featured && idx === -1) {
      featuredSec.prompt_ids.push(promptId);
    } else if (!featured && idx !== -1) {
      featuredSec.prompt_ids.splice(idx, 1);
    }
    await saveSettingsVal('explore_sections', exploreSections);
  }

  return !error;
}

// Hidden Prompts Helpers
export async function getHiddenPrompts(): Promise<string[]> {
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from('prompts')
    .select('id')
    .eq('is_hidden', true);
  if (error || !data) return [];
  return data.map(p => p.id);
}

export async function isPromptHidden(promptId: string): Promise<boolean> {
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from('prompts')
    .select('is_hidden, moderation_status')
    .eq('id', promptId)
    .maybeSingle();
  if (error || !data) return false;
  return data.is_hidden || data.moderation_status === 'pending_deletion';
}

export async function hidePrompt(promptId: string, hidden: boolean): Promise<boolean> {
  const supabase = await createAdminClient();
  const { error } = await supabase
    .from('prompts')
    .update({ is_hidden: hidden })
    .eq('id', promptId);
  return !error;
}

// Manual Boost Helpers
export async function getManualBoosts(): Promise<Record<string, number>> {
  return getSettingsVal<Record<string, number>>('manual_boosts', {});
}

export async function setPromptBoost(promptId: string, boost: number): Promise<boolean> {
  const boosts = await getManualBoosts();
  if (boost <= 0 || boost === 1) {
    delete boosts[promptId];
  } else {
    boosts[promptId] = boost;
  }
  return saveSettingsVal('manual_boosts', boosts);
}

// Moderation Log Helpers
export async function getModerationLogs(): Promise<ModerationLog[]> {
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from('moderation_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1000);
  if (error || !data) return [];
  return data.map(log => ({
    id: log.id,
    adminEmail: log.moderator_email,
    action: log.action,
    targetId: log.target_id,
    reason: log.reason || '',
    timestamp: log.created_at
  }));
}

export async function addModerationLog(adminEmail: string, action: string, targetId: string, reason: string): Promise<boolean> {
  const supabase = await createAdminClient();
  const { error } = await supabase
    .from('moderation_logs')
    .insert({
      moderator_email: adminEmail,
      action,
      target_id: targetId,
      reason
    });
  return !error;
}

// Admin Users helpers
export async function isEmailAdmin(email: string): Promise<AdminUser | null> {
  const supabase = await createAdminClient();
  const normalized = email.toLowerCase().trim();
  const { data, error } = await supabase
    .from('whitelist_users')
    .select('email, role')
    .eq('email', normalized)
    .maybeSingle();
  if (error || !data) return null;
  return { email: data.email, role: data.role as any };
}

export async function addAdminUser(email: string, role: 'super_admin' | 'admin' | 'moderator'): Promise<boolean> {
  const supabase = await createAdminClient();
  const normalized = email.toLowerCase().trim();
  const { error } = await supabase
    .from('whitelist_users')
    .insert({ email: normalized, role });
  return !error;
}

export async function removeAdminUser(email: string): Promise<boolean> {
  const supabase = await createAdminClient();
  const normalized = email.toLowerCase().trim();
  const { error } = await supabase
    .from('whitelist_users')
    .delete()
    .eq('email', normalized);
  return !error;
}

// Contact Messages Helpers
export async function getContactMessages(): Promise<ContactMessage[]> {
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from('contact_messages')
    .select('*')
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return data.map(m => ({
    id: m.id,
    email: m.email,
    message: m.message,
    status: m.status as any,
    createdAt: m.created_at,
    replies: m.replies || []
  }));
}

export async function addContactMessage(email: string, message: string): Promise<boolean> {
  const supabase = await createAdminClient();
  const { error } = await supabase
    .from('contact_messages')
    .insert({
      email: email.trim(),
      message: message.trim(),
      status: 'unread'
    });
  return !error;
}

export async function updateContactMessageStatus(id: string, status: 'unread' | 'read' | 'archived'): Promise<boolean> {
  const supabase = await createAdminClient();
  const { error } = await supabase
    .from('contact_messages')
    .update({ status })
    .eq('id', id);
  return !error;
}

export async function deleteContactMessage(id: string): Promise<boolean> {
  const supabase = await createAdminClient();
  const { error } = await supabase
    .from('contact_messages')
    .delete()
    .eq('id', id);
  return !error;
}

// Category Helpers
export async function getCategories(): Promise<Category[]> {
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('order', { ascending: true });
  if (error || !data) return DEFAULT_CATEGORIES;
  return data.map(c => ({
    id: c.slug,
    name: c.name,
    description: c.description || '',
    cover_image: c.cover_image || '',
    order: c.order,
    is_featured: c.is_featured,
    show_on_explore: c.show_on_explore,
    approved: c.approved,
    suggestedBy: c.suggested_by
  }));
}

export async function addCategory(category: Category): Promise<boolean> {
  const supabase = await createAdminClient();
  const { error } = await supabase
    .from('categories')
    .insert({
      name: category.name,
      slug: category.id,
      description: category.description || '',
      cover_image: category.cover_image || '',
      "order": category.order ?? 0,
      is_featured: category.is_featured ?? false,
      show_on_explore: category.show_on_explore ?? true,
      approved: category.approved ?? true,
      suggested_by: category.suggestedBy || ''
    });
  return !error;
}

export async function updateCategory(category: Category): Promise<boolean> {
  const supabase = await createAdminClient();
  const { error } = await supabase
    .from('categories')
    .update({
      name: category.name,
      description: category.description || '',
      cover_image: category.cover_image || '',
      "order": category.order ?? 0,
      is_featured: category.is_featured ?? false,
      show_on_explore: category.show_on_explore ?? true,
      approved: category.approved ?? true,
      suggested_by: category.suggestedBy || ''
    })
    .eq('slug', category.id);
  return !error;
}

export async function deleteCategory(id: string): Promise<boolean> {
  const supabase = await createAdminClient();
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('slug', id);
  return !error;
}

export async function approveCategory(id: string): Promise<boolean> {
  const supabase = await createAdminClient();
  const { error } = await supabase
    .from('categories')
    .update({ approved: true })
    .eq('slug', id);
  return !error;
}

// AI Tool Helpers
export async function getAiTools(): Promise<AiTool[]> {
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from('ai_tools')
    .select('*')
    .order('order', { ascending: true });
  if (error || !data) return DEFAULT_AI_TOOLS;
  return data.map(t => ({
    id: t.slug,
    name: t.name,
    approved: t.approved,
    suggestedBy: t.suggested_by,
    show_on_explore: t.show_on_explore,
    order: t.order
  }));
}

export async function addAiTool(tool: AiTool): Promise<boolean> {
  const supabase = await createAdminClient();
  const { error } = await supabase
    .from('ai_tools')
    .insert({
      name: tool.name,
      slug: tool.id,
      approved: tool.approved ?? true,
      suggested_by: tool.suggestedBy || '',
      show_on_explore: tool.show_on_explore ?? true,
      "order": tool.order ?? 0
    });
  return !error;
}

export async function deleteAiTool(id: string): Promise<boolean> {
  const supabase = await createAdminClient();
  const { error } = await supabase
    .from('ai_tools')
    .delete()
    .eq('slug', id);
  return !error;
}

export async function approveAiTool(id: string): Promise<boolean> {
  const supabase = await createAdminClient();
  const { error } = await supabase
    .from('ai_tools')
    .update({ approved: true })
    .eq('slug', id);
  return !error;
}

export async function renameCategory(id: string, name: string): Promise<boolean> {
  const supabase = await createAdminClient();
  const { error } = await supabase
    .from('categories')
    .update({ name })
    .eq('slug', id);
  return !error;
}

export async function renameAiTool(id: string, name: string): Promise<boolean> {
  const supabase = await createAdminClient();
  const { error } = await supabase
    .from('ai_tools')
    .update({ name })
    .eq('slug', id);
  return !error;
}

export async function toggleAiToolExplore(id: string): Promise<boolean> {
  const supabase = await createAdminClient();
  const { data, error: fetchError } = await supabase
    .from('ai_tools')
    .select('show_on_explore')
    .eq('slug', id)
    .maybeSingle();
  if (fetchError || !data) return false;
  
  const { error } = await supabase
    .from('ai_tools')
    .update({ show_on_explore: !data.show_on_explore })
    .eq('slug', id);
  return !error;
}

export async function getAspectRatios(): Promise<AspectRatioOption[]> {
  return getSettingsVal<AspectRatioOption[]>('aspect_ratios', DEFAULT_ASPECT_RATIOS);
}

export async function updateAspectRatios(ratios: AspectRatioOption[]): Promise<boolean> {
  return saveSettingsVal('aspect_ratios', ratios);
}

// Explore Section Helpers
export async function getExploreSections(): Promise<ExploreSection[]> {
  return getSettingsVal<ExploreSection[]>('explore_sections', DEFAULT_EXPLORE_SECTIONS);
}

export async function addExploreSection(section: ExploreSection): Promise<boolean> {
  const sections = await getExploreSections();
  if (sections.some(s => s.id === section.id)) return false;
  sections.push(section);
  return saveSettingsVal('explore_sections', sections);
}

export async function updateExploreSection(section: ExploreSection): Promise<boolean> {
  const sections = await getExploreSections();
  const index = sections.findIndex(s => s.id === section.id);
  if (index === -1) return false;
  
  const original = sections[index];
  sections[index] = {
    ...original,
    ...section,
    prompt_ids: section.prompt_ids ?? original.prompt_ids ?? []
  };

  // Sync featured explore section to featured_prompts (represented as is_featured on prompt rows)
  if (section.id === 'featured' && section.prompt_ids) {
    const supabase = await createAdminClient();
    // Reset featured flag
    await supabase.from('prompts').update({ is_featured: false }).eq('is_featured', true);
    if (section.prompt_ids.length > 0) {
      await supabase.from('prompts').update({ is_featured: true }).in('id', section.prompt_ids);
    }
  }

  return saveSettingsVal('explore_sections', sections);
}

export async function deleteExploreSection(id: string): Promise<boolean> {
  const sections = await getExploreSections();
  const filtered = sections.filter(s => s.id !== id);
  return saveSettingsVal('explore_sections', filtered);
}

export async function reorderExploreSections(orders: { id: string; order: number }[]): Promise<boolean> {
  const sections = await getExploreSections();
  orders.forEach(item => {
    const found = sections.find(s => s.id === item.id);
    if (found) found.order = item.order;
  });
  sections.sort((a, b) => a.order - b.order);
  return saveSettingsVal('explore_sections', sections);
}

export async function assignPromptToSection(promptId: string, sectionId: string, assign: boolean): Promise<boolean> {
  const sections = await getExploreSections();
  const found = sections.find(s => s.id === sectionId);
  if (!found || found.type !== 'curated') return false;
  
  if (!found.prompt_ids) found.prompt_ids = [];
  const index = found.prompt_ids.indexOf(promptId);
  if (assign && index === -1) {
    found.prompt_ids.push(promptId);
  } else if (!assign && index !== -1) {
    found.prompt_ids.splice(index, 1);
  }

  // Sync featured explore section
  if (sectionId === 'featured') {
    const supabase = await createAdminClient();
    await supabase.from('prompts').update({ is_featured: assign }).eq('id', promptId);
  }

  return saveSettingsVal('explore_sections', sections);
}

// Suspended User Helpers
export interface SuspendedUser {
  userId: string;
  email: string;
  username: string;
  reason: string;
  suspendedAt: string;
  suspendedUntil: string;
  warningSent?: boolean;
}

export interface Appeal {
  id: string;
  userId: string;
  username: string;
  email: string;
  reason: string;
  supportingInfo?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export async function getSuspendedUsers(): Promise<SuspendedUser[]> {
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, suspended_at, warning_sent, ban_reason')
    .eq('role', 'suspended');
  if (error || !data) return [];
  return data.map(u => {
    const suspendedAt = u.suspended_at || new Date().toISOString();
    const suspendedUntil = new Date(suspendedAt);
    suspendedUntil.setDate(suspendedUntil.getDate() + 15);
    return {
      userId: u.id,
      email: `${u.username}@prizom.com`,
      username: u.username,
      reason: u.ban_reason || 'Guidelines violation',
      suspendedAt,
      suspendedUntil: suspendedUntil.toISOString(),
      warningSent: u.warning_sent ?? false
    };
  });
}

export async function isUserSuspended(userId: string): Promise<boolean> {
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle();
  if (error || !data) return false;
  return data.role === 'suspended';
}

export async function getSuspendedUser(userId: string): Promise<SuspendedUser | undefined> {
  const list = await getSuspendedUsers();
  return list.find(u => u.userId === userId);
}

export async function suspendUser(userId: string, email: string, username: string, reason: string): Promise<boolean> {
  const supabase = await createAdminClient();
  const suspendedAt = new Date().toISOString();
  const { error } = await supabase
    .from('profiles')
    .update({
      role: 'suspended',
      suspended_at: suspendedAt,
      warning_sent: false,
      appeal_status: 'none',
      ban_reason: reason
    })
    .eq('id', userId);
  return !error;
}

export async function unsuspendUser(userId: string): Promise<boolean> {
  const supabase = await createAdminClient();
  const { error } = await supabase
    .from('profiles')
    .update({
      role: 'user',
      suspended_at: null,
      warning_sent: false,
      appeal_status: 'none',
      appeal_reason: null,
      appeal_supporting_info: null,
      ban_reason: null
    })
    .eq('id', userId);
  return !error;
}

// Appeals Helpers
export async function getAppeals(): Promise<Appeal[]> {
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, ban_reason, appeal_status, appeal_reason, appeal_supporting_info, suspended_at')
    .eq('role', 'suspended')
    .in('appeal_status', ['pending', 'approved', 'rejected']);
  if (error || !data) return [];
  return data.map(u => ({
    id: 'appeal-' + u.id,
    userId: u.id,
    username: u.username,
    email: `${u.username}@prizom.com`,
    reason: u.appeal_reason || '',
    supportingInfo: u.appeal_supporting_info || '',
    status: u.appeal_status as any,
    createdAt: u.suspended_at || new Date().toISOString()
  }));
}

export async function submitAppeal(userId: string, username: string, email: string, reason: string, supportingInfo?: string): Promise<Appeal | null> {
  const supabase = await createAdminClient();
  const { error } = await supabase
    .from('profiles')
    .update({
      appeal_status: 'pending',
      appeal_reason: reason,
      appeal_supporting_info: supportingInfo || ''
    })
    .eq('id', userId);
  
  if (error) return null;
  
  return {
    id: 'appeal-' + userId,
    userId,
    username,
    email,
    reason,
    supportingInfo,
    status: 'pending',
    createdAt: new Date().toISOString()
  };
}

export async function updateAppealStatus(appealId: string, status: 'pending' | 'approved' | 'rejected'): Promise<boolean> {
  const supabase = await createAdminClient();
  // appealId is constructed as 'appeal-' + userId
  const userId = appealId.startsWith('appeal-') ? appealId.replace('appeal-', '') : appealId;
  const { error } = await supabase
    .from('profiles')
    .update({ appeal_status: status })
    .eq('id', userId);
  return !error;
}
