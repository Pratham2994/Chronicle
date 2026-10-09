import Section from '../Section';
import { count, day, hours } from '../format';

export default function Totals({ api }) {
  return (
    <Section id="totals" n="01" title="The total" api={api}>
      {(d) => (
        <>
          <p className="giant">
            <b>{hours(d.total_hours)}</b> hours
          </p>
          <p className="lede">That is {hours(d.total_days)} days of music with no sleep and no food.</p>
          <dl className="facts">
            <div>
              <dt>Plays</dt>
              <dd>{count(d.total_plays)}</dd>
            </div>
            <div>
              <dt>Artists</dt>
              <dd>{count(d.total_artists)}</dd>
            </div>
            <div>
              <dt>Songs</dt>
              <dd>{count(d.total_tracks)}</dd>
            </div>
            <div>
              <dt>Days with music</dt>
              <dd>{count(d.active_days)}</dd>
            </div>
            <div>
              <dt>Longest streak</dt>
              <dd>
                {count(d.longest_streak)} <small>days, to {day(d.streak_end)}</small>
              </dd>
            </div>
            {d.busiest_day && (
              <div>
                <dt>Biggest day</dt>
                <dd>
                  {hours(d.busiest_day.hours)} <small>hours, on {day(d.busiest_day.date)}</small>
                </dd>
              </div>
            )}
          </dl>
        </>
      )}
    </Section>
  );
}
