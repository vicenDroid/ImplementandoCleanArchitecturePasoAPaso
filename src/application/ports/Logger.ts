// Interfaz que define los datos contextuales mínimos que rastreará el Logger
export interface LoggerContext {
  requestId?: string    // ID único de la petición HTTP para trazar su recorrido
  userId?: string       // ID del usuario que ha originado la acción
  operation?: string    // Nombre de la operación de negocio en ejecución
  [key: string]: any    // Permite añadir dinámicamente cualquier metadato extra
}

// Contrato general del sistema de logs para la capa de aplicación
export interface Logger {
  // Registra mensajes informativos de segui    miento general
  info(message: string, obj?: object): void

  // Registra errores críticos o excepciones controladas del sistema
  error(message: string, obj?: object): void

  // Registra avisos sobre situaciones inusuales que no rompen la app
  warn(message: string, obj?: object): void

  // Registra mensajes técnicos detallados exclusivos para desarrollo
  debug(message: string, obj?: object): void

  // Genera un logger hijo heredando el contexto actual y sumando nuevos metadatos
  child(context: LoggerContext): Logger
}