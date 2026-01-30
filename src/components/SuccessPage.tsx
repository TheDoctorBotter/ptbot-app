import React, { useEffect, useState } from 'react';
import { CheckCircle, ArrowRight, Calendar, MessageCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { stripeProducts, getProductByPriceId } from '../stripe-config';

interface SuccessPageProps {
  onContinue: () => void;
}

export const SuccessPage: React.FC<SuccessPageProps> = ({ onContinue }) => {
  const [purchasedProduct, setPurchasedProduct] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLatestPurchase = async () => {
      if (!supabase) {
        setLoading(false);
        return;
      }

      try {
        // Check for subscription first
        const { data: subscription } = await supabase
          .from('stripe_user_subscriptions')
          .select('price_id, subscription_status')
          .maybeSingle();

        if (subscription?.price_id && subscription.subscription_status === 'active') {
          const product = getProductByPriceId(subscription.price_id);
          if (product) {
            setPurchasedProduct(product.name);
            setLoading(false);
            return;
          }
        }

        // Check for recent orders
        const { data: orders } = await supabase
          .from('stripe_user_orders')
          .select('*')
          .eq('order_status', 'completed')
          .order('order_date', { ascending: false })
          .limit(1);

        if (orders && orders.length > 0) {
          // We don't have price_id in orders, so we'll use a generic message
          setPurchasedProduct('your selected service');
        }
      } catch (error) {
        console.error('Error fetching purchase info:', error);
        setPurchasedProduct('your selected service');
      } finally {
        setLoading(false);
      }
    };

    fetchLatestPurchase();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-primary-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your purchase details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-primary-50 flex items-center justify-center p-4">
      <div className="max-w-2xl mx-auto text-center">
        <div className="bg-white rounded-3xl shadow-2xl p-12">
          <div className="mb-8">
            <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-6" />
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Payment Successful!
            </h1>
            <p className="text-xl text-gray-600 mb-2">
              Thank you for purchasing {purchasedProduct}
            </p>
            <p className="text-gray-500">
              Dr. Lemmo will contact you within 24 hours to schedule your appointment.
            </p>
          </div>

          <div className="bg-primary-50 rounded-2xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">What happens next?</h3>
            <div className="space-y-4 text-left">
              <div className="flex items-start space-x-3">
                <Calendar className="h-6 w-6 text-primary-500 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Schedule Your Session</p>
                  <p className="text-gray-600 text-sm">Dr. Lemmo will reach out to schedule your virtual consultation</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <MessageCircle className="h-6 w-6 text-primary-500 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Prepare for Your Consultation</p>
                  <p className="text-gray-600 text-sm">Gather any relevant medical history or PTBot recommendations</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <button
              onClick={onContinue}
              className="w-full bg-primary-500 text-white py-4 px-8 rounded-lg font-semibold hover:bg-primary-600 transition-colors flex items-center justify-center space-x-2"
            >
              <span>Continue to Dashboard</span>
              <ArrowRight className="h-5 w-5" />
            </button>
            
            <p className="text-sm text-gray-500">
              You'll receive a confirmation email shortly with all the details.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};