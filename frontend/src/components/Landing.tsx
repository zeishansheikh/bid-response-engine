import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, FileText, CheckCircle, BarChart3, Users, Zap } from 'lucide-react';
import { AppView } from '../types';

export function Landing({ onNavigate }: { onNavigate: (view: AppView) => void }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background selection:bg-primary-container/30">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary-container/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-secondary-container/20 blur-[120px]" />
        <div className="absolute top-[40%] left-[60%] w-[20%] h-[20%] rounded-full bg-tertiary/10 blur-[100px]" />
      </div>
      
      {/* Grid Pattern */}
      <div 
        className="absolute inset-0 z-0 opacity-[0.03]"
        style={{ backgroundImage: 'linear-gradient(var(--color-outline) 1px, transparent 1px), linear-gradient(90deg, var(--color-outline) 1px, transparent 1px)', backgroundSize: '40px 40px' }}
      />

      <nav className="relative z-20 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-container text-on-primary flex items-center justify-center font-bold text-xl shadow-[0_0_20px_rgba(77,142,255,0.3)]">
            A
          </div>
          <span className="font-semibold text-xl tracking-tight text-on-surface">GovProp.ai</span>
        </div>
        <div className="flex items-center gap-6 text-sm font-medium">
          <a href="#" className="text-on-surface-variant hover:text-on-surface transition-colors">Product</a>
          <a href="#" className="text-on-surface-variant hover:text-on-surface transition-colors">Solutions</a>
          <a href="#" className="text-on-surface-variant hover:text-on-surface transition-colors">Pricing</a>
          <button 
            onClick={() => onNavigate('dashboard')}
            className="px-5 py-2.5 rounded-lg bg-surface-container-high border border-outline-variant hover:border-outline text-on-surface transition-all hover:bg-surface-container-highest"
          >
            Sign In
          </button>
          <button 
            onClick={() => onNavigate('dashboard')}
            className="px-5 py-2.5 rounded-lg bg-primary-container text-on-primary hover:brightness-110 transition-all font-semibold shadow-[0_0_20px_rgba(77,142,255,0.2)]"
          >
            Get Started
          </button>
        </div>
      </nav>

      <main className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-100px)] px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container border border-outline-variant text-xs font-medium text-primary mb-8"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          Introducing Next-Gen RFP Intelligence
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-5xl md:text-7xl font-bold tracking-tight text-on-surface max-w-4xl leading-[1.1]"
        >
          Win more government contracts with <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-container to-secondary-container">AI-powered precision.</span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-6 text-xl text-on-surface-variant max-w-2xl"
        >
          Automate compliance matrices, analyze RFPs in seconds, and generate winning proposals with your organization's custom knowledge base.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-10 flex flex-col sm:flex-row gap-4"
        >
          <button 
            onClick={() => onNavigate('dashboard')}
            className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-primary-container text-on-primary font-semibold text-lg hover:brightness-110 transition-all shadow-[0_0_30px_rgba(77,142,255,0.3)] group"
          >
            Enter Platform
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
          <button className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-surface-container border border-outline-variant text-on-surface font-semibold text-lg hover:bg-surface-container-high transition-all">
            Book Demo
          </button>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full"
        >
          <FeatureCard 
            icon={<CheckCircle className="text-green-400" size={24} />}
            title="Automated Compliance"
            description="Extract requirements instantly and generate traceability matrices with 99.9% accuracy."
          />
          <FeatureCard 
            icon={<Zap className="text-yellow-400" size={24} />}
            title="Accelerated Writing"
            description="Draft narrative sections using past winning proposals and tailored AI generation."
          />
          <FeatureCard 
            icon={<BarChart3 className="text-primary-container" size={24} />}
            title="Win Probability Scoring"
            description="Data-driven insights to evaluate PWin before investing resources into a bid."
          />
        </motion.div>
      </main>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="glass-panel p-6 rounded-2xl flex flex-col items-start text-left hover:border-outline transition-colors group">
      <div className="w-12 h-12 rounded-xl bg-surface-container-high border border-outline-variant flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-on-surface mb-2">{title}</h3>
      <p className="text-on-surface-variant text-sm leading-relaxed">{description}</p>
    </div>
  );
}
