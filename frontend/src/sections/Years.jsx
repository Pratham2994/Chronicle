import Section from '../Section';
import { count, hours } from '../format';

export default function Years({ api }) {
  return (
    <Section id="years" n="03" title="Year by year" lede="How much, and who owned it." api={api}>
      {(d) => {
        const most = Math.max(1, ...d.years.map((y) => y.hours));
        return (
          <ol className="years">
            {d.years.map((y) => (
              <li key={y.year}>
                <b>{y.year}</b>
                <span className="track">
                  <i style={{ '--share': y.hours / most }} />
                </span>
                <span className="amount">
                  {hours(y.hours)} h <small>{count(y.plays)} plays</small>
                </span>
                <span className="who">{y.top_artist}</span>
              </li>
            ))}
          </ol>
        );
      }}
    </Section>
  );
}
