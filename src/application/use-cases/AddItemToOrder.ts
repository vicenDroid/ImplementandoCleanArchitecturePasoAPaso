/**
 * Caso de Uso: AddItemToOrder
 * Gestiona la adición de productos a una orden existente.
 * Se comunica con un servicio externo de precios para valorar el producto.
 */
import { SKU } from '../../domain/value-objects/SKU.js';
import { Quantity } from '../../domain/value-objects/Quantity.js';
import { Result, ok, fail } from 'src/shared/Result.js';
import { OrderRepository } from '../ports/OrderRepository.js';
import { PricingService } from '../ports/PricingService.js';
import { EventBus } from '../ports/EventBus.js';
import { AddItemToOrderDto } from '../dto/AddItemToOrderDto.js';
import { AppError, ValidationError } from '../errors.js';

export class AddItemToOrder {
    constructor(
        private readonly orderRepository: OrderRepository,
        private readonly pricingService: PricingService,
        private readonly eventBus: EventBus
    ) {}
    /**
     * Ejecuta el proceso de añadir un ítem.
     * @param dto Contiene el SKU de la orden, el SKU del producto y la cantidad.
     */
    async execute(dto: AddItemToOrderDto): Promise<Result<void, AppError>> {
        try {
            const orderSku = new SKU(dto.orderSku);
            const productSku = new SKU(dto.productSku);
            const quantity = new Quantity(dto.quantity);

            const orderResult = await this.orderRepository.findBySKU(orderSku);
            if (!orderResult.isSuccess) {
                return fail(orderResult.error);
            }
            
            const order = orderResult.value;
            const priceResult = await this.pricingService.getPrice(productSku);
            if (!priceResult.isSuccess) {
                return fail(priceResult.error);
            }
            
            const unitPrice = priceResult.value;
            order.addItem(productSku, quantity, unitPrice);
            const saveResult = await this.orderRepository.save(order);
            if (!saveResult.isSuccess) {
                return fail(saveResult.error);
            }
            const publishResult = await this.eventBus.publish(order.events);
            if (!publishResult.isSuccess) {
                return fail(publishResult.error);
            }
            return ok(undefined);
        } catch (error) {
            if (error instanceof ValidationError) {
                return fail(new ValidationError(error.message));
            }
            return fail(new ValidationError("Unknown validation error"));
        }
    }
}