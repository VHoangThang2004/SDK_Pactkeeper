import React, { forwardRef } from 'react';
import { Link as RouterLink, type To } from 'react-router-dom';

export interface RouterLinkAdapterProps
  extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  href?: string;
  to?: To;
}

export const RouterLinkAdapter = forwardRef<HTMLAnchorElement, RouterLinkAdapterProps>(
  ({ href, to, target, rel, children, ...rest }, ref) => {
    const safeRel =
      target === '_blank'
        ? [rel, 'noopener', 'noreferrer'].filter(Boolean).join(' ')
        : rel;
    const routerTarget: To = to ?? href ?? '/';

    return (
      <RouterLink ref={ref} to={routerTarget} target={target} rel={safeRel} {...rest}>
        {children}
      </RouterLink>
    );
  }
);

RouterLinkAdapter.displayName = 'RouterLinkAdapter';
