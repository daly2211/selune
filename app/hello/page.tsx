"use client";

import Link from "next/link";
import Image from "next/image";
import { ChevronRight, Zap, Bot, Layers, CheckCircle2, CircleDashed, Inbox, FileText, CheckSquare, Activity, Briefcase, Folder, Star, MessageSquare, Clock, Terminal, ArrowUpCircle } from "lucide-react";
import { motion, useScroll, useTransform, type Variants } from "framer-motion";

const FADE_UP_ANIMATION_VARIANTS: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { type: "spring", duration: 0.8 } },
};

export default function Landing() {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, -50]);

  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    e.preventDefault();
    const href = e.currentTarget.href;
    const targetId = href.replace(/.*\#/, "");
    const elem = document.getElementById(targetId);
    elem?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-bg-base text-text-primary flex flex-col font-sans selection:bg-accent-blue-muted selection:text-white overflow-hidden">
      {/* Header */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between px-6 py-4 border-b border-border-subtle bg-bg-base/80 backdrop-blur-md sticky top-0 z-50"
      >
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="Selune Logo" width={20} height={20} className="rounded-sm" />
          <span className="font-semibold text-[14px] tracking-wide">Selune</span>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-[13px] font-medium text-text-secondary">
          <a href="#features" onClick={handleScroll} className="hover:text-text-primary transition-theme cursor-pointer">Platform</a>
          <a href="#agent-bob" onClick={handleScroll} className="hover:text-text-primary transition-theme cursor-pointer">Meet bob</a>
          <a href="#manifesto" onClick={handleScroll} className="hover:text-text-primary transition-theme cursor-pointer">Manifesto</a>
        </nav>
        <div className="flex items-center gap-5">
          <Link href="/" className="bg-text-primary text-bg-base px-3.5 py-1.5 rounded-full text-[13px] font-medium hover:bg-text-secondary transition-theme">
            Go to App
          </Link>
        </div>
      </motion.header>

      <main className="flex-1 flex flex-col items-center text-center px-6 pt-20 pb-24 max-w-6xl mx-auto w-full">
        {/* Hero Section */}
        <motion.div 
          initial="hidden"
          animate="show"
          viewport={{ once: true }}
          variants={{
            hidden: {},
            show: {
              transition: {
                staggerChildren: 0.15,
              },
            },
          }}
          className="flex flex-col items-center"
        >
          <motion.div variants={FADE_UP_ANIMATION_VARIANTS} className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border-strong bg-bg-secondary/50 mb-8 hover:bg-bg-hover transition-theme cursor-pointer text-[13px]">
            <span className="w-2 h-2 rounded-full bg-text-primary shadow-[0_0_8px_rgba(255,255,255,0.8)] animate-pulse" />
            <span className="text-text-secondary font-medium tracking-wide">Your AI teammate is ready</span>
            <ChevronRight className="w-3.5 h-3.5 text-text-tertiary" />
          </motion.div>

          <motion.h1 variants={FADE_UP_ANIMATION_VARIANTS} className="text-5xl md:text-7xl font-bold tracking-tighter mb-6 leading-[1.05] text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70">
            Dev orchestration, <br className="hidden md:block" /> automated by AI.
          </motion.h1>
          
          <motion.p variants={FADE_UP_ANIMATION_VARIANTS} className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
            Manage your PRs and tasks in a beautiful UI. Send them to <span className="text-text-primary font-semibold">bob</span>. <br className="hidden md:block" /> He codes, tests, and pushes while you orchestrate.
          </motion.p>

          <motion.div variants={FADE_UP_ANIMATION_VARIANTS} className="flex flex-col sm:flex-row items-center gap-4 justify-center">
            <Link href="/" className="bg-text-primary text-bg-base px-6 py-3 rounded-full text-[15px] font-medium hover:bg-text-secondary transition-theme flex items-center gap-2 group">
              Start orchestrating <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </motion.div>

        {/* Animated Mockup UI - Actual Selune UI */}
        <motion.div 
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1, type: "spring", stiffness: 40 }}
          style={{ y }}
          className="mt-24 w-full relative group perspective-1000"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-bg-base via-bg-base/80 to-transparent z-10 pointer-events-none h-full w-full bottom-0" />
          
          <div className="w-full aspect-[16/11] md:aspect-[21/11] rounded-xl border border-border-strong bg-[#0a0b0d] shadow-[0_30px_100px_-20px_rgba(0,0,0,0.8)] overflow-hidden relative flex text-left ring-1 ring-white/5">
            
            {/* Sidebar (from Image 1) */}
            <div className="w-[200px] bg-[#0a0b0d] border-r border-border-default h-full hidden md:flex flex-col pt-4 pb-4 select-none shrink-0">
              <div className="px-4 flex items-center gap-2 mb-8 text-text-primary">
                <Image src="/logo.png" alt="Selune Logo" width={16} height={16} className="rounded-sm opacity-80" />
                <span className="font-semibold text-[13px]">Selune</span>
              </div>
              
              <div className="px-4 text-[10px] font-bold text-text-tertiary mb-3 tracking-wider">WORKSPACE</div>
              <div className="px-2 mb-6">
                <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-[#16181d] border border-border-default text-text-primary text-[12px] font-medium">
                  <Folder className="w-3.5 h-3.5 text-text-secondary" /> bobby
                </div>
              </div>
              
              <div className="px-4">
                <div className="flex items-center gap-2 text-text-tertiary text-[12px] hover:text-text-primary transition-colors cursor-pointer font-medium">
                  <span className="text-[14px] leading-none">+</span> New board
                </div>
              </div>

              <div className="mt-auto px-4 flex items-center gap-2 text-text-tertiary text-[11px] font-medium">
                <div className="px-1.5 py-0.5 rounded border border-border-strong bg-bg-tertiary shadow-sm">⌘ K</div> Command
              </div>
            </div>

            {/* Main Content (Board + Panel) */}
            <div className="flex-1 bg-[#0d0e11] h-full flex flex-col relative overflow-hidden">
              {/* Top Bar */}
              <div className="h-12 border-b border-border-default flex items-center px-4 gap-4 shrink-0 bg-[#0a0b0d]">
                <div className="text-[12px] text-text-primary font-medium flex items-center gap-2">
                  bobby <span className="text-text-tertiary font-mono text-[10px]">C:\Users\ELITE\Desktop\projects\...</span>
                </div>
                <div className="ml-auto flex items-center gap-3">
                  <div className="bg-[#121419] border border-border-default rounded px-3 py-1.5 text-[11px] text-text-tertiary w-32 flex items-center">
                    Search cards...
                  </div>
                </div>
              </div>

              {/* Board Area */}
              <div className="flex-1 flex gap-4 p-5 overflow-hidden relative">
                {/* Lane: Backlog */}
                <div className="w-[200px] flex flex-col gap-3 shrink-0 opacity-40">
                  <div className="text-[11px] font-medium text-text-secondary flex justify-between items-center px-1 uppercase tracking-wide">
                    <span>Backlog</span>
                    <span className="text-text-tertiary">1</span>
                  </div>
                  <div className="bg-[#16181d] border border-border-default rounded p-3">
                    <div className="text-[12px] text-text-primary mb-3 leading-tight">Setup basic routing</div>
                    <div className="text-[10px] text-text-tertiary flex items-center gap-1">
                      <ArrowUpCircle className="w-3 h-3 text-accent-amber" /> May 15
                    </div>
                  </div>
                </div>

                {/* Lane: Doing */}
                <div className="w-[200px] flex flex-col gap-3 shrink-0">
                  <div className="text-[11px] font-medium text-text-primary flex justify-between items-center px-1 uppercase tracking-wide">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent-blue" /> Doing
                    </span>
                    <span className="text-text-tertiary">1</span>
                  </div>
                  {/* Floating active card */}
                  <motion.div 
                    animate={{ y: [0, -2, 0] }}
                    transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                    className="bg-[#1a1d24] border border-accent-blue/30 shadow-[0_0_20px_rgba(94,106,210,0.1)] rounded p-3 relative z-10"
                  >
                    <div className="text-[12px] text-text-primary mb-3 leading-tight">Implement Auth Webhook</div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 bg-accent-blue/10 px-1.5 py-0.5 rounded">
                        <Bot className="w-3 h-3 text-accent-blue" />
                        <span className="text-[10px] text-accent-blue font-medium">Working</span>
                      </div>
                      <span className="w-2 h-2 rounded-full bg-accent-blue animate-pulse" />
                    </div>
                  </motion.div>
                </div>
                
                {/* Slide-over Issue Panel (from Image 2) */}
                <motion.div 
                  initial={{ x: "100%" }}
                  whileInView={{ x: 0 }}
                  transition={{ type: "spring", stiffness: 45, damping: 15, delay: 0.3 }}
                  viewport={{ once: true }}
                  className="absolute right-0 top-0 bottom-0 w-[420px] lg:w-[500px] bg-[#0a0b0d] border-l border-border-strong shadow-[0_0_50px_rgba(0,0,0,0.8)] flex z-20"
                >
                  {/* Left part of panel: Edit & Activity */}
                  <div className="flex-1 border-r border-border-default flex flex-col h-full overflow-hidden">
                    <div className="h-12 border-b border-border-default flex items-center px-5 justify-between shrink-0">
                      <span className="text-[11px] text-text-secondary font-medium uppercase tracking-wide">Doing</span>
                      <div className="flex items-center gap-3 text-text-tertiary">
                        <Layers className="w-3.5 h-3.5" />
                        <span className="text-[16px] leading-none mb-1">×</span>
                      </div>
                    </div>
                    
                    <div className="p-5 flex-1 overflow-hidden flex flex-col">
                      <h2 className="text-xl font-bold text-text-primary mb-6">Implement Auth Webhook</h2>
                      
                      {/* WYSIWYG Editor Mock */}
                      <div className="border border-border-default rounded bg-[#0d0e11] flex flex-col mb-8 shrink-0">
                        <div className="h-10 border-b border-border-default flex items-center px-4 gap-4 text-text-tertiary">
                          <span className="font-serif font-bold text-[13px] text-text-secondary">B</span>
                          <span className="font-serif italic text-[13px]">I</span>
                          <span className="font-bold text-[13px] line-through">S</span>
                        </div>
                        <div className="h-20 p-4 text-[13px] text-text-secondary">
                          Add authentication webhook to handle state sync with external DB.
                        </div>
                        <div className="h-12 border-t border-border-default flex items-center justify-end px-4 gap-3 bg-[#121419]">
                          <span className="text-[12px] text-text-tertiary hover:text-text-primary cursor-pointer">Close</span>
                          <span className="bg-accent-blue hover:bg-accent-blue-muted text-white px-4 py-1.5 rounded text-[12px] font-medium cursor-pointer transition-colors">Save</span>
                        </div>
                      </div>

                      {/* Activity */}
                      <div className="flex items-center gap-2 text-[12px] font-bold text-text-primary mb-5 shrink-0 uppercase tracking-wide">
                        <MessageSquare className="w-3.5 h-3.5" /> Activity
                      </div>
                      
                      <div className="flex-1 overflow-hidden flex flex-col gap-6 pl-1">
                        <div className="flex gap-4">
                          <div className="w-6 h-6 rounded-full bg-[#16181d] border border-border-default flex items-center justify-center shrink-0">
                            <Clock className="w-3 h-3 text-text-secondary" />
                          </div>
                          <div>
                            <div className="text-[12px]"><span className="font-medium text-text-primary">moved</span> <span className="text-text-tertiary">· to "Doing"</span></div>
                            <div className="text-[10px] text-text-tertiary mt-1">May 17, 14:14</div>
                          </div>
                        </div>
                        
                        <div className="flex gap-4 relative">
                          <div className="absolute top-6 left-3 w-[1px] h-[120%] bg-border-default -ml-[0.5px]" />
                          <div className="w-6 h-6 rounded-full bg-[#16181d] border border-accent-blue flex items-center justify-center shrink-0 z-10">
                            <Bot className="w-3 h-3 text-accent-blue" />
                          </div>
                          <div className="bg-[#121419] border border-border-default rounded-md p-3 text-[12px] text-text-secondary w-full">
                            <div className="text-text-primary font-medium mb-1.5">Agent compiling...</div>
                            Writing logic for webhook signature verification. 
                            <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1 h-3 bg-text-primary inline-block ml-1 align-middle" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right part of panel: Meta */}
                  <div className="w-[180px] bg-[#0a0b0d] p-5 flex flex-col gap-8 shrink-0">
                    <div>
                      <div className="text-[10px] text-text-tertiary font-bold mb-3 tracking-wider">STATUS</div>
                      <div className="flex items-center gap-2 text-[12px] text-text-primary font-medium">
                        <span className="w-2 h-2 rounded-full bg-accent-blue" /> Doing
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-[10px] text-text-tertiary font-bold mb-3 tracking-wider">AGENT</div>
                      <div className="flex gap-2 text-[11px] text-text-secondary leading-relaxed bg-[#16181d] p-2 rounded border border-border-default">
                        <CheckSquare className="w-3.5 h-3.5 text-accent-blue shrink-0 mt-0.5" />
                        Push changes to a new branch on remote
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] text-text-tertiary font-bold mb-3 tracking-wider">PRIORITY</div>
                      <div className="bg-[#16181d] border border-border-default rounded px-2.5 py-1.5 flex items-center gap-2 text-[12px] text-text-primary font-medium w-fit">
                        <ArrowUpCircle className="w-3.5 h-3.5 text-accent-amber" /> Urgent
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] text-text-tertiary font-bold mb-3 tracking-wider">LABEL</div>
                      <div className="flex gap-1.5">
                        <div className="w-4 h-4 rounded bg-[#16181d] border border-border-default" />
                        <div className="w-4 h-4 rounded bg-accent-blue" />
                        <div className="w-4 h-4 rounded bg-accent-red" />
                        <div className="w-4 h-4 rounded bg-accent-amber" />
                        <div className="w-4 h-4 rounded bg-accent-green" />
                        <div className="w-4 h-4 rounded bg-text-primary" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Features / Explanation */}
        <div id="features" className="mt-40 w-full text-left">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-text-primary">You orchestrate. Bob builds.</h2>
            <p className="text-text-secondary text-lg max-w-2xl">
              Selune replaces disjointed scripts and terminals with a unified UI. Create tasks, set parameters, and assign them to your local AI.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="p-6 rounded-2xl border border-border-default bg-bg-secondary/30"
            >
              <div className="w-10 h-10 rounded-lg bg-bg-elevated border border-border-strong flex items-center justify-center mb-6">
                <Layers className="w-5 h-5 text-text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-text-primary">Manage Tasks & PRs</h3>
              <p className="text-text-secondary text-[14px] leading-relaxed">
                A blazing-fast UI to queue up features, bugs, and PRs. Keep your workflow organized before handing it off to the agent.
              </p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="p-6 rounded-2xl border border-border-default bg-bg-secondary/30"
            >
              <div className="w-10 h-10 rounded-lg bg-bg-elevated border border-border-strong flex items-center justify-center mb-6">
                <Zap className="w-5 h-5 text-text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-text-primary">Automate Execution</h3>
              <p className="text-text-secondary text-[14px] leading-relaxed">
                Agent bob automatically claims tasks from the backlog, executes them in your local terminal, and pushes the code.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="p-6 rounded-2xl border border-border-default bg-bg-secondary/30"
            >
              <div className="w-10 h-10 rounded-lg bg-bg-elevated border border-border-strong flex items-center justify-center mb-6">
                <Bot className="w-5 h-5 text-text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-text-primary">Full Transparency</h3>
              <p className="text-text-secondary text-[14px] leading-relaxed">
                Watch bob's logs stream directly into the UI. See exactly what files are being modified and tests being run in real-time.
              </p>
            </motion.div>
          </div>
        </div>

        {/* Deep dive into Agent Bob */}
        <div id="agent-bob" className="mt-32 w-full text-left py-16 border-t border-border-subtle flex flex-col md:flex-row gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex-1"
          >
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-text-primary">Meet bob, your 10x developer.</h2>
            <p className="text-text-secondary text-lg mb-6 leading-relaxed">
              Selune is the interface. <code className="bg-bg-tertiary px-1.5 py-0.5 rounded text-[14px] border border-border-default text-text-primary">bob</code> is the engine. It runs locally alongside your codebase, continuously polling the board for tasks in the <strong>Todo</strong> lane.
            </p>
            <ul className="space-y-4 mb-8">
              <li className="flex gap-3 text-[15px] text-text-secondary">
                <div className="mt-1 w-1.5 h-1.5 rounded-full bg-text-primary shrink-0" />
                <span><strong>Claims tasks autonomously:</strong> When a task is ready, bob picks it up and moves it to "Doing".</span>
              </li>
              <li className="flex gap-3 text-[15px] text-text-secondary">
                <div className="mt-1 w-1.5 h-1.5 rounded-full bg-text-primary shrink-0" />
                <span><strong>Executes and iterates:</strong> Using its own terminal, bob writes code, tests, and modifies your codebase.</span>
              </li>
              <li className="flex gap-3 text-[15px] text-text-secondary">
                <div className="mt-1 w-1.5 h-1.5 rounded-full bg-text-primary shrink-0" />
                <span><strong>Reports back seamlessly:</strong> Once done, it attaches execution logs to the card and moves it to "Review".</span>
              </li>
            </ul>
            <Link href="/" className="inline-flex items-center gap-2 text-text-primary hover:text-text-secondary font-medium transition-theme">
              See it in action <ChevronRight className="w-4 h-4" />
            </Link>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex-1 w-full bg-[#0a0b0d] border border-border-default rounded-xl p-6 shadow-2xl"
          >
            <div className="font-mono text-[13px] text-text-secondary space-y-3">
              <div className="flex gap-2">
                <span className="text-accent-green">➜</span>
                <span className="text-text-primary">bob</span> claim-task
              </div>
              <div className="text-text-tertiary">Found task: "Implement authentication flow"</div>
              <div className="text-text-tertiary">Moving card #142 to "Doing"</div>
              <div className="flex gap-2 mt-4">
                <span className="text-accent-green">➜</span>
                <span className="text-text-primary">bob</span> work
              </div>
              <motion.div 
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="text-text-tertiary"
              >
                Writing code...
              </motion.div>
              <div className="text-text-tertiary mt-4">Tests passed. Submitting logs...</div>
              <div className="text-text-primary">Task moved to "Review"</div>
            </div>
          </motion.div>
        </div>

      </main>

      <footer className="border-t border-border-subtle py-8 text-center bg-bg-primary">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="Selune Logo" width={16} height={16} className="rounded-sm opacity-50" />
            <span className="font-semibold text-[13px] text-text-secondary">Selune</span>
          </div>
          <div className="flex gap-6 text-[13px] text-text-tertiary">
            <Link href="#" className="hover:text-text-primary transition-theme">Twitter</Link>
            <Link href="#" className="hover:text-text-primary transition-theme">GitHub</Link>
            <Link href="#" className="hover:text-text-primary transition-theme">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
