import { motion } from 'framer-motion';
import Footer from '../components/Footer';
import Navbar from '../components/Navbar';
import { 
  ShieldCheck, Brain, Eye, Activity, MapPin, Zap, 
  Cpu, Smartphone, Terminal, Network, Radio, HardDrive
} from 'lucide-react';

export default function Technology() {
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6 }
  };

  const techStack = [
    { title: 'YOLOv8 Logic', icon: Brain, desc: 'Object detection backend specialized in helmet and traffic safety identification.', category: 'AI LAYER' },
    { title: 'OpenCV Hub', icon: Eye, desc: 'Computer Vision library used for real-time facial analysis and age grouping.', category: 'CV LAYER' },
    { title: 'Flask Engine', icon: Terminal, desc: 'High-performance Python backend managing secure API routes and telemetry.', category: 'API LAYER' },
    { title: 'React Core', icon: Smartphone, desc: 'Advanced frontend framework for sub-millisecond telemetry visualization.', category: 'UI LAYER' },
    { title: 'MongoDB Persistence', icon: HardDrive, desc: 'Flexible, high-scale database for rider logs and emergency system records.', category: 'DATA LAYER' },
    { title: 'Neo-6M GPS', icon: MapPin, desc: 'Satellite-grade global positioning system for automated crash dispatch logic.', category: 'HW LAYER' },
    { title: 'MPU-6050 IMU', icon: Activity, desc: '6-axis accelerometer/gyroscope for precise collision and impact detection.', category: 'HW LAYER' },
    { title: 'MQ-3 Sensor', icon: Radio, desc: 'Breathalyser sensor array for impaired riding prevention protocols.', category: 'HW LAYER' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-primary-500 selection:text-white">
      <Navbar />
      
      {/* Header */}
      <section className="pt-32 pb-20 relative">
        <div className="absolute top-0 right-1/2 -translate-x-1/2 w-full h-[500px] bg-indigo-600/10 blur-[150px]"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
           <motion.div {...fadeInUp}>
              <h2 className="text-[12px] font-black uppercase tracking-[0.4em] text-indigo-500 mb-4">Neural Infrastructure</h2>
              <h1 className="text-6xl md:text-8xl font-black font-outfit tracking-tighter leading-none mb-8">
                THE TECH <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-primary-500">ENGINE.</span>
              </h1>
              <p className="text-slate-400 text-xl font-medium max-w-2xl mx-auto opacity-70">
                 A unified vertical stack of artificial intelligence, high-performance hardware, and real-time cloud data.
              </p>
           </motion.div>
        </div>
      </section>

      {/* Tech Grid */}
      <section className="pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10">
         <div className="grid md:grid-cols-2 gap-8">
            {techStack.map((tech, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="group relative p-12 rounded-[3.5rem] bg-white border border-slate-100 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] transition-all overflow-hidden"
              >
                 <div className="absolute top-0 right-0 p-12 opacity-5 text-indigo-500 group-hover:scale-125 transition-transform duration-700">
                    <tech.icon className="h-32 w-32" />
                 </div>
                 <div className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-2">{tech.category}</div>
                 <h3 className="text-3xl font-black font-outfit text-slate-950 mb-6 tracking-tighter">{tech.title}</h3>
                 <p className="text-slate-500 text-lg font-medium leading-relaxed max-w-md">{tech.desc}</p>
                 
                 {/* Visual Hud Accent */}
                 <div className="mt-8 flex items-center space-x-2">
                    <div className="h-1 w-1 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
                    <span className="text-[10px] font-bold text-slate-700 tracking-widest uppercase">System Core Nominal</span>
                 </div>
              </motion.div>
            ))}
         </div>
      </section>

      {/* Tech Diagram Placeholder Section */}
      <section className="py-24 border-y border-slate-200 bg-slate-100/50">
         <div className="max-w-7xl mx-auto px-4 text-center">
            <h3 className="text-2xl font-bold font-outfit uppercase tracking-widest mb-16 text-slate-400">Logical System Architecture</h3>
            <div className="aspect-video max-w-5xl mx-auto rounded-[3.5rem] border-4 border-dashed border-slate-300 flex items-center justify-center relative overflow-hidden group">
               <div className="absolute inset-0 bg-gradient-to-tr from-primary-500/5 to-indigo-500/5 transition-opacity group-hover:opacity-20 translate-y-[-100%] group-hover:translate-y-0 duration-1000"></div>
               <div className="flex flex-col items-center space-x-4">
                  <Cpu className="h-20 w-20 text-slate-800 mb-4" />
                  <span className="text-sm font-black uppercase tracking-[0.5em] text-slate-800">Visual Neural Loop v1.0.1</span>
               </div>
            </div>
         </div>
      </section>

      <Footer />
    </div>
  );
}
