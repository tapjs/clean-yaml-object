import test from 'ava';
import fn from './';
import domain from 'domain';

test('undefined === null', t => t.is(fn(undefined), null));

test('fn === fn.toString()', t => {
	function toStr() {
		return 'foo';
	}
	t.ok(/function toStr\(\) {[\s\n]+return 'foo'/m.test(fn(toStr)));
});

test('Buffer outputs hex representation', t => {
	const arr = [];
	for (var i = 0; i < 50; i++) {
		arr[i] = i;
	}
	t.is(fn(new Buffer(arr)), [
		'Buffer',
		'00 01 02 03 04 05 06 07 08 09 0a 0b 0c 0d 0e 0f 10 11 12 13',
		'14 15 16 17 18 19 1a 1b 1c 1d 1e 1f 20 21 22 23 24 25 26 27',
		'28 29 2a 2b 2c 2d 2e 2f 30 31'
	].join('\n'));
});

test('regExp === regExp.toString()', t => t.is(fn(/foo|bar/), '/foo|bar/'));

test('Array holes are filled', t => {
	const array = ['a'];
	array[4] = 'c';
	t.same(fn(array), ['a', null, null, null, 'c']);
});

test.cb('Errors have their domain stripped', t => {
	t.plan(2);

	// These two extra properties show up in Node `0.10`
	const filter = k => !/^(type|arguments)/.test(k);

	domain.create()
		.on('error', e => {
			t.same(
				Object.getOwnPropertyNames(e).filter(filter).sort(),
				['domain', 'domainThrown', 'message', 'stack']
			);
			t.same(Object.keys(fn(e, filter)).sort(), ['message', 'name', 'stack']);
			t.end();
		})
		.run(() => {
			setTimeout(() => {
				throw new Error('foo');
			}, 0);
		});
});

test('exposes error properties', t => {
	const serialized = fn(new Error('foo'));
	const x = Object.keys(serialized);
	t.not(x.indexOf('name'), -1, `name should be exposed even though it's on the prototype`);
	t.not(x.indexOf('stack'), -1);
	t.not(x.indexOf('message'), -1);
});

test('should destroy circular references', t => {
	const obj = {};
	obj.child = {parent: obj};

	const serialized = fn(obj);
	t.is(typeof serialized, 'object');
	t.is(serialized.child.parent, '[Circular]');
});

test('should not affect the original object', t => {
	const obj = {};
	obj.child = {parent: obj};

	const serialized = fn(obj);
	t.not(serialized, obj);
	t.is(obj.child.parent, obj);
});

test('should only destroy parent references', t => {
	const obj = {};
	const common = {thing: obj};
	obj.one = {firstThing: common};
	obj.two = {secondThing: common};

	const serialized = fn(obj);
	t.is(typeof serialized.one.firstThing, 'object');
	t.is(typeof serialized.two.secondThing, 'object');
	t.is(serialized.one.firstThing.thing, '[Circular]');
	t.is(serialized.two.secondThing.thing, '[Circular]');
});

test('works if its own parent', t => {
	const obj = {};
	obj.parent = obj;
	t.same(fn(obj), {parent: '[Circular]'});
});

test('should work on arrays', t => {
	const obj = {};
	const common = [obj];
	const x = [common];
	const y = [['test'], common];
	y[0][1] = y;
	obj.a = {x: x};
	obj.b = {y: y};

	const serialized = fn(obj);
	t.true(Array.isArray(serialized.a.x));
	t.is(serialized.a.x[0][0], '[Circular]');
	t.is(serialized.b.y[0][0], 'test');
	t.is(serialized.b.y[1][0], '[Circular]');
	t.is(serialized.b.y[0][1], '[Circular]');
});

test('custom filter', t => {
	t.same(
		fn({a: 'a', b: 'b', c: 'c'}, k => k === 'c'),
		{c: 'c'}
	);
});
