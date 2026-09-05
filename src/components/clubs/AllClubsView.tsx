import { Trophy } from 'lucide-react';
import { useStore } from '../../store/useStore';

export default function AllClubsView() {
  const { categories, navigateTo } = useStore();

  // Get active clubs
  const activeClubs = categories.filter(
    (c) => c.parentId === 'cat-clubs' && c.isActive
  );

  return (
    <section className="py-16 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Page Heading */}
        <div className="text-center mb-12 space-y-3">
          <span className="text-xs font-black text-emerald-600 uppercase tracking-widest bg-emerald-100/80 px-3.5 py-1.5 rounded-full">
            BD Jersey Shop
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            ALL FOOTBALL CLUBS
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
            Browse our full list of {activeClubs.length} active football clubs. Choose your favorite team to see their player, fan, and retro kits.
          </p>
        </div>

        {activeClubs.length === 0 ? (
          <div className="text-center py-16 bg-white border border-slate-200 rounded-3xl p-8 max-w-md mx-auto shadow-xs">
            <span className="text-4xl">⚽</span>
            <h3 className="font-extrabold text-slate-900 text-sm mt-3 uppercase">No Clubs Available</h3>
            <p className="text-xs text-slate-500 mt-1">Please add active clubs from the admin dashboard.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {activeClubs.map((club) => {
              // Generate dynamic initial or abbreviation
              const abbreviation = club.name
                .split(' ')
                .map((word) => word[0])
                .join('')
                .toUpperCase()
                .slice(0, 3);

              return (
                <div
                  key={club.id}
                  onClick={() => navigateTo(`/clubs/${club.slug}`)}
                  className="group flex flex-col items-center justify-center p-5 bg-white border border-slate-200 rounded-3xl hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 cursor-pointer shadow-xs"
                >
                  {/* Dynamic Logo/Image Circle */}
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-white font-extrabold text-xs bg-gradient-to-br from-emerald-600 to-slate-900 shadow-inner border border-slate-100 overflow-hidden relative">
                    {club.image ? (
                      <img
                        src={club.image}
                        alt={club.name}
                        className="w-full h-full object-contain p-2 group-hover:scale-110 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          // Fallback to text initials if image fails
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center">
                        <Trophy className="w-4 h-4 text-emerald-400 mb-1" />
                        <span className="text-xs tracking-wider font-black">{abbreviation}</span>
                      </div>
                    )}
                  </div>

                  {/* Club Name */}
                  <h3 className="text-xs sm:text-sm font-black text-slate-800 text-center tracking-wide group-hover:text-emerald-600 transition-colors mt-4 line-clamp-2 uppercase">
                    {club.name}
                  </h3>
                  
                  {/* Active Badge */}
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                    Explore Kits →
                  </span>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </section>
  );
}
