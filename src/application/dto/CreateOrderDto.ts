// src/application/dto/CreateOrderDto.ts
/**
 * Data Transfer Object (DTO) for creating a new order.
 * This object is used to receive data from external sources (like a REST API)
 * before it is processed by the application layer.
 */
export interface CreateOrderDto{
    orderSku: string;
}