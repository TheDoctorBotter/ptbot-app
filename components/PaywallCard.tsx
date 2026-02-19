/**
 * PaywallCard – shown after a free user sees their 2 preview exercises.
 *
 * Renders three purchase options side-by-side (or stacked on small screens).
 * Each taps into stripe-checkout to get a hosted URL, then opens it in the
 * browser.  On return to the app the parent should call `onEntitlementsRefresh`.
 *
 * Props:
 *   condition          The assessed condition (e.g. "Knee") for plan_onetime scoping.
 *   onEntitlementsRefresh  Called after returning from checkout so the parent
 *                          can refresh entitlement state.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Platform,
  Alert,
} from 'react-native';
import { Lock, Star, Video, Zap } from 'lucide-react-native';
import { colors, spacing, borderRadius, typography, shadows } from '@/constants/theme';
import { supabase, supabaseUrl, supabaseAnonKey } from '@/lib/supabase';
import { PTBOT_PRODUCTS, type ProductType } from '@/src/config/stripe';

interface PaywallCardProps {
  condition?: string;
  onEntitlementsRefresh?: () => void;
}

export default function PaywallCard({ condition, onEntitlementsRefresh }: PaywallCardProps) {
  const [loadingType, setLoadingType] = useState<ProductType | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handlePurchase = async (productType: ProductType) => {
    if (!supabase) {
      Alert.alert('Not available', 'Please configure the app before purchasing.');
      return;
    }

    // Helper: try checkout with a given token; returns the fetch Response.
    const attemptCheckout = async (token: string, successUrl: string, cancelUrl: string) => {
      const fnUrl = `${supabaseUrl}/functions/v1/stripe-checkout`;
      console.log('[PaywallCard] POST', fnUrl, 'product:', productType);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20_000);
      try {
        return await fetch(fnUrl, {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            product_type: productType,
            success_url:  successUrl,
            cancel_url:   cancelUrl,
            ...(condition && productType === 'plan_onetime' ? { condition } : {}),
          }),
        });
      } finally {
        clearTimeout(timeoutId);
      }
    };

    let { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      Alert.alert('Sign in required', 'Please sign in to purchase.');
      return;
    }

    setLoadingType(productType);
    setErrorMsg(null);
    try {
      if (!supabaseUrl) {
        throw new Error(
          'EXPO_PUBLIC_SUPABASE_URL is not set. ' +
          'Add it to your .env file and to Vercel → Settings → Environment Variables, then redeploy.'
        );
      }

      const appUrl = (process.env.EXPO_PUBLIC_APP_URL ?? '').replace(/\/$/, '');
      const successUrl = appUrl ? `${appUrl}/checkout/success` : 'https://ptbot.app/checkout/success';
      const cancelUrl  = appUrl ? `${appUrl}/checkout/cancel`  : 'https://ptbot.app/checkout/cancel';

      let response: Response;
      try {
        response = await attemptCheckout(session.access_token, successUrl, cancelUrl);
      } catch (networkErr) {
        const isTimeout = networkErr instanceof Error && networkErr.name === 'AbortError';
        throw new Error(
          isTimeout
            ? 'Request timed out. Please check your connection and try again.'
            : `Cannot reach Supabase (${networkErr instanceof Error ? networkErr.message : 'network error'}). URL: ${supabaseUrl}`
        );
      }

      // 401 → the stored JWT may be stale (e.g. after switching Supabase projects).
      // Attempt one silent token refresh then retry before surfacing the error.
      if (response.status === 401) {
        console.log('[PaywallCard] 401 – attempting session refresh...');
        const { data: { session: refreshed }, error: refreshErr } =
          await supabase.auth.refreshSession();
        if (refreshErr || !refreshed) {
          throw new Error(
            'Your session has expired or belongs to a different project.\n' +
            'Please sign out and sign back in, then try again.'
          );
        }
        session = refreshed;
        try {
          response = await attemptCheckout(session.access_token, successUrl, cancelUrl);
        } catch (networkErr) {
          const isTimeout = networkErr instanceof Error && networkErr.name === 'AbortError';
          throw new Error(
            isTimeout
              ? 'Request timed out after token refresh. Check your connection and try again.'
              : `Cannot reach Supabase after token refresh. URL: ${supabaseUrl}`
          );
        }
      }

      const rawText = await response.text();
      console.log('[PaywallCard] response', response.status, rawText.slice(0, 300));

      let data: any = {};
      try { data = JSON.parse(rawText); } catch { /* non-JSON body */ }

      if (!response.ok || !data?.url) {
        const detail =
          (data?.error ??
          data?.message ??
          (rawText.length < 200 ? rawText : '')) ||
          `HTTP ${response.status}`;
        throw new Error(`[${response.status}] ${detail}`);
      }

      console.log('[PaywallCard] checkout_url:', data.url);
      if (Platform.OS === 'web') {
        window.location.assign(data.url);
      } else {
        await Linking.openURL(data.url);
      }

      onEntitlementsRefresh?.();

    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      console.error('[PaywallCard] checkout error:', msg);
      setErrorMsg(msg);
      if (Platform.OS !== 'web') Alert.alert('Checkout error', msg);
    } finally {
      setLoadingType(null);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Lock size={24} color={colors.primary[500]} />
        <View style={styles.headerText}>
          <Text style={styles.title}>Unlock Your Full Plan</Text>
          <Text style={styles.subtitle}>
            You're seeing 2 of your personalised exercises.
            Choose an option to access everything.
          </Text>
        </View>
      </View>

      {/* Product cards */}
      {(['plan_onetime', 'subscription', 'telehealth_onetime'] as ProductType[]).map((type) => {
        const product = PTBOT_PRODUCTS[type];
        const isLoading = loadingType === type;
        const icon =
          type === 'plan_onetime'       ? <Zap size={20}   color={product.highlightColor} /> :
          type === 'subscription'        ? <Star size={20}  color={product.highlightColor} /> :
                                           <Video size={20} color={product.highlightColor} />;

        return (
          <View key={type} style={[styles.productCard, { borderColor: product.highlightColor + '40' }]}>
            {/* Card header */}
            <View style={styles.productHeader}>
              <View style={[styles.iconBubble, { backgroundColor: product.highlightColor + '18' }]}>
                {icon}
              </View>
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={[styles.productPrice, { color: product.highlightColor }]}>
                  {product.price}
                </Text>
              </View>
            </View>

            {/* Features */}
            <View style={styles.features}>
              {product.features.map((f, i) => (
                <View key={i} style={styles.featureRow}>
                  <Text style={[styles.featureDot, { color: product.highlightColor }]}>✓</Text>
                  <Text style={styles.featureText}>{f}</Text>
                </View>
              ))}
            </View>

            {/* CTA */}
            <TouchableOpacity
              style={[styles.ctaButton, { backgroundColor: product.highlightColor }, isLoading && styles.buttonDisabled]}
              onPress={() => handlePurchase(type)}
              disabled={isLoading || loadingType !== null}
              activeOpacity={0.85}
            >
              {isLoading
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.ctaText}>{product.ctaLabel}</Text>
              }
            </TouchableOpacity>
          </View>
        );
      })}

      {errorMsg && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      )}

      <Text style={styles.disclaimer}>
        Payments are processed securely by Stripe. Cancel anytime for subscriptions.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing[4],
    padding: spacing[4],
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.primary[100],
    ...shadows.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
    marginBottom: spacing[5],
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.neutral[900],
    marginBottom: spacing[1],
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[600],
    lineHeight: typography.fontSize.sm * 1.5,
  },
  productCard: {
    borderWidth: 1.5,
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    marginBottom: spacing[3],
    backgroundColor: colors.neutral[50],
  },
  productHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginBottom: spacing[3],
  },
  iconBubble: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.neutral[900],
  },
  productPrice: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    marginTop: 2,
  },
  features: {
    gap: spacing[1],
    marginBottom: spacing[4],
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
  },
  featureDot: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    lineHeight: typography.fontSize.sm * 1.6,
  },
  featureText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.neutral[700],
    lineHeight: typography.fontSize.sm * 1.5,
  },
  ctaButton: {
    borderRadius: borderRadius.lg,
    paddingVertical: spacing[3],
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: borderRadius.lg,
    padding: spacing[3],
    marginTop: spacing[2],
  },
  errorText: {
    color: '#DC2626',
    fontSize: typography.fontSize.xs,
    lineHeight: typography.fontSize.xs * 1.5,
  },
  disclaimer: {
    fontSize: typography.fontSize.xs,
    color: colors.neutral[400],
    textAlign: 'center',
    marginTop: spacing[2],
  },
});
