// Expect YYYY-MM-DD; treat as date-only (UTC midnight) to avoid TZ issues
export const parseISODate = (iso) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  const [_, y, mo, d] = m;
  return new Date(Date.UTC(+y, +mo - 1, +d));
};

export const formatISODate = (date) => date.toISOString().slice(0, 10);

export const diffDaysInclusive = (start, end) => {
  const ms = 24 * 60 * 60 * 1000;
  return Math.floor((end - start) / ms) + 1;
};

export const sameYear = (a, b) => a.getUTCFullYear() === b.getUTCFullYear();

export const todayUTCDateOnly = () => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
};
