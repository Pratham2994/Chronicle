import { useState } from 'react';
import { send, useApi } from './api';
import { count, day } from './format';
import Welcome from './Welcome';
import Totals from './sections/Totals';
import Clock from './sections/Clock';
import Years from './sections/Years';
import Top from './sections/Top';
import Habits from './sections/Habits';
import Genres from './sections/Genres';
import Chapters from './sections/Chapters';
import Places from './sections/Places';
import ChapterEditor from './dialogs/ChapterEditor';
import DataDialog from './dialogs/DataDialog';

const NAV = [
  ['totals', 'Total'],
  ['clock', 'Clock'],
  ['years', 'Years'],
  ['top', 'Top'],
  ['habits', 'Habits'],
  ['genres', 'Genres'],
  ['chapters', 'Chapters'],
  ['places', 'Places'],
];

const browserZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

export default function App() {
  // Every section reads again when this number changes
  const [version, setVersion] = useState(0);
  const [dialog, setDialog] = useState(null);
  const refresh = () => setVersion((v) => v + 1);

  const status = useApi('/api/status', version);
  const profile = useApi('/api/profile', version);
  const ready = Boolean(status.data?.has_data && profile.data);

  const core = useApi('/api/core_stats', version, ready);
  const habits = useApi('/api/behavioral_stats', version, ready);
  const genres = useApi('/api/genre_stats', version, ready);
  // The chapters and the places show genres too, so they wait for the genre lookup to end
  const later = ready && genres.settled;
  const eras = useApi('/api/eras', version, later);
  const geo = useApi('/api/geo', version, later);

  if (status.error && !status.data) {
    return (
      <main className="welcome">
        <h1 className="wordmark">Chronicle</h1>
        <p className="lede">The backend is not answering. Start it, then load this page again.</p>
        <pre>cd backend{'\n'}uv run uvicorn main:app</pre>
      </main>
    );
  }
  if (!status.data || !profile.data) return <main className="welcome" aria-busy="true" />;
  if (!status.data.has_data) return <Welcome profile={profile.data} onLoaded={refresh} />;

  const info = status.data;
  const zone = profile.data.timezone;
  const useBrowserZone = () => send('/api/profile', 'PUT', { ...profile.data, timezone: browserZone() }).then(refresh);

  return (
    <>
      <nav className="bar">
        <a className="wordmark" href="#top-of-page">
          Chronicle
        </a>
        <div className="links">
          {NAV.map(([id, label]) => (
            <a key={id} href={`#${id}`}>
              {label}
            </a>
          ))}
        </div>
        <div className="tools">
          <button type="button" onClick={() => setDialog('chapters')}>
            Chapters
          </button>
          <button type="button" onClick={() => setDialog('data')}>
            Data
          </button>
        </div>
      </nav>

      <header className="masthead" id="top-of-page">
        <p className="kicker">A listening history</p>
        <h1>
          Everything you played, <em>{day(info.first)}</em> to <em>{day(info.last)}</em>.
        </h1>
        <p className="lede">
          {count(info.plays)} plays, read from {info.files.length} {info.files.length === 1 ? 'file' : 'files'} on this
          computer.
        </p>
        {info.sample && (
          <p className="notice">
            This is made-up sample data.{' '}
            <button type="button" onClick={() => setDialog('data')}>
              Drop in your own Spotify export
            </button>{' '}
            to replace it.
          </p>
        )}
        {/* A history loaded before the time zone was set still counts its hours in UTC */}
        {zone === 'UTC' && browserZone() !== 'UTC' && (
          <p className="notice">
            Hours are shown in {zone}. Your browser says {browserZone()}.{' '}
            <button type="button" onClick={useBrowserZone}>
              Use {browserZone()}
            </button>
          </p>
        )}
      </header>

      <main>
        <Totals api={core} />
        <Clock api={core} habits={habits.data} zone={zone} />
        <Years api={core} />
        <Top api={core} />
        <Habits api={habits} />
        <Genres api={genres} />
        <Chapters api={eras} custom={profile.data.mode === 'custom'} onEdit={() => setDialog('chapters')} />
        <Places api={geo} />
      </main>

      <footer className="colophon">
        Chronicle runs on your computer. The only thing that leaves it is a list of artist names, sent to the iTunes
        Search API to learn their genres.
      </footer>

      {dialog === 'chapters' && (
        <ChapterEditor profile={profile.data} status={info} onClose={() => setDialog(null)} onSaved={refresh} />
      )}
      {dialog === 'data' && (
        <DataDialog profile={profile.data} status={info} onClose={() => setDialog(null)} onChanged={refresh} />
      )}
    </>
  );
}
