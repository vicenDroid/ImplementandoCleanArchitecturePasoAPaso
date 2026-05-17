//Aquí controlamos que nadie pida 0 productos o cantidades negativas.
export class Quantity {
    private readonly _value: number;
    
    constructor(value: number) {
        if (value <= 0) {
            throw new Error('La cantidad debe ser mayor que cero');
        }
        if (!Number.isInteger(value)) {
            throw new Error('La cantidad debe ser un número entero');
        }
        this._value = value;
    }

    get value(): number {
        return this._value;
    }

    add(other: Quantity): Quantity {
        return new Quantity(this._value + other.value);
    }

    equals(other: Quantity): boolean {
        return this._value === other.value;
    }
}