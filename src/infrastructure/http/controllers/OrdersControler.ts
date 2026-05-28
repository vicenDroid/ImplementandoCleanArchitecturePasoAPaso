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
import { Logger } from "../../../application/ports/Logger.js";
import { randomUUID } from "node:crypto";

interface AddItemRequest{
    productSku: string;
    quantity: number;
}

interface AddItemParams{
    ordersku: string;
}

export class OrderController {
    // El constructor ahora recibe el puerto del Logger inyectado desde fuera
    constructor(
        private readonly createOrderUseCase: CreateOrder,
        private readonly addItemToOrderUseCase: AddItemToOrder,
        private readonly logger: Logger
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
        // Genera un identificador único para rastrear todo el ciclo de vida de esta petición
        const requestId = randomUUID();
        
        // Crea un sub-logger contextualizado que arrastrará el ID, la operación y la URL
        const logger = this.logger.child({
            requestId,
            operation: 'createOrder',
            method: request.method,
            url: request.url
        });
        
        logger.info('Creating order',{orderSku: request.body.orderSku});
        const dto: CreateOrderDto = {
            orderSku: request.body.orderSku
        };
        const result = await this.createOrderUseCase.execute(dto)

        // Si el caso de uso falla, mapeamos el error y dejamos registro detallado del fallo
        if (!result.isSuccess) {
            const statusCode = this.mapErrorToStatusCode(result.error);
            logger.error('Error creating order', {orderSku: request.body.orderSku, 
                error: result.error,
                message: result.error.message,
                statusCode
            });
            reply.code(statusCode).send({ error: result.error.type,
                message: result.error.message 
            })
            return;
        }
        
        logger.info('Order created successfully', {orderSku: request.body.orderSku});
        reply.code(201).send({message:  "Order created successfully"});
    }

    /**
     * Manejador para añadir un ítem a una orden existente.
     */
    private async addItem(
        request: FastifyRequest<{ Params: AddItemParams, Body: AddItemRequest }>,
        reply: FastifyReply    
    ): Promise<void> {
        // Genera un ID único para la trazabilidad de la llamada de añadir ítem
        const requestId = randomUUID();
        
        // Crea el logger hijo específico para esta operación de añadir ítem
        const logger = this.logger.child({
            requestId,
            operation: 'addItem',
            method: request.method,
            url: request.url
        });

        logger.info('Adding item to order ',{
            orderSku: request.body.productSku,
            quantity: request.body.quantity,
            productSku: request.body.productSku, 
        });

        // Forzamos a extraer el parámetro directamente como un String llave-valor
        const params = request.params as any;

        const dto: AddItemToOrderDto = {
            orderSku: params.ordersku,
            productSku: request.body.productSku,
            quantity: request.body.quantity
        };
        const result = await this.addItemToOrderUseCase.execute(dto)
        
        // Si hay error de negocio, se registra con nivel de severidad 'error' aportando el estado HTTP
        if (!result.isSuccess) {
            const statusCode = this.mapErrorToStatusCode(result.error);

            logger.error('Error adding item to order failed', {
                orderSku: params.ordersku,
                productSku: request.body.productSku,
                quantity: request.body.quantity,
                error: result.error.type,
                message: result.error.message,
                statusCode
            });
            reply.code(statusCode).send({ 
                error: result.error.type,
                message: result.error.message 
            });
            return;
        }
        
        logger.info('Item added successfully', {
            orderSku:request.params.ordersku,
            productSku: request.body.productSku,
            quantity: request.body.quantity
        });
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