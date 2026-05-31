import { Client, PoolClient } from 'pg';
import { createHash } from 'crypto';
import { OrderRepository } from '../../../application/ports/OrderRepository.js';
import { Order } from '../../../domain/entities/Order.js';
import { SKU } from '../../../domain/value-objects/SKU.js';
import { Money } from '../../../domain/value-objects/Money.js';
import { Currency } from '../../../domain/value-objects/Currency.js';
import { Quantity } from '../../../domain/value-objects/Quantity.js';
import { Result, ok, fail } from '../../../shared/Result.js';
import { AppError, InfraError, NotFoundError } from '../../../application/errors.js';

// Modelo de datos exacto que representa una fila de la tabla "orders" en la base de datos
interface OrderRow {
  id: string;
  customer_id: string;
  status: string;
  total_amount: number;
  currency: string;
  created_at: Date;
  updated_at: Date;
}

// Modelo de datos que representa una fila de la tabla de detalles "order_items" en PostgreSQL
interface OrderItemRow {
  id: string;
  order_id: string;
  sku: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: Date;
}

// Clase de infraestructura encargada de persistir (guardar) y buscar los pedidos en Docker
export class PostgresOrderRepository implements OrderRepository {
  // Recibe la conexión activa de PostgreSQL por el constructor (inyección de dependencias)
  constructor(private readonly client: Client | PoolClient) {}

  // MÉTODO 1: Guarda o actualiza un pedido completo en la base de datos.
  async save(order: Order): Promise<Result<void, AppError>> {
    const connection = await this.getConnection();
    
    try {
      // 1. Calcula los totales desglosados del pedido del dominio
      const totals = order.getTotalByCurrency();
      const totalEntries = Array.from(totals.entries());
      
     // Evaluamos el primer elemento de forma totalmente segura para TypeScript
      let totalMoney: Money;
      const firstEntry = totalEntries[0];
      
      if (firstEntry) {

        totalMoney = firstEntry[1]; // Si existe el grupo de datos, extraemos el objeto Money
      
      } else {
        // Si no hay nada, creamos un flujo por defecto
        totalMoney = new Money(0, new Currency('EUR')); // Si no hay nada, creamos un flujo por defecto
      }
      // 2. Ejecuta el Upsert del pedido principal (cabecera del ticket)
      await this.upsertOrder(connection, order, totalMoney);
      
      // 3. Limpia las líneas del pedido antiguas y escribe las nuevas para evitar datos huérfanos
      await this.replaceOrderItems(connection, order);
      
      // Devuelve un resultado de éxito controlado (Patrón Result)
      return ok(undefined);
    } catch (error) {
      // Si el motor de la base de datos se cae o falla, encapsula el error en un InfraError
      const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
      return fail(new InfraError(`Failed to save order: ${errorMessage}`));
    }
  }

  // MÉTODO 2: Busca un pedido en la base de datos filtrándolo por su identificador SKU
  async findBySKU(sku: SKU): Promise<Result<Order, AppError>> {
    try {
      // 1. Genera el ID idéntico en base al hashCode del SKU para buscarlo en PostgreSQL
      const customerUuid = this.generateUuidFromSku(sku.value)
      const orderQuery = `
        SELECT id, customer_id, status, total_amount, currency, created_at, updated_at
        FROM orders 
        WHERE customer_id = $1
      `;
      
      const orderResult = await this.client.query<OrderRow>(orderQuery, [customerUuid]);
      
      // Si no encuentra ninguna fila con ese ID, devuelve un fallo controlado de "No Encontrado"
      if (orderResult.rows.length === 0 || !orderResult.rows[0])  {
        return fail(new NotFoundError('Order', sku.value));
      }
      
      const orderRow = orderResult.rows[0];
      
      // 2. Busca todas las líneas de artículos asociadas a la cabecera de este pedido
      const itemsQuery = `
        SELECT id, order_id, sku, quantity, unit_price, total_price, created_at
        FROM order_items 
        WHERE order_id = $1
        ORDER BY created_at ASC
      `;
      
      const itemsResult = await this.client.query<OrderItemRow>(itemsQuery, [orderRow.id]);
      
      // 3. RECONSTRUCCIÓN (Mapeo): Traduce las filas SQL puras a un objeto Entidad de Dominio
      const order = new Order(sku);

      //Nos aseguramos de leer la moneda de forma totalmente segura
      const currencyCode = orderRow ? orderRow.currency : 'EUR';
      
      for (const itemRow of itemsResult.rows) {
        const productSku = new SKU(itemRow.sku);
        const quantity = new Quantity(itemRow.quantity);
        const currency = new Currency(currencyCode);
        const unitPrice = new Money(Number(itemRow.unit_price), currency);
        
        // Añade el ítem reconstruido respetando las reglas de negocio del dominio
        order.addItem(productSku, quantity, unitPrice);
      }
      
      // Limpia la lista de eventos de dominio acumulados para que no se re-emitan al leer de la bbdd
      //order.clearEvents();
      
      // Devuelve la entidad de dominio empaquetada con éxito lista para su uso
      return ok(order);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
      return fail(new InfraError(`Failed to find order: ${errorMessage}`));
    }
  }

