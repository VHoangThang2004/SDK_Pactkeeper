import { Gem, ScrollText, Mail, MessageSquare, type LucideIcon } from 'lucide-react';
import { useTranslation } from '../../core/i18n';

export interface PlayerNavItem {
  path: string;
  icon: LucideIcon;
  label: string;
  requiresAuth: boolean;
  authPromptTitle?: string;
  authPromptMessage?: string;
}

export const usePlayerNavItems = (): PlayerNavItem[] => {
  const { t } = useTranslation();

  return [
    {
      path: '/profile/topup',
      icon: Gem,
      label: t('nav.treasury'),
      requiresAuth: false,
    },
    {
      path: '/profile/history',
      icon: ScrollText,
      label: t('nav.ledger'),
      requiresAuth: true,
      authPromptTitle: t('nav.ledgerAuthTitle'),
      authPromptMessage: t('nav.ledgerAuthDesc'),
    },
    {
      path: '/profile/missives',
      icon: Mail,
      label: t('nav.missives'),
      requiresAuth: true,
      authPromptTitle: t('nav.missivesAuthTitle'),
      authPromptMessage: t('nav.missivesAuthDesc'),
    },
    {
      path: '/profile/support',
      icon: MessageSquare,
      label: t('nav.counsel'),
      requiresAuth: true,
      authPromptTitle: t('nav.counselAuthTitle'),
      authPromptMessage: t('nav.counselAuthDesc'),
    },
  ];
};

export const PLAYER_NAV_ITEMS: PlayerNavItem[] = [
  {
    path: '/profile/topup',
    icon: Gem,
    label: 'Treasury',
    requiresAuth: false,
  },
  {
    path: '/profile/history',
    icon: ScrollText,
    label: 'Ledger',
    requiresAuth: true,
    authPromptTitle: 'Sign In to View Ledger',
    authPromptMessage:
      'Please sign in to access your Treasury Ledger and track your PayOS payment history.',
  },
  {
    path: '/profile/missives',
    icon: Mail,
    label: 'Missives',
    requiresAuth: true,
    authPromptTitle: 'Sign In to View Missives',
    authPromptMessage:
      'Please sign in to read official missives and transaction notifications for your account.',
  },
  {
    path: '/profile/support',
    icon: MessageSquare,
    label: 'Counsel',
    requiresAuth: true,
    authPromptTitle: 'Sign In for Live Counsel',
    authPromptMessage:
      'Please sign in to open a real-time support conversation with the Keeper of Records.',
  },
];
