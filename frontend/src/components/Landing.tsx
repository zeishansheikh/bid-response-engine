import React, { useState } from 'react';
import { 
  ArrowRight, 
  Zap, 
  Shield, 
  Target, 
  Menu, 
  X, 
  Rocket, 
  ChevronDown, 
  ChevronRight,
  FileText,
  CheckSquare,
  Sparkles,
  BarChart3,
  TrendingUp,
  Linkedin,
  Twitter,
  Youtube,
  Github
} from 'lucide-react';
import { AppView } from '../types';

export function Landing({ onNavigate }: { onNavigate: (view: AppView) => void }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="relative w-full h-screen overflow-y-auto overflow-x-hidden bg-[#0B1020] text-white font-sans scroll-smooth custom-scrollbar">
      {/* Hero Glow Effects */}
      <div className="absolute top-0 left-0 right-0 h-[800px] overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-300px] left-[-200px] w-[700px] h-[700px] rounded-full bg-[#4F8CFF]/10 blur-[130px]" />
        <div className="absolute top-[-250px] right-[-250px] w-[800px] h-[800px] rounded-full bg-[#7C3AED]/10 blur-[150px]" />
        <div className="absolute top-[400px] left-[30%] w-[400px] h-[400px] rounded-full bg-[#4F8CFF]/5 blur-[120px]" />
      </div>

      {/* Grid Overlay */}
      <div 
        className="absolute top-0 left-0 right-0 h-[800px] z-0 opacity-[0.02] pointer-events-none"
        style={{ 
          backgroundImage: 'linear-gradient(#64748B 1px, transparent 1px), linear-gradient(90deg, #64748B 1px, transparent 1px)', 
          backgroundSize: '50px 50px' 
        }}
      />

      {/* Sticky Header */}
      <header className="sticky top-0 z-50 w-full border-b border-[#263042]/50 bg-[#0B1020]/75 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => onNavigate('landing')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4F8CFF] to-[#7C3AED] flex items-center justify-center p-0.5 shadow-[0_0_20px_rgba(77,142,255,0.2)] group-hover:scale-105 transition-transform duration-200">
              <div className="w-full h-full bg-[#0B1020] rounded-[10px] flex items-center justify-center">
                <svg className="w-5 h-5 text-[#4F8CFF]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L2 7L2 17L12 22L22 17L22 7L12 2Z" fill="url(#header-logo-grad)" stroke="#4F8CFF" strokeWidth="2"/>
                  <path d="M12 7L7 10V14L12 17L17 14V10L12 7Z" fill="#7C3AED" opacity="0.6"/>
                  <defs>
                    <linearGradient id="header-logo-grad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#4F8CFF"/>
                      <stop offset="1" stopColor="#7C3AED"/>
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>
            <span className="font-extrabold text-xl tracking-tight text-white select-none">BidEngine</span>
          </div>

          {/* Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-300">
            <a href="#features" className="hover:text-white transition-colors duration-150">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors duration-150">How It Works</a>
            <a href="#pricing" className="hover:text-white transition-colors duration-150">Pricing</a>
            <a href="#resources" className="hover:text-white transition-colors duration-150">Resources</a>
            <a href="#company" className="hover:text-white transition-colors duration-150">Company</a>
          </nav>

          {/* Actions (Desktop) */}
          <div className="hidden md:flex items-center gap-4">
            <button 
              onClick={() => onNavigate('dashboard')}
              className="px-5 py-2 rounded-xl text-sm font-semibold border border-[#263042] bg-transparent hover:bg-gray-900/40 text-gray-200 transition-all duration-150 cursor-pointer"
            >
              Log in
            </button>
            <button 
              onClick={() => onNavigate('dashboard')}
              className="px-5 py-2 rounded-xl text-sm font-semibold bg-[#4F8CFF] hover:bg-[#4F8CFF]/90 text-white shadow-[0_0_20px_rgba(79,142,255,0.3)] transition-all duration-150 cursor-pointer"
            >
              Get Started
            </button>
          </div>

          {/* Hamburger (Mobile Menu Toggle) */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-gray-400 hover:text-white cursor-pointer"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#263042]/50 bg-[#0B1020] px-6 py-6 flex flex-col gap-5 text-base font-semibold text-gray-300">
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="hover:text-white py-1">Features</a>
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="hover:text-white py-1">How It Works</a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="hover:text-white py-1">Pricing</a>
            <a href="#resources" onClick={() => setMobileMenuOpen(false)} className="hover:text-white py-1">Resources</a>
            <a href="#company" onClick={() => setMobileMenuOpen(false)} className="hover:text-white py-1">Company</a>
            <hr className="border-[#263042]/50 my-1" />
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => { setMobileMenuOpen(false); onNavigate('dashboard'); }}
                className="w-full py-3 rounded-xl font-bold border border-[#263042] bg-transparent text-center text-gray-200 cursor-pointer"
              >
                Log in
              </button>
              <button 
                onClick={() => { setMobileMenuOpen(false); onNavigate('dashboard'); }}
                className="w-full py-3 rounded-xl font-bold bg-[#4F8CFF] text-center text-white cursor-pointer"
              >
                Get Started
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Sections Wrapper */}
      <main className="w-full relative z-10">
        
        {/* Section 2: Hero Section */}
        <section className="max-w-7xl mx-auto px-6 py-16 md:py-24 grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          {/* Hero Left Column */}
          <div className="lg:col-span-5 flex flex-col items-start text-left">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#263042] bg-[#111827]/40 text-xs font-semibold text-[#4F8CFF] mb-6 tracking-wide select-none">
              <span className="h-1.5 w-1.5 rounded-full bg-[#4F8CFF] animate-pulse" />
              AI-POWERED • ENTERPRISE READY
            </div>

            {/* Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1] mb-6">
              AI-Powered<br />
              Bid & Proposal<br />
              Response <span className="bg-gradient-to-r from-[#4F8CFF] to-[#7C3AED] bg-clip-text text-transparent">Engine</span>
            </h1>

            {/* Supporting Paragraph */}
            <p className="text-base md:text-lg text-gray-400 max-w-lg mb-8 leading-relaxed">
              Transform complex RFPs into winning proposals with AI-driven analysis, intelligent matching, and data-backed win probability prediction.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4 w-full sm:w-auto mb-12">
              <button 
                onClick={() => onNavigate('dashboard')}
                className="flex items-center justify-center gap-2 px-7 py-4 rounded-xl bg-[#4F8CFF] hover:bg-[#4F8CFF]/90 text-white font-bold text-base shadow-[0_4px_25px_rgba(79,142,255,0.35)] transition-all duration-200 group cursor-pointer"
              >
                Get Started Free
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button 
                onClick={() => onNavigate('dashboard')}
                className="flex items-center justify-center px-7 py-4 rounded-xl border border-[#263042] bg-[#111827]/20 hover:bg-[#111827]/50 text-white font-bold text-base transition-all duration-200 cursor-pointer"
              >
                Request Demo
              </button>
            </div>

            {/* 3 Muted Highlights */}
            <div className="w-full border-t border-[#263042]/50 pt-8 grid grid-cols-3 gap-4">
              <div className="flex items-start gap-2.5">
                <Zap className="text-[#4F8CFF] w-5 h-5 mt-0.5 shrink-0" />
                <div className="text-left">
                  <span className="text-xs md:text-sm font-extrabold text-white block">10x Faster</span>
                  <span className="text-[10px] md:text-xs text-gray-400 block mt-0.5 leading-tight">Response Time</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Target className="text-[#4F8CFF] w-5 h-5 mt-0.5 shrink-0" />
                <div className="text-left">
                  <span className="text-xs md:text-sm font-extrabold text-white block">Higher Win Rate</span>
                  <span className="text-[10px] md:text-xs text-gray-400 block mt-0.5 leading-tight">Data-Driven Insights</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Shield className="text-[#4F8CFF] w-5 h-5 mt-0.5 shrink-0" />
                <div className="text-left">
                  <span className="text-xs md:text-sm font-extrabold text-white block">Enterprise Grade</span>
                  <span className="text-[10px] md:text-xs text-gray-400 block mt-0.5 leading-tight">Secure & Scalable</span>
                </div>
              </div>
            </div>
          </div>

          {/* Hero Right Column: Dashboard Mockup */}
          <div className="lg:col-span-7 w-full flex items-center justify-center relative">
            {/* Ambient Background glow directly behind dashboard */}
            <div className="absolute w-[80%] h-[80%] bg-[#7C3AED]/20 blur-[100px] rounded-full pointer-events-none z-0" />
            <div className="relative z-10 w-full max-w-2xl">
              <DashboardMockup />
            </div>
          </div>
        </section>

        {/* Section 3: Trusted Companies */}
        <section className="bg-white py-16 text-[#0B1020]">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <h2 className="text-[11px] font-bold text-gray-400 tracking-[0.25em] uppercase mb-10 select-none">
              Trusted by Leading Organizations
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-10 items-center justify-items-center opacity-80 hover:opacity-100 transition-opacity duration-300">
              <DeloitteLogo />
              <EYLogo />
              <KPMGLogo />
              <PwCLogo />
              <TCSLogo />
              <InfosysLogo />
            </div>
          </div>
        </section>

        {/* Section 4: Powerful Features */}
        <section id="features" className="bg-white py-24 text-[#0B1020] border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-6 text-center">
            {/* Small header tag */}
            <span className="text-xs font-bold text-[#7C3AED] uppercase tracking-[0.2em] block mb-3 select-none">
              Powerful Features
            </span>
            {/* Large title */}
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-gray-900 mb-4">
              Everything You Need to Win
            </h2>
            {/* Description */}
            <p className="text-base md:text-lg text-gray-500 max-w-2xl mx-auto mb-16 leading-relaxed">
              From RFP analysis to final proposal, our AI-powered platform streamlines every step of your bid management process.
            </p>

            {/* 6 Feature Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <FeatureCard 
                icon={<FileText className="w-6 h-6" />}
                title="Intelligent RFP Analysis"
                description="Extract and analyze requirements, constraints, and evaluation criteria using advanced NLP."
              />
              <FeatureCard 
                icon={<Target className="w-6 h-6" />}
                title="Smart Capability Matching"
                description="AI-powered semantic matching against your capability library to find the perfect fits."
              />
              <FeatureCard 
                icon={<CheckSquare className="w-6 h-6" />}
                title="Compliance Assurance"
                description="Automated compliance checking against all requirements and submission guidelines."
              />
              <FeatureCard 
                icon={<Sparkles className="w-6 h-6" />}
                title="AI Content Generation"
                description="Generate tailored, high-quality responses with AI while maintaining your voice and standards."
              />
              <FeatureCard 
                icon={<TrendingUp className="w-6 h-6" />}
                title="Win Probability Scoring"
                description="Data-driven win probability prediction based on multiple factors and historical data."
              />
              <FeatureCard 
                icon={<BarChart3 className="w-6 h-6" />}
                title="Performance Analytics"
                description="Comprehensive insights and reports to improve your bidding performance over time."
              />
            </div>
          </div>
        </section>

        {/* Section 5: CTA Banner */}
        <section className="bg-white py-12 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="relative rounded-[32px] bg-gradient-to-br from-[#0B1020] via-[#151230] to-[#0B1020] border border-[#263042]/50 px-8 py-10 md:px-12 md:py-12 flex flex-col lg:flex-row items-center justify-between gap-8 shadow-[0_15px_40px_rgba(0,0,0,0.15)] overflow-hidden">
              {/* Overlay glow inside CTA banner */}
              <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#7C3AED]/10 blur-[100px] rounded-full pointer-events-none" />
              
              <div className="flex items-center gap-6 relative z-10 text-left">
                {/* Rocket Icon Container */}
                <div className="w-16 h-16 shrink-0 rounded-2xl bg-[#7C3AED]/20 border border-[#7C3AED]/35 flex items-center justify-center text-[#7C3AED] shadow-[0_0_20px_rgba(124,58,237,0.2)]">
                  <Rocket className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-xl md:text-2xl font-extrabold text-white">
                    Ready to Transform Your Bid Process?
                  </h3>
                  <p className="text-gray-400 text-sm mt-1">
                    Join hundreds of organizations winning more bids with AI
                  </p>
                </div>
              </div>

              {/* CTA Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 relative z-10 w-full lg:w-auto shrink-0 justify-center">
                <button 
                  onClick={() => onNavigate('dashboard')}
                  className="px-8 py-4 rounded-xl bg-[#4F8CFF] hover:bg-[#4F8CFF]/90 text-white font-bold text-base shadow-[0_4px_20px_rgba(79,142,255,0.3)] transition-all duration-200 cursor-pointer text-center"
                >
                  Start Free Trial
                </button>
                <button 
                  onClick={() => onNavigate('dashboard')}
                  className="px-8 py-4 rounded-xl border border-[#263042] bg-[#111827]/40 hover:bg-[#111827]/70 text-white font-bold text-base transition-all duration-200 cursor-pointer text-center"
                >
                  Book Demo Call
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Section 6: Dark Footer */}
        <footer className="bg-[#080C16] border-t border-[#263042]/30 py-16 text-gray-400">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-12">
            {/* Logo and About Column */}
            <div className="md:col-span-4 flex flex-col items-start text-left">
              <div className="flex items-center gap-3 cursor-pointer group mb-5" onClick={() => onNavigate('landing')}>
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#4F8CFF] to-[#7C3AED] flex items-center justify-center p-0.5">
                  <div className="w-full h-full bg-[#080C16] rounded-[7px] flex items-center justify-center">
                    <svg className="w-4 h-4 text-[#4F8CFF]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2L2 7L2 17L12 22L22 17L22 7L12 2Z" fill="url(#footer-logo-grad)" stroke="#4F8CFF" strokeWidth="2"/>
                      <defs>
                        <linearGradient id="footer-logo-grad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#4F8CFF"/>
                          <stop offset="1" stopColor="#7C3AED"/>
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                </div>
                <span className="font-extrabold text-lg text-white">BidEngine</span>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed mb-6 max-w-sm">
                The AI-powered platform that helps organizations create winning proposals faster and more efficiently.
              </p>
              {/* Social Icons */}
              <div className="flex gap-4">
                <a href="#" className="w-8 h-8 rounded-full border border-[#263042] flex items-center justify-center hover:bg-gray-800 hover:text-white transition-all text-gray-400">
                  <Linkedin size={14} />
                </a>
                <a href="#" className="w-8 h-8 rounded-full border border-[#263042] flex items-center justify-center hover:bg-gray-800 hover:text-white transition-all text-gray-400">
                  <Twitter size={14} />
                </a>
                <a href="#" className="w-8 h-8 rounded-full border border-[#263042] flex items-center justify-center hover:bg-gray-800 hover:text-white transition-all text-gray-400">
                  <Youtube size={14} />
                </a>
                <a href="#" className="w-8 h-8 rounded-full border border-[#263042] flex items-center justify-center hover:bg-gray-800 hover:text-white transition-all text-gray-400">
                  <Github size={14} />
                </a>
              </div>
            </div>

            {/* Links Columns */}
            <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-8 text-left text-sm">
              <div>
                <h4 className="font-bold text-white mb-4">Product</h4>
                <ul className="flex flex-col gap-2.5">
                  <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">How It Works</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-white mb-4">Resources</h4>
                <ul className="flex flex-col gap-2.5">
                  <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Case Studies</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Templates</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Webinars</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-white mb-4">Company</h4>
                <ul className="flex flex-col gap-2.5">
                  <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Partners</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">News</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-white mb-4">Support</h4>
                <ul className="flex flex-col gap-2.5">
                  <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Community</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Training</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">API Reference</a></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom Legal Row */}
          <div className="max-w-7xl mx-auto px-6 border-t border-[#263042]/20 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <span>© 2026 BidEngine. All rights reserved.</span>
            <div className="flex gap-6">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Cookie Policy</a>
            </div>
          </div>
        </footer>

      </main>
    </div>
  );
}

