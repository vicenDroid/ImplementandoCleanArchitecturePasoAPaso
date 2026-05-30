import { describe, test, expect, vi } from 'vitest';
import { CreateOrder } from '../../../src/application/use-cases/CreateOrder.js';
//import { fail } from '../../../src/shared/Result.js';

describe('CreateOrder Use Case', () => {
  test('should create a new order successfully', async () => {
    // 1. ARRANGEMENT: Mockeamos las dependencias necesarias
    const mockOrderRepository = {
  // Asegúrate de que TODOS los métodos del mock devuelvan un objeto Result
  save: vi.fn().mockResolvedValue({ isSuccess: true, value: undefined }),
  
  // Simulamos el caso donde NO existe la orden (es lo que necesitamos para crearla)
  findBySKU: vi.fn().mockResolvedValue({ 
    isSuccess: false, 
    error: { type: 'NOT_FOUND_ERROR' } 
  })
};

      const mockEventBus = {
          publish: vi.fn().mockResolvedValue({ isSuccess: true, value: undefined })
      };
    
    
    const useCase = new CreateOrder(mockOrderRepository as any, mockEventBus as any);

    // 2. ACT
    const dto = { orderSku: 'ORD-001'};
    const result = await useCase.execute(dto);

    if (!result.isSuccess) {
    console.log('DEBUG ERROR:', result.error);
}
    // 3. ASSERT: Verificamos el flujo
    expect(result.isSuccess).toBe(true);
    expect(mockOrderRepository.save).toHaveBeenCalled();
    expect(mockEventBus.publish).toHaveBeenCalled();
  });
});