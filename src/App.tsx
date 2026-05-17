
import { useState, useEffect } from 'react';
import { Home as HomeIcon, Search, Calendar, MessageSquare, User, Zap, Menu, MapPin, Bell, Shield, Languages, ChevronDown } from 'lucide-react';
import { HomeView } from './views/HomeView';
import { ChatView } from './views/ChatView';
import { MatchView } from './views/MatchView';
import { TrackingView } from './views/TrackingView';
import { DashView } from './views/DashView';
import { OnboardingView } from './views/OnboardingView';
import { BookingView } from './views/BookingView';
import { BookingsListView } from './views/BookingsListView';
import { ServiceQualityView } from './views/ServiceQualityView';
import { ProviderLoginView } from './views/ProviderLoginView';
import { ProviderDashView } from './views/ProviderDashView';
import { getUserProfile, hasUserProfile, clearUserProfile } from './lib/profile';
import type { BookingPayload } from './views/BookingView';

export type ViewState = 'login' | 'onboarding' | 'home' | 'search' | 'booking' | 'bookings' | 'chat' | 'profile' | 'tracking' | 'provider_dash';
export type AppLanguage = 'english' | 'urdu' | 'roman_urdu';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>(() => {
    return hasUserProfile() ? 'home' : 'login';
  });
  const [matchData, setMatchData] = useState<any>(null);
  const [bookingPayload, setBookingPayload] = useState<BookingPayload | null>(null);
  const [trackingPayload, setTrackingPayload] = useState<any>(null);
  const [appLanguage, setAppLanguage] = useState<AppLanguage>(() => {
    const saved = localStorage.getItem('app_language');
    return (saved as AppLanguage) || 'english';
  });
  const [showLangMenu, setShowLangMenu] = useState(false);

  const userProfile = getUserProfile();
  const isProvider = userProfile?.role === 'provider';

  useEffect(() => {
    localStorage.setItem('app_language', appLanguage);
    // If provider is logged in and on home, redirect to provider_dash
    if (isProvider && currentView === 'home') {
      setCurrentView('provider_dash');
    }
  }, [appLanguage, isProvider, currentView]);

  const handleLoginSuccess = () => {
    const profile = getUserProfile();
    if (profile?.role === 'provider') {
      setCurrentView('provider_dash');
    } else {
      setCurrentView('home');
    }
  };

  const handleLogout = () => {
    console.log('[App] handleLogout triggered');
    const cleared = clearUserProfile();
    console.log('[App] Profile cleared:', cleared);
    setCurrentView('login');
    // Also clear other related state just in case
    setMatchData(null);
    setBookingPayload(null);
    setTrackingPayload(null);
  };

  const handleBooking = (payload: BookingPayload) => {
    setBookingPayload(payload);
    setCurrentView('booking');
  };

  const handleTrack = (payload: any) => {
    setTrackingPayload(payload);
    setCurrentView('tracking');
  };

  const languages = [
    { id: 'english', label: 'English', sub: 'Default' },
    { id: 'urdu', label: 'اردو', sub: 'Native' },
    { id: 'roman_urdu', label: 'Roman Urdu', sub: 'Transact' },
  ];

  // Top Bar Component
  const TopBar = () => (
    <div className="w-full flex justify-between items-center h-full">
      <div className="flex items-center gap-3">
        {currentView !== 'chat' && currentView !== 'onboarding' && currentView !== 'booking' && currentView !== 'tracking' && currentView !== 'login' && (
          <div className="relative">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCA7VYFPz5C-EPxeIjxNlal5E1Vnwc-ki_yUj9x6NxZLlSIdZzFRyv0FVRltywHEcarX17_v7djTgIfU9Ku5iF4-LQVLiGwKyHDqkoVzdaKtbH98KG3EtA-LaU83jeZ5ClPf6Poj2kfGuz4bS6ruYRL0OfuIw7PHdRjbIfH5703TuGVZXW2n76eOjAvoLzjFccJ34VaCYawWXIqubLTnF6hLiv5TaCS7CjILJ8Y0dLsdvudb5zbLQNrACG-bXY-8HRgUYnp-CfGtR4"
              alt="Profile"
              className="w-10 h-10 rounded-full border-2 border-primary-container object-cover"
            />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-secondary rounded-full border-2 border-white flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
            </div>
          </div>
        )}

        {currentView === 'chat' && (
          <button onClick={() => setCurrentView(isProvider ? 'provider_dash' : 'home')} className="text-primary hover:opacity-80 transition-opacity">
            <Menu className="w-6 h-6" />
          </button>
        )}

        {(currentView === 'booking' || currentView === 'tracking') && (
          <button
            onClick={() => currentView === 'tracking' ? setCurrentView('bookings') : setCurrentView('search')}
            className="text-primary hover:opacity-80 transition-opacity p-1"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </button>
        )}

        {currentView !== 'onboarding' && currentView !== 'login' && (
          <div>
            <h1 className="text-base font-bold text-primary">
              {currentView === 'chat'     ? 'AI Assistant'
                : currentView === 'booking'  ? 'Booking Confirmation'
                : currentView === 'tracking' ? 'Live Tracking'
                : userProfile?.name ? (appLanguage === 'urdu' ? `السلام علیکم، ${userProfile.name.split(' ')[0]}` : `Asalam-o-Alaikum, ${userProfile.name.split(' ')[0]}`) : 'Asalam-o-Alaikum'}
            </h1>
            {currentView !== 'chat' && currentView !== 'profile' && currentView !== 'booking' && currentView !== 'tracking' && currentView !== 'provider_dash' && (
              <div className="h-1"></div>
            )}
            {currentView === 'booking' && bookingPayload && (
              <p className="text-[10px] text-on-surface-variant font-medium">
                {bookingPayload.service_type} · {bookingPayload.location}
              </p>
            )}
            {currentView === 'tracking' && trackingPayload && (
              <p className="text-[10px] text-on-surface-variant font-medium">
                {trackingPayload.service_type} · {trackingPayload.location}
              </p>
            )}
            {currentView === 'chat' && (
              <div className="flex gap-1 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" style={{ animationDelay: '0ms' }}></span>
                <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" style={{ animationDelay: '200ms' }}></span>
                <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" style={{ animationDelay: '400ms' }}></span>
              </div>
            )}
          </div>
        )}

        {(currentView === 'onboarding' || currentView === 'login') && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-lg">
              <Shield className="w-5 h-5 text-on-primary fill-current" />
            </div>
            <span className="text-xl font-extrabold text-primary tracking-tight">KhidmatGaar</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {currentView !== 'login' && (
          <div className="relative">
            <button 
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="flex items-center gap-1.5 bg-surface-container-low px-2 py-1.5 rounded-lg border border-outline-variant/30 hover:bg-surface-variant/50 transition-colors"
            >
              <Languages className="w-4 h-4 text-primary" />
              <span className="text-[10px] font-black uppercase text-on-surface-variant hidden xs:block">
                {appLanguage.replace('_', ' ')}
              </span>
              <ChevronDown className={`w-3 h-3 text-outline transition-transform duration-200 ${showLangMenu ? 'rotate-180' : ''}`} />
            </button>

            {showLangMenu && (
              <div className="absolute top-full right-0 mt-2 w-36 bg-white rounded-xl shadow-xl border border-outline-variant/30 overflow-hidden z-50 animate-in fade-in slide-in-from-top-1">
                <div className="p-1.5 space-y-1">
                  {languages.map((lang) => (
                    <button
                      key={lang.id}
                      onClick={() => {
                        setAppLanguage(lang.id as AppLanguage);
                        setShowLangMenu(false);
                      }}
                      className={`w-full flex flex-col items-start px-3 py-2 rounded-lg transition-colors ${
                        appLanguage === lang.id 
                          ? 'bg-primary/10 border border-primary/20' 
                          : 'hover:bg-surface-container'
                      }`}
                    >
                      <span className={`text-xs ${appLanguage === lang.id ? 'font-bold text-primary' : 'font-medium text-on-surface'}`}>
                        {lang.label}
                      </span>
                      <span className="text-[8px] text-on-surface-variant uppercase tracking-tighter">{lang.sub}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {currentView === 'profile' && isProvider && (
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-outline-variant/20 shadow-sm">
            <span className="text-xs font-bold text-secondary">ONLINE</span>
            <div className="w-8 h-4 bg-secondary rounded-full relative cursor-pointer">
              <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full shadow-sm"></div>
            </div>
          </div>
        )}

        {(currentView === 'home' || currentView === 'bookings' || currentView === 'provider_dash') && (
          <button className="relative p-2 text-on-surface-variant hover:bg-surface-variant rounded-full transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full border border-white"></span>
          </button>
        )}

        {currentView === 'chat' && (
          <button onClick={() => setCurrentView(isProvider ? 'provider_dash' : 'home')} className="text-xs font-semibold text-primary bg-primary/10 px-4 py-2 rounded-full hover:bg-primary/20 transition-colors">
            Close
          </button>
        )}

        {currentView === 'onboarding' && (
          <button onClick={() => setCurrentView('home')} className="text-xs font-semibold text-primary glass-card px-4 py-2 rounded-full drop-shadow-sm">
            Skip
          </button>
        )}
      </div>
    </div>
  );

  // Bottom Nav
  const BottomNav = () => {
    const navTabs = isProvider ? [
      { id: 'provider_dash', icon: Zap, label: appLanguage === 'urdu' ? 'ڈیش بورڈ' : 'Dashboard' },
      { id: 'bookings', icon: Calendar, label: appLanguage === 'urdu' ? 'بکنگز' : 'Bookings' },
      { id: 'chat', icon: MessageSquare, label: appLanguage === 'urdu' ? 'چیٹ' : 'Chat' },
      { id: 'profile', icon: User, label: appLanguage === 'urdu' ? 'پروفائل' : 'Profile' },
    ] : [
      { id: 'home', icon: HomeIcon, label: appLanguage === 'urdu' ? 'ہوم' : 'Home' },
      { id: 'search', icon: Search, label: appLanguage === 'urdu' ? 'تلاش' : 'Match' },
      { id: 'bookings', icon: Calendar, label: appLanguage === 'urdu' ? 'ٹریک' : 'Track' },
      { id: 'chat', icon: MessageSquare, label: appLanguage === 'urdu' ? 'چیٹ' : 'Chat' },
      { id: 'profile', icon: User, label: appLanguage === 'urdu' ? 'پروفائل' : 'Pro' },
    ];

    return (
      <nav className="w-full flex justify-around items-center px-2 py-3 pb-safe glass-surface rounded-t-2xl">
        {navTabs.map((tab) => {
          const isActive = currentView === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setCurrentView(tab.id as ViewState)}
              className={`flex flex-col items-center justify-center w-16 h-12 rounded-full transition-all duration-200 ${
                isActive
                  ? 'text-primary bg-secondary-container/40 scale-105'
                  : 'text-on-surface-variant hover:bg-surface-variant/50 hover:text-on-surface'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'fill-current opacity-20' : ''} mb-0.5`} strokeWidth={isActive ? 2.5 : 2} />
              <span className={`text-[10px] ${isActive ? 'font-bold' : 'font-medium'}`}>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    );
  };

  const showBottomNav = currentView !== 'onboarding' && currentView !== 'booking' && currentView !== 'tracking' && currentView !== 'login';
  const showFAB       = currentView !== 'chat' && currentView !== 'onboarding' && currentView !== 'booking' && currentView !== 'tracking' && currentView !== 'login';

  return (
    <div className="min-h-screen bg-background relative selection:bg-primary-container selection:text-on-primary-container max-w-3xl mx-auto lg:max-w-5xl md:shadow-2xl md:border-x border-outline-variant/20 overflow-x-hidden">
      <header className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl lg:max-w-5xl z-50 flex justify-between items-center px-4 h-16 glass-surface shadow-sm">
        <TopBar />
      </header>

      <main className={`w-full h-full min-h-screen overflow-y-auto ${currentView === 'onboarding' || currentView === 'login' ? '' : 'pt-20 pb-28 md:pb-24'} px-4`}>
        {currentView === 'login' && <ProviderLoginView onLoginSuccess={handleLoginSuccess} />}
        {currentView === 'onboarding' && <OnboardingView onComplete={handleLoginSuccess} />}

        {currentView === 'home' && (
          <HomeView
            appLanguage={appLanguage}
            onServiceTriggered={(data) => {
              setMatchData(data);
              setCurrentView('search');
            }}
          />
        )}

        {currentView === 'chat' && (
          <ChatView
            appLanguage={appLanguage}
            onServiceTriggered={(data) => {
              setMatchData(data);
              setCurrentView('search');
            }}
          />
        )}

        {currentView === 'search' && (
          <MatchView
            data={matchData}
            appLanguage={appLanguage}
            onBook={handleBooking}
            onSearchAgain={() => setCurrentView('home')}
          />
        )}

        {currentView === 'booking' && bookingPayload && (
          <BookingView
            payload={bookingPayload}
            appLanguage={appLanguage}
            onBack={() => setCurrentView('search')}
            onTrack={handleTrack}
          />
        )}

        {currentView === 'tracking' && trackingPayload && (
          <ServiceQualityView
            key={trackingPayload.booking_id}
            payload={trackingPayload}
            appLanguage={appLanguage}
            initialStage="en_route"
            onComplete={() => setCurrentView(isProvider ? 'provider_dash' : 'home')}
          />
        )}

        {currentView === 'bookings' && <BookingsListView appLanguage={appLanguage} onTrack={handleTrack} />}
        {currentView === 'profile' && <DashView appLanguage={appLanguage} onLogout={handleLogout} />}
        {currentView === 'provider_dash' && isProvider && userProfile?.provider_id && <ProviderDashView appLanguage={appLanguage} providerId={userProfile.provider_id} />}
      </main>

      {showFAB && (
        <button
          onClick={() => setCurrentView('chat')}
          className="fixed bottom-24 right-5 lg:right-[calc(50%-max(512px,50%)/2+1.25rem)] z-40 ai-gradient-border w-14 h-14 rounded-full shadow-xl bg-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all group"
          id="ai-fab"
        >
          <Zap className="w-6 h-6 text-primary group-hover:scale-110 transition-transform fill-current" />
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-secondary border-2 border-white rounded-full animate-pulse"></div>
        </button>
      )}

      {showBottomNav && (
        <footer className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-3xl lg:max-w-5xl z-50">
          <BottomNav />
        </footer>
      )}
    </div>
  );
}