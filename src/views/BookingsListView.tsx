import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect, MouseEvent } from 'react';
import {
  CalendarCheck, MapPin, Clock, ShieldCheck, ChevronRight,
  CheckCircle2, AlertCircle, Inbox, Copy, Phone, MessageSquare,
  XCircle, Flag, RefreshCw, Star, ChevronDown, Loader2,
  TriangleAlert, BadgeCheck, CalendarX, Navigation2
} from 'lucide-react';
import { AppLanguage } from '../App';
import { getUserProfile } from '../lib/profile';

export interface SavedBooking {
  booking_id: string;
  provider_name: string;
  provider_id?: string;
  service_type: string;
  location: string;
  slot: string;
  booking_date: string;
  price_pkr: number;
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled' | 'rescheduled';
  saved_at: string;
  next_steps?: string[];
  alternatives?: any[];
  user_email?: string;
  // After reschedule
  rescheduled_to?: {
    booking_id: string;
    provider_name: string;
    slot: string;
    slot_label?: string;
    date: string;
  };
  // After dispute
  dispute_result?: any;
}

const STORAGE_KEY = 'khidmatgaar_bookings';

export function saveBookingToStorage(receipt: any, payload: any) {
  try {
    const existing = getBookingsFromStorage();
    const booking: SavedBooking = {
      booking_id: receipt.booking_id || `BK-${Date.now()}`,
      provider_name: receipt.provider?.name || payload?.provider_name || 'Provider',
      provider_id: payload?.provider_id || receipt.provider?.id || '',
      service_type: receipt.service || payload?.service_type || 'Service',
      location: receipt.appointment?.location || payload?.location || '',
      slot: receipt.appointment?.time_label || receipt.appointment?.time || payload?.slot || '',
      booking_date: receipt.appointment?.date || payload?.booking_date || '',
      price_pkr: receipt.payment?.estimated_pkr || payload?.price_pkr || 0,
      status: 'confirmed',
      saved_at: new Date().toISOString(),
      next_steps: receipt.next_steps || [],
      alternatives: payload?.alternatives || receipt.alternatives || [],
      user_email: payload?.user_email || '',
    };
    const filtered = existing.filter(b => b.booking_id !== booking.booking_id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([booking, ...filtered]));
  } catch (e) {
    console.error('Failed to save booking:', e);
  }
}

export function getBookingsFromStorage(): SavedBooking[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function updateBookingInStorage(booking_id: string, updates: Partial<SavedBooking>) {
  try {
    const existing = getBookingsFromStorage();
    const updated = existing.map(b => b.booking_id === booking_id ? { ...b, ...updates } : b);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to update booking:', e);
  }
}

function formatSlotLabel(time: string) {
  if (!time) return '';
  if (time.includes('AM') || time.includes('PM')) return time;
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hour}:${String(m).padStart(2, '0')} ${period}`;
}

// ─── Status Badge ────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: SavedBooking['status'] }) {
  const map: Record<string, { label: string; cls: string }> = {
    confirmed:   { label: 'Confirmed',   cls: 'bg-secondary/10 text-secondary' },
    pending:     { label: 'Pending',     cls: 'bg-yellow-100 text-yellow-700' },
    completed:   { label: 'Completed',   cls: 'bg-primary/10 text-primary' },
    cancelled:   { label: 'Cancelled',   cls: 'bg-error/10 text-error' },
    rescheduled: { label: 'Rescheduled', cls: 'bg-purple-100 text-purple-700' },
  };
  const { label, cls } = map[status] || map.confirmed;
  return (
    <span className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest ${cls}`}>
      {label}
    </span>
  );
}

// ─── Dispute Bottom Sheet ─────────────────────────────────────────────────────
const DISPUTE_TYPES = [
  { id: 'no_show',            label: 'Provider Never Arrived',  icon: CalendarX,      desc: 'Provider did not show up at the scheduled time' },
  { id: 'quality_complaint',  label: 'Poor Quality of Work',    icon: Star,           desc: 'Work was unsatisfactory or incomplete' },
  { id: 'price_disagreement', label: 'Overcharged',             icon: TriangleAlert,  desc: 'Charged more than the quoted price' },
  { id: 'provider_cancelled', label: 'Provider Cancelled',      icon: XCircle,        desc: 'Provider cancelled after confirmation' },
  { id: 'other',              label: 'Other Reason',            icon: Flag,           desc: 'Something else — describe it below' },
];

