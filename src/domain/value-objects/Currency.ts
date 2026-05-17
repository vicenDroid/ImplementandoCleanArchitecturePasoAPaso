/**
 * Value Object: Currency
 * Garantiza que las monedas utilizadas en el sistema sean válidas y consistentes.
 * Sigue el patrón de "Inmutabilidad": una vez creada, no cambia.
 */
export class Currency {
    private static readonly VALID_CURRENCIES = ['EUR', 'USD', 'GBP', 'JPY', 'CAD', 'AUD', 'MXN'];
    private readonly _code: string;
    /**
     * @param code Código ISO de la moneda.
     * @throws Error si la moneda no está soportada.
     */
    constructor(code: string) {
        
        if (!code || !Currency.VALID_CURRENCIES.includes(code.toUpperCase())) {
            throw new Error(`Invalid currency code: ${code}. 
                Valid currencies: ${Currency.VALID_CURRENCIES.join(', ')}`);
        }
        this._code = code.toUpperCase();
    }
/** Obtiene el código de la moneda */
    get code(): string {
        return this._code;
    }
/** Compara si dos objetos Currency representan la misma moneda */
    equals(other: Currency): boolean {
        return this._code === other._code;
    }
}