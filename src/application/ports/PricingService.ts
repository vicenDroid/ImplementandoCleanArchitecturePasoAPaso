// src/application/ports/PricingService.ts
// PricingService interface representing a simple abstraction for retrieving the price of a 
// product based on its SKU. This allows for decoupling the application logic from the 
// specific implementation of pricing, enabling easier testing and potential support for 
// different pricing strategies in the future.
import { SKU } from '../../domain/value-objects/SKU.js';
import { Money } from '../../domain/value-objects/Money.js';
import { Result } from '../../shared/Result.js';
import { AppError } from '../errors.js';

export interface PricingService {
    getPrice(sku: SKU): Promise<Result<Money, AppError>>;
}