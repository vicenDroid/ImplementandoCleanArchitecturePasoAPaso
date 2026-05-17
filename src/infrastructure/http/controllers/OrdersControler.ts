/**
 * Controlador de Órdenes
 * Punto de entrada HTTP que comunica las peticiones externas con los casos de uso.
 */
import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { CreateOrder } from "src/application/use-cases/CreateOrder.js";
import { AddItemToOrder } from "src/application/use-cases/AddItemToOrder.js";
import { CreateOrderDto } from "src/application/dto/CreateOrderDto.js";
import { AddItemToOrderDto } from "src/application/dto/AddItemToOrderDto.js";
import { AppError } from "../../../application/errors.js";


interface AddItemRequest{
    productSku: string;
    quantity: number;
}

interface AddItemParams{
    ordersku: string;
}

export class OrderController {
    constructor(
        private readonly createOrderUseCase: CreateOrder,
        private readonly addItemToOrderUseCase: AddItemToOrder
    ) {}
/**
     * Registra las rutas de órdenes en la instancia de Fastify.
     */
    async registerRoutes(fastify: FastifyInstance): Promise<void> {
        fastify.post('/orders', this.createOrder.bind(this));
        fastify.post('/orders/:ordersku/items', this.addItem.bind(this));
    }
/**
     * Manejador para la creación de una nueva orden.
     */
    private async createOrder(
        request: FastifyRequest<{ Body: CreateOrderDto }>,
        reply: FastifyReply
    ): Promise<void> {
        const dto: CreateOrderDto = {
            orderSku: request.body.orderSku
        };
        const result = await this.createOrderUseCase.execute(dto)

        if (!result.isSuccess) {
            const statusCode = this.mapErrorToStatusCode(result.error);
            reply.code(statusCode).send({ error: result.error.type,
                message: result.error.message 
            })
            return;
        }
        reply.code(201).send({message:  "Order created successfully"});
    }
/**
     * Manejador para añadir un ítem a una orden existente.
     */
    private async addItem(
        request: FastifyRequest<{ Params: AddItemParams, Body: AddItemRequest }>,
        reply: FastifyReply    
    ): Promise<void> {
        // Forzamos a extraer el parámetro directamente como un String llave-valor
        const params = request.params as any;

        const dto: AddItemToOrderDto = {
            orderSku: params.ordersku,
            productSku: request.body.productSku,
            quantity: request.body.quantity
        };
        const result = await this.addItemToOrderUseCase.execute(dto)
        if (!result.isSuccess) {
            const statusCode = this.mapErrorToStatusCode(result.error);
            reply.code(statusCode).send({ 
                error: result.error.type,
                message: result.error.message 
            });
            return;
        }
        reply.code(200).send({message:  "Item added successfully"});
    }    
    /**
     * Mapea los errores de dominio/aplicación a códigos de estado HTTP estándar.
     */
    private mapErrorToStatusCode(error: AppError): number { 
        switch (error.type) {
            case 'VALIDATION_ERROR':
                return 400;
            case 'NOT_FOUND_ERROR':
                return 404;
            case 'CONFLICT_ERROR':
                return 409;
            case 'INFRA_ERROR':
                return 503;
            default:
                return 500;
        }  
    }
}