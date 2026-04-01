import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';
import Navbar from '../components/Navbar';
import { 
  ShieldCheck, Heart, Users, Target, Globe, Milestone,
  Zap, ArrowRight, UserPlus
} from 'lucide-react';

export default function About() {
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6 }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-primary-500 selection:text-white leading-relaxed antialiased">
      <Navbar />
      
      {/* Hero */}
      <section className="pt-32 pb-20 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-emerald-600/10 blur-[150px]"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
           <motion.div {...fadeInUp}>
              <h2 className="text-[12px] font-black uppercase tracking-[0.4em] text-emerald-500 mb-4">Core Mission</h2>
              <h1 className="text-6xl md:text-8xl font-black font-outfit tracking-tighter leading-none mb-8">
                THE PROJECT <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-primary-500">VISION.</span>
              </h1>
              <p className="text-slate-400 text-xl font-medium max-w-2xl mx-auto opacity-70">
                 Dedicated to building the next generation of motorcycle safety technology through open-source AI and hardware innovation.
              </p>
           </motion.div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10">
         <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-10"
            >
               <div>
                  <div className="flex items-center space-x-3 mb-6">
                     <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                        <Target className="h-6 w-6" />
                     </div>
                     <h3 className="text-2xl font-black font-outfit uppercase tracking-tighter">The Objective</h3>
                  </div>
                  <p className="text-slate-500 text-lg font-medium leading-relaxed">
                     Our objective is to reduce motorcycle fatalities by 50% in urban environments by 2030. We integrate computer vision sensors with engine control systems to eliminate human error where it matters most.
                  </p>
               </div>

               <div>
                  <div className="flex items-center space-x-3 mb-6">
                     <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-primary-500/10 text-primary-400">
                        <Users className="h-6 w-6" />
                     </div>
                     <h3 className="text-2xl font-black font-outfit uppercase tracking-tighter">The Community</h3>
                  </div>
                  <p className="text-slate-500 text-lg font-medium leading-relaxed">
                     SmartCore is more than just code; it's a community of riders, developers, and safety enthusiasts dedicated to making the road a safer place for everyone.
                  </p>
               </div>
            </motion.div>

            <motion.div 
               initial={{ opacity: 0, x: 50 }}
               whileInView={{ opacity: 1, x: 0 }}
               viewport={{ once: true }}
               className="relative lg:pl-16 font-sans"
            >
               <div className="rounded-[4rem] overflow-hidden border-8 border-white relative group p-12 bg-white shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)] transition-all duration-700">
                  <div className="flex flex-col items-center text-center space-y-6">
                     <Globe className="h-24 w-24 text-primary-500/10 mb-4 group-hover:scale-110 transition-transform duration-700" />
                     <h4 className="text-3xl font-black font-outfit uppercase tracking-tighter text-slate-950">Global Impact Nodes</h4>
                     <p className="text-slate-500 font-medium max-w-sm">Tracking and protecting riders across 12,000+ active safety nodes globally.</p>
                     
                     <div className="w-full h-[1px] bg-slate-100 my-8"></div>
                     <div className="flex items-center space-x-4">
                        <button className="flex items-center space-x-2 px-8 py-4 bg-emerald-500 text-slate-950 font-black uppercase tracking-widest text-[11px] rounded-2xl hover:scale-105 transition-all">
                           <span>Join Project</span>
                           <UserPlus className="h-4 w-4" />
                        </button>
                     </div>
                  </div>
               </div>
            </motion.div>
         </div>
      </section>

      {/* Values Grid */}
      <section className="py-32 bg-slate-50 border-t border-slate-100 backdrop-blur-md">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-3 gap-12 text-center items-center">
               {[
                 { title: 'Privacy First', icon: ShieldCheck, desc: 'All visual processing happens locally on the edge node. No rider data is stored without explicit consent.', color: 'text-indigo-600' },
                 { title: 'Real-time OS', icon: Zap, iconLabel: 'Low Latency', desc: 'Our engine control logic operates at sub-millisecond precision for immediate safety response.', color: 'text-emerald-600' },
                 { title: 'Impact Geo', icon: MapPin, desc: 'Automatic SOS dispatch system with high-precision GPS coordinates for first responders.', color: 'text-primary-600' }
               ].map((v, i) => (
                  <div key={i} className="flex flex-col items-center">
                     <v.icon className={`h-16 w-16 mb-6 ${v.color}`} />
                     <h4 className="text-xl font-bold font-outfit uppercase tracking-widest mb-4">{v.title}</h4>
                     <p className="text-slate-500 font-medium leading-relaxed">{v.desc}</p>
                  </div>
               ))}
            </div>
         </div>
      </section>

      <Footer />
    </div>
  );
}
