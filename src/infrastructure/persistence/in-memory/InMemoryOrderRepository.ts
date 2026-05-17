/**
 * Implementación de persistencia en memoria para las Órdenes.
 * Útil para pruebas automáticas y fases iniciales de desarrollo sin base de datos.
 */
import { Order } from "src/domain/entities/Order.js";
import { SKU } from "src/domain/value-objects/SKU.js";
import { Result, ok, fail } from "src/shared/Result.js";
import { OrderRepository } from "src/application/ports/OrderRepository.js";
import { AppError, NotFoundError, InfraError } from "src/application/errors.js";

export class InMemoryOrderRepository implements OrderRepository {
    /** Mapa que simula la tabla de la base de datos utilizando el valor del SKU como clave */
    private readonly orders: Map<string, Order> = new Map();
/**
     * Guarda o actualiza una orden en el almacén de memoria.
     * @param order La entidad de orden a persistir.
     */
    async save(order: Order): Promise<Result<void, AppError>> {
        try {
            // Guardamos una copia para evitar que cambios externos afecten al "almacén"
            const clonedOrder = this.cloneOrder(order);
            this.orders.set(order.sku.value, clonedOrder);
            return ok(undefined);
        }
        catch (error) {
            return fail(new InfraError("Error saving order", 
                error instanceof Error ? error : undefined));
        }
    }
    /**
     * Busca una orden por su identificador único (SKU).
     * @param sku Objeto de valor que representa el identificador.
     */
    async findById(sku: SKU): Promise<Result<Order, AppError>> {
        try {
            const order = this.orders.get(sku.value);
            if (!order) {
                return fail(new NotFoundError("Order", sku.value));
            }
            // Devolvemos una copia para proteger la integridad de los datos guardados
            return ok(this.cloneOrder(order));
        }
        catch (error) {
            return fail(new InfraError("Error finding order", 
                error instanceof Error ? error : undefined));
        }
    }
    async findBySKU(sku: any): Promise<Result<Order, AppError>> {
        return this.findById(sku);
}
    /**
     * Crea una copia profunda de la orden.
     * @param order Orden original.
     * @private
     */
    private cloneOrder(order: Order): Order {
        const clonedOrder = new Order(order.sku);
        for (const item of order.items) {
            clonedOrder.addItem(item.productSku, item.quantity, item.unitPrice);
        }
        return clonedOrder;
    }
}