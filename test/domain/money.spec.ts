import { test, describe } from 'vitest';
import assert from 'node:assert';
import { Money } from '../../src/domain/value-objects/Money.js';

describe('Money Domain Vector', () => {
  
  test('should create a valid Money instance and round to 2 decimals', () => {
    // Pasamos un objeto simulado que TypeScript acepte como Currency
    const money = new Money(10.556, { code: 'EUR' } as any);
    assert.strictEqual(money.amount, 10.56);
  });

  test('should throw an error if amount is negative', () => {
    assert.throws(() => {
      new Money(-5, { code: 'EUR' } as any);
    }, /El monto no puede ser negativo/); // Ajustado a tus textos en español
  });

  test('should throw an error if amount is infinite', () => {
    assert.throws(() => {
      new Money(Infinity, { code: 'EUR' } as any);
    }, /El monto debe ser un número finito/);
  });

  test('should throw an error if amount is NaN', () => {
    assert.throws(() => {
      new Money(NaN, { code: 'EUR' } as any);
    }, /El monto debe ser un número finito/);
  });

});