import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, Search, Clock, AlertCircle, ShieldCheck, User, Layers, RefreshCw } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { detectionService } from '../services/api';

export default function Archives() {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const sessionCounter = useRef(1);

  useEffect(() => {
    const fetchAndLog = async () => {
      try {
        const res = await detectionService.getStatus();
        const d = res.data;

        // Only log if camera is active and we have real data
        if (!d.camera_active) {
          setLoading(false);
          return;
        }

        const faces = d.rider_info?.age_results || [];
        const objects = d.safety_status?.objects || [];
        const helmetWorn = d.helmet_status?.worn || false;

        const entry = {
          id: `S-${String(sessionCounter.current).padStart(4, '0')}`,
          time: new Date().toLocaleTimeString(),
          date: new Date().toLocaleDateString(),
          helmet: helmetWorn,
          faces: faces.map(f => `${f.age} (${f.age_group})`),
          objects: objects.map(o => `${o.label} ${(o.confidence * 100).toFixed(0)}%`),
          status: !helmetWorn ? 'WARNING' : 'OK',
        };

        sessionCounter.current += 1;

        setLogs(prev => {
          // Keep max 50 entries
          const updated = [entry, ...prev].slice(0, 50);
          return updated;
        });
        setLoading(false);
      } catch (err) {
        setLoading(false);
      }
    };

    const interval = setInterval(fetchAndLog, 3000);
    return () => clearInterval(interval);
  }, []);

  const filtered = logs.filter(log =>
    log.id.toLowerCase().includes(search.toLowerCase()) ||
    log.status.toLowerCase().includes(search.toLowerCase()) ||
    log.objects.join(' ').toLowerCase().includes(search.toLowerCase()) ||
    log.faces.join(' ').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-slate-950 text-white font-sans overflow-hidden select-none">
      <Sidebar onLogout={() => { localStorage.clear(); window.location.href='/'; }} />

      <main className="flex-1 flex flex-col relative overflow-y-auto">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/5 blur-[120px] pointer-events-none"></div>

        {/* Header */}
        <header className="relative z-10 bg-slate-900 border-b border-white/5 px-10 py-8 flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <Database className="h-6 w-6 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xl font-black font-outfit uppercase tracking-tighter leading-none">Detection History</h2>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mt-2">Live Session Logs — Updates every 3 seconds</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-[10px] font-black text-emerald-400 uppercase tracking-widest">
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></div>
              <span>{logs.length} Entries</span>
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="Search logs..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="bg-slate-950 border border-white/10 rounded-xl px-4 py-2 pr-10 text-[10px] font-black tracking-widest uppercase outline-none focus:border-indigo-500/50 transition-colors w-64"
              />
              <Search className="h-4 w-4 absolute right-4 top-1/2 -translate-y-1/2 text-slate-500" />
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-10 relative z-10 max-w-[1400px] mx-auto w-full">
          {loading || logs.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-32 text-slate-600"
            >
              <RefreshCw className="h-12 w-12 mb-4 opacity-30 animate-spin" />
              <span className="text-[11px] font-black uppercase tracking-widest">
                {loading ? 'Waiting for camera...' : 'Start the camera on dashboard to begin logging'}
              </span>
              <p className="text-[9px] mt-2 text-slate-700 uppercase tracking-widest">Go to Main Dashboard → Click Start Camera</p>
            </motion.div>
          ) : (
            <div className="bg-[#050B14] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
              {/* Table Header */}
              <div className="flex items-center justify-between p-8 border-b border-white/5 bg-slate-900/50">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Live Session Logs</h3>
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-600">{filtered.length} records</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/5 bg-slate-900/20 text-[9px] font-black uppercase tracking-[0.2em] text-slate-600">
                      <th className="p-5">Session ID</th>
                      <th className="p-5">Time</th>
                      <th className="p-5">Helmet</th>
                      <th className="p-5">Faces / Age</th>
                      <th className="p-5">Objects Detected</th>
                      <th className="p-5">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {filtered.map((log, idx) => (
                        <motion.tr
                          key={log.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ delay: Math.min(idx * 0.03, 0.3) }}
                          className="border-b border-white/5 hover:bg-slate-900/40 transition-colors cursor-pointer"
                        >
                          <td className="p-5">
                            <span className="text-xs font-bold font-outfit text-white tracking-widest">{log.id}</span>
                          </td>
                          <td className="p-5 text-slate-400 text-xs font-medium">
                            <div className="flex items-center space-x-2">
                              <Clock className="h-3 w-3" />
                              <span>{log.time}</span>
                            </div>
                          </td>
                          <td className="p-5">
                            <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-lg ${log.helmet ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                              {log.helmet ? '✓ DETECTED' : '✗ MISSING'}
                            </span>
                          </td>
                          <td className="p-5">
                            {log.faces.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {log.faces.map((f, i) => (
                                  <span key={i} className="flex items-center space-x-1 text-[9px] font-black bg-primary-500/10 text-primary-400 px-2 py-1 rounded-lg">
                                    <User className="h-2.5 w-2.5" />
                                    <span>{f}</span>
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-600 text-[10px] font-black">—</span>
                            )}
                          </td>
                          <td className="p-5">
                            {log.objects.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {log.objects.slice(0, 3).map((o, i) => (
                                  <span key={i} className="flex items-center space-x-1 text-[9px] font-black bg-amber-500/10 text-amber-400 px-2 py-1 rounded-lg">
                                    <Layers className="h-2.5 w-2.5" />
                                    <span>{o}</span>
                                  </span>
                                ))}
                                {log.objects.length > 3 && (
                                  <span className="text-[9px] text-slate-600 font-black px-2 py-1">+{log.objects.length - 3}</span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-600 text-[10px] font-black">Clear</span>
                            )}
                          </td>
                          <td className="p-5">
                            <div className="flex items-center space-x-2">
                              {log.status === 'OK'
                                ? <ShieldCheck className="h-4 w-4 text-emerald-500" />
                                : <AlertCircle className="h-4 w-4 text-amber-500" />
                              }
                              <span className={`text-[10px] font-black uppercase tracking-widest ${log.status === 'OK' ? 'text-emerald-500' : 'text-amber-500'}`}>
                                {log.status}
                              </span>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
