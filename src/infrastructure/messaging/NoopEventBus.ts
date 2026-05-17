/**
 * Implementación "No-Operation" (Noop) del bus de eventos.
 * Se utiliza para satisfacer la dependencia de mensajería sin realizar ninguna acción real.
 * Útil en entornos de prueba o durante el desarrollo de la lógica de negocio.
 */
import { DomainEvent } from "src/domain/events/DomainEvent.js";
import { Result, ok } from "src/shared/Result.js";
import { AppError } from "src/application/errors.js";
import { EventBus } from "src/application/ports/EventBus.js";

export class NoopEventBus implements EventBus {
    /**
     * Simula la publicación de eventos de dominio.
     * @param _events Matriz de eventos generados por las entidades de dominio.
     * @returns Un resultado exitoso constante.
     */
    async publish(_events: DomainEvent[]): Promise<Result<void, AppError>> {
        // En esta implementación, simplemente ignoramos los eventos y retornamos éxito.
        return ok(undefined);
    }
}