// Reusable Feature Card Component
function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_15px_40px_rgba(0,0,0,0.06)] hover:border-gray-300/60 hover:-translate-y-1 transition-all duration-300 flex items-start gap-6 text-left group">
      {/* Icon Circle Container */}
      <div className="w-14 h-14 shrink-0 rounded-2xl bg-blue-50/70 border border-blue-100/50 flex items-center justify-center text-[#4F8CFF] group-hover:scale-105 transition-transform duration-300">
        {icon}
      </div>
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

// SVG EY logo helper shape (clip path fallback inside CSS is safer)
// KPMG, PwC, TCS etc contain self-contained CSS vector graphics.
function DeloitteLogo() {
  return (
    <div className="flex items-center text-gray-500 hover:text-black transition-colors duration-300 select-none">
      <span className="font-sans font-black text-xl tracking-tight text-black">Deloitte<span className="text-[#86BC25]">.</span></span>
    </div>
  );
}

function EYLogo() {
  return (
    <div className="flex items-center gap-1.5 text-gray-500 hover:text-[#FFE600] transition-colors duration-300 select-none">
      <span className="font-sans font-extrabold text-xl text-black">EY</span>
      <svg className="h-4.5 w-4.5 text-[#FFE600]" viewBox="0 0 24 24" fill="currentColor">
        <path d="M0 24L24 24L24 0L0 24Z" />
      </svg>
    </div>
  );
}

function KPMGLogo() {
  return (
    <div className="flex flex-col items-center select-none opacity-70 hover:opacity-100 transition-opacity duration-300">
      <div className="flex gap-[1.5px] mb-[2px]">
        <div className="w-3.5 h-[3px] bg-[#00338D]" />
        <div className="w-3.5 h-[3px] bg-[#00338D]" />
        <div className="w-3.5 h-[3px] bg-[#00338D]" />
        <div className="w-3.5 h-[3px] bg-[#00338D]" />
      </div>
      <span className="font-sans font-extrabold text-sm text-[#00338D] tracking-[0.08em] leading-none">KPMG</span>
    </div>
  );
}

function PwCLogo() {
  return (
    <div className="flex items-center gap-1 select-none opacity-70 hover:opacity-100 transition-opacity duration-300">
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="14" width="6" height="6" fill="#D8563C" />
        <rect x="8" y="8" width="6" height="6" fill="#EB8C33" />
        <rect x="2" y="8" width="6" height="6" fill="#FFB114" />
        <rect x="8" y="14" width="6" height="6" fill="#7D243C" />
        <rect x="14" y="8" width="6" height="6" fill="#D8563C" />
        <rect x="14" y="2" width="6" height="6" fill="#FFB114" />
      </svg>
      <span className="font-sans font-bold text-sm text-[#4D4D4D] leading-none mt-1">pwc</span>
    </div>
  );
}

