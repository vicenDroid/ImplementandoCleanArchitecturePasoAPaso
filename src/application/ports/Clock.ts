// src/application/ports/Clock.ts
// Clock interface representing a simple abstraction for retrieving the current date and time.
//  This allows for decoupling the application logic from the system clock, enabling easier
//  testing and potential support for different time sources in the future.
export interface Clock {
    now(): Date;
}