  // Helper interno para recuperar el cliente de base de datos (por si viene de una transacción)
  private async getConnection(): Promise<PoolClient | Client> {
    return this.client;
  }

  // Función interna para realizar el insert o el update combinado (Upsert)
  private async upsertOrder(
    connection: PoolClient | Client, 
    order: Order, 
    totalMoney: Money
  ): Promise<void> {
    const customerUuid = this.generateUuidFromSku(order.sku.value)
    
    // Consulta SQL con ON CONFLICT: Si el ID ya existe en Docker, actualiza el estado y el importe
    const upsertQuery = `
      INSERT INTO orders (id, customer_id, status, total_amount, currency, created_at, updated_at)
      VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW())
      ON CONFLICT (customer_id) 
      DO UPDATE SET 
        status = EXCLUDED.status,
        total_amount = EXCLUDED.total_amount,
        currency = EXCLUDED.currency,
        updated_at = NOW()
    `;
    
    await connection.query(upsertQuery, [
      customerUuid,
      'pending', // Estado inicial por defecto de la aplicación
      totalMoney.amount,
      totalMoney.currency.code
    ]);
  }

  // Elimina las líneas del pedido antiguas y mete las nuevas para evitar duplicar el stock comprado
  private async replaceOrderItems(
    connection: PoolClient | Client, 
    order: Order
  ): Promise<void> {
    const customerUuid = this.generateUuidFromSku(order.sku.value)
    const orderIdQuery = `
      SELECT id FROM orders WHERE customer_id = $1
    `;
    const orderIdResult = await connection.query(orderIdQuery, [customerUuid]);
    
    if (orderIdResult.rows.length === 0) {
      throw new Error('Order not found after upsert');
    }
    
    const orderId = orderIdResult.rows[0].id;
    
    // 1. Borrado de seguridad de ítems previos asignados a este identificador de pedido
    const deleteQuery = `
      DELETE FROM order_items WHERE order_id = $1
    `;
    await connection.query(deleteQuery, [orderId]);
    
    // 2. Inserción en bucle de todos los nuevos ítems del objeto de dominio
    if (order.items.length > 0) {
      const insertQuery = `
        INSERT INTO order_items (id, order_id, sku, quantity, unit_price, total_price, created_at)
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW())
      `;
      
      for (const item of order.items) {
        const calculatedTotalPrice = item.unitPrice.amount * item.quantity.value;
        await connection.query(insertQuery, [
          orderId,
          item.productSku.value,
          item.quantity.value,
          item.unitPrice.amount,
          calculatedTotalPrice
        ]);
      }
    }
  }

  // Generador criptográfico: Transforma un texto plano (SKU) en una clave UUID v4 estructurada y fija
  private generateUuidFromSku(sku: string): string {
    const hash = createHash('sha256').update(sku).digest('hex');
    // Trocea la firma SHA-256 inyectando los bits requeridos para simular un formato UUID válido
    return [
      hash.substring(0, 8),
      hash.substring(8, 12),
      '4' + hash.substring(13, 16), // Fuerza la versión 4 de UUID
      '8' + hash.substring(17, 20), // Fuerza la variante estándar de bits
      hash.substring(20, 32)
    ].join('-');
  }
}