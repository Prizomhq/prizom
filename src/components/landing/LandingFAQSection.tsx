'use client';

import React, { useState } from 'react';
import { HelpCircle, ChevronDown, Sparkles } from 'lucide-react';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

const faqItems: FAQItem[] = [
  {
    id: 'faq-1',
    question: 'What is Prizom and how does it differ from Midjourney or PromptBase?',
    answer: 'Prizom is an open collaborative registry for generative AI prompt formulas. Unlike prompt marketplaces, Prizom is built for prompt engineers to save visual formulas, remix parameters, track attribution trees, and build public creative portfolios.'
  },
  {
    id: 'faq-2',
    question: 'Are prompt formulas free to discover and remix?',
    answer: 'Yes! Discovering, copying, and remixing prompt formulas on Prizom is 100% free for all registered creators and visitors.'
  },
  {
    id: 'faq-3',
    question: 'How do automatic prompt lineage trees work?',
    answer: 'When you remix a prompt formula on Prizom, the system automatically links your new variation back to the parent prompt. This credits the original creator while mapping how generative visual styles evolve across model versions.'
  },
  {
    id: 'faq-4',
    question: 'Which AI generator tools are supported?',
    answer: 'Prizom supports all leading generative AI models including Midjourney (v6 & v6.1), Flux.1 (Dev & Schnell), DALL-E 3, Ideogram 2.0, Stable Diffusion, and custom fine-tunes.'
  },
  {
    id: 'faq-5',
    question: 'How do I earn verified creator standing?',
    answer: 'Creators earn verified standing by publishing original prompt formulas, gathering community likes and remixes, and maintaining high platform reliability.'
  }
];

export default function LandingFAQSection() {
  const [openId, setOpenId] = useState<string | null>('faq-1');

  const toggleItem = (id: string) => {
    setOpenId(prev => (prev === id ? null : id));
  };

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-[1600px] mx-auto w-full border-t border-zinc-200/80">
      
      {/* Header */}
      <div className="text-center space-y-3 mb-14">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-700 text-[11px] font-bold uppercase tracking-wider mx-auto">
          <HelpCircle className="w-3.5 h-3.5" />
          Frequently Asked Questions
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 tracking-tight">
          Everything You Need to Know About Prizom
        </h2>
        <p className="text-zinc-500 font-medium text-sm max-w-xl mx-auto">
          Have questions about saving, remixing, or publishing prompt formulas? We have answers.
        </p>
      </div>

      {/* Accordion Container */}
      <div className="max-w-3xl mx-auto space-y-4">
        {faqItems.map((item) => {
          const isOpen = openId === item.id;
          return (
            <div
              key={item.id}
              className="bg-white border border-zinc-200/80 rounded-2xl overflow-hidden transition-all duration-200 shadow-2xs"
            >
              <button
                type="button"
                onClick={() => toggleItem(item.id)}
                className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm text-zinc-900 hover:text-indigo-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-2xl"
              >
                <span>{item.question}</span>
                <ChevronDown className={`w-4 h-4 text-zinc-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-indigo-600' : ''}`} />
              </button>
              {isOpen && (
                <div className="px-5 pb-5 pt-0 text-xs text-zinc-600 leading-relaxed font-medium border-t border-zinc-100 pt-3">
                  {item.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>

    </section>
  );
}
