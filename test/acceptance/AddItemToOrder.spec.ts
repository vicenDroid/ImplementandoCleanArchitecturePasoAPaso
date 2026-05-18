import { test, describe } from 'vitest';
import assert from 'node:assert';
import { Order } from 'src/domain/entities/Order.js';
import { SKU } from 'src/domain/value-objects/SKU.js';
import { Quantity } from 'src/domain/value-objects/Quantity.js';
import { Money } from 'src/domain/value-objects/Money.js';
import { Currency } from 'src/domain/value-objects/Currency.js';

// ============================================================================
// ADAPTADORES SIMULADOS (MOCKS DE INFRAESTRUCTURA)
// ============================================================================

// 1. Adaptador para el Repositorio de Pedidos en Memoria
class InMemoryOrderRepository {
  private orders: Map<string, Order> = new Map();

  // Forzamos el ID temporalmente como texto o usamos un casteo para evitar fallos de tipado
  async save(id: string, order: Order): Promise<void> {
    this.orders.set(id, order);
  }

  async findById(id: string): Promise<Order | undefined> {
    return this.orders.get(id);
  }
}

// 2. Adaptador para el Servicio de Precios (Verifica si el precio es correcto/vigente)
class MockPricingService {
  async validatePrice(_productSku: SKU, price: Money): Promise<boolean> {
    return price.amount > 0;
  }
}

// 3. Adaptador para el Bus de Eventos (Se encarga de publicar los eventos de dominio)
class MockEventBus {
  public publishedEvents: any[] = [];

  async publish(events: any[]): Promise<void> {
    this.publishedEvents.push(...events);
  }
}

// ============================================================================
// CASO DE USO (LA APLICACIÓN QUE COORDINA LOS ADAPTADORES)
// ============================================================================
class AddItemToOrderUseCase {
  constructor(
    private orderRepository: InMemoryOrderRepository,
    private pricingService: MockPricingService,
    private eventBus: MockEventBus
  ) {}

  async execute(orderId: string, productSkuStr: string, qtyNum: number, amountNum: number, currencyStr: string): Promise<void> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) throw new Error('Order not found');

    const productSku = new SKU(productSkuStr);
    const quantity = new Quantity(qtyNum);
    const price = new Money(amountNum, new Currency(currencyStr));

    const isPriceValid = await this.pricingService.validatePrice(productSku, price);
    if (!isPriceValid) throw new Error('Invalid product price');

    order.addItem(productSku, quantity, price);

    // Guardamos pasando el ID externo de forma explícita
    await this.orderRepository.save(orderId, order);

    // Accedemos a los eventos usando un casteo seguro para evitar restricciones de TypeScript
    const domainEvents = (order as any).events || [];
    await this.eventBus.publish(domainEvents);
  }
}

// ============================================================================
// SUITE DE TEST DE ACEPTACIÓN CON INTEGRACIÓN (GIVEN-WHEN-THEN)
// ============================================================================
describe('AddItemToOrder Integration Acceptance Suite', () => {

  test('should successfully integrate order repository, pricing service, and event bus', async () => {
    
    // GIVEN: Dado un escenario inicial con todos los adaptadores y un pedido existente
    const orderRepository = new InMemoryOrderRepository();
    const pricingService = new MockPricingService();
    const eventBus = new MockEventBus();

    const useCase = new AddItemToOrderUseCase(orderRepository, pricingService, eventBus);

    const orderSku = new SKU('ORDER-999');
    const existingOrder = new Order(orderSku);
    const orderId = 'ORDER-999'; // Usamos el string del SKU directamente como ID para el mapa
    
    // Dejamos el sistema preparado en su estado inicial
    await orderRepository.save(orderId, existingOrder);


    // WHEN: Cuando se ejecuta la acción principal del caso de uso
    await useCase.execute(orderId, 'KEYBOARD-MECHANICAL', 1, 85, 'EUR');


    // THEN: Entonces verificamos que el repositorio y el bus de eventos reaccionen correctamente
    const savedOrder = await orderRepository.findById(orderId);
    assert.ok(savedOrder, 'El repositorio debería devolver el pedido modificado');
    
    // Comprobamos de forma segura la longitud de los ítems internos
    const orderItems = (savedOrder as any).items || [];
    assert.strictEqual(orderItems.length, 1, 'El pedido debería tener un ítem guardado');
    assert.strictEqual(orderItems[0]?.productSku?.value, 'KEYBOARD-MECHANICAL');

    // Comprobamos la integración del EventBus
    assert.ok(eventBus.publishedEvents.length >= 1, 'El bus debería haber recibido eventos');
  });
}); 