function TCSLogo() {
  return (
    <div className="flex items-center gap-1 select-none opacity-70 hover:opacity-100 transition-opacity duration-300">
      <svg className="h-5 w-5 text-[#00338D]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 13C6 9 10 9 13 13C16 17 20 17 22 13" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M2 9C6 5 10 5 13 9C16 13 20 13 22 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" opacity="0.5" />
      </svg>
      <div className="flex flex-col text-left">
        <span className="font-sans font-black text-[9px] text-[#00338D] leading-none">tcs</span>
        <span className="font-sans text-[4.5px] text-gray-500 leading-none tracking-[0.05em] font-bold">CONSULTANCY</span>
      </div>
    </div>
  );
}

function InfosysLogo() {
  return (
    <div className="select-none opacity-75 hover:opacity-100 hover:text-[#007CC3] transition-all duration-300">
      <span className="font-sans font-extrabold text-[17px] text-[#007CC3] tracking-tighter">Infosys</span>
    </div>
  );
}

function DashboardMockup() {
  return (
    <div className="w-full relative rounded-2xl border border-[#263042] bg-[#0B1020] shadow-[0_20px_50px_rgba(0,0,0,0.65)] overflow-hidden flex aspect-[1.38/1] text-[10px] select-none">
      {/* Sidebar */}
      <div className="w-[155px] shrink-0 border-r border-[#263042]/50 bg-[#0B1020]/95 p-3.5 hidden md:flex flex-col gap-4 text-gray-400">
        {/* Sidebar Brand Logo */}
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 rounded-lg bg-[#4F8CFF]/10 border border-[#4F8CFF]/30 flex items-center justify-center p-0.5">
            <svg className="w-3.5 h-3.5 text-[#4F8CFF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5" fill="rgba(79, 140, 255, 0.1)" stroke="#4F8CFF" />
            </svg>
          </div>
          <span className="font-bold text-[10.5px] text-white">BidEngine</span>
        </div>

        {/* Dropdown Selector */}
        <div className="border border-[#263042]/75 bg-gray-950/40 rounded-lg px-2.5 py-1.5 flex items-center justify-between">
          <span className="text-[9px] text-white font-semibold">Acme Corp</span>
          <ChevronDown size={10} className="text-gray-500" />
        </div>

        {/* Sidebar Navigation */}
        <div className="flex flex-col gap-1.5 text-[9px] font-semibold">
          <div className="bg-[#1E293B] text-white border border-[#263042]/80 rounded-lg px-2 py-1.5 flex items-center gap-2 shadow-[0_0_10px_rgba(79,142,255,0.02)]">
            <LayoutDashboardMock size={12} className="text-[#4F8CFF]" />
            Dashboard
          </div>
          <div className="px-2 py-1.5 flex items-center gap-2 hover:bg-gray-900/30 rounded-lg">
            <BriefcaseMock size={12} />
            Workspaces
          </div>
          <div className="px-2 py-1.5 flex items-center gap-2 hover:bg-gray-900/30 rounded-lg">
            <FileTextMock size={12} />
            Requirements
          </div>
          <div className="px-2 py-1.5 flex items-center gap-2 hover:bg-gray-900/30 rounded-lg">
            <ShieldMock size={12} />
            Compliance
          </div>
          <div className="px-2 py-1.5 flex items-center gap-2 hover:bg-gray-900/30 rounded-lg">
            <TargetMock size={12} />
            Win Probability
          </div>
          <div className="px-2 py-1.5 flex items-center gap-2 hover:bg-gray-900/30 rounded-lg">
            <BarChartMock size={12} />
            Reports
          </div>
          <div className="px-2 py-1.5 flex items-center gap-2 hover:bg-gray-900/30 rounded-lg">
            <SettingsMock size={12} />
            Settings
          </div>
        </div>
      </div>

      {/* Main Dashboard Area */}
      <div className="flex-1 bg-[#080C16] p-4 flex flex-col gap-3.5 overflow-hidden text-left">
        {/* Top Header */}
        <div className="flex justify-between items-center border-b border-[#263042]/20 pb-2">
          <span className="font-bold text-xs text-white">Dashboard</span>
          <div className="flex items-center gap-2">
            <div className="w-5.5 h-5.5 rounded-full bg-gradient-to-tr from-[#4F8CFF] to-[#7C3AED] flex items-center justify-center text-white font-black text-[7.5px] shadow-sm">
              JD
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-[8px] text-white">John Doe</span>
              <span className="text-[6.5px] text-gray-500 font-semibold leading-none mt-0.5">Acme Corp</span>
            </div>
          </div>
        </div>

        {/* KPI Cards Grid */}
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-[#111827] border border-[#263042]/40 rounded-xl p-2 flex flex-col">
            <span className="text-[6.5px] text-gray-400 uppercase font-bold tracking-wider mb-0.5">Active Workspaces</span>
            <span className="text-xs font-black text-white">12</span>
          </div>
          <div className="bg-[#111827] border border-[#263042]/40 rounded-xl p-2 flex flex-col">
            <span className="text-[6.5px] text-gray-400 uppercase font-bold tracking-wider mb-0.5">Win Probability</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xs font-black text-[#22C55E]">78%</span>
              <span className="text-[5.5px] text-[#22C55E] font-bold bg-[#22C55E]/10 px-0.5 rounded">+12%</span>
            </div>
          </div>
          <div className="bg-[#111827] border border-[#263042]/40 rounded-xl p-2 flex flex-col">
            <span className="text-[6.5px] text-gray-400 uppercase font-bold tracking-wider mb-0.5">Requirements</span>
            <span className="text-xs font-black text-white">156</span>
          </div>
          <div className="bg-[#111827] border border-[#263042]/40 rounded-xl p-2 flex flex-col">
            <span className="text-[6.5px] text-gray-400 uppercase font-bold tracking-wider mb-0.5">Compliance Score</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xs font-black text-white">92%</span>
              <span className="text-[5.5px] text-[#7C3AED] font-bold bg-[#7C3AED]/10 px-0.5 rounded">+8%</span>
            </div>
          </div>
        </div>

        {/* Chart & Activity Middle Row */}
        <div className="grid grid-cols-12 gap-3 items-stretch">
          {/* Win Probability Trend Chart */}
          <div className="col-span-8 bg-[#111827] border border-[#263042]/40 rounded-xl p-3 flex flex-col gap-2 relative">
            <span className="text-[7.5px] font-bold text-white uppercase tracking-wider">Win Probability Trend</span>
            <div className="flex-1 relative min-h-[75px] w-full flex items-end">
              {/* Y Axis */}
              <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-[5.5px] text-gray-500 text-right pr-1.5">
                <span>100%</span>
                <span>75%</span>
                <span>50%</span>
                <span>25%</span>
                <span>0%</span>
              </div>
              {/* SVG Line and Area */}
              <div className="flex-1 h-full pl-6 pr-2.5 py-1.5 relative">
                <svg className="w-full h-full" viewBox="0 0 100 50" fill="none" preserveAspectRatio="none">
                  {/* Grid Lines */}
                  <line x1="0" y1="0" x2="100" y2="0" stroke="#263042" strokeWidth="0.3" strokeDasharray="1 1" />
                  <line x1="0" y1="12.5" x2="100" y2="12.5" stroke="#263042" strokeWidth="0.3" strokeDasharray="1 1" />
                  <line x1="0" y1="25" x2="100" y2="25" stroke="#263042" strokeWidth="0.3" strokeDasharray="1 1" />
                  <line x1="0" y1="37.5" x2="100" y2="37.5" stroke="#263042" strokeWidth="0.3" strokeDasharray="1 1" />
                  <line x1="0" y1="50" x2="100" y2="50" stroke="#263042" strokeWidth="0.3" />
                  {/* Path Area Fill */}
                  <path d="M0 40 C15 35, 30 38, 45 28 C60 18, 75 16, 100 12 L100 50 L0 50 Z" fill="url(#chart-grad-mock)" />
                  {/* Path Stroke Line */}
                  <path d="M0 40 C15 35, 30 38, 45 28 C60 18, 75 16, 100 12" stroke="#4F8CFF" strokeWidth="1.2" strokeLinecap="round" />
                  {/* Nodes */}
                  <circle cx="0" cy="40" r="1.2" fill="#4F8CFF" />
                  <circle cx="22.5" cy="36" r="1.2" fill="#4F8CFF" />
                  <circle cx="45" cy="28" r="1.2" fill="#4F8CFF" />
                  <circle cx="67.5" cy="18" r="1.2" fill="#4F8CFF" />
                  <circle cx="100" cy="12" r="1.8" fill="#FFFFFF" stroke="#4F8CFF" strokeWidth="0.8" />
                  <defs>
                    <linearGradient id="chart-grad-mock" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4F8CFF" stopOpacity="0.18" />
                      <stop offset="100%" stopColor="#4F8CFF" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                </svg>
                {/* 78% Tooltip Indicator bubble */}
                <div className="absolute right-0 top-0.5 bg-[#4F8CFF] text-white text-[5.5px] font-black px-1 py-0.5 rounded shadow-[0_2px_5px_rgba(0,0,0,0.3)]">
                  78%
                </div>
              </div>
            </div>
            {/* X Axis dates */}
            <div className="flex justify-between pl-6 text-[5px] text-gray-500 tracking-wider">
              <span>May 18</span>
              <span>May 19</span>
              <span>May 20</span>
              <span>May 21</span>
              <span>May 22</span>
              <span>May 23</span>
              <span>May 24</span>
            </div>
          </div>

          {/* Recent Activity Card */}
          <div className="col-span-4 bg-[#111827] border border-[#263042]/40 rounded-xl p-3 flex flex-col gap-2 relative">
            <div className="flex justify-between items-center">
              <span className="text-[7.5px] font-bold text-white uppercase tracking-wider">Recent Activity</span>
              <ChevronRight size={8} className="text-gray-500 hover:text-white cursor-pointer" />
            </div>
            <div className="flex-1 flex flex-col justify-between py-0.5">
              <div className="flex justify-between items-center border-b border-[#263042]/20 pb-1">
                <div className="flex flex-col">
                  <span className="font-bold text-white text-[7.5px]">RFP uploaded</span>
                  <span className="text-[5.5px] text-gray-500">2 min ago</span>
                </div>
                <ChevronRight size={7} className="text-gray-600" />
              </div>
              <div className="flex justify-between items-center border-b border-[#263042]/20 pb-1">
                <div className="flex flex-col">
                  <span className="font-bold text-white text-[7.5px]">Requirements extracted</span>
                  <span className="text-[5.5px] text-gray-500">5 min ago</span>
                </div>
                <ChevronRight size={7} className="text-gray-600" />
              </div>
              <div className="flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="font-bold text-white text-[7.5px]">Compliance checked</span>
                  <span className="text-[5.5px] text-gray-500">15 min ago</span>
                </div>
                <ChevronRight size={7} className="text-gray-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Workspace Overview Table */}
        <div className="bg-[#111827] border border-[#263042]/40 rounded-xl p-3 flex flex-col gap-2">
          <span className="text-[7.5px] font-bold text-white uppercase tracking-wider">Workspace Overview</span>
          <div className="flex flex-col gap-1.5 text-[6.5px] text-gray-400">
            {/* Headers */}
            <div className="grid grid-cols-12 border-b border-[#263042]/25 pb-1 font-bold">
              <span className="col-span-5">Workspace</span>
              <span className="col-span-3">Progress</span>
              <span className="col-span-2 text-center">Win Probability</span>
              <span className="col-span-2 text-right">Status</span>
            </div>
            {/* Cloud Row */}
            <div className="grid grid-cols-12 items-center py-0.5">
              <span className="col-span-5 font-bold text-white truncate pr-1">Cloud Infrastructure RFP</span>
              <div className="col-span-3 flex items-center pr-2">
                <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#4F8CFF] to-[#7C3AED] rounded-full" style={{ width: '85%' }} />
                </div>
              </div>
              <span className="col-span-2 text-center font-bold text-white">85%</span>
              <div className="col-span-2 text-right">
                <span className="text-[5.5px] text-emerald-400 bg-emerald-500/10 px-1 py-0.5 rounded font-black uppercase">In Progress</span>
              </div>
            </div>
            {/* Digital Row */}
            <div className="grid grid-cols-12 items-center py-0.5">
              <span className="col-span-5 font-bold text-white truncate pr-1">Digital Transformation RFP</span>
              <div className="col-span-3 flex items-center pr-2">
                <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#4F8CFF] to-[#7C3AED] rounded-full" style={{ width: '72%' }} />
                </div>
              </div>
              <span className="col-span-2 text-center font-bold text-white">72%</span>
              <div className="col-span-2 text-right">
                <span className="text-[5.5px] text-emerald-400 bg-emerald-500/10 px-1 py-0.5 rounded font-black uppercase">In Progress</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LayoutDashboardMock(props: any) {
  return (
    <svg className={props.className} width={props.size} height={props.size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="7" height="9" x="3" y="3" rx="1" />
      <rect width="7" height="5" x="14" y="3" rx="1" />
      <rect width="7" height="9" x="14" y="10" rx="1" />
      <rect width="7" height="5" x="3" y="14" rx="1" />
    </svg>
  );
}

function BriefcaseMock(props: any) {
  return (
    <svg className={props.className} width={props.size} height={props.size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      <rect width="20" height="14" x="2" y="6" rx="2" />
    </svg>
  );
}

function FileTextMock(props: any) {
  return (
    <svg className={props.className} width={props.size} height={props.size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="M10 9H8" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
    </svg>
  );
}

function ShieldMock(props: any) {
  return (
    <svg className={props.className} width={props.size} height={props.size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 13c0 5-3.5 7.5-7.66 9.7a1 1 0 0 1-.68 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 .76-.97l8-2a1 1 0 0 1 .48 0l8 2A1 1 0 0 1 20 6Z" />
    </svg>
  );
}

function TargetMock(props: any) {
  return (
    <svg className={props.className} width={props.size} height={props.size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

function BarChartMock(props: any) {
  return (
    <svg className={props.className} width={props.size} height={props.size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" x2="18" y1="20" y2="10" />
      <line x1="12" x2="12" y1="20" y2="4" />
      <line x1="6" x2="6" y1="20" y2="14" />
    </svg>
  );
}

function SettingsMock(props: any) {
  return (
    <svg className={props.className} width={props.size} height={props.size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
