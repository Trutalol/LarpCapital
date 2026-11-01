import { useState } from 'react';
import { PageHeader } from '../components/Layout';
import { Btn, Label, Panel } from '../components/ui';
import { useApp, xpFor } from '../lib/store';
import { money } from '../lib/format';

export default function Profile() {
  const profile = useApp((s) => s.profile);
  const setName = useApp((s) => s.setName);
  const resetAll = useApp((s) => s.resetAll);
  const accounts = useApp((s) => s.accounts);
  const payouts = useApp((s) => s.payouts);
  const [draft, setDraft] = useState(profile.name);
  const [confirm, setConfirm] = useState(false);
  const { xp, level } = xpFor({ accounts, payouts });
  const trades = accounts.flatMap((a) => a.trades);

  return (
    <div className="pb-16">
      <PageHeader title="MY PROFILE" />
      <div className="mx-10 mt-8 grid max-w-4xl grid-cols-2 gap-4">
        <Panel className="p-5">
          <Label>Trader name (shown on certificates)</Label>
          <div className="mt-2 flex gap-2">
            <input
              value={draft}
              maxLength={24}
              onChange={(e) => setDraft(e.target.value)}
              className="flex-1 rounded-lg border border-line2 bg-panel2 px-3 py-2 text-[13px] outline-none focus:border-up"
            />
            <Btn tone="green" disabled={!draft.trim() || draft === profile.name} onClick={() => setName(draft.trim())}>
              Save
            </Btn>
          </div>
          <div className="mt-2 text-[11px] text-dim">Existing certificates keep the name they were issued with.</div>
        </Panel>
        <Panel className="grid grid-cols-2 gap-4 p-5">
          {[
            ['Level', `LV${level} · ${xp} XP`],
            ['Accounts', accounts.length],
            ['Closed trades', trades.length],
            ['Paid out', money(payouts.reduce((s, p) => s + p.net, 0))],
          ].map(([k, v]) => (
            <div key={k}>
              <Label>{k}</Label>
              <div className="mt-1 text-lg font-bold">{v}</div>
            </div>
          ))}
        </Panel>
        <Panel className="col-span-2 flex items-center justify-between p-5">
          <div>
            <div className="text-[13px] font-semibold">Reset everything</div>
            <div className="text-[11px] text-mute">Deletes all accounts, payouts and certificates on this device. Good for a clean demo.</div>
          </div>
          {confirm ? (
            <div className="flex gap-2">
              <Btn tone="red" onClick={() => { resetAll(); setDraft('Trader'); setConfirm(false); }}>Yes, wipe it</Btn>
              <Btn onClick={() => setConfirm(false)}>Cancel</Btn>
            </div>
          ) : (
            <Btn onClick={() => setConfirm(true)}>Reset data</Btn>
          )}
        </Panel>
      </div>
    </div>
  );
}
