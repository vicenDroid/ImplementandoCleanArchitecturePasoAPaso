import { z } from 'zod';
import 'dotenv/config';

// Schema de validacion  para variables de entorno
const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.string().transform(val => parseInt(val, 10)).pipe(z.number().min(1).max(65535)).default('3000'),
    
    // Database configuracion
    DATABASE_TYPE: z.enum(['memory','postgres']).default('memory'),
    DATABASE_URL: z.string().url().optional(),

    // Logging configuration
    LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
    LOG_PRETTY: z.string().transform(val => val === 'true').pipe(z.boolean()).default('true'),
    
    // Optional configuration
    OUTBOX_WORKER_INTERVAL_MS: z.string().transform(val => parseInt(val, 10)).pipe(z.number()).default('1000'),
}).refine(data => {
    // if DATABASE_TYPE is postgres, DATABASE_URL is required
    if(data.DATABASE_TYPE === 'postgres' && !data.DATABASE_URL){
        return false;
    }
    return true;
},{
    message: 'DATABASE_URL is required when DATABASE_TYPE is postgres',
    path: ['DATABASE_URL']
});
// Tipo derivado del schema
export type Config = z.infer<typeof envSchema>;

// Funcion para validar y obtener la configuracion
function validateConfig(): Config {
    try {
        // Intenta analizar y validar las variables de entorno actuales
        return envSchema.parse(process.env);
    } catch (error) {
        // Si el error proviene de una mala configuración detectada por Zod
        if (error instanceof z.ZodError) {
            const errorMessages = error.errors.map(err => {
                const path = err.path.join('.'); // Une las rutas de los fallos con puntos
                return `${path}: ${err.message}`; // Devuelve el texto estructurado del error
            });
            
            console.error('❌ Invalid environment configuration:');
            // Muestra en la terminal cada uno de los errores limpiamente en una línea
            errorMessages.forEach(msg => console.error(`  - ${msg}`));
            
            process.exit(1); // Detiene la ejecución del programa inmediatamente
        }
        
        throw error; // Si es otro tipo de error desconocido, lo vuelve a lanzar
    }
}

// Exportamos de forma centralizada el objeto resultante ya verificado
export const config = validateConfig();

// Recupera la URL de conexión. Si no existe, lanza un aviso preventivo
export function getDatabaseUrl(cfg: Config = config): string {
    if (!cfg.DATABASE_URL) {
        throw new Error('DATABASE_URL is not configured');
    }
    return cfg.DATABASE_URL;
}

// Helper para saber si el entorno actual de ejecución es desarrollo
export function isDevelopment(cfg: Config = config): boolean {
    return cfg.NODE_ENV === 'development';
}

// Helper para saber si el entorno actual de ejecución es producción
export function isProduction(cfg: Config = config): boolean {
    return cfg.NODE_ENV === 'production';
}

// Helper para saber si el entorno actual de ejecución es de pruebas (test)
export function isTest(cfg: Config = config): boolean {
    return cfg.NODE_ENV === 'test';
}

// Helper arquitectónico para validar si se trabajará con almacenamiento en memoria RAM
export function useInMemoryDatabase(cfg: Config = config): boolean {
    return cfg.DATABASE_TYPE === 'memory';
}

// Helper arquitectónico para validar si se conectará a la base de datos PostgreSQL
export function usePostgresDatabase(cfg: Config = config): boolean {
    return cfg.DATABASE_TYPE === 'postgres';
}