import { useCallback, useEffect, useLayoutEffect, useState } from 'react';

export type Tab = 'plans' | 'journal' | 'stats' | 'data';

const TABS: readonly Tab[] = ['plans', 'journal', 'stats', 'data'];

/** `#/journal/<sessionId>` öffnet eine Session, `#/stats/<exerciseId>` eine Übung. */
export interface Route {
  tab: Tab;
  id: string | null;
}

export type Navigate = (tab: Tab, id?: string | null) => void;

/** Feste Unterseiten der Statistik (`#/stats/pushups`); sonst ist die ID eine Übung. */
export const STATS_PUSHUPS = 'pushups';
export const STATS_WEIGHT = 'weight';

function parseHash(hash: string): Route {
  const [tabPart, idPart] = hash.replace(/^#\/?/, '').split('/');
  const tab = TABS.includes(tabPart as Tab) ? (tabPart as Tab) : 'journal';
  let id: string | null = null;
  try {
    id = idPart ? decodeURIComponent(idPart) : null;
  } catch {
    // kaputte Kodierung in der URL – wie "keine ID" behandeln
  }
  return { tab, id };
}

/** Minimaler Hash-Router: Reload und Zurück-Button funktionieren ohne Router-Bibliothek. */
export function useHashRoute(): { route: Route; navigate: Navigate } {
  const [route, setRoute] = useState(() => parseHash(window.location.hash));

  useEffect(() => {
    const onChange = () => setRoute(parseHash(window.location.hash));
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  // Erst nach dem Rendern der neuen Seite nach oben scrollen.
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [route.tab, route.id]);

  const navigate = useCallback<Navigate>((tab, id) => {
    window.location.hash = id ? `/${tab}/${encodeURIComponent(id)}` : `/${tab}`;
  }, []);

  return { route, navigate };
}