function DisputeSheet({
  booking,
  onClose,
  onSuccess,
}: {
  booking: SavedBooking;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [otherText, setOtherText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const canSubmit = !!selected && (selected !== 'other' || otherText.trim().length > 5);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError('');
    try {
      const payload = {
        dispute_type: selected === 'other' ? 'quality_complaint' : selected,
        custom_reason: selected === 'other' ? otherText.trim() : undefined,
        review: selected === 'other' ? otherText.trim() : undefined,
        booking_id: booking.booking_id,
        provider_id: booking.provider_id || booking.provider_name.toLowerCase().replace(/\s+/g, '_'),
        provider_name: booking.provider_name,
        service_type: booking.service_type,
        location: booking.location,
        booking_date: booking.booking_date,
        price_pkr: booking.price_pkr,
        slot: booking.slot,
        alternatives: booking.alternatives || [],
        user_email: booking.user_email || getUserProfile()?.email || '',
      };

      const res = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: 'khadmat-dispute', ...payload }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      const text = await res.text();
      let json: any = {};
      try {
        if (text) {
          let parsed = JSON.parse(text);
          json = Array.isArray(parsed) && parsed.length === 1 ? parsed[0] : parsed;
        } else {
          json = { status: 'dispute_resolved', message: 'Complaint recorded successfully.' };
        }
      } catch (e) {
        json = { status: 'dispute_resolved' };
      }

      setResult(json);
      updateBookingInStorage(booking.booking_id, { dispute_result: json });
      onSuccess();
    } catch (err: any) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="w-full max-w-md bg-white rounded-t-[2rem] p-6 pb-10 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="w-10 h-1 bg-outline-variant/40 rounded-full mx-auto" />
        {!result ? (
          <>
            <div>
              <h2 className="text-lg font-black text-on-surface">Report an Issue</h2>
              <p className="text-xs text-outline mt-1">Booking #{booking.booking_id} · {booking.provider_name}</p>
            </div>
            <div className="space-y-2">
              {DISPUTE_TYPES.map((dt) => {
                const Icon = dt.icon;
                const isSelected = selected === dt.id;
                return (
                  <button
                    key={dt.id}
                    onClick={() => setSelected(dt.id)}
                    className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all active:scale-[0.98] ${
                      isSelected ? 'border-error bg-error/5' : 'border-outline-variant/30 hover:border-outline-variant/60'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isSelected ? 'bg-error/10' : 'bg-surface-container-low'}`}>
                      <Icon className={`w-5 h-5 ${isSelected ? 'text-error' : 'text-outline'}`} />
                    </div>
                    <div>
                      <p className={`text-sm font-bold ${isSelected ? 'text-error' : 'text-on-surface'}`}>{dt.label}</p>
                      <p className="text-[10px] text-outline mt-0.5">{dt.desc}</p>
                    </div>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-error ml-auto shrink-0" />}
                  </button>
                );
              })}
            </div>
            {selected === 'other' && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="space-y-1.5">
                <label className="text-[10px] font-black text-outline uppercase tracking-widest">Describe your issue <span className="text-error">*</span></label>
                <textarea
                  value={otherText}
                  onChange={(e) => setOtherText(e.target.value)}
                  placeholder="Please describe what happened in detail..."
                  rows={4}
                  className="w-full rounded-2xl border-2 border-outline-variant/30 focus:border-error bg-surface-container-lowest px-4 py-3 text-sm text-on-surface placeholder:text-outline/50 resize-none outline-none transition-colors leading-relaxed"
                />
              </motion.div>
            )}
            {error && <p className="text-xs text-error font-bold text-center">{error}</p>}
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || loading}
              className="w-full py-4 bg-error text-white rounded-2xl font-black text-sm shadow-lg shadow-error/20 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Flag className="w-4 h-4" />}
              {loading ? 'Submitting...' : 'Submit Complaint'}
            </button>
            <button onClick={onClose} className="w-full text-center text-xs text-outline font-medium py-2">Cancel</button>
          </>
        ) : (
          <DisputeResult result={result} onClose={onClose} />
        )}
      </motion.div>
    </motion.div>
  );
}

function DisputeResult({ result, onClose }: { result: any; onClose: () => void }) {
  const isResolved = result.status === 'dispute_resolved';
  const isEscalated = result.status === 'escalated_to_human';
  const statusMessage = result.customer_message || (isEscalated ? 'A human agent will contact you within 24 hours.' : 'Your complaint has been recorded and processed.');

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="flex flex-col items-center text-center space-y-3 py-2">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isResolved ? 'bg-secondary/10' : 'bg-yellow-100'}`}>
          {isResolved ? <CheckCircle2 className="w-8 h-8 text-secondary" /> : <AlertCircle className="w-8 h-8 text-yellow-600" />}
        </div>
        <div>
          <h3 className="text-lg font-black text-on-surface">{isEscalated ? 'Escalated to Team' : 'Complaint Filed'}</h3>
          <p className="text-xs text-outline mt-1 leading-relaxed max-w-xs mx-auto">{statusMessage}</p>
        </div>
      </div>
      <button onClick={onClose} className="w-full py-4 bg-on-surface text-white rounded-2xl font-black text-sm active:scale-95 transition-all">Done</button>
    </motion.div>
  );
}

// ─── Cancel Bottom Sheet ──────────────────────────────────────────────────────
function CancelSheet({
  booking,
  onClose,
  onSuccess,
}: {
  booking: SavedBooking;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleCancel = async () => {
    setLoading(true);
    setError('');
    try {
      const payload = {
        booking_id: booking.booking_id,
        provider_id: booking.provider_id || booking.provider_name.toLowerCase().replace(/\s+/g, '_'),
        provider_name: booking.provider_name,
        service_type: booking.service_type,
        location: booking.location,
        booking_date: booking.booking_date,
        price_pkr: booking.price_pkr,
        slot: booking.slot,
        alternatives: booking.alternatives || [],
        user_email: booking.user_email || getUserProfile()?.email || '',
      };

      const res = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: 'khadmat-reschedule', ...payload }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      const text = await res.text();
      let json: any = {};
      try {
        if (text) {
          let parsed = JSON.parse(text);
          json = Array.isArray(parsed) && parsed.length === 1 ? parsed[0] : parsed;
        } else {
          json = { status: 'cancelled' };
        }
      } catch (e) {
        json = { status: 'cancelled' };
      }

      setResult(json);
      if (json.status === 'rescheduled' && json.new_booking) {
        updateBookingInStorage(booking.booking_id, {
          status: 'rescheduled',
          rescheduled_to: {
            booking_id: json.new_booking.booking_id,
            provider_name: json.new_booking.provider,
            slot: json.new_booking.slot,
            slot_label: json.new_booking.slot_label,
            date: json.new_booking.date,
          }
        });
      } else {
        updateBookingInStorage(booking.booking_id, { status: 'cancelled' });
      }
      onSuccess();
    } catch (err: any) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="w-full max-w-md bg-white rounded-t-[2rem] p-6 pb-10 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="w-10 h-1 bg-outline-variant/40 rounded-full mx-auto" />
        {!result ? (
          <>
            <div className="flex flex-col items-center text-center space-y-3 pt-2">
              <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center">
                <CalendarX className="w-8 h-8 text-error" />
              </div>
              <div>
                <h2 className="text-lg font-black text-on-surface">Cancel Booking?</h2>
                <p className="text-xs text-outline mt-1 leading-relaxed max-w-xs mx-auto">We'll automatically find and book the next best provider for you at the same time slot.</p>
              </div>
            </div>
            <div className="bg-surface-container-low rounded-2xl p-4 space-y-2 border border-outline-variant/20">
              <div className="flex justify-between text-xs"><span className="text-outline font-medium">Provider</span><span className="font-bold text-on-surface">{booking.provider_name}</span></div>
              <div className="flex justify-between text-xs"><span className="text-outline font-medium">Service</span><span className="font-bold text-on-surface capitalize">{booking.service_type}</span></div>
              <div className="flex justify-between text-xs"><span className="text-outline font-medium">Date & Time</span><span className="font-bold text-on-surface">{booking.booking_date} · {formatSlotLabel(booking.slot)}</span></div>
            </div>
            <div className="flex items-center gap-2 bg-primary/5 border border-primary/15 rounded-xl px-4 py-3">
              <RefreshCw className="w-4 h-4 text-primary shrink-0" />
              <p className="text-[11px] text-primary font-bold leading-snug">Auto-Reschedule Agent will find your next best match instantly</p>
            </div>
            {error && <p className="text-xs text-error font-bold text-center">{error}</p>}
            <div className="space-y-2 pt-1">
              <button onClick={handleCancel} disabled={loading} className="w-full py-4 bg-error text-white rounded-2xl font-black text-sm shadow-lg shadow-error/20 flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 transition-all">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                {loading ? 'Processing Auto-Reschedule...' : 'Cancel & Auto-Reschedule'}
              </button>
              <button onClick={onClose} disabled={loading} className="w-full py-3 border border-outline-variant/40 text-on-surface-variant rounded-2xl font-bold text-sm active:scale-95 transition-all">Keep Booking</button>
            </div>
          </>
        ) : (
          <RescheduleResult result={result} booking={booking} onClose={onClose} />
        )}
      </motion.div>
    </motion.div>
  );
}

function RescheduleResult({ result, booking, onClose }: { result: any; booking: SavedBooking; onClose: () => void }) {
  const isRescheduled = result.status === 'rescheduled';
  const isPending = result.status === 'reschedule_pending_user_input';
  const isNoAlt = result.status === 'no_alternative_available';
  const newBooking = result.new_booking;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="flex flex-col items-center text-center space-y-3 py-2">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isRescheduled ? 'bg-secondary/10' : isPending ? 'bg-yellow-100' : 'bg-error/10'}`}>
          {isRescheduled ? <CheckCircle2 className="w-8 h-8 text-secondary" /> : isPending ? <Clock className="w-8 h-8 text-yellow-600" /> : <AlertCircle className="w-8 h-8 text-error" />}
        </div>
        <div>
          <h3 className="text-lg font-black text-on-surface">{isRescheduled ? 'Auto-Rescheduled!' : isPending ? 'Needs Your Input' : 'No Alternative Found'}</h3>
          <p className="text-xs text-outline mt-1 leading-relaxed max-w-xs mx-auto">{isRescheduled ? 'We found and booked the next best provider for you automatically.' : isPending ? 'No slots on the original date. Please pick an alternate date below.' : 'No alternatives available. Full refund has been approved.'}</p>
        </div>
      </div>
      {isRescheduled && newBooking && (
        <div className="bg-secondary/5 border border-secondary/20 rounded-2xl p-4 space-y-2">
          <p className="text-[10px] font-black text-secondary uppercase tracking-widest mb-3">New Booking Details</p>
          <div className="flex justify-between text-xs"><span className="text-outline">New Provider</span><span className="font-bold text-on-surface">{newBooking.provider}</span></div>
          <div className="flex justify-between text-xs"><span className="text-outline">Date & Time</span><span className="font-bold text-on-surface">{newBooking.date} · {newBooking.slot_label || formatSlotLabel(newBooking.slot)}</span></div>
        </div>
      )}
      <button onClick={onClose} className="w-full py-4 bg-on-surface text-white rounded-2xl font-black text-sm active:scale-95 transition-all">Done</button>
    </motion.div>
  );
}

// ─── Booking Card ─────────────────────────────────────────────────────────────
function BookingCard({ booking, onExpand, expanded, onRefresh, onTrack }: {
  key?: string | number;
  booking: SavedBooking;
  onExpand: () => void;
  expanded: boolean;
  onRefresh: () => void;
  onTrack?: (payload: any) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [showDispute, setShowDispute] = useState(false);

  const handleCopy = (e: MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(booking.booking_id).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const isTrackable = booking.status === 'confirmed' || booking.status === 'rescheduled';

  const handleTrackClick = (e: MouseEvent) => {
    e.stopPropagation();
    if (!onTrack) return;
    const trackingPayload = booking.status === 'rescheduled' && booking.rescheduled_to
      ? { booking_id: booking.rescheduled_to.booking_id, provider_id: booking.provider_id, provider_name: booking.rescheduled_to.provider_name, service_type: booking.service_type, location: booking.location, price_pkr: booking.price_pkr, user_email: booking.user_email || getUserProfile()?.email || '' }
      : { booking_id: booking.booking_id, provider_id: booking.provider_id, provider_name: booking.provider_name, service_type: booking.service_type, location: booking.location, price_pkr: booking.price_pkr, user_email: booking.user_email || getUserProfile()?.email || '' };
    onTrack(trackingPayload);
  };

  const borderColor = { confirmed: 'border-l-secondary', pending: 'border-l-yellow-400', completed: 'border-l-primary', cancelled: 'border-l-error', rescheduled: 'border-l-purple-400' }[booking.status] ?? 'border-l-outline-variant';

  return (
    <>
      <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`glass-card rounded-[2rem] border bg-white/90 shadow-sm overflow-hidden border-l-[4px] ${borderColor}`}>
        <button onClick={onExpand} className="w-full p-5 flex items-center justify-between gap-3 text-left">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${booking.status === 'confirmed' ? 'bg-secondary/10' : 'bg-primary/10'}`}>
              <span className={`text-lg font-black ${booking.status === 'confirmed' ? 'text-secondary' : 'text-primary'}`}>{booking.provider_name.charAt(0)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5 flex-wrap"><h3 className="text-sm font-black text-on-surface truncate">{booking.provider_name}</h3><StatusBadge status={booking.status} /></div>
              <p className="text-[10px] text-outline font-medium capitalize truncate">{booking.service_type}</p>
              <div className="flex items-center gap-1 mt-0.5"><Clock className="w-3 h-3 text-on-surface-variant/60" /><span className="text-[10px] text-on-surface-variant font-medium">{booking.booking_date} · {formatSlotLabel(booking.slot)}</span></div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0"><span className="text-sm font-black text-on-surface">PKR {booking.price_pkr.toLocaleString()}</span><ChevronRight className={`w-4 h-4 text-outline transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`} /></div>
        </button>
        {booking.status === 'rescheduled' && booking.rescheduled_to && (
          <div className="mx-4 mb-3 bg-gradient-to-r from-purple-50 to-purple-100 border-l-4 border-l-purple-600 rounded-xl px-4 py-3.5 space-y-2.5">
            <div className="flex items-center gap-2"><RefreshCw className="w-4 h-4 text-purple-700 shrink-0" /><p className="text-xs font-black text-purple-700 uppercase tracking-widest">Rescheduled Booking</p></div>
            <div className="space-y-1.5 pl-6">
              <div className="flex justify-between"><span className="text-[10px] font-bold text-purple-600">New Provider:</span><span className="text-xs font-black text-on-surface">{booking.rescheduled_to.provider_name}</span></div>
              <div className="flex justify-between"><span className="text-[10px] font-bold text-purple-600">New Date & Time:</span><span className="text-xs font-bold text-on-surface">{booking.rescheduled_to.date} · {booking.rescheduled_to.slot_label || formatSlotLabel(booking.rescheduled_to.slot)}</span></div>
            </div>
          </div>
        )}
        <AnimatePresence>
          {expanded && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="px-5 pb-5 space-y-4 border-t border-outline-variant/20 pt-4">
                <div className="flex items-center justify-between bg-surface-container-low px-4 py-2.5 rounded-2xl">
                  <div className="flex items-center gap-2"><ShieldCheck className="w-3.5 h-3.5 text-primary" /><span className="text-[10px] font-black text-outline uppercase tracking-widest">Booking ID</span></div>
                  <div className="flex items-center gap-2"><span className="text-xs font-mono font-black text-on-surface">{booking.booking_id}</span><button onClick={handleCopy} className="p-1.5 hover:bg-surface-variant rounded-lg transition-colors">{copied ? <CheckCircle2 className="w-3.5 h-3.5 text-secondary" /> : <Copy className="w-3.5 h-3.5 text-outline" />}</button></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-surface-container-low p-3 rounded-2xl space-y-1"><div className="flex items-center gap-1.5"><MapPin className="w-3 h-3 text-outline" /><span className="text-[9px] font-black text-outline uppercase tracking-widest">Location</span></div><p className="text-[11px] font-bold text-on-surface leading-tight">{booking.location}</p></div>
                  <div className="bg-surface-container-low p-3 rounded-2xl space-y-1"><div className="flex items-center gap-1.5"><CalendarCheck className="w-3 h-3 text-outline" /><span className="text-[9px] font-black text-outline uppercase tracking-widest">Booked On</span></div><p className="text-[11px] font-bold text-on-surface leading-tight">{new Date(booking.saved_at).toLocaleDateString()}</p></div>
                </div>
                <div className="flex gap-2 pt-2">
                  {isTrackable && onTrack && (
                    <button onClick={handleTrackClick} className="flex-1 py-3.5 bg-primary text-white rounded-2xl font-black text-xs shadow-lg shadow-primary/20 flex items-center justify-center gap-2 active:scale-95 transition-all"><Navigation2 className="w-4 h-4" />Track Live</button>
                  )}
                  <button onClick={() => setShowDispute(true)} className="flex-1 py-3.5 border-2 border-outline-variant/30 text-on-surface-variant rounded-2xl font-black text-xs hover:bg-surface-variant active:scale-95 transition-all flex items-center justify-center gap-2"><Flag className="w-4 h-4" />Report Issue</button>
                  {(booking.status === 'confirmed' || booking.status === 'pending') && (
                    <button onClick={() => setShowCancel(true)} className="p-3.5 border-2 border-error/20 text-error rounded-2xl hover:bg-error/5 active:scale-95 transition-all"><XCircle className="w-4 h-4" /></button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      <AnimatePresence>{showCancel && <CancelSheet booking={booking} onClose={() => setShowCancel(false)} onSuccess={onRefresh} />}</AnimatePresence>
      <AnimatePresence>{showDispute && <DisputeSheet booking={booking} onClose={() => setShowDispute(false)} onSuccess={onRefresh} />}</AnimatePresence>
    </>
  );
}

export function BookingsListView({ appLanguage, onTrack }: { appLanguage: AppLanguage; onTrack: (payload: any) => void }) {
  const [bookings, setBookings] = useState<SavedBooking[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const userProfile = getUserProfile();
  const isProvider = userProfile?.role === 'provider';
  const providerId = userProfile?.provider_id;

  const refresh = () => {
    const all = getBookingsFromStorage();
    if (isProvider && providerId) {
      setBookings(all.filter(b => b.provider_id === providerId));
    } else {
      setBookings(all);
    }
  };

  useEffect(() => { refresh(); }, [isProvider, providerId]);

  if (bookings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <div className="w-20 h-20 bg-surface-container rounded-full flex items-center justify-center"><Inbox className="w-10 h-10 text-outline/30" /></div>
        <div><h3 className="text-lg font-bold text-on-surface">No Bookings Found</h3><p className="text-sm text-on-surface-variant max-w-[200px] mx-auto">{isProvider ? "You don't have any bookings assigned to you yet." : "You haven't made any bookings yet."}</p></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-10">
      <div className="flex items-center justify-between mb-2"><h2 className="text-xl font-black text-primary tracking-tight">{isProvider ? 'Your Assignments' : 'Your Bookings'}</h2><span className="text-[10px] font-black text-outline uppercase tracking-widest bg-surface-container px-3 py-1 rounded-full">{bookings.length} Total</span></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {bookings.map((b) => (
          <BookingCard key={b.booking_id} booking={b} expanded={expandedId === b.booking_id} onExpand={() => setExpandedId(expandedId === b.booking_id ? null : b.booking_id)} onRefresh={refresh} onTrack={onTrack} />
        ))}
      </div>
    </div>
  );
}