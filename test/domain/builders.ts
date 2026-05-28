import { SKU } from 'src/domain/value-objects/SKU.js';
import { Quantity } from 'src/domain/value-objects/Quantity.js';
import { Money } from 'src/domain/value-objects/Money.js';
import { Currency } from 'src/domain/value-objects/Currency.js';

// Usamos valores por defecto para reducir el "ruido" en los tests
export const anySKU = (v = 'ORDER-001') => new SKU(v);
export const anyQty = (n = 1) => new Quantity(n);
export const anyEUR = (amount = 100) => new Money(amount, new Currency('EUR'));