-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- PROFILES
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  follower_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  role TEXT DEFAULT 'user',
  badges JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- PROMPTS
CREATE TABLE prompts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  prompt_text TEXT NOT NULL,
  negative_prompt TEXT,
  ai_tool TEXT NOT NULL, -- ChatGPT, Midjourney, etc.
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  image_url TEXT,
  aspect_ratio TEXT DEFAULT '1:1' NOT NULL,
  generation_settings JSONB DEFAULT '{}'::jsonb,
  likes_count INTEGER DEFAULT 0,
  saves_count INTEGER DEFAULT 0,
  copies_count INTEGER DEFAULT 0,
  remix_of UUID REFERENCES prompts(id) ON DELETE SET NULL,
  remix_notes TEXT,
  remix_parent_chain UUID[] DEFAULT '{}',
  remix_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- LIKES
CREATE TABLE likes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  prompt_id UUID REFERENCES prompts(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, prompt_id)
);

-- SAVES (Collections)
CREATE TABLE saves (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  prompt_id UUID REFERENCES prompts(id) ON DELETE CASCADE NOT NULL,
  collection_name TEXT DEFAULT 'General',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, prompt_id, collection_name)
);

-- COMMENTS
CREATE TABLE comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  prompt_id UUID REFERENCES prompts(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- FOLLOWERS
CREATE TABLE followers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  follower_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(follower_id, following_id),
  CONSTRAINT no_self_follow CHECK (follower_id <> following_id)
);

-- RLS POLICIES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE followers ENABLE ROW LEVEL SECURITY;

-- Profiles: Public read, users can update their own except for the role column
CREATE POLICY "Public profiles are viewable by everyone." ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile except role." ON profiles 
  FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id 
    AND role IS NOT DISTINCT FROM (SELECT role FROM public.profiles WHERE id = auth.uid())
  );

-- Prompts: Public read, authenticated users can insert, users can update/delete their own
CREATE POLICY "Prompts are viewable by everyone." ON prompts FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create prompts." ON prompts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own prompts." ON prompts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own prompts." ON prompts FOR DELETE USING (auth.uid() = user_id);

-- Likes: Public read, users can manage their own
CREATE POLICY "Likes are viewable by everyone." ON likes FOR SELECT USING (true);
CREATE POLICY "Users can insert own likes." ON likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own likes." ON likes FOR DELETE USING (auth.uid() = user_id);

-- Saves: Users can manage and view their own saves
CREATE POLICY "Users can view own saves." ON saves FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own saves." ON saves FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own saves." ON saves FOR DELETE USING (auth.uid() = user_id);

-- Comments: Public read, authenticated users can insert, users can update/delete their own
CREATE POLICY "Comments are viewable by everyone." ON comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create comments." ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments." ON comments FOR DELETE USING (auth.uid() = user_id);

-- Followers: Public read, authenticated users can follow/unfollow
CREATE POLICY "Followers are viewable by everyone." ON followers FOR SELECT USING (true);
CREATE POLICY "Users can follow others." ON followers FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow others." ON followers FOR DELETE USING (auth.uid() = follower_id);

-- Functions and Triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update follower/following counts
CREATE OR REPLACE FUNCTION handle_follow_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE profiles SET following_count = following_count + 1 WHERE id = NEW.follower_id;
    UPDATE profiles SET follower_count = follower_count + 1 WHERE id = NEW.following_id;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE profiles SET following_count = GREATEST(0, following_count - 1) WHERE id = OLD.follower_id;
    UPDATE profiles SET follower_count = GREATEST(0, follower_count - 1) WHERE id = OLD.following_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_follow_change
  AFTER INSERT OR DELETE ON followers
  FOR EACH ROW EXECUTE PROCEDURE handle_follow_change();

-- Trigger to automatically update remix counts on insert
CREATE OR REPLACE FUNCTION public.handle_remix_count_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.remix_of IS NOT NULL) THEN
    UPDATE public.prompts SET remix_count = remix_count + 1 WHERE id = NEW.remix_of;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_remix_created
  AFTER INSERT ON public.prompts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_remix_count_change();

CREATE TRIGGER update_profiles_modtime
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_prompts_modtime
BEFORE UPDATE ON prompts
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Create a function to automatically insert a profile for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)), 
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger that fires the function after a new user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- STORAGE BUCKETS
-- Insert prompts bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('prompts', 'prompts', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
-- Public read access
CREATE POLICY "Public Read Access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'prompts');

-- Authenticated upload access
CREATE POLICY "Authenticated users can upload images" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'prompts');

