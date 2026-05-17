/**
 * Configura y construye la instancia del servidor Fastify.
 * Une la infraestructura (Fastify) con la lógica de negocio (Casos de Uso).
 * @param dependencies Contenedor con las dependencias necesarias para los controladores.
 */
import fastify from "fastify";
import { ServerDependencies } from "src/application/ports/ServerDependencies.js";
import { OrderController } from "./OrdersControler.js";

export async function buildServer(dependencies: ServerDependencies){
    const server = fastify({
        logger: true
    })
    //Presentacion layer (COntrollers)
    // Inyectamos los casos de uso que vienen de las dependencias
    const orderController = new OrderController(
        dependencies.createOrder,
        dependencies.addItemToOrder
    );
    //Register routes
    await orderController.registerRoutes(server);
    //Health check endpoint
    //Permite confirmar que el software del servidor está respondiendo
    server.get('/health', async ()=>{
        return { status: 'ok', timestamp: new Date().toISOString() }
    })
    return server;
}   
