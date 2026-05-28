import { Pool } from 'pg';
import { PgUnitOfWork } from '../persistence/postgres/PgUnitOfWork.js';
import { getDatabaseUrl } from '../../composition/config.js';

// Factoría centralizada para gestionar el ciclo de vida de la base de datos
export class DatabaseFactory {
  // Instancia única del Pool de conexiones para aplicar el patrón Singleton
  private static pool: Pool | null = null;

  // Crea o recupera la piscina de conexiones única de PostgreSQL
  static createPool(): Pool {
    if (!this.pool) {
      this.pool = new Pool({
        connectionString: getDatabaseUrl(),
        max: 10, // Número máximo de clientes simultáneos en Docker
        idleTimeoutMillis: 30000, // Cierra conexiones inactivas tras 30 segundos
        connectionTimeoutMillis: 5000, // Tiempo límite de espera para conectar antes de lanzar error
      });

      // Captura fallos inesperados en clientes que están en reposo
      this.pool.on('error', (err: Error) => {
        console.error('Unexpected error on idle client', err);
        process.exit(-1);
      });
    }

    return this.pool;
  }

  // Instancia una nueva unidad de trabajo inyectándole el Pool centralizado
  static createUnitOfWork(): PgUnitOfWork {
    const pool = this.createPool();
    return new PgUnitOfWork(pool);
  }

  // Cierra de forma ordenada todas las conexiones activas del Pool al apagar el servidor
  static async closePool(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
  }
}