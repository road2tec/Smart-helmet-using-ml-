import { motion } from 'framer-motion';
import { Settings as SettingsIcon, ShieldCheck, Database, Radio, User, Sliders } from 'lucide-react';
import Sidebar from '../components/Sidebar';

export default function Settings() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <div className="flex h-screen bg-slate-950 text-white font-sans overflow-hidden select-none">
      <Sidebar onLogout={() => { localStorage.clear(); window.location.href='/'; }} />

      <main className="flex-1 flex flex-col relative overflow-y-auto">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-rose-600/5 blur-[120px] pointer-events-none"></div>

        {/* Top Header */}
        <header className="relative z-10 bg-slate-900 border-b border-white/5 px-10 py-8 flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="h-12 w-12 rounded-2xl bg-slate-800 border border-white/10 flex items-center justify-center">
               <SettingsIcon className="h-6 w-6 text-slate-400" />
            </div>
            <div>
              <h2 className="text-xl font-black font-outfit uppercase tracking-tighter leading-none">System Configuration</h2>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mt-2">Hardware & Profile Parameters</p>
            </div>
          </div>
          <div className="flex items-center">
             <button className="px-6 py-3 bg-primary-600 hover:bg-primary-500 text-[10px] font-black uppercase tracking-widest rounded-xl shadow-[0_10px_30px_rgba(59,130,246,0.2)] transition-colors text-white">
                Commit Changes
             </button>
          </div>
        </header>

        {/* Content */}
        <div className="p-10 relative z-10 max-w-[1200px] mx-auto w-full grid lg:grid-cols-2 gap-10">
           
           <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
              <div className="flex items-center space-x-3 text-slate-400">
                 <User className="h-5 w-5" />
                 <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">Operator Integrity</h3>
              </div>
              <div className="bg-slate-900 border border-white/5 p-8 rounded-[2.5rem] shadow-xl text-sm">
                 <div className="space-y-6">
                    <div>
                       <label className="text-[9px] font-black uppercase tracking-widest text-slate-600 mb-2 block">Assigned Node User</label>
                       <input type="text" defaultValue={user.name || 'System Administrator'} className="w-full bg-[#050B14] border border-white/5 rounded-2xl px-5 py-4 text-white font-bold outline-none cursor-not-allowed opacity-70" readOnly />
                    </div>
                    <div>
                       <label className="text-[9px] font-black uppercase tracking-widest text-slate-600 mb-2 block">Comms Link (Email)</label>
                       <input type="email" defaultValue={user.email || 'admin@smartcore.sys'} className="w-full bg-[#050B14] border border-white/5 rounded-2xl px-5 py-4 text-slate-400 font-bold outline-none cursor-not-allowed opacity-70" readOnly />
                    </div>
                 </div>
              </div>
           </motion.div>

           <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="space-y-6">
              <div className="flex items-center space-x-3 text-slate-400">
                 <Sliders className="h-5 w-5" />
                 <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">Sensor Thresholds</h3>
              </div>
              <div className="bg-slate-900 border border-white/5 p-8 rounded-[2.5rem] shadow-xl text-sm space-y-8">
                 <div className="flex items-center justify-between">
                    <div>
                       <span className="text-white font-bold tracking-widest font-outfit uppercase text-xs block mb-1">AI Logic Strictness</span>
                       <span className="text-[9px] font-bold uppercase text-slate-500 tracking-wider">Confidence limit for Helmet Detection</span>
                    </div>
                    <div className="px-3 py-1 bg-primary-500/10 border border-primary-500/20 text-primary-400 rounded-lg text-xs font-black">95.0%</div>
                 </div>
                 
                 <div className="w-full h-[1px] bg-white/5"></div>

                 <div className="flex items-center justify-between">
                    <div>
                       <span className="text-white font-bold tracking-widest font-outfit uppercase text-xs block mb-1">Alcohol Lockout (MQ-3)</span>
                       <span className="text-[9px] font-bold uppercase text-slate-500 tracking-wider">PPM trigger threshold for Engine cut</span>
                    </div>
                    <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs font-black">0.05</div>
                 </div>
                 
                 <div className="w-full h-[1px] bg-white/5"></div>

                 <div className="flex items-center justify-between">
                    <div>
                       <span className="text-white font-bold tracking-widest font-outfit uppercase text-xs block mb-1">Hardware Polling</span>
                       <span className="text-[9px] font-bold uppercase text-slate-500 tracking-wider">Fetch interval for live serial data</span>
                    </div>
                    <div className="px-3 py-1 bg-slate-800 border border-white/10 text-white rounded-lg text-xs font-black">2000 MS</div>
                 </div>
              </div>
           </motion.div>
        </div>
      </main>
    </div>
  );
}
