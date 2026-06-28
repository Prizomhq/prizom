'use client';

import React, { useState, useEffect } from 'react';
import { Mail, MessageSquare, Send, Sparkles, CheckCircle, ArrowRight } from 'lucide-react';
import { getPublicCMS, submitContactMessageAction } from '@/app/actions/adminActions';
import Script from 'next/script';

export default function ContactForm({ developer: initialDeveloper }: { developer?: any }) {
  const [developer, setDeveloper] = useState<any>(initialDeveloper);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; message?: string }>({});
  const [turnstileToken, setTurnstileToken] = useState<string>('');
  const [isWidgetLoaded, setIsWidgetLoaded] = useState(false);

  useEffect(() => {
    if (!initialDeveloper) {
      const loadCMS = async () => {
        const res = await getPublicCMS();
        if (res.success && res.developer) {
          setDeveloper(res.developer);
        }
      };
      loadCMS();
    }
  }, [initialDeveloper]);

  useEffect(() => {
    if ((window as any).turnstile && !isWidgetLoaded) {
      try {
        (window as any).turnstile.render('#turnstile-contact-container', {
          sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '',
          callback: (token: string) => {
            setTurnstileToken(token);
          },
          'expired-callback': () => {
            setTurnstileToken('');
          },
          'error-callback': () => {
            setTurnstileToken('');
          }
        });
        setIsWidgetLoaded(true);
      } catch (e) {
        console.warn('Turnstile contact widget render warning:', e);
      }
    }
  }, [isWidgetLoaded]);

  const handleScriptLoad = () => {
    if ((window as any).turnstile && !isWidgetLoaded) {
      try {
        (window as any).turnstile.render('#turnstile-contact-container', {
          sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '',
          callback: (token: string) => {
            setTurnstileToken(token);
          },
          'expired-callback': () => {
            setTurnstileToken('');
          },
          'error-callback': () => {
            setTurnstileToken('');
          }
        });
        setIsWidgetLoaded(true);
      } catch (e) {
        console.warn('Turnstile contact script load warning:', e);
      }
    }
  };

  const validateForm = () => {
    const newErrors: { email?: string; message?: string } = {};
    
    if (!email) {
      newErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!message) {
      newErrors.message = 'Message content cannot be empty';
    } else if (message.length < 10) {
      newErrors.message = 'Please write a slightly longer message (min 10 characters)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    if (!turnstileToken) {
      setErrors({ message: 'Please complete the CAPTCHA check.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await submitContactMessageAction(email, message, turnstileToken);
      if (res.success) {
        setIsSuccess(true);
        setEmail('');
        setMessage('');
        setErrors({});
        setTurnstileToken('');
        if ((window as any).turnstile) {
          (window as any).turnstile.reset('#turnstile-contact-container');
        }
      } else {
        setErrors({ message: res.error || 'Failed to submit' });
        if ((window as any).turnstile) {
          (window as any).turnstile.reset('#turnstile-contact-container');
          setTurnstileToken('');
        }
      }
    } catch (err: any) {
      setErrors({ message: err.message || 'An unexpected error occurred' });
      if ((window as any).turnstile) {
        (window as any).turnstile.reset('#turnstile-contact-container');
        setTurnstileToken('');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const showDevSection = developer?.show_section !== false;

  return (
    <div id="contact" className="w-full relative rounded-[2.5rem] overflow-hidden bg-white/40 border border-zinc-200/50 backdrop-blur-md shadow-[0_20px_50px_rgba(0,0,0,0.03)] transition-all duration-300">
      {/* Absolute floating glowing blurs */}
      <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-[var(--color-neon-purple)]/5 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-64 h-64 rounded-full bg-[var(--color-electric-blue)]/5 blur-3xl pointer-events-none" />

      <div className="grid grid-cols-1 lg:grid-cols-12">
        {/* Left Column: The Form */}
        <div className={`${
          showDevSection 
            ? 'lg:col-span-7 border-b lg:border-b-0 lg:border-r border-zinc-200/30' 
            : 'lg:col-span-12'
        } p-8 sm:p-12 lg:p-16`}>
          <div className="max-w-md mx-auto lg:mx-0">
            <div className="inline-flex items-center space-x-2 bg-purple-50 border border-purple-100 rounded-full px-4 py-1 mb-6 shadow-sm">
              <Mail className="w-3.5 h-3.5 text-[var(--color-neon-purple)]" />
              <span className="text-[9px] font-black text-indigo-950 uppercase tracking-widest">Get in Touch</span>
            </div>
            
            <h3 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight mb-3">
              Drop Us a Message
            </h3>
            <p className="text-zinc-500 font-semibold text-xs mb-8 leading-relaxed">
              Have questions about the prompt registry, remix systems, or API partnerships? We'd love to hear from you.
            </p>

            {isSuccess ? (
              <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50/60 to-white/45 border border-emerald-100/50 p-8 rounded-3xl flex flex-col items-center text-center animate-fade-in">
                <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-600 mb-5 shadow-sm">
                  <CheckCircle className="w-10 h-10 animate-bounce" />
                </div>
                <h4 className="text-lg font-black text-zinc-950 mb-2">Message Sent Successfully!</h4>
                <p className="text-zinc-400 font-semibold text-xs leading-relaxed max-w-xs mb-6">
                  Thanks for reaching out! Our creator support team will review your message and reply via email within 24 hours.
                </p>
                <button
                  onClick={() => setIsSuccess(false)}
                  className="inline-flex items-center justify-center px-6 py-2.5 bg-white hover:bg-zinc-50 border border-zinc-200 hover:border-zinc-300 text-zinc-700 text-[10px] font-black uppercase tracking-wider rounded-full shadow-sm hover:shadow transition-all"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-[11px] font-black text-zinc-500 uppercase tracking-wider mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      id="email"
                      placeholder="you@domain.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isSubmitting}
                      className={`w-full px-5 py-3.5 bg-white/70 border rounded-2xl text-base sm:text-xs font-semibold text-zinc-800 placeholder-zinc-400 focus:outline-none transition-all duration-300 ${
                        errors.email
                          ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100'
                          : 'border-zinc-200/80 focus:border-[var(--color-neon-purple)] focus:ring-4 focus:ring-purple-100/40'
                      }`}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-red-500 font-bold text-[10px] mt-1.5 ml-1 animate-pulse">
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Message Field */}
                <div>
                  <label htmlFor="message" className="block text-[11px] font-black text-zinc-500 uppercase tracking-wider mb-2">
                    Message Content
                  </label>
                  <textarea
                    id="message"
                    rows={4}
                    placeholder="Tell us what you're building, sharing, or inquiring about..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    disabled={isSubmitting}
                    className={`w-full px-5 py-3.5 bg-white/70 border rounded-2xl text-base sm:text-xs font-semibold text-zinc-800 placeholder-zinc-400 focus:outline-none transition-all duration-300 resize-none ${
                      errors.message || errors.email && errors.message
                        ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100'
                        : 'border-zinc-200/80 focus:border-[var(--color-neon-purple)] focus:ring-4 focus:ring-purple-100/40'
                    }`}
                  />
                  {errors.message && (
                    <p className="text-red-500 font-bold text-[10px] mt-1.5 ml-1 animate-pulse">
                      {errors.message}
                    </p>
                  )}
                </div>

                {/* Cloudflare Turnstile CAPTCHA Container */}
                <div className="flex justify-center my-4">
                  <div id="turnstile-contact-container"></div>
                </div>

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || !turnstileToken}
                  className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-[var(--color-electric-blue)] to-[var(--color-neon-purple)] disabled:from-zinc-400 disabled:to-zinc-500 text-white text-xs font-black uppercase tracking-wider rounded-full shadow-[0_8px_25px_rgba(99,102,241,0.25)] hover:shadow-[0_15px_30px_rgba(168,85,247,0.35)] disabled:shadow-none hover:-translate-y-0.5 disabled:hover:translate-y-0 disabled:cursor-not-allowed transform transition-all duration-300"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 mr-2.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending Message...
                    </>
                  ) : (
                    <>
                      Send Message
                      <Send className="w-3.5 h-3.5 ml-2" />
                    </>
                  )}
                </button>

                <Script 
                  src="https://challenges.cloudflare.com/turnstile/v0/api.js"
                  strategy="lazyOnload"
                  onLoad={handleScriptLoad}
                />
              </form>
            )}
          </div>
        </div>

        {/* Right Column: Meet the Developer Profile Card */}
        {showDevSection && (
          <div className="lg:col-span-5 p-8 sm:p-12 lg:p-16 bg-zinc-50/40 flex flex-col justify-between relative overflow-hidden">
            {/* Subtle back-glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center lg:items-start text-center lg:text-left">
              {/* Circular Profile Avatar */}
              <div className="relative group/avatar w-28 h-28 mb-6 shrink-0">
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[var(--color-electric-blue)] via-indigo-50 to-[var(--color-neon-purple)] animate-pulse opacity-60 blur-md group-hover/avatar:opacity-100 transition-opacity duration-300" />
                <div className="relative w-full h-full rounded-full p-[3px] bg-gradient-to-tr from-[var(--color-electric-blue)] to-[var(--color-neon-purple)] overflow-hidden shadow-md">
                  <img 
                    src={developer?.avatar_url || '/developer_avatar.png'} 
                    alt={developer?.name || 'Developer Avatar'} 
                    className="w-full h-full rounded-full object-cover bg-white"
                  />
                </div>
              </div>

              {/* Profile Identifiers */}
              <span className="text-[10px] font-black text-indigo-950 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full uppercase tracking-widest mb-3.5">
                Meet the Developer
              </span>
              <h4 className="text-2xl font-black text-zinc-900 tracking-tight leading-none mb-1.5">
                {developer?.name || 'Alex Rivera'}
              </h4>
              <p className="text-[11px] font-extrabold text-indigo-600 uppercase tracking-wider mb-5">
                {developer?.bio ? 'Founder & Creator' : 'Founder & Developer of Prizom'}
              </p>
              
              {/* Bio Description */}
              <p className="text-zinc-500 font-semibold text-xs leading-relaxed mb-8 max-w-sm">
                {developer?.bio || 'Building a collaborative platform where AI creators can discover, remix, and share prompts together. Passionate about open prompt engineering and developer tools.'}
              </p>

              {/* Clickable Social Platforms */}
              <div className="w-full space-y-3">
                {/* Twitter / X */}
                {developer?.twitter && (
                  <a 
                    href={developer.twitter} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="group flex items-center justify-between p-4 bg-white/70 border border-zinc-200/60 rounded-2xl hover:border-zinc-300 hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:text-zinc-900 transition-all duration-300 w-full"
                  >
                    <div className="flex items-center space-x-3.5">
                      <div className="p-2 bg-zinc-50 text-zinc-700 rounded-xl group-hover:scale-105 transition-transform duration-300">
                        <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
                        </svg>
                      </div>
                      <div>
                        <h5 className="text-[11px] font-black text-zinc-900 uppercase tracking-wider">X / Twitter</h5>
                        <p className="text-[10px] text-zinc-400 font-semibold">Dev updates & prompt workflows</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-zinc-300 group-hover:text-zinc-900 group-hover:translate-x-0.5 transition-all" />
                  </a>
                )}

                {/* GitHub */}
                {developer?.github && (
                  <a 
                    href={developer.github} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="group flex items-center justify-between p-4 bg-white/70 border border-zinc-200/60 rounded-2xl hover:border-zinc-300 hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:text-zinc-900 transition-all duration-300 w-full"
                  >
                    <div className="flex items-center space-x-3.5">
                      <div className="p-2 bg-zinc-50 text-zinc-700 rounded-xl group-hover:scale-105 transition-transform duration-300">
                        <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                        </svg>
                      </div>
                      <div>
                        <h5 className="text-[11px] font-black text-zinc-900 uppercase tracking-wider">GitHub</h5>
                        <p className="text-[10px] text-zinc-400 font-semibold">Open-source code & setups</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-zinc-300 group-hover:text-zinc-900 group-hover:translate-x-0.5 transition-all" />
                  </a>
                )}

                {/* LinkedIn */}
                {developer?.linkedin && (
                  <a 
                    href={developer.linkedin} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="group flex items-center justify-between p-4 bg-white/70 border border-zinc-200/60 rounded-2xl hover:border-indigo-200/80 hover:shadow-[0_4px_20px_rgba(99,102,241,0.1)] hover:text-indigo-600 transition-all duration-300 w-full"
                  >
                    <div className="flex items-center space-x-3.5">
                      <div className="p-2 bg-indigo-50 text-indigo-500 rounded-xl group-hover:scale-105 transition-transform duration-300">
                        <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                          <rect x="2" y="9" width="4" height="12" />
                          <circle cx="4" cy="4" r="2" />
                        </svg>
                      </div>
                      <div>
                        <h5 className="text-[11px] font-black text-zinc-900 uppercase tracking-wider">LinkedIn</h5>
                        <p className="text-[10px] text-zinc-400 font-semibold">Professional background</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-zinc-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all" />
                  </a>
                )}

                {/* Instagram */}
                {developer?.instagram && (
                  <a 
                    href={developer.instagram} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="group flex items-center justify-between p-4 bg-white/70 border border-zinc-200/60 rounded-2xl hover:border-pink-200 hover:shadow-[0_4px_20px_rgba(236,72,153,0.06)] hover:text-pink-650 transition-all duration-300 w-full"
                  >
                    <div className="flex items-center space-x-3.5">
                      <div className="p-2 bg-pink-50 text-pink-500 rounded-xl group-hover:scale-105 transition-transform duration-300">
                        <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                          <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                        </svg>
                      </div>
                      <div>
                        <h5 className="text-[11px] font-black text-zinc-900 uppercase tracking-wider">Instagram</h5>
                        <p className="text-[10px] text-zinc-400 font-semibold">Creator updates & creative edits</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-zinc-300 group-hover:text-pink-650 group-hover:translate-x-0.5 transition-all" />
                  </a>
                )}
              </div>
            </div>

            <div className="relative z-10 flex items-center space-x-2 text-[10px] font-bold text-zinc-400 mt-8 pt-8 border-t border-zinc-200/20 w-full justify-center lg:justify-start">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>{developer?.custom_text || 'Connecting creators & developers globally'}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

