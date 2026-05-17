import { motion } from 'motion/react';
import { Star, MapPin, CheckCircle2, Clock, Info, ArrowRight, ShieldCheck, TrendingUp, Zap } from 'lucide-react';
import { useState } from 'react';
import { transformMatchData, MatchViewData, ProviderCardData } from '../lib/transformer';
import { BookingPayload } from './BookingView';
import { AppLanguage } from '../App';
import { getUserProfile } from '../lib/profile';

interface MatchViewProps { data?: any; onBook?: (payload: BookingPayload) => void; appLanguage: AppLanguage; onSearchAgain: () => void; }
interface ProviderCardProps { key?: number | string; provider: ProviderCardData; isSelectedSlot: (slot: string) => boolean; onSelectSlot: (slot: string) => void; onBook: (provider: ProviderCardData) => void; isTopMatch?: boolean; appLanguage: AppLanguage; }

function ProviderCard({ provider, isSelectedSlot, onSelectSlot, onBook, isTopMatch, appLanguage }: ProviderCardProps) {
  const translations = {
    english: { reviews: 'reviews', score: 'Score', startsFrom: 'Starts From', earliestSlot: 'Earliest Slot', trust: 'Trust & Quality Scores', pickTime: 'Pick a Time Slot' },
    urdu: { reviews: 'تبصرے', score: 'اسکور', startsFrom: 'شروع سے', earliestSlot: 'سب سے پہلے وقت', trust: 'بھروسہ اور معیار', pickTime: 'وقت کا انتخاب کریں' },
    roman_urdu: { reviews: 'reviews', score: 'Score', startsFrom: 'Starts From', earliestSlot: 'Earliest Slot', trust: 'Trust & Quality Scores', pickTime: 'Pick a Time Slot' }
  }[appLanguage];

  return (
    <div className={`glass-card rounded-[2.5rem] p-6 border-2 bg-white shadow-xl relative overflow-hidden group transition-all ${isTopMatch ? 'border-primary/20 hover:border-primary/40' : 'border-outline-variant/10 hover:border-outline-variant/30'}`}>
      {isTopMatch && <div className="absolute top-0 left-0 w-full h-1 bg-primary" />}
      <div className="flex justify-between items-start mb-5">
        <div className="flex gap-4">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center relative shadow-inner ${isTopMatch ? 'bg-primary/10' : 'bg-surface-container-high'}`}>
            <span className={`text-2xl font-black ${isTopMatch ? 'text-primary' : 'text-on-surface-variant'}`}>{provider.name.charAt(0)}</span>
            {provider.verified && (<div className="absolute -bottom-1 -right-1 bg-white p-0.5 rounded-full shadow-md"><ShieldCheck className={`w-5 h-5 ${isTopMatch ? 'text-secondary' : 'text-primary'}`} /></div>)}
          </div>
          <div>
            <h3 className="text-lg font-black text-on-surface leading-tight">{provider.name}</h3>
            <div className="flex items-center gap-2 mt-1.5"><div className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-secondary fill-secondary" /><span className="text-xs font-black text-secondary">{provider.rating}</span></div><span className="text-[10px] text-on-surface-variant/60 font-medium">({provider.reviews} {translations.reviews})</span></div>
            <p className="text-[10px] text-outline mt-1 font-medium">{provider.distance_km} km away • {provider.location?.address}</p>
          </div>
        </div>
        <div className="text-right"><div className={`text-2xl font-black leading-none ${isTopMatch ? 'text-primary' : 'text-on-surface-variant'}`}>{provider.computed_score}</div><div className="text-[8px] font-bold text-outline uppercase tracking-widest mt-1">{translations.score}</div></div>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-surface-container-lowest p-3 rounded-2xl border border-outline-variant/10 text-center"><span className="block text-[8px] font-bold text-outline uppercase mb-1">{translations.startsFrom}</span><span className="text-sm font-black text-on-surface">₨ {provider.price_from.toLocaleString()}</span></div>
        <div className="bg-surface-container-lowest p-3 rounded-2xl border border-outline-variant/10 text-center"><span className="block text-[8px] font-bold text-outline uppercase mb-1">{translations.earliestSlot}</span><span className="text-sm font-black text-on-surface">{provider.arrival_time}</span></div>
      </div>
      {provider.match_reason && (<div className={`${isTopMatch ? 'bg-primary/5 border-primary/10' : 'bg-surface-container-low border-outline-variant/10'} rounded-2xl p-4 mb-5 border`}><p className="text-[11px] text-on-surface-variant leading-relaxed italic">"{provider.match_reason}"</p></div>)}
      {provider.score_breakdown && (
        <div className="mb-5 space-y-3 bg-surface-container-lowest/50 p-4 rounded-3xl border border-outline-variant/10">
          <div className="flex justify-between items-center px-1"><span className="text-[10px] font-black text-outline uppercase tracking-widest">{translations.trust}</span><div className="flex items-center gap-1"><TrendingUp className={`w-3 h-3 ${isTopMatch ? 'text-primary' : 'text-on-surface-variant'}`} /><span className={`text-[10px] font-black ${isTopMatch ? 'text-primary' : 'text-on-surface-variant'}`}>{provider.computed_score}%</span></div></div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-3">{Object.entries(provider.score_breakdown).filter(([k,v]) => k !== 'total' && typeof v === 'number').map(([metricId, metricValue]) => { const label = appLanguage === 'urdu' ? (metricId === 'reliability' ? 'پختگی' : metricId === 'response' ? 'جواب' : metricId === 'quality' ? 'معیار' : metricId) : metricId; return (<div key={metricId} className="space-y-1.5"><div className="flex justify-between text-[9px] px-0.5"><span className="capitalize text-on-surface-variant font-bold">{label}</span><span className="text-on-surface font-black">{metricValue}%</span></div><div className="h-1 w-full bg-outline-variant/20 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${metricValue}%` }} transition={{ duration: 1, delay: 0.2, ease: 'easeOut' }} className={`h-full rounded-full ${Number(metricValue) > 80 ? 'bg-secondary' : 'bg-primary/60'}`} /></div></div>); })}</div>
        </div>
      )}
      <div className="flex flex-wrap gap-2 mb-5">{provider.badges.map((badge, index) => (<span key={index} className={`text-[9px] font-bold px-3 py-1 rounded-full uppercase ${isTopMatch ? 'bg-primary/10 text-primary' : 'bg-outline-variant/10 text-on-surface-variant'}`}>{badge}</span>))}</div>
      {provider.availability_slots.length > 0 && (<div className="mb-6"><div className="flex items-center gap-2 mb-3"><Clock className="w-3.5 h-3.5 text-secondary" /><span className="text-[10px] font-black text-outline uppercase tracking-widest">{translations.pickTime}</span></div><div className="flex flex-wrap gap-2">{provider.availability_slots.map((slot) => { const isSlotSelected = isSelectedSlot(slot); return (<button key={slot} onClick={() => onSelectSlot(slot)} className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all active:scale-95 ${isSlotSelected ? 'bg-secondary text-white border-secondary shadow-md shadow-secondary/20 scale-105' : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant/30 hover:border-secondary/40 hover:text-secondary'}`}>{slot}{isSlotSelected && <CheckCircle2 className="w-3 h-3 inline ml-1.5 -mt-0.5" />}</button>); })}</div></div>)}
      <button onClick={() => onBook(provider)} disabled={provider.availability_slots.length > 0 && !provider.availability_slots.some(s => isSelectedSlot(s))} className={`w-full py-4 rounded-2xl font-black text-sm shadow-lg transition-all flex items-center justify-center gap-2 group disabled:opacity-40 disabled:scale-100 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-95 ${isTopMatch ? 'bg-primary text-white shadow-primary/20' : 'bg-on-surface text-white'}`}>{provider.cta}<ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></button>
    </div>
  );
}

export function MatchView({ data, onBook, appLanguage, onSearchAgain }: MatchViewProps) {
  const [selectedBooking, setSelectedBooking] = useState<{ provider: string; slot: string } | null>(null);
  const [showAllAlternatives, setShowAllAlternatives] = useState(false);

  const t = {
    english: { finding: 'Finding Your Best Match', scanning: "We're scanning 20+ verified providers...", noMatches: 'No Matches Found', noMatchesText: "We couldn't find available providers for your request right now.", tryAgain: 'Try Again', found: 'Found', estimate: 'Estimated Cost', total: 'approx. total', disclaimer: 'Final price may vary slightly based on actual work required.', topRated: 'Top Rated Match', alternative: 'Alternative Providers', secure: 'Secure Booking Protected by KhidmatGaar', showMore: 'Show More Providers', showLess: 'Show Less Providers', changeSearch: 'Change Search Criteria' },
    urdu: { finding: 'ہم آپ کے لیے بہترین میاچ تلاش کر رہے ہیں', scanning: 'ہم آپ کے علاقے میں 20 سے زیادہ تصدیق شدہ فراہم کنندگان کی جانچ کر رہے ہیں...', noMatches: 'کوئی میاچ نہیں ملا', noMatchesText: 'ہمیں ابھی آپ کی درخواست کے لیے کوئی دستیاب فراہم کنندہ نہیں ملا۔', tryAgain: 'دوبارہ کوشش کریں', found: 'مل گئے', estimate: 'متوقع قیمت', total: 'تقریباً کل رقم', disclaimer: 'کام کی نوعیت کے مطابق حتمی قیمت تھوڑی تبدیل ہو سکتی ہے۔', topRated: 'بہترین انتخاب', alternative: 'دیگر فراہم کنندگان', secure: 'محفوظ بکنگ بذریعہ خدمت گار', showMore: 'مزید فراہم کنندگان دکھائیں', showLess: 'کم فراہم کنندگان دکھائیں', changeSearch: 'تلاش کے معیار کو تبدیل کریں' },
    roman_urdu: { finding: 'Finding Your Best Match', scanning: "We're scanning 20+ verified providers...", noMatches: 'No Matches Found', noMatchesText: "We couldn't find available providers right now.", tryAgain: 'Try Again', found: 'Found', estimate: 'Estimated Cost', total: 'approx. total', disclaimer: 'Final price may vary slightly.', topRated: 'Top Rated Match', alternative: 'Alternative Providers', secure: 'Secure Booking Protected by KhidmatGaar', showMore: 'Show More Providers', showLess: 'Show Less Providers', changeSearch: 'Change Search Criteria' }
  }[appLanguage];

  const uiData: MatchViewData = data ? transformMatchData(data) : { status: 'loading', stage: 'searching', location: 'Detecting...', service_type: 'Service', header: { service: 'Searching...', location: '...', providers_found: 0 }, pricing_card: { title: t.estimate, total: 0, currency: 'PKR', breakdown: [], badges: [] }, top_provider_card: null, alternative_cards: [] };

  const handleSelectSlot = (providerName: string, slot: string) => { setSelectedBooking(prev => prev?.provider === providerName && prev?.slot === slot ? null : { provider: providerName, slot }); };

  const handleBooking = (provider: ProviderCardData) => {
    const slot = selectedBooking?.slot || provider.availability_slots[0] || '09:00';
    const today = new Date().toISOString().split('T')[0];
    const allProviders = [...(uiData.top_provider_card ? [uiData.top_provider_card] : []), ...uiData.alternative_cards];
    const alternatives = allProviders.filter(p => p.name !== provider.name).map(p => ({ id: (p.location as any)?.place_id || p.name.toLowerCase().replace(/\s+/g, '_'), place_id: (p.location as any)?.place_id || p.name.toLowerCase().replace(/\s+/g, '_'), name: p.name, rating: p.rating, computed_score: p.computed_score, distance_km: p.distance_km, estimated_arrival: p.arrival_time, availability_slots: p.availability_slots, address: p.location?.address || '', coordinates: p.location ? { lat: p.location.lat, lng: p.location.lng } : undefined }));
    const profile = getUserProfile();
    const payload: BookingPayload = { action: 'confirm', provider_id: (provider.location as any)?.place_id || provider.name.toLowerCase().replace(/\s+/g, '_'), provider_name: provider.name, service_type: uiData.header.service, location: uiData.header.location, price_pkr: provider.price_from, slot, booking_date: today, user_name: profile?.name || 'Guest User', user_email: profile?.email || '', alternatives };
    onBook?.(payload);
  };

  if (!data || uiData.status === 'loading') return (<div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 px-4"><div className="relative"><div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" /><Zap className="w-6 h-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" /></div><div className="space-y-2"><p className="text-sm font-medium text-on-surface-variant">{t.finding}</p><p className="text-xs text-outline">{t.scanning}</p></div></div>);
  if (uiData.status === 'error' || (!uiData.top_provider_card && uiData.alternative_cards.length === 0)) return (<div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 px-4"><Info className="w-12 h-12 text-outline" /><div className="space-y-2"><p className="text-sm font-medium text-on-surface-variant">{t.noMatches}</p><p className="text-xs text-outline">{t.noMatchesText}</p></div><button onClick={onSearchAgain} className="btn-primary">{t.tryAgain}</button></div>);

  const initialAlternatives = uiData.alternative_cards.slice(0, 2);
  const remainingAlternatives = uiData.alternative_cards.slice(2);
  const renderPricingBreakdown = () => { const breakdown = uiData.pricing_card.breakdown; if (!breakdown) return null; if (Array.isArray(breakdown)) { return breakdown.map((item: any, index: number) => { const label = item.label || item.name || `Item ${index + 1}`; const value = typeof item.value === 'number' ? item.value : (typeof item === 'number' ? item : 0); return (<div key={index} className="flex justify-between"><span className="text-on-surface-variant capitalize">{label.replace(/_/g, ' ')}</span><span className="font-medium text-on-surface">₨ {value.toLocaleString()}</span></div>); }); } return Object.entries(breakdown).map(([label, value]) => { const displayValue = typeof value === 'number' ? value : 0; return (<div key={label} className="flex justify-between"><span className="text-on-surface-variant capitalize">{label.replace(/_/g, ' ')}</span><span className="font-medium text-on-surface">₨ {displayValue.toLocaleString()}</span></div>); }); };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="match-view-container p-4 md:p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="text-center mb-8"><h1 className="text-2xl md:text-3xl font-black text-on-surface leading-tight">{t.found} {uiData.header.providers_found} {uiData.header.service} {t.alternative} {uiData.header.location}</h1><p className="text-sm text-outline mt-2">{t.secure}</p></div>
      <div className="bg-surface-container-low rounded-3xl p-5 mb-8 shadow-lg border border-outline-variant/10">
        <div className="flex justify-between items-center mb-3"><h2 className="text-lg font-black text-on-surface">{uiData.pricing_card.title}</h2><div className="flex items-baseline gap-1"><span className="text-3xl font-black text-primary leading-none">₨ {uiData.pricing_card.total.toLocaleString()}</span><span className="text-xs font-bold text-outline uppercase">{t.total}</span></div></div>
        <p className="text-xs text-outline-variant mb-4">{t.disclaimer}</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">{renderPricingBreakdown()}</div>
      </div>
      {uiData.top_provider_card && (<div className="mb-8"><h2 className="text-xl font-black text-on-surface mb-4">{t.topRated}</h2><ProviderCard provider={uiData.top_provider_card} isSelectedSlot={(slot) => selectedBooking?.provider === uiData.top_provider_card?.name && selectedBooking?.slot === slot} onSelectSlot={(slot) => handleSelectSlot(uiData.top_provider_card!.name, slot)} onBook={handleBooking} isTopMatch={true} appLanguage={appLanguage} /></div>)}
      {initialAlternatives.length > 0 && (<div className="mb-8"><h2 className="text-xl font-black text-on-surface mb-4">{t.alternative}</h2><div className="space-y-6">{initialAlternatives.map((provider) => (<ProviderCard key={provider.name} provider={provider} isSelectedSlot={(slot) => selectedBooking?.provider === provider.name && selectedBooking?.slot === slot} onSelectSlot={(slot) => handleSelectSlot(provider.name, slot)} onBook={handleBooking} appLanguage={appLanguage} />))}</div></div>)}
      {showAllAlternatives && remainingAlternatives.length > 0 && (<div className="mb-8"><div className="space-y-6">{remainingAlternatives.map((provider) => (<ProviderCard key={provider.name} provider={provider} isSelectedSlot={(slot) => selectedBooking?.provider === provider.name && selectedBooking?.slot === slot} onSelectSlot={(slot) => handleSelectSlot(provider.name, slot)} onBook={handleBooking} appLanguage={appLanguage} />))}</div></div>)}
      {remainingAlternatives.length > 0 && (<div className="text-center mt-6 mb-8"><button onClick={() => setShowAllAlternatives(prev => !prev)} className="px-6 py-3 rounded-full bg-secondary text-white font-bold text-sm shadow-md hover:bg-secondary/90 transition-colors">{showAllAlternatives ? t.showLess : `${t.showMore} (${remainingAlternatives.length})`}</button></div>)}
      <div className="text-center mt-8 pt-6 border-t border-outline-variant/20"><p className="text-sm text-outline mb-4">{t.noMatchesText}</p><button onClick={onSearchAgain} className="px-6 py-3 rounded-full bg-surface-container-high text-on-surface-variant font-bold text-sm shadow-md hover:bg-surface-container-high/90 transition-colors">{t.changeSearch}</button></div>
    </motion.div>
  );
}
