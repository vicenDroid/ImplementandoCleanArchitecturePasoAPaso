import { Pool } from 'pg'
import { randomUUID, createHash } from 'crypto'
import { DomainEvent } from '../../domain/events/DomainEvent.js'
import { Result, ok, fail } from '../../shared/Result.js'
import { EventBus } from '../../application/ports/EventBus.js'
import { AppError, InfraError } from '../../application/errors.js'

// Estructura de datos que representa una fila en la tabla de la base de datos outbox
interface OutboxRecord {
  id: string
  aggregate_id: string
  aggregate_type: string
  event_type: string
  event_data: object
  created_at: Date
}

// Implementación del Bus de Eventos usando el patrón Transaccional Outbox
export class OutboxEventBus implements EventBus {

  // Recibe el Pool de conexiones para interactuar de forma directa con PostgreSQL
  constructor(private readonly pool: Pool) {}

  // Guarda la lista de eventos del dominio dentro de la tabla outbox
  async publish(events: DomainEvent[]): Promise<Result<void, AppError>> {
    if (events.length === 0) {
      return ok(undefined)
    }

    // Solicita una conexión dedicada al Pool
    const client = await this.pool.connect()
    
    try {
        
      // 1. Mapea los eventos del dominio al formato plano de la base de datos
      const outboxRecords: OutboxRecord[] = events.map(event => ({
        id: randomUUID(),
        aggregate_id: this.generateUuidFromSku(event.aggregateId),
        aggregate_type: this.extractAggregateType(event),
        event_type: event.constructor.name,
        event_data: this.serializeEvent(event),
        created_at: event.occurredOn
      }))

      // 2. Construye una consulta SQL de inserción múltiple dinámica ($1, $2, $3...)
      const query = `
        INSERT INTO outbox (id, aggregate_id, aggregate_type, event_type, event_data, created_at)
        VALUES ${outboxRecords.map((_, index) => 
          `($${index * 6 + 1}, $${index * 6 + 2}, $${index * 6 + 3}, $${index * 6 + 4}, $${index * 6 + 5}, $${index * 6 + 6})`
        ).join(', ')}
      `

      // 3. Aplana todos los valores de los registros en un único array de parámetros
      const params = outboxRecords.flatMap(record => [
        record.id,
        record.aggregate_id,
        record.aggregate_type,
        record.event_type,
        JSON.stringify(record.event_data),
        record.created_at
      ])

      // 4. Ejecuta la inserción en la base de datos
      await client.query(query, params)
      
      return ok(undefined)
    } catch (error) {
      // Manejo y encapsulamiento del error de infraestructura
      const errorMessage = error instanceof Error ? error.message : 'Unknown outbox persistence error'
      return fail(new InfraError(`Failed to persist events to outbox: ${errorMessage}`))
    } finally {
      // Libera siempre la conexión devolviéndola al Pool
      client.release()
    }
  }

  // Deduce el tipo de agregado analizando el nombre del evento
  private extractAggregateType(event: DomainEvent): string {
    const eventName = event.constructor.name
    
    if (eventName.includes('Order')) {
      return 'Order'
    }
    
    return 'Unknown'
  }

  // Estructura el objeto del evento extrayendo sus metadatos base
  private serializeEvent(event: DomainEvent): object {
    return {
      aggregateId: event.aggregateId,
      occurredOn: event.occurredOn.toISOString(),
      ...this.getEventPayload(event)
    }
  }

  // Extrae los datos específicos del evento eliminando las propiedades comunes
  private getEventPayload(event: DomainEvent): object {
    const payload = { ...event }
    
    delete (payload as any).aggregateId
    delete (payload as any).occurredOn
    
    return payload
  }

  // Transforma el SKU (string) en un UUID v4 válido y determinista usando SHA-256
  private generateUuidFromSku(sku: string): string {
    const hash = createHash('sha256').update(sku).digest('hex');
    return [
      hash.substring(0, 8),
      hash.substring(8, 12),
      '4' + hash.substring(13, 16), // Fuerza la versión 4 de UUID
      '8' + hash.substring(17, 20), // Fuerza los bits de variante
      hash.substring(20, 32)
    ].join('-');
  }
}