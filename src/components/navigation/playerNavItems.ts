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
