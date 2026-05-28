import { EventBus } from '../../application/ports/EventBus.js'
import { OutboxEventBus } from './OutboxEventBus.js'
import { NoopEventBus } from './NoopEventBus.js'
import { OutboxDispatcher } from './OutboxDispacher.js'
import { DatabaseFactory } from '../database/DataBaseFactory.js'

// Factoría centralizada para gestionar la creación de componentes de mensajería y eventos
export class MessagingFactory {
  
  // Instancia el bus de eventos adecuado según el tipo solicitado ('outbox' por defecto o 'noop' para pruebas)
  static createEventBus(type: 'outbox' | 'noop' = 'outbox'): EventBus {
    if (type === 'noop') {
      return new NoopEventBus()
    }

    // El bus outbox necesita el Pool de conexiones centralizado para registrar los eventos en la BD
    const pool = DatabaseFactory.createPool()
    return new OutboxEventBus(pool)
  }

  // Instancia el despachador encargado de procesar la tabla outbox en segundo plano
  static createOutboxDispatcher(batchSize = 100, intervalMs = 5000): OutboxDispatcher {
    return new OutboxDispatcher(batchSize, intervalMs)
  }
}