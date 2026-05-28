import { test, describe } from 'vitest';
import assert from 'node:assert';
import { Order } from 'src/domain/entities/Order.js';
import * as b from './builders.js'; // Importamos todos los builders con alias 'b'

describe('Order Domain Entity', () => {

  test('should successfully add an item and dispatch the corresponding events', () => {
    // ARRANGE: Preparación del escenario usando builders
    const order = new Order(b.anySKU('ORDER-001'));

    // ACT: Ejecución de la acción de negocio
    order.addItem(b.anySKU('LAPTOP-001'), b.anyQty(2), b.anyEUR(1200));

    // ASSERT: Verificación del estado y eventos (Comportamiento)
    assert.strictEqual(order.events.length, 2);
    assert.strictEqual(order.events[1]!.constructor.name, 'ItemAddedToOrder');
  });

  test('should throw an error when trying to add the same product with a different unit price', () => {
    // ARRANGE
    const order = new Order(b.anySKU('ORDER-001'));
    const sameSku = b.anySKU('LAPTOP-001');

    // Inicializamos con un precio
    order.addItem(sameSku, b.anyQty(1), b.anyEUR(1200));

    // ACT & ASSERT: Verificamos que se lanza el error ante la regla violada
    assert.throws(() => {
      // Intentamos añadir el mismo SKU con distinto precio
      order.addItem(sameSku, b.anyQty(1), b.anyEUR(1300));
    });
  });
});