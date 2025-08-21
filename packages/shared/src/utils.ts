export function isObject(value) {
  return typeof value === 'object' && value !== null
}

export function hasChanged(newValue, oldValue) {
  return !Object.is(oldValue, newValue)
}

export function isFunction(value) {
  return typeof value === 'function'
}

export function isOn(key) {
  return /^on[A-Z]/.test(key)
}

export const isArray = Array.isArray

export function isString(value) {
  return typeof value === 'string'
}
