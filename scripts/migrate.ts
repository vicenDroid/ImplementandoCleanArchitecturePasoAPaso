import { Client } from 'pg';
import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config, getDatabaseUrl } from "../src/composition/config.js";
import process from 'process';

// Configuración necesaria para averiguar las rutas de carpetas en Node.js moderno
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigrations() {
    // Se conecta usando la URL centralizada que ya lee nuestro archivo de configuración
    const client = new Client({
        connectionString: getDatabaseUrl(),
    });

    try {
        await client.connect();
        console.log("Connected to database");

        // Create migrations table if it doesn't exist in Docker
        // Sirve como un libro de registro para no repetir trabajos ya hechos.
        await client.query(`CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
    `);

        //Hacemos la consulta real para saber qué se ejecutó en el pasado
        const executedResult = await client.query('SELECT filename FROM migrations');
        
        // Guardamos los nombres de los archivos ya aplicados en un Set rápido de buscar
        const executedMigrations = new Set(executedResult.rows.map(row => row.filename));

        // 2. Listado oficial de archivos SQL que queremos procesar
        const migrationsFiles = ["001_init.sql"];

        for (const filename of migrationsFiles) {
            // Si el archivo ya está en el libro de registro, se lo salta
            if (executedMigrations.has(filename)) {
                console.log(`⏭️ Saltando migración ya ejecutada anteriormente: ${filename}`);
                continue;
            }

        console.log("Running migration", filename);

        const migrationPath = join(__dirname,"..", "db", "migrations", filename);
        const migrationSql = await readFile(migrationPath, "utf8");
        
        // Iniciamos una transaccion. Si algo falla dentro de sql, no se guarda nada
        await client.query("BEGIN");

        try{
            // Ejecutamos el contenido completo de las tablas e índices de tu archivo SQL
            await client.query(migrationSql);
            // Apuntamos en el libro de registro que este archivo ya se ha completado
            await client.query(
                "INSERT INTO migrations (filename) VALUES ($1)",
                [filename]
            );
            // Confirmamos los cambios de forma definitiva en Docker
            await client.query("COMMIT");
            console.log("Migration", filename, "executed successfully");

        }catch(error){
            // Si el SQL tiene cualquier error, deshacemos todo para no romper la bbdd
            await client.query("ROLLBACK");
            console.error("Migration", filename, "failed:", error);
            throw error;
        }
    }
    console.log("Migrations completed");

    } catch (error) {

        console.error("Error running migrations:", error);
        process.exit(1);

    } finally {
        // Pase lo que pase, cerramos la conexión de forma segura al terminar
        await client.end();
    }
}
runMigrations();