# Dr. Justin Lemmo - Virtual Physical Therapy

A modern, responsive website for Dr. Justin Lemmo's virtual physical therapy services, featuring Stripe payment integration and Supabase authentication.

## Features

- **Virtual PT Services**: Three service tiers from consultation to 3-month guided programs
- **Secure Payments**: Stripe integration for safe payment processing
- **User Authentication**: Supabase-powered login and registration
- **Responsive Design**: Beautiful, mobile-first design with Tailwind CSS
- **User Dashboard**: Track subscriptions and order history
- **Professional Branding**: Clean, medical-grade design aesthetic

## Services Offered

1. **Virtual PT Consult** ($49)
   - 30-45 minute virtual consultation
   - Review PTBot recommendations
   - Exercise form guidance
   - Q&A session
   - Written summary of recommendations

2. **Custom Recovery Plan** ($149)
   - Initial assessment and consultation
   - 3-5 specific exercise prescriptions
   - Direct links to video demonstrations
   - 2-week chat-based follow-up
   - Plan modifications as needed

3. **3-Month Guided Program** ($299/month)
   - Complete movement assessment
   - Progressive exercise program
   - Weekly check-ins and adjustments
   - Unlimited messaging support
   - 3-month progress tracking
   - Final reassessment and maintenance plan

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Authentication**: Supabase Auth
- **Database**: Supabase (PostgreSQL)
- **Payments**: Stripe
- **Icons**: Lucide React
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Stripe account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/justinlemmo-dpt.git
cd justinlemmo-dpt
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Fill in your Supabase and Stripe credentials in `.env`.

4. Start the development server:
```bash
npm run dev
```

### Environment Variables

Create a `.env` file with the following variables:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
```

## Database Setup

The project includes Supabase migrations for:
- User authentication (handled by Supabase Auth)
- Stripe customer tracking
- Subscription management
- Order history
- Row Level Security (RLS) policies

## Deployment

### Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on every push to main branch

### Supabase Edge Functions

The Stripe integration uses Supabase Edge Functions that deploy automatically:
- `stripe-checkout`: Creates Stripe checkout sessions
- `stripe-webhook`: Handles Stripe webhook events

## Project Structure

```
src/
├── components/
│   ├── Auth/           # Authentication components
│   ├── Dashboard.tsx   # User dashboard
│   ├── Footer.tsx      # Site footer
│   ├── Header.tsx      # Site header
│   ├── Hero.tsx        # Landing page hero
│   ├── Services.tsx    # Service packages
│   ├── SuccessPage.tsx # Payment success page
│   └── Testimonials.tsx # Customer testimonials
├── lib/
│   └── supabase.ts     # Supabase client configuration
├── stripe-config.ts    # Stripe product configuration
├── App.tsx             # Main application component
└── main.tsx           # Application entry point

supabase/
├── functions/          # Edge functions
│   ├── stripe-checkout/
│   └── stripe-webhook/
└── migrations/         # Database migrations
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is proprietary and confidential. All rights reserved by Dr. Justin Lemmo, DPT.

## Contact

- **Email**: justinlemmodpt@gmail.com
- **YouTube**: [@justinlemmodpt](https://www.youtube.com/@justinlemmodpt)
- **Website**: [justinlemmodpt.com](https://justinlemmodpt.com)