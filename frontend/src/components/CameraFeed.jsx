import { useEffect, useRef, useState } from 'react';
import { Video, ShieldAlert, MonitorPlay, Activity } from 'lucide-react';

export default function CameraFeed({ isBlocked }) {
  const videoRef = useRef(null);
  const [isStreaming, setIsStreaming] = useState(false);

  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setIsStreaming(true);
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        setIsStreaming(false);
      }
    }

    startCamera();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className={`relative overflow-hidden rounded-2xl shadow-2xl bg-slate-900 border-2 transition-colors duration-500 flex flex-col items-center justify-center ${isBlocked ? 'border-red-500 shadow-red-500/20' : 'border-success shadow-success/20'}`}>
      
      {/* Top Bar overlays */}
      <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center z-10 bg-gradient-to-b from-slate-900/80 to-transparent">
         <div className="flex items-center space-x-2 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
           <div className={`w-2.5 h-2.5 rounded-full ${isStreaming ? 'bg-red-500 animate-pulse' : 'bg-slate-500'}`}></div>
           <span className="text-white text-xs font-semibold uppercase tracking-wider">Live Feed REC</span>
         </div>
         
         {isBlocked && (
           <div className="bg-red-500/90 text-white px-4 py-1.5 rounded-full text-sm font-bold flex items-center shadow-[0_0_15px_rgba(239,68,68,0.5)]">
             <ShieldAlert className="w-4 h-4 mr-2" />
             SYSTEM BLOCKED
           </div>
         )}
      </div>

      {!isStreaming ? (
         <div className="h-64 md:h-96 w-full flex flex-col items-center justify-center text-slate-500">
            <MonitorPlay className="h-16 w-16 mb-4 opacity-50" />
            <p>Initializing Camera Feed...</p>
            <p className="text-xs mt-2">Please ensure camera permissions are granted.</p>
         </div>
      ) : (
         <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          className="w-full h-auto object-cover md:h-[500px]"
        />
      )}

      {/* Crosshair Overlay */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-30">
         <div className="w-64 h-64 border border-white rounded-3xl"></div>
         <div className="absolute text-white">
           <Activity className="h-24 w-24 opacity-50" />
         </div>
      </div>
    </div>
  );
}
