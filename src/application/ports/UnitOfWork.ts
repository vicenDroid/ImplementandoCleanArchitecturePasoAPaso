import { Result } from '../../shared/Result.js';
import { AppError } from '../../application/errors.js';
import { OrderRepository } from '../../application/ports/OrderRepository.js';

// Interfaz del puerto Unit of Work (Unidad de Trabajo).
// Define el contrato para asegurar que múltiples operaciones de persistencia
// se ejecuten de forma atómica (todo o nada) dentro de una única transacción.
export interface UnitOfWork {
  // Método de ejecución continua. Recibe una función 'fn' que contiene la lógica
  // del caso de uso y le provee los repositorios vinculados a la transacción activa.
  run<T>(fn: (repos: Repositories) => Promise<T>): Promise<Result<T, AppError>>;
}

// Interfaz que agrupa todos los repositorios disponibles del sistema.
// Permite al caso de uso acceder a las operaciones de datos compartiendo
// el mismo canal o contexto transaccional de forma segura.
export interface Repositories {
  // Repositorio encargado de gestionar la persistencia y consultas de pedidos
  orderRepository: OrderRepository;
}