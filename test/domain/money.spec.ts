import { test, describe, expect } from 'vitest';
import { Money } from 'src/domain/value-objects/Money.js';
import { Currency } from 'src/domain/value-objects/Currency.js';
// Importamos nuestros builders para centralizar la creación de datos de prueba
import * as b from './builders.js'; 

describe('Money Value Object', () => {

  test('should correctly add two amounts with the same currency', () => {
    // ARRANGE: Preparamos los datos usando builders. 
    // Esto evita tener que escribir 'new Money(100, new Currency("EUR"))' repetidamente.
    const amount1 = b.anyEUR(100);
    const amount2 = b.anyEUR(50);

    // ACT: Ejecutamos la lógica de negocio (suma de dinero)
    const result = amount1.add(amount2);

    // ASSERT: Verificamos el resultado. 
    // Usamos el mismo builder para definir el valor esperado.
    expect(result).toEqual(b.anyEUR(150));
  });

  test('should throw an error when adding different currencies', () => {
    // ARRANGE: Definimos una moneda base y una moneda diferente para causar el conflicto
    const amountEUR = b.anyEUR(100);
    const amountUSD = new Money(50, new Currency('USD')); 

    // ACT & ASSERT: Confirmamos que el dominio protege la integridad 
    // lanzando una excepción al intentar sumar divisas distintas.
    expect(() => amountEUR.add(amountUSD)).toThrow();
  });
});