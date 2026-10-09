import { useState } from 'react';
import Section from '../Section';
import { count, hours } from '../format';

function Chart({ title, note, rows, open }) {
  const shown = open ? rows : rows.slice(0, 10);
  const most = Math.max(0.1, ...rows.map((r) => r.hours));
  return (
    <div className="chart">
      <h3>{title}</h3>
      {note && <p className="fine">{note}</p>}
      {rows.length === 0 && <p className="fine">Nothing here.</p>}
      <ol>
        {shown.map((row, i) => (
          <li key={i} style={{ '--share': row.hours / most }}>
            <span className="rank">{i + 1}</span>
            <span className="name">
              {row.name}
              {row.artist && <small>{row.artist}</small>}
            </span>
            <span className="amount">
              {hours(row.hours)} h<small>{count(row.count)} plays</small>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function Top({ api }) {
  const [open, setOpen] = useState(false);
  return (
    <Section
      id="top"
      n="04"
      title="The top of the pile"
      lede="Ranked by time, not by plays. A song you skip after four seconds does not count for much."
      api={api}
    >
      {(d) => (
        <>
          <div className="charts">
            <Chart title="Artists" rows={d.top_artists} open={open} />
            <Chart title="Songs" rows={d.top_tracks} open={open} />
            <Chart
              title="With no signal"
              note="Played offline. The songs you saved for the flight."
              rows={d.offline_survival_tracks}
              open={open}
            />
          </div>
          <button type="button" className="more" onClick={() => setOpen(!open)}>
            {open ? 'Show the top 10' : 'Show all 50'}
          </button>
        </>
      )}
    </Section>
  );
}
