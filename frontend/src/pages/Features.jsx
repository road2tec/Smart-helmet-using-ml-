import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { 
  ShieldCheck, Brain, Eye, Activity, MapPin, Zap, 
  Cpu, Smartphone, Lock, Search, Wind, BarChart3
} from 'lucide-react';

export default function Features() {
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6 }
  };

  const features = [
    { title: 'YOLO Vision Engine', subtitle: '99.8% Precision', icon: Brain, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { title: 'Biometric Locking', subtitle: 'Face ID Integration', icon: Lock, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
    { title: 'Predictive EAR', subtitle: 'Drowsiness Logic', icon: Activity, color: 'text-violet-500', bg: 'bg-violet-500/10' },
    { title: 'Vibration Analysis', subtitle: 'G-Force Tracking', icon: Wind, color: 'text-rose-500', bg: 'bg-rose-500/10' },
    { title: 'GPS Persistence', subtitle: 'Neo-6M Optimized', icon: MapPin, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { title: 'Cloud Telemetry', subtitle: '2ms Latency Sync', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { title: 'Alcohol Shield', subtitle: 'MQ-3 Integrated', icon: ShieldCheck, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
    { title: 'Traffic Core', subtitle: 'Object Recognition', icon: Search, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { title: 'Adaptive HUD', subtitle: 'Real-time UI Overlays', icon: Smartphone, color: 'text-pink-500', bg: 'bg-pink-500/10' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-primary-500 selection:text-white">
      <Navbar />
      
      {/* Header */}
      <section className="pt-32 pb-20 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-primary-600/10 blur-[150px]"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
           <motion.div {...fadeInUp}>
              <h2 className="text-[12px] font-black uppercase tracking-[0.4em] text-primary-500 mb-4">Precision Ecosystem</h2>
              <h1 className="text-6xl md:text-8xl font-black font-outfit tracking-tighter leading-none mb-8">
                ADVANCED <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-indigo-500">CAPABILITIES.</span>
              </h1>
              <p className="text-slate-400 text-xl font-medium max-w-2xl mx-auto opacity-70">
                 Explore the unified layer of artificial intelligence and hardware sensors designed for absolute protection.
              </p>
           </motion.div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
         <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="bg-white p-10 rounded-[2.5rem] border border-slate-100 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] transition-all hover:translate-y-[-5px] group"
              >
                 <div className={`h-16 w-16 rounded-2xl flex items-center justify-center mb-8 shadow-xl ${f.bg} group-hover:scale-110 transition-transform duration-500`}>
                    <f.icon className={`h-8 w-8 ${f.color}`} />
                 </div>
                 <div className="text-[10px] font-black uppercase tracking-widest text-primary-500 mb-2">{f.subtitle}</div>
                 <h3 className="text-2xl font-bold font-outfit text-slate-950 mb-4 tracking-tight">{f.title}</h3>
                 <div className="h-1 w-8 bg-slate-200 rounded-full group-hover:w-full group-hover:bg-primary-500 transition-all duration-700"></div>
              </motion.div>
            ))}
         </div>
      </section>
      
      <Footer />
    </div>
  );
}
