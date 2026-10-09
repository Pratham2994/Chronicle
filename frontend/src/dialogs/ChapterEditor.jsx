import { useState } from 'react';
import { send } from '../api';
import Dialog from './Dialog';
import { OPEN_END, chaptersFromLife } from './life';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** Where you say how your life was cut up, so the history can be cut the same way. */
export default function ChapterEditor({ profile, status, onClose, onSaved }) {
  const [mode, setMode] = useState(profile.mode);
  const [rows, setRows] = useState(profile.chapters);
  const [problem, setProblem] = useState(null);
  const [saving, setSaving] = useState(false);

  const firstYear = Number(status.first.slice(0, 4));
  const [born, setBorn] = useState('');
  const [life, setLife] = useState({
    schoolEnd: firstYear + 2,
    month: 6,
    stages: [
      { name: 'Junior college', years: 2, split: false },
      { name: 'College', years: 4, split: true },
    ],
    after: 'Work',
  });

  const setStage = (i, change) =>
    setLife({ ...life, stages: life.stages.map((stage, n) => (n === i ? { ...stage, ...change } : stage)) });
  const setRow = (i, change) => setRows(rows.map((row, n) => (n === i ? { ...row, ...change } : row)));

  const save = async () => {
    setSaving(true);
    setProblem(null);
    try {
      await send('/api/profile', 'PUT', { ...profile, mode, chapters: mode === 'custom' ? rows : profile.chapters });
      onSaved();
      onClose();
    } catch (error) {
      setProblem(error.message);
      setSaving(false);
    }
  };

  return (
    <Dialog title="Chapters" onClose={onClose}>
      <fieldset className="choice">
        <label>
          <input type="radio" name="mode" checked={mode === 'years'} onChange={() => setMode('years')} />
          <span>
            <b>One chapter for each year</b>
            <small>Nothing to fill in.</small>
          </span>
        </label>
        <label>
          <input type="radio" name="mode" checked={mode === 'custom'} onChange={() => setMode('custom')} />
          <span>
            <b>My own chapters</b>
            <small>School, college, a job, a city. Your dates.</small>
          </span>
        </label>
      </fieldset>

      {mode === 'custom' && (
        <>
          <details className="helper" open={rows.length === 0}>
            <summary>Draft them from my life</summary>
            <div className="fields">
              <label>
                Born in
                <input
                  type="number"
                  placeholder="2004"
                  value={born}
                  onChange={(e) => {
                    setBorn(e.target.value);
                    // Most people leave school at about 16. It is only a first guess.
                    if (e.target.value.length === 4) setLife({ ...life, schoolEnd: Number(e.target.value) + 16 });
                  }}
                />
              </label>
              <label>
                School ended in
                <input type="number" value={life.schoolEnd} onChange={(e) => setLife({ ...life, schoolEnd: Number(e.target.value) })} />
              </label>
              <label>
                A study year starts in
                <select value={life.month} onChange={(e) => setLife({ ...life, month: Number(e.target.value) })}>
                  {MONTHS.map((name, i) => (
                    <option key={name} value={i + 1}>
                      {name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <p className="fine">Then what came after school, in order:</p>
            {life.stages.map((stage, i) => (
              <div className="fields stage" key={i}>
                <label>
                  What
                  <input value={stage.name} onChange={(e) => setStage(i, { name: e.target.value })} />
                </label>
                <label>
                  Years
                  <input type="number" min="1" max="12" value={stage.years} onChange={(e) => setStage(i, { years: e.target.value })} />
                </label>
                <label className="tick">
                  <input type="checkbox" checked={stage.split} onChange={(e) => setStage(i, { split: e.target.checked })} />A
                  chapter for each year
                </label>
                <button type="button" onClick={() => setLife({ ...life, stages: life.stages.filter((_, n) => n !== i) })}>
                  Remove
                </button>
              </div>
            ))}
            <div className="fields">
              <button type="button" onClick={() => setLife({ ...life, stages: [...life.stages, { name: '', years: 2, split: false }] })}>
                Add a stage
              </button>
              <label>
                And after all that
                <input value={life.after} placeholder="Leave empty for nothing" onChange={(e) => setLife({ ...life, after: e.target.value })} />
              </label>
            </div>
            <button type="button" className="primary" onClick={() => setRows(chaptersFromLife(life, status.first))}>
              {rows.length ? 'Draft again. This replaces the list below' : 'Draft my chapters'}
            </button>
          </details>

          <div className="rows-edit">
            {rows.map((row, i) => (
              <div className="fields" key={i}>
                <label>
                  Chapter
                  <input value={row.name} onChange={(e) => setRow(i, { name: e.target.value })} />
                </label>
                <label>
                  From
                  <input type="date" value={row.start} onChange={(e) => setRow(i, { start: e.target.value })} />
                </label>
                <label>
                  To
                  <input
                    type="date"
                    value={row.end === OPEN_END ? '' : row.end}
                    onChange={(e) => setRow(i, { end: e.target.value || OPEN_END })}
                  />
                </label>
                <button type="button" onClick={() => setRows(rows.filter((_, n) => n !== i))}>
                  Remove
                </button>
              </div>
            ))}
            <button type="button" onClick={() => setRows([...rows, { name: '', start: '', end: OPEN_END }])}>
              Add a chapter
            </button>
            <p className="fine">
              Leave the last date empty for a chapter that is still going. Plays between two chapters belong to
              neither.
            </p>
          </div>
        </>
      )}

      {problem && <p className="problem">{problem}</p>}
      <footer>
        <button type="button" className="primary" onClick={save} disabled={saving}>
          {saving ? 'Saving' : 'Save'}
        </button>
      </footer>
    </Dialog>
  );
}
