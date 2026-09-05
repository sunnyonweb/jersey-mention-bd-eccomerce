import { Star, Quote, CheckCircle2 } from 'lucide-react';

export default function Testimonials() {
  const reviews = [
    {
      id: '1',
      name: 'Tanvir Ahmed',
      location: 'Uttara, Dhaka',
      role: 'Verified Customer',
      rating: 5,
      comment: 'Extremely impressed with the Player Version BD Jersey quality! The silicone crest is top notch and the custom print "TANVIR #10" looks 100% official. Delivered in less than 24 hours in Dhaka.',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
      jersey: 'Bangladesh National Team 2026 Home'
    },
    {
      id: '2',
      name: 'Rafiqul Islam',
      location: 'Chittagong',
      role: 'Verified Customer',
      rating: 5,
      comment: 'Ordered Real Madrid Home kit. High quality heat-sealed crest and breathable UCL patch. Very friendly customer service on WhatsApp.',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
      jersey: 'Real Madrid Player Version 2025/26'
    },
    {
      id: '3',
      name: 'Sabbir Hossain',
      location: 'Dhanmondi, Dhaka',
      role: 'Verified Customer',
      rating: 5,
      comment: 'The 1999 Manchester United Retro kit turn-down collar is exact retro perfection. Paid via bKash instantly and received tracking updates step-by-step.',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80',
      jersey: '1999 Treble Man Utd Retro Classic'
    }
  ];

  return (
    <section className="py-16 bg-slate-50 border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <span className="text-xs font-black text-emerald-600 uppercase tracking-widest bg-emerald-100 px-3 py-1 rounded-full">
            Customer Feedback
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            WHAT FANS SAY ABOUT JERSEY MENTION BD
          </h2>
          <p className="text-xs text-slate-500">
            Over 12,000+ happy sports enthusiasts and football supporters across Bangladesh.
          </p>
        </div>

        {/* Testimonial Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-4 relative"
            >
              <Quote className="w-8 h-8 text-emerald-100 absolute top-4 right-4 -z-0" />

              <div className="space-y-3 relative z-10">
                <div className="flex items-center gap-1 text-amber-400">
                  {[...Array(rev.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>

                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  "{rev.comment}"
                </p>

                <div className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2.5 py-1 rounded-md inline-block">
                  Purchased: {rev.jersey}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <img
                  src={rev.avatar}
                  alt={rev.name}
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 rounded-full object-cover border-2 border-emerald-500"
                />
                <div>
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1">
                    {rev.name}
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  </h4>
                  <p className="text-[10px] text-slate-400">{rev.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
