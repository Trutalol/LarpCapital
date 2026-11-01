import { useState } from 'react';
import { Check, Clapperboard, Copy, Download, Eye, EyeOff, KeyRound, Loader2, Music, RotateCw, Wand2 } from 'lucide-react';
import { Btn, Label, Panel, Tag } from './ui';

// Shares the Gemini key the Flex photos tool saves. It stays in this browser and only goes to Google's API.
const KEY_STORAGE = 'larp.geminiKey';
const REEL_MODEL_STORAGE = 'larp.reelModel';

// Text models (these have free-tier access, unlike the image models). If one 404s for the key, we fall through to the next.
const MODELS = [
  { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (free tier)' },
  { id: 'gemini-3-flash-preview', label: 'Gemini 3 Flash (preview)' },
  { id: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash-Lite (fastest)' },
];

const VIBES = [
  { id: 'grindset', label: 'Hustle grindset', prompt: '4 AM sigma grindset, intense, motivational, "while you were sleeping"' },
  { id: 'luxury', label: 'Quiet luxury', prompt: 'calm, aesthetic, soft piano, slow-motion luxury, "soft life" trader' },
  { id: 'humble', label: 'Humble brag', prompt: 'pretends to be relatable and humble while constantly flexing' },
  { id: 'honest', label: 'Brutally honest', prompt: 'starts like a normal guru reel, but every shot accidentally reveals the truth (rented car, sim account, losses)' },
];

const LENGTHS = [15, 30, 60];

const FLEXES = ['Rented Lambo', 'Iced-out Rolex', 'Dubai balcony', '4 AM alarm', '6 monitors', 'Funded certificate', 'Yacht day', 'Cold plunge', 'Private jet', 'Payout screenshot', 'Matcha', 'Gym'];

type Shot = { time: string; shot: string; voiceover: string; onScreen: string };
type Script = { title: string; hook: string; audio: string; shots: Shot[]; caption: string; hashtags: string[] };

const SCHEMA = {
  type: 'OBJECT',
  properties: {
    title: { type: 'STRING' },
    hook: { type: 'STRING' },
    audio: { type: 'STRING' },
    shots: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: { time: { type: 'STRING' }, shot: { type: 'STRING' }, voiceover: { type: 'STRING' }, onScreen: { type: 'STRING' } },
        required: ['time', 'shot', 'voiceover', 'onScreen'],
      },
    },
    caption: { type: 'STRING' },
    hashtags: { type: 'ARRAY', items: { type: 'STRING' } },
  },
  required: ['title', 'hook', 'audio', 'shots', 'caption', 'hashtags'],
};

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
    /* storage blocked */
  }
}

function buildPrompt(o: { name: string; vibe: string; seconds: number; flexes: string[]; notes: string; reveal: boolean }) {
  const shots = o.seconds <= 15 ? '5 to 6' : o.seconds <= 30 ? '7 to 9' : '11 to 14';
  return [
    `Write a short-form vertical video script (Instagram Reel / TikTok) for a satirical "day in the life of a day trader" video.`,
    `It's for LarpCapital, a parody app where people larp as funded futures traders on a simulated account. The humour is deadpan: it should look and sound exactly like a real trading-guru reel, but the details give away that it's a larp (simulated account, rented props, tiny trading time, lots of posing).`,
    `Creator name: ${o.name || 'the trader'}.`,
    `Vibe: ${o.vibe}.`,
    `Total length: ${o.seconds} seconds, with ${shots} shots. Timestamps like "0:00-0:03" must add up to ${o.seconds}s.`,
    o.flexes.length ? `Work in these flexes: ${o.flexes.join(', ')}.` : '',
    o.notes ? `Extra notes from the creator: ${o.notes}` : '',
    o.reveal
      ? `End with a short twist shot that reveals the larp (e.g. the account says "SIM", the Lambo gets returned, the P&L is red).`
      : `Stay in character the whole time; the joke is how seriously it takes itself.`,
    `For each shot give: the camera shot/b-roll description, the voiceover line, and the on-screen text overlay (short, punchy, can use emoji).`,
    `Also give: a 1-line scroll-stopping hook, a suggested trending-style audio description (no real song names), an Instagram caption that ends with "(parody, sim account)", and 8-12 hashtags without the # symbol.`,
    `Never claim real income or give real trading advice.`,
  ]
    .filter(Boolean)
    .join('\n');
}

async function callGemini(key: string, model: string, prompt: string): Promise<Script> {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 1, responseMimeType: 'application/json', responseSchema: SCHEMA },
    }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg: string = json?.error?.message ?? `Gemini returned ${res.status}`;
    const err = new Error(msg) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  const text: string = (json?.candidates?.[0]?.content?.parts ?? []).map((p: { text?: string }) => p.text ?? '').join('');
  if (!text) throw new Error(`No script came back (${json?.candidates?.[0]?.finishReason ?? 'empty response'}). Try again.`);
  const s = JSON.parse(text) as Script;
  if (!Array.isArray(s.shots) || !s.shots.length) throw new Error('Gemini returned a script with no shots. Try again.');
  return { ...s, hashtags: (s.hashtags ?? []).map((h) => h.replace(/^#/, '')) };
}

function asText(s: Script) {
  return [
    s.title.toUpperCase(),
    '',
    `HOOK: ${s.hook}`,
    `AUDIO: ${s.audio}`,
    '',
    ...s.shots.flatMap((x) => [`[${x.time}] ${x.shot}`, `  VO: ${x.voiceover}`, `  TEXT: ${x.onScreen}`, '']),
    'CAPTION:',
    s.caption,
    '',
    s.hashtags.map((h) => `#${h}`).join(' '),
  ].join('\n');
}

/** Larp Studio tool: Gemini writes a "day in the life" reel script for your trader persona. */
export default function ReelScriptTool() {
  const [key, setKey] = useState(() => readKey(KEY_STORAGE));
  const [keyDraft, setKeyDraft] = useState(key);
  const [showKey, setShowKey] = useState(false);
  const [model, setModel] = useState(() => readKey(REEL_MODEL_STORAGE) || MODELS[0].id);
  const [name, setName] = useState('');
  const [vibe, setVibe] = useState(VIBES[0].id);
  const [seconds, setSeconds] = useState(30);
  const [flexes, setFlexes] = useState<string[]>(['Rented Lambo', '4 AM alarm', '6 monitors']);
  const [notes, setNotes] = useState('');
  const [reveal, setReveal] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [script, setScript] = useState<Script | null>(null);
  const [run, setRun] = useState(0);
  const [copied, setCopied] = useState(false);

  const saveKey = () => {
    const k = keyDraft.trim();
    writeKey(KEY_STORAGE, k);
    setKey(k);
  };
  const toggleFlex = (f: string) => setFlexes((x) => (x.includes(f) ? x.filter((y) => y !== f) : [...x, f]));

  async function generate() {
    if (!key) return setError('Add a Gemini API key first (free at aistudio.google.com/apikey).');
    setBusy(true);
    setError('');
    const prompt = buildPrompt({ name: name.trim(), vibe: VIBES.find((v) => v.id === vibe)!.prompt, seconds, flexes, notes: notes.trim(), reveal });
    const order = [model, ...MODELS.map((m) => m.id).filter((m) => m !== model)];
    try {
      for (let i = 0; i < order.length; i++) {
        try {
          const s = await callGemini(key, order[i], prompt);
          setScript(s);
          setRun((r) => r + 1);
          if (order[i] !== model) {
            setModel(order[i]);
            writeKey(REEL_MODEL_STORAGE, order[i]);
          }
          return;
        } catch (e) {
          const err = e as Error & { status?: number };
          if (err.status === 404 && i < order.length - 1) continue; // model not available for this key: try the next one
          if (err.status === 400 && /api key/i.test(err.message)) throw new Error(`Google rejected the API key. Re-copy it from aistudio.google.com/apikey. Details: ${err.message}`);
          if (err.status === 429) throw new Error(`Rate limit hit on ${order[i]}. The free tier allows a handful of requests per minute; wait a bit and try again. Details: ${err.message}`);
          throw err;
        }
      }
    } catch (e) {
      setError((e as Error).message || String(e));
    } finally {
      setBusy(false);
    }
  }

  const copy = async () => {
    if (!script) return;
    try {
      await navigator.clipboard.writeText(asText(script));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setError('Clipboard is blocked here. Use Download instead.');
    }
  };

  const download = () => {
    if (!script) return;
    const url = URL.createObjectURL(new Blob([asText(script)], { type: 'text/plain' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `day-in-the-life-${script.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const chip = (on: boolean) => `rounded-lg border px-3 py-1.5 text-[12px] transition ${on ? 'border-up/60 bg-up/10 text-ink' : 'border-line2 bg-panel2 text-mute hover:text-ink'}`;

  return (
    <div className="mx-10 mt-6 grid max-w-6xl grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] gap-4">
      <div className="space-y-4">
        <Panel className="p-5">
          <div className="flex items-center justify-between">
            <Label>Gemini API key</Label>
            {key ? <Tag tone="green">Saved</Tag> : <Tag tone="amber">Required</Tag>}
          </div>
          <div className="mt-2 flex gap-2">
            <div className="relative flex-1">
              <KeyRound size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-dim" />
              <input
                type={showKey ? 'text' : 'password'}
                value={keyDraft}
                autoComplete="off"
                onChange={(e) => setKeyDraft(e.target.value)}
                placeholder="AIza..."
                className="w-full rounded-lg border border-line2 bg-bg py-2 pl-8 pr-9 font-mono text-[12px] outline-none focus:border-up/60"
              />
              <button onClick={() => setShowKey((s) => !s)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-dim hover:text-ink" aria-label="Show key">
                {showKey ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
            </div>
            <Btn tone="green" onClick={saveKey} disabled={keyDraft.trim() === key}>
              Save
            </Btn>
          </div>
          <div className="mt-2 text-[11px] leading-snug text-dim">
            Same key as Flex photos, stored only in this browser. Text models work on Gemini’s free tier: get a key at{' '}
            <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" className="underline hover:text-ink">aistudio.google.com/apikey</a>.
          </div>
          <div className="mt-3">
            <select
              value={model}
              onChange={(e) => {
                setModel(e.target.value);
                writeKey(REEL_MODEL_STORAGE, e.target.value);
              }}
              className="w-full rounded-lg border border-line2 bg-panel2 px-3 py-2 text-[12px] text-mute outline-none"
            >
              {MODELS.map((m) => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
          </div>
        </Panel>

        <Panel className="space-y-4 p-5">
          <div>
            <Label>Your trader name</Label>
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder="e.g. Chase Larpington" className="mt-2 w-full rounded-lg border border-line2 bg-bg px-3 py-2 text-[13px] outline-none focus:border-up/60" />
          </div>
          <div>
            <Label>Vibe</Label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {VIBES.map((v) => (
                <button key={v.id} onClick={() => setVibe(v.id)} className={chip(vibe === v.id)}>
                  {v.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>Length</Label>
            <div className="mt-2 flex gap-2">
              {LENGTHS.map((l) => (
                <button key={l} onClick={() => setSeconds(l)} className={`flex-1 ${chip(seconds === l)}`}>
                  {l}s
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>Flexes to include</Label>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {FLEXES.map((f) => (
                <button key={f} onClick={() => toggleFlex(f)} className={chip(flexes.includes(f))}>
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>Anything else (optional)</Label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} maxLength={300} placeholder="e.g. I trade NQ, I have a golden retriever, mention the 9:47 sweep" className="mt-2 w-full resize-none rounded-lg border border-line2 bg-bg px-3 py-2 text-[13px] outline-none focus:border-up/60" />
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-[12px] text-mute">
            <input type="checkbox" checked={reveal} onChange={(e) => setReveal(e.target.checked)} className="accent-[#2fd98a]" />
            End with a twist that reveals the larp
          </label>
          <button
            onClick={generate}
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-up/60 bg-up py-3 text-[13px] font-bold text-bg transition hover:brightness-110 disabled:cursor-wait disabled:opacity-70"
          >
            {busy ? <Loader2 size={15} className="animate-spin" /> : script ? <RotateCw size={15} /> : <Wand2 size={15} />}
            {busy ? 'Writing your reel…' : script ? 'Regenerate script' : 'Generate reel script'}
          </button>
          {error && <div className="rounded-lg border border-down/40 bg-down/10 px-3 py-2 text-[12px] text-down">{error}</div>}
        </Panel>
      </div>

      <Panel className="flex min-h-[560px] flex-col p-5">
        <div className="flex items-center justify-between">
          <Label>Reel script</Label>
          {script && (
            <div className="flex gap-2">
              <Btn onClick={copy}>
                {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? 'Copied' : 'Copy'}
              </Btn>
              <Btn onClick={download}>
                <Download size={12} /> Download
              </Btn>
            </div>
          )}
        </div>

        {busy && !script && (
          <div className="flex flex-1 flex-col items-center justify-center text-center text-mute">
            <Loader2 size={28} className="animate-spin text-up" />
            <div className="mt-3 text-[13px]">Storyboarding the rented Lambo…</div>
          </div>
        )}

        {!busy && !script && (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <Clapperboard size={28} className="text-dim" />
            <div className="mt-3 text-base font-semibold">No reel yet</div>
            <div className="mt-1 max-w-xs text-xs text-mute">Pick a vibe and some flexes. Gemini writes the hook, every shot, the voiceover, on-screen text, caption and hashtags.</div>
          </div>
        )}

        {script && (
          <div key={run} className={`mt-4 space-y-4 transition-opacity ${busy ? 'opacity-50' : ''}`}>
            <div className="lc-page">
              <div className="font-display text-lg font-bold leading-snug">{script.title}</div>
              <div className="mt-3 rounded-lg border border-warn/40 bg-warn/10 p-3">
                <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-warn">Hook</div>
                <div className="mt-1 text-[14px] font-semibold">{script.hook}</div>
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-[12px] text-mute">
                <Music size={12} /> {script.audio}
              </div>
            </div>

            <ol className="space-y-2">
              {script.shots.map((s, i) => (
                <li key={i} className="lc-page grid grid-cols-[72px_1fr] gap-3 rounded-lg border border-line bg-panel2 p-3" style={{ animationDelay: `${i * 60}ms` }}>
                  <div className="font-mono text-[11px] font-semibold text-up">{s.time}</div>
                  <div className="space-y-1 text-[12px]">
                    <div className="text-ink">{s.shot}</div>
                    <div className="text-mute"><span className="font-mono text-[10px] text-dim">VO </span>“{s.voiceover}”</div>
                    <div><span className="rounded bg-bg px-1.5 py-0.5 font-semibold text-ink">{s.onScreen}</span></div>
                  </div>
                </li>
              ))}
            </ol>

            <div className="lc-page rounded-lg border border-line p-3" style={{ animationDelay: `${script.shots.length * 60}ms` }}>
              <Label>Caption</Label>
              <div className="mt-1.5 whitespace-pre-line text-[13px]">{script.caption}</div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {script.hashtags.map((h) => (
                  <span key={h} className="font-mono text-[11px] text-[#7aa2ff]">#{h}</span>
                ))}
              </div>
            </div>
          </div>
        )}
        <div className="mt-auto pt-4 text-[10px] leading-snug text-dim">AI-written parody script. Don’t use it to claim real trading income.</div>
      </Panel>
    </div>
  );
}
