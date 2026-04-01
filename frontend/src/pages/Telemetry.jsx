import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Target, Activity, Terminal, ShieldAlert, Wifi, Server, Database } from 'lucide-react';
import Sidebar from '../components/Sidebar';

export default function Telemetry() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    // Generate mock telemetry data
    const interval = setInterval(() => {
      const ms = new Date().toISOString().split('T')[1].substring(0, 11);
      const newLog = `[${ms}] NODE_0X42F: YOLOV8_CONF: 99.${Math.floor(Math.random() * 99)}% | LATENCY: ${(Math.random() * 5 + 10).toFixed(2)}ms | HW_SYNC: OK`;
      setLogs((prev) => [newLog, ...prev].slice(0, 15));
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-screen bg-slate-950 text-white font-sans overflow-hidden select-none">
      <Sidebar onLogout={() => { localStorage.clear(); window.location.href='/'; }} />

      <main className="flex-1 flex flex-col relative overflow-y-auto">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-600/5 blur-[120px] pointer-events-none"></div>

        {/* Top Header */}
        <header className="relative z-10 bg-slate-900 border-b border-white/5 px-10 py-8 flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="h-12 w-12 rounded-2xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center">
               <Activity className="h-6 w-6 text-primary-400" />
            </div>
            <div>
              <h2 className="text-xl font-black font-outfit uppercase tracking-tighter leading-none">Live Telemetry Stream</h2>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mt-2">Hardware & AI Neural Outputs</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
             <div className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center space-x-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500">Live Connection</span>
             </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-10 relative z-10 max-w-[1600px] mx-auto w-full grid lg:grid-cols-3 gap-10 h-full">
           
           {/* Terminal Feed */}
           <div className="lg:col-span-2 flex flex-col space-y-6">
              <div className="flex items-center justify-between">
                 <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Standard Output (RAW)</h3>
                 <Terminal className="h-4 w-4 text-slate-600" />
              </div>
              <div className="flex-1 bg-[#050B14] border border-white/5 rounded-[2rem] p-8 font-mono text-[10px] leading-relaxed shadow-inner overflow-hidden relative">
                 <div className="absolute inset-0 bg-[linear-gradient(transparent_0%,rgba(59,130,246,0.02)_50%,transparent_100%)] bg-[length:100%_4px] pointer-events-none"></div>
                 {logs.map((log, i) => (
                    <motion.div 
                      key={i} 
                      initial={{ opacity: 0, x: -10 }} 
                      animate={{ opacity: 1 - (i * 0.05), x: 0 }} 
                      className={`mb-2 ${i === 0 ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}
                    >
                      {log}
                    </motion.div>
                 ))}
                 {logs.length === 0 && <span className="text-slate-600 animate-pulse">Awaiting data sequence...</span>}
              </div>
           </div>

           {/* Metrics Grid */}
           <div className="flex flex-col space-y-6">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Node Sensors</h3>
              
              <div className="grid grid-cols-2 gap-4">
                 {[
                   { icon: Target, label: 'Baud Rate', val: '115200' },
                   { icon: Server, label: 'Processing', val: 'GPU 0' },
                   { icon: Database, label: 'Memory', val: '1.2GB' },
                   { icon: Wifi, label: 'Signal DB', val: '-42' },
                 ].map((stat, idx) => (
                    <motion.div 
                      key={idx}
                      whileHover={{ scale: 1.05 }}
                      className="bg-slate-900 border border-white/5 p-6 rounded-2xl flex flex-col items-center justify-center text-center space-y-3 shadow-lg"
                    >
                       <stat.icon className="h-5 w-5 text-primary-500 opacity-80" />
                       <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{stat.label}</span>
                       <span className="text-sm font-bold font-outfit text-white">{stat.val}</span>
                    </motion.div>
                 ))}
              </div>

              <div className="flex-1 bg-slate-900 border border-white/5 rounded-3xl p-6 relative overflow-hidden flex flex-col items-center justify-center text-center">
                 <ShieldAlert className="h-12 w-12 text-rose-500/20 absolute top-4 right-4" />
                 <span className="text-3xl font-black font-outfit text-white tracking-tighter mb-2">99.98%</span>
                 <span className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-500">System Uptime</span>
                 <div className="w-full h-1 bg-slate-800 rounded-full mt-6 overflow-hidden">
                    <div className="h-full bg-emerald-500 w-full animate-pulse"></div>
                 </div>
              </div>
           </div>
        </div>
      </main>
    </div>
  );
}
