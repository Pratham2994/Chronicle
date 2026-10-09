import Section from '../Section';
import { count, day } from '../format';

// What each number in the skip model stands for, in words
const DRIVERS = {
  hour_of_day: ['Later in the day', 'later in the day'],
  shuffle_True: ['Shuffle on', 'when shuffle is on'],
  platform_type_Mobile: ['On a phone', 'on a phone'],
};

function SkipModel({ model }) {
  const entries = Object.entries(model.coefficients || {}).filter(([key]) => DRIVERS[key]);
  if (!entries.length) return <p className="fine">{model.insight}</p>;
  const most = Math.max(0.05, ...entries.map(([, v]) => Math.abs(v)));
  const [strongest, value] = entries.reduce((a, b) => (Math.abs(b[1]) > Math.abs(a[1]) ? b : a));
  return (
    <>
      <p className="finding">
        You skip {value > 0 ? 'more' : 'less'} {DRIVERS[strongest][1]}.
      </p>
      <ul className="pulls">
        {entries.map(([key, v]) => (
          <li key={key}>
            <span>{DRIVERS[key][0]}</span>
            <span className="pull" data-way={v > 0 ? 'more' : 'less'}>
              <i style={{ '--share': Math.abs(v) / most }} />
            </span>
            <span className="amount">{v > 0 ? 'more skips' : 'fewer skips'}</span>
          </li>
        ))}
      </ul>
      <p className="fine">
        A small logistic regression on up to 100,000 of your plays. It shows what goes together with a skip. It does
        not show the cause.
      </p>
    </>
  );
}

export default function Habits({ api }) {
  return (
    <Section id="habits" n="05" title="Habits" lede="The things the play counts do not show." api={api}>
      {(d) => {
        const loops = d.loop_obsession.slice(0, 5);
        const mostLoops = Math.max(1, ...loops.map((t) => t.loop_count));
        return (
          <div className="cards">
            <article className="card wide">
              <h3>What makes you skip</h3>
              <SkipModel model={d.skipper_psychology} />
            </article>

            <article className="card">
              <h3>Quick on the trigger</h3>
              <p className="big">{d.short_attention.ratio_percent}%</p>
              <p>of your skips come in the first 30 seconds.</p>
              <p className="fine">
                {count(d.short_attention.instant_skips)} of {count(d.short_attention.total_skips)} skips.
              </p>
            </article>

            <article className="card wide">
              <h3>The biggest binge</h3>
              <p className="big">{d.binge_listen.max_plays_in_24h} plays in one day</p>
              <p>
                <b>{d.binge_listen.name}</b>
                {d.binge_listen.artist && <> by {d.binge_listen.artist}</>}, on {day(d.binge_listen.date)}.
              </p>
            </article>

            <article className="card">
              <h3>Loyalty</h3>
              <p className="big">{d.loyalty_index.loyalty_percent}%</p>
              <p>of all your listening time went to five artists.</p>
            </article>

            <article className="card wide">
              <h3>On repeat</h3>
              <p className="fine">The song ended, and you let it start again. Counted each time.</p>
              <ul className="pulls">
                {loops.map((t) => (
                  <li key={t.name}>
                    <span>{t.name}</span>
                    <span className="pull" data-way="more">
                      <i style={{ '--share': t.loop_count / mostLoops }} />
                    </span>
                    <span className="amount">{count(t.loop_count)}</span>
                  </li>
                ))}
              </ul>
              {loops.length === 0 && <p className="fine">Not once.</p>}
            </article>

            <article className="card">
              <h3>Private sessions</h3>
              <p className="big">{count(d.incognito_sessions)}</p>
              <p>plays with a private session on. Nobody is judging.</p>
            </article>

            <article className="card wide">
              <h3>Ghosts</h3>
              <p className="fine">Played more than 50 times, then not once in the last two years of this history.</p>
              <ul className="rows">
                {d.ghost_tracks.slice(0, 8).map((t) => (
                  <li key={t.name + t.artist}>
                    <span>
                      {t.name} <small>{t.artist}</small>
                    </span>
                    <span className="amount">{count(t.total_plays)} plays</span>
                  </li>
                ))}
              </ul>
              {d.ghost_tracks.length === 0 && <p className="fine">None. You do not drop songs.</p>}
            </article>

            <article className="card">
              <h3>One song only</h3>
              <p className="fine">One song from the artist, played more than 20 times.</p>
              <ul className="rows">
                {d.one_hit_fixations.map((t) => (
                  <li key={t.artist}>
                    <span>
                      {t.track} <small>{t.artist}</small>
                    </span>
                    <span className="amount">{count(t.total_plays)} plays</span>
                  </li>
                ))}
              </ul>
              {d.one_hit_fixations.length === 0 && <p className="fine">None.</p>}
            </article>
          </div>
        );
      }}
    </Section>
  );
}
