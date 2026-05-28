import { Pool } from 'pg';
import { UnitOfWork, Repositories } from '../../../application/ports/UnitOfWork.js';
import { PostgresOrderRepository } from './PostgresOrderRepository.js';
import { Result, ok, fail } from '../../../shared/Result.js';
import { AppError, InfraError } from '../../../application/errors.js';

// Clase de infraestructura que implementa el contrato UnitOfWork de la capa de aplicación.
// Se encarga de gestionar el ciclo de vida de las transacciones SQL de PostgreSQL.
export class PgUnitOfWork implements UnitOfWork {
  
  // Recibe el Pool de conexiones general de la base de datos a través del constructor
  constructor(private readonly pool: Pool) {}

  // Método principal que ejecuta un conjunto de operaciones (función 'fn') de forma atómica.
  // Si todo el bloque se ejecuta con éxito, confirma los cambios; si falla, revierte todo.
  async run<T>(fn: (repos: Repositories) => Promise<T>): Promise<Result<T, AppError>> {
    // 1. Solicita y abre una conexión dedicada (cliente) desde el Pool de Docker
    const client = await this.pool.connect();
    
    try {
      // 2. Inicia formalmente la transacción en el motor de la base de datos (BEGIN)
      await client.query('BEGIN');
      
      // 3. Instancia los repositorios necesarios inyectándoles este cliente específico.
      // De este modo, todas las consultas SQL del repositorio compartirán la misma transacción.
      const repositories: Repositories = {
        orderRepository: new PostgresOrderRepository(client),
      };
      
      // 4. Ejecuta la lógica de negocio del caso de uso pasándole los repositorios preparados
      const result = await fn(repositories);
      
      // 5. Si no ha habido errores, consolida todos los cambios de forma definitiva (COMMIT)
      await client.query('COMMIT');
      
      // Devuelve el resultado exitoso empaquetado en el patrón Result
      return ok(result);
    } catch (error) {
      // 6. Si salta cualquier fallo, cancela inmediatamente todas las operaciones (ROLLBACK).
      // La base de datos vuelve a su estado original evitando datos huérfanos o corruptos.
      await client.query('ROLLBACK');
      
      // Encapsula el error del sistema en un InfraError controlado para la arquitectura
      const errorMessage = error instanceof Error ? error.message : 'Unknown transaction error';
      return fail(new InfraError(`Transaction failed: ${errorMessage}`));
    } finally {
      // 7. Bloque obligatorio: Libera el cliente devolviéndolo al Pool para que otros procesos lo usen
      client.release();
    }
  }
}