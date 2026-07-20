const { pool } = require('../src/config/db');

async function migrate() {
  const alters = [
    'ALTER TABLE publicacoes ALTER COLUMN imagem_url TYPE TEXT',
    'ALTER TABLE missoes ALTER COLUMN imagem_capa TYPE TEXT',
    'ALTER TABLE envios_missao ALTER COLUMN imagem_url TYPE TEXT',
    'ALTER TABLE noticias ALTER COLUMN imagem_url TYPE TEXT',
    'ALTER TABLE usuarios ALTER COLUMN foto TYPE TEXT',
    'ALTER TABLE equipes ALTER COLUMN escudo_url TYPE TEXT',
    'ALTER TABLE equipes ALTER COLUMN foto_url TYPE TEXT',
  ];

  for (const sql of alters) {
    await pool.query(sql);
    // eslint-disable-next-line no-console
    console.log('OK:', sql);
  }

  await pool.end();
}

migrate().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error.message);
  process.exit(1);
});
