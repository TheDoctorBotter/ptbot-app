export interface StripeProduct {
  id: string;
  priceId: string;
  name: string;
  description: string;
  mode: 'payment' | 'subscription';
  comingSoon: boolean;
}

export const stripeProducts: StripeProduct[] = [
  {
    id: 'virtual-consult',
    priceId: 'price_1RsA5jLBHhyJpJHOMe424Zh9', // Replace with your actual Stripe price ID
    name: 'Virtual PT Consult',
    description: '30-45 minute virtual consultation, review PTBot recommendations, Exercise form guidance, Q&A session, Written summary of recommendations.',
    mode: 'payment',
    comingSoon: false
  },
  {
    id: 'custom-recovery-plan',
    priceId: 'price_1RsA6oLBHhyJpJHOodF3J4Uy', // Replace with your actual Stripe price ID
    name: 'Custom Recovery Plan',
    description: 'Initial assessment and consultation, 3-5 specific exercise prescriptions, direct links to video demonstrations, 2-week chat-based follow up, plan modifications if needed.',
    mode: 'payment',
    comingSoon: false
  },
  {
    id: '12-week-program',
    priceId: 'price_1RsA7pLBHhyJpJHOZVBbW412', // Replace with your actual Stripe price ID
    name: '12 Week Guided Program',
    description: 'Complete movement assessment, progressive exercise program, weekly check-ins and adjustments, unlimited messaging support, 3-month progress tracking, final reassessment and maintenance plan.',
    mode: 'payment',
    comingSoon: false
  }
];

export const getProductByPriceId = (priceId: string): StripeProduct | undefined => {
  return stripeProducts.find(product => product.priceId === priceId);
};
