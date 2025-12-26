/**
 * NomadSSH Design System - Cyber Blue + Zinc Dark Theme
 * 
 * Color palette optimized for:
 * - Terminal/SSH usage (high contrast, eye-friendly)
 * - Dark mode (zinc-950 base)
 * - Modern dev tool aesthetic (GitHub, Vercel, Railway vibes)
 */

export const colors = {
  // Base backgrounds
  background: {
    DEFAULT: '#09090B',      // zinc-950 - Main app background
    surface: '#18181B',      // zinc-900 - Cards, panels, modals
    hover: '#27272A',        // zinc-800 - Hover states
    elevated: '#1F1F23',     // Slightly elevated surfaces
  },

  // Borders & dividers
  border: {
    DEFAULT: '#3F3F46',      // zinc-700 - Default borders
    subtle: '#27272A',       // zinc-800 - Subtle borders
    strong: '#52525B',       // zinc-600 - Strong emphasis
  },

  // Text colors
  text: {
    primary: '#E5E7EB',      // gray-200 - Main text
    secondary: '#71717A',    // zinc-500 - Secondary text
    tertiary: '#52525B',     // zinc-600 - Disabled/muted
    inverted: '#09090B',     // For light backgrounds
  },

  // Primary - Cyber Blue
  primary: {
    DEFAULT: '#06B6D4',      // cyan-500 - Buttons, links, focus
    hover: '#0891B2',        // cyan-600 - Hover state
    light: '#22D3EE',        // cyan-400 - Highlights, accents
    dark: '#0E7490',         // cyan-700 - Active/pressed
    subtle: 'rgba(6, 182, 212, 0.1)',   // Backgrounds
    border: 'rgba(6, 182, 212, 0.3)',   // Borders, rings
  },

  // Secondary - Sky Blue
  secondary: {
    DEFAULT: '#0EA5E9',      // sky-500
    hover: '#0284C7',        // sky-600
    light: '#38BDF8',        // sky-400
  },

  // Status colors
  status: {
    success: '#10B981',      // emerald-500 - Success messages
    error: '#EF4444',        // red-500 - Errors, destructive actions
    warning: '#F59E0B',      // amber-500 - Warnings
    info: '#3B82F6',         // blue-500 - Info messages
  },

  // Terminal-specific
  terminal: {
    background: '#000000',   // Pure black
    foreground: '#E5E7EB',   // gray-200
    cursor: '#06B6D4',       // cyan-500
    selection: 'rgba(6, 182, 212, 0.3)',
  },
};

/**
 * Common Tailwind class patterns for consistency
 */
export const tw = {
  // Buttons
  button: {
    primary: 'bg-primary hover:bg-primary-hover text-text-inverted font-medium px-4 py-2 rounded-lg transition-colors',
    secondary: 'bg-surface hover:bg-surface-hover text-text-primary border border-border px-4 py-2 rounded-lg transition-colors',
    ghost: 'hover:bg-surface-hover text-text-primary px-4 py-2 rounded-lg transition-colors',
    danger: 'bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors',
  },

  // Cards & surfaces
  card: 'bg-surface border border-border rounded-lg p-4',
  panel: 'bg-surface border border-border rounded-lg',

  // Input fields
  input: 'bg-background border border-border text-text-primary px-3 py-2 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/30 outline-none transition-all',

  // Text styles
  text: {
    primary: 'text-text-primary',
    secondary: 'text-text-secondary',
    muted: 'text-text-tertiary',
  },

  // Interactive states
  interactive: 'hover:bg-surface-hover active:bg-surface cursor-pointer transition-colors',
  
  // Focus rings
  focus: 'focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary',
};

/**
 * Gradients for special elements (logo, splash, highlights)
 */
export const gradients = {
  primary: 'bg-gradient-to-br from-cyan-400 to-blue-600',
  primarySubtle: 'bg-gradient-to-br from-cyan-500/20 to-blue-600/20',
  terminal: 'bg-gradient-to-b from-black to-zinc-950',
};

/**
 * Shadows (subtle, dark mode optimized)
 */
export const shadows = {
  sm: 'shadow-sm shadow-black/50',
  md: 'shadow-md shadow-black/50',
  lg: 'shadow-lg shadow-black/50',
  glow: 'shadow-lg shadow-primary/20',
};
