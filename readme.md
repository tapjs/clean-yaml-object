# clean-yaml-object

> Clean up an object prior to serialization.

Replaces circular references, pretty prints Buffers, and numerous
other enhancements. Primarily designed to prepare Errors for
serialization to JSON/YAML.

Extracted from [`node-tap`](https://github.com/tapjs/node-tap)

## Usage

```ts
import { cleanYamlObject } from 'clean-yaml-object'
// or: const { cleanYamlObject } = require('clean-yaml-object')

cleanYamlObject(new Error('foo'))
//=> {name: 'Error', message: 'foo', stack: ...}
```

## API

### cleanYamlObject(input, [filterFn])

Returns a deep copy of `input` that is suitable for
serialization.

#### input

Type: `*`

Any object.

#### filterFn

Type: `callback(propertyName, isRoot, source, target)`

Optional filter callback. Returning `true` will cause the
property to be copied. Otherwise it will be skipped

- `propertyName`: The property being copied.
- `isRoot`: `true` only if `source` is the top level object
  passed to `copyYamlObject`
- `source`: The source from which `source[propertyName]` will be
  copied.
- `target`: The target object.
