# Microservicio de Pedidos
- **Dominio**: Order, Price, SKU, Quantity, eventos de dominio.
- **Application**: casos de uso CreateOrder, AddItemToOrder, puertos y DTOs.
- **Infra**: repositorio InMemory, pricing estático, event bus no-op.
-**HTTP**: endpoints mínimos con Fastify
-**Composicion**: container.ts como composition root.
-**Test**: dominio + aceptacion de casos de uso.

## Comportamiento
- `Post / orders` crea un pedido.
- `Post / orders/:orderId/items` agrega una línea (SKU + qty) con precio actual.
- Devuelve el total del pedido.

## Estructura de carpetas
/src
    /domain
        /entities
        /value-objects
        /events
        /errors
    /application
        /use-cases
        /ports
        /dto
        /errors.ts
    /infrastructure
        /persistence/in-memory
        /http/controllers
        /http
        /messaging
    /composition
    /shared
/test