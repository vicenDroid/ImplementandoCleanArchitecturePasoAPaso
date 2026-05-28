import { InMemoryOrderRepository } from "src/infrastructure/persistence/in-memory/InMemoryOrderRepository.js";
import { StaticPricingService } from "src/infrastructure/http/controllers/StaticPricingService.js";
import { NoopEventBus } from "src/infrastructure/messaging/NoopEventBus.js";
import { ServerDependencies } from "src/application/ports/ServerDependencies.js";
import { CreateOrder } from "src/application/use-cases/CreateOrder.js";
import { AddItemToOrder } from "src/application/use-cases/AddItemToOrder.js";
import { OrderRepository } from "src/application/ports/OrderRepository.js";
import { PricingService } from "src/application/ports/PricingService.js";
import { EventBus } from "src/application/ports/EventBus.js";
import { PinoLogger } from "src/infrastructure/logging/PinoLogger.js";
import { Logger } from "src/application/ports/Logger.js";
import { config } from "./config.js";
import { PostgresOrderRepository } from "src/infrastructure/persistence/postgres/PostgresOrderRepository.js";
import { DatabaseFactory } from "src/infrastructure/database/DatabaseFactory.js";

/**
 * Interfaz extendida que agrupa tanto las dependencias del servidor
 * como los puertos de infraestructura.
 */
export interface Dependencies extends ServerDependencies {
  // Ports
  orderRepository: OrderRepository
  pricingService: PricingService
  eventBus: EventBus
  logger: Logger
  cleanup?: () => Promise<void>
}

/**
 * Raíz de Composición (Composition Root).
 * Aquí se fabrican las instancias reales y se inyectan unas dentro de otras.
 */
export async function buildContainer(): Promise<Dependencies> {
  // Infrastructure layer - Adapters
  const logger = new PinoLogger()
  const pricingService = new StaticPricingService()
  const eventBus = new NoopEventBus()
  //const pgClient = DatabaseFactory.createClient(config.DATABASE_URL)

  let orderRepository: OrderRepository

  const pgClient = await DatabaseFactory.createPool().connect()

  if (config.DATABASE_TYPE === 'postgres') {
    logger.info('Alternando a infraestructura de base de datos POSTGRES')
    orderRepository = new PostgresOrderRepository(pgClient)
  } else {
    logger.info('Alternando a infraestructura de base de datos IN-MEMORY')
    orderRepository = new InMemoryOrderRepository()
  }

  // Application layer - Use Cases
  const createOrderUseCase = new CreateOrder(orderRepository, eventBus)
  const addItemToOrderUseCase = new AddItemToOrder(orderRepository, pricingService, eventBus)

  // Definimos la función de limpieza que requiere main.ts para cerrar recursos
  const cleanup = async () => {
    logger.info('Limpiando conexiones y recursos del contenedor...')
  }

  return {
    // Mapeamos los nombres correctos que exige ServerDependencies
    createOrder: createOrderUseCase,
    addItemToOrder: addItemToOrderUseCase,
    
    // Ports e infraestructura
    orderRepository,
    pricingService,
    eventBus,
    logger,
    cleanup
  }
}

// Exportamos el alias exacto que busca el archivo main.ts
export { buildContainer as buildUnifiedContainer }