import { useState } from 'react';
import { call, send } from '../api';
import Drop from '../Drop';
import { count, day } from '../format';
import Dialog from './Dialog';

const ZONES = typeof Intl.supportedValuesOf === 'function' ? Intl.supportedValuesOf('timeZone') : [];

/** The files Chronicle reads, and the time zone it reads them in. */
export default function DataDialog({ profile, status, onClose, onChanged }) {
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState(null);

  const run = async (work) => {
    setBusy(true);
    setProblem(null);
    try {
      await work();
      onChanged();
    } catch (error) {
      setProblem(error.message);
    } finally {
      setBusy(false);
    }
  };

  const zones = ZONES.includes(profile.timezone) ? ZONES : [profile.timezone, ...ZONES];

  return (
    <Dialog title="Data" onClose={onClose}>
      <p>
        {count(status.plays)} plays, {day(status.first)} to {day(status.last)}
        {status.sample && '. Made-up sample data'}.
      </p>
      <ul className="files">
        {status.files.map((file) => (
          <li key={file}>{file}</li>
        ))}
      </ul>

      <h3>{status.sample ? 'Put in your own history' : 'Add newer files'}</h3>
      <Drop
        onLoaded={() => {
          onChanged();
          onClose();
        }}
      />
      <p className="fine">
        Files go into the <code>data</code> folder next to the app. A file with the same name is replaced. To remove
        history, delete files from that folder, then read the folder again.
      </p>

      <h3>Time zone</h3>
      <div className="fields">
        <label>
          Hours are shown in
          <select
            value={profile.timezone}
            disabled={busy}
            onChange={(e) => run(() => send('/api/profile', 'PUT', { ...profile, timezone: e.target.value }))}
          >
            {zones.map((zone) => (
              <option key={zone}>{zone}</option>
            ))}
          </select>
        </label>
      </div>
      <p className="fine">Spotify stores each play in UTC. Pick where you live, or 9 pm shows up as the afternoon.</p>

      {problem && <p className="problem">{problem}</p>}
      <footer>
        <button type="button" disabled={busy} onClick={() => run(() => call('/api/recalibrate', { method: 'POST' }))}>
          {busy ? 'Working' : 'Read the data folder again'}
        </button>
      </footer>
    </Dialog>
  );
}