-- ====================================================
-- MODERATION, SAFETY, NOTIFICATIONS & ACHIEVEMENTS
-- ====================================================

-- BLOCKED USERS
CREATE TABLE blocked_users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  blocker_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  blocked_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(blocker_id, blocked_id),
  CONSTRAINT no_self_block CHECK (blocker_id <> blocked_id)
);

-- USER REPORTS
CREATE TABLE user_reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  reporter_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reported_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT DEFAULT 'pending' NOT NULL, -- pending, reviewed, dismissed
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- PROMPT REPORTS
CREATE TABLE prompt_reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  reporter_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  prompt_id UUID REFERENCES prompts(id) ON DELETE CASCADE NOT NULL,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT DEFAULT 'pending' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- NOTIFICATIONS
CREATE TABLE notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL, -- Recipient
  actor_id UUID REFERENCES profiles(id) ON DELETE CASCADE, -- Triggerer (NULL for system/achievements)
  type TEXT NOT NULL, -- 'follow', 'remix', 'like', 'save', 'achievement'
  entity_id UUID, -- Prompt ID, Collection ID, etc.
  text TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ACHIEVEMENTS
CREATE TABLE achievements (
  id TEXT PRIMARY KEY, -- 'first_upload', 'ten_likes', etc.
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  badge_icon TEXT NOT NULL -- Emoji or SVG reference
);

-- USER ACHIEVEMENTS
CREATE TABLE user_achievements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  achievement_id TEXT REFERENCES achievements(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, achievement_id)
);

-- RLS POLICIES FOR NEW TABLES
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Blocked Users Policies
CREATE POLICY "Users can view own blocks." ON blocked_users FOR SELECT USING (auth.uid() = blocker_id);
CREATE POLICY "Users can block others." ON blocked_users FOR INSERT WITH CHECK (auth.uid() = blocker_id);
CREATE POLICY "Users can delete own blocks." ON blocked_users FOR DELETE USING (auth.uid() = blocker_id);

-- User Reports Policies
CREATE POLICY "Authenticated users can submit user reports." ON user_reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Users can view own submitted user reports." ON user_reports FOR SELECT USING (auth.uid() = reporter_id);
CREATE POLICY "Admins can view all user reports." ON user_reports FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('super_admin', 'admin', 'moderator')));
CREATE POLICY "Admins can update user reports." ON user_reports FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('super_admin', 'admin', 'moderator')));

-- Prompt Reports Policies
CREATE POLICY "Authenticated users can submit prompt reports." ON prompt_reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Users can view own submitted prompt reports." ON prompt_reports FOR SELECT USING (auth.uid() = reporter_id);
CREATE POLICY "Admins can view all prompt reports." ON prompt_reports FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('super_admin', 'admin', 'moderator')));
CREATE POLICY "Admins can update prompt reports." ON prompt_reports FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('super_admin', 'admin', 'moderator')));

-- Notifications Policies
CREATE POLICY "Users can view own notifications." ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications." ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "System/Users can insert notifications for others." ON notifications FOR INSERT WITH CHECK (auth.uid() = actor_id OR actor_id IS NULL);

-- Achievements Policies
CREATE POLICY "Achievements are viewable by everyone." ON achievements FOR SELECT USING (true);

-- User Achievements Policies
CREATE POLICY "User achievements are viewable by everyone." ON user_achievements FOR SELECT USING (true);
CREATE POLICY "System/Users can record achievements." ON user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- SEED INITAL ACHIEVEMENTS
INSERT INTO achievements (id, title, description, badge_icon) VALUES
  ('first_upload', 'Pioneering Upload', 'Published your first AI prompt template.', '🚀'),
  ('first_remix', 'Dynamic Remix', 'Successfully branched and remixed an existing prompt template.', '⚡'),
  ('ten_likes', 'Rising Star', 'Gathered 10 likes from the creative community.', '⭐'),
  ('trending_prompt', 'Velocity Champ', 'Landed on the trending leaderboard.', '🔥'),
  ('community_favorite', 'Community Choice', 'Saved/Bookmarked by 5 other creators in their collections.', '❤️')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  badge_icon = EXCLUDED.badge_icon;

