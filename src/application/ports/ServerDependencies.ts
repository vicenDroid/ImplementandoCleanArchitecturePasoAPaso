// src/application/ports/ServerDependencies.ts
// ServerDependencies interface representing the dependencies required by the server to 
// handle incoming requests. This allows for decoupling the server implementation from 
// the specific use cases and services it depends on, enabling easier testing and potential
// support for different server implementations in the future.
import { CreateOrder } from '../use-cases/CreateOrder.js';
import { AddItemToOrder } from '../use-cases/AddItemToOrder.js';
import { Logger } from '../ports/Logger.js';
}

export interface ServerDependencies {
    createOrder: CreateOrder;
    addItemToOrder: AddItemToOrder;
    logger: Logger;
}