import React, { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { Services } from './components/Services';
import { StateMap } from './components/StateMap';
import { Disclaimers } from './components/Disclaimers';
import { Testimonials } from './components/Testimonials';
import { Footer } from './components/Footer';
import { AuthPage } from './components/Auth/AuthPage';
import { Dashboard } from './components/Dashboard';
import { SuccessPage } from './components/SuccessPage';
import { supabase } from './lib/supabase';

function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);

  useEffect(() => {
    // Check if we're on the success page
    if (typeof window !== 'undefined' && window.location.pathname === '/success') {
      setShowSuccess(true);
    }

    if (!supabase) {
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAuthSuccess = () => {
    setShowAuth(false);
    if (showSuccess) {
      // Stay on success page after auth
      return;
    }
  };

  const handleSignOut = () => {
    setUser(null);
    setShowSuccess(false);
    setShowAuth(false);
    // Redirect to home page
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/');
    }
  };

  const handleGoHome = () => {
    setShowDashboard(false);
    setShowSuccess(false);
    setShowAuth(false);
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  const handleSuccessContinue = () => {
    setShowSuccess(false);
    // Redirect to home page
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/');
    }
  };

  const handleShowDashboard = () => {
    setShowDashboard(true);
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/dashboard');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show success page if we're on /success route
  if (showSuccess) {
    if (!user) {
      return <AuthPage onSuccess={handleAuthSuccess} />;
    }
    return <SuccessPage onContinue={handleSuccessContinue} />;
  }

  // Show auth page if requested
  if (showAuth && !user) {
    return <AuthPage onSuccess={handleAuthSuccess} />;
  }

  // Show dashboard for authenticated users
  if (user && showDashboard && !showSuccess) {
    return (
      <div className="min-h-screen bg-white">
        <Header user={user} onSignOut={handleSignOut} />
        <Dashboard user={user} onGoHome={handleGoHome} />
      </div>
    );
  }

  // Show landing page for non-authenticated users
  return (
    <div className="min-h-screen bg-white">
      <Header 
        user={user} 
        onSignOut={handleSignOut} 
        onShowAuth={() => setShowAuth(true)}
        onShowDashboard={user ? handleShowDashboard : undefined}
      />
      <Hero />
      <Services id="services" user={user} onShowAuth={() => setShowAuth(true)} />
      <StateMap />
      <Testimonials id="testimonials" user={user} onShowAuth={() => setShowAuth(true)} />
      <Disclaimers id="disclaimers" />
      <Footer />
    </div>
  );
}

export default App;