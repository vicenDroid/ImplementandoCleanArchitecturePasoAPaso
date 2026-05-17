//Este objeto asegura que nunca tengamos un precio negativo y que siempre tenga una 
// moneda válida
import { Currency } from 'src/domain/value-objects/Currency.js';

export class Money {
  private readonly _amount: number;
  private readonly _currency: Currency;

  constructor(amount: number, currency: Currency) {
    if (amount < 0) {
      throw new Error('El monto no puede ser negativo');
    }
    if (!Number.isFinite(amount)) {
      throw new Error('El monto debe ser un número finito');
    }
    this._amount = Math.round(amount * 100) / 100; // Redondear a 2 decimales
    this._currency = currency;  
  }

  get amount(): number {
    return this._amount;
  }

  get currency(): Currency {
    return this._currency;
  }

  add(other: Money): Money {
    if (this._currency.code !== other.currency.code) {
      throw new Error('No se pueden sumar montos con diferentes monedas');
    }
    return new Money(this._amount + other.amount, this._currency);
  }

  multiply(factor: number): Money {
    if(factor < 0){
      throw new Error('El factor de multiplicación no puede ser negativo');
    }
    return new Money(this._amount * factor, this._currency);
  }

  equals(other: Money): boolean {
    return this._amount === other.amount && this._currency.equals(other.currency);
  }
}