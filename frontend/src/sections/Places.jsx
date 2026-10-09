import { useState } from 'react';
import Section from '../Section';
import { count, country, day, hours } from '../format';

function Place({ place }) {
  return (
    <div className="place">
      <h3>{country(place.id)}</h3>
      <p className="fine">
        {place.first_visit === place.last_visit
          ? day(place.first_visit)
          : `${day(place.first_visit)} to ${day(place.last_visit)}`}
        . {hours(place.hours)} hours, {count(place.unique_artists)} artists, {place.mobile_pct}% on a phone.
      </p>
      <ul className="rows">
        {place.top_tracks.map((t) => (
          <li key={t.track + t.artist}>
            <span>
              {t.track} <small>{t.artist}</small>
            </span>
            <span className="amount">{hours(t.hours)} h</span>
          </li>
        ))}
      </ul>
      <p>
        <span className="label">Most played</span> {place.top_artists.join(', ')}
      </p>
      {place.top_genres.length > 0 && (
        <p>
          <span className="label">Genres</span> {place.top_genres.join(', ')}
        </p>
      )}
      <p>
        <span className="label">Night and day</span> {hours(place.vampire_hours)} h after 11 pm,{' '}
        {hours(place.sunlight_hours)} h in daylight
      </p>
    </div>
  );
}

export default function Places({ api }) {
  const [picked, setPicked] = useState(null);
  return (
    <Section
      id="places"
      n="08"
      title="Places"
      lede="Spotify notes the country of every play. So it also knows what you put on when you travel."
      api={api}
    >
      {(d) => {
        if (!d.length) return <p className="fine">No country in this history has an hour of listening.</p>;
        const place = d.find((p) => p.id === picked) || d[0];
        const most = Math.max(...d.map((p) => p.hours));
        return (
          <div className="split places">
            <ul className="stamps">
              {d.map((p) => (
                <li key={p.id}>
                  <button type="button" aria-pressed={p.id === place.id} onClick={() => setPicked(p.id)}>
                    {/* The area of the stamp grows with the time spent there */}
                    <i style={{ '--size': 0.45 + 0.55 * Math.sqrt(p.hours / most) }}>{p.id}</i>
                    <span>
                      {country(p.id)}
                      <small>{hours(p.hours)} h</small>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <Place place={place} />
          </div>
        );
      }}
    </Section>
  );
}
