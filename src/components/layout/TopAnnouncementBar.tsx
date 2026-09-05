import { Phone, MessageCircle, Truck, Sparkles } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { getWhatsAppLink } from '../../utils/whatsapp';

export default function TopAnnouncementBar() {
  const { siteSettings, setActiveTab } = useStore();

  return (
    <div className="bg-slate-900 text-slate-100 text-xs py-2 px-4 border-b border-slate-800">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1 text-emerald-400 font-medium">
            <Truck className="w-3.5 h-3.5" />
            Free Express Shipping on Orders Over ৳{siteSettings.freeShippingThreshold}!
          </span>
          <span className="hidden sm:inline text-slate-500">|</span>
          <span className="hidden sm:inline-flex items-center gap-1 text-slate-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Official Matchday Player Versions 2026
          </span>
        </div>

        <div className="flex items-center gap-4 text-slate-300">
          <a
            href={getWhatsAppLink(siteSettings.whatsappNumber)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-emerald-400 transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5 text-emerald-500" />
            WhatsApp: {siteSettings.whatsappNumber || '01640581442'}
          </a>
          <span className="text-slate-700">|</span>
          <a
            href={`tel:${siteSettings.contactPhone.replace(/[^0-9+]/g, '')}`}
            className="flex items-center gap-1 hover:text-white transition-colors"
          >
            <Phone className="w-3.5 h-3.5 text-blue-400" />
            Hotline: {siteSettings.contactPhone}
          </a>
          <span className="text-slate-700">|</span>
          <button
            onClick={() => setActiveTab('order_tracking')}
            className="hover:text-amber-400 font-medium underline underline-offset-2 transition-colors cursor-pointer"
          >
            Track Order
          </button>
        </div>
      </div>
    </div>
  );
}
