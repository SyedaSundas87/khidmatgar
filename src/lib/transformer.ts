export interface PricingBreakdown { label: string; value: number; }
export interface PricingCardData { title: string; total: number; currency: string; breakdown: PricingBreakdown[]; badges: string[]; }
export interface ProviderLocation { lat: number; lng: number; address: string; }
export interface ProviderCardData { type: 'top_match' | 'alternative'; name: string; rating: number; reviews: number; distance_km: number; price_from: number; computed_score: number; score_breakdown?: Record<string, number>; match_reason?: string; arrival_time: string; verified: boolean; location?: ProviderLocation; badges: string[]; cta: string; availability_slots: string[]; }
export interface MatchViewData { status: string; stage: string; location: string; service_type: string; header: { service: string; location: string; providers_found: number; }; pricing_card: PricingCardData; top_provider_card: ProviderCardData | null; alternative_cards: ProviderCardData[]; }

export function transformMatchData(backendResponse: any): MatchViewData {
  if (!backendResponse) return { status: 'error', stage: 'error', location: 'N/A', service_type: 'N/A', header: { service: 'N/A', location: 'N/A', providers_found: 0 }, pricing_card: { title: 'N/A', total: 0, currency: 'PKR', breakdown: [], badges: [] }, top_provider_card: null, alternative_cards: [] };
  let raw = backendResponse;
  if (Array.isArray(raw) && raw.length > 0) { if (raw.length === 1 && !raw[0].matches && !raw[0].providers && raw[0].name) {} else if (raw.length > 1 && raw[0].name) {} else { raw = raw[0]; } }
  if (raw.matching_result) raw = raw.matching_result;
  if (raw.data && typeof raw.data === 'object' && !Array.isArray(raw.data)) raw = raw.data;
  if (raw.body && typeof raw.body === 'object' && !Array.isArray(raw.body)) raw = raw.body;
  if (raw.workflow === 'WF3-Pricing' || (Array.isArray(raw.services) && raw.services.length > 0 && raw.services[0].provider !== undefined)) {
    const wf3Services: any[] = raw.services || []; const summary = raw.summary || {}; const allProviders: any[] = []; const breakdownItems: Record<string, number> = {}; let grandTotal = summary.grand_total_pkr || summary.subtotal_pkr || 0;
    for (const svc of wf3Services) { if (svc.provider) allProviders.push(svc.provider); if (svc.alternatives) allProviders.push(...svc.alternatives); const p = svc.pricing?.breakdown || {}; for (const [k, v] of Object.entries(p)) { breakdownItems[k] = (breakdownItems[k] || 0) + Number(v); } if (!grandTotal && svc.pricing?.total_pkr) grandTotal += svc.pricing.total_pkr; }
    const primarySvc = wf3Services[0];
    raw = { status: raw.status, workflow: raw.workflow, location: summary.location || '', service_type: wf3Services.map((s: any) => s.service).join(' + '), top_match: primarySvc?.provider || allProviders[0] || null, alternatives: allProviders.slice(1), total_evaluated: summary.total_services || allProviders.length, pricing: { total_pkr: grandTotal, currency: 'PKR', breakdown: breakdownItems, labels: {} } };
  }
  const result = raw;
  const rawBreakdown = result.pricing?.breakdown || {};
  const breakdown: PricingBreakdown[] = Object.entries(rawBreakdown).map(([key, value]) => ({ label: key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()), value: Number(value) })).filter((item) => item.value > 0 || item.label === 'Base Rate');
  const pricingCard: PricingCardData = { title: 'Estimated Cost', total: result.pricing?.total_pkr || result.pricing?.total || 0, currency: result.pricing?.currency || 'PKR', breakdown, badges: result.pricing?.labels?.surge_active ? ['Surge Active'] : [] };
  const mapProvider = (p: any, type: 'top_match' | 'alternative'): ProviderCardData => ({ type, name: p.name || 'Provider', rating: p.rating || 0, reviews: p.review_count || p.reviews || 0, distance_km: p.distance_km || 0, price_from: p.base_rate_pkr || p.price_from || 0, computed_score: p.computed_score || 0, score_breakdown: p.score_breakdown || null, match_reason: p.reasoning || p.match_reason || p.reason || '', arrival_time: p.estimated_arrival || p.arrival_time || 'N/A', verified: !!p.verified, location: p.coordinates ? { lat: p.coordinates.lat, lng: p.coordinates.lng, address: p.address || '' } : (p.location || { lat: 0, lng: 0, address: '' }), badges: Array.isArray(p.badges) ? p.badges : [], cta: 'Select Provider', availability_slots: Array.isArray(p.availability_slots) ? p.availability_slots : [] });
  let topProvider: ProviderCardData | null = null; let alternatives: any[] = [];
  if (result.top_match) { topProvider = mapProvider(result.top_match, 'top_match'); alternatives = Array.isArray(result.alternatives) ? result.alternatives : []; }
  else if (result.name && (result.rating !== undefined || result.base_rate_pkr !== undefined)) { topProvider = mapProvider(result, 'top_match'); alternatives = []; }
  else { let flatMatches = []; if (Array.isArray(backendResponse) && backendResponse.length > 0 && (backendResponse[0].name || backendResponse[0].provider_name)) { flatMatches = backendResponse; } else if (Array.isArray(result)) { flatMatches = result; } else if (Array.isArray(result.matches)) { flatMatches = result.matches; } else if (Array.isArray(result.providers)) { flatMatches = result.providers; } if (flatMatches.length > 0) { const sorted = [...flatMatches].sort((a, b) => (b.computed_score || 0) - (a.computed_score || 0)); topProvider = mapProvider(sorted[0], 'top_match'); alternatives = sorted.slice(1); } }
  const alternativeCards: ProviderCardData[] = alternatives.map((alt: any) => mapProvider(alt, 'alternative'));
  const decorateBadges = (p: ProviderCardData) => { if (p.verified && !p.badges.includes('Verified')) p.badges.push('Verified'); if (p.rating >= 4.8 && !p.badges.includes('Highly Rated')) p.badges.push('Highly Rated'); if (p.distance_km <= 5 && !p.badges.includes('Nearby')) p.badges.push('Nearby'); };
  if (topProvider) { if (!topProvider.badges.includes('Best Match')) topProvider.badges.unshift('Best Match'); decorateBadges(topProvider); }
  alternativeCards.forEach((alt) => decorateBadges(alt));
  const inferredLoc = result.location || (topProvider && topProvider.location?.address) || 'Unknown';
  const inferredSvc = result.service_type || (topProvider && topProvider.name ? 'Matched Service' : 'Service');
  return { status: 'success', stage: 'booking_ready', location: inferredLoc, service_type: inferredSvc, header: { service: inferredSvc, location: inferredLoc, providers_found: result.total_evaluated || alternativeCards.length + (topProvider ? 1 : 0) }, pricing_card: pricingCard, top_provider_card: topProvider, alternative_cards: alternativeCards.sort((a, b) => b.computed_score - a.computed_score) };
}
