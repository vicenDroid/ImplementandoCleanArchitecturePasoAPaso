// 1. ARRANGEMENT (Preparar el escenario)
// - Mockear orderRepository: findBySKU debe devolver una orden válida.
// - Mockear pricingService: getPrice debe devolver un precio (ej. 10).
// - Mockear eventBus: publish debe ser un vi.fn().

// 2. ACT (Ejecutar)
// - Preparar el DTO con datos de prueba.
// - Llamar al caso de uso: const result = await addItemToOrder.execute(dto);

// 3. ASSERT (Verificar)
// - expect(result.isSuccess).toBe(true);
// - expect(mockOrderRepository.save).toHaveBeenCalled();
// - expect(mockEventBus.publish).toHaveBeenCalled();

import { describe, test, expect, vi } from 'vitest';
import { AddItemToOrder } from '../../../src/application/use-cases/AddItemToOrder.js';
import { ok } from '../../../src/shared/Result.js';

describe('AddItemToOrder Use Case', () => {
  test('should add a new item to an existing order successfully', async () => {
    // 1. ARRANGEMENT
    
    // Aquí simulamos la orden que el repositorio encontrará
    const mockOrder = {
        addItem: vi.fn(),
        events: []
    };

    const mockOrderRepository = {
        findBySKU: vi.fn().mockResolvedValue(ok(mockOrder)),
        save: vi.fn().mockResolvedValue(ok(undefined))
    };

    const mockPricingService = {
        getPrice: vi.fn().mockResolvedValue(ok(10)) // Simulamos precio de 10
    };

    const mockEventBus = {
        publish: vi.fn().mockResolvedValue(ok(undefined))
    };

    // Inyectamos los mocks en el Caso de Uso
    const useCase = new AddItemToOrder(
        mockOrderRepository as any, 
        mockPricingService as any, 
        mockEventBus as any
    );

    // 2. ACT
    const dto = { orderSku: 'ORD-123', productSku: 'PROD-99', quantity: 1 };
    const result = await useCase.execute(dto);

    // 3. ASSERT
    expect(result.isSuccess).toBe(true);
    expect(mockOrder.addItem).toHaveBeenCalled();
    expect(mockOrderRepository.save).toHaveBeenCalledWith(mockOrder);
    expect(mockEventBus.publish).toHaveBeenCalled();
  });
});