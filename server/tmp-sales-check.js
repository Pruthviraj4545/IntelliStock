const pool = require('./db/db');
(async () => {
  try {
    const q = await pool.query(`
      SELECT
        COALESCE(SUM(total_amount),0)::numeric(12,2) AS total_revenue,
        COALESCE(SUM(CASE WHEN sale_date >= CURRENT_DATE AND sale_date < CURRENT_DATE + INTERVAL '1 day' THEN total_amount ELSE 0 END),0)::numeric(12,2) AS today_revenue,
        COUNT(*) AS total_orders,
        SUM(CASE WHEN sale_date >= CURRENT_DATE AND sale_date < CURRENT_DATE + INTERVAL '1 day' THEN 1 ELSE 0 END)::int AS today_orders,
        SUM(CASE WHEN sale_date < CURRENT_DATE THEN 1 ELSE 0 END)::int AS previous_day_orders
      FROM sales
    `);
    console.log(q.rows[0]);
  } catch (e) {
    console.error(e.message);
  } finally {
    await pool.end();
  }
})();
