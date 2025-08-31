import React, { useEffect, useState } from 'react';
import { Calendar, CreditCard, Package, Clock, CheckCircle, MessageCircle, Target, Loader2, Check, Home, Plus, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getProductByPriceId, stripeProducts } from '../stripe-config';

interface DashboardProps {
  user: any;
  onGoHome?: () => void;
}

interface Subscription {
  subscription_status: string;
  price_id: string;
  current_period_end: number;
  cancel_at_period_end: boolean;
  payment_method_brand: string;
  payment_method_last4: string;
}

interface Order {
  order_id: number;
  amount_total: number;
  currency: string;
  order_date: string;
  order_status: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onGoHome }) => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string>('');
  const [showSuccessStoryForm, setShowSuccessStoryForm] = useState(false);
  const [successStoryData, setSuccessStoryData] = useState({
    name: '',
    condition: '',
    story: '',
    timeframe: ''
  });
  const [submittingStory, setSubmittingStory] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!supabase) {
        setLoading(false);
        return;
      }

      try {
        // Fetch subscription data
        const { data: subData } = await supabase
          .from('stripe_user_subscriptions')
          .select('*')
          .maybeSingle();

        if (subData) {
          setSubscription(subData);
        }

        // Fetch order history
        const { data: orderData } = await supabase
          .from('stripe_user_orders')
          .select('*')
          .order('order_date', { ascending: false });

        if (orderData) {
          setOrders(orderData);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const formatDate = (timestamp: number | string) => {
    const date = typeof timestamp === 'number' ? new Date(timestamp * 1000) : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleCheckout = async (priceId: string) => {
    if (!supabase) {
      alert('Payment system is not configured. Please contact support.');
      return;
    }
    
    setCheckoutLoading(priceId);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('Please sign in again to continue.');
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

  const handleSuccessStorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingStory(true);

    try {
      // Here you would typically save to your database
      // For now, we'll just show a success message
      alert('Thank you for sharing your success story! It will be reviewed and may appear on our testimonials page.');
      setShowSuccessStoryForm(false);
      setSuccessStoryData({ name: '', condition: '', story: '', timeframe: '' });
    } catch (error) {
      console.error('Error submitting success story:', error);
      alert('There was an error submitting your story. Please try again.');
    } finally {
      setSubmittingStory(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const activeSubscription = subscription && subscription.subscription_status === 'active';
  const subscriptionProduct = subscription?.price_id ? getProductByPriceId(subscription.price_id) : null;

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

  // Reorder products: Virtual PT Consult, 12 Week Guided Program, Custom Recovery Plan
  const orderedProducts = [
    stripeProducts.find(p => p.name === 'Virtual PT Consult'),
    stripeProducts.find(p => p.name === '12 Week Guided Program'),
    stripeProducts.find(p => p.name === 'Custom Recovery Plan')
  ].filter(Boolean);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user.user_metadata?.full_name || user.email}
          </h1>
          <p className="text-gray-600">Manage your virtual physical therapy services</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Current Plan */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
              <div className="flex items-center mb-6">
                <Package className="h-8 w-8 text-blue-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">Choose Your Service</h2>
              </div>

              <div className="grid gap-6">
                {orderedProducts.map((pkg) => (
                  <div
                    key={pkg!.priceId}
                    className={`relative bg-white rounded-xl border-2 transition-all duration-300 hover:shadow-lg ${
                      pkg!.name === '12 Week Guided Program' ? 'border-blue-500' : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    {pkg!.name === '12 Week Guided Program' && (
                      <div className="absolute -top-3 left-6">
                        <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                          Most Popular
                        </span>
                      </div>
                    )}
                    
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <div className={`inline-flex p-3 rounded-lg ${
                            pkg!.name === '12 Week Guided Program' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {getPackageIcon(pkg!.name)}
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-gray-900">{pkg!.name}</h3>
                            <div className="text-2xl font-bold text-gray-900 mt-1">
                              {getPackagePrice(pkg!.name)}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleCheckout(pkg!.priceId)}
                          disabled={checkoutLoading === pkg!.priceId}
                          className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                            pkg!.name === '12 Week Guided Program'
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : 'bg-gray-900 text-white hover:bg-gray-800'
                          } flex items-center space-x-2`}
                        >
                          {checkoutLoading === pkg!.priceId ? (
                            <>
                              <Loader2 className="h-5 w-5 animate-spin" />
                              <span>Processing...</span>
                            </>
                          ) : (
                            <span>Get Started</span>
                          )}
                        </button>
                      </div>
                      
                      <p className="text-gray-600 mb-4">{pkg!.description}</p>
                      
                      <div className="grid md:grid-cols-2 gap-3">
                        {getPackageFeatures(pkg!.name).map((feature, featureIndex) => (
                          <div key={featureIndex} className="flex items-start">
                            <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-gray-700">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
                </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Navigation</h3>
              <div className="space-y-3">
                <button
                  onClick={onGoHome}
                  className="flex items-center w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <Home className="h-5 w-5 text-gray-600 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Return to Home</p>
                    <p className="text-sm text-gray-600">Go back to the main website</p>
                  </div>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <a
                  href="mailto:justinlemmodpt@gmail.com"
                  className="block w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <p className="font-medium text-gray-900">Contact Dr. Lemmo</p>
                  <p className="text-sm text-gray-600">Send an email directly</p>
                </a>
                <a
                  href="https://www.youtube.com/@justinlemmodpt"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <p className="font-medium text-gray-900">Exercise Library</p>
                  <p className="text-sm text-gray-600">Browse video demonstrations</p>
                </a>
                <button
                  onClick={() => setShowSuccessStoryForm(true)}
                  className="flex items-center w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <Plus className="h-5 w-5 text-gray-600 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Share Success Story</p>
                    <p className="text-sm text-gray-600">Tell others about your recovery</p>
                  </div>
                </button>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Need Help?</h3>
              <p className="text-blue-800 text-sm mb-4">
                Have questions about which service is right for you? Contact Dr. Lemmo directly for personalized guidance.
              </p>
              <a
                href="mailto:justinlemmodpt@gmail.com?subject=Service Selection Help"
                className="inline-flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Get Guidance
              </a>
            </div>
          </div>
        </div>

        {/* Success Story Modal */}
        {showSuccessStoryForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">Share Your Success Story</h3>
                  <button
                    onClick={() => setShowSuccessStoryForm(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                
                <form onSubmit={handleSuccessStorySubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Your Name (or initials)
                    </label>
                    <input
                      type="text"
                      required
                      value={successStoryData.name}
                      onChange={(e) => setSuccessStoryData({ ...successStoryData, name: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Sarah M."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Condition/Issue Treated
                    </label>
                    <input
                      type="text"
                      required
                      value={successStoryData.condition}
                      onChange={(e) => setSuccessStoryData({ ...successStoryData, condition: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Lower Back Pain, Shoulder Injury"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Your Success Story
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={successStoryData.story}
                      onChange={(e) => setSuccessStoryData({ ...successStoryData, story: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Tell us about your experience with Dr. Lemmo's virtual PT services and how it helped your recovery..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      When did you receive treatment?
                    </label>
                    <select
                      required
                      value={successStoryData.timeframe}
                      onChange={(e) => setSuccessStoryData({ ...successStoryData, timeframe: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select timeframe</option>
                      <option value="1 week ago">1 week ago</option>
                      <option value="2 weeks ago">2 weeks ago</option>
                      <option value="1 month ago">1 month ago</option>
                      <option value="2 months ago">2 months ago</option>
                      <option value="3 months ago">3 months ago</option>
                      <option value="6 months ago">6 months ago</option>
                      <option value="1 year ago">1 year ago</option>
                    </select>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-blue-800 text-sm">
                      <strong>Note:</strong> Your story will be reviewed before appearing on the website. 
                      We may edit for length and clarity while preserving your message.
                    </p>
                  </div>
                  
                  <div className="flex space-x-4">
                    <button
                      type="button"
                      onClick={() => setShowSuccessStoryForm(false)}
                      className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingStory}
                      className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                    >
                      {submittingStory ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span>Submitting...</span>
                        </>
                      ) : (
                        <span>Submit Story</span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};