/**
 * Función principal de entrada (Entry Point).
 * Su misión es orquestar el arranque del sistema uniendo el contenedor y el servidor.
 */
import { buildServer } from "src/infrastructure/http/controllers/server.js";
import { buildContainer } from "src/composition/container.js";

async function main(){
    try{
        //Composition Root - Dependency injection
        /**
         * 1. RAÍZ DE COMPOSICIÓN (Composition Root)
         * Llamamos al contenedor para que instancie todos los repositorios,
         * servicios y casos de uso, inyectándolos entre sí.
         */
        const dependencies = buildContainer();

        // Build server with injected dependencies
        /**
         * 2. CONSTRUCCIÓN DEL SERVIDOR
         * Creamos la instancia de Fastify pasando el objeto de dependencias.
         * El servidor no sabe cómo se crearon, solo que cumplen el 'contrato'.
         */
        const server = await buildServer(dependencies);

        /**
         * 3. CONFIGURACIÓN DE ENTORNO
         * Usamos variables de entorno para que el servidor sea flexible.
         * Si no existen, usamos valores por defecto (0.0.0.0 y 3000).
         */
        const host = process.env.HOST || '0.0.0.0';
        const port = parseInt(process.env.PORT || '3000', 10);

        /**
         * 4. PUESTA EN MARCHA
         * El servidor empieza a escuchar peticiones en la red.
         */
        await server.listen({host, port});

        // Logs informativos para saber que todo ha ido bien
        console.log(`Server running at http:// ${host}:${port}`);
        console.log(`Health check: http: ${host}:${port}/health`);
        console.log(`Orders API: http: ${host}:${port}/orders`);

    }   catch (error){
        /**
         * CONTROL DE ERRORES CRÍTICOS
         * Si el contenedor falla o el puerto está ocupado, detenemos el proceso.
         */
        console.error('Error starting server:', error);
        process.exit(1);    
    }
}

// Handle gracefull shutdown
/**
 * CIERRE GRACIOSO (Graceful Shutdown)
 * Escuchamos las señales del sistema para apagar el servidor limpiamente.
 */
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    process.exit(0);
});
// Ejecución con captura de errores no controlados
main().catch(error => {
    console.error('Unhandled error in main: ',error);
    process.exit(1);
}); 