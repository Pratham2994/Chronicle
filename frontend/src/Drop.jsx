import { useState } from 'react';
import { call } from './api';

/** Takes the Spotify zip, or the JSON files from it, by drop or by the file picker. */
export default function Drop({ onLoaded }) {
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState(null);

  const upload = async (list) => {
    const files = [...list];
    if (!files.length) return;
    const body = new FormData();
    files.forEach((file) => body.append('files', file));
    setBusy(true);
    setProblem(null);
    try {
      await call('/api/upload', { method: 'POST', body });
      onLoaded();
    } catch (error) {
      setProblem(error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <label
        className="drop"
        data-over={over || undefined}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          upload(e.dataTransfer.files);
        }}
      >
        <input type="file" multiple accept=".zip,.json" disabled={busy} onChange={(e) => upload(e.target.files)} />
        <b>{busy ? 'Reading your history' : 'Drop the zip from Spotify here'}</b>
        <span>{busy ? 'A few seconds for most people.' : 'or the Streaming_History_Audio files from it. Click to pick them.'}</span>
      </label>
      {problem && <p className="problem">{problem}</p>}
    </div>
  );
}
