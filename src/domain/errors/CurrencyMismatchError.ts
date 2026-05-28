
export class CurrencyMismatchError extends Error {
  constructor() {
    super("La moneda del ítem no coincide con la del pedido");
    this.name = "CurrencyMismatchError";
  }
}