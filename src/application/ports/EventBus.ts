// src/application/ports/EventBus.ts
// EventBus interface representing a simple abstraction for publishing domain events. This 
// allows for decoupling the application logic from the specific implementation of event 
// handling, enabling easier testing and potential support for different event bus 
// implementations in the future.
import { DomainEvent } from '../../domain/events/DomainEvent.js';
import { Result } from '../../shared/Result.js';
import { AppError } from '../errors.js';

export interface EventBus {
    publish(event: DomainEvent[]): Promise<Result<void, AppError>>;
}