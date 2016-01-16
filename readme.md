# clean-yaml-object [![Build Status](https://travis-ci.org/jamestalmage/clean-yaml-object.svg?branch=master)](https://travis-ci.org/jamestalmage/clean-yaml-object)

> Cleans an object up for pretty printing.

Replaces circular references, pretty prints Buffers, and numerous other enhancements. Primarily designed to serialize Errors for serialization to JSON/YAML.

Extracted from [`node-tap`](https://github.com/tapjs/node-tap)

## Install

```
$ npm install --save clean-yaml-object
```


## Usage

```js
const cleanYamlObject = require('clean-yaml-object');

cleanYamlObject(new Error('foo'));
//=> {name: 'Error', message: 'foo', stack: ...}
```


## API

### cleanYamlObject(input, [filterFn])

Returns a deep copy of `input`, 

#### input

Type: `*`

Any object.

#### filterFn

Type: `function(propertyName, isRoot, source, target)`

Optional filter function. Returning `true` will cause the property to be copied.

- `propertyName`: The property being copied.
- `isRoot`: `true` only if `source` is the top level object passed to `copyYamlObject`
- `source`: The source from which `source[propertyName]` will be copied.
- `target`: The target object.

## License


MIT © [Isaac Z. Schlueter](http://github.com/isaacs) [James Talmage](http://github.com/jamestalmage)
