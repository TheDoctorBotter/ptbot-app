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
import { supabase } from '@/lib/supabase';
import { PTBOT_PRODUCTS, type ProductType } from '@/src/config/stripe';

interface PaywallCardProps {
  condition?: string;
  onEntitlementsRefresh?: () => void;
}

export default function PaywallCard({ condition, onEntitlementsRefresh }: PaywallCardProps) {
  const [loadingType, setLoadingType] = useState<ProductType | null>(null);

  const handlePurchase = async (productType: ProductType) => {
    if (!supabase) {
      Alert.alert('Not available', 'Please configure the app before purchasing.');
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      Alert.alert('Sign in required', 'Please sign in to purchase.');
      return;
    }

    setLoadingType(productType);
    try {
      // Determine success / cancel URLs
      const appUrl = (process.env.EXPO_PUBLIC_APP_URL ?? '').replace(/\/$/, '');
      const successUrl = appUrl
        ? `${appUrl}/checkout/success`
        : 'https://ptbot.app/checkout/success';
      const cancelUrl = appUrl
        ? `${appUrl}/checkout/cancel`
        : 'https://ptbot.app/checkout/cancel';

      const { data, error } = await supabase.functions.invoke('stripe-checkout', {
        method: 'POST',
        body: {
          product_type: productType,
          success_url:  successUrl,
          cancel_url:   cancelUrl,
          ...(condition && productType === 'plan_onetime' ? { condition } : {}),
        },
      });

      if (error || !data?.url) {
        throw new Error(error?.message ?? 'No checkout URL returned');
      }

      // Open Stripe hosted checkout in browser
      await Linking.openURL(data.url);

      // After the user comes back, refresh entitlements
      onEntitlementsRefresh?.();

    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      Alert.alert('Checkout error', msg);
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
  disclaimer: {
    fontSize: typography.fontSize.xs,
    color: colors.neutral[400],
    textAlign: 'center',
    marginTop: spacing[2],
  },
});
