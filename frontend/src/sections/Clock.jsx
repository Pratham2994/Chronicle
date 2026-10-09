import Section from '../Section';
import { WEEKDAYS, hourName, hours } from '../format';

/** Seven rows of twenty-four hours. The brighter the square, the more you listened then. */
export default function Clock({ api, habits, zone }) {
  return (
    <Section
      id="clock"
      n="02"
      title="The clock"
      lede="When the music is on. Each square is one hour of one weekday, added up over every year."
      api={api}
    >
      {(d) => {
        const most = Math.max(1, ...d.clock.flat());
        const night = habits?.vampire_vs_sunlight;
        const week = habits?.temporal_splits;
        return (
          <div className="split">
            <div className="clock" role="img" aria-label="Listening by weekday and hour">
              <div className="clock-row clock-hours" aria-hidden="true">
                <span />
                {[0, 3, 6, 9, 12, 15, 18, 21].map((h) => (
                  <b key={h} style={{ gridColumn: `${h + 2} / span 3` }}>
                    {hourName(h)}
                  </b>
                ))}
              </div>
              {d.clock.map((row, dow) => (
                <div className="clock-row" key={dow}>
                  <span>{WEEKDAYS[dow]}</span>
                  {row.map((value, h) => (
                    <i
                      key={h}
                      style={{ '--heat': Math.pow(value / most, 0.7) }}
                      title={`${WEEKDAYS[dow]} ${hourName(h)}: ${hours(value)} hours`}
                    />
                  ))}
                </div>
              ))}
              <p className="fine">Hours are in {zone}.</p>
            </div>
            {habits && (
              <dl className="facts stacked">
                <div>
                  <dt>Peak hour</dt>
                  <dd>{habits.time_preferences.top_hour}</dd>
                </div>
                <div>
                  <dt>Peak day</dt>
                  <dd>{habits.time_preferences.top_day}</dd>
                </div>
                <div>
                  <dt>Night against day</dt>
                  <dd>
                    {night.ratio}× <small>{night.ratio >= 1 ? 'night owl' : 'daylight listener'}</small>
                  </dd>
                  <dd className="fine">Plays from 11 pm to 5 am, against plays from 9 am to 5 pm.</dd>
                </div>
                <div>
                  <dt>On weekends</dt>
                  <dd>
                    {Math.round((week.weekend_plays / Math.max(1, week.weekend_plays + week.weekday_plays)) * 100)}%
                  </dd>
                  <dd className="fine">Share of all plays. A week with no favourite days gives 29%.</dd>
                </div>
              </dl>
            )}
          </div>
        );
      }}
    </Section>
  );
}
