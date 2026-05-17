/**
 * Caso de Uso: CreateOrder
 * Responsable de la creación lógica de una nueva orden de compra.
 * Coordina la validación de duplicados y la persistencia inicial.
 */
import { Order } from "../../domain/entities/Order.js";
import { SKU } from "../../domain/value-objects/SKU.js";
import { Result, ok, fail } from "src/shared/Result.js";
import { OrderRepository } from "../ports/OrderRepository.js";
import { EventBus } from "../ports/EventBus.js";
import { AppError, ValidationError, ConflictError } from "../errors.js";
import { CreateOrderDto } from "../dto/CreateOrderDto.js";

export class CreateOrder {
    constructor(
        private readonly orderRepository: OrderRepository,        
        private readonly eventBus: EventBus
    ) {}

    /**
     * Ejecuta la lógica para crear una orden.
     * @param dto Datos de entrada (SKU de la orden).
     */

    async execute(dto: CreateOrderDto): Promise<Result<Order, AppError>> {
        try {
            // Convertimos el primitivo del DTO en un Value Object (valida el formato)
            const orderSku = new SKU(dto.orderSku);
            // Verificamos si la orden ya existe para evitar duplicados
            const existingOrderResult = await this.orderRepository.findBySKU(orderSku);
            if (existingOrderResult.isSuccess) {
                return fail(new ConflictError(`Order with SKU ${orderSku.value} 
                    already exists`));
            }
            // Si el error no es "No encontrado", es un error técnico que debemos reportar
            if (existingOrderResult.error.type !== "NOT_FOUND_ERROR"){
                return fail(existingOrderResult.error);            
            }
            // Creamos la entidad de dominio
            const order = new Order(orderSku);

            // Persistimos la nueva orden
            const saveResult = await this.orderRepository.save(order);
            if (!saveResult.isSuccess) {
                return fail(saveResult.error);
            }
            // Notificamos los eventos de dominio acumulados en la entidad
            const publishResult = await this.eventBus.publish(order.events);
            if (!publishResult.isSuccess) {
                return fail(publishResult.error);
            }
            return ok(order);
            
        } catch (error: any) {
            const message = error instanceof Error ? error.message : "Unknown validation error";
            return fail(new ValidationError(message));
            //return fail(new ValidationError("Unknown validation error"));
        }
    }
}