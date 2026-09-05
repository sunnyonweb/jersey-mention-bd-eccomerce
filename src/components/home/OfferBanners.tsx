import { ArrowRight, Sparkles } from 'lucide-react';
import { useStore } from '../../store/useStore';

export default function OfferBanners() {
  const { setSelectedCategory, setActiveTab } = useStore();

  return (
    <section className="py-12 bg-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Banner 1 */}
          <div className="relative rounded-3xl overflow-hidden bg-slate-900 text-white min-h-[260px] flex flex-col justify-between p-8 group border border-slate-800 shadow-md">
            <img
              src="https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=1000&q=80"
              alt="Cricket Tigers Fan Zone"
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover opacity-45 group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/70 to-transparent" />

            <div className="relative z-10">
              <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-400 font-extrabold text-[10px] px-3 py-1 rounded-full border border-emerald-500/30">
                <Sparkles className="w-3 h-3" /> BPL & TIGERS FAN ZONE
              </span>
              <h3 className="text-2xl font-black mt-3 text-white">
                CRICKET TIGERS POLO SHIRTS
              </h3>
              <p className="text-xs text-slate-300 mt-1 max-w-sm">
                Get 15% instant discount on authentic Bangladesh Cricket Tigers supporter polo jerseys with zip collar.
              </p>
            </div>

            <div className="relative z-10 pt-4">
              <button
                onClick={() => {
                  setSelectedCategory('cricket-fan-wear');
                  setActiveTab('catalog');
                }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-5 py-2.5 rounded-full transition-all flex items-center gap-2 cursor-pointer shadow-md"
              >
                <span>SHOP TIGERS APPAREL</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Banner 2 */}
          <div className="relative rounded-3xl overflow-hidden bg-slate-900 text-white min-h-[260px] flex flex-col justify-between p-8 group border border-slate-800 shadow-md">
            <img
              src="https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1000&q=80"
              alt="Retro Classics"
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover opacity-45 group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/70 to-transparent" />

            <div className="relative z-10">
              <span className="inline-flex items-center gap-1 bg-amber-500/20 text-amber-400 font-extrabold text-[10px] px-3 py-1 rounded-full border border-amber-500/30">
                <Sparkles className="w-3 h-3" /> 1990s VINTAGE CLASSICS
              </span>
              <h3 className="text-2xl font-black mt-3 text-white">
                RETRO COLLAR LEGENDS
              </h3>
              <p className="text-xs text-slate-300 mt-1 max-w-sm">
                Step back into football history with turn-down collar classics: Beckham 1999, Ronaldo 1998, Zidane 2002.
              </p>
            </div>

            <div className="relative z-10 pt-4">
              <button
                onClick={() => {
                  setSelectedCategory('retro-classics');
                  setActiveTab('catalog');
                }}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs px-5 py-2.5 rounded-full transition-all flex items-center gap-2 cursor-pointer shadow-md"
              >
                <span>DISCOVER RETRO JERSEYS</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
