'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  ArrowLeft, 
  ArrowUpRight,
  UploadCloud, 
  Loader2, 
  CheckCircle2, 
  User as UserIcon, 
  ShieldAlert, 
  AlertTriangle,
  Trash2,
  HelpCircle,
  Info,
  ChevronDown,
  Mail,
  Globe,
  Award,
  ShieldCheck,
  Scale
} from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { updateProfile, deactivateAccountAction, requestAccountDeletionAction } from '@/app/actions/profile';
import { getBlockedUsers, unblockUser } from '@/app/actions/moderation';
import Avatar from '@/components/ui/Avatar';
import ContactForm from '@/components/ui/ContactForm';
import { getAboutCMS } from '@/app/actions/adminActions';

function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams ? searchParams.get('tab') : null;
  const supabase = createClient();
  
  // Workspace active tab
  const [activeTab, setActiveTab] = useState<'account' | 'help' | 'verification-program' | 'legal' | 'about' | 'contact-support'>('help');

  // Load States
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);
  
  // Profile Form States
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);

  // Moderation States
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  const [loadingBlocks, setLoadingBlocks] = useState(true);
  const [unblockingId, setUnblockingId] = useState<string | null>(null);

  // About Prizom State
  const [aboutSettings, setAboutSettings] = useState<any>(null);

  // Help Accordion State
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);

  // Account Lifecycle states
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deactivateReason, setDeactivateReason] = useState('');
  const [deactivateFeedback, setDeactivateFeedback] = useState('');
  const [deleteReason, setDeleteReason] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [lifecycleLoading, setLifecycleLoading] = useState(false);

  useEffect(() => {
    if (countdown <= 0) return;
    const interval = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [countdown]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUsernameChange = (val: string) => {
    const cleaned = val.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setUsername(cleaned);
    
    if (cleaned.length > 0 && cleaned.length < 3) {
      setUsernameError('Username must be at least 3 characters.');
    } else if (cleaned.length > 20) {
      setUsernameError('Username cannot exceed 20 characters.');
    } else {
      setUsernameError(null);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUser(user);
        
        if (user) {
          const [profileRes, blocksList, aboutRes] = await Promise.all([
            supabase.from('profiles').select('*').eq('id', user.id).single(),
            getBlockedUsers(),
            getAboutCMS()
          ]);

          if (profileRes.data) {
            setUsername(profileRes.data.username || '');
            setFullName(profileRes.data.full_name || '');
            setBio(profileRes.data.bio || '');
            setAvatarUrl(profileRes.data.avatar_url);
          }
          setBlockedUsers(blocksList);
          if (aboutRes.success) {
            setAboutSettings(aboutRes.about);
          }
        } else {
          const aboutRes = await getAboutCMS();
          if (aboutRes.success) {
            setAboutSettings(aboutRes.about);
          }
        }
      } catch (err) {
        console.error('Error fetching settings:', err);
      } finally {
        setHasCheckedAuth(true);
        setLoading(false);
        setLoadingBlocks(false);
      }
    };
    checkAuth();
  }, [supabase]);

  useEffect(() => {
    if (!hasCheckedAuth) return;

    // Handle redirects for deprecated tabs
    const redirectMap: Record<string, string> = {
      'terms': '/terms',
      'privacy-policy': '/privacy',
      'privacy-rights': '/privacy#rights',
      'copyright-policy': '/copyright-policy',
      'community-guidelines': '/community-guidelines'
    };

    if (tabParam && redirectMap[tabParam]) {
      router.replace(redirectMap[tabParam]);
      return;
    }

    const allowedTabs = ['account', 'help', 'verification-program', 'legal', 'about', 'contact-support'];

    if (!currentUser) {
      // Unauthenticated visitor
      if (!tabParam || !allowedTabs.includes(tabParam) || tabParam === 'account') {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setActiveTab('help');
        router.replace('/settings?tab=help');
      } else {
        setActiveTab(tabParam as any);
      }
    } else {
      // Authenticated user
      if (tabParam && allowedTabs.includes(tabParam)) {
        setActiveTab(tabParam as any);
      } else {
        setActiveTab('account');
        router.replace('/settings?tab=account');
      }
    }
  }, [tabParam, currentUser, hasCheckedAuth, router]);

  const handleUnblock = async (blockedId: string, blockedName: string) => {
    setUnblockingId(blockedId);
    setError(null);
    try {
      const res = await unblockUser(blockedId);
      if (res.success) {
        setBlockedUsers(prev => prev.filter(u => u.id !== blockedId));
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(res.error || 'Failed to unblock user.');
      }
    } catch (err) {
      console.error('Error unblocking creator:', err);
      setError('Failed to unblock creator.');
    } finally {
      setUnblockingId(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    setAvatarFile(file);
    setAvatarUrl(URL.createObjectURL(file));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    const cleaned = username.trim().toLowerCase();
    const usernameRegex = /^[a-z0-9_]{3,20}$/;
    if (!usernameRegex.test(cleaned)) {
      setError('Username must be 3-20 characters long and can only contain lowercase letters, numbers, and underscores.');
      setSaving(false);
      return;
    }

    const formData = new FormData();
    formData.append('username', cleaned);
    formData.append('fullName', fullName);
    formData.append('bio', bio);
    if (avatarFile) {
      formData.append('avatar', avatarFile);
    }

    const res = await updateProfile(formData);
    
    if (!res.success) {
      setError(res.error || 'Failed to update profile');
    } else {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      router.refresh();
    }
    
    setSaving(false);
  };

  const toggleAccordion = (id: string) => {
    setOpenAccordion(openAccordion === id ? null : id);
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-[#fcfcfc]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-neon-purple)] mb-4" />
        <p className="text-zinc-650 font-black uppercase tracking-wider text-xs">Assembling Workspace...</p>
      </div>
    );
  }

  const sidebarItems = [
    { id: 'account', label: 'Account Settings', icon: UserIcon },
    { id: 'help', label: 'Help Center', icon: HelpCircle },
    { id: 'verification-program', label: 'Verification Program', icon: ShieldCheck },
    { id: 'legal', label: 'Legal & Policies', icon: Scale },
    { id: 'about', label: 'About Prizom', icon: Info },
    { id: 'contact-support', label: 'Contact Support', icon: Mail },
  ] as const;

  return (
    <div className="min-h-screen pb-6 md:pb-20 pt-24 bg-[#fcfcfc]">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb Header */}
        <div className="mb-8 flex items-center justify-between border-b border-zinc-200/60 pb-5">
          <div className="flex items-center space-x-2">
            <Link href="/" className="p-2 bg-zinc-50 border border-zinc-200/50 hover:bg-zinc-100 rounded-full transition-all text-zinc-600">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-2xl font-black text-zinc-900 tracking-tight leading-none">Settings Workspace</h1>
              <p className="text-xs text-zinc-600 mt-1">Manage profile, review guides, read platform policies, and contact support.</p>
            </div>
          </div>
        </div>

        {/* Workspace Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-8 items-start">
          
          {/* Left Sidebar / Horizontal Tab Menu on mobile */}
          <aside className="lg:col-span-3 bg-white border border-zinc-200 rounded-[2rem] lg:rounded-[2.5rem] p-3 lg:p-6 shadow-sm overflow-x-auto no-scrollbar scroll-smooth">
            <nav className="flex flex-row lg:flex-col gap-1.5 lg:space-y-1.5 min-w-max lg:min-w-0">
              {sidebarItems
                .filter((item) => item.id !== 'account' || currentUser)
                .map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        router.push(`/settings?tab=${item.id}`);
                      }}
                      className={`px-4 py-2.5 lg:px-5 lg:py-3.5 rounded-xl lg:rounded-2xl text-left text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 lg:gap-3 border whitespace-nowrap shrink-0
                        ${isActive 
                          ? 'bg-gradient-to-r from-[var(--color-electric-blue)]/5 to-[var(--color-neon-purple)]/5 border-purple-200 text-[var(--color-neon-purple)] shadow-sm' 
                          : 'bg-transparent border-transparent text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900'
                        }
                      `}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-[var(--color-neon-purple)]' : 'text-zinc-600'}`} />
                      {item.label}
                    </button>
                  );
                })}
            </nav>
          </aside>

          {/* Right Content Panels */}
          <main className="lg:col-span-9 bg-white border border-zinc-200 rounded-[2rem] lg:rounded-[2.5rem] p-5 sm:p-8 lg:p-10 shadow-sm relative overflow-hidden min-h-[60vh]">
            
            {/* Background Glow */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-[var(--color-neon-purple)] to-[var(--color-electric-blue)] blur-[120px] opacity-5 pointer-events-none" />

            <div className="relative z-10">
              
              {/* TAB 1: Account Settings */}
              {activeTab === 'account' && (
                <div className="space-y-8 animate-in fade-in duration-300">
                  <div className="border-b border-zinc-200 pb-5">
                    <h2 className="text-xl font-black text-zinc-900 uppercase tracking-wider">Account Settings</h2>
                    <p className="text-xs text-zinc-500 mt-1">Configure your creator identity, avatar photo, bio details, and block lists.</p>
                  </div>

                  {error && (
                    <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-medium">
                      {error}
                    </div>
                  )}

                  {success && (
                    <div className="p-4 bg-green-50 border border-green-100 rounded-2xl text-green-700 text-sm font-medium flex items-center">
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      Changes saved successfully!
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Avatar Upload */}
                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-zinc-700 mb-3">Profile Picture</label>
                      <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-center sm:text-left">
                        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                          <div className="w-24 h-24 rounded-full bg-zinc-50 border-2 border-dashed border-zinc-300 flex items-center justify-center overflow-hidden transition-all group-hover:border-[var(--color-neon-purple)]">
                            <Avatar 
                              src={avatarUrl} 
                              username={username || 'U'} 
                              size="custom" 
                              className="w-full h-full text-2xl" 
                            />
                          </div>
                          <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <UploadCloud className="w-6 h-6 text-white" />
                          </div>
                        </div>
                        <div className="w-full sm:w-auto">
                          <button 
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-zinc-50 border border-zinc-200 hover:bg-zinc-100 text-zinc-700 font-bold text-xs transition-colors shadow-sm"
                          >
                            Change Picture
                          </button>
                          <p className="text-[10px] text-zinc-400 mt-2 font-semibold">JPG, PNG or WebP. Max 5MB.</p>
                        </div>
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          className="hidden" 
                          accept="image/jpeg,image/png,image/webp" 
                          onChange={handleFileChange}
                        />
                      </div>
                    </div>

                    {/* Username */}
                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-zinc-655 mb-2">Username</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <span className="text-zinc-405 font-bold">@</span>
                        </div>
                        <input
                          type="text"
                          required
                          value={username}
                          onChange={(e) => handleUsernameChange(e.target.value)}
                          className={`block w-full pl-10 pr-4 py-3 border rounded-2xl bg-zinc-50 text-zinc-900 focus:bg-white focus:outline-none transition-all font-semibold text-base sm:text-sm ${
                            usernameError 
                              ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200/50' 
                              : 'border-zinc-200 focus:border-[var(--color-neon-purple)]'
                          }`}
                          placeholder="creator_name"
                        />
                      </div>
                      {usernameError ? (
                        <p className="text-xs text-red-500 mt-2 font-semibold">{usernameError}</p>
                      ) : (
                        <p className="text-[10px] text-zinc-400 mt-2 font-semibold">Only letters, numbers, and underscores (3-20 characters).</p>
                      )}
                    </div>

                    {/* Display Name */}
                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-zinc-655 mb-2">Display Name</label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="block w-full px-4 py-3 border border-zinc-200 rounded-2xl bg-zinc-50 text-zinc-900 focus:bg-white focus:outline-none focus:border-[var(--color-neon-purple)] transition-all font-semibold text-base sm:text-sm"
                        placeholder="e.g. Your Full Name"
                        maxLength={50}
                      />
                    </div>

                    {/* Bio */}
                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-zinc-655 mb-2">Bio</label>
                      <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        rows={4}
                        className="block w-full px-4 py-3 border border-zinc-200 rounded-2xl bg-zinc-50 text-zinc-900 focus:bg-white focus:outline-none focus:border-[var(--color-neon-purple)] transition-all font-semibold text-base sm:text-sm"
                        placeholder="Tell the community about yourself..."
                      />
                    </div>

                    <div className="pt-6 border-t border-zinc-100 flex justify-end">
                      <button
                        type="submit"
                        disabled={saving}
                        className="w-full sm:w-auto px-8 py-3.5 rounded-full text-xs font-black uppercase tracking-wider text-white bg-zinc-900 hover:bg-black transition-all flex items-center justify-center shadow-md disabled:opacity-50"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          'Save Changes'
                        )}
                      </button>
                    </div>
                  </form>

                  {/* Blocked Users Section */}
                  <div className="pt-8 border-t border-zinc-200 mt-8">
                    <div className="mb-4 flex items-center space-x-2">
                      <ShieldAlert className="w-5 h-5 text-red-500" />
                      <h3 className="text-base font-black text-zinc-900 uppercase tracking-wider">Blocked Creators</h3>
                    </div>

                    {loadingBlocks ? (
                      <div className="py-6 flex items-center justify-center text-zinc-500 text-sm font-semibold">
                        <Loader2 className="w-5 h-5 animate-spin mr-2 text-[var(--color-neon-purple)]" />
                        Loading blocked creators...
                      </div>
                    ) : blockedUsers.length === 0 ? (
                      <div className="py-6 text-center text-zinc-400 text-xs font-black uppercase tracking-wider border border-dashed border-zinc-200 rounded-2xl bg-zinc-50/30">
                        No blocked creators.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {blockedUsers.map((blockedUser) => (
                          <div key={blockedUser.id} className="flex items-center justify-between p-3 bg-zinc-50 border border-zinc-100 rounded-2xl">
                            <div className="flex items-center space-x-3">
                              <Avatar src={blockedUser.avatarUrl} username={blockedUser.username} size="xs" />
                              <div>
                                <h4 className="font-extrabold text-xs text-zinc-950 leading-tight">{blockedUser.fullName || blockedUser.username}</h4>
                                <p className="text-[10px] text-zinc-400 font-bold leading-tight">@{blockedUser.username}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleUnblock(blockedUser.id, blockedUser.username)}
                              disabled={unblockingId === blockedUser.id}
                              className="px-3 py-1.5 rounded-xl bg-white border border-zinc-200 hover:border-zinc-300 text-[10px] font-black uppercase tracking-wider text-zinc-655 hover:text-red-500 transition-all flex items-center gap-1 disabled:opacity-50 shadow-sm"
                            >
                              {unblockingId === blockedUser.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                              )}
                              <span>Unblock</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Danger Zone Section */}
                  <div className="pt-8 border-t border-zinc-200 mt-8 space-y-6">
                    <div className="mb-4 flex items-center space-x-2">
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                      <h3 className="text-base font-black text-zinc-900 uppercase tracking-wider">Danger Zone</h3>
                    </div>

                    <div className="bg-red-50/40 border border-red-150 rounded-3xl p-6 space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <h4 className="font-extrabold text-sm text-zinc-900">Deactivate Account</h4>
                          <p className="text-xs text-zinc-500 mt-1">Temporarily hide your profile and prompts. Reactivate anytime by logging back in.</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setDeactivateReason('');
                            setDeactivateFeedback('');
                            setCountdown(20);
                            setShowDeactivateModal(true);
                          }}
                          className="w-full sm:w-auto px-5 py-2.5 bg-zinc-900 text-white hover:bg-black rounded-full text-xs font-black uppercase tracking-wider transition-colors shadow-sm cursor-pointer text-center justify-center flex items-center"
                        >
                          Deactivate
                        </button>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-red-100">
                        <div>
                          <h4 className="font-extrabold text-sm text-red-650">Delete Account</h4>
                          <p className="text-xs text-zinc-500 mt-1">Permanently remove your profile and prompts after a 15-day recovery window.</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteReason('');
                            setDeletePassword('');
                            setCountdown(20);
                            setShowDeleteModal(true);
                          }}
                          className="w-full sm:w-auto px-5 py-2.5 bg-red-600 text-white hover:bg-red-750 rounded-full text-xs font-black uppercase tracking-wider transition-colors shadow-sm cursor-pointer text-center justify-center flex items-center"
                        >
                          Delete Account
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Help Center */}
              {activeTab === 'help' && (
                <div className="space-y-8 animate-in fade-in duration-300">
                  <div className="border-b border-zinc-200 pb-5">
                    <h2 className="text-xl font-black text-zinc-900 uppercase tracking-wider">Help Center</h2>
                    <p className="text-xs text-zinc-500 mt-1">Browse creator guides, understand platform rules, and contact support desk.</p>
                  </div>

                  {/* Accordion Guides list */}
                  <div className="space-y-3">
                    {[
                      {
                        id: 'what-is-prizom',
                        title: 'What is Prizom?',
                        content: 'Prizom is the open collaborative registry for AI prompts designed for prompt engineers and creative artists. It allows you to showcase prompt masterworks, copy templates instantly, remix prompts to create variations, and collaborate on generative workflows for platforms like Midjourney, Flux, and ChatGPT.'
                      },
                      {
                        id: 'how-to-copy',
                        title: 'How to Copy Prompts',
                        content: 'To copy a prompt, browse the feed, click on any prompt card to view its detailed page, and click the copy/clipboard button next to the prompt text. The exact prompt text, along with its specific parameters (like aspect ratios, weights, and model versions), will be copied to your clipboard so you can paste it directly into your generator tool.'
                      },
                      {
                        id: 'how-to-publish',
                        title: 'How to Register Prompts',
                        content: 'To share your work, log in and click "Register Prompt" in the navigation bar. You will need to provide: (1) the exact copyable prompt formula, (2) the output image preview showing the visual result of the prompt, (3) the corresponding model tool (e.g. Midjourney v6, Flux.1), and (4) relevant tags and aspect ratio parameters to make your prompt easily discoverable in the registry.'
                      },
                      {
                        id: 'verification-guide',
                        title: 'Verification Guide',
                        content: 'Prizom features an automatic verification program that awards a blue badge to trusted creators. To qualify, your profile must meet five criteria: (1) at least 10 public prompts published, (2) at least 1,000 copy events logged by other users, (3) an account age of 30+ days, (4) a fully completed profile (profile photo, bio, display name), and (5) no active safety or guidelines violations.'
                      },
                      {
                        id: 'community-guidelines-faq',
                        title: 'Community Guidelines & Safety',
                        content: 'Our community stands for collaboration and creative freedom. However, we strictly prohibit: (1) prompt injection hacks and safety guardrail bypasses, (2) explicit adult content, extreme violence, or self-harm generation, and (3) harassment or identity theft of other creators. Violations lead to prompt suppression or ban.'
                      },
                      {
                        id: 'copyright-policy-faq',
                        title: 'Copyright Policy & Attribution',
                        content: 'While prompt text is open for the community to copy and improve, you retain copyright ownership of original illustrations or generated artwork you publish. Prizom automatically links prompt remixes to their parent templates, ensuring proper attribution. If you believe your copyrighted work is displayed without permission, contact copyright@prizom.in.'
                      },
                      {
                        id: 'suspension-appeals',
                        title: 'Suspension & Restriction Appeals',
                        content: 'If your account is suspended or one of your prompts is hidden for moderation review, you will receive an notification. If you believe this action was taken in error, you may file an appeal ticket through the Contact Support tab in your settings within 14 days to request a manual review by our moderation team.'
                      },
                      {
                        id: 'contact-support-faq',
                        title: 'Contact Support',
                        content: 'Need assistance with account recovery, bug reporting, or feature requests? Head over to the "Contact Support" tab in the Settings sidebar to fill out a direct inquiry form. Our support team typically replies within 24-48 hours.'
                      }
                    ].map((guide) => {
                      const isOpen = openAccordion === guide.id;
                      return (
                        <div key={guide.id} className="border border-zinc-200 rounded-2xl overflow-hidden transition-all bg-zinc-50/20 hover:bg-zinc-50/50">
                          <button
                            onClick={() => toggleAccordion(guide.id)}
                            className="w-full px-4 py-3.5 sm:px-6 sm:py-4 text-left flex justify-between items-center focus:outline-none"
                          >
                            <span className="text-xs font-black uppercase tracking-wider text-zinc-800">{guide.title}</span>
                            <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                          </button>
                          {isOpen && (
                            <div className="px-4 pb-4 sm:px-6 sm:pb-5 pt-1 border-t border-zinc-100 text-sm text-zinc-500 font-semibold leading-relaxed">
                              {guide.content}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Redirect to Contact Support Tab */}
                  <div className="pt-8 border-t border-zinc-200 mt-8 flex flex-col items-start gap-4 w-full">
                    <div className="w-full">
                      <h3 className="text-sm font-black text-zinc-900 uppercase tracking-wider">Need direct support?</h3>
                      <p className="text-xs text-zinc-500 mt-1">Submit an inquiry directly to our team via our support desk.</p>
                    </div>
                    <button 
                      onClick={() => setActiveTab('contact-support')}
                      className="w-full sm:w-auto px-6 py-3 bg-zinc-900 hover:bg-black text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
                    >
                      <Mail className="w-4 h-4" />
                      Contact Support Desk
                    </button>
                  </div>
                </div>
              )}



              {/* TAB 4: Verification Program */}
              {activeTab === 'verification-program' && (
                <div className="space-y-8 animate-in fade-in duration-300">
                  <div className="border-b border-zinc-200 pb-5">
                    <h2 className="text-xl font-black text-zinc-900 uppercase tracking-wider">Verification Program</h2>
                    <p className="text-xs text-zinc-500 mt-1">Unlock the Prizom Creator verification badge automatically by meeting target criteria.</p>
                  </div>
                  <div className="text-sm text-zinc-500 font-semibold leading-relaxed space-y-6">
                    <p>The Prizom verified badge indicates that a creator is an active, trusted contributor to our open prompt ecosystem. Verification is evaluated automatically based on five metrics:</p>
                    <div className="p-6 bg-purple-50/30 border border-purple-100/50 rounded-2xl flex items-start gap-4">
                      <ShieldCheck className="w-5 h-5 text-[var(--color-neon-purple)] shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-extrabold text-xs text-zinc-900 uppercase tracking-wider">Verification Criteria Checklist</h4>
                        <ul className="list-disc pl-4 mt-3 space-y-2 text-xs font-semibold text-zinc-600">
                          <li>At least <strong>10 public prompts</strong> published to the platform.</li>
                          <li>At least <strong>1,000 total copies</strong> logged across your prompt deck.</li>
                          <li>Account age of <strong>30 days or more</strong>.</li>
                          <li>Fully completed profile (avatar picture, bio description, display name).</li>
                          <li>Good community standing (no active guidelines violations or hidden prompts).</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: Legal & Policies */}
              {activeTab === 'legal' && (
                <div className="space-y-8 animate-in fade-in duration-300">
                  <div className="border-b border-zinc-200 pb-5">
                    <h2 className="text-xl font-black text-zinc-900 uppercase tracking-wider font-extrabold flex items-center gap-2">
                      <Scale className="w-6 h-6 text-indigo-600" />
                      Legal & Policies
                    </h2>
                    <p className="text-xs text-zinc-500 mt-1">Review the terms, privacy guidelines, and policies that govern the Prizom platform.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      {
                        title: 'Terms of Service',
                        desc: 'Platform usage rules, licensing policies, and dispute resolution.',
                        href: '/terms',
                      },
                      {
                        title: 'Privacy Policy',
                        desc: 'Personal records handling, DPDP, GDPR, CCPA, and your rights.',
                        href: '/privacy',
                      },
                      {
                        title: 'Community Guidelines',
                        desc: 'Operational safety, moderation policies, and creative rules.',
                        href: '/community-guidelines',
                      },
                      {
                        title: 'Copyright Policy',
                        desc: 'Intellectual property protections, DMCA forms, and takedown agent details.',
                        href: '/copyright-policy',
                      },
                      {
                        title: 'Cookie Policy',
                        desc: 'Details on essential cookies, preferences, and tracking opt-in controls.',
                        href: '/cookie-policy',
                      },
                    ].map((policy) => (
                      <a
                        key={policy.title}
                        href={policy.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group p-5 bg-white border border-zinc-200 rounded-[2rem] hover:border-purple-300 hover:shadow-md transition-all flex flex-col justify-between"
                      >
                        <div>
                          <h4 className="font-extrabold text-sm text-zinc-900 uppercase tracking-wider group-hover:text-purple-650 transition-colors">
                            {policy.title}
                          </h4>
                          <p className="text-xs text-zinc-555 mt-1.5 font-semibold leading-relaxed">
                            {policy.desc}
                          </p>
                        </div>
                        <div className="flex items-center text-[10px] font-black uppercase text-indigo-650 tracking-wider mt-4">
                          Open Official Page
                          <ArrowUpRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}



              {/* TAB 9: About Prizom */}
              {activeTab === 'about' && (
                <div className="space-y-8 animate-in fade-in duration-300">
                  <div className="border-b border-zinc-200 pb-5">
                    <h2 className="text-xl font-black text-zinc-900 uppercase tracking-wider">About Prizom</h2>
                    <p className="text-xs text-zinc-500 mt-1">Platform mission, social links, and details about the creator network.</p>
                  </div>

                  {aboutSettings ? (
                    <div className="text-sm text-zinc-500 font-semibold leading-relaxed space-y-6">
                      
                      {/* Platform Mission */}
                      <div>
                        <h3 className="text-xs font-black text-zinc-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <Award className="w-4 h-4 text-purple-500" />
                          Platform Mission
                        </h3>
                        <p className="bg-gradient-to-r from-purple-500/[0.03] to-blue-500/[0.03] p-5 rounded-2xl border border-purple-100/30 font-bold text-zinc-700">
                          {aboutSettings.platform_mission}
                        </p>
                      </div>

                      {/* What Prizom Is */}
                      <div>
                        <h3 className="text-xs font-black text-zinc-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <Globe className="w-4 h-4 text-blue-500" />
                          What Prizom Is
                        </h3>
                        <p>{aboutSettings.what_is_prizom}</p>
                      </div>

                      {/* Creator Ecosystem */}
                      <div>
                        <h3 className="text-xs font-black text-zinc-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <UserIcon className="w-4 h-4 text-teal-500" />
                          Creator Ecosystem
                        </h3>
                        <p>{aboutSettings.creator_ecosystem}</p>
                      </div>

                      {/* Vision */}
                      <div>
                        <h3 className="text-xs font-black text-zinc-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <Scale className="w-4 h-4 text-indigo-500" />
                          Vision
                        </h3>
                        <p className="text-zinc-600">
                          A world where prompt engineering is open, attribution is automatic, and generative intelligence is collaborative.
                        </p>
                      </div>

                      {/* Founder Story */}
                      <div>
                        <h3 className="text-xs font-black text-zinc-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <UserIcon className="w-4 h-4 text-purple-500" />
                          Founder Story
                        </h3>
                        <p className="text-zinc-600">
                          Prizom was founded by <strong>Darshan Vaghela</strong>, a video editor and M.Sc. IT scholar at MKBU University. Darshan set out to build a pristine, visual home specifically for AI prompt designers to showcase, archive, and remix prompt templates without scattered clutter.
                        </p>
                      </div>

                      {/* Product Philosophy */}
                      <div>
                        <h3 className="text-xs font-black text-zinc-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <Info className="w-4 h-4 text-amber-500" />
                          Product Philosophy
                        </h3>
                        <p className="text-zinc-600">
                          We design for clarity, speed, and visual utility. Minimal interfaces, zero startup fluff, and content-first discovery feeds.
                        </p>
                      </div>

                      {/* Core Values */}
                      <div>
                        <h3 className="text-xs font-black text-zinc-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-emerald-500" />
                          Core Values
                        </h3>
                        <ul className="list-disc pl-5 space-y-1.5 text-zinc-600">
                          <li><strong>Radical Openness:</strong> Creative prompt recipes should be open for everyone to learn, copy, and remix.</li>
                          <li><strong>Attribution First:</strong> Every remix inherits its parent template lineage automatically.</li>
                          <li><strong>No Distractions:</strong> No user comments spam, no fake stats. Just clean visual prompts.</li>
                        </ul>
                      </div>

                      {/* Roadmap */}
                      <div>
                        <h3 className="text-xs font-black text-zinc-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <Globe className="w-4 h-4 text-rose-500" />
                          Roadmap
                        </h3>
                        <ul className="list-disc pl-5 space-y-1.5 text-zinc-600">
                          <li><strong>Invite-Only Beta (Current):</strong> Onboarding the first 100 creators to refine visual workflows.</li>
                          <li><strong>Platform V2:</strong> Expanding semantic prompt search capabilities and cross-generator model tagging.</li>
                          <li><strong>Collaborative Remix Spaces:</strong> Introducing shared folders and style presets.</li>
                        </ul>
                      </div>

                      {/* Social Links */}
                      <div className="pt-6 border-t border-zinc-100 flex flex-wrap gap-4">
                        {aboutSettings.twitter_link && (
                          <a 
                            href={aboutSettings.twitter_link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-zinc-50 border border-zinc-200 hover:border-zinc-300 rounded-full text-xs font-bold text-zinc-700 transition-all hover:scale-102 shadow-sm"
                          >
                            <svg className="w-4 h-4 text-zinc-900 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                            </svg>
                            <span>Twitter / X</span>
                          </a>
                        )}
                        {aboutSettings.instagram_link && (
                          <a 
                            href={aboutSettings.instagram_link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-zinc-50 border border-zinc-200 hover:border-zinc-300 rounded-full text-xs font-bold text-zinc-700 transition-all hover:scale-102 shadow-sm"
                          >
                            <svg className="w-4 h-4 text-pink-500 stroke-current fill-none" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                              <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                            </svg>
                            <span>Instagram</span>
                          </a>
                        )}
                        {aboutSettings.youtube_link && (
                          <a 
                            href={aboutSettings.youtube_link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-zinc-50 border border-zinc-200 hover:border-zinc-300 rounded-full text-xs font-bold text-zinc-700 transition-all hover:scale-102 shadow-sm"
                          >
                            <svg className="w-4 h-4 text-red-500 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                              <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.108C19.524 3.545 12 3.545 12 3.545s-7.525 0-9.388.51a3.002 3.002 0 0 0-2.11 2.108C0 8.028 0 12 0 12s0 3.972.502 5.837a3.003 3.003 0 0 0 2.11 2.108c1.863.51 9.388.51 9.388.51s7.524 0 9.388-.51a3.002 3.002 0 0 0 2.11-2.108c.502-1.865.502-5.837.502-5.837s0-3.972-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                            </svg>
                            <span>YouTube</span>
                          </a>
                        )}
                        {aboutSettings.discord_link && (
                          <a 
                            href={aboutSettings.discord_link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-zinc-50 border border-zinc-200 hover:border-zinc-300 rounded-full text-xs font-bold text-zinc-700 transition-all hover:scale-102 shadow-sm"
                          >
                            <HelpCircle className="w-4 h-4 text-indigo-500 fill-indigo-500/10" />
                            <span>Discord Community</span>
                          </a>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="py-6 flex items-center justify-center text-zinc-500 text-xs font-semibold">
                      <Loader2 className="w-5 h-5 animate-spin mr-2 text-[var(--color-neon-purple)]" />
                      Loading platform details...
                    </div>
                  )}
                </div>
              )}

              {/* TAB 10: Contact Support */}
              {activeTab === 'contact-support' && (
                <div className="space-y-8 animate-in fade-in duration-300">
                  <div className="border-b border-zinc-200 pb-5">
                    <h2 className="text-xl font-black text-zinc-900 uppercase tracking-wider">Contact Support</h2>
                    <p className="text-xs text-zinc-500 mt-1">Submit a direct ticket to the Prizom engineering and moderation desk.</p>
                  </div>
                  <div className="bg-zinc-50/50 border border-zinc-200 rounded-[1.5rem] sm:rounded-[2rem] p-4 sm:p-6 lg:p-8">
                    <ContactForm developer={null} />
                  </div>
                </div>
              )}

            </div>
          </main>

        </div>

      </div>

      {/* Account Deactivation Modal */}
      {showDeactivateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-zinc-250 w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-black text-zinc-900 uppercase tracking-wider mb-2">Deactivate Account</h3>
            <p className="text-sm font-semibold text-zinc-500 mb-6">Your profile and content will become hidden from the community. Reactivate at any time simply by logging back in.</p>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-zinc-655 mb-2">Select Reason <span className="text-red-500">*</span></label>
                <select
                  value={deactivateReason}
                  onChange={(e) => setDeactivateReason(e.target.value)}
                  className="block w-full px-4 py-3 border border-zinc-200 rounded-2xl bg-zinc-50 text-zinc-900 focus:bg-white focus:outline-none focus:border-zinc-500 font-semibold text-sm cursor-pointer"
                >
                  <option value="">-- Choose a reason --</option>
                  <option value="Taking a break">Taking a break</option>
                  <option value="Privacy concerns">Privacy concerns</option>
                  <option value="Too many emails">Too many emails</option>
                  <option value="Created another account">Created another account</option>
                  <option value="Not useful">Not finding useful prompts</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-zinc-655 mb-2">Optional Feedback</label>
                <textarea
                  value={deactivateFeedback}
                  onChange={(e) => setDeactivateFeedback(e.target.value)}
                  rows={3}
                  className="block w-full px-4 py-3 border border-zinc-200 rounded-2xl bg-zinc-50 text-zinc-900 focus:bg-white focus:outline-none focus:border-zinc-500 font-semibold text-sm"
                  placeholder="Tell us how we can improve Prizom..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeactivateModal(false)}
                className="px-5 py-3 rounded-full text-xs font-black uppercase tracking-wider border border-zinc-250 bg-white hover:bg-zinc-50 text-zinc-655 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!deactivateReason || countdown > 0 || lifecycleLoading}
                onClick={async () => {
                  setLifecycleLoading(true);
                  setError(null);
                  const res = await deactivateAccountAction(deactivateReason, deactivateFeedback);
                  if (res.success) {
                    router.push('/login?message=Account deactivated successfully.');
                  } else {
                    setError(res.error || 'Failed to deactivate account.');
                    setLifecycleLoading(false);
                    setShowDeactivateModal(false);
                  }
                }}
                className="px-6 py-3 rounded-full text-xs font-black uppercase tracking-wider text-white bg-zinc-900 hover:bg-black transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                {lifecycleLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {countdown > 0 ? `Confirm in ${countdown}s` : 'Confirm Deactivation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Account Deletion Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-zinc-250 w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-black text-red-600 uppercase tracking-wider mb-2">Delete Account</h3>
            <p className="text-sm font-semibold text-zinc-500 mb-6">Are you sure you want to delete your account? Your profile and content will be hidden immediately, and permanently purged after a 15-day recovery window.</p>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-zinc-655 mb-2">Select Reason <span className="text-red-500">*</span></label>
                <select
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  className="block w-full px-4 py-3 border border-zinc-200 rounded-2xl bg-zinc-50 text-zinc-900 focus:bg-white focus:outline-none focus:border-red-500 font-semibold text-sm cursor-pointer"
                >
                  <option value="">-- Choose a reason --</option>
                  <option value="Taking a break">Taking a break</option>
                  <option value="Privacy concerns">Privacy concerns</option>
                  <option value="Too many emails">Too many emails</option>
                  <option value="Created another account">Created another account</option>
                  <option value="Not useful">Not finding useful prompts</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-zinc-655 mb-2">Confirm Password <span className="text-red-500">*</span></label>
                <input
                  type="password"
                  required
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="block w-full px-4 py-3 border border-zinc-200 rounded-2xl bg-zinc-50 text-zinc-900 focus:bg-white focus:outline-none focus:border-red-500 font-semibold text-sm"
                  placeholder="Enter your account password"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-5 py-3 rounded-full text-xs font-black uppercase tracking-wider border border-zinc-250 bg-white hover:bg-zinc-50 text-zinc-655 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!deleteReason || !deletePassword || countdown > 0 || lifecycleLoading}
                onClick={async () => {
                  setLifecycleLoading(true);
                  setError(null);
                  const res = await requestAccountDeletionAction(deletePassword, deleteReason);
                  if (res.success) {
                    router.push('/login?message=Account deletion requested. Your profile will be purged in 15 days.');
                  } else {
                    setError(res.error || 'Failed to request account deletion.');
                    setLifecycleLoading(false);
                    setShowDeleteModal(false);
                  }
                }}
                className="px-6 py-3 rounded-full text-xs font-black uppercase tracking-wider text-white bg-red-600 hover:bg-red-750 transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                {lifecycleLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {countdown > 0 ? `Confirm in ${countdown}s` : 'Confirm Deletion'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fcfcfc]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-neon-purple)] mb-4" />
        <p className="text-zinc-550 font-black uppercase tracking-wider text-xs">Assembling Workspace...</p>
      </div>
    }>
      <SettingsContent />
    </Suspense>
  );
}
