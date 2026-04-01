import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, Brain, Eye, Activity, MapPin, Zap, 
  CheckCircle2, Cpu, Smartphone, Users, Heart, ArrowRight,
  Database, Radio, Terminal
} from 'lucide-react';
import Footer from '../components/Footer';

export default function Landing() {
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6 }
  };

  const stagger = {
    initial: { opacity: 0 },
    whileInView: { opacity: 1 },
    viewport: { once: true },
    transition: { staggerChildren: 0.1 }
  };

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-primary-500 selection:text-white font-sans text-slate-900 overflow-hidden relative">
      <Navbar />

      {/* Floating HUD Side Elements */}
      <div className="fixed left-8 top-1/2 -translate-y-1/2 hidden xl:flex flex-col space-y-12 z-50 pointer-events-none opacity-20 group-hover:opacity-100 transition-opacity">
         <div className="flex flex-col items-center space-y-4">
            <div className="h-0.5 w-12 bg-slate-950"></div>
            <span className="text-[9px] font-black uppercase tracking-[0.5em] rotate-180 [writing-mode:vertical-lr]">System Monitoring</span>
         </div>
         <div className="flex flex-col items-center space-y-2 text-[8px] font-bold text-slate-400">
            <span>CORE_SYNC: ACTIVE</span>
            <span>NODE: 0X42F</span>
         </div>
      </div>

      <div className="fixed right-8 top-1/2 -translate-y-1/2 hidden xl:flex flex-col space-y-12 z-50 pointer-events-none opacity-20">
         <div className="flex flex-col items-center space-y-4">
            <span className="text-[9px] font-black uppercase tracking-[0.5em] [writing-mode:vertical-lr]">Security Protocol v1.1.0</span>
            <div className="h-0.5 w-12 bg-slate-950"></div>
         </div>
         <div className="flex flex-col items-center space-y-2 text-[8px] font-bold text-slate-400">
            <span>COORD: 18.23 N / 72.54 E</span>
            <span>UPTIME: 99.98%</span>
         </div>
      </div>
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 z-0 bg-grid-slate-900/[0.03] bg-[size:50px_50px]"></div>
        
        {/* Background Gradient Orbs */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-full h-[600px] pointer-events-none select-none overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-radial from-primary-400/10 to-transparent blur-3xl opacity-50 rounded-full animate-float"></div>
        </div>
        
        <div className="relative z-10 grid lg:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="text-left"
          >
            <div className="inline-flex items-center space-x-3 bg-white border border-slate-100 px-4 py-2 rounded-2xl mb-10 shadow-xl shadow-slate-900/5 group hover:scale-105 transition-transform duration-500 cursor-default">
              <div className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Neural Link: Established</span>
            </div>

            <h1 className="text-6xl md:text-8xl font-black font-outfit text-slate-950 tracking-tighter leading-[0.85] mb-10">
              SAFETY <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 via-primary-500 to-indigo-600">EVOLVED.</span>
            </h1>
            
            <p className="mt-6 text-xl text-slate-500 mb-12 max-w-lg leading-relaxed font-medium">
               Integrated YOLOv8 vision intelligence with hardware-level engine interlocks for absolute rider protection.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <Link to="/register" className="group w-full sm:w-auto px-12 py-6 bg-slate-950 text-white font-black uppercase tracking-widest text-[11px] rounded-2xl hover:bg-primary-600 transition-all shadow-2xl shadow-slate-900/40 flex items-center justify-center relative overflow-hidden active:scale-95">
                <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <span className="relative z-10">Engage Protocol</span>
                <Zap className="relative z-10 ml-3 h-4 w-4 group-hover:rotate-12 transition-transform" />
              </Link>
              <Link to="/login" className="w-full sm:w-auto px-12 py-6 bg-white text-slate-950 font-black uppercase tracking-widest text-[11px] rounded-2xl border border-slate-200 hover:border-slate-400 transition-all shadow-lg flex items-center justify-center active:scale-95">
                Operator Key
              </Link>
            </div>

            <div className="mt-16 flex items-center space-x-8 opacity-40 grayscale group-hover:grayscale-0 transition-all">
               <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest leading-none mb-2">Sync API</span>
                  <Database className="h-5 w-5" />
               </div>
               <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest leading-none mb-2">Hardware</span>
                  <Radio className="h-5 w-5" />
               </div>
               <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest leading-none mb-2">Neural Loop</span>
                  <Terminal className="h-5 w-5" />
               </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, type: 'spring' }}
            className="relative"
          >
            <div className="relative z-10 w-full overflow-hidden rounded-[4rem] shadow-[0_80px_160px_-40px_rgba(0,0,0,0.3)] border-[12px] border-white group perspective-1000">
               {/* Scrolled HUD elements on top of image */}
               <div className="absolute top-10 left-10 z-20 flex flex-col space-y-2 pointer-events-none">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: 100 }}
                    transition={{ delay: 1, duration: 1 }}
                    className="h-0.5 bg-emerald-500 rounded-full"
                  />
                  <div className="text-[9px] font-black text-emerald-500 uppercase tracking-widest opacity-80">Telemetry_Active</div>
               </div>
               <div className="absolute bottom-10 right-10 z-20 pointer-events-none bg-black/60 backdrop-blur-md px-6 py-4 rounded-3xl border border-white/10 text-white flex flex-col items-end">
                  <span className="text-[8px] font-black uppercase tracking-[0.4em] opacity-40 mb-1">Impact Detection</span>
                  <span className="text-xl font-bold font-outfit leading-none tracking-tighter text-emerald-400">READY</span>
               </div>
              <img 
                src="/images/hero.png" 
                alt="Smart AI Helmet" 
                className="w-full h-auto transform group-hover:scale-110 transition-transform duration-1000" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-40 group-hover:opacity-20 transition-opacity"></div>
            </div>
            
            {/* Background elements */}
            <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-primary-500/10 blur-[120px] rounded-full animate-float"></div>
            <div className="absolute -top-20 -left-20 w-80 h-80 bg-indigo-500/10 blur-[120px] rounded-full animate-float" style={{ animationDelay: '1s' }}></div>
          </motion.div>
        </div>
      </section>

      {/* Safety Visual Section */}
      <section className="py-20 bg-slate-900 overflow-hidden relative border-y border-white/5">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
             <motion.div {...fadeInUp} className="order-2 lg:order-1">
                <div className="rounded-[3rem] overflow-hidden border-4 border-white/10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] group relative">
                   <img src="/images/ai_scan.png" alt="AI Safety Scan" className="w-full h-auto group-hover:scale-105 transition-transform duration-700" />
                   <div className="absolute inset-0 bg-gradient-to-tr from-primary-600/20 to-transparent"></div>
                   {/* Scanning animation element */}
                   <div className="absolute top-0 left-0 w-full h-1 bg-primary-500/50 shadow-[0_0_15px_rgba(59,130,246,0.5)] animate-scan z-20"></div>
                </div>
             </motion.div>
             <div className="order-1 lg:order-2 space-y-8">
                <h2 className="text-4xl md:text-5xl font-black font-outfit text-white tracking-tighter uppercase leading-none">
                  BIOMETRIC <span className="text-primary-500">DEFENSE.</span>
                </h2>
                <p className="text-slate-400 text-lg font-medium leading-relaxed max-w-lg">
                   Our neural engine monitors every ride, identifying safe behavior and locking out unauthorized or impaired users in real-time.
                </p>
                <div className="grid grid-cols-2 gap-8 pt-8 border-t border-white/5">
                   <div className="space-y-2">
                      <span className="text-3xl font-black text-white font-outfit tracking-tighter">99.8%</span>
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">AI ACCURACY</span>
                   </div>
                   <div className="space-y-2">
                      <span className="text-3xl font-black text-white font-outfit tracking-tighter">&lt; 5MS</span>
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">LATENCY RESPONSE</span>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section id="features" className="py-32 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div {...fadeInUp} className="text-center mb-24 max-w-3xl mx-auto">
             <div className="h-1.5 w-12 bg-primary-500 rounded-full mx-auto mb-10"></div>
             <h3 className="text-5xl md:text-6xl font-black font-outfit text-slate-950 tracking-tighter leading-none mb-8 uppercase">The Safety Loop.</h3>
             <p className="text-slate-400 text-lg font-medium leading-relaxed">
                Experience a ecosystem where hardware and artificial intelligence coexist to eliminate human error.
             </p>
          </motion.div>

          <motion.div 
            variants={stagger}
            initial="initial"
            whileInView="whileInView"
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-12"
          >
            {[
              { title: 'Neural Vision', subtitle: 'Helmet Recognition', desc: 'Custom YOLOv8 weights identify helmet strap security with 99.8% precision.', icon: Brain, color: 'text-primary-600', bg: 'bg-primary-50/50' },
              { title: 'Focus Guard', subtitle: 'Drowsiness Matrix', desc: 'Predictive EAR tracking detects micro-lapses in concentration in under 5ms.', icon: Activity, color: 'text-indigo-600', bg: 'bg-indigo-50/50' },
              { title: 'Breath Shield', subtitle: 'Interlock Logic', desc: 'Integrated MQ-3 sensors lock the starter relay if alcohol thresholds are breached.', icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50/50' },
            ].map((feature, idx) => (
               <motion.div 
                key={idx} 
                variants={fadeInUp}
                className="group p-12 rounded-[3.5rem] bg-white border border-slate-100 hover:shadow-[0_60px_120px_-30px_rgba(0,0,0,0.1)] transition-all duration-700 relative overflow-hidden"
              >
                  <div className={`h-20 w-20 rounded-[2.5rem] flex items-center justify-center mb-10 shadow-xl shadow-slate-900/5 ${feature.bg} group-hover:scale-110 transition-transform duration-500 relative overflow-hidden`}>
                     <feature.icon className={`h-8 w-8 relative z-10 ${feature.color}`} />
                  </div>
                  <div className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mb-2">{feature.title}</div>
                  <h4 className="text-3xl font-black mb-6 text-slate-950 tracking-tighter font-outfit uppercase leading-none">{feature.subtitle}</h4>
                  <p className="text-slate-500 leading-relaxed font-medium text-[15px]">{feature.desc}</p>
                  
                  {/* Decorative number hint */}
                  <div className="absolute top-12 right-12 text-6xl font-black text-slate-50 pointer-events-none select-none group-hover:text-slate-100/50 transition-colors">
                     0{idx + 1}
                  </div>
               </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
