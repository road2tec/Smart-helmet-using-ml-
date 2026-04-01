import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, ArrowRight, Loader, Zap, Key, Mail } from 'lucide-react';
import { authService } from '../services/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authService.login({ email, password });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'CRITICAL: Authentication Relay Failure.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans text-slate-900 selection:bg-primary-500 selection:text-white">
      {/* Background Graphic elements */}
      <div className="absolute top-0 right-0 -mr-40 mt-10 w-[600px] h-[600px] bg-primary-600/5 rounded-full blur-[120px] opacity-40"></div>
      <div className="absolute bottom-0 left-0 -ml-40 mb-10 w-[800px] h-[800px] bg-indigo-600/5 rounded-full blur-[150px] opacity-40"></div>
      <div className="absolute inset-0 bg-grid-slate-900/[0.02] bg-[size:50px_50px]"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4"
      >
        <Link to="/" className="flex justify-center items-center group cursor-pointer mb-10">
           <div className="flex items-center justify-center p-4 rounded-2xl bg-white border border-slate-100 shadow-2xl group-hover:scale-110 transition-transform duration-500 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary-600/5 to-indigo-600/5"></div>
              <ShieldCheck className="h-10 w-10 text-primary-600 relative z-10" />
           </div>
        </Link>
        <div className="text-center">
          <h2 className="text-4xl font-black text-slate-950 font-outfit tracking-tighter uppercase leading-[0.8] mb-2">
            Operator <span className="text-primary-600">Access</span>
          </h2>
          <p className="mt-4 text-[10px] text-slate-400 font-black uppercase tracking-[0.3em]">
            System Initialization Sequence
          </p>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="mt-12 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4"
      >
        <div className="bg-white/80 backdrop-blur-2xl py-12 px-8 sm:px-12 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] rounded-[2.5rem] border border-white relative overflow-hidden">
          {/* HUD Corner accents */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary-500/10 rounded-tl-3xl"></div>
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary-500/10 rounded-br-3xl"></div>

          <form className="space-y-8" onSubmit={handleLogin}>
            {error && (
               <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-rose-500/5 text-rose-500 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center border border-rose-500/10"
              >
                  {error}
               </motion.div>
            )}
            
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Communication Link (Email)</label>
              <div className="relative group">
                 <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-slate-900 placeholder-slate-300 outline-none focus:border-primary-500/50 focus:ring-4 focus:ring-primary-500/5 transition-all text-sm font-bold"
                  placeholder="operator@smartcore.sys"
                />
                <Mail className="absolute right-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-200 group-focus-within:text-primary-500 transition-colors" />
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Access Key (Password)</label>
              <div className="relative group">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-slate-900 placeholder-slate-300 outline-none focus:border-primary-500/50 focus:ring-4 focus:ring-primary-500/5 transition-all text-sm font-bold"
                  placeholder="••••••••"
                />
                <Key className="absolute right-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-200 group-focus-within:text-primary-500 transition-colors" />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="group w-full relative h-16 rounded-2xl bg-slate-950 text-white font-black uppercase tracking-[0.2em] text-[11px] transition-all overflow-hidden shadow-2xl shadow-slate-900/40 active:scale-95"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative z-10 flex items-center justify-center">
                  {loading ? <Loader className="animate-spin h-5 w-5 text-white" /> : (
                    <>ENGAGE PROTOCOL <ArrowRight className="ml-3 h-4 w-4 group-hover:translate-x-1 transition-transform" /></>
                  )}
                </div>
              </button>
            </div>
          </form>

          <div className="mt-12 text-center">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">New Node?</span>
             <Link to="/register" className="text-[10px] font-black text-primary-600 uppercase tracking-[0.2em] hover:text-slate-950 transition-colors border-b border-primary-500/30">
                Initialize Setup
             </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
