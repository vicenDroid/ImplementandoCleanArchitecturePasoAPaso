/**
 * Implementación estática del servicio de precios externo.
 * Simula la consulta a una API externa devolviendo precios predefinidos.
 */
import { SKU } from "src/domain/value-objects/SKU.js";
import { Money } from "src/domain/value-objects/Money.js";
import { Currency } from "src/domain/value-objects/Currency.js";
import { Result, ok, fail } from "src/shared/Result.js";
import { PricingService } from "src/application/ports/PricingService.js";
import { AppError, NotFoundError, InfraError } from "../../../application/errors.js";

export class StaticPricingService implements PricingService {
    /** * Mapa de precios por producto. 
     * Nota: Hemos añadido los corchetes externos [] para que sea una matriz de entradas válida.
     */
    private readonly prices: Map<string, {amount: number, currency: string}> 
    = new Map<string, {amount: number, currency: string}>([
        ['LAPTOP-001', {amount: 999.99, currency: 'USD'}],
        ['MOUSE-001', {amount: 29.99, currency: 'USD'}],
        ['KEYBOARD-001', {amount: 79.99, currency: 'USD'}],
        ['HEADPHONES-001', {amount: 149.99, currency: 'USD'}],
        ['MONITOR-001', {amount: 299.99, currency: 'USD'}],
        ['TABLET-001', {amount: 499.99, currency: 'EUR'}],
        ['PHONE-001', {amount: 799.99, currency: 'EUR'}],
        ['CAMERA-001', {amount: 399.99, currency: 'EUR'}],
        ['SPEAKER-001', {amount: 199.99, currency: 'GBP'}]
    ]);
/**
     * Obtiene el precio de un producto consultando el catálogo estático.
     * @param productSku SKU del producto del cual se desea conocer el precio.
     */
    async getPrice(productSku: SKU): Promise<Result<Money, AppError>> {
        try {
            const priceData = this.prices.get(productSku.value);
            if (!priceData) {
                return fail(new NotFoundError("Product price", productSku.value));
            }
            // Creamos los objetos de valor necesarios para la respuesta
            const currency = new Currency(priceData.currency);
            const money = new Money(priceData.amount, currency);
            return ok(money);            
        }
        catch (error) {
            return fail(new InfraError("Error getting price", 
                error instanceof Error ? error : undefined));
        }
    }
}