export function isObject(value) {
  return typeof value === 'object' && value !== null
}

export function hasChanged(newValue, oldValue) {
  return !Object.is(oldValue, newValue)
}

export function isFunction(value) {
  return typeof value === 'function'
}