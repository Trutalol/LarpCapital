import { AnchorHTMLAttributes, useEffect, useState } from 'react';

/**
 * Tiny hash router. Hash URLs (#/courses/larp-model) work everywhere this site is served:
 * under LarpCapital's /course proxy in dev and as its own static site in production, with no rewrites.
 */

export type Route =
  | { page: 'home' }
  | { page: 'catalog'; category?: string }
  | { page: 'course'; slug: string }
  | { page: 'cart' }
  | { page: 'checkout' }
  | { page: 'order'; id: string }
  | { page: 'library' }
  | { page: 'learn'; slug: string; lesson?: string };

export function parse(hash: string): Route {
  const [path, query = ''] = hash.replace(/^#\/?/, '').split('?');
  const parts = path.split('/').filter(Boolean).map(decodeURIComponent);
  const q = new URLSearchParams(query);
  switch (parts[0]) {
    case 'courses':
      return parts[1] ? { page: 'course', slug: parts[1] } : { page: 'catalog', category: q.get('category') ?? undefined };
    case 'cart':
      return { page: 'cart' };
    case 'checkout':
      return { page: 'checkout' };
    case 'order':
      return { page: 'order', id: parts[1] ?? '' };
    case 'library':
      return { page: 'library' };
    case 'learn':
      return { page: 'learn', slug: parts[1] ?? '', lesson: parts[2] };
    default:
      return { page: 'home' };
  }
}

export function useRoute(): Route {
  const [hash, setHash] = useState(() => window.location.hash);
  useEffect(() => {
    const onChange = () => {
      setHash(window.location.hash);
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return parse(hash);
}

export const href = (path: string) => `#/${path.replace(/^\//, '')}`;

export function go(path: string) {
  window.location.hash = href(path);
}

export function Link({ to, ...rest }: { to: string } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>) {
  return <a href={href(to)} {...rest} />;
}
