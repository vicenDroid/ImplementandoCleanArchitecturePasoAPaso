// src/domain/events/DomainEvent.ts
// Base class for domain events in the application. Each domain event captures the 
// occurrence of a significant change or action within the domain, allowing for 
// decoupled communication between different parts of the system and enabling features 
// like event sourcing and eventual consistency.
export abstract class DomainEvent {
    readonly occurredOn: Date;
    readonly aggregateId: string;
    constructor(aggregateId: string) {
        this.occurredOn = new Date();
        this.aggregateId = aggregateId;
    }
}