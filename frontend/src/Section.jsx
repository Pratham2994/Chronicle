/**
 * One numbered part of the page. It shows a quiet placeholder while its numbers load, and
 * says what went wrong in place of the numbers when they do not arrive.
 */
export default function Section({ id, n, title, lede, api, waiting, children }) {
  const data = api?.data;
  return (
    <section id={id} className="section">
      <header>
        <span className="num">{n}</span>
        <h2>{title}</h2>
        {lede && <p className="lede">{lede}</p>}
      </header>
      <div className="body" aria-busy={!data}>
        {data ? (
          children(data)
        ) : api?.error ? (
          <p className="problem">{api.error.message}</p>
        ) : (
          <div className="wait">{waiting || 'Counting'}</div>
        )}
      </div>
    </section>
  );
}
