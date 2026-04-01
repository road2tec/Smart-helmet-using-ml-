import { Link } from 'react-router-dom';
import { ShieldCheck, Mail, Globe, Github, Twitter, Heart } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-950 text-slate-500 py-16 border-t border-white/5 font-sans relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-primary-600/5 blur-[120px] rounded-full"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="flex items-center mb-6 border-none">
              <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-slate-900 border border-white/10 text-white shadow-xl">
                 <ShieldCheck className="h-6 w-6" />
              </div>
              <span className="ml-3 font-outfit font-black text-2xl text-white tracking-tighter">SMART<span className="text-primary-500">CORE</span></span>
            </Link>
            <p className="text-sm font-medium leading-relaxed max-w-sm mb-6">
               Developing the world's most advanced AI-integrated motorcycle safety ecosystem. Protecting riders through vision intelligence and hardware interlocks.
            </p>
            <div className="flex items-center space-x-4">
               {[Mail, Globe, Github, Twitter].map((Icon, idx) => (
                  <button key={idx} className="p-3 bg-slate-900 border border-white/5 rounded-xl hover:bg-primary-500 hover:text-white transition-all">
                     <Icon className="h-4 w-4" />
                  </button>
               ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white font-black uppercase tracking-widest text-[10px] mb-6">Explore Nodes</h4>
            <div className="flex flex-col space-y-4">
              {['Features', 'Technology', 'About Us', 'Dashboard'].map((link) => (
                <Link key={link} to={`/${link.toLowerCase().replace(' ', '')}`} className="text-sm font-bold hover:text-primary-400 transition-colors">
                  {link}
                </Link>
              ))}
            </div>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white font-black uppercase tracking-widest text-[10px] mb-6">Security Layer</h4>
            <div className="flex flex-col space-y-4">
              {['Privacy Protocol', 'AI Ethics', 'Hardware Warranty', 'Terms of Use'].map((link) => (
                <button key={link} className="text-left text-sm font-bold hover:text-primary-400 transition-colors">
                  {link}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 uppercase tracking-[0.2em] font-black text-[9px]">
           <p>&copy; {currentYear} Smart AI Safety Core. Intelligence Locked In.</p>
           <div className="flex items-center space-x-2">
              <span>Made with</span>
              <Heart className="h-3 w-3 text-red-500 animate-pulse" />
              <span>for Global Rider Safety</span>
           </div>
        </div>
      </div>
    </footer>
  );
}
