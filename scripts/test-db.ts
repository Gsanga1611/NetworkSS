import { pgPool } from '../src/lib/postgres.ts';

async function main() {
  try {
    const { rows } = await pgPool.query('SELECT NOW()');
    console.log('connected at', rows[0].now);
  } catch (err) {
    console.error('connection failed', err);
  } finally {
    await pgPool.end();
  }
}

main();
