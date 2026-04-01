import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, ShieldAlert, RefreshCw, AlertTriangle, BellRing, ChevronRight, Activity } from 'lucide-react';
import { alertService } from '../services/api';

export default function Alerts({ blocked, blockReasons = [] }) {
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handlePanicAlert = async () => {
    setLoading(true);
    try {
       await alertService.sendPanicAlert();
       setSuccessMsg("PANIC PROTOCOL DISTRIBUTED");
       setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
       console.error(err);
    } finally {
       setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-white/5 p-8 flex flex-col justify-between h-full shadow-2xl relative overflow-hidden group">
      {/* Background patterns */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 blur-3xl rounded-full"></div>
      
      <div>
        <div className="flex items-center space-x-4 mb-8">
          <div className="p-3 bg-slate-800 rounded-2xl text-primary-400 shadow-xl border border-white/5">
             <BellRing className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-black font-outfit text-white tracking-tight uppercase leading-none">Security Node</h2>
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 mt-1">Live Notifications</p>
          </div>
        </div>

        <div className="space-y-6">
           <AnimatePresence mode="wait">
             {blocked ? (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-rose-500/10 border-l-4 border-rose-500 p-6 rounded-2xl relative overflow-hidden"
                >
                   <div className="relative z-10 flex flex-col">
                      <div className="flex items-center space-x-3 mb-4">
                         <ShieldAlert className="h-5 w-5 text-rose-500" />
                         <h3 className="text-sm font-black text-rose-400 uppercase tracking-widest leading-none">Ignition Interlock Active</h3>
                      </div>
                      <div className="space-y-3">
                         {blockReasons.map((reason, idx) => (
                            <div key={idx} className="flex items-center space-x-3 text-xs font-bold text-rose-300">
                               <div className="h-1 w-1 bg-rose-500 rounded-full"></div>
                               <span className="uppercase tracking-widest opacity-80">{reason}</span>
                            </div>
                         ))}
                      </div>
                   </div>
                   {/* Background pulse effect */}
                   <div className="absolute inset-0 bg-rose-500/5 animate-pulse"></div>
                </motion.div>
             ) : (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-emerald-500/5 border border-emerald-500/10 p-6 rounded-2xl flex items-center justify-between"
                >
                   <div className="flex items-center space-x-4">
                      <div className="p-2 bg-emerald-500/20 rounded-lg">
                        <Activity className="h-5 w-5 text-emerald-500" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest leading-none mb-1">Status</span>
                        <span className="text-sm font-bold text-white uppercase tracking-tighter">ALL SYSTEMS GO</span>
                      </div>
                   </div>
                   <ShieldCheck className="h-10 w-10 text-emerald-500/20" />
                </motion.div>
             )}
           </AnimatePresence>

           <AnimatePresence>
             {successMsg && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-primary-500/10 text-primary-400 p-4 rounded-xl text-[10px] font-black tracking-widest text-center border border-primary-500/20 animate-pulse-soft"
                >
                   {successMsg}
                </motion.div>
             )}
           </AnimatePresence>
        </div>
      </div>

      <div className="mt-12 pt-8 border-t border-white/5 space-y-4">
         <div className="flex items-center justify-between px-2 mb-4">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Protocol Response</span>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Global Dispatch Ready</span>
         </div>
         <button 
           onClick={handlePanicAlert}
           disabled={loading}
           className="w-full relative h-16 group inline-flex items-center justify-center rounded-2xl bg-slate-950 border border-rose-500/20 shadow-2xl transition-all active:scale-95 disabled:opacity-50 overflow-hidden"
         >
           <div className="absolute inset-0 bg-rose-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
           <div className="relative z-10 flex items-center text-rose-500 group-hover:text-white transition-colors">
             {loading ? <RefreshCw className="h-5 w-5 animate-spin" /> : (
               <>
                 <AlertTriangle className="h-5 w-5 mr-3" />
                 <span className="text-[11px] font-black uppercase tracking-[0.2em] leading-none">Execute Panic SOS</span>
                 <ChevronRight className="ml-3 h-4 w-4 opacity-40 group-hover:translate-x-1 group-hover:opacity-100 transition-all" />
               </>
             )}
           </div>
         </button>
      </div>
    </div>
  );
}
