import { test, describe } from 'vitest';
import assert from 'node:assert';
import { Order } from 'src/domain/entities/Order.js';
import { SKU } from 'src/domain/value-objects/SKU.js';
import { Quantity } from 'src/domain/value-objects/Quantity.js';
import { Money } from 'src/domain/value-objects/Money.js';
import { Currency } from 'src/domain/value-objects/Currency.js';

describe('Order Domain Entity', () => {

    test('should successfully add an item and dispatch the corresponding events', () => {
    // 1. COMPROBAR CREACIÓN CON SKU Y EVENTO 'OrderCreated'
    const orderSku = new SKU('ORDER-001');
    const order = new Order(orderSku);

    // Verificamos que al crearse ya dispara el primer evento de creación
    assert.strictEqual(order.events.length, 1);
    assert.strictEqual(order.events[0]!.constructor.name, 'OrderCreated');

    // 2. AÑADIR ITEMS AL PEDIDO
    const productSku = new SKU('LAPTOP-001');
    const quantity = new Quantity(2);
    const euro = new Currency('EUR');
    const price = new Money(1200, euro);

    order.addItem(productSku, quantity, price);

    const firstItem = order.items[0];
    assert.ok(firstItem); 
    assert.strictEqual(firstItem.productSku.value, 'LAPTOP-001');
    assert.strictEqual(firstItem.quantity.value, 2);

    // 3. COMPROBAR EVENTO 'ItemAddedToOrder'
    // Ahora debería haber 2 eventos en total (el de creación + el de añadir item)
    assert.strictEqual(order.events.length, 2);
    assert.strictEqual(order.events[1]!.constructor.name, 'ItemAddedToOrder');
  });

  test('should throw an error when trying to add the same product with a different unit price', () => {
    const order = new Order(new SKU('ORDER-001'));
    const productSku = new SKU('LAPTOP-001');
    const euro = new Currency('EUR');

    order.addItem(productSku, new Quantity(1), new Money(1200, euro));

    assert.throws(() => {
      order.addItem(productSku, new Quantity(1), new Money(1300, euro));
    });
  });
});