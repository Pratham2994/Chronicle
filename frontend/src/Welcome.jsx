import { useState } from 'react';
import { call, send } from './api';
import Drop from './Drop';

/** The first screen: there is no history yet, so it says how to get one. */
export default function Welcome({ profile, onLoaded }) {
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState(null);

  // Hours make sense only in your own time zone, so it is set before the first load
  const loaded = async () => {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (profile.timezone === 'UTC' && zone !== 'UTC') {
      await send('/api/profile', 'PUT', { ...profile, timezone: zone }).catch(() => {});
    }
    onLoaded();
  };

  const sample = async () => {
    setBusy(true);
    setProblem(null);
    try {
      await call('/api/sample', { method: 'POST' });
      await loaded();
    } catch (error) {
      setProblem(error.message);
      setBusy(false);
    }
  };

  return (
    <main className="welcome">
      <p className="kicker">A listening history</p>
      <h1 className="wordmark">Chronicle</h1>
      <p className="lede">
        Spotify Wrapped gives you one year and five songs. Spotify also keeps every play you ever made, and it will send
        you the whole list if you ask. Chronicle reads that list.
      </p>

      <ol className="steps">
        <li>
          <b>Ask.</b> In your{' '}
          <a href="https://www.spotify.com/account/privacy/" target="_blank" rel="noreferrer">
            Spotify privacy settings
          </a>
          , request the <i>Extended streaming history</i>. Not the account data. That one has only the last year.
        </li>
        <li>
          <b>Wait.</b> Spotify emails a zip. It says up to 30 days. It is usually a few.
        </li>
        <li>
          <b>Drop.</b> Put the zip below. It is read on this computer and goes nowhere else.
        </li>
      </ol>

      <Drop onLoaded={loaded} />

      <p className="aside">
        No export yet?{' '}
        <button type="button" onClick={sample} disabled={busy}>
          {busy ? 'Writing eight made-up years' : 'Look around with sample data'}
        </button>
      </p>
      {problem && <p className="problem">{problem}</p>}
    </main>
  );
}
