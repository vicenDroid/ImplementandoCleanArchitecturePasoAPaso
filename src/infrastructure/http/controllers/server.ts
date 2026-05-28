/**
 * Configura y construye la instancia del servidor Fastify.
 * Une la infraestructura (Fastify) con la lógica de negocio (Casos de Uso).
 * @param dependencies Contenedor con las dependencias necesarias para los controladores.
 */
import fastify from "fastify";
import { ServerDependencies } from "src/application/ports/ServerDependencies.js";
import { OrderController } from "./OrdersControler.js";

export async function buildServer(dependencies: ServerDependencies){
    // Desactivamos el logger interno por defecto de Fastify para centralizarlo con el nuestro
    const server = fastify({
        logger: false
    })
    
    // Capa de presentación: Inicializamos el controlador pasándole el logger de las dependencias
    const orderController = new OrderController(
        dependencies.createOrder,
        dependencies.addItemToOrder,
        dependencies.logger
    );
    
    // Registramos las rutas de la aplicación en el servidor HTTP
    await orderController.registerRoutes(server);
    
    // Endpoint de verificación de salud del sistema (Health check)
    // Permite confirmar que el software del servidor está respondiendo correctamente
    server.get('/health', async ()=>{
        dependencies.logger.info('Health check endpoint called');
        return { status: 'ok', timestamp: new Date().toISOString() }
    })
    
    return server;
}