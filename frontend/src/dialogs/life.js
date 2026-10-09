// A chapter with no end goes on until now. It is stored as this date.
export const OPEN_END = '9999-12-31';

const iso = (date) => date.toISOString().slice(0, 10);
const at = (year, month) => new Date(Date.UTC(year, month - 1, 1));
const dayBefore = (date) => new Date(date.getTime() - 86400000);

/**
 * Turns a few facts about a life into chapters. Everyone's school and college run on
 * different years, so nothing here is fixed: the result is a first draft to edit.
 *
 * life: { schoolEnd, month, stages: [{ name, years, split }], after }
 * historyStart: the date of the first play, 'YYYY-MM-DD'
 */
export function chaptersFromLife(life, historyStart) {
  const chapters = [];
  let cursor = at(life.schoolEnd, life.month);

  if (historyStart < iso(cursor)) {
    chapters.push({ name: 'School', start: historyStart, end: iso(dayBefore(cursor)) });
  }

  for (const stage of life.stages) {
    const years = Math.max(1, Number(stage.years) || 1);
    const name = stage.name.trim() || 'Stage';
    // One chapter for each year of it, or one chapter for all of it
    const parts = stage.split ? years : 1;
    for (let part = 0; part < parts; part++) {
      const next = at(cursor.getUTCFullYear() + years / parts, life.month);
      chapters.push({
        name: parts > 1 ? `${name}, year ${part + 1}` : name,
        start: iso(cursor),
        end: iso(dayBefore(next)),
      });
      cursor = next;
    }
  }

  if (life.after.trim()) chapters.push({ name: life.after.trim(), start: iso(cursor), end: OPEN_END });
  // A chapter that ended before the first play has nothing in it
  return chapters.filter((chapter) => chapter.end >= historyStart);
}
