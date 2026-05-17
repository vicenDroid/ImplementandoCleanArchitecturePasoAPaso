import { InMemoryOrderRepository } from "src/infrastructure/persistence/in-memory/InMemoryOrderRepository.js";
import { StaticPricingService } from "src/infrastructure/http/controllers/StaticPricingService.js";
import { NoopEventBus } from "src/infrastructure/messaging/NoopEventBus.js";
import { ServerDependencies } from "src/application/ports/ServerDependencies.js";
import { CreateOrder } from "src/application/use-cases/CreateOrder.js";
import { AddItemToOrder } from "src/application/use-cases/AddItemToOrder.js";
import { OrderRepository } from "src/application/ports/OrderRepository.js";
import { PricingService } from "src/application/ports/PricingService.js";
import { EventBus } from "src/application/ports/EventBus.js";
/**
 * Interfaz extendida que agrupa tanto las dependencias del servidor
 * como los puertos de infraestructura.
 */
export interface Dependencies extends ServerDependencies {
    //Ports
    orderRepository: OrderRepository;
    pricingService: PricingService;
    eventBus: EventBus;
}
/**
 * Raíz de Composición (Composition Root).
 * Aquí se fabrican las instancias reales y se inyectan unas dentro de otras.
 * Es el único lugar donde la infraestructura se toca con la aplicación.
 */
export function buildContainer(): Dependencies {
    // Infraestructure layer - We create an Adapters
    const orderRepository = new InMemoryOrderRepository();
    const pricingService = new StaticPricingService();
    const eventBus = new NoopEventBus();
    // Application layer - Use cases
    const createOrder = new CreateOrder(orderRepository, eventBus);
    const addItemToOrder = new AddItemToOrder(orderRepository, pricingService, eventBus);
    // Return
    return {
        orderRepository: orderRepository as any,
        pricingService: pricingService as any,
        eventBus: eventBus as any,
        createOrder: createOrder as any,
        addItemToOrder: addItemToOrder as any
    }
}