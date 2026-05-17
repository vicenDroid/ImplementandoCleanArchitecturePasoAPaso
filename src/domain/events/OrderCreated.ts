// src/domain/events/OrderCreated.ts
// Domain event representing the creation of an order. This event captures the SKU of
// the order, allowing for decoupled communication and potential event sourcing in the
// application.
import { DomainEvent } from './DomainEvent.js';
export class OrderCreated extends DomainEvent {
    constructor(public readonly orderSku: string) {
        super(orderSku); // El orderSku actúa como el aggregateId
    }
}