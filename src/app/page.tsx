import HomeFeed from '@/components/ui/HomeFeed';
import LandingPage from '@/components/layout/LandingPage';
import { createClient } from '@/lib/supabase/server';
import { getPublicCMS } from '@/app/actions/adminActions';

export const metadata = {
  title: 'Prizom | Collaborative AI Prompt Registry',
  description: 'Prizom is an open collaborative registry for AI prompts. Discover prompt formulas, remix templates to track variation lineages, and save generative workflows.',
};

export default async function Home() {
  const supabase = await createClient();
  
  // 1. Fetch user session status
  const { data: { user } } = await supabase.auth.getUser();

  // 2. Fetch public CMS settings
  const cmsRes = await getPublicCMS();

  if (!user) {
    return <LandingPage cmsData={cmsRes} />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#fcfcfc] overflow-hidden">
      {/* Background Blurs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[var(--color-electric-blue)]/10 blur-[130px]" />
        <div className="absolute top-[20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-[var(--color-neon-purple)]/10 blur-[140px]" />
      </div>

      <main className="flex-1 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 w-full pb-6 md:pb-20 pt-6">
        {/* Dynamic header / title to give users context on first load, minimal and clean */}
        <div className="mb-8 mt-4">
          <h1 className="text-2xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
            Personalized Feed
          </h1>
          <p className="text-xs text-zinc-500 font-semibold mt-1">Based on your liked categories, saved tags, creator actions, and tools.</p>
        </div>

        {/* Personalized infinite feed */}
        <HomeFeed />
      </main>
    </div>
  );
}
