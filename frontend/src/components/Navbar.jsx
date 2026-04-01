import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Camera, ShieldCheck, MapPin, Menu, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Features', path: '/features' },
    { name: 'Technology', path: '/technology' },
    { name: 'About', path: '/about' },
  ];

  const isLanding = location.pathname === '/';

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed w-full z-[9999] transition-all duration-500 font-sans ${
        (!isLanding || scrolled) 
          ? 'bg-slate-950 border-b border-white/5 py-5 shadow-2xl' 
          : 'bg-transparent py-8'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0 flex items-center cursor-pointer group">
            <div className="flex items-center justify-center h-12 w-12 rounded-2xl bg-slate-900 border border-white/10 text-white shadow-xl group-hover:scale-110 transition-transform duration-500 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <ShieldCheck className="h-7 w-7 relative z-10" />
            </div>
            <div className="ml-4 flex flex-col">
              <span className="font-outfit font-black text-2xl tracking-tighter leading-none text-white">
                SMART<span className="text-primary-500">CORE</span>
              </span>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 leading-none mt-1">Safety Interface v1.1.0</span>
            </div>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex space-x-10 items-center">
            {navLinks.map((item) => (
              <Link 
                key={item.name}
                to={item.path} 
                className={`text-slate-500 hover:text-white font-black uppercase tracking-widest text-[11px] transition-all hover:translate-y-[-2px] ${location.pathname === item.path ? 'text-primary-500' : ''}`}
              >
                {item.name}
              </Link>
            ))}
            <div className="h-6 border-l border-white/10 mx-2"></div>
            <Link to="/login" className="text-slate-400 hover:text-primary-500 font-black uppercase tracking-widest text-[11px] transition-all hover:translate-y-[-2px]">
              Access Key
            </Link>
            <Link to="/register" className="group px-6 py-3.5 rounded-2xl bg-slate-900 text-white border border-white/10 font-black uppercase tracking-[0.1em] text-[11px] hover:bg-primary-600 transition-all shadow-xl hover:shadow-primary-500/30 flex items-center overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <span className="relative z-10">Initialize System</span>
              <ChevronRight className="ml-2 h-4 w-4 relative z-10 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-white p-2 rounded-xl bg-slate-900 border border-white/10 hover:bg-slate-800 transition-colors"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-slate-950 border-b border-white/5 overflow-hidden font-sans"
          >
            <div className="px-6 py-8 space-y-6">
              {navLinks.map((item) => (
                <Link 
                  key={item.name}
                  to={item.path} 
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-white font-black uppercase tracking-widest text-[12px] opacity-70 hover:opacity-100"
                >
                  {item.name}
                </Link>
              ))}
              <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="block text-white font-black uppercase tracking-widest text-[12px]">Login</Link>
              <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="block px-6 py-4 rounded-2xl bg-slate-900 border border-white/10 text-white font-black uppercase tracking-widest text-[12px] text-center shadow-lg">
                Initialize System
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
