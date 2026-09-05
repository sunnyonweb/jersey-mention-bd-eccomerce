import { useStore } from '../../store/useStore';

export default function SeoContent() {
  const { siteSettings } = useStore();

  const seoSection1Title = siteSettings.seoSection1Title || "Jersey Mention BD — Your Trusted Football Jersey Store in Bangladesh";
  const seoSection1Text = siteSettings.seoSection1Text || "Welcome to Jersey Mention BD, the premier online destination for premium football jerseys in Bangladesh. Whether you are looking for high-performance player version kits or comfortable fan sportswear, we have you covered. Our catalog features an extensive collection of authentic club jerseys and national team jerseys designed to show your squad passion on and off the field. Discover top-tier Player Edition jerseys built with breathable athletic mesh, Fan Edition jerseys for casual daily wear, and timeless classic retro jerseys from iconic footballing eras.";
  const seoSection2Title = siteSettings.seoSection2Title || "Buy Football Jerseys & Sportswear Online in Bangladesh";
  const seoSection2Text = siteSettings.seoSection2Text || "Ready to gear up for the match? When you want to buy football jersey online Bangladesh has never had a more reliable store. We make it easy to order authentic football shirts, club jerseys, and national team kits directly to your doorstep. Choose from the premium detailing of our Player Edition or the relaxed comfort of the Fan Edition and Retro Edition kits. Each kit offers outstanding breathability, high-durability sublimation print graphics, and comfortable sizing suited for active play.";

  const isDefault1 = seoSection1Title.includes("Your Trusted Football");
  const isDefault2 = seoSection2Title.includes("Buy Football Jerseys");

  return (
    <section className="py-12 bg-slate-50 border-t border-slate-205 text-slate-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Section 1 */}
        <div className="space-y-3">
          <h2 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight">
            {seoSection1Title}
          </h2>
          {isDefault1 ? (
            <>
              <p className="text-xs leading-relaxed text-slate-600 font-medium">
                Welcome to <strong>Jersey Mention BD</strong>, the premier online destination for premium <strong>football jerseys in Bangladesh</strong>. Whether you are looking for high-performance player version kits or comfortable fan sportswear, we have you covered. Our catalog features an extensive collection of authentic <strong>club jerseys</strong> and <strong>national team jerseys</strong> designed to show your squad passion on and off the field. Discover top-tier <strong>Player Edition</strong> jerseys built with breathable athletic mesh, <strong>Fan Edition</strong> jerseys for casual daily wear, and timeless classic <strong>retro jerseys</strong> from iconic footballing eras.
              </p>
              <p className="text-xs leading-relaxed text-slate-600 font-medium">
                We feature kits for all popular football clubs including <strong>Real Madrid</strong>, <strong>Barcelona</strong>, <strong>Manchester City</strong>, <strong>Manchester United</strong>, <strong>Liverpool</strong>, <strong>Arsenal</strong>, <strong>PSG</strong>, and <strong>Bayern Munich</strong>. Beyond football kits, Jersey Mention BD offers a wide range of athletic sportswear and lifestyle apparel. Browse our collection of matching <strong>caps</strong>, comfortable casual <strong>T-shirts</strong>, semi-formal <strong>polo shirts</strong>, training <strong>tank tops</strong>, and lightweight athletic <strong>trousers</strong> perfect for active training sessions or weekend street styles.
              </p>
            </>
          ) : (
            <p className="text-xs leading-relaxed text-slate-600 font-medium whitespace-pre-wrap">
              {seoSection1Text}
            </p>
          )}
        </div>

        {/* Section 2 */}
        <div className="space-y-3">
          <h2 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight">
            {seoSection2Title}
          </h2>
          {isDefault2 ? (
            <>
              <p className="text-xs leading-relaxed text-slate-600 font-medium">
                Ready to gear up for the match? When you want to <strong>buy football jersey online Bangladesh</strong> has never had a more reliable store. We make it easy to order authentic <strong>football shirts</strong>, club jerseys, and national team kits directly to your doorstep. Choose from the premium detailing of our <strong>Player Edition</strong> or the relaxed comfort of the <strong>Fan Edition</strong> and <strong>Retro Edition</strong> kits. Each kit offers outstanding breathability, high-durability sublimation print graphics, and comfortable sizing suited for active play.
              </p>
              <p className="text-xs leading-relaxed text-slate-600 font-medium">
                Explore our curated <strong>football sportswear Bangladesh</strong> collection, featuring complete squad kits, <strong>caps</strong>, <strong>t-shirts</strong>, <strong>polo shirts</strong>, <strong>tank tops</strong>, and track <strong>trousers</strong>. From intense match-day play to casual weekend hangouts, find the perfect blend of style and durability. Enjoy fast home delivery inside Dhaka, secure nationwide cash on delivery, and our customer-friendly exchange policy.
              </p>
            </>
          ) : (
            <p className="text-xs leading-relaxed text-slate-600 font-medium whitespace-pre-wrap">
              {seoSection2Text}
            </p>
          )}
        </div>

      </div>
    </section>
  );
}
