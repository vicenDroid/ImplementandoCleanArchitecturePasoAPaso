// src/domain/value-objects/SKU.ts
// SKU (Stock Keeping Unit) value object representing a unique identifier for products 
// in the inventory. This class ensures that the SKU is valid and provides methods for
// comparison and retrieval of the SKU value.
import { ValidationError } from '../../application/errors.js';

export class SKU {
    private readonly _value: string;

    constructor(value: string) {
    // Forzamos que value sea un string antes de usar .trim()
    const strValue = String(value || '');

    if (!strValue || strValue.trim() === '') {
        throw new ValidationError('SKU cannot be empty');
    }
    if (strValue.trim().length < 3) {
        throw new ValidationError('SKU must be at least 3 characters long');
    }
    this._value = strValue.trim().toUpperCase();
}

    get value(): string {
        return this._value;
    }

    equals(other: SKU): boolean {
        return this._value === other.value;
    }
}