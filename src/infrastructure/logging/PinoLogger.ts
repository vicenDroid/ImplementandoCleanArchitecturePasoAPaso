import pino from 'pino'
import { Logger, LoggerContext } from '../../application/ports/Logger.js'

// Adaptador de infraestructura que implementa el puerto Logger usando la librería Pino
export class PinoLogger implements Logger {
  private readonly pinoInstance: pino.Logger

  // Inicializa Pino configurando el formato bonito (pino-pretty) si no es producción
  constructor(pinoInstance?: pino.Logger) {
    if (pinoInstance) {
      this.pinoInstance = pinoInstance
      return
    }

    // Si no viene instancia, configuramos Pino según el entorno actual
    const isDevelopment = process.env.NODE_ENV !== 'production'
    
    this.pinoInstance = pino({
      name: 'clean-orders-app',
      level: process.env.LOG_LEVEL ?? 'info',
      ...(isDevelopment && {
        transport: {  
          target: 'pino-pretty',
          options: {
            colorize: true
          }
        }
      })
    })
  }

  // Envía un mensaje informativo a los logs junto con sus metadatos opcionales
  info(message: string, obj?: object): void {
    if (obj) {
      this.pinoInstance.info(obj, message)
    } else {
      this.pinoInstance.info(message)
    }
  }

  // Envía un mensaje de error o excepción a la consola de logs
  error(message: string, obj?: object): void {
    if (obj) {
      this.pinoInstance.error(obj, message)
    } else {
      this.pinoInstance.error(message)
    }
  }

  // Envía un mensaje de advertencia del sistema
  warn(message: string, obj?: object): void {
    if (obj) {
      this.pinoInstance.warn(obj, message)
    } else {
      this.pinoInstance.warn(message)
    }
  }

  // Envía un mensaje técnico de depuración (debug) útil para desarrollo
  debug(message: string, obj?: object): void {
    if (obj) {
      this.pinoInstance.debug(obj, message)
    } else {
      this.pinoInstance.debug(message)
    }
  }

  // Crea un sub-logger que hereda el contexto y añade nuevos datos de rastreo
  child(context: LoggerContext): Logger {
    const childPino = this.pinoInstance.child(context)
    return new PinoLogger(childPino)
  }
}