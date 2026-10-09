import Section from '../Section';
import { hours } from '../format';

function Short({ title, note, rows }) {
  return (
    <div>
      <h3>{title}</h3>
      <p className="fine">{note}</p>
      <ul className="rows">
        {rows.map((g) => (
          <li key={g.genre}>
            <span>{g.genre}</span>
            <span className="amount">{hours(g.hours)} h</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Genres({ api }) {
  return (
    <Section
      id="genres"
      n="06"
      title="Genres"
      lede="Spotify does not put a genre in the export. So the top 300 artists are looked up, one time, and remembered."
      waiting="Looking up the genres of your artists. The first time takes about half a minute."
      api={api}
    >
      {(d) => {
        if (!d.top_genres.length) {
          return <p className="fine">No genres came back. This needs the internet the first time. Load the page again when you have it.</p>;
        }
        const most = d.top_genres[0].hours;
        const total = d.cultural_split.reduce((sum, c) => sum + c.ms_played, 0) || 1;
        return (
          <>
            <ol className="years genres">
              {d.top_genres.map((g) => (
                <li key={g.genre}>
                  <b>{g.genre}</b>
                  <span className="track">
                    <i style={{ '--share': g.hours / most }} />
                  </span>
                  <span className="amount">{hours(g.hours)} h</span>
                  <span className="who">{(g.artists || []).join(', ')}</span>
                </li>
              ))}
            </ol>
            <div className="charts">
              <Short title="After 11 pm" note="What plays from 11 pm to 5 am." rows={d.vampire_genres} />
              <Short title="In daylight" note="What plays from 9 am to 5 pm." rows={d.sunlight_genres} />
              <div>
                <h3>Home and away</h3>
                <p className="fine">Genres tied to one region or language, against the rest.</p>
                <ul className="rows">
                  {d.cultural_split.map((c) => (
                    <li key={c.cultural_category}>
                      <span>{c.cultural_category === 'Regional/World' ? 'Regional' : 'Global'}</span>
                      <span className="amount">{Math.round((c.ms_played / total) * 100)}%</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <p className="fine">
              Genres from the iTunes Search API. {d.artists_known} of {d.artists_checked} artists had one.
            </p>
          </>
        );
      }}
    </Section>
  );
}
