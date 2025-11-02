import t from 'tap'
import { cleanYamlObject } from '../src/index.js'

t.test('undefined === null', t => {
  t.equal(cleanYamlObject(undefined), null)
  t.end()
})

t.test('fn === fn.toString()', t => {
  function toStr() {
    return 'foo'
  }
  t.match(
    cleanYamlObject(toStr),
    /function toStr\(\) {[\s\n]+return 'foo'/m,
  )
  t.end()
})

t.test('Buffer outputs hex representation', t => {
  const arr = []
  for (var i = 0; i < 50; i++) {
    arr[i] = i
  }
  t.equal(
    cleanYamlObject(Buffer.from(arr)),
    [
      'Buffer',
      '00 01 02 03 04 05 06 07 08 09 0a 0b 0c 0d 0e 0f 10 11 12 13',
      '14 15 16 17 18 19 1a 1b 1c 1d 1e 1f 20 21 22 23 24 25 26 27',
      '28 29 2a 2b 2c 2d 2e 2f 30 31',
    ].join('\n'),
  )
  t.end()
})

t.test('regExp === regExp.toString()', t => {
  t.equal(cleanYamlObject(/foo|bar/), '/foo|bar/')
  t.end()
})

t.test('Array holes are filled', t => {
  const array = ['a']
  array[4] = 'c'
  t.strictSame(cleanYamlObject(array), ['a', null, null, null, 'c'])
  t.end()
})

t.test('Arrays with a single float are safe', t => {
  const array = [1.5]
  t.strictSame(cleanYamlObject(array), [1.5])
  t.end()
})

t.test('Errors have their domain stripped', t => {
  t.plan(2)

  const e = Object.assign(new Error('domainy'), {
    domain: { some: 'domain' },
    domainThrown: true,
  })

  // These two extra properties show up in Node `0.10`
  const filter = (k: string) => !/^(type|arguments)/.test(k)

  t.strictSame(Object.getOwnPropertyNames(e).filter(filter).sort(), [
    'domain',
    'domainThrown',
    'message',
    'stack',
  ])
  t.strictSame(
    Object.keys(
      cleanYamlObject(e, filter) as Record<string, unknown>,
    ).sort(),
    ['message', 'name', 'stack'],
  )
  t.end()
})

t.test('exposes error properties', t => {
  const serialized = cleanYamlObject(new Error('foo'))
  const x = Object.keys(serialized as Record<string, unknown>)
  t.not(
    x.indexOf('name'),
    -1,
    `name should be exposed even though it's on the prototype`,
  )
  t.not(x.indexOf('stack'), -1)
  t.not(x.indexOf('message'), -1)
  t.end()
})

t.test('should destroy circular references', t => {
  const obj: Record<string, unknown> = {}
  obj.child = { parent: obj }

  const serialized: Record<string, unknown> = cleanYamlObject(
    obj,
  ) as Record<string, unknown>
  t.equal(typeof serialized, 'object')
  //@ts-ignore
  t.equal(serialized?.child && serialized?.child?.parent, '[Circular]')
  t.end()
})

t.test('should not affect the original object', t => {
  const obj: Record<string, unknown> = {}
  obj.child = { parent: obj }

  const serialized = cleanYamlObject(obj)
  t.not(serialized, obj)
  //@ts-ignore
  t.equal(obj?.child?.parent, obj)
  t.end()
})

t.test('should only destroy parent references', t => {
  const obj: Record<string, any> = {}
  const common: Record<string, any> = { thing: obj }
  obj.one = { firstThing: common }
  obj.two = { secondThing: common }

  const serialized = cleanYamlObject(obj) as Record<string, any>
  t.equal(typeof serialized.one.firstThing, 'object')
  t.equal(typeof serialized.two.secondThing, 'object')
  t.equal(serialized.one.firstThing.thing, '[Circular]')
  t.equal(serialized.two.secondThing.thing, '[Circular]')
  t.end()
})

t.test('works if its own parent', t => {
  const obj: Record<string, any> = {}
  obj.parent = obj
  t.strictSame(cleanYamlObject(obj), { parent: '[Circular]' })
  t.end()
})

t.test('should work on arrays', t => {
  const obj: Record<string, any> = {}
  const common = [obj]
  const x = [common]
  const y: any[] = [['test'], common]
  y[0][1] = y
  obj.a = { x: x }
  obj.b = { y: y }

  const serialized = cleanYamlObject(obj) as Record<string, any>
  t.ok(Array.isArray(serialized.a.x))
  t.equal(serialized.a.x[0][0], '[Circular]')
  t.equal(serialized.b.y[0][0], 'test')
  t.equal(serialized.b.y[1][0], '[Circular]')
  t.equal(serialized.b.y[0][1], '[Circular]')
  t.end()
})

t.test('custom filter', t => {
  t.strictSame(
    cleanYamlObject({ a: 'a', b: 'b', c: 'c' }, k => k === 'c'),
    { c: 'c' },
  )
  t.end()
})
