/**
 * PTBot Design Token System
 *
 * A consistent color system based on scarlet + gray for a clean, clinical PT/healthcare feel.
 * Use these tokens throughout the app for consistent branding.
 */

// =============================================================================
// COLOR PALETTE
// =============================================================================

export const colors = {
  // Primary - Scarlet (brand color)
  primary: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#C41E3A',  // Main brand scarlet
    600: '#B91C1C',  // Darker scarlet for hover states
    700: '#991B1B',
    800: '#7F1D1D',
    900: '#450A0A',
  },

  // Neutrals - Gray scale
  neutral: {
    50: '#FAFAFA',   // Lightest background
    100: '#F4F4F5',  // Light background
    200: '#E4E4E7',  // Borders, dividers
    300: '#D4D4D8',  // Disabled states
    400: '#A1A1AA',  // Placeholder text
    500: '#71717A',  // Secondary text
    600: '#52525B',  // Body text
    700: '#3F3F46',  // Headings
    800: '#27272A',  // Dark text
    900: '#18181B',  // Darkest text
  },

  // Semantic colors
  success: {
    50: '#F0FDF4',
    100: '#DCFCE7',
    500: '#22C55E',
    600: '#16A34A',
    700: '#15803D',
  },

  warning: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
  },

  error: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
  },

  info: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    500: '#3B82F6',
    600: '#2563EB',
    700: '#1D4ED8',
  },

  // Base colors
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

// =============================================================================
// SEMANTIC TOKENS (Use these in components)
// =============================================================================

export const theme = {
  // Backgrounds
  background: {
    primary: colors.white,
    secondary: colors.neutral[50],
    tertiary: colors.neutral[100],
    inverse: colors.neutral[900],
    brand: colors.primary[500],
    brandSubtle: colors.primary[50],
  },

  // Surfaces (cards, modals, etc.)
  surface: {
    primary: colors.white,
    secondary: colors.neutral[50],
    elevated: colors.white,
    brand: colors.primary[500],
  },

  // Borders
  border: {
    default: colors.neutral[200],
    subtle: colors.neutral[100],
    strong: colors.neutral[300],
    brand: colors.primary[500],
    focus: colors.primary[500],
  },

  // Text colors
  text: {
    primary: colors.neutral[900],
    secondary: colors.neutral[600],
    tertiary: colors.neutral[500],
    disabled: colors.neutral[400],
    inverse: colors.white,
    brand: colors.primary[500],
    link: colors.primary[600],
    error: colors.error[600],
    success: colors.success[600],
    warning: colors.warning[600],
  },

  // Interactive elements
  interactive: {
    primary: colors.primary[500],
    primaryHover: colors.primary[600],
    primaryActive: colors.primary[700],
    primaryDisabled: colors.neutral[300],

    secondary: colors.neutral[100],
    secondaryHover: colors.neutral[200],
    secondaryActive: colors.neutral[300],

    destructive: colors.error[500],
    destructiveHover: colors.error[600],
  },

  // Status indicators
  status: {
    success: colors.success[500],
    successBackground: colors.success[50],
    successBorder: colors.success[500],

    warning: colors.warning[500],
    warningBackground: colors.warning[50],
    warningBorder: colors.warning[500],

    error: colors.error[500],
    errorBackground: colors.error[50],
    errorBorder: colors.error[500],

    info: colors.info[500],
    infoBackground: colors.info[50],
    infoBorder: colors.info[500],
  },
} as const;

// =============================================================================
// TYPOGRAPHY
// =============================================================================

export const typography = {
  fontFamily: {
    sans: 'System',
    mono: 'Courier',
  },

  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },

  fontWeight: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },

  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

// =============================================================================
// SPACING
// =============================================================================

export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
} as const;

// =============================================================================
// BORDER RADIUS
// =============================================================================

export const borderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  full: 9999,
} as const;

// =============================================================================
// SHADOWS (for React Native)
// =============================================================================

export const shadows = {
  sm: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
} as const;

// =============================================================================
// COMPONENT-SPECIFIC STYLES
// =============================================================================

// Header/Navigation
export const headerStyles = {
  backgroundColor: colors.primary[500],
  textColor: colors.white,
  subtitleColor: colors.primary[100],
  logoBackground: colors.primary[600],
};

// Buttons
export const buttonStyles = {
  primary: {
    backgroundColor: colors.primary[500],
    textColor: colors.white,
    hoverBackgroundColor: colors.primary[600],
    activeBackgroundColor: colors.primary[700],
    disabledBackgroundColor: colors.neutral[300],
    disabledTextColor: colors.neutral[500],
  },
  secondary: {
    backgroundColor: colors.neutral[100],
    textColor: colors.neutral[700],
    hoverBackgroundColor: colors.neutral[200],
    borderColor: colors.neutral[300],
  },
  outline: {
    backgroundColor: colors.transparent,
    textColor: colors.primary[500],
    borderColor: colors.primary[500],
    hoverBackgroundColor: colors.primary[50],
  },
  destructive: {
    backgroundColor: colors.error[500],
    textColor: colors.white,
    hoverBackgroundColor: colors.error[600],
  },
};

// Cards
export const cardStyles = {
  backgroundColor: colors.white,
  borderColor: colors.neutral[200],
  borderRadius: borderRadius.lg,
  ...shadows.md,
};

// Forms
export const formStyles = {
  input: {
    backgroundColor: colors.neutral[50],
    borderColor: colors.neutral[300],
    focusBorderColor: colors.primary[500],
    placeholderColor: colors.neutral[400],
    textColor: colors.neutral[900],
  },
  label: {
    textColor: colors.neutral[700],
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
};

// Tab bar
export const tabBarStyles = {
  backgroundColor: colors.white,
  activeColor: colors.primary[500],
  inactiveColor: colors.neutral[500],
  borderColor: colors.neutral[200],
};

// Default export for convenience
export default {
  colors,
  theme,
  typography,
  spacing,
  borderRadius,
  shadows,
  headerStyles,
  buttonStyles,
  cardStyles,
  formStyles,
  tabBarStyles,
};
