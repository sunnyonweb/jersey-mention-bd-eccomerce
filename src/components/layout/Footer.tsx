import { FormEvent } from 'react';
import { Shirt, Phone, Mail, MapPin, ShieldCheck, Truck, RefreshCw, Send, Lock, MessageCircle } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { getWhatsAppLink } from '../../utils/whatsapp';

export default function Footer() {
  const { siteSettings, setActiveTab, setSelectedCategory, showToast } = useStore();

  const handleNewsletterSubmit = (e: FormEvent) => {
    e.preventDefault();
    showToast('Thank you! You are subscribed to Jersey Mention BD VIP drops and discounts.');
  };

  return (
    <footer className="bg-slate-950 text-slate-300 pt-16 pb-8 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Value Value Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pb-12 border-b border-slate-800">
          <div className="flex flex-col items-center text-center sm:flex-row sm:items-center sm:text-left gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="w-12 h-12 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Fast Home Delivery</h4>
              <p className="text-xs text-slate-400">Dhaka in 24-48 hrs, Outside Dhaka in 2-4 days</p>
            </div>
          </div>

          <div className="flex flex-col items-center text-center sm:flex-row sm:items-center sm:text-left gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="w-12 h-12 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">100% Authentic Quality</h4>
              <p className="text-xs text-slate-400">High-density silicone crest & AeroReady mesh</p>
            </div>
          </div>

          <div className="flex flex-col items-center text-center sm:flex-row sm:items-center sm:text-left gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="w-12 h-12 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <RefreshCw className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Easy 7-Day Exchange</h4>
              <p className="text-xs text-slate-400">Hassle-free size replacement policy</p>
            </div>
          </div>

          <div className="flex flex-col items-center text-center sm:flex-row sm:items-center sm:text-left gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="w-12 h-12 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Secure BD Gateways</h4>
              <p className="text-xs text-slate-400">bKash, Nagad, Rocket & Cards</p>
            </div>
          </div>
        </div>

        {/* Main Footer Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 py-12">
          
          {/* Brand Info */}
          <div className="lg:col-span-2 flex flex-col items-center md:items-start text-center md:text-left space-y-4">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <img
                src="/images/logo.png"
                alt="Jersey Mention BD"
                className="w-16 h-16 object-contain"
              />
              <span className="text-xl font-extrabold tracking-tight text-white">
                JERSEY<span className="text-emerald-500">MENTION</span>
                <span className="text-xs bg-red-600 text-white font-black px-1.5 py-0.5 rounded-xs ml-1">
                  BD
                </span>
              </span>
            </div>
            <p className="text-xs leading-relaxed text-slate-400">
              {siteSettings.aboutUsText}
            </p>

            <div className="space-y-2 text-xs text-slate-300 w-full flex flex-col items-center md:items-start">
              <p className="flex items-center justify-center md:justify-start gap-2 text-center md:text-left">
                <MapPin className="w-4 h-4 text-emerald-500 shrink-0" /> {siteSettings.address}
              </p>
              <a
                href={getWhatsAppLink(siteSettings.whatsappNumber)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center md:justify-start gap-2 text-center md:text-left hover:text-emerald-400 transition-colors"
              >
                <MessageCircle className="w-4 h-4 text-emerald-500 shrink-0" /> WhatsApp: {siteSettings.whatsappNumber || '01640581442'}
              </a>
              <p className="flex items-center justify-center md:justify-start gap-2 text-center md:text-left">
                <Phone className="w-4 h-4 text-emerald-500 shrink-0" /> Hotline: {siteSettings.contactPhone || '01640581442'}
              </p>
              <p className="flex items-center justify-center md:justify-start gap-2 text-center md:text-left">
                <Mail className="w-4 h-4 text-emerald-500 shrink-0" /> Email: {siteSettings.contactEmail}
              </p>
            </div>
          </div>

          {/* Categories Link */}
          <div className="text-center md:text-left">
            <h4 className="font-bold text-white text-sm uppercase tracking-wider mb-4 border-l-0 md:border-l-2 pl-0 md:pl-2">
              Popular Collections
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <button
                  onClick={() => {
                    setSelectedCategory('national-teams');
                    setActiveTab('catalog');
                  }}
                  className="hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  Bangladesh National Team 2026
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setSelectedCategory('club-football');
                    setActiveTab('catalog');
                  }}
                  className="hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  European Club Player Versions
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setSelectedCategory('custom-printed');
                    setActiveTab('catalog');
                  }}
                  className="hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  Custom Squad Printing
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setSelectedCategory('cricket-fan-wear');
                    setActiveTab('catalog');
                  }}
                  className="hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  Cricket Tigers Fan Apparel
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setSelectedCategory('retro-classics');
                    setActiveTab('catalog');
                  }}
                  className="hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  Retro 1990s Football Jerseys
                </button>
              </li>
            </ul>
          </div>

          {/* Help & Support */}
          <div className="text-center md:text-left">
            <h4 className="font-bold text-white text-sm uppercase tracking-wider mb-4 border-l-0 md:border-l-2 pl-0 md:pl-2">
              Customer Support
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <button
                  onClick={() => setActiveTab('order_tracking')}
                  className="hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  Track Order Status
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('profile')}
                  className="hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  My Account & Invoices
                </button>
              </li>
              <li>
                <span className="text-slate-500">Exchange & Return Policy</span>
              </li>
              <li>
                <span className="text-slate-500">Size & Fitting Guide</span>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="text-center md:text-left flex flex-col items-center md:items-start w-full">
            <h4 className="font-bold text-white text-sm uppercase tracking-wider mb-4 border-l-0 md:border-l-2 pl-0 md:pl-2 w-full text-center md:text-left">
              Jersey VIP Drops
            </h4>
            <p className="text-xs text-slate-400 mb-3 text-center md:text-left max-w-sm">
              Subscribe to get exclusive early access to new jersey launches & promo vouchers.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="space-y-2 w-full max-w-sm">
              <div className="relative">
                <input
                  type="email"
                  placeholder="Enter your email..."
                  required
                  className="w-full bg-slate-900 text-white placeholder-slate-500 text-xs px-3 py-2.5 rounded-lg border border-slate-800 focus:border-emerald-500 focus:outline-hidden"
                />
                <button
                  type="submit"
                  className="absolute right-1 top-1 bottom-1 bg-emerald-600 hover:bg-emerald-500 text-white px-3 rounded-md text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Payment Gateways Bar */}
        <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
            <span className="text-xs text-slate-500 font-semibold mr-2 text-center">Supported Payment Gateways:</span>
            <span className="bg-pink-600 text-white text-[10px] font-black px-2 py-1 rounded-sm tracking-wider">bKash</span>
            <span className="bg-orange-600 text-white text-[10px] font-black px-2 py-1 rounded-sm tracking-wider">Nagad</span>
            <span className="bg-purple-700 text-white text-[10px] font-black px-2 py-1 rounded-sm tracking-wider">Rocket</span>
            <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-1 rounded-sm tracking-wider">SSLCommerz</span>
            <span className="bg-indigo-600 text-white text-[10px] font-black px-2 py-1 rounded-sm tracking-wider">Stripe</span>
          </div>

          <p className="text-xs text-slate-500 text-center md:text-left">
            © 2026 Jersey Mention BD. All rights reserved. Developed by{' '}
            <a href="https://sunny-talukder.vercel.app/" target="_blank" rel="noopener noreferrer" className="font-bold text-emerald-600 hover:text-emerald-500">
              Sunny Talukder
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
