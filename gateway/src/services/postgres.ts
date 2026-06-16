import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
});

// HNSW (Hierarchical Navigable Small World) and IVFFlat (Inverted File Index) are the two main indexing methods for vector search in pgvector. HNSW is faster for high-dimensional data, 
// while IVFFlat can be more efficient for larger datasets. For our use case with 384-dimensional embeddings and a moderate 
// dataset size, IVFFlat with 100 lists provides a good balance of speed and accuracy.
// ✅ HNSW instead of IVFFlat because:
    //    - IVFFlat needs existing data to build cluster centroids — FAILS on empty table
    //    - HNSW builds the graph incrementally as rows are inserted
    //    - HNSW has better query-time recall for cache-sized datasets (<500k rows)
export const initDB = async () => {
    let client;
    try {
        client = await pool.connect();
        await client.query('CREATE EXTENSION IF NOT EXISTS vector;');

        await client.query(`
            CREATE TABLE IF NOT EXISTS semantic_cache (
                id SERIAL PRIMARY KEY,
                prompt TEXT NOT NULL,
                embedding vector(384),
                response TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '24 hours')
            );
        `);
        
        await client.query(`
            CREATE INDEX IF NOT EXISTS semantic_cache_embedding_idx 
            ON semantic_cache USING hnsw (embedding vector_cosine_ops)
        `);

        console.log('Connected to PostgreSQL & pgvector initialized!');
        //cron job to delete the data exceeding ttl...in every 6 hours
        setInterval(pruneExpiredCache, 6 * 60 * 60 * 1000);
    } catch (error) {
        console.error('Database initialization error:', error);
        throw error;
    } finally {
        client?.release();
    }
};

export const pruneExpiredCache = async () => {
  const result = await pool.query(
    `DELETE FROM semantic_cache WHERE expires_at < NOW() RETURNING id;`
  );
  const deletedRows = result.rowCount ?? 0;
  if (deletedRows > 0) {
    console.log(`🧹 Pruned ${deletedRows} expired cache entries`);
  }
};

export default pool;
