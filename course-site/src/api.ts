/**
 * Lifestyle photos come from the same Gemini backend as LarpCapital's Guru Mode
 * (POST {VITE_API_URL}/api/image {scene} -> {image: data URL}). Without it, gradient placeholders.
 */

export type Scene = 'lambo' | 'penthouse' | 'dubai' | 'yacht' | 'jet';

const API = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '');

export const LARPCAPITAL_URL =
  (import.meta.env.VITE_LARPCAPITAL_URL as string | undefined) ?? (import.meta.env.DEV ? '/' : 'https://larpcapital.onrender.com');

const cacheKey = (scene: Scene) => `larpmodel-img-${scene}`;

export async function sceneImage(scene: Scene): Promise<string> {
  try {
    const hit = sessionStorage.getItem(cacheKey(scene));
    if (hit) return hit;
  } catch {
    /* storage blocked */
  }
  if (API) {
    try {
      const res = await fetch(`${API}/api/image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scene }),
      });
      if (!res.ok) throw new Error(`/api/image ${res.status}`);
      const { image } = (await res.json()) as { image: string };
      try {
        sessionStorage.setItem(cacheKey(scene), image);
      } catch {
        /* quota: images are big, fine to skip */
      }
      return image;
    } catch (e) {
      console.warn('[larpmodel] image backend failed, using placeholder', e);
    }
  }
  return placeholder(scene);
}

const ART: Record<Scene, { emoji: string; from: string; to: string }> = {
  lambo: { emoji: '🏎️', from: '#2b1a05', to: '#f5b83d' },
  penthouse: { emoji: '🏙️', from: '#05101f', to: '#2962ff' },
  dubai: { emoji: '🌴', from: '#2a1405', to: '#ff8a3d' },
  yacht: { emoji: '🛥️', from: '#03161a', to: '#2fd9c8' },
  jet: { emoji: '✈️', from: '#101114', to: '#9aa0aa' },
};

function placeholder(scene: Scene) {
  const { emoji, from, to } = ART[scene];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs>
<rect width="1200" height="900" fill="url(#g)"/>
<text x="600" y="470" font-size="320" text-anchor="middle" dominant-baseline="middle">${emoji}</text>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
