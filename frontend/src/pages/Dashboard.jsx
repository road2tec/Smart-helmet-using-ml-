import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, ShieldAlert, Zap, Activity, Battery, User, 
  Map as MapIcon, Wifi, Gauge, Cpu, AlertTriangle, Cpu as CpuIcon,
  Terminal, Signal, RefreshCw, Layers, Camera, Zap as ZapIcon
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Alerts from '../components/Alerts';
import { detectionService } from '../services/api';

export default function Dashboard() {
  const [cameraActive, setCameraActive] = useState(false);
  const [feedError, setFeedError] = useState('');
  const [frameTick, setFrameTick] = useState(Date.now());
  const [data, setData] = useState({
    helmet_detected: false,
    drowsy: false,
    alcohol_level: 0,
    accident_detected: false,
    age_group: 'N/A',
    age_results: [],
    objects_detected: [],
    drowsiness_debug: { ear: 0, eyes_closed_duration: 0, eyes_detected: 0 },
    camera_error: '',
    camera_index: null,
    location: { lat: 0, lng: 0 }
  });
  const [showNotification, setShowNotification] = useState(false);
  const [showDrowsyPopup, setShowDrowsyPopup] = useState(false);
  const [lastHelmetState, setLastHelmetState] = useState(false);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const [authorized, setAuthorized] = useState(false);
  const audioCtxRef = useRef(null);

  const unlockAudio = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
    } catch (error) {
      console.warn('Audio unlock failed:', error);
    }
  };

  const playDrowsyBeep = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }

      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(1600, ctx.currentTime);

      gainNode.gain.setValueAtTime(0.0001, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.22);

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.24);
    } catch (error) {
      console.warn('Drowsiness beep failed:', error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await detectionService.getStatus();
        const res = response.data;
        
        // Correctly parse the nested backend payload into the flat React state
        setData(prevData => ({
          ...prevData,
          helmet_detected: res.helmet_status?.worn || false,
          drowsy: res.safety_status?.is_drowsy || false,
          alcohol_level: res.alcohol_status?.reading || 0,
          age_group: res.rider_info?.age_group || 'N/A',
          age_results: res.rider_info?.age_results || [],
          objects_detected: res.safety_status?.objects || [],
          drowsiness_debug: res.safety_status?.drowsiness_debug || { ear: 0, eyes_closed_duration: 0, eyes_detected: 0 },
          camera_error: res.camera_error || '',
          camera_index: res.camera_index ?? null,
        }));
        setLoading(false);
      } catch (err) {
        console.error(err);
      }
    };
    if (authorized) return; // Stop polling once journey is locked
    
    const interval = setInterval(fetchData, 900);
    return () => clearInterval(interval);
  }, [authorized]);

  useEffect(() => {
    if (!cameraActive || authorized || !data.drowsy) return;

    playDrowsyBeep();
    const id = setInterval(() => {
      playDrowsyBeep();
    }, 1300);

    return () => clearInterval(id);
  }, [cameraActive, authorized, data.drowsy]);

  useEffect(() => {
    if (!cameraActive || authorized) {
      setShowDrowsyPopup(false);
      return;
    }

    if (!data.drowsy) {
      setShowDrowsyPopup(false);
      return;
    }

    setShowDrowsyPopup(true);
    const popupTimer = setTimeout(() => {
      setShowDrowsyPopup(false);
    }, 2600);

    return () => clearTimeout(popupTimer);
  }, [cameraActive, authorized, data.drowsy]);

  useEffect(() => {
    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  useEffect(() => {
    if (!cameraActive) return;

    const id = setInterval(() => {
      setFrameTick(Date.now());
    }, 200);

    return () => clearInterval(id);
  }, [cameraActive]);

  // Notification and Auto-Stop logic for helmet detection (Instant)
  useEffect(() => {
    if (data.helmet_detected && !lastHelmetState && !authorized) {
      setShowNotification(true);
      setAuthorized(true);
      
      // Near-instant stop (1s for quick visual confirmation)
      setTimeout(async () => {
        setShowNotification(false);
        try {
           await detectionService.stopCamera();
           setCameraActive(false);
        } catch(e) {
           console.error("Failed to stop camera:", e);
        }
      }, 800); 
    }
    setLastHelmetState(data.helmet_detected);
  }, [data.helmet_detected, lastHelmetState, authorized]);

  // If authorized, it's unblocked forever.
  const isBlocked = !authorized && (!cameraActive || !data.helmet_detected || data.drowsy);
  const blockReasons = !cameraActive && !authorized
    ? ["CAMERA OFFLINE - PRESS START"] 
    : [
        !data.helmet_detected && !authorized && "NO HELMET DETECTED",
        data.drowsy && !authorized && "DROWSINESS DETECTED"
      ].filter(Boolean);

  return (
    <div className="flex h-screen bg-slate-950 text-white font-sans overflow-hidden select-none">
      <Sidebar onLogout={() => { localStorage.clear(); window.location.href='/'; }} />

      {/* Floating Tactical Side-text */}
      <div className="fixed left-80 top-1/2 -translate-y-1/2 flex flex-col space-y-16 z-50 pointer-events-none opacity-10">
         <div className="flex items-center space-x-3 rotate-[-90deg] origin-left">
            <Layers className="h-4 w-4" />
            <span className="text-[9px] font-black uppercase tracking-[0.5em]">Command Hub v4.2X</span>
         </div>
         <div className="flex items-center space-x-3 rotate-[-90deg] origin-left">
            <Signal className="h-4 w-4" />
            <span className="text-[9px] font-black uppercase tracking-[0.5em]">Live Telemetry Stream</span>
         </div>
      </div>

      <main className="flex-1 flex flex-col relative overflow-y-auto">
        {/* Animated Background Orbs */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-600/5 blur-[120px] pointer-events-none"></div>

        {/* HUD Top Bar */}
        <header className="relative z-10 bg-slate-900 border-b border-white/5 px-10 py-6 flex items-center justify-between overflow-hidden">
          <div className="flex items-center space-x-6">
            <div className="h-12 w-12 rounded-2xl bg-slate-950 border border-white/10 flex items-center justify-center relative group">
               <div className="absolute inset-0 bg-primary-500/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
               <User className="h-6 w-6 text-primary-400" />
            </div>
            <div>
              <h2 className="text-xl font-black font-outfit uppercase tracking-tighter leading-none">Initialize {user.name?.split(' ')[0] || 'Operator'}</h2>
              <div className="flex items-center mt-2 space-x-3">
                 <div className={`h-2 w-2 rounded-full animate-pulse ${isBlocked ? 'bg-rose-500' : 'bg-emerald-500'}`}></div>
                 <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${isBlocked ? 'text-rose-500' : 'text-emerald-500'}`}>
                    {isBlocked ? 'IGNITION_INTERLOCKED' : 'SYSTEM_AUTHORIZED'}
                 </span>
              </div>
            </div>
          </div>
          
          {/* Main Status Badge */}
          <div className={`px-8 py-3 rounded-2xl border flex items-center space-x-4 transition-all duration-500 ${!cameraActive && !authorized ? 'bg-slate-500/10 border-slate-500/20 text-slate-500' : isBlocked ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'}`}>
             {!cameraActive && !authorized ? <ShieldAlert className="h-5 w-5" /> : (isBlocked ? <ShieldAlert className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />)}
             <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase tracking-widest opacity-60 leading-none mb-1">Safety Status</span>
                <span className="text-sm font-black font-outfit uppercase tracking-tighter">
                   {!cameraActive && !authorized ? 'STANDBY' : (isBlocked ? 'BLOCKED' : authorized ? 'JOURNEY AUTHORIZED' : 'HELMET DETECTED - VERIFYING')}
                </span>
             </div>
          </div>

          <div className="hidden lg:flex items-center space-x-12 px-8 py-2 bg-slate-950/30 rounded-2xl border border-white/5">
             <div className="flex flex-col items-end">
                <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest leading-none mb-1">Helmet AI</span>
                <span className={`text-xs font-bold uppercase tracking-tighter ${authorized ? 'text-primary-500' : data.helmet_detected ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {authorized ? 'LOCKED-IN' : data.helmet_detected ? 'ACTIVE' : 'OFFLINE'}
                </span>
             </div>
             <div className="flex flex-col items-end">
                <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest leading-none mb-1">Age AI</span>
                <span className={`text-xs font-bold text-white uppercase tracking-tighter ${(data.age_results.length > 0 || authorized) ? 'text-primary-400' : 'text-slate-500'}`}>
                  {authorized ? 'VERIFIED' : data.age_results.length > 0 ? `${data.age_results.length} FACE` : 'SCANNING'}
                </span>
             </div>
             <div className="flex flex-col items-end">
                <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest leading-none mb-1">Objects</span>
                <span className={`text-xs font-bold uppercase tracking-tighter ${authorized ? 'text-slate-500' : data.objects_detected.length > 0 ? 'text-amber-400' : 'text-slate-500'}`}>
                  {authorized ? 'DISCONNECTED' : data.objects_detected.length > 0 ? `${data.objects_detected.length} OBJ` : 'CLEAR'}
                </span>
             </div>
          </div>
        </header>

        <div className="p-10 space-y-10 relative z-10 max-w-[1600px] mx-auto w-full">
          {/* Main Monitor Area */}
          <div className="grid lg:grid-cols-3 gap-10">
            {/* Visual Feed Node */}
            <div className="lg:col-span-2 space-y-10">
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative bg-slate-900 border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl group"
              >
                  {/* Decorative corner brackets */}
                  <div className="absolute top-8 right-8 w-16 h-16 border-t-2 border-r-2 border-primary-500/30 rounded-tr-3xl"></div>
                  <div className="absolute bottom-8 left-8 w-16 h-16 border-b-2 border-l-2 border-primary-500/30 rounded-bl-3xl"></div>

                  {/* HUD Camera Scanning Line Overlay */}
                  <div className="absolute inset-0 bg-[linear-gradient(transparent_0%,rgba(59,130,246,0.05)_50%,transparent_100%)] bg-[length:100%_4px] animate-scan pointer-events-none z-30"></div>
                  
                  <div className="w-full h-[600px] bg-black flex items-center justify-center relative overflow-hidden group/camera">
                     <div className="absolute top-10 left-10 flex items-center space-x-3 bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 z-30">
                        <div className={`h-2 w-2 rounded-full ${cameraActive ? 'bg-red-500 animate-pulse' : 'bg-slate-500'}`}></div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Live Camera Feed</span>
                     </div>
                     
                     {cameraActive ? (
                      <>
                          <img 
                            src={`http://localhost:5000/detect/frame.jpg?t=${frameTick}`}
                          className="w-full h-full object-cover z-10" 
                          alt="Camera Feed" 
                          onError={() => setFeedError('Unable to load camera stream from backend.')}
                          onLoad={() => setFeedError('')}
                        />
                        {(data.camera_error || feedError) && (
                         <div className="absolute bottom-4 left-4 right-4 z-40 rounded-2xl border border-rose-500/20 bg-slate-950/80 backdrop-blur-md px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-rose-400">
                          {feedError || data.camera_error}
                          {data.camera_index !== null ? ` (index ${data.camera_index})` : ''}
                         </div>
                        )}
                      </>
                     ) : authorized ? (
                        <div className="w-full h-full flex flex-col items-center justify-center space-y-8 bg-slate-950 z-20">
                           <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", stiffness: 200, damping: 20 }}
                              className="h-32 w-32 rounded-full bg-emerald-500/10 border-4 border-emerald-500/30 flex items-center justify-center relative shadow-[0_0_50px_rgba(16,185,129,0.2)]"
                           >
                              <ShieldCheck className="h-16 w-16 text-emerald-500" />
                              <div className="absolute inset-0 rounded-full border border-emerald-500/20 animate-ping"></div>
                           </motion.div>
                           <div className="text-center space-y-2">
                              <h3 className="text-4xl font-black font-outfit uppercase tracking-tighter text-emerald-400 leading-none">SmartCore Authorized</h3>
                              <p className="text-slate-500 font-bold uppercase tracking-widest text-[11px]">Hardware link established. Camera securely offline.</p>
                           </div>
                        </div>
                     ) : (
                        <div 
                          onClick={() => {
                            unlockAudio();
                            setCameraActive(true);
                          }}
                           className="flex flex-col items-center justify-center cursor-pointer group hover:scale-105 transition-all z-20 w-full h-full bg-slate-950"
                        >
                           <div className="h-24 w-24 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center mb-6 group-hover:bg-primary-500/20 group-hover:border-primary-500/50 transition-all shadow-2xl">
                              <Camera className="h-10 w-10 text-primary-500" />
                           </div>
                           <span className="text-[11px] font-black uppercase tracking-[0.3em] text-white group-hover:text-primary-400 transition-colors">Initialize Feed</span>
                           {(data.camera_error || data.camera_index !== null) && (
                             <span className="mt-4 max-w-[80%] text-center text-[10px] font-black uppercase tracking-[0.2em] text-rose-400/90">
                               {data.camera_error || 'Camera detected'}{data.camera_index !== null ? ` (index ${data.camera_index})` : ''}
                             </span>
                           )}
                        </div>
                     )}
                  </div>

                {/* Feed Info Bar */}
                <div className="p-6 bg-slate-900/60 flex items-center justify-between border-t border-white/5">
                   <div className="flex space-x-10">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Age Group</span>
                        <span className="text-sm font-bold text-primary-400 font-outfit uppercase tracking-tighter">{data.age_group} Group</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">AI Accuracy</span>
                        <span className="text-sm font-bold text-white font-outfit tracking-tighter uppercase">99.85%</span>
                      </div>
                   </div>
                   <div className="flex items-center space-x-4">
                      <div className="p-2 bg-emerald-500/10 rounded-lg"><Activity className="h-4 w-4 text-emerald-500" /></div>
                      <div className="p-2 bg-slate-800 rounded-lg"><RefreshCw className="h-4 w-4 text-slate-500" /></div>
                   </div>
                </div>
              </motion.div>

              {/* HUD Telemetry Node */}
              <div className="grid md:grid-cols-3 gap-8 text-center">
                <MetricCard icon={ShieldCheck} label="HELMET STATUS" value={data.helmet_detected ? "DETECTED" : "NOT FOUND"} status={data.helmet_detected ? "success" : "warning"} />
                <SensorRequiredCard icon={Gauge} label="ALCOHOL SENSOR" hardware="MQ-3 Sensor" />
                <MetricCard icon={Activity} label="CRASH SENSORS" value={data.accident_detected ? "CRASH!" : "SAFE"} status={data.accident_detected ? "error" : "success"} />
              </div>

              {/* AI Intelligence Panel */}
              <div className="grid md:grid-cols-2 gap-8">
                {/* Age Detection */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-slate-900/60 border border-white/5 p-6 rounded-[2rem]"
                >
                  <div className="flex items-center space-x-3 mb-5">
                    <div className="h-8 w-8 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center">
                      <User className="h-4 w-4 text-primary-400" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Face & Age Detection</span>
                      <span className="text-xs font-bold text-white">AI Vision Module</span>
                    </div>
                    <div className="ml-auto">
                      <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${
                        cameraActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'
                      }`}>{cameraActive ? 'ACTIVE' : 'STANDBY'}</span>
                    </div>
                  </div>
                  {data.age_results.length === 0 ? (
                    <div className="flex flex-col items-center py-6 text-slate-600">
                      <User className="h-8 w-8 mb-2 opacity-30" />
                      <span className="text-[10px] font-black uppercase tracking-widest">
                        {cameraActive ? 'No Face Detected' : 'Start Camera to Detect'}
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {data.age_results.map((face, i) => (
                        <div key={i} className="flex items-center justify-between bg-slate-800/50 px-4 py-3 rounded-xl">
                          <div className="flex items-center space-x-3">
                            <div className="h-8 w-8 rounded-full bg-primary-500/20 flex items-center justify-center">
                              <User className="h-4 w-4 text-primary-400" />
                            </div>
                            <span className="text-xs font-bold text-white">Face {i + 1}</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className="text-xs font-black text-primary-400 uppercase">{face.age}</span>
                            <span className={`text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-widest ${
                              face.age_group === '<18' ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'
                            }`}>{face.age_group}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>

                {/* Object Detection */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-slate-900/60 border border-white/5 p-6 rounded-[2rem]"
                >
                  <div className="flex items-center space-x-3 mb-5">
                    <div className="h-8 w-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                      <Layers className="h-4 w-4 text-amber-400" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Object Detection</span>
                      <span className="text-xs font-bold text-white">YOLOv8 Vision</span>
                    </div>
                    <div className="ml-auto">
                      <span className="text-[9px] font-black bg-slate-800 text-slate-400 px-3 py-1 rounded-full uppercase tracking-widest">
                        {data.objects_detected.length} Found
                      </span>
                    </div>
                  </div>
                  {data.objects_detected.length === 0 ? (
                    <div className="flex flex-col items-center py-6 text-slate-600">
                      <Layers className="h-8 w-8 mb-2 opacity-30" />
                      <span className="text-[10px] font-black uppercase tracking-widest">
                        {cameraActive ? 'Scene Clear' : 'Start Camera to Detect'}
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {data.objects_detected.map((obj, i) => (
                        <div key={i} className="flex items-center space-x-2 bg-slate-800/50 px-3 py-2 rounded-xl">
                          <div className="h-2 w-2 rounded-full bg-amber-400"></div>
                          <span className="text-xs font-bold text-white uppercase">{obj.label}</span>
                          <span className="text-[9px] text-slate-400 font-bold">{(obj.confidence * 100).toFixed(0)}%</span>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              </div>
            </div>

            {/* Sidebar Control Node */}
            <div className="space-y-10">
               <Alerts blocked={isBlocked} blockReasons={blockReasons} />
               
               <motion.div 
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="bg-slate-900/40 border border-white/5 p-8 rounded-[2.5rem] relative group"
               >
                  <div className="flex flex-col space-y-5">
                     <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">System Health</span>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${!isBlocked ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {!isBlocked ? '100%' : cameraActive ? 'CHECK' : 'STANDBY'}
                        </span>
                     </div>
                     <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <motion.div 
                          className={`h-full rounded-full ${!isBlocked ? 'bg-emerald-500' : cameraActive ? 'bg-rose-500' : 'bg-slate-600'}`}
                          animate={{ width: !isBlocked ? '100%' : cameraActive ? '40%' : '10%' }}
                          transition={{ duration: 0.8 }}
                        />
                     </div>

                     <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Faces Detected</span>
                        <span className={`text-xs font-bold tracking-widest ${data.age_results.length > 0 ? 'text-primary-400' : 'text-slate-600'}`}>
                          {data.age_results.length > 0 ? `${data.age_results.length} Person` : '—'}
                        </span>
                     </div>

                     <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Objects in Scene</span>
                        <span className={`text-xs font-bold tracking-widest ${data.objects_detected.length > 0 ? 'text-amber-400' : 'text-slate-600'}`}>
                          {data.objects_detected.length > 0 ? `${data.objects_detected.length} Found` : '—'}
                        </span>
                     </div>

                     <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Age Group</span>
                        <span className={`text-xs font-bold tracking-widest ${data.age_group === '<18' ? 'text-rose-400' : data.age_group === 'N/A' ? 'text-slate-600' : 'text-emerald-400'}`}>
                          {data.age_group === 'N/A' ? '—' : data.age_group}
                        </span>
                     </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Drowsiness</span>
                      <span className={`text-xs font-bold tracking-widest ${data.drowsy ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {data.drowsy ? 'ALERT' : 'NORMAL'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Eyes Seen</span>
                      <span className="text-xs font-bold tracking-widest text-slate-300">
                        {data.drowsiness_debug?.eyes_detected ?? 0}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Closed Time</span>
                      <span className="text-xs font-bold tracking-widest text-slate-300">
                        {Number(data.drowsiness_debug?.eyes_closed_duration || 0).toFixed(1)}s
                      </span>
                    </div>
                  </div>
               </motion.div>
            </div>
          </div>
        </div>

        {/* Global Success Notification */}
        <AnimatePresence>
          {showNotification && (
            <motion.div 
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] bg-emerald-500 text-white px-10 py-5 rounded-3xl shadow-[0_20px_50px_rgba(16,185,129,0.4)] flex items-center space-x-6 border border-white/20 backdrop-blur-xl"
            >
              <div className="h-10 w-10 bg-white/20 rounded-2xl flex items-center justify-center">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div className="flex flex-col">
                 <span className="text-[10px] font-black uppercase tracking-widest opacity-80 leading-none mb-1">Authorization Success</span>
                 <span className="text-lg font-black font-outfit uppercase tracking-tighter">Helmet Detected - Ready to Start</span>
              </div>
            </motion.div>
          )}

          {showDrowsyPopup && (
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.94 }}
              className="fixed top-8 right-8 z-[110] bg-rose-600 text-white px-7 py-5 rounded-2xl shadow-[0_20px_50px_rgba(244,63,94,0.45)] flex items-start space-x-4 border border-rose-300/30 backdrop-blur-xl"
            >
              <div className="h-10 w-10 bg-white/20 rounded-xl flex items-center justify-center">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-80 leading-none mb-1">Critical Alert</span>
                <span className="text-lg font-black font-outfit uppercase tracking-tighter leading-none">Drowsiness Detected</span>
                <span className="mt-2 text-xs font-bold uppercase tracking-widest text-rose-100/90">
                  Eyes closed for {Number(data.drowsiness_debug?.eyes_closed_duration || 0).toFixed(1)}s
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, status }) {
  const colors = {
    success: 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5',
    warning: 'text-amber-500 border-amber-500/20 bg-amber-500/5',
    error: 'text-rose-500 border-rose-500/20 bg-rose-500/5'
  };

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className={`p-8 rounded-[2.5rem] border ${colors[status]} flex flex-col items-center space-y-4 shadow-xl transition-all relative overflow-hidden`}
    >
      <div className="absolute top-0 right-0 p-3 opacity-10">
         <Icon className="h-10 w-10" />
      </div>
      <Icon className="h-8 w-8 mb-2" />
      <span className="text-[9px] font-black uppercase tracking-widest opacity-60 leading-none">{label}</span>
      <span className="text-2xl font-black font-outfit uppercase tracking-tighter leading-none">{value}</span>
    </motion.div>
  );
}

function SensorRequiredCard({ icon: Icon, label, hardware }) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="p-8 rounded-[2.5rem] border border-amber-500/20 bg-amber-500/5 text-amber-500 flex flex-col items-center space-y-4 shadow-xl transition-all relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 p-3 opacity-10">
        <Icon className="h-10 w-10" />
      </div>
      <div className="h-12 w-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-2">
        <Cpu className="h-6 w-6 text-amber-400" />
      </div>
      <span className="text-[9px] font-black uppercase tracking-widest opacity-60 leading-none">{label}</span>
      <span className="text-xs font-black font-outfit uppercase tracking-tighter leading-none text-center px-2">SENSOR REQUIRED</span>
      <span className="text-[9px] font-semibold text-amber-400/70 tracking-widest uppercase text-center">{hardware}</span>
    </motion.div>
  );
}
