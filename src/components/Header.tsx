import React from 'react';
import { Stethoscope, Youtube, User, LogOut, Menu, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface HeaderProps {
  user: any;
  onSignOut: () => void;
  onShowAuth?: () => void;
  onShowDashboard?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user, onSignOut, onShowAuth, onShowDashboard }) => {
  const [showMobileMenu, setShowMobileMenu] = React.useState(false);

  const handleSignOut = async () => {
    if (!supabase) {
      onSignOut();
      return;
    }
    
    await supabase.auth.signOut();
    onSignOut();
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setShowMobileMenu(false);
  };

  const handleLogoClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setShowMobileMenu(false);
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          <button 
            onClick={handleLogoClick}
            className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
          >
            <Stethoscope className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">Dr. Justin Lemmo</h1>
              <p className="text-sm text-gray-600">Doctor of Physical Therapy</p>
            </div>
          </button>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <button
              onClick={() => scrollToSection('services')}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Recovery Plans
            </button>
            <button
              onClick={() => scrollToSection('testimonials')}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Testimonials
            </button>
            <button
              onClick={() => scrollToSection('disclaimers')}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Legal
            </button>
          </nav>

          <div className="flex items-center space-x-4">
            <a
              href="https://www.youtube.com/@justinlemmodpt"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              <Youtube className="h-5 w-5" />
              <span className="hidden sm:inline">Exercise Library</span>
            </a>
            
            {user ? (
              <div className="flex items-center space-x-3">
                {onShowDashboard && (
                  <button
                    onClick={onShowDashboard}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Dashboard
                  </button>
                )}
                <div className="flex items-center space-x-2 text-gray-700">
                  <User className="h-5 w-5" />
                  <span className="hidden sm:inline text-sm">{user.email}</span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center space-x-1 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="hidden sm:inline text-sm">Sign Out</span>
                </button>
              </div>
            ) : (
              <button
                onClick={onShowAuth}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Sign In
              </button>
            )}
            
            {/* Mobile menu button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 text-gray-600 hover:text-gray-900"
            >
              {showMobileMenu ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
        
        {/* Mobile Navigation */}
        {showMobileMenu && (
          <nav className="md:hidden mt-4 pb-4 border-t border-gray-100 pt-4">
            <div className="flex flex-col space-y-3">
              <button
                onClick={() => scrollToSection('services')}
                className="text-left text-gray-600 hover:text-gray-900 transition-colors py-2"
              >
                Recovery Plans
              </button>
              <button
                onClick={() => scrollToSection('testimonials')}
                className="text-left text-gray-600 hover:text-gray-900 transition-colors py-2"
              >
                Testimonials
              </button>
              <button
                onClick={() => scrollToSection('disclaimers')}
                className="text-left text-gray-600 hover:text-gray-900 transition-colors py-2"
              >
                Legal
              </button>
              {user && onShowDashboard && (
                <button
                  onClick={onShowDashboard}
                  className="text-left bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Dashboard
                </button>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};