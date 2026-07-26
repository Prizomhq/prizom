'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Home, Tags, LayoutGrid, Settings, Loader2 } from 'lucide-react';
import { getPublicCMS } from '@/app/actions/adminActions';
import AdminPageHeader from '@/components/admin/ui/AdminPageHeader';
import HeroCMSModule from '@/components/admin/content/HeroCMSModule';
import TaxonomyCMSModule from '@/components/admin/content/TaxonomyCMSModule';
import ExploreCMSModule from '@/components/admin/content/ExploreCMSModule';
import TeamCMSModule from '@/components/admin/content/TeamCMSModule';

export default function AdminContentPage() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'homepage';
  
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [cmsData, setCmsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadCMS = () => {
    setLoading(true);
    getPublicCMS().then((res: any) => {
      if (res.success) {
        setCmsData(res);
      }
      setLoading(false);
    });
  };


  useEffect(() => {
    loadCMS();
  }, []);

  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Page Header */}
      <AdminPageHeader
        title="Content Management & CMS Control"
        description="Manage homepage hero copy, explore collection rows, categories, AI model tags, and admin team clearance."
        icon={Home}
        badge={{ text: 'Production CMS', variant: 'indigo' }}
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Content CMS' }]}
      />

      {/* Tab Selector */}
      <div className="flex items-center gap-1.5 p-1.5 bg-zinc-100/80 rounded-xl border border-zinc-200/80 w-fit text-xs font-semibold text-zinc-600">
        <button
          onClick={() => setActiveTab('homepage')}
          className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
            activeTab === 'homepage' ? 'bg-white text-zinc-900 shadow-2xs font-bold' : 'hover:text-zinc-900'
          }`}
        >
          <Home className="w-3.5 h-3.5" />
          Hero & Branding
        </button>
        <button
          onClick={() => setActiveTab('taxonomy')}
          className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
            activeTab === 'taxonomy' || activeTab === 'categories' ? 'bg-white text-zinc-900 shadow-2xs font-bold' : 'hover:text-zinc-900'
          }`}
        >
          <Tags className="w-3.5 h-3.5" />
          Categories & AI Tools
        </button>
        <button
          onClick={() => setActiveTab('explore')}
          className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
            activeTab === 'explore' ? 'bg-white text-zinc-900 shadow-2xs font-bold' : 'hover:text-zinc-900'
          }`}
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          Explore Collections
        </button>
        <button
          onClick={() => setActiveTab('team')}
          className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
            activeTab === 'team' ? 'bg-white text-zinc-900 shadow-2xs font-bold' : 'hover:text-zinc-900'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          Team & Clearance
        </button>
      </div>

      {/* Tab Module Rendering */}
      {loading ? (
        <div className="min-h-[400px] flex flex-col items-center justify-center text-zinc-400 gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
          <span className="text-xs">Loading CMS modules...</span>
        </div>
      ) : (
        <>
          {activeTab === 'homepage' && (
            <HeroCMSModule initialCms={cmsData} onRefresh={loadCMS} />
          )}
          {(activeTab === 'taxonomy' || activeTab === 'categories') && (
            <TaxonomyCMSModule initialCms={cmsData} onRefresh={loadCMS} />
          )}
          {activeTab === 'explore' && (
            <ExploreCMSModule />
          )}
          {activeTab === 'team' && (
            <TeamCMSModule />
          )}
        </>
      )}

    </div>
  );
}
