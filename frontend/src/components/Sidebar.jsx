import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ShieldAlert, History, Settings, LogOut, User, Layers, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { detectionService } from '../services/api';

export default function Sidebar({ onLogout }) {
  const location = useLocation();
  const [liveData, setLiveData] = useState(null);

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await detectionService.getStatus();
        const d = res.data;
        if (d.camera_active) setLiveData(d);
        else setLiveData(null);
      } catch {}
    };
    const interval = setInterval(poll, 2000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { name: 'Main Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  ];

  return (
    <aside className="w-72 h-screen bg-slate-950 text-white flex flex-col pt-8 font-sans border-r border-white/5 relative z-20">
      {/* Background Glow */}
      <div className="absolute top-0 left-0 w-32 h-32 bg-primary-600/5 blur-3xl rounded-full"></div>
      
      <div className="px-8 mb-12 flex items-center group cursor-pointer">
        <div className="flex bg-slate-900 border border-white/10 p-3 rounded-2xl shadow-xl group-hover:scale-110 transition-transform duration-500 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-tr from-primary-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <ShieldAlert className="h-7 w-7 text-white relative z-10" />
        </div>
        <div className="ml-4 flex flex-col">
           <span className="font-outfit font-black text-2xl tracking-tighter leading-none">SMART<span className="text-primary-500">CORE</span></span>
           <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 leading-none mt-1">Safety Interface</span>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
        <div className="px-6 mb-4 text-[9px] font-black uppercase tracking-[0.3em] text-slate-600">Core System</div>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center px-6 py-4 text-[11px] font-black uppercase tracking-widest rounded-2xl transition-all relative overflow-hidden group ${
                isActive 
                  ? 'bg-slate-900 text-white border border-white/10 shadow-[0_20px_40px_-5px_rgba(0,0,0,0.5)]' 
                  : 'text-slate-500 hover:text-white'
              }`}
            >
              {isActive && (
                <motion.div 
                   layoutId="activeTab"
                   className="absolute inset-0 bg-gradient-to-r from-primary-600/10 to-indigo-600/10 pointer-events-none"
                />
              )}
              <item.icon className={`mr-4 h-5 w-5 relative z-10 transition-colors ${isActive ? 'text-primary-400' : 'text-slate-700 group-hover:text-white'}`} />
              <span className="relative z-10">{item.name}</span>
              {isActive && (
                 <div className="absolute right-6 h-1.5 w-1.5 bg-primary-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
              )}
            </Link>
          );
        })}

        <div className="px-6 mt-10 mb-4 text-[9px] font-black uppercase tracking-[0.3em] text-slate-700">More Tools</div>
        {[
           { name: 'History', icon: History, path: '/archives' },
           { name: 'Settings', icon: Settings, path: '/settings' }
        ].map((item, idx) => {
           const isActive = location.pathname === item.path;
           return (
             <Link
               key={item.name}
               to={item.path}
               className={`flex items-center px-6 py-4 text-[11px] font-black uppercase tracking-widest rounded-2xl transition-all relative overflow-hidden group ${
                 isActive 
                   ? 'bg-slate-900 text-white border border-white/10 shadow-[0_20px_40px_-5px_rgba(0,0,0,0.5)]' 
                   : 'text-slate-500 hover:text-white'
               }`}
             >
               {isActive && (
                 <motion.div 
                    layoutId="activeTab"
                    className="absolute inset-0 bg-gradient-to-r from-primary-600/10 to-indigo-600/10 pointer-events-none"
                 />
               )}
               <item.icon className={`mr-4 h-5 w-5 relative z-10 transition-colors ${isActive ? 'text-primary-400' : 'text-slate-700 group-hover:text-white'}`} />
               <span className="relative z-10">{item.name}</span>
               {isActive && (
                  <div className="absolute right-6 h-1.5 w-1.5 bg-primary-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
               )}
             </Link>
           );
        })}

        {/* Live Detection Mini-Panel */}
        {liveData && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-2 mt-8 bg-slate-900/80 border border-white/5 rounded-2xl p-4 space-y-3"
          >
            <div className="flex items-center space-x-2 mb-2">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Live Detection</span>
            </div>

            {/* Helmet */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="h-3.5 w-3.5 text-slate-600" />
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Helmet</span>
              </div>
              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${liveData.helmet_status?.worn ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                {liveData.helmet_status?.worn ? 'ON' : 'OFF'}
              </span>
            </div>

            {/* Faces */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <User className="h-3.5 w-3.5 text-slate-600" />
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Faces</span>
              </div>
              <div className="flex flex-col items-end">
                {liveData.rider_info?.age_results?.length > 0 ? (
                  liveData.rider_info.age_results.map((f, i) => (
                    <span key={i} className="text-[9px] font-black text-primary-400">{f.age} · {f.age_group}</span>
                  ))
                ) : (
                  <span className="text-[9px] font-black text-slate-600">—</span>
                )}
              </div>
            </div>

            {/* Objects */}
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2 pt-0.5">
                <Layers className="h-3.5 w-3.5 text-slate-600" />
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Objects</span>
              </div>
              <div className="flex flex-col items-end gap-0.5">
                {liveData.safety_status?.objects?.length > 0 ? (
                  liveData.safety_status.objects.slice(0, 3).map((o, i) => (
                    <span key={i} className="text-[9px] font-black text-amber-400 capitalize">{o.label}</span>
                  ))
                ) : (
                  <span className="text-[9px] font-black text-slate-600">Clear</span>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </nav>

      <div className="p-6 border-t border-white/5 bg-slate-950/50 backdrop-blur-md">
        <div className="flex items-center space-x-4 mb-6 px-4">
           <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
           <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Core Synchronized</span>
        </div>
        <button
          onClick={onLogout}
          className="flex w-full items-center px-6 py-4 text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl text-slate-500 hover:bg-rose-500/10 hover:text-rose-400 transition-all group"
        >
          <LogOut className="mr-4 h-5 w-5 text-slate-700 group-hover:text-rose-400 transition-colors" />
          Terminate
        </button>
      </div>
    </aside>
  );
}
