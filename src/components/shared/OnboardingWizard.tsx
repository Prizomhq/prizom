'use client';

import { useState, useEffect } from 'react';
import { Sparkles, Check, ChevronRight, ChevronLeft, Loader2, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import DynamicDialog from '@/components/ui/DynamicDialog';
import {
  saveOnboardingInterestsAction,
  getActiveCategoriesAction,
  getActiveToolsAction
} from '@/app/actions/profile';

// Tool color palette — applied in order to DB-fetched tools
const TOOL_COLORS = [
  'from-emerald-500/10 to-teal-500/10 text-emerald-600 border-emerald-200',
  'from-orange-500/10 to-amber-500/10 text-orange-600 border-orange-200',
  'from-blue-500/10 to-indigo-500/10 text-blue-600 border-blue-200',
  'from-purple-500/10 to-pink-500/10 text-purple-600 border-purple-200',
  'from-cyan-500/10 to-blue-500/10 text-cyan-600 border-cyan-200',
  'from-rose-500/10 to-pink-500/10 text-rose-600 border-rose-200',
  'from-zinc-500/10 to-slate-500/10 text-zinc-700 border-zinc-200',
  'from-yellow-500/10 to-orange-500/10 text-yellow-700 border-yellow-200',
];

// Category emoji palette — applied in order to DB-fetched categories
const CATEGORY_ICONS = ['✨', '🎨', '🌌', '🎭', '📸', '🏆', '🖼️', '🎬', '🤖', '💡'];

export default function OnboardingWizard() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingOptions, setFetchingOptions] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [errorDialog, setErrorDialog] = useState<{ isOpen: boolean; message: string }>({
    isOpen: false,
    message: ''
  });

  // P0-1: Dynamic DB-driven lists replacing hardcoded constants
  const [dbTools, setDbTools] = useState<{ id: string; name: string }[]>([]);
  const [dbCategories, setDbCategories] = useState<{ id: string; name: string; description?: string }[]>([]);

  useEffect(() => {
    const checkOnboardedStatus = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user;

      if (!currentUser) return;

      setUser(currentUser);

      // Check if user has already completed onboarding
      const { data: profile } = await supabase
        .from('profiles')
        .select('badges')
        .eq('id', currentUser.id)
        .single();

      const badges = profile?.badges || [];
      if (!badges.includes('onboarded')) {
        setIsOpen(true);

        // P0-1: Fetch live categories and tools from the database
        try {
          const [cats, tools] = await Promise.all([
            getActiveCategoriesAction(),
            getActiveToolsAction()
          ]);
          setDbCategories(cats);
          setDbTools(tools);
        } catch (err) {
          console.error('Failed to load onboarding options:', err);
        } finally {
          setFetchingOptions(false);
        }
      }
    };

    checkOnboardedStatus();
  }, []);

  if (!isOpen) return null;

  const handleToggleTool = (toolName: string) => {
    setSelectedTools(prev =>
      prev.includes(toolName) ? prev.filter(t => t !== toolName) : [...prev, toolName]
    );
  };

  const handleToggleCategory = (catName: string) => {
    setSelectedCategories(prev =>
      prev.includes(catName) ? prev.filter(c => c !== catName) : [...prev, catName]
    );
  };

  const handleNext = () => {
    if (step === 1) {
      setStep(2);
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
    }
  };

  const handleSubmit = async (isSkipping = false) => {
    setLoading(true);

    // P0-2: Convert string arrays → weighted maps (weight 5 = explicit onboarding selection)
    const toolWeights: Record<string, number> = {};
    const categoryWeights: Record<string, number> = {};

    if (!isSkipping) {
      selectedTools.forEach(t => { toolWeights[t.toLowerCase()] = 5; });
      selectedCategories.forEach(c => { categoryWeights[c.toLowerCase()] = 5; });
    }

    try {
      const res = await saveOnboardingInterestsAction(toolWeights, categoryWeights);
      if (res.success) {
        // P0-2: Seed localStorage with correct weighted schema for immediate client-side scoring
        localStorage.setItem(
          'prizom_interests_v2',
          JSON.stringify({
            categories: categoryWeights,
            tools: toolWeights,
            aspectRatios: {},
            tags: {},
            creators: {},
            searches: []
          })
        );
        setIsOpen(false);
        // Trigger page refresh to update feed dynamically
        window.location.reload();
      } else {
        setErrorDialog({
          isOpen: true,
          message: res.error || 'Failed to save onboarding interests.'
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-lg animate-in fade-in duration-300">
      <div className="bg-white rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl border border-zinc-200/50 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="p-8 pb-4 shrink-0 flex items-center justify-between border-b border-zinc-150 bg-zinc-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[var(--color-neon-purple)] to-[var(--color-electric-blue)] flex items-center justify-center shadow-md shadow-[var(--color-neon-purple)]/20">
              <Sparkles className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-black text-zinc-900 tracking-tight">Personalize Prizom</h2>
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mt-0.5">Step {step} of 2</p>
            </div>
          </div>
          
          <button
            onClick={() => handleSubmit(true)}
            disabled={loading}
            className="px-4 py-2 text-xs font-black text-zinc-500 hover:text-zinc-800 bg-zinc-100 hover:bg-zinc-200 rounded-full transition-all"
          >
            Skip Onboarding
          </button>
        </div>

        {/* Scrollable Selection Content */}
        <div className="p-8 overflow-y-auto flex-1">
          {step === 1 ? (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <h3 className="text-2xl font-black text-zinc-900 tracking-tight mb-2">Which AI models do you use?</h3>
              <p className="text-sm text-zinc-500 font-medium mb-6">Select the AI tools you write image prompts for. We'll tailor your feed accordingly.</p>

              {fetchingOptions ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-20 rounded-2xl bg-zinc-100 animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {dbTools.map((tool, idx) => {
                    const isSelected = selectedTools.includes(tool.name);
                    const color = TOOL_COLORS[idx % TOOL_COLORS.length];
                    const colorParts = color.split(' ');
                    return (
                      <button
                        key={tool.id}
                        onClick={() => handleToggleTool(tool.name)}
                        className={`group p-5 rounded-2xl border text-left transition-all duration-300 hover:scale-[1.01] hover:shadow-md cursor-pointer flex items-start justify-between gap-4 ${
                          isSelected
                            ? 'border-[var(--color-neon-purple)] bg-purple-50/40 ring-2 ring-[var(--color-neon-purple)]/10 shadow-[0_0_15px_rgba(168,85,247,0.1)]'
                            : 'border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-900'
                        }`}
                      >
                        <div className="flex-1">
                          <span className={`inline-block px-2.5 py-0.5 rounded-lg text-xs font-black mb-1 bg-gradient-to-r ${colorParts[0]} ${colorParts[1]} ${colorParts[2]}`}>
                            {tool.name}
                          </span>
                        </div>

                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                          isSelected 
                            ? 'bg-[var(--color-neon-purple)] border-[var(--color-neon-purple)] text-white shadow-sm' 
                            : 'border-zinc-300 bg-white group-hover:border-zinc-400'
                        }`}>
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <h3 className="text-2xl font-black text-zinc-900 tracking-tight mb-2">What visual styles interest you?</h3>
              <p className="text-sm text-zinc-500 font-medium mb-6">Pick visual styles of interest to customize your creative feed.</p>

              {fetchingOptions ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-20 rounded-2xl bg-zinc-100 animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {dbCategories.map((cat, idx) => {
                    const isSelected = selectedCategories.includes(cat.name);
                    const icon = CATEGORY_ICONS[idx % CATEGORY_ICONS.length];
                    return (
                      <button
                        key={cat.id}
                        onClick={() => handleToggleCategory(cat.name)}
                        className={`group p-5 rounded-2xl border text-left transition-all duration-300 hover:scale-[1.01] hover:shadow-md cursor-pointer flex items-center justify-between gap-4 ${
                          isSelected
                            ? 'border-[var(--color-neon-purple)] bg-purple-50/40 ring-2 ring-[var(--color-neon-purple)]/10 shadow-[0_0_15px_rgba(168,85,247,0.1)]'
                            : 'border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-900'
                        }`}
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <span className="text-2xl shrink-0">{icon}</span>
                          <div className="flex flex-col">
                            <span className="font-extrabold text-[15px] text-zinc-900">{cat.name}</span>
                            {cat.description && (
                              <span className="text-xs font-medium text-zinc-500 mt-0.5 truncate">{cat.description}</span>
                            )}
                          </div>
                        </div>

                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                          isSelected 
                            ? 'bg-[var(--color-neon-purple)] border-[var(--color-neon-purple)] text-white shadow-sm' 
                            : 'border-zinc-300 bg-white group-hover:border-zinc-400'
                        }`}>
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>


        {/* Footer */}
        <div className="p-8 border-t border-zinc-150 shrink-0 flex items-center justify-between bg-zinc-50/50">
          <div>
            {step === 2 ? (
              <button
                type="button"
                onClick={handleBack}
                disabled={loading}
                className="px-6 py-3.5 text-sm font-bold text-zinc-700 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-xl transition-all flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
            ) : (
              <div />
            )}
          </div>

          <div>
            {step === 1 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={selectedTools.length === 0}
                className="px-8 py-3.5 text-sm font-bold text-white bg-zinc-900 hover:bg-black rounded-xl transition-all flex items-center gap-2 hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none shadow-sm"
              >
                <span>Continue</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSubmit(false)}
                disabled={loading || selectedCategories.length === 0}
                className="px-8 py-3.5 text-sm font-bold text-white bg-gradient-to-r from-[var(--color-neon-purple)] to-[var(--color-electric-blue)] hover:shadow-[0_8px_25px_rgba(168,85,247,0.4)] rounded-xl transition-all flex items-center gap-2 hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving Interests...
                  </>
                ) : (
                  <>
                    <span>Finish Setup</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>

      </div>
      <DynamicDialog
        isOpen={errorDialog.isOpen}
        onClose={() => setErrorDialog(prev => ({ ...prev, isOpen: false }))}
        title="Onboarding Error"
        description={errorDialog.message}
        type="error"
      />
    </div>
  );
}
