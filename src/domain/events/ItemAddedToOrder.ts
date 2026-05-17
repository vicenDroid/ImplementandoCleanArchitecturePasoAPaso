// src/domain/events/ItemAddedToOrder.ts
// Domain event representing the addition of an item to an order. This event captures 
// the details of the item added, including the product SKU, quantity, unit price, and 
// currency, allowing for decoupled communication and potential event sourcing in the 
// application.
import { DomainEvent } from './DomainEvent.js';
export class ItemAddedToOrder extends DomainEvent {
    constructor(
        public readonly orderSku: string,
        public readonly productSku: string,
        public readonly quantity: number,
        public readonly unitPrice: number,
        public readonly currency: string
    ) {
        super(orderSku); // El orderSku actúa como el aggregateId
    }
}