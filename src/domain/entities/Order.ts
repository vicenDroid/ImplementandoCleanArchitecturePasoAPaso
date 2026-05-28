// src/domain/entities/Order.ts
// Order entity representing a customer's order, containing multiple items and associated 
// domain events.
import { SKU } from '../value-objects/SKU.js';
//import { Currency } from '../value-objects/Currency.js';
import { Money } from '../value-objects/Money.js';
import { Quantity } from '../value-objects/Quantity.js';
import { DomainEvent } from '../events/DomainEvent.js';
import { OrderCreated } from '../events/OrderCreated.js';
import { ItemAddedToOrder } from '../events/ItemAddedToOrder.js';
import { CurrencyMismatchError } from "../errors/CurrencyMismatchError.js";


export class OrderItem {
    constructor(
        public readonly productSku: SKU,
        public readonly quantity: Quantity,
        public readonly unitPrice: Money
    ) {}
}
export class Order {
    private readonly _sku: SKU;
    private readonly _items: Map<string, OrderItem> = new Map();
    private readonly _events: DomainEvent[] = [];

    constructor(sku: SKU) {
        this._sku = sku;
        this._events.push(new OrderCreated(sku.value));
    }

    get sku(): SKU { return this._sku; }
    get items(): OrderItem[] { return Array.from(this._items.values()); }
    get events(): DomainEvent[] { return this._events; }

    addItem(productSku: SKU, quantity: Quantity, unitPrice: Money): void {
        const existingItem = this._items.get(productSku.value);

        if (existingItem) {
            // Regla de negocio: Si el producto ya existe, el precio debe ser el mismo
            if (!existingItem.unitPrice.equals(unitPrice)) {
                throw new CurrencyMismatchError();
                //throw new Error('Cannot add item with different unit price');
            }
            // Aquí se actualizaría la cantidad si el profesor lo pide más adelante
        } else {
            this._items.set(productSku.value, new OrderItem(productSku, quantity, unitPrice));
        }

        this._events.push(new ItemAddedToOrder(
            this._sku.value,
            productSku.value,
            quantity.value,
            unitPrice.amount,
            unitPrice.currency.code
        ));
    }

    getTotalByCurrency(): Map<string, Money> {
        const totals = new Map<string, Money>();

        for (const item of this._items.values()) {
            const currencyCode = item.unitPrice.currency.code;
            const itemTotal = item.unitPrice.multiply(item.quantity.value);
            const currentTotal = totals.get(currencyCode);
            if (currentTotal) {
                totals.set(currencyCode, currentTotal.add(itemTotal));
            } else {
                totals.set(currencyCode, itemTotal);
            }
        }
        return totals;
    }    
}