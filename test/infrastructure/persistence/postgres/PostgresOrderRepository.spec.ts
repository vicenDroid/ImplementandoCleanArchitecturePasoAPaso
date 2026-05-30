import { test, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { Client } from 'pg';
import { PostgresOrderRepository } from '../../../../src/infrastructure/persistence/postgres/PostgresOrderRepository.js';
import { Order } from '../../../../src/domain/entities/Order.js';
import { SKU } from '../../../../src/domain/value-objects/SKU.js';
import { Money } from '../../../../src/domain/value-objects/Money.js';
import { Currency } from '../../../../src/domain/value-objects/Currency.js';
import { Quantity } from '../../../../src/domain/value-objects/Quantity.js';

// Configuración de la conexión (asegúrate de que coincida con tu docker-compose)
const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'orders',
});

beforeAll(async () => {
  await client.connect();
});

afterAll(async () => {
  await client.end();
});

beforeEach(async () => {
  // Limpieza rápida para que cada test empiece de cero
  await client.query('DELETE FROM order_items');
  await client.query('DELETE FROM orders');
});

test('should save and find an order in postgres', async () => {
  // 1. Arrange: Preparamos el repositorio y la entidad
  const repository = new PostgresOrderRepository(client);
  const sku = new SKU('order-123');
  const order = new Order(sku);
  order.addItem(new SKU('prod-1'), new Quantity(2), new Money(10, new Currency('EUR')));

  // 2. Act: Guardamos
  await repository.save(order);

  // 3. Assert: Buscamos y verificamos
  const result = await repository.findBySKU(sku);
  
    console.log("Resultado del repositorio:", result);

  const savedOrder = (result as any).value;
    expect(savedOrder.sku.value.toLowerCase()).toBe('order-123');
    expect(savedOrder.items.length).toBe(1);
    expect(savedOrder.items[0].productSku.value.toLowerCase()).toBe('prod-1');
    expect(savedOrder.items[0].quantity.value).toBe(2);
    expect(savedOrder.items[0].unitPrice.amount).toBe(10);
    expect(savedOrder.items[0].unitPrice.currency.code).toBe('EUR');
});