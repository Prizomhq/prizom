-- P1-6 Migration: Performance Indexes for public launch bottlenecks
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_comments_prompt ON comments(prompt_id);
CREATE INDEX IF NOT EXISTS idx_followers_following ON followers(following_id);
CREATE INDEX IF NOT EXISTS idx_likes_prompt ON likes(prompt_id);
CREATE INDEX IF NOT EXISTS idx_saved_prompts_prompt ON saved_prompts(prompt_id);
