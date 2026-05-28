import { test, describe, expect } from 'vitest';
import { SKU } from 'src/domain/value-objects/SKU.js';
import { ValidationError } from 'src/application/errors.js';

describe('SKU Value Object', () => {

  test('should create a valid SKU and normalize it', () => {
    // ARRANGE: Un código que cumple las reglas pero tiene espacios o minúsculas
    const input = '  prod-123  ';
    
    // ACT:
    const sku = new SKU(input);
    
    // ASSERT: Debe estar normalizado a 'PROD-123'
    expect(sku.value).toBe('PROD-123');
  });

  test('should throw error if SKU is empty', () => {
    // ASSERT: Verificamos que lanza el error esperado si el string está vacío
    expect(() => new SKU('')).toThrow(ValidationError);
    expect(() => new SKU('')).toThrow('SKU cannot be empty');
  });

  test('should throw error if SKU is too short', () => {
    // ASSERT: Verificamos que lanza error si tiene menos de 3 caracteres
    expect(() => new SKU('ab')).toThrow('SKU must be at least 3 characters long');
  });
});