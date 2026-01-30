import React, { useState } from 'react';
import { Check, MessageCircle, Calendar, Target, Loader2 } from 'lucide-react';
import { stripeProducts } from '../stripe-config';
import { supabase } from '../lib/supabase';
import { supabase } from '../lib/supabase';

interface ServicesProps {
  user: any;
  onShowAuth: () => void;
  id?: string;
}

export const Services: React.FC<ServicesProps> = ({ user, onShowAuth, id }) => {
  const [selectedPackage, setSelectedPackage] = useState<string>('');
  const [checkoutLoading, setCheckoutLoading] = useState<string>('');

  const getPackageIcon = (name: string) => {
    switch (name) {
      case 'Virtual PT Consult':
        return <MessageCircle className="h-8 w-8" />;
      case 'Custom Recovery Plan':
        return <Target className="h-8 w-8" />;
      case '12 Week Guided Program':
        return <Calendar className="h-8 w-8" />;
      default:
        return <MessageCircle className="h-8 w-8" />;
    }
  };

  const getPackageFeatures = (name: string) => {
    switch (name) {
      case 'Virtual PT Consult':
        return [
          '30-45 minute virtual consultation',
          'Review PTBot recommendations',
          'Exercise form guidance',
          'Q&A session',
          'Written summary of recommendations'
        ];
      case 'Custom Recovery Plan':
        return [
          'Initial assessment and consultation',
          '3-5 specific exercise prescriptions',
          'Direct links to video demonstrations',
          '2-week chat-based follow-up',
          'Plan modifications as needed'
        ];
      case '12 Week Guided Program':
        return [
          'Complete movement assessment',
          'Progressive exercise program',
          'Weekly check-ins and adjustments',
          'Unlimited messaging support',
          '12-week progress tracking',
          'Final reassessment and maintenance plan'
        ];
      default:
        return [];
    }
  };

  const getPackagePrice = (name: string) => {
    switch (name) {
      case 'Virtual PT Consult':
        return '$75';
      case 'Custom Recovery Plan':
        return '$175';
      case '12 Week Guided Program':
        return '$250';
      default:
        return '';
    }
  };

  const handleCheckout = async (priceId: string) => {
    if (!user) {
      onShowAuth();
      return;
    }
    
    setCheckoutLoading(priceId);
    
    try {
      if (!supabase) {
        alert('Payment system is not configured. Please contact support.');
        return;
      }
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        onShowAuth();
        return;
      }

      const product = stripeProducts.find(p => p.priceId === priceId);
      if (!product) {
        alert('Product not found. Please try again.');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          price_id: priceId,
          mode: product.mode,
          success_url: `${typeof window !== 'undefined' ? window.location.origin : ''}/success`,
          cancel_url: `${typeof window !== 'undefined' ? window.location.origin : ''}`,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        alert(data.error || 'Failed to create checkout session. Please try again.');
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('An error occurred. Please try again or contact support.');
    } finally {
      setCheckoutLoading('');
    }
  };


  // Reorder products: Virtual PT Consult, 12 Week Guided Program, Custom Recovery Plan
  const orderedProducts = [
    stripeProducts.find(p => p.name === 'Virtual PT Consult'),
    stripeProducts.find(p => p.name === '12 Week Guided Program'),
    stripeProducts.find(p => p.name === 'Custom Recovery Plan')
  ].filter(Boolean);

  return (
    <section id={id} className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Choose Your Recovery Path
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Select the virtual physical therapy package that best fits your needs and recovery goals.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {orderedProducts.map((pkg, index) => (
            <div
              key={pkg!.priceId}
              className={`relative bg-white rounded-2xl shadow-lg border-2 transition-all duration-300 hover:shadow-xl ${
                pkg!.name === '12 Week Guided Program' ? 'border-primary-500 scale-105' : 'border-gray-200 hover:border-primary-300'
              }`}
            >
              {pkg!.name === '12 Week Guided Program' && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
              )}
              
              <div className="p-8">
                <div className={`inline-flex p-3 rounded-lg mb-4 ${
                  pkg!.name === '12 Week Guided Program' ? 'bg-primary-100 text-primary-500' : 'bg-gray-100 text-gray-600'
                }`}>
                  {getPackageIcon(pkg!.name)}
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{pkg!.name}</h3>
                <div className="mb-4">
                  <div className="text-3xl font-bold text-gray-900">
                    {getPackagePrice(pkg!.name)}
                  </div>
                </div>
                <p className="text-gray-600 mb-6">{pkg!.description}</p>
                
                <ul className="space-y-3 mb-8">
                  {getPackageFeatures(pkg!.name).map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <button
                  onClick={() => handleCheckout(pkg!.priceId)}
                  disabled={checkoutLoading === pkg!.priceId}
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${
                    pkg!.name === '12 Week Guided Program'
                      ? 'bg-primary-500 text-white hover:bg-primary-600'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  } flex items-center justify-center space-x-2`}
                >
                  {checkoutLoading === pkg!.priceId ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <span>{user ? 'Get Started' : 'Sign In & Get Started'}</span>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};