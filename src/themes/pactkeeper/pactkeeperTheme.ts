import { defineTheme } from '@astryxdesign/core/theme';
import { gothicTheme } from '@astryxdesign/theme-gothic/built';

export const pactkeeperTheme = defineTheme({
  name: 'pactkeeper',
  extends: gothicTheme,
  typography: {
    scale: { base: 16, ratio: 1.2 },
    body: {
      family: 'Inter',
      fallbacks: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    heading: {
      family: 'Cinzel',
      fallbacks: 'Georgia, "Times New Roman", serif',
      weight: 'bold',
      weights: {
        1: 'bold',
        2: 'bold',
        3: 'bold',
        4: 'bold',
        5: 'semibold',
        6: 'semibold',
      },
    },
    code: {
      family: 'JetBrains Mono',
      fallbacks: '"SF Mono", ui-monospace, monospace',
    },
  },
  radius: { base: 4, multiplier: 1.25 },
  motion: { fast: 150, medium: 280, slow: 500, ratio: 0.75 },
  tokens: {
    // Deep Navy Fantasy Surfaces
    '--color-background-body': '#070a14',
    '--color-background-surface': '#0c1022',
    '--color-background-card': '#131a34',
    '--color-background-popover': '#192244',
    '--color-background-muted': '#18213e',
    '--color-background-inverted': '#f8fafc',

    // Celestial Gold Accent
    '--color-accent': '#f2bf4e',
    '--color-accent-muted': 'rgba(242, 191, 78, 0.16)',
    '--color-on-accent': '#101526',
    '--color-text-accent': '#f6cf6f',
    '--color-icon-accent': '#f2bf4e',
    '--color-neutral': 'rgba(248, 250, 252, 0.1)',

    // Overlays & Focus
    '--color-overlay': 'rgba(5, 8, 18, 0.82)',
    '--color-overlay-hover': 'rgba(242, 191, 78, 0.08)',
    '--color-overlay-pressed': 'rgba(242, 191, 78, 0.16)',
    '--focus-outline-color': '#f2bf4e',

    // Typography & Icon Colors
    '--color-text-primary': '#f8fafc',
    '--color-text-secondary': '#a3b3c9',
    '--color-text-disabled': '#586980',
    '--color-icon-primary': '#f8fafc',
    '--color-icon-secondary': '#a3b3c9',
    '--color-icon-disabled': '#586980',
    '--color-on-dark': '#f8fafc',
    '--color-on-light': '#0c1022',

    // Borders & Shadows
    '--color-border': 'rgba(242, 191, 78, 0.18)',
    '--color-border-emphasized': 'rgba(242, 191, 78, 0.48)',
    '--color-skeleton': '#253156',
    '--color-track': '#222d4f',
    '--color-shadow': 'rgba(0, 0, 0, 0.5)',
    '--shadow-low': '0 4px 12px rgba(0, 0, 0, 0.38)',
    '--shadow-med': '0 8px 24px rgba(0, 0, 0, 0.48)',
    '--shadow-high': '0 14px 36px rgba(0, 0, 0, 0.6)',
    '--shadow-inset-hover': 'inset 0 0 0 1px rgba(242, 191, 78, 0.35)',
    '--shadow-inset-selected': 'inset 0 0 0 2px rgba(242, 191, 78, 0.7)',

    // Status Tokens (tuned for dark navy surfaces)
    '--color-info': '#38bdf8',
    '--color-info-muted': 'rgba(56, 189, 248, 0.14)',
    '--color-on-info': '#062033',
    '--color-on-info-muted': '#bae6fd',
    '--color-text-info': '#7dd3fc',

    '--color-success': '#10b981',
    '--color-success-muted': 'rgba(16, 185, 129, 0.14)',
    '--color-on-success': '#04271a',
    '--color-on-success-muted': '#a7f3d0',
    '--color-text-success': '#6ee7b7',

    '--color-warning': '#f59e0b',
    '--color-warning-muted': 'rgba(245, 158, 11, 0.14)',
    '--color-on-warning': '#1c1203',
    '--color-on-warning-muted': '#fde68a',
    '--color-text-warning': '#fcd34d',

    '--color-error': '#f43f5e',
    '--color-error-muted': 'rgba(244, 63, 94, 0.14)',
    '--color-on-error': '#ffffff',
    '--color-on-error-muted': '#fecdd3',
    '--color-text-error': '#fda4af',

    // Categorical Badge Tokens for dark UI
    '--color-background-blue': 'rgba(59, 130, 246, 0.18)',
    '--color-border-blue': 'rgba(59, 130, 246, 0.45)',
    '--color-icon-blue': '#60a5fa',
    '--color-text-blue': '#93c5fd',

    '--color-background-cyan': 'rgba(56, 189, 248, 0.16)',
    '--color-border-cyan': 'rgba(56, 189, 248, 0.42)',
    '--color-icon-cyan': '#38bdf8',
    '--color-text-cyan': '#7dd3fc',

    '--color-background-gray': 'rgba(148, 163, 184, 0.14)',
    '--color-border-gray': 'rgba(148, 163, 184, 0.32)',
    '--color-icon-gray': '#94a3b8',
    '--color-text-gray': '#e2e8f0',

    '--color-background-green': 'rgba(16, 185, 129, 0.16)',
    '--color-border-green': 'rgba(16, 185, 129, 0.45)',
    '--color-icon-green': '#34d399',
    '--color-text-green': '#6ee7b7',

    '--color-background-yellow': 'rgba(242, 191, 78, 0.16)',
    '--color-border-yellow': 'rgba(242, 191, 78, 0.48)',
    '--color-icon-yellow': '#f2bf4e',
    '--color-text-yellow': '#fde68a',

    '--color-background-red': 'rgba(244, 63, 94, 0.16)',
    '--color-border-red': 'rgba(244, 63, 94, 0.45)',
    '--color-icon-red': '#fb7185',
    '--color-text-red': '#fda4af',
  },
  components: {
    text: {
      'type:display-1': {
        fontFamily: 'var(--font-family-heading)',
        fontSize: 'var(--text-display-1-size)',
        lineHeight: 'var(--text-display-1-leading)',
      },
      'type:display-2': {
        fontFamily: 'var(--font-family-heading)',
        fontSize: 'var(--text-display-2-size)',
        lineHeight: 'var(--text-display-2-leading)',
      },
      'type:display-3': {
        fontFamily: 'var(--font-family-heading)',
        fontSize: 'var(--text-display-3-size)',
        lineHeight: 'var(--text-display-3-leading)',
      },
    },
    button: {
      base: {
        borderRadius: 'var(--radius-element)',
        fontWeight: 'var(--font-weight-bold)',
        '--button-focus-offset': '2px',
        ':hover': {
          transform: 'translateY(-1px)',
        },
      },
      'variant:secondary': {
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        color: 'var(--color-text-primary)',
        borderColor: 'var(--color-border-emphasized)',
        borderWidth: '1px',
      },
      'variant:destructive': {
        backgroundColor: 'var(--color-error)',
        color: 'var(--color-on-error)',
      },
    },
    card: {
      base: {
        borderRadius: 'var(--radius-container)',
      },
    },
    dialog: {
      base: {
        borderRadius: 'var(--radius-container)',
      },
    },
    'chat-layout': {
      base: {
        borderRadius: 'var(--radius-container)',
      },
    },
  },
});
