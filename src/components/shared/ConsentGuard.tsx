'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ShieldCheck, Sparkles, Clock, Check, Loader2, X, Scale, Lock, GitFork, ShieldAlert, Eye, Database } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function ConsentGuard() {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasAccepted, setHasAccepted] = useState(true);
  
  // Active document sub-modal view state: 'none' | 'terms' | 'privacy'
  const [activeView, setActiveView] = useState<'none' | 'terms' | 'privacy'>('none');

  // Consent checkbox states
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [acceptedCookies, setAcceptedCookies] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const supabase = createClient();
  const policyVersion = 'v1';

  useEffect(() => {
    const checkConsent = async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setUser(session.user);
          
          const localAccepted = localStorage.getItem('prizom-consent-accepted');
          const localVersion = localStorage.getItem('prizom-consent-version');
          
          if (localAccepted === 'true' && localVersion === policyVersion) {
            setHasAccepted(true);
          } else {
            const userMeta = session.user.user_metadata;
            const metaAccepted = userMeta?.accepted_terms === true && 
                                 userMeta?.accepted_privacy === true && 
                                 userMeta?.accepted_cookies === true &&
                                 userMeta?.policy_version === policyVersion;
            
            if (metaAccepted) {
              localStorage.setItem('prizom-consent-accepted', 'true');
              localStorage.setItem('prizom-consent-version', policyVersion);
              localStorage.setItem('prizom-consent-timestamp', userMeta.accepted_at);
              setHasAccepted(true);
            } else {
              setHasAccepted(false);
            }
          }
        } else {
          setUser(null);
          setHasAccepted(true);
        }
      } catch (err) {
        console.error('Error checking onboarding consent session:', err);
        // Fail-safe to prevent blocking page access if session throws
        setHasAccepted(true);
      } finally {
        setLoading(false);
      }
    };

    checkConsent();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        const localAccepted = localStorage.getItem('prizom-consent-accepted');
        const localVersion = localStorage.getItem('prizom-consent-version');
        
        if (localAccepted === 'true' && localVersion === policyVersion) {
          setHasAccepted(true);
        } else {
          const userMeta = session.user.user_metadata;
          const metaAccepted = userMeta?.accepted_terms === true && 
                               userMeta?.accepted_privacy === true && 
                               userMeta?.accepted_cookies === true &&
                               userMeta?.policy_version === policyVersion;
          
          if (metaAccepted) {
            localStorage.setItem('prizom-consent-accepted', 'true');
            localStorage.setItem('prizom-consent-version', policyVersion);
            localStorage.setItem('prizom-consent-timestamp', userMeta.accepted_at);
            setHasAccepted(true);
          } else {
            setHasAccepted(false);
          }
        }
      } else {
        setUser(null);
        setHasAccepted(true);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  // Lock scroll on document body when the consent modal OR sub-modals are active
  useEffect(() => {
    if (user && !hasAccepted) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [user, hasAccepted]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedTerms || !acceptedPrivacy || !acceptedCookies || !user) return;

    setIsSubmitting(true);
    const timestamp = new Date().toISOString();

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          accepted_terms: true,
          accepted_privacy: true,
          accepted_cookies: true,
          accepted_at: timestamp,
          policy_version: policyVersion
        }
      });

      if (error) throw error;

      localStorage.setItem('prizom-consent-accepted', 'true');
      localStorage.setItem('prizom-consent-version', policyVersion);
      localStorage.setItem('prizom-consent-timestamp', timestamp);
      
      setHasAccepted(true);
    } catch (err) {
      console.error('Error submitting legal consent:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || hasAccepted || !user || pathname?.startsWith('/admin')) {
    return null;
  }

  const allChecked = acceptedTerms && acceptedPrivacy && acceptedCookies;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/60 backdrop-blur-md animate-fade-in pointer-events-auto">
      
      {/* 1. Main Consent Onboarding Modal */}
      <div className="relative w-full max-w-lg bg-white/90 border border-zinc-200/50 rounded-[2.5rem] p-8 sm:p-12 shadow-2xl backdrop-blur-xl animate-scale-up z-[110] overflow-hidden my-auto">
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center">
          <div className="relative group/shield w-16 h-16 mb-6">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-[var(--color-electric-blue)] to-[var(--color-neon-purple)] animate-pulse opacity-60 blur-md" />
            <div className="relative w-full h-full rounded-2xl p-[2px] bg-gradient-to-tr from-[var(--color-electric-blue)] to-[var(--color-neon-purple)] overflow-hidden shadow-md flex items-center justify-center bg-white text-indigo-600">
              <ShieldCheck className="w-8 h-8" />
            </div>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight text-center mb-2">
            Onboarding Consent
          </h2>
          <p className="text-zinc-500 font-semibold text-xs text-center mb-8 max-w-sm leading-relaxed">
            Welcome to Prizom! To ensure compliance, user trust, and a creative open environment, please review and accept our platform policies before access.
          </p>

          <form onSubmit={handleSubmit} className="w-full space-y-6">
            
            {/* Interactive Policy Links */}
            <div className="p-4 bg-zinc-50/80 border border-zinc-200/50 rounded-2xl space-y-3.5">
              <h4 className="text-[10px] font-black text-zinc-900 uppercase tracking-widest flex items-center">
                <Sparkles className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
                Data & Cookie Usage Disclosure
              </h4>
              <p className="text-[10px] text-zinc-400 font-semibold leading-relaxed">
                Prizom operates with Supabase nodes, executing session storage controls and cookies for user authentication, collection configurations, security auditing, and copy counters.
              </p>
              <div className="flex items-center justify-center space-x-4 pt-1.5 border-t border-zinc-200/40 text-[10px] font-black uppercase tracking-wider text-indigo-600">
                <button
                  type="button"
                  onClick={() => setActiveView('terms')}
                  className="hover:underline flex items-center focus:outline-none"
                >
                  Terms of Service
                  <span className="ml-0.5 text-zinc-300">↗</span>
                </button>
                <span className="text-zinc-200">|</span>
                <button
                  type="button"
                  onClick={() => setActiveView('privacy')}
                  className="hover:underline flex items-center focus:outline-none"
                >
                  Privacy Policy
                  <span className="ml-0.5 text-zinc-300">↗</span>
                </button>
              </div>
            </div>

            {/* Checkboxes List */}
            <div className="space-y-4">
              {/* Box 1: Terms */}
              <label className="group flex items-start space-x-3.5 cursor-pointer">
                <div className="relative flex items-center justify-center w-5 h-5 mt-0.5 shrink-0">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 rounded-md border transition-all duration-200 flex items-center justify-center ${
                    acceptedTerms 
                      ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm shadow-indigo-100' 
                      : 'border-zinc-300 bg-white group-hover:border-indigo-400'
                  }`}>
                    {acceptedTerms && <Check className="w-3.5 h-3.5 stroke-[3.5]" />}
                  </div>
                </div>
                <div className="text-[11px] font-bold text-zinc-500 leading-tight">
                  I agree to the <button type="button" onClick={() => setActiveView('terms')} className="text-indigo-600 hover:underline font-bold focus:outline-none">Terms of Service</button> governing AI prompt registries.
                </div>
              </label>

              {/* Box 2: Privacy */}
              <label className="group flex items-start space-x-3.5 cursor-pointer">
                <div className="relative flex items-center justify-center w-5 h-5 mt-0.5 shrink-0">
                  <input
                    type="checkbox"
                    checked={acceptedPrivacy}
                    onChange={(e) => setAcceptedPrivacy(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 rounded-md border transition-all duration-200 flex items-center justify-center ${
                    acceptedPrivacy 
                      ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm shadow-indigo-100' 
                      : 'border-zinc-300 bg-white group-hover:border-indigo-400'
                  }`}>
                    {acceptedPrivacy && <Check className="w-3.5 h-3.5 stroke-[3.5]" />}
                  </div>
                </div>
                <div className="text-[11px] font-bold text-zinc-500 leading-tight">
                  I agree to the <button type="button" onClick={() => setActiveView('privacy')} className="text-indigo-600 hover:underline font-bold focus:outline-none">Privacy Policy</button> detailing Supabase usage.
                </div>
              </label>

              {/* Box 3: Cookies */}
              <label className="group flex items-start space-x-3.5 cursor-pointer">
                <div className="relative flex items-center justify-center w-5 h-5 mt-0.5 shrink-0">
                  <input
                    type="checkbox"
                    checked={acceptedCookies}
                    onChange={(e) => setAcceptedCookies(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 rounded-md border transition-all duration-200 flex items-center justify-center ${
                    acceptedCookies 
                      ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm shadow-indigo-100' 
                      : 'border-zinc-300 bg-white group-hover:border-indigo-400'
                  }`}>
                    {acceptedCookies && <Check className="w-3.5 h-3.5 stroke-[3.5]" />}
                  </div>
                </div>
                <div className="text-[11px] font-bold text-zinc-500 leading-tight">
                  I accept the use of session cookies, security analytics, and local storage variables.
                </div>
              </label>
            </div>

            {/* Continue CTA Button */}
            <button
              type="submit"
              disabled={!allChecked || isSubmitting}
              className="w-full inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-[var(--color-electric-blue)] to-[var(--color-neon-purple)] disabled:from-zinc-400 disabled:to-zinc-500 text-white text-xs font-black uppercase tracking-wider rounded-full shadow-[0_8px_25px_rgba(99,102,241,0.25)] hover:shadow-[0_15px_30px_rgba(168,85,247,0.35)] disabled:shadow-none hover:-translate-y-0.5 disabled:hover:translate-y-0 disabled:cursor-not-allowed transform transition-all duration-300 relative overflow-hidden mt-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2.5 animate-spin" />
                  Storing Agreement...
                </>
              ) : (
                <>
                  Accept & Continue
                  <Check className="w-4 h-4 ml-2" />
                </>
              )}
            </button>
          </form>
        </div>

      </div>

      {/* 2. In-Context Sub-Modal Legal Viewer */}
      {activeView !== 'none' && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-sm animate-fade-in pointer-events-auto">
          <div className="relative w-full max-w-2xl bg-white border border-zinc-200/50 rounded-[2.5rem] shadow-2xl backdrop-blur-xl animate-scale-up h-[80vh] flex flex-col overflow-hidden my-auto">
            
            {/* Sticky Sub-Modal Header */}
            <div className="flex items-center justify-between px-8 py-5 border-b border-zinc-200/60 shrink-0 bg-white relative z-10">
              <div className="flex items-center space-x-2.5">
                {activeView === 'terms' ? (
                  <>
                    <Scale className="w-5.5 h-5.5 text-indigo-600" />
                    <h3 className="text-base font-black text-zinc-900 tracking-tight">Terms of Service</h3>
                  </>
                ) : (
                  <>
                    <Lock className="w-5.5 h-5.5 text-[var(--color-neon-purple)]" />
                    <h3 className="text-base font-black text-zinc-900 tracking-tight">Privacy Policy</h3>
                  </>
                )}
              </div>
              <button 
                onClick={() => setActiveView('none')} 
                className="p-1.5 rounded-xl hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors focus:outline-none"
                type="button"
                aria-label="Close document"
              >
                <X className="w-5.5 h-5.5" />
              </button>
            </div>

            {/* Scrollable Sub-Modal Document Body */}
            <div className="flex-1 overflow-y-auto px-8 py-6 w-full max-w-xl mx-auto text-xs sm:text-sm text-zinc-500 font-semibold leading-relaxed space-y-8 select-text no-scrollbar">
              
              {activeView === 'terms' ? (
                <>
                  <div className="bg-zinc-50 border border-zinc-200/50 p-5 rounded-2xl text-[11px] leading-relaxed text-zinc-400">
                    This Prizom Terms of Service ("Agreement") represents a binding contract. Please read the full 19 sections detailed below.
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h4 className="font-black text-zinc-900 mb-2">1. Acceptance of Terms</h4>
                      <p>By establishing your credentials or loading data via our APIs, you accept all platforms terms. If you act for an entity, you declare holding full authority.</p>
                    </div>

                    <div>
                      <h4 className="font-black text-zinc-900 mb-2">2. Eligibility & Account Requirements</h4>
                      <p>You declare you are at least 18 years of age (or meet the legal age of consent in your country). Accounts are created via secure Supabase credential portals. Username choices must be appropriate and respect trademark rules.</p>
                    </div>

                    <div>
                      <h4 className="font-black text-zinc-900 mb-2">3. User Content Ownership</h4>
                      <p>You hold exclusive rights over original prompt parameters and outputs you submit. You grant Prizom a global license to host, display, and promote prompts to support registry searches.</p>
                    </div>

                    <div>
                      <h4 className="font-black text-zinc-900 mb-2">4. Prompt Creation Policies</h4>
                      <p>Created prompts must represent original works and must not contain malicious injections or scrapers. Images are stored inside secure cloud buckets.</p>
                    </div>

                    <div className="bg-purple-50/50 border border-purple-100 p-5 rounded-2xl text-purple-950">
                      <h4 className="font-black text-purple-950 mb-2 flex items-center">
                        <GitFork className="w-4 h-4 mr-1.5 text-purple-600" />
                        5. Remix & Attribution Rules
                      </h4>
                      <p className="text-[11px] leading-relaxed">Prizom operates on an open remix culture. Every prompt can be branched (remixed). You agree that remixed creations must retain automated database lineage indices showing parent authors, and bypassing this attribution represents material breach.</p>
                    </div>

                    <div>
                      <h4 className="font-black text-zinc-900 mb-2">6. Intellectual Property Rights</h4>
                      <p>Excluding user prompts, all software layouts, icons, schematics, and Prizom trademarks are the exclusive property of Prizom and protected by copyright laws.</p>
                    </div>

                    <div>
                      <h4 className="font-black text-zinc-900 mb-2">7. Community Standards</h4>
                      <p>Creators must refrain from creating prompts that convey hate speech, violence, or scripts engineered to bypass acceptable filters of external AI systems.</p>
                    </div>

                    <div>
                      <h4 className="font-black text-zinc-900 mb-2">8. AI-Generated Content Responsibility</h4>
                      <p>Prizom is an indexing registry; we do not own or run external neural networks. You are solely liable for prompt compliance and results output on those third-party models.</p>
                    </div>

                    <div className="bg-red-50/30 border border-red-100/50 p-5 rounded-2xl">
                      <h4 className="font-black text-red-950 mb-2 flex items-center">
                        <ShieldAlert className="w-4 h-4 mr-1.5 text-red-500" />
                        9. Copyright & DMCA Policy
                      </h4>
                      <p className="text-[11px] leading-relaxed">We process copyright claims in accordance with the DMCA. Send detailed takedown notifications including URLs to <a href="mailto:copyright@prizom.in" className="text-indigo-600 font-bold hover:underline">copyright@prizom.in</a>.</p>
                    </div>

                    <div>
                      <h4 className="font-black text-zinc-900 mb-2">10. Prohibited Activities</h4>
                      <p>Screen-scraping, denial of service attempts, reverse-engineering layout metrics, or attempting bypasses of private folders are strictly prohibited.</p>
                    </div>

                    <div>
                      <h4 className="font-black text-zinc-900 mb-2">11. Platform Moderation Rights</h4>
                      <p>Prizom maintains full authority to monitor, flag, hide, or alter submitted materials to safeguard registry cleanliness.</p>
                    </div>

                    <div>
                      <h4 className="font-black text-zinc-900 mb-2">12. Account Suspension & Termination</h4>
                      <p>We may suspend profiles or erase database entries without warning if user actions violate terms or represent liability threats.</p>
                    </div>

                    <div>
                      <h4 className="font-black text-zinc-900 mb-2">13. Third-Party Services</h4>
                      <p>Integration with Supabase elements relies on third-party policies. Prizom is not liable for data loss or outages committed by cloud hosts.</p>
                    </div>

                    <div>
                      <h4 className="font-black text-zinc-900 mb-2">14. Disclaimer of Warranties</h4>
                      <p className="uppercase tracking-wide text-[10px] text-zinc-400">Prizom services are offered "as is" without implied merchantability warranties or quality guarantees.</p>
                    </div>

                    <div>
                      <h4 className="font-black text-zinc-900 mb-2">15. Limitation of Liability</h4>
                      <p className="uppercase tracking-wide text-[10px] text-zinc-400">Prizom holds no liability for profit losses, database deletions, or prompt system failures.</p>
                    </div>

                    <div>
                      <h4 className="font-black text-zinc-900 mb-2">16. Indemnification</h4>
                      <p>You agree to indemnify and defend Prizom against liabilities, losses, and legal costs arising from copyright breaches in your prompts.</p>
                    </div>

                    <div>
                      <h4 className="font-black text-zinc-900 mb-2">17. Governing Law</h4>
                      <p>This digital agreement and subsequent arbitrations shall be governed exclusively under the jurisdiction of the State of Delaware (or California).</p>
                    </div>

                    <div>
                      <h4 className="font-black text-zinc-900 mb-2">18. Changes to Terms</h4>
                      <p>We declare revisions by updating the date metric. Continuing usage reflects absolute agreement to revised parameters.</p>
                    </div>

                    <div>
                      <h4 className="font-black text-zinc-900 mb-2">19. Contact Information</h4>
                      <p>Address: Prizom operates remotely from India. The registered office address will be updated after company incorporation. Legal email: <a href="mailto:copyright@prizom.in" className="text-indigo-600 font-bold hover:underline">copyright@prizom.in</a></p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-zinc-50 border border-zinc-200/50 p-5 rounded-2xl text-[11px] leading-relaxed text-zinc-400">
                    This Prizom Privacy Policy describes our data protection rules. Please read the full 19 sections detailed below.
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h4 className="font-black text-zinc-900 mb-2">1. Information We Collect</h4>
                      <p>We collect registration files, profile settings, parameters, views telemetry, star saves, copy counts, and system diagnostic data.</p>
                    </div>

                    <div className="bg-indigo-50/50 border border-indigo-100 p-5 rounded-2xl">
                      <h4 className="font-black text-indigo-950 mb-2 flex items-center">
                        <Lock className="w-4 h-4 mr-1.5 text-indigo-600" />
                        2. Account & Auth Data (Supabase Auth)
                      </h4>
                      <p className="text-[11px] leading-relaxed">Accounts rely on Supabase Authentication infrastructure. Email address, usernames, and cryptographic tokens are secure, and plain text password blocks are never held by Prizom.</p>
                    </div>

                    <div>
                      <h4 className="font-black text-zinc-900 mb-2">3. Usage Analytics</h4>
                      <p>To optimize feeds, we track prompt views, like actions, copy triggers, and creator follow parameters. This is used for platform sorting only.</p>
                    </div>

                    <div>
                      <h4 className="font-black text-zinc-900 mb-2">4. Cookies & Session Tracking</h4>
                      <p>We issue persistent cookies and LocalStorage identifiers to keep you logged in and retain dark/light layout states.</p>
                    </div>

                    <div>
                      <h4 className="font-black text-zinc-900 mb-2">5. Created Content Handling (Cloud Storage)</h4>
                      <p>Prompt scripts are stored in PostgreSQL tables. Image files and output illustrations reside publicly inside public Supabase Storage buckets.</p>
                    </div>

                    <div>
                      <h4 className="font-black text-zinc-900 mb-2">6. Profile Visibility</h4>
                      <p>Profiles are public index canvases. Information you input (avatars, bio descriptions, user handles) is accessible to the public.</p>
                    </div>

                    <div>
                      <h4 className="font-black text-zinc-900 mb-2">7. Saved Collections Data</h4>
                      <p>Folder bookmarks and collection categories write relational associations to databases to organize prompt flows.</p>
                    </div>

                    <div>
                      <h4 className="font-black text-zinc-900 mb-2">8. Remix & Social Interaction Data</h4>
                      <p>Remixing prompts links your creator profile and new revision variables to parent details pages for structural dual-attribution.</p>
                    </div>

                    <div>
                      <h4 className="font-black text-zinc-900 mb-2">9. How Data Is Used</h4>
                      <p>Data drives profile operations, query indexing, feed analytics, malicious injection checks, and support query routing.</p>
                    </div>

                    <div>
                      <h4 className="font-black text-zinc-900 mb-2">10. Data Sharing Practices</h4>
                      <p><strong>Prizom does not sell your personal data or collections to brokers.</strong> We share files only with secure infrastructure servers (Supabase hosting).</p>
                    </div>

                    <div>
                      <h4 className="font-black text-zinc-900 mb-2">11. Third-Party Integrations</h4>
                      <p>We route database records through Supabase systems. We are not responsible for policies operated by third-party hosting partners.</p>
                    </div>

                    <div className="bg-green-50/30 border border-green-100/50 p-5 rounded-2xl">
                      <h4 className="font-black text-green-950 mb-2 flex items-center">
                        <Check className="w-4 h-4 mr-1.5 text-green-600" />
                        12. Security Practices
                      </h4>
                      <p className="text-[11px] leading-relaxed">We secure pipelines using SSL/TLS 1.3 encryption, Row-Level Security (RLS) policies preventing unauthorized table alterations, and AES-256 databases parameters.</p>
                    </div>

                    <div>
                      <h4 className="font-black text-zinc-900 mb-2">13. Data Retention</h4>
                      <p>We preserve data during active credentials duration. Deletions wipe active rows within 24 hours, over-writing backup tapes over time.</p>
                    </div>

                    <div>
                      <h4 className="font-black text-zinc-900 mb-2">14. International Users (GDPR & CCPA)</h4>
                      <p>Data transfers from EU and UK execute commission-approved model contract clauses. Users hold legal rights to port, rectifying, and erasing profiles.</p>
                    </div>

                    <div>
                      <h4 className="font-black text-zinc-900 mb-2">15. Children’s Privacy</h4>
                      <p>In accordance with COPPA, Prizom does not target or maintain records of children under 13. Identified underage rows are instantly deleted.</p>
                    </div>

                    <div>
                      <h4 className="font-black text-zinc-900 mb-2">16. User Rights & Controls</h4>
                      <p>You can adjust display settings, edit descriptions, export prompt databases, and close saved collections configurations at your choice.</p>
                    </div>

                    <div>
                      <h4 className="font-black text-zinc-900 mb-2">17. Account Deletion Requests</h4>
                      <p>You can execute self-service account deletion triggers inside configuration profiles, erasing Supabase credentials and prompt lineages immediately.</p>
                    </div>

                    <div>
                      <h4 className="font-black text-zinc-900 mb-2">18. Updates to Policy</h4>
                      <p>Revisions are confirmed by revising the date metrics. Regular review helps you stay informed of platform privacy standards.</p>
                    </div>

                    <div>
                      <h4 className="font-black text-zinc-900 mb-2">19. Contact Information</h4>
                      <p>Direct issues to: Prizom Privacy Office. Prizom operates remotely from India. The registered office address will be updated after company incorporation. Email contact: <a href="mailto:privacy@prizom.in" className="text-indigo-600 font-bold hover:underline">privacy@prizom.in</a></p>
                    </div>
                  </div>
                </>
              )}

            </div>

            {/* Sticky Sub-Modal Footer */}
            <div className="flex items-center justify-end px-8 py-4 border-t border-zinc-200/60 bg-zinc-50/50 shrink-0 rounded-b-[2.5rem]">
              <button
                onClick={() => {
                  if (activeView === 'terms') setAcceptedTerms(true);
                  if (activeView === 'privacy') setAcceptedPrivacy(true);
                  setActiveView('none');
                }}
                className="inline-flex items-center justify-center px-6 py-2.5 bg-gradient-to-r from-[var(--color-electric-blue)] to-[var(--color-neon-purple)] text-white text-[10px] font-black uppercase tracking-wider rounded-full shadow-sm hover:shadow hover:-translate-y-0.5 transition-all transform active:scale-98 focus:outline-none"
                type="button"
              >
                {activeView === 'terms' ? 'Read & Agree to Terms' : 'Read & Agree to Privacy'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
