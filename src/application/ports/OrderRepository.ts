// src/application/ports/OrderRepository.ts
// OrderRepository interface representing a simple abstraction for persisting and retrieving 
// Order entities. This allows for decoupling the application logic from the specific 
// implementation of data storage, enabling easier testing and potential support for 
// different storage mechanisms in the future.
import { Order } from '../../domain/entities/Order.js';
import { SKU } from '../../domain/value-objects/SKU.js';
import { Result } from '../../shared/Result.js';
import { AppError } from '../errors.js';

export interface OrderRepository {
    save(order: Order): Promise<Result<void, AppError>>;
    findBySKU(sku: SKU): Promise<Result<Order, AppError>>;
}