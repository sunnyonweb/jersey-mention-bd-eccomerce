import { useRef, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Trophy, Globe } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { Category } from '../../types';

export default function PopularCategories() {
  const { categories, navigateTo } = useStore();
  const [selectedType, setSelectedType] = useState<'club' | 'national'>('club');
  const scrollRef = useRef<HTMLDivElement>(null);
  const isPaused = useRef(false);

  // Filter dynamic teams based on selected type and ensure unique IDs and featured status
  const activeTeams = categories
    .filter(
      (c) =>
        c.parentId === (selectedType === 'club' ? 'cat-clubs' : 'cat-national-teams') &&
        c.isActive &&
        c.featured !== false
    )
    .filter((value, index, self) => self.findIndex((c) => c.id === value.id) === index);

  const defaultTeamStyles: Record<
    string,
    { gradient: string; textColor: string; borderColor: string; shadowColor: string; abbrev: string }
  > = {
    // Clubs
    'real-madrid': { gradient: 'from-slate-900 to-slate-950', textColor: 'text-amber-400', borderColor: 'hover:border-amber-405', shadowColor: 'hover:shadow-amber-400/20', abbrev: 'RMA' },
    'barcelona': { gradient: 'from-rose-900 to-blue-900', textColor: 'text-amber-300', borderColor: 'hover:border-rose-500', shadowColor: 'hover:shadow-rose-500/20', abbrev: 'FCB' },
    'manchester-united': { gradient: 'from-red-655 to-slate-900', textColor: 'text-yellow-400', borderColor: 'hover:border-red-550', shadowColor: 'hover:shadow-red-550/20', abbrev: 'MUFC' },
    'liverpool': { gradient: 'from-red-700 to-rose-900', textColor: 'text-amber-400', borderColor: 'hover:border-red-600', shadowColor: 'hover:shadow-red-600/20', abbrev: 'LFC' },
    'arsenal': { gradient: 'from-red-600 to-red-800', textColor: 'text-white', borderColor: 'hover:border-red-500', shadowColor: 'hover:shadow-red-500/20', abbrev: 'AFC' },
    'chelsea': { gradient: 'from-blue-700 to-blue-900', textColor: 'text-white', borderColor: 'hover:border-blue-650', shadowColor: 'hover:shadow-blue-600/20', abbrev: 'CFC' },
    'psg': { gradient: 'from-blue-955 via-red-800 to-blue-955', textColor: 'text-white', borderColor: 'hover:border-blue-900', shadowColor: 'hover:shadow-blue-900/20', abbrev: 'PSG' },
    'bayern-munich': { gradient: 'from-red-700 to-red-900', textColor: 'text-white', borderColor: 'hover:border-red-600', shadowColor: 'hover:shadow-red-600/20', abbrev: 'FCB' },
    'inter-miami': { gradient: 'from-pink-400 to-slate-955', textColor: 'text-pink-200', borderColor: 'hover:border-pink-400', shadowColor: 'hover:shadow-pink-400/20', abbrev: 'IMFC' },
    'juventus': { gradient: 'from-slate-900 to-slate-800', textColor: 'text-white', borderColor: 'hover:border-slate-800', shadowColor: 'hover:shadow-slate-850/20', abbrev: 'JUVE' },
    // National Teams
    'brazil': { gradient: 'from-yellow-400 to-green-600', textColor: 'text-blue-900', borderColor: 'hover:border-yellow-500', shadowColor: 'hover:shadow-yellow-500/20', abbrev: 'BRA' },
    'argentina': { gradient: 'from-sky-300 via-white to-sky-400', textColor: 'text-amber-500', borderColor: 'hover:border-sky-400', shadowColor: 'hover:shadow-sky-400/20', abbrev: 'ARG' },
    'france': { gradient: 'from-blue-800 via-white to-red-600', textColor: 'text-slate-900', borderColor: 'hover:border-blue-800', shadowColor: 'hover:shadow-blue-800/20', abbrev: 'FRA' },
    'germany': { gradient: 'from-slate-955 via-red-655 to-yellow-500', textColor: 'text-white', borderColor: 'hover:border-slate-955', shadowColor: 'hover:shadow-slate-955/20', abbrev: 'GER' },
    'spain': { gradient: 'from-red-600 to-yellow-500', textColor: 'text-white', borderColor: 'hover:border-red-500', shadowColor: 'hover:shadow-red-500/20', abbrev: 'ESP' },
    'portugal': { gradient: 'from-red-700 to-green-800', textColor: 'text-yellow-400', borderColor: 'hover:border-red-750', shadowColor: 'hover:shadow-red-750/20', abbrev: 'POR' },
    'england': { gradient: 'from-white to-slate-100', textColor: 'text-red-600', borderColor: 'hover:border-red-500', shadowColor: 'hover:shadow-red-500/20', abbrev: 'ENG' }
  };

  useEffect(() => {
    const handleAutoPlay = () => {
      if (isPaused.current) return;
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        if (scrollLeft + clientWidth >= scrollWidth - 25) {
          scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          const stepSize = window.innerWidth < 640 ? 136 : 174;
          scrollRef.current.scrollBy({ left: stepSize, behavior: 'smooth' });
        }
      }
    };

    const interval = setInterval(handleAutoPlay, 3500);
    return () => clearInterval(interval);
  }, []);

  // Recalculate slider alignment if type toggles
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ left: 0 });
    }
  }, [selectedType]);

  const handleTeamClick = (team: Category) => {
    const basePath = selectedType === 'club' ? '/clubs' : '/national-teams';
    navigateTo(`${basePath}/${team.slug}`);
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollAmount = clientWidth * 0.75;
      const targetScroll = direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount;
      scrollRef.current.scrollTo({ left: targetScroll, behavior: 'smooth' });
    }
  };

  return (
    <section className="py-16 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Centered Heading */}
        <div className="text-center mb-6 space-y-2">
          <span className="text-xs font-black text-emerald-600 uppercase tracking-widest bg-emerald-100/80 px-3 py-1 rounded-full">
            Represent Your Colors
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase">
            Shop Club & National Kits
          </h2>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center justify-center mb-10">
          <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
            <button
              onClick={() => setSelectedType('club')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer border-none ${
                selectedType === 'club'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-655 hover:text-slate-900 hover:bg-slate-50 bg-transparent'
              }`}
            >
              <Trophy className="w-3.5 h-3.5 shrink-0" />
              <span>Clubs</span>
            </button>
            <button
              onClick={() => setSelectedType('national')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer border-none ${
                selectedType === 'national'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-655 hover:text-slate-900 hover:bg-slate-50 bg-transparent'
              }`}
            >
              <Globe className="w-3.5 h-3.5 shrink-0" />
              <span>National Teams</span>
            </button>
          </div>
        </div>

        {/* Carousel Wrapper */}
        <div className="relative group">
          
          {/* Scroll Buttons */}
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 bg-white/95 text-slate-700 w-11 h-11 rounded-full items-center justify-center shadow-lg border border-slate-250 z-20 hover:scale-105 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-350 transition-all cursor-pointer hidden md:flex animate-in fade-in"
            aria-label="Scroll Left"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 bg-white/95 text-slate-700 w-11 h-11 rounded-full items-center justify-center shadow-lg border border-slate-250 z-20 hover:scale-105 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-350 transition-all cursor-pointer hidden md:flex animate-in fade-in"
            aria-label="Scroll Right"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Horizontal Scrollable Container */}
          <div
            ref={scrollRef}
            onMouseEnter={() => { isPaused.current = true; }}
            onMouseLeave={() => { isPaused.current = false; }}
            onTouchStart={() => { isPaused.current = true; }}
            onTouchEnd={() => {
              setTimeout(() => {
                isPaused.current = false;
              }, 3000);
            }}
            className="flex gap-4 sm:gap-6 overflow-x-auto scrollbar-none snap-x snap-mandatory scroll-smooth pb-6 px-1"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {activeTeams.length === 0 ? (
              <div className="w-full text-center py-8 text-slate-400 font-bold">
                No active teams seeded under this section.
              </div>
            ) : (
              activeTeams.map((team) => {
                // Resolve styling details
                const style = defaultTeamStyles[team.slug] || {
                  gradient: 'from-emerald-600 to-teal-800',
                  textColor: 'text-white',
                  borderColor: 'hover:border-emerald-500',
                  shadowColor: 'hover:shadow-emerald-500/20',
                  abbrev: team.name
                    .split(' ')
                    .map((word) => word[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 3)
                };

                return (
                  <div
                    key={team.id}
                    onClick={() => handleTeamClick(team)}
                    className={`group shrink-0 flex flex-col items-center justify-center snap-center w-[120px] sm:w-[150px] p-4 sm:p-5 bg-white border border-slate-200/70 rounded-2xl sm:rounded-3xl transition-all duration-300 cursor-pointer shadow-xs hover:shadow-xl hover:-translate-y-1.5 ${style.borderColor} ${style.shadowColor}`}
                  >
                    {/* Badge Circle container */}
                    <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex flex-col items-center justify-center text-white font-extrabold text-[11px] sm:text-xs bg-gradient-to-br ${style.gradient} shadow-inner relative border border-white/10 overflow-hidden`}>
                      {team.image ? (
                        <img
                          src={team.image}
                          alt={team.name}
                          className="w-full h-full object-contain p-2"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <>
                          {/* Floating mini icon */}
                          <Trophy className="w-4.5 h-4.5 text-emerald-400 mb-1 drop-shadow-md shrink-0" />
                          
                          {/* Team Abbrev */}
                          <span className={`${style.textColor} tracking-wider font-black`}>
                            {style.abbrev}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Team Name */}
                    <h3 className="text-[11px] sm:text-xs font-black text-slate-700 text-center tracking-wide group-hover:text-emerald-600 transition-colors mt-3 line-clamp-2 uppercase">
                      {team.name}
                    </h3>
                  </div>
                );
              })
            )}
          </div>

        </div>

      </div>
    </section>
  );
}
