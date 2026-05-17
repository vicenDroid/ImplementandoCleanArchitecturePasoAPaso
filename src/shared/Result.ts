// This file defines a Result type, which is a common pattern for handling success and 
// failure in a functional programming style. The Result type can be either an Ok, which
//  represents a successful operation with a value, or a Fail, which represents a failed 
// operation with an error. The file also includes helper functions to create Ok and 
// Fail results, as well as type guards to check if a Result is an Ok or a Fail.
export type Result<T, E> = Ok<T> | Fail<E>

export type Ok<T> = {
  isSuccess: true
  value: T
}

export type Fail<E> = {
  isSuccess: false
  error: E
}

export const ok = <T, E = never>(value: T): Result<T, E> => ({
  isSuccess: true,
  value,
})

export const fail = <T = never, E = Error>(error: E): Result<T, E> => ({
  isSuccess: false,
  error,
})

export const isOk = <T, E>(result: Result<T, E>): result is Ok<T> => result.isSuccess

export const isFail = <T, E>(result: Result<T, E>): result is Fail<E> => !result.isSuccess

