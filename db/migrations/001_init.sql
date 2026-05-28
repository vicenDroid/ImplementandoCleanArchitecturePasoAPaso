-- =============================================================================
-- MIGRACIÓN 001: Inicialización de la Base de Datos de Pedidos (Clean Architecture)
-- =============================================================================

-- 1. TABLA PRINCIPAL: ORDERS (Pedidos)
-- Guarda los datos generales de cada compra efectuada.
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY,                          -- Identificador único universal del pedido
    customer_id UUID NOT NULL UNIQUE,             -- ID del cliente. Al ser UNIQUE, indica que un cliente solo puede tener un pedido activo en el sistema
    total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,-- Importe total acumulado del pedido con dos decimales
    currency VARCHAR(10), -- Codigo de divisa (euro, dolar, etc)
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',-- Estado del ciclo de vida (PENDING, PAID, SHIPPED, CANCELLED)
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(), -- Fecha y hora exacta de creación con zona horaria automática
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()  -- Fecha y hora de la última modificación realizada
);

-- 2. TABLA DETALLE: ORDER_ITEMS (Líneas o productos del pedido)
-- Guarda cada uno de los artículos comprados de forma desglosada dentro de un pedido.
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY,                          -- ID único para identificar esta línea de producto concreta
    order_id UUID NOT NULL,                       -- Vinculación obligatoria con el ID de la tabla orders
    sku VARCHAR(100) NOT NULL,                    -- Código único de inventario del producto (Stock Keeping Unit)
    quantity INT NOT NULL,                        -- Número de unidades compradas de este artículo
    unit_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00, -- Precio de una sola unidad del producto
    total_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00, -- Precio total de la línea (unidades multiplicadas por el precio unitario)
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(), -- Fecha de registro del artículo en el pedido
    
    -- RESTRICCIONES DE SEGURIDAD (Constraints)
    CONSTRAINT fk_order_items_order_id FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE, -- Si se borra un pedido, se eliminan automáticamente todos sus artículos asignados
    CONSTRAINT chk_quantity CHECK (quantity > 0), -- Garantiza de forma estricta que no se compren cantidades menores o iguales a cero
    CONSTRAINT chk_unit_price CHECK (unit_price >= 0), -- Evita errores impidiendo que el precio por unidad sea negativo
    CONSTRAINT chk_total_price CHECK (total_price >= 0) -- Evita errores impidiendo que el importe total de la línea sea negativo
);

-- 3. TABLA ARQUITECTÓNICA: OUTBOX (Bandeja de salida de eventos)
-- Guarda los eventos del sistema de forma local antes de notificarlos a otros servicios independientes.
CREATE TABLE IF NOT EXISTS outbox (
    id UUID PRIMARY KEY,                          -- ID único global de identificación del evento de negocio
    aggregate_type VARCHAR(255) NOT NULL,         -- Tipo de entidad principal afectada (por ejemplo, 'Order')
    aggregate_id UUID NOT NULL,                   -- ID del registro concreto que generó el evento (order_id)
    event_type VARCHAR(255) NOT NULL,             -- Nombre identificativo de la acción (por ejemplo, 'OrderCreated')
    event_data JSONB NOT NULL,                    -- Contenido de los datos del evento guardados en formato JSON binario ultra rápido
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- Fecha de registro del evento en la bandeja de salida
    published_at TIMESTAMP WITH TIME ZONE         -- Fecha en la que el evento se envió con éxito. Si permanece en NULL, significa que está pendiente
);

-- =============================================================================
-- ÍNDICES (Aceleran las búsquedas recurrentes en el sistema)
-- =============================================================================

-- Índices para la tabla order_items
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id); -- Optimiza la búsqueda de todos los artículos pertenecientes a un pedido concreto
CREATE INDEX IF NOT EXISTS idx_order_items_sku ON order_items(sku); -- Acelera las búsquedas de líneas de pedido basándose en el código de producto

-- Índices para la tabla orders
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id); -- Optimiza la localización inmediata del pedido asociado a un cliente específico
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status); -- Agiliza los filtros rápidos por estados de los pedidos (ej. ver todos los PENDING)
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at); -- Acelera las ordenaciones automáticas por fecha de creación

-- Índices para la tabla outbox
CREATE INDEX IF NOT EXISTS idx_outbox_aggregate_id ON outbox(aggregate_id); -- Agiliza la búsqueda de eventos vinculados a una entidad específica
CREATE INDEX IF NOT EXISTS idx_outbox_event_type ON outbox(event_type); -- Optimiza los filtros rápidos según el tipo de acción registrada
CREATE INDEX IF NOT EXISTS idx_outbox_created_at ON outbox(created_at); -- Permite ordenar cronológicamente los eventos con rapidez
CREATE INDEX IF NOT EXISTS idx_outbox_aggregate_type ON outbox(aggregate_type); -- Faciliza la agrupación rápida de eventos según la entidad afectada

-- ÍNDICE PARCIAL ESTRATÉGICO
-- Indexa de forma exclusiva los registros en los que published_at no se ha definido.
-- De esta forma, el proceso encargado de despachar eventos localiza los pendientes al instante sin examinar toda la tabla.
CREATE INDEX IF NOT EXISTS idx_outbox_untriggered 
ON outbox(created_at) 
WHERE published_at IS NULL;

-- =============================================================================
-- TRIGGERS (Procesos automatizados en segundo plano dentro de la base de datos)
-- =============================================================================

-- Función interna encargada de actualizar la fecha de modificación al momento exacto actual
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();                       -- Asigna de manera forzosa la fecha y hora del sistema al campo updated_at
    RETURN NEW;                                   -- Retorna el registro modificado listo para guardarse
END;
$$ LANGUAGE plpgsql;

-- Configuración del disparador que ejecuta la función superior de forma automática en cada UPDATE de la tabla orders
CREATE TRIGGER trigger_update_orders_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();