'use strict';
module.exports = function (object, filterFn) {
	return cleanYamlObj(object, filterFn || defaultFilter, true, []);
};

// Copied verbatim from node-tap:
// https://github.com/isaacs/node-tap/blob/e9fdcdec5914204e814f922e7e677aff6d1ffc9e/lib/test.js#L1076-L1159
function cleanYamlObj(object, filter, isRoot, seen) {
	if (object === undefined) {
		return null;
	}

	if (typeof object === 'function') {
		return object.toString();
	}

	if (Buffer.isBuffer(object)) {
		return 'Buffer\n' + object.toString('hex').split('')
				.reduce(function (set, c) {
					if (set.length && set[set.length - 1].length === 1) {
						set[set.length - 1] += c;
						if (set.length && set.length % 20 === 0) {
							set[set.length - 1] += '\n';
						} else {
							set[set.length - 1] += ' ';
						}
					} else {
						set.push(c);
					}
					return set;
				}, []).join('').trim();
	}

	if (object && typeof object === 'object') {
		if (object instanceof RegExp) {
			return object.toString();
		}

		var isArray = Array.isArray(object);

		// Fill in any holes.  This means we lose expandos,
		// but we were gonna lose those anyway.
		if (isArray) {
			object = Array.apply(null, object);
		}

		var isError = object && typeof object === 'object' && object instanceof Error;

		var set = isArray ? [] : {};

		// name is typically not an ownProperty on an Error
		if (isError && object.name && !object.hasOwnProperty('name') && filter('name', isRoot, object)) {
			setProp('name', object, set, seen, filter);
		}

		var keys = Object.getOwnPropertyNames(object);
		return keys.reduce(function (set, k) {
			// magic property!
			if (isArray && k === 'length') {
				return set;
			}

			// Don't dump massive EventEmitter and Domain
			// objects onto the output, that's never friendly.
			if (isError && /^domain/.test(k)) {
				return set;
			}

			if (!filter(k, isRoot, object)) {
				return set;
			}

			setProp(k, object, set, seen, filter);

			return set;
		}, set);
	}

	return object;
}

/*
 var stack = null;

 ...

 // put this in filter

 if (isRoot && k === 'stack') {
  stack = object[k];
  return set;
 }

....

 if (stack) {
 newObj.stack = stack;
 }
 return newObj;

 */

function setProp(propName, source, target, seen, filter) {
	if (seen.indexOf(source[propName]) === -1) {
		target[propName] = cleanYamlObj(source[propName], filter, false, seen.concat([source]));
	} else {
		target[propName] = '[Circular]';
	}
}

function defaultFilter(k, isRoot, object) {
	if (isRoot && (k === 'todo' || k === 'skip')) {
		return false;
	}

	return !(isRoot && k === 'at' && !object[k]);
}
