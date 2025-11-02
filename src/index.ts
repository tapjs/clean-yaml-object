import { bufferToString } from '@isaacs/buffer-to-string'

export type FilterFn = (
  key: string,
  isRoot: boolean,
  object: unknown,
  set: Record<string, unknown> | [],
) => boolean

export const cleanYamlObject = (
  object: unknown,
  filterFn: FilterFn = defaultFilter,
) => cleanYamlObject_(object, filterFn)

const isError = (obj: unknown): obj is Error =>
  !!obj && typeof obj === 'object' && obj instanceof Error

const cleanYamlObject_ = (
  object: unknown,
  filter: FilterFn,
  isRoot: boolean = true,
  seen: unknown[] = [],
) => {
  if (object === undefined) {
    return null
  }

  if (typeof object === 'function') {
    return object.toString()
  }

  if (Buffer.isBuffer(object)) {
    return 'Buffer\n' + bufferToString(object)
  }

  if (!object || typeof object !== 'object') return object

  if (object instanceof RegExp) {
    return object.toString()
  }

  seen = seen.concat([object])

  // Fill in any holes.  This means we lose expandos,
  // but we were gonna lose those anyway.
  if (Array.isArray(object)) {
    object = fillHoles(object)
  }

  const isArray = Array.isArray(object)
  const set = isArray ? [] : {}

  // name is typically not an ownProperty on an Error
  if (
    isError(object) &&
    object.name &&
    !{}.hasOwnProperty.call(object, 'name') &&
    filter('name', isRoot, object, set)
  ) {
    setProp(
      'name',
      object as unknown as Record<string, unknown>,
      set,
      seen,
      filter,
    )
  }

  const obj = object as unknown[] | Record<string, unknown>

  const keys = Object.getOwnPropertyNames(object)
  return keys.reduce(function (set, k) {
    // magic property!
    if (isArray && k === 'length') {
      return set
    }

    // Don't dump massive EventEmitter and Domain
    // objects onto the output, that's never friendly.
    if (isError(object) && /^domain/.test(k)) {
      return set
    }

    if (!filter(k, isRoot, object, set)) {
      return set
    }

    setProp(
      k,
      obj as unknown as Record<string, unknown>,
      set,
      seen,
      filter,
    )

    return set
  }, set)
}

function setProp(
  propName: string,
  source: Record<string, unknown>,
  target: Record<string, unknown>,
  seen: unknown[],
  filter: FilterFn,
) {
  if (seen.indexOf(source[propName]) === -1) {
    target[propName] = cleanYamlObject_(
      source[propName],
      filter,
      false,
      seen,
    )
  } else {
    target[propName] = '[Circular]'
  }
}

const defaultFilter: FilterFn = (_obj: unknown): boolean => true

function fillHoles(arr: unknown[]) {
  const result: unknown[] = []
  for (let i = 0; i < arr.length; i++) {
    result[i] = arr[i]
  }
  return result
}
