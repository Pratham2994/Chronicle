import Section from '../Section';
import { count, day, hours } from '../format';

function Months({ data }) {
  const most = Math.max(0.1, ...data.map((m) => m.hours));
  return (
    <div className="months" role="img" aria-label="Hours for each month of this chapter">
      {data.map((m) => (
        <i key={m.month} style={{ '--share': m.hours / most }} title={`${day(m.month)}: ${hours(m.hours)} hours`} />
      ))}
    </div>
  );
}

function Chapter({ era }) {
  const dive = era.deep_dive;
  return (
    <li className="chapter">
      <div className="when">
        <b>{era.era_name}</b>
        <span>
          {day(era.start)} to {era.end.startsWith('9999') ? 'now' : day(era.end)}
        </span>
      </div>
      <div className="what">
        <p className="finding">{era.top_artists.join(', ')}</p>
        <p className="fine">
          {hours(era.hours)} hours, {count(era.plays)} plays, {count(era.unique_artists)} artists. {era.mobile_pct}% on
          a phone.
        </p>
        <Months data={dive.sparkline} />
        <details>
          <summary>The soundtrack</summary>
          <ul className="rows">
            {dive.top_tracks.map((t) => (
              <li key={t.track + t.artist}>
                <span>
                  {t.track} <small>{t.artist}</small>
                  {t.is_loop_obsession && <mark>on repeat</mark>}
                </span>
                <span className="amount">{hours(t.hours)} h</span>
              </li>
            ))}
          </ul>
          {dive.top_discovery && (
            <p>
              <span className="label">New in this chapter</span> {dive.top_discovery.artist}, never played before it and{' '}
              {hours(dive.top_discovery.hours)} hours during it.
            </p>
          )}
          {dive.top_genres.length > 0 && (
            <p>
              <span className="label">Genres</span> {dive.top_genres.map((g) => g.genre).join(', ')}
            </p>
          )}
        </details>
      </div>
    </li>
  );
}

export default function Chapters({ api, custom, onEdit }) {
  return (
    <Section
      id="chapters"
      n="07"
      title="Chapters"
      lede={
        custom
          ? 'Your life, cut where you said to cut it.'
          : 'One chapter for each year, for now. School, college, a first job: tell Chronicle your own, and it cuts the history there.'
      }
      api={api}
    >
      {(d) => (
        <>
          <button type="button" className="more" onClick={onEdit}>
            {custom ? 'Edit your chapters' : 'Write your own chapters'}
          </button>
          {d.length === 0 && <p className="fine">No plays fall inside these chapters. Check the dates.</p>}
          <ol className="chapters">
            {d.map((era) => (
              <Chapter key={era.era_name} era={era} />
            ))}
          </ol>
        </>
      )}
    </Section>
  );
}
