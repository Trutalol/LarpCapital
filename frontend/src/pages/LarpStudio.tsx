import { ChangeEvent, DragEvent, useEffect, useRef, useState } from 'react';
import { Download, Eye, EyeOff, ImagePlus, KeyRound, Loader2, Sparkles, Trash2, Wand2 } from 'lucide-react';
import { Client } from '@gradio/client';
import { PageHeader } from '../components/Layout';
import { Btn, Label, Panel, Tag } from '../components/ui';

// Keys live only in this browser's localStorage. Each is sent straight to its provider's API and nowhere else.
const KEY_STORAGE = 'larp.geminiKey';
const HF_STORAGE = 'larp.hfToken';
const MODEL_STORAGE = 'larp.geminiModel';
const PROVIDER_STORAGE = 'larp.provider';

type Provider = 'hf' | 'gemini';
// Free public Space (ZeroGPU). Runs on the user's own daily free GPU quota when they pass their HF token.
const HF_SPACE = 'black-forest-labs/FLUX.1-Kontext-Dev';

const MODELS = [
  { id: 'gemini-2.5-flash-image', label: 'Gemini 2.5 Flash Image (fast, cheap)' },
  { id: 'gemini-3-pro-image-preview', label: 'Gemini 3 Pro Image (best quality)' },
];

const SCENARIOS = [
  { id: 'rolex', emoji: '⌚', label: 'Iced-out Rolex', prompt: 'wearing a gold Rolex Daytona with a diamond bezel, wrist casually raised toward the camera, sitting in a luxury lounge' },
  { id: 'lambo', emoji: '🏎️', label: 'Lamborghini', prompt: 'leaning against a bright green Lamborghini Aventador parked outside a Monaco casino at golden hour' },
  { id: 'jet', emoji: '✈️', label: 'Private jet', prompt: 'sitting in the cream leather seat of a private jet cabin, champagne glass on the table, clouds through the window' },
  { id: 'yacht', emoji: '🛥️', label: 'Yacht deck', prompt: 'standing on the deck of a superyacht off the coast of Ibiza, turquoise water, sunglasses on' },
  { id: 'dubai', emoji: '🏙️', label: 'Dubai penthouse', prompt: 'standing on a penthouse balcony in Dubai at night with the Burj Khalifa lit up behind them' },
  { id: 'cash', emoji: '💸', label: 'Cash fan', prompt: 'holding a thick fan of hundred-dollar bills next to their face, more stacks of cash on a marble table' },
  { id: 'desk', emoji: '📈', label: 'Trading desk', prompt: 'sitting at a six-monitor trading setup full of green candlestick charts in a glass-walled skyscraper office' },
  { id: 'drip', emoji: '🧥', label: 'Designer drip', prompt: 'wearing a head-to-toe designer outfit with a Louis Vuitton bag and Cartier glasses, walking out of a Rodeo Drive boutique' },
];

const MAX_SIDE = 1536;

type Photo = { dataUrl: string; mime: string; base64: string };

function readKey(k: string) {
  try {
    return localStorage.getItem(k) ?? '';
  } catch {
    return '';
  }
}
function writeKey(k: string, v: string) {
  try {
    if (v) localStorage.setItem(k, v);
    else localStorage.removeItem(k);
  } catch {
    /* storage blocked: key just won't persist */
  }
}

/** Downscale the upload so the request stays small, and normalise to JPEG. */
async function loadPhoto(file: File): Promise<Photo> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = () => rej(new Error('Could not read that image.'));
      i.src = url;
    });
    const scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    return { dataUrl, mime: 'image/jpeg', base64: dataUrl.split(',')[1] };
  } finally {
    URL.revokeObjectURL(url);
  }
}

function buildPrompt(scene: string) {
  return [
    'Edit this photo into a realistic, high-end lifestyle "flex" photo.',
    `Keep the person's face, identity, skin tone, hair and body exactly the same as in the original photo. Show them ${scene}.`,
    'Photorealistic, natural lighting, shot on a professional camera, Instagram-worthy composition. No text, no watermarks.',
  ].join(' ');
}

type GeminiPart = { text?: string; inlineData?: { mimeType: string; data: string }; inline_data?: { mime_type: string; data: string } };

function blobToDataUrl(b: Blob) {
  return new Promise<string>((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = () => rej(new Error('Could not read the generated image.'));
    r.readAsDataURL(b);
  });
}

async function generateHF(token: string, photo: Photo, prompt: string): Promise<{ image: string }> {
  let client: Client;
  try {
    client = await Client.connect(HF_SPACE, token ? { token: token as `hf_${string}` } : {});
  } catch (e) {
    throw new Error(`Could not reach the Hugging Face Space (${(e as Error).message ?? e}). It may be sleeping or busy; try again in a minute.`);
  }
  const input = await (await fetch(photo.dataUrl)).blob();
  let out: { data: unknown };
  try {
    out = await client.predict('/infer', { input_image: input, prompt, seed: 0, randomize_seed: true, guidance_scale: 2.5, steps: 28 });
  } catch (e) {
    const msg = String((e as { message?: string })?.message ?? (e as { title?: string })?.title ?? e);
    if (/quota|exceeded|GPU/i.test(msg))
      throw new Error(`Hugging Face free GPU quota used up for today. It resets after 24h, or a PRO account gets more. Details: ${msg}`);
    throw new Error(msg);
  }
  const file = (out.data as { url?: string }[] | undefined)?.[0];
  if (!file?.url) throw new Error('The Space returned no image. Try again.');
  const res = await fetch(file.url, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);
  return { image: await blobToDataUrl(await res.blob()) };
}

async function generate(key: string, model: string, photo: Photo, prompt: string): Promise<{ image: string; note?: string }> {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }, { inline_data: { mime_type: photo.mime, data: photo.base64 } }] }],
      generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
    }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg: string = json?.error?.message ?? `Gemini returned ${res.status}`;
    if (res.status === 429 || /quota|limit: 0/i.test(msg))
      throw new Error(`Quota error: Gemini's image models usually need billing turned on for your key's Google Cloud project (the free tier allows 0 image requests). Enable billing at aistudio.google.com, or try the other model. Details: ${msg}`);
    if (res.status === 400 && /api key/i.test(msg)) throw new Error(`Google rejected the API key. Re-copy it from aistudio.google.com/apikey. Details: ${msg}`);
    if (res.status === 404) throw new Error(`Model "${model}" was not found for this key. Try the other model. Details: ${msg}`);
    throw new Error(msg);
  }
  const cand = json?.candidates?.[0];
  const parts: GeminiPart[] = cand?.content?.parts ?? [];
  const note = parts.map((p) => p.text).filter(Boolean).join(' ').trim() || undefined;
  for (const p of parts) {
    const d = p.inlineData ?? (p.inline_data && { mimeType: p.inline_data.mime_type, data: p.inline_data.data });
    if (d?.data) return { image: `data:${d.mimeType || 'image/png'};base64,${d.data}`, note };
  }
  const reason = json?.promptFeedback?.blockReason ?? cand?.finishReason;
  throw new Error(note ?? (reason ? `No image returned (${reason}). Try a different photo or scenario.` : 'No image returned. Try again.'));
}

export default function LarpStudio() {
  const [provider, setProvider] = useState<Provider>(() => (readKey(PROVIDER_STORAGE) as Provider) || 'hf');
  const storage = provider === 'hf' ? HF_STORAGE : KEY_STORAGE;
  const [keys, setKeys] = useState(() => ({ hf: readKey(HF_STORAGE), gemini: readKey(KEY_STORAGE) }));
  const key = keys[provider];
  const [keyDraft, setKeyDraft] = useState(key);
  const [showKey, setShowKey] = useState(false);
  const [model, setModel] = useState(() => readKey(MODEL_STORAGE) || MODELS[0].id);
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [scenario, setScenario] = useState(SCENARIOS[0].id);
  const [custom, setCustom] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<{ id: number; image: string; label: string; note?: string }[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => writeKey(MODEL_STORAGE, model), [model]);
  useEffect(() => {
    writeKey(PROVIDER_STORAGE, provider);
    setKeyDraft(keys[provider]);
    setError('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider]);

  const scene = custom.trim() || SCENARIOS.find((s) => s.id === scenario)?.prompt || '';
  const label = custom.trim() ? 'Custom' : SCENARIOS.find((s) => s.id === scenario)?.label ?? 'Larp';

  async function onFile(file?: File) {
    if (!file) return;
    if (!file.type.startsWith('image/')) return setError('That file is not an image.');
    setError('');
    try {
      setPhoto(await loadPhoto(file));
    } catch (e) {
      setError((e as Error).message);
    }
  }

  function saveKey() {
    const k = keyDraft.trim();
    setKeys((ks) => ({ ...ks, [provider]: k }));
    writeKey(storage, k);
  }

  async function run() {
    if (!key || !photo || !scene) return;
    setBusy(true);
    setError('');
    try {
      const r: { image: string; note?: string } = provider === 'hf' ? await generateHF(key, photo, buildPrompt(scene)) : await generate(key, model, photo, buildPrompt(scene));
      setResults((rs) => [{ id: Date.now(), image: r.image, label, note: r.note }, ...rs]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function download(image: string, name: string) {
    const a = document.createElement('a');
    a.href = image;
    a.download = `larp-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}.png`;
    a.click();
  }

  return (
    <div className="pb-16">
      <PageHeader title="LARP STUDIO" subtitle="Upload a selfie, pick a flex, let Gemini do the rest. Funded-trader lifestyle, zero funded-trader income." />
      <div className="mx-10 mt-8 grid max-w-6xl grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-4">
        <div className="space-y-4">
          <Panel className="p-5">
            <Label>AI provider</Label>
            <div className="mb-4 mt-2 grid grid-cols-2 gap-2">
              {([['hf', 'Hugging Face', 'Free daily quota'], ['gemini', 'Google Gemini', 'Needs billing']] as const).map(([id, name, sub]) => (
                <button
                  key={id}
                  onClick={() => setProvider(id)}
                  className={`rounded-lg border px-3 py-2 text-left transition ${provider === id ? 'border-up/60 bg-up/10 text-ink' : 'border-line2 bg-panel2 text-mute hover:text-ink'}`}
                >
                  <div className="text-[12px] font-semibold">{name}</div>
                  <div className="text-[10px] text-dim">{sub}</div>
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <Label>{provider === 'hf' ? 'Hugging Face token' : 'Gemini API key'}</Label>
              {key ? <Tag tone="green">Saved</Tag> : <Tag tone="amber">Required</Tag>}
            </div>
            <div className="mt-2 flex gap-2">
              <div className="relative flex-1">
                <KeyRound size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-dim" />
                <input
                  type={showKey ? 'text' : 'password'}
                  value={keyDraft}
                  autoComplete="off"
                  spellCheck={false}
                  placeholder={provider === 'hf' ? 'hf_...' : 'AIza...'}
                  onChange={(e) => setKeyDraft(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && saveKey()}
                  className="w-full rounded-lg border border-line2 bg-panel2 py-2 pl-8 pr-9 font-mono text-[12px] outline-none focus:border-up"
                />
                <button onClick={() => setShowKey((v) => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-dim hover:text-ink" title={showKey ? 'Hide' : 'Show'}>
                  {showKey ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
              <Btn tone="green" disabled={keyDraft.trim() === key} onClick={saveKey}>
                Save
              </Btn>
              {key && (
                <Btn onClick={() => { setKeys((ks) => ({ ...ks, [provider]: '' })); setKeyDraft(''); writeKey(storage, ''); }}>
                  <Trash2 size={12} />
                </Btn>
              )}
            </div>
            <div className="mt-2 text-[11px] leading-snug text-dim">
              {provider === 'hf' ? (
                <>
                  Stored only in this browser and sent only to Hugging Face. Create a free <b>Read</b> token at{' '}
                  <a href="https://huggingface.co/settings/tokens" target="_blank" rel="noreferrer" className="text-mute underline hover:text-ink">
                    huggingface.co/settings/tokens
                  </a>
                  . Runs FLUX.1 Kontext on your free daily GPU quota.
                </>
              ) : (
                <>
                  Stored only in this browser and sent only to Google. Get one at{' '}
                  <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" className="text-mute underline hover:text-ink">
                    aistudio.google.com/apikey
                  </a>
                  . Image models need billing enabled.
                </>
              )}
            </div>
            {provider === 'gemini' && <div className="mt-4">
              <Label>Model</Label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="mt-2 w-full rounded-lg border border-line2 bg-panel2 px-3 py-2 text-[12px] outline-none focus:border-up"
              >
                {MODELS.map((m) => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </select>
            </div>}
          </Panel>

          <Panel className="p-5">
            <Label>Your photo</Label>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e: ChangeEvent<HTMLInputElement>) => { onFile(e.target.files?.[0]); e.target.value = ''; }} />
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={(e: DragEvent) => e.preventDefault()}
              onDrop={(e: DragEvent) => { e.preventDefault(); onFile(e.dataTransfer.files?.[0]); }}
              className="mt-2 grid h-56 cursor-pointer place-items-center overflow-hidden rounded-lg border border-dashed border-line2 bg-panel2 hover:border-up/60"
            >
              {photo ? (
                <img src={photo.dataUrl} alt="Your upload" className="h-full w-full object-contain" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-center text-mute">
                  <ImagePlus size={22} />
                  <div className="text-[12px] font-semibold text-ink">Drop a selfie or click to upload</div>
                  <div className="text-[11px] text-dim">Clear, front-facing face works best</div>
                </div>
              )}
            </div>
            {photo && (
              <button onClick={() => setPhoto(null)} className="mt-2 text-[11px] text-dim hover:text-down">
                Remove photo
              </button>
            )}
          </Panel>

          <Panel className="p-5">
            <Label>Pick your flex</Label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {SCENARIOS.map((s) => {
                const active = !custom.trim() && scenario === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => { setScenario(s.id); setCustom(''); }}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-[12px] font-medium transition ${
                      active ? 'border-up/60 bg-up/10 text-ink' : 'border-line2 bg-panel2 text-mute hover:text-ink'
                    }`}
                  >
                    <span className="text-base">{s.emoji}</span>
                    {s.label}
                  </button>
                );
              })}
            </div>
            <div className="mt-4">
              <Label>Or describe your own</Label>
              <textarea
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                rows={2}
                placeholder="e.g. counting cash on a Bugatti hood in Miami with a Patek on"
                className="mt-2 w-full resize-none rounded-lg border border-line2 bg-panel2 px-3 py-2 text-[12px] outline-none focus:border-up"
              />
            </div>
            <Btn tone="green" className="mt-4 w-full py-2.5 text-[13px]" disabled={!key || !photo || !scene || busy} onClick={run}>
              {busy ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
              {busy ? 'Generating your larp…' : 'Generate larp'}
            </Btn>
            {!key && <div className="mt-2 text-center text-[11px] text-dim">Add your {provider === 'hf' ? 'Hugging Face token' : 'Gemini key'} first.</div>}
            {key && !photo && <div className="mt-2 text-center text-[11px] text-dim">Upload a photo of yourself.</div>}
            {error && <div className="mt-3 rounded-lg border border-down/40 bg-down/10 px-3 py-2 text-[11px] text-down">{error}</div>}
          </Panel>
        </div>

        <Panel className="flex min-h-[520px] flex-col p-5">
          <div className="flex items-center justify-between">
            <Label>Results</Label>
            {results.length > 0 && (
              <button onClick={() => setResults([])} className="text-[11px] text-dim hover:text-down">
                Clear
              </button>
            )}
          </div>
          {results.length === 0 && !busy ? (
            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <Sparkles size={26} className="mb-3 text-dim" />
              <div className="text-base font-semibold">No larps yet</div>
              <div className="mt-1 max-w-xs text-xs text-mute">Your generated photos show up here. Download the ones worth posting.</div>
            </div>
          ) : (
            <div className="mt-3 space-y-4">
              {busy && (
                <div className="grid h-72 place-items-center rounded-lg border border-line2 bg-panel2">
                  <div className="flex flex-col items-center gap-2 text-mute">
                    <Loader2 size={22} className="animate-spin text-up" />
                    <div className="text-[12px]">Renting the Lambo…</div>
                  </div>
                </div>
              )}
              {results.map((r) => (
                <div key={r.id} className="overflow-hidden rounded-lg border border-line2 bg-panel2">
                  <img src={r.image} alt={r.label} className="w-full" />
                  <div className="flex items-center justify-between gap-2 px-3 py-2">
                    <Tag tone="green">{r.label}</Tag>
                    <Btn onClick={() => download(r.image, r.label)}>
                      <Download size={12} /> Download
                    </Btn>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-auto pt-4 text-[10px] leading-snug text-dim">AI-generated images. For laughs only; don't use them to mislead anyone.</div>
        </Panel>
      </div>
    </div>
  );
}
