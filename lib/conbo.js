(function(window, document, factory)
{
	/* Universal Module Definition (UMD) */

    // AMD (recommended)
    if (typeof define == 'function' && define.amd) 
	{
		define('conbo', ['jquery'], function($)
		{
			return factory(window, document, $);
		});
	}
	// Common.js & Node.js
	else if (typeof module != 'undefined' && module.exports)
	{
		if (document)
		{
    		module.exports = factory(window, document, require('jquery'));
    	}
    	else
    	{
    		module.exports = factory(window);
    	}
    }
	// Global
	else
	{
		window.conbo = factory(window, document, window.$);
	}
	
})(this, this.document, function(window, document, $, undefined)
{
/*! 
 * ConboJS: Lightweight MVC application framework for JavaScript
 * http://conbojs.mesmotronic.com/
 * 
 * Copyright (c) 2015 Mesmotronic Limited
 * Released under the MIT license
 * http://www.mesmotronic.com/legal/mit
 */

var __namespaces = {};

/**
 * ConboJS is a lightweight MVC application framework for JavaScript featuring 
 * dependency injection, context and encapsulation, data binding, command 
 * pattern and an event model which enables callback scoping and consistent 
 * event handling
 * 
 * Dependencies
 *
 * Lite: None
 * Complete: jQuery 1.7+
 * 
 * @namespace 	conbo
 * @param		namespace	{String}	The selected namespace
 * @author		Neil Rackett
 * @see			http://www.mesmotronic.com/
 * 
 * @example
 * // Conbo can replace the standard minification pattern with modular namespace definitions
 * // If an Object is returned, its contents will be added to the namespace
 * conbo('com.namespace.example', window, document, conbo, function(window, document, conbo, undefined)
 * {
 * 	var example = this;
 * 	
 * 	// Your code here
 * });  
 */
var conbo = function(namespace)
{
	if (!namespace || !conbo.isString(namespace))
	{
		conbo.warn('First parameter must be the namespace string, received', namespace);
		return;
	}

	if (!__namespaces[namespace])
	{
		__namespaces[namespace] = new conbo.Namespace();
	}
	
	var ns = __namespaces[namespace],
		params = conbo.rest(arguments),
		func = params.pop()
		;
	
	if (conbo.isFunction(func))
	{
		var obj = func.apply(ns, params);
		
		if (conbo.isObject(obj) && !conbo.isArray(obj))
		{
			ns.extend(obj);
		}
	}
	
	return ns;
};

/**
 * Internal reference to self, enables full functionality to be used via 
 * ES2015 import statements
 * 
 * @augments	conbo
 * @returns		{conbo}
 * 
 * @example 
 * import {conbo} from 'conbo';
 */
conbo.conbo = conbo;

/**
 * @augments	conbo
 * @returns 	{String}
 */
conbo.VERSION = '3.2.3';
	
/**
 * @augments	conbo
 * @returns 	{String}
 */
conbo.toString = function() 
{ 
	return 'ConboJS v'+this.VERSION; 
};

if (!!$)
{
	/**
	 * Local jQuery instance used by Conbo internally (not available in lite build)
	 * @namespace	conbo.$
	 */
	conbo.$ = $;
	
	$(function()
	{
		conbo.info(conbo.toString());
	})
}

/*
 * Utility methods: a modified subset of Underscore.js methods, 
 * plus loads of our own
 */

(function() 
{
	// Establish the object that gets returned to break out of a loop iteration.
	var breaker = false;

	// Save bytes in the minified (but not gzipped) version:
	var
		ArrayProto = Array.prototype, 
		ObjProto = Object.prototype, 
		FuncProto = Function.prototype;

	// Create quick reference variables for speed access to core prototypes.
	var
		push			= ArrayProto.push,
		slice			= ArrayProto.slice,
		concat			= ArrayProto.concat,
		toString		= ObjProto.toString,
		hasOwnProperty	= ObjProto.hasOwnProperty;

	// All ECMAScript 5 native function implementations that we hope to use
	// are declared here.
	var
		nativeIndexOf		= ArrayProto.indexOf,
		nativeLastIndexOf	= ArrayProto.lastIndexOf,
		nativeMap			= ArrayProto.map,
		nativeReduce		= ArrayProto.reduce,
		nativeReduceRight	= ArrayProto.reduceRight,
		nativeFilter		= ArrayProto.filter,
		nativeEvery			= ArrayProto.every,
		nativeSome			= ArrayProto.some,
		nativeIsArray		= Array.isArray,
		nativeKeys			= Object.keys,
		nativeBind			= FuncProto.bind;
	
	// Collection Functions
	// --------------------

	/**
	 * Handles objects, arrays, lists and raw objects using a for loop (because 
	 * tests show that a for loop can be twice as fast as a native forEach).
	 * 
	 * Return `false` to break the loop.
	 * 
	 * @memberof	conbo
	 * @param		{object}	obj - The list to iterate
	 * @param		{function}	iterator - Iterator function with parameters: item, index, list
	 * @param		{object}	scope - The scope the iterator function should run in (optional)
	 */
	 conbo.forEach = function(obj, iterator, scope) 
	 {
		if (obj == null) return;
		
		var i, length;
		
		if (conbo.isIterable(obj)) 
		{
			for (i=0, length=obj.length; i<length; ++i) 
			{
				if (iterator.call(scope, obj[i], i, obj) === breaker) return;
			}
		}
		else
		{
			var keys = conbo.keys(obj);
			
			for (i=0, length=keys.length; i<length; i++) 
			{
				if (iterator.call(scope, obj[keys[i]], keys[i], obj) === breaker) return;
			}
		}
		
		return obj;
	};
	
	var forEach = conbo.forEach;
	
	/**
	 * Return the results of applying the iterator to each element.
	 * Delegates to native `map` if available.
	 * 
	 * @memberof	conbo
	 * @param		{object}	obj - The list to iterate
	 * @param		{function}	iterator - Iterator function with parameters: item, index, list
	 * @param		{object}	scope - The scope the iterator function should run in (optional)
	 */
	conbo.map = function(obj, iterator, scope) 
	{
		var results = [];
		
		if (obj == null) return results;
		if (nativeMap && obj.map === nativeMap) return obj.map(iterator, scope);
		
		forEach(obj, function(value, index, list) 
		{
			results.push(iterator.call(scope, value, index, list));
		});
		
		return results;
	};
	
	/**
	 * Returns the index of the first instance of the specified item in the list
	 * 
	 * @param	{object}	obj - The list to search
	 * @param	{object}	item - The value to find the index of
	 */
	conbo.indexOf = function(obj, item)
	{
		return nativeIndexOf.call(obj, item);
	};
	
	/**
	 * Returns the index of the last instance of the specified item in the list
	 * 
	 * @param	{object}	obj - The list to search
	 * @param	{object}	item - The value to find the index of
	 */
	conbo.lastIndexOf = function(obj, item)
	{
		return nativeLastIndexOf.call(obj, item);
	};
	
	/**
	 * Return the first value which passes a truth test
	 * 
	 * @memberof	conbo
	 * @param		{object}	obj - The list to iterate
	 * @param		{function}	predicate - Function that tests each value, returning true or false
	 * @param		{object}	scope - The scope the predicate function should run in (optional)
	 */
	conbo.find = function(obj, predicate, scope) 
	{
		var result;
		
		conbo.some(obj, function(value, index, list) 
		{
			if (predicate.call(scope, value, index, list)) 
			{
				result = value;
				return true;
			}
		});
		
		return result;
	};
	
	/**
	 * Return the index of the first value which passes a truth test
	 * 
	 * @memberof	conbo
	 * @param		{object}	obj - The list to iterate
	 * @param		{function}	predicate - Function that tests each value, returning true or false
	 * @param		{object}	scope - The scope the predicate function should run in (optional)
	 */
	conbo.findIndex = function(obj, predicate, scope) 
	{
		var value = conbo.find(obj, predicate, scope);
		return obj.indexOf(value);
	};
	
	/**
	 * Return all the elements that pass a truth test.
	 * Delegates to native `filter` if available.
	 * 
	 * @memberof	conbo
	 * @param		{object}	obj - The list to iterate
	 * @param		{function}	predicate - Function that tests each value, returning true or false
	 * @param		{object}	scope - The scope the predicate function should run in (optional)
	 */
	conbo.filter = function(obj, predicate, scope) 
	{
		var results = [];
		
		if (obj == null) return results;
		if (nativeFilter && obj.filter === nativeFilter) return obj.filter(predicate, scope);
		
		forEach(obj, function(value, index, list) 
		{
			if (predicate.call(scope, value, index, list)) results.push(value);
		});
		
		return results;
	};

	/**
	 * Return all the elements for which a truth test fails.
	 * 
	 * @memberof	conbo
	 * @param		{object}	obj - The list to iterate
	 * @param		{function}	predicate - Function that tests each value, returning true or false
	 * @param		{object}	scope - The scope the predicate function should run in (optional)
	 */
	conbo.reject = function(obj, predicate, scope) 
	{
		return conbo.filter(obj, function(value, index, list) 
		{
			return !predicate.call(scope, value, index, list);
		},
		scope);
	};
	
	/**
	 * Determine whether all of the elements match a truth test.
	 * Delegates to native `every` if available.
	 * 
	 * @memberof	conbo
	 * @param		{object}	obj - The list to iterate
	 * @param		{function}	predicate - Function that tests each value, returning true or false
	 * @param		{object}	scope - The scope the predicate function should run in (optional)
	 */
	conbo.every = function(obj, predicate, scope) 
	{
		predicate || (predicate = conbo.identity);
		
		var result = true;
		
		if (obj == null) return result;
		if (nativeEvery && obj.every === nativeEvery) return obj.every(predicate, scope);
		
		forEach(obj, function(value, index, list) 
		{
			if (!(result = result && predicate.call(scope, value, index, list))) return breaker;
		});
		
		return !!result;
	};

	/**
	 * Determine if at least one element in the object matches a truth test.
	 * Delegates to native `some` if available.
	 * 
	 * @memberof	conbo
	 * @param		{object}	obj - The list to iterate
	 * @param		{function}	predicate - Function that tests each value, returning true or false
	 * @param		{object}	scope - The scope the predicate function should run in (optional)
	 */
	conbo.some = function(obj, predicate, scope) 
	{
		predicate || (predicate = conbo.identity);
		var result = false;
		if (obj == null) return result;
		if (nativeSome && obj.some === nativeSome) return obj.some(predicate, scope);
		forEach(obj, function(value, index, list) {
			if (result || (result = predicate.call(scope, value, index, list))) return breaker;
		});
		return !!result;
	};
	
	var some = conbo.some;
	
	/**
	 * Determine if the array or object contains a given value (using `===`).
	 * 
	 * @memberof	conbo
	 * @param		{object}	obj - The list to iterate
	 * @param		{function}	target - The value to match
	 */
	conbo.contains = function(obj, target) 
	{
		if (obj == null) return false;
		return obj.indexOf(target) != -1;
	};

	/**
	 * Invoke a method (with arguments) on every item in a collection.
	 * 
	 * @memberof	conbo
	 * @param		{object}	obj - The list to iterate
	 * @param		{function}	method - Function to invoke on every item
	 */
	conbo.invoke = function(obj, method) 
	{
		var args = slice.call(arguments, 2);
		var isFunc = conbo.isFunction(method);
		
		return conbo.map(obj, function(value) 
		{
			return (isFunc ? method : value[method]).apply(value, args);
		});
	};
	
	/**
	 * Convenience version of a common use case of `map`: fetching a property.
	 * 
	 * @memberof	conbo
	 * @param		{object}	obj - Object
	 * @param		{string}	key - Property name
	 */
	conbo.pluck = function(obj, key) 
	{
		return conbo.map(obj, conbo.property(key));
	};

	/**
	 * Return the maximum element or (element-based computation).
	 * Can't optimize arrays of integers longer than 65,535 elements.
	 * 
	 * @see https://bugs.webkit.org/show_bug.cgi?id=80797
	 * @memberof	conbo
	 * @param		{object}	obj - The list to iterate
	 * @param		{function}	iterator - Function that tests each value (optional)
	 * @param		{object}	scope - The scope the iterator function should run in (optional)
	 */
	conbo.max = function(obj, iterator, scope) 
	{
		if (!iterator && conbo.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) 
		{
			return Math.max.apply(Math, obj);
		}
		
		var result = -Infinity, lastComputed = -Infinity;
		
		forEach(obj, function(value, index, list) 
		{
			var computed = iterator ? iterator.call(scope, value, index, list) : value;
			if (computed > lastComputed) {
				result = value;
				lastComputed = computed;
			}
		});
		
		return result;
	};

	/**
	 * Return the minimum element (or element-based computation).
	 * 
	 * @memberof	conbo
	 * @param		{object}	obj - The list to iterate
	 * @param		{function}	iterator - Function that tests each value (optional)
	 * @param		{object}	scope - The scope the iterator function should run in (optional)
	 */
	conbo.min = function(obj, iterator, scope) 
	{
		if (!iterator && conbo.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
			return Math.min.apply(Math, obj);
		}
		
		var result = Infinity, lastComputed = Infinity;
		
		forEach(obj, function(value, index, list) 
		{
			var computed = iterator ? iterator.call(scope, value, index, list) : value;
			
			if (computed < lastComputed) 
			{
				result = value;
				lastComputed = computed;
			}
		});
		
		return result;
	};

	/**
	 * Shuffle an array, using the modern version of the Fisher-Yates shuffle
	 * @see http://en.wikipedia.org/wiki/Fisher–Yates_shuffle
	 * 
	 * @memberof	conbo
	 * @param		{object}	obj - The list to shuffle
	 */
	conbo.shuffle = function(obj) 
	{
		var rand;
		var index = 0;
		var shuffled = [];
		
		forEach(obj, function(value) 
		{
			rand = conbo.random(index++);
			shuffled[index - 1] = shuffled[rand];
			shuffled[rand] = value;
		});
		
		return shuffled;
	};

	/**
	 * An internal function to generate lookup iterators.
	 * @private
	 */
	var lookupIterator = function(value) 
	{
		if (value == null) return conbo.identity;
		if (conbo.isFunction(value)) return value;
		return conbo.property(value);
	};
	
	/**
	 * Convert anything iterable into an Array
	 * 
	 * @memberof	conbo
	 * @param		{object}	obj - The object to convert into an Array 
	 */
	conbo.toArray = function(obj) 
	{
		if (!obj) return [];
		if (conbo.isArray(obj)) return slice.call(obj);
		if (conbo.isIterable(obj)) return conbo.map(obj, conbo.identity);
		return conbo.values(obj);
	};
	
	/**
	 * Return the number of elements in an object.
	 * 
	 * @memberof	conbo
	 * @param		{object}	obj - The object to count the keys of
	 */
	conbo.size = function(obj) 
	{
		if (!obj) return 0;
		
		return conbo.isIterable(obj)
			? obj.length 
			: conbo.keys(obj).length;
	};
	
	// Array Functions
	// ---------------

	/**
	 * Get the last element of an array. Passing n will return the last N
	 * values in the array. The guard check allows it to work with `conbo.map`.
	 * 
	 * @memberof	conbo
	 * @param		{array}		array - The array to slice
	 * @param		{function}	n - The number of elements to return (default: 1)
	 * @param		{object}	guard - Optional
	 */
	conbo.last = function(array, n, guard) 
	{
		if (array == null) return undefined;
		if (n == null || guard) return array[array.length - 1];
		return slice.call(array, Math.max(array.length - n, 0));
	};

	/**
	 * Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
	 * Especially useful on the arguments object. Passing an n will return
	 * the rest N values in the array. The guard
	 * check allows it to work with `conbo.map`.
	 * 
	 * @memberof	conbo
	 * @param		{array}		array - The array to slice
	 * @param		{function}	n - The number of elements to return (default: 1)
	 * @param		{object}	guard - Optional
	 */
	conbo.rest = function(array, n, guard) 
	{
		return slice.call(array, (n == null) || guard ? 1 : n);
	};

	/**
	 * Trim out all falsy values from an array.
	 * 
	 * @memberof	conbo
	 * @param		{array}		array - The array to trim
	 */
	conbo.compact = function(array) 
	{
		return conbo.filter(array, conbo.identity);
	};

	/**
	 * Internal implementation of a recursive `flatten` function.
	 * @private
	 */
	var flatten = function(input, shallow, output) 
	{
		if (shallow && conbo.every(input, conbo.isArray)) 
		{
			return concat.apply(output, input);
		}
		
		forEach(input, function(value) 
		{
			if (conbo.isArray(value) || conbo.isArguments(value)) 
			{
				shallow ? push.apply(output, value) : flatten(value, shallow, output);
			}
			else 
			{
				output.push(value);
			}
		});
		
		return output;
	};

	/**
	 * Flatten out an array, either recursively (by default), or just one level.
	 * 
	 * @memberof	conbo
	 * @param		{array}		array - The array to flatten
	 */
	conbo.flatten = function(array, shallow) 
	{
		return flatten(array, shallow, []);
	};

	/**
	 * Return a version of the array that does not contain the specified value(s).
	 * 
	 * @memberof	conbo
	 * @param		{array}		array - The array to remove the specified values from
	 */
	conbo.without = function(array) 
	{
		return conbo.difference(array, slice.call(arguments, 1));
	};

	/**
	 * Split an array into two arrays: one whose elements all satisfy the given
	 * predicate, and one whose elements all do not satisfy the predicate.
	 * 
	 * @memberof	conbo
	 * @param		{array}		array - The array to split
	 * @param		{function}	predicate - Function to determine a match, returning true or false
	 * @returns		{array}
	 */
	conbo.partition = function(array, predicate) 
	{
		var pass = [], fail = [];
		
		forEach(array, function(elem) 
		{
			(predicate(elem) ? pass : fail).push(elem);
		});
		
		return [pass, fail];
	};

	/**
	 * Produce a duplicate-free version of the array. If the array has already
	 * been sorted, you have the option of using a faster algorithm.
	 * 
	 * @memberof	conbo
	 * @param		{array}		array - The array to filter
	 * @param		{boolean}	isSorted - Should the returned array be sorted?
	 * @param		{object}	iterator - Iterator function
	 * @param		{object}	scope - The scope the iterator function should run in (optional)
	 */
	conbo.uniq = function(array, isSorted, iterator, scope) 
	{
		if (conbo.isFunction(isSorted)) 
		{
			scope = iterator;
			iterator = isSorted;
			isSorted = false;
		}
		
		var initial = iterator ? conbo.map(array, iterator, scope) : array;
		var results = [];
		var seen = [];
		
		forEach(initial, function(value, index) 
		{
			if (isSorted ? (!index || seen[seen.length - 1] !== value) : !conbo.contains(seen, value)) 
			{
				seen.push(value);
				results.push(array[index]);
			}
		});
		
		return results;
	};

	/**
	 * Produce an array that contains the union: each distinct element from all of
	 * the passed-in arrays.
	 * 
	 * @memberof	conbo
	 */
	conbo.union = function() 
	{
		return conbo.uniq(conbo.flatten(arguments, true));
	};

	/**
	 * Produce an array that contains every item shared between all the
	 * passed-in arrays.
	 * 
	 * @memberof	conbo
	 * @param		{array}		array - Array of values
	 * @returns		{array}
	 */
	conbo.intersection = function(array) 
	{
		var rest = slice.call(arguments, 1);
		
		return conbo.filter(conbo.uniq(array), function(item) 
		{
			return conbo.every(rest, function(other) 
			{
				return conbo.contains(other, item);
			});
		});
	};

	/**
	 * Take the difference between one array and a number of other arrays.
	 * Only the elements present in just the first array will remain.
	 * 
	 * @memberof	conbo
	 * @param		{array}		array - Array of compare
	 * @returns		{array}
	 */
	conbo.difference = function(array) 
	{
		var rest = concat.apply(ArrayProto, slice.call(arguments, 1));
		return conbo.filter(array, function(value){ return !conbo.contains(rest, value); });
	};

	/**
	 * Converts lists into objects. Pass either a single array of `[key, value]`
	 * pairs, or two parallel arrays of the same length -- one of keys, and one of
	 * the corresponding values.
	 * 
	 * @memberof	conbo
	 * @param		{object}	list - List of keys
	 * @param		{object}	values - List of values
	 * @returns		{array}
	 */
	conbo.object = function(list, values) 
	{
		if (list == null) return {};
		
		var result = {};
		
		for (var i = 0, length = list.length; i < length; i++) 
		{
			if (values) 
			{
				result[list[i]] = values[i];
			}
			else 
			{
				result[list[i][0]] = list[i][1];
			}
		}
		return result;
	};
	
	/**
	 * Generate an integer Array containing an arithmetic progression. A port of
	 * the native Python `range()` function.
	 * 
	 * @see http://docs.python.org/library/functions.html#range
	 * @memberof	conbo
	 * @param		{number}	start - Start
	 * @param		{number}	stop - Stop
	 * @param		{number}	stop - Step
	 */
	conbo.range = function(start, stop, step) 
	{
		if (arguments.length <= 1) 
		{
			stop = start || 0;
			start = 0;
		}
		
		step = arguments[2] || 1;

		var length = Math.max(Math.ceil((stop - start) / step), 0);
		var idx = 0;
		var range = new Array(length);

		while(idx < length) 
		{
			range[idx++] = start;
			start += step;
		}

		return range;
	};

	// Function (ahem) Functions
	// ------------------

	// Reusable constructor function for prototype setting.
	var ctor = function(){};

	/**
	 * Create a function bound to a given object (assigning `this`, and arguments,
	 * optionally). Delegates to native `Function.bind` if
	 * available.
	 * 
	 * @memberof	conbo
	 * @param		{function}	func - Method to bind
	 * @param		{object}	scope - The scope to bind the method to
	 */
	conbo.bind = function(func, scope) 
	{
		var args;
		
		if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
		if (!conbo.isFunction(func)) throw new TypeError();
		
		args = slice.call(arguments, 2);
		
		return function() 
		{
			if (!(this instanceof bound)) return func.apply(scope, args.concat(slice.call(arguments)));
			ctor.prototype = func.prototype;
			var self = new ctor();
			ctor.prototype = null;
			var result = func.apply(self, args.concat(slice.call(arguments)));
			if (Object(result) === result) return result;
			return self;
		};
	};

	/**
	 * Partially apply a function by creating a version that has had some of its
	 * arguments pre-filled, without changing its dynamic `this` scope. _ acts
	 * as a placeholder, allowing any combination of arguments to be pre-filled.
	 * 
	 * @memberof	conbo
	 * @param		{function}	func - Method to partially pre-fill
	 */
	conbo.partial = function(func) 
	{
		var boundArgs = slice.call(arguments, 1);
		
		return function() 
		{
			var position = 0;
			var args = boundArgs.slice();
			
			for (var i = 0, length = args.length; i < length; i++) 
			{
				if (args[i] === conbo) args[i] = arguments[position++];
			}
			
			while (position < arguments.length) args.push(arguments[position++]);
			return func.apply(this, args);
		};
	};

	/**
	 * Bind a number of an object's methods to that object. Remaining arguments
	 * are the method names to be bound. Useful for ensuring that all callbacks
	 * defined on an object belong to it.
	 * 
	 * @memberof	conbo
	 * @param		{object}	obj - Object to bind methods to
	 * @param		{regexp}	regExp - Method name filter (optional)
	 */
	conbo.bindAll = function(obj, regExp)
	{
		var isRegExp = regExp instanceof RegExp,
			funcs = slice.call(arguments, 1);
		
		if (isRegExp || funcs.length === 0) 
		{
			funcs = conbo.functions(obj);
			if (isRegExp) funcs = conbo.filter(funcs, function(f) { return regExp.test(f); });
		}
		
		funcs.forEach(function(f)
		{
			obj[f] = conbo.bind(obj[f], obj); 
		});
		
		return obj;
	};
	
	/**
	 * Defers a function, scheduling it to run after the current call stack has
	 * cleared.
	 * 
	 * @memberof	conbo
	 * @param		{function}	func - Function to call
	 * @param		{object}	scope - The scope in which to call the function
	 */
	conbo.defer = function(func, scope) 
	{
		if (scope)
		{
			func = conbo.bind(func, scope);
		}
		
		return setTimeout.apply(null, [func, 0].concat(conbo.rest(arguments, 2)));
	};

	/**
	 * Returns a function that will be executed at most one time, no matter how
	 * often you call it. Useful for lazy initialization.
	 * 
	 * @memberof	conbo
	 * @param		{function}	func - Function to call
	 */
	conbo.once = function(func) 
	{
		var ran = false, memo;
		
		return function() {
			if (ran) return memo;
			ran = true;
			memo = func.apply(this, arguments);
			func = null;
			return memo;
		};
	};

	/**
	 * Returns the first function passed as an argument to the second,
	 * allowing you to adjust arguments, run code before and after, and
	 * conditionally execute the original function.
	 * 
	 * @memberof	conbo
	 * @param		{function}	func - Function to wrap
	 * @param		{function}	wrapper - Function to call 
	 */
	conbo.wrap = function(func, wrapper) 
	{
		return conbo.partial(wrapper, func);
	};
	
	// Object Functions
	// ----------------

	/**
	 * Retrieve the names of an object's enumerable properties
	 * 
	 * @memberof	conbo
	 * @param		{object}	obj - Object to get keys from
	 * @param		{boolean}	useForIn - Whether or not to include prototype keys 
	 */
	conbo.keys = function(obj, useForIn)
	{
		if (!conbo.isObject(obj)) return [];
		
		if (nativeKeys && !useForIn)
		{
			return nativeKeys(obj);
		}
		
		var keys = [];
		
		for (var key in obj)
		{
			if (useForIn || conbo.has(obj, key)) keys.push(key);
		}
		
		return keys;
	};
	
	/**
	 * Retrieve the names of every property of an object, regardless of whether it's
	 * enumerable or unenumerable and where it is on the prototype chain
	 * 
	 * @memberof	conbo
	 * @param		{object}	obj - Object to get keys from
	 */
	conbo.getAllPropertyNames = function(obj)
	{
		var names = [];
		
		do
		{
			var props = Object.getOwnPropertyNames(obj);
			
			props.forEach(function(name)
			{
				if (names.indexOf(name) === -1)
				{
					names.push(name)
				}
			})
		}
		while(obj = Object.getPrototypeOf(obj));
		
		return names
	};
	
	/**
	 * Retrieve the names of every public property (names that do not begin 
	 * with an underscore) of an object, regardless of whether it's enumerable 
	 * or unenumerable and where it is on the prototype chain
	 * 
	 * @memberof	conbo
	 * @param		{object}	obj - Object to get keys from
	 */
	conbo.getPublicPropertyNames = function(obj)
	{
		return conbo.filter(conbo.getAllPropertyNames(obj), function(name) { return !/^_.+/.test(name); });
	};
	
	/**
	 * Retrieve the names of every private property (names that begin with a 
	 * single underscore) of an object, regardless of whether it's enumerable 
	 * or unenumerable and where it is on the prototype chain
	 * 
	 * @memberof	conbo
	 * @param		{object}	obj - Object to get keys from
	 */
	conbo.getPrivatePropertyNames = function(obj)
	{
		return conbo.filter(conbo.getAllPropertyNames(obj), function(name) { return /^_[a-z\d]+/i.test(name); });
	};
	
	/**
	 * Retrieve the names of every private property (names that begin with a 
	 * double underscore) of an object, regardless of whether it's enumerable 
	 * or unenumerable and where it is on the prototype chain
	 * 
	 * @memberof	conbo
	 * @param		{object}	obj - Object to get keys from
	 */
	conbo.getInternalPropertyNames = function(obj)
	{
		return conbo.filter(conbo.getAllPropertyNames(obj), function(name) { return /^__.+/.test(name); });
	};
	
	/**
	 * Retrieve the values of an object's properties.
	 * ConboJS: Extended to enable keys further up the prototype chain to be found too
	 * 
	 * @memberof	conbo
	 * @param		{object}	obj - Object to get values from
	 * @param		{boolean}	useForIn - Whether or not to include prototype keys 
	 */
	conbo.values = function(obj, useForIn) 
	{
		var keys = conbo.keys(obj, useForIn);
		var length = keys.length;
		var values = new Array(length);
		
		for (var i = 0; i < length; i++)
		{
			values[i] = obj[keys[i]];
		}
		
		return values;
	};

	/**
	 * Return a sorted list of the function names available on the object,
	 * including both enumerable and unenumerable functions
	 * 
	 * @memberof	conbo
	 * @param		{object}	obj - Object to sort
	 */
	conbo.functions = function(obj) 
	{
		var names = [];
		var allKeys = conbo.getAllPropertyNames(obj);
		
		allKeys.forEach(function(key)
		{
			if (conbo.isFunction(obj[key])) 
			{
				names.push(key);
			}
		});
		
		return names.sort();
	};

	/**
	 * Define the values of the given object by cloning all of the properties 
	 * of the passed-in object(s), destroying and overwriting the target's 
	 * property descriptors and values in the process
	 * 
	 * @memberof	conbo
	 * @param		{object}	obj - Object to define properties on
	 * @returns		{object}
	 * @see			conbo.setValues
	 */
	conbo.defineValues = function(obj) 
	{
		forEach(slice.call(arguments, 1), function(source) 
		{
			if (!source) return;
			
			for (var propName in source) 
			{
				conbo.cloneProperty(source, propName, obj);
			}
		});
		
		return obj;
	};
	
	/**
	 * Define bindable values on the given object using the property names and
	 * of the passed-in object(s), destroying and overwriting the target's 
	 * property descriptors and values in the process
	 * 
	 * @memberof	conbo
	 * @param		{object}	obj - Object to define properties on
	 * @returns		{object}
	 */
	conbo.defineBindableValues = function(obj) 
	{
		forEach(slice.call(arguments, 1), function(source) 
		{
			if (!source) return;
			
			for (var propName in source) 
			{
				delete obj[propName];
				__defineProperty(obj, propName, source[propName]);
			}
		});
		
		return obj;
	};
	
	/**
	 * Return a copy of the object only containing the whitelisted properties.
	 * 
	 * @memberof	conbo
	 * @param		{object}	obj - Object to copy properties from
	 */
	conbo.pick = function(obj) 
	{
		var copy = {};
		var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
		
		forEach(keys, function(key) 
		{
			if (key in obj)
			{
				conbo.cloneProperty(obj, key, copy);
			}
		});
		
		return copy;
	};
	
	/**
	 * Return a copy of the object without the blacklisted properties.
	 * 
	 * @memberof	conbo
	 * @param		{object}	obj - Object to copy
	 */
	conbo.omit = function(obj) 
	{
		var copy = {};
		var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
		
		for (var key in obj) 
		{
			if (!conbo.contains(keys, key))
			{
				conbo.cloneProperty(obj, key, copy);
			}
		}
		
		return copy;
	};

	/**
	 * Fill in an object's missing properties by cloning the properties of the 
	 * source object(s) onto the target object, overwriting the target's
	 * property descriptors
	 * 
	 * @memberof	conbo
	 * @param		{object}	obj - Object to populate
	 * @see			conbo.setDefaults
	 */
	conbo.defineDefaults = function(obj) 
	{
		forEach(slice.call(arguments, 1), function(source) 
		{
			if (source) 
			{
				for (var propName in source) 
				{
					if (obj[propName] !== undefined) continue;
					conbo.cloneProperty(source, propName, obj);
				}
			}
		});
		
		return obj;
	};
	
	/**
	 * Fill in missing values on an object by setting the property values on 
	 * the target object, without affecting the target's property descriptors
	 * 
	 * @memberof	conbo
	 * @param		{object}	obj - Object to populate
	 */
	conbo.setDefaults = function(obj) 
	{
		forEach(slice.call(arguments, 1), function(source) 
		{
			if (source) 
			{
				for (var propName in source) 
				{
					if (obj[propName] !== undefined) continue;
					obj[propName] = source[propName];
				}
			}
		});
		
		return obj;
	};
	
	/**
	 * Create a (shallow-cloned) duplicate of an object.
	 * 
	 * @memberof	conbo
	 * @param		{object}	obj - Object to clone
	 */
	conbo.clone = function(obj) 
	{
		if (!conbo.isObject(obj)) return obj;
		return conbo.isArray(obj) ? obj.slice() : conbo.defineValues({}, obj);
	};
	
	// Internal recursive comparison function for `isEqual`.
	var eq = function(a, b, aStack, bStack) {
		// Identical objects are equal. `0 === -0`, but they aren't identical.
		// See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
		if (a === b) return a !== 0 || 1 / a == 1 / b;
		// A strict comparison is necessary because `null == undefined`.
		if (a == null || b == null) return a === b;
		// Unwrap any wrapped objects.
		// Compare `[[Class]]` names.
		var className = toString.call(a);
		if (className != toString.call(b)) return false;
		switch (className) {
			// Strings, numbers, dates, and booleans are compared by value.
			case '[object String]':
				// Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
				// equivalent to `new String("5")`.
				return a == String(b);
			case '[object Number]':
				// `NaN`s are equivalent, but non-reflexive. An `egal` comparison is performed for
				// other numeric values.
				return a != +a ? b != +b : (a === 0 ? 1 / a == 1 / b : a == +b);
			case '[object Date]':
			case '[object Boolean]':
				// Coerce dates and booleans to numeric primitive values. Dates are compared by their
				// millisecond representations. Note that invalid dates with millisecond representations
				// of `NaN` are not equivalent.
				return +a == +b;
			// RegExps are compared by their source patterns and flags.
			case '[object RegExp]':
				return a.source == b.source &&
							 a.global == b.global &&
							 a.multiline == b.multiline &&
							 a.ignoreCase == b.ignoreCase;
		}
		if (typeof a != 'object' || typeof b != 'object') return false;
		// Assume equality for cyclic structures. The algorithm for detecting cyclic
		// structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
		var length = aStack.length;
		while (length--) {
			// Linear search. Performance is inversely proportional to the number of
			// unique nested structures.
			if (aStack[length] == a) return bStack[length] == b;
		}
		// Objects with different constructors are not equivalent, but `Object`s
		// from different frames are.
		var aCtor = a.constructor, bCtor = b.constructor;
		if (aCtor !== bCtor && !(conbo.isFunction(aCtor) && (aCtor instanceof aCtor) &&
														 conbo.isFunction(bCtor) && (bCtor instanceof bCtor))
												&& ('constructor' in a && 'constructor' in b)) {
			return false;
		}
		// Add the first object to the stack of traversed objects.
		aStack.push(a);
		bStack.push(b);
		var size = 0, result = true;
		// Recursively compare objects and arrays.
		if (className == '[object Array]') {
			// Compare array lengths to determine if a deep comparison is necessary.
			size = a.length;
			result = size == b.length;
			if (result) {
				// Deep compare the contents, ignoring non-numeric properties.
				while (size--) {
					if (!(result = eq(a[size], b[size], aStack, bStack))) break;
				}
			}
		} else {
			// Deep compare objects.
			for (var key in a) {
				if (conbo.has(a, key)) {
					// Count the expected number of properties.
					size++;
					// Deep compare each member.
					if (!(result = conbo.has(b, key) && eq(a[key], b[key], aStack, bStack))) break;
				}
			}
			// Ensure that both objects contain the same number of properties.
			if (result) {
				for (key in b) {
					if (conbo.has(b, key) && !(size--)) break;
				}
				result = !size;
			}
		}
		// Remove the first object from the stack of traversed objects.
		aStack.pop();
		bStack.pop();
		return result;
	};

	/**
	 * Perform a deep comparison to check if two objects are equal.
	 * 
	 * @memberof	conbo
	 * @param		{object}	a - Object to compare
	 * @param		{object}	b - Object to compare
	 * @returns		{boolean}
	 */
	conbo.isEqual = function(a, b) 
	{
		return eq(a, b, [], []);
	};

	/**
	 * Is the value empty?
	 * Based on PHP's `empty()` method
	 * 
	 * @memberof	conbo
	 * @param		{any}		value - Value that might be empty
	 * @returns		{boolean}
	 */
	conbo.isEmpty = function(value)
	{
		return !value // 0, false, undefined, null, ""
			|| (conbo.isArray(value) && value.length === 0) // []
			|| (!isNaN(value) && !parseFloat(value)) // "0", "0.0", etc
			|| (conbo.isObject(value) && !conbo.keys(value).length) // {}
			|| (conbo.isObject(value) && 'length' in value && value.length === 0) // Arguments, List, etc
			;
	};
	
	/**
	 * Can the value be iterated using a for loop? For example an Array, Arguments, ElementsList, etc.
	 * 
	 * @memberof	conbo
	 * @param		{any}		obj - Object that might be iterable 
	 * @returns		{boolean}
	 */
	conbo.isIterable = function(obj)
	{
		return obj && obj.length === +obj.length;
	};
	
	/**
	 * Is a given value a DOM element?
	 * 
	 * @memberof	conbo
	 * @param		{object}	obj - Value that might be a DOM element
	 * @returns		{boolean}
	 */
	conbo.isElement = function(obj) 
	{
		return !!(obj && obj.nodeType === 1);
	};
	
	/**
	 * Is a given value an array?
	 * Delegates to ECMA5's native Array.isArray
	 * 
	 * @function
	 * @memberof	conbo
	 * @param		{object}	obj - Value that might be an Array
	 * @returns		{boolean}
	 */
	conbo.isArray = nativeIsArray || function(obj) 
	{
		return toString.call(obj) == '[object Array]';
	};

	/**
	 * Is a given variable an object?
	 * 
	 * @memberof	conbo
	 * @param		{object}	obj - Value that might be an Object
	 */
	conbo.isObject = function(obj) 
	{
		return obj === Object(obj);
	};

	// Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp.
	forEach(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'], function(name) 
	{
		conbo['is' + name] = function(obj) 
		{
			return toString.call(obj) == '[object ' + name + ']';
		};
	});

	// Define a fallback version of the method in browsers (ahem, IE), where
	// there isn't any inspectable "Arguments" type.
	if (!conbo.isArguments(arguments)) 
	{
		conbo.isArguments = function(obj) 
		{
			return !!(obj && conbo.has(obj, 'callee'));
		};
	}
	
	// Optimize `isFunction` if appropriate.
	if (typeof (/./) !== 'function') 
	{
		conbo.isFunction = function(obj) 
		{
			return typeof obj === 'function';
		};
	}
	
	/**
	 * Is a given object a finite number?
	 * 
	 * @memberof	conbo
	 * @param		{object}	obj - Value that might be finite
	 * @returns		{boolean}
	 */
	conbo.isFinite = function(obj) 
	{
		return isFinite(obj) && !isNaN(parseFloat(obj));
	};

	/**
	 * Is the given value `NaN`? (NaN is the only number which does not equal itself).
	 * 
	 * @memberof	conbo
	 * @param		{object}	obj - Value that might be NaN
	 * @returns		{boolean}
	 */
	conbo.isNaN = function(obj) 
	{
		return conbo.isNumber(obj) && obj != +obj;
	};

	/**
	 * Is a given value a boolean?
	 * 
	 * @memberof	conbo
	 * @param		{object}	obj - Value that might be a Boolean
	 * @returns		{boolean}
	 */
	conbo.isBoolean = function(obj) 
	{
		return obj === true || obj === false || toString.call(obj) == '[object Boolean]';
	};

	/**
	 * Is a given value equal to null?
	 * 
	 * @memberof	conbo
	 * @param		{object}	obj - Value that might be null
	 * @returns		{boolean}
	 */
	conbo.isNull = function(obj)
	{
		return obj === null;
	};

	/**
	 * Is a given variable undefined?
	 * 
	 * @memberof	conbo
	 * @param		{object}	obj - Value that might be undefined
	 * @returns		{boolean}
	 */
	conbo.isUndefined = function(obj) {
		return obj === undefined;
	};

	/**
	 * Shortcut function for checking if an object has a given property directly
	 * on itself (in other words, not on a prototype).
	 * 
	 * @memberof	conbo
	 * @param		{object}	obj - Object
	 * @param		{string}	key - Property name
	 * @returns		{boolean}
	 */
	conbo.has = function(obj, key)
	{
		return hasOwnProperty.call(obj, key);
	};
	
	// Utility Functions
	// -----------------

	/**
	 * Keep the identity function around for default iterators.
	 * 
	 * @memberof	conbo
	 * @param		{any}		obj - Value to return
	 * @returns		{any}
	 */
	conbo.identity = function(value) 
	{
		return value;
	};
	
	/**
	 * Get the property value
	 * 
	 * @memberof	conbo
	 * @param		{string}	key - Property name
	 */
	conbo.property = function(key) 
	{
		return function(obj) 
		{
			return obj[key];
		};
	};

	/**
	 * Returns a predicate for checking whether an object has a given set of `key:value` pairs.
	 * 
	 * @memberof	conbo
	 * @param		{object}	attrs - Object containing key:value pairs to compare
	 */
	conbo.matches = function(attrs) 
	{
		return function(obj) 
		{
			if (obj === attrs) return true; //avoid comparing an object to itself.
			
			for (var key in attrs) 
			{
				if (attrs[key] !== obj[key])
				{
					return false;
				}
			}
			return true;
		};
	};
	
	/**
	 * Return a random integer between min and max (inclusive).
	 * 
	 * @memberof	conbo
	 * @param		{number}	min - Minimum number
	 * @param		{number}	max - Maximum number
	 * @returns		{number}
	 */
	conbo.random = function(min, max)
	{
		if (max == null) 
		{
			max = min;
			min = 0;
		}
		
		return min + Math.floor(Math.random() * (max - min + 1));
	};
	
	var idCounter = 0;

	/**
	 * Generate a unique integer id (unique within the entire client session).
	 * Useful for temporary DOM ids.
	 * 
	 * @memberof	conbo
	 * @param		{string}	prefix - String to prefix unique ID with
	 */
	conbo.uniqueId = function(prefix) 
	{
		var id = ++idCounter + '';
		return prefix ? prefix + id : id;
	};
	
	/**
	 * Is Conbo supported by the current browser?
	 * 
	 * @memberof	conbo
	 */
	conbo.isSupported = 
		window.addEventListener
		&& !!Object.defineProperty 
		&& !!Object.getOwnPropertyDescriptor;
	
	/**
	 * Does nothing, returns undefined, that's it.
	 * 
	 * @memberof	conbo
	 */
	conbo.noop = function() {};
	
	/**
	 * Returns the value of the first parameter passed to it, that's it.
	 * 
	 * @memberof	conbo
	 */
	conbo.noopr = function(value) 
	{
		return value;
	};
	
	/**
	 * Default function to assign to the methods of pseudo-interfaces
	 * 
	 * @example	IExample = { myMethod:conbo.notImplemented };
	 * @memberof	conbo
	 */
	conbo.notImplemented = function() 
	{
		conbo.warn('Method not implemented');
	};
	
	/**
	 * Convert dash-or_underscore separated words into camelCaseWords
	 * 
	 * @memberof	conbo
	 * @param		{string}	string - underscore_case_string to convertToCamelCase
	 * @param		{boolean}	initCap - Should the first letter be a CapitalLetter? (default: false)
	 */
	conbo.toCamelCase = function(string, initCap)
	{
		var s = (string || '').toLowerCase().replace(/([\W_])([a-z])/g, function (g) { return g[1].toUpperCase(); }).replace(/(\W+)/, '');
		if (initCap) return s.charAt(0).toUpperCase() + s.slice(1);
		return s;
	};
	
	/**
	 * Convert camelCaseWords into underscore_case_words (or another user defined separator)
	 * 
	 * @memberof	conbo
	 * @param		{string}	string - camelCase string to convert to underscore_case
	 * @param		{string}	separator - Default: "_"
	 */
	conbo.toUnderscoreCase = function(string, separator)
	{
		separator || (separator = '_');
		return (string || '').replace(/\W+/g, separator).replace(/([a-z\d])([A-Z])/g, '$1'+separator+'$2').toLowerCase();
	};
	
	/**
	 * Convert camelCaseWords into kebab-case-words
	 * 
	 * @memberof	conbo
	 * @param		{string}	string - camelCase string to convert to underscore_case
	 */
	conbo.toKebabCase = function(string)
	{
		return conbo.toUnderscoreCase(string, '-');
	};
	
	conbo.padLeft = function(value, minLength, padChar)
	{
		if (!padChar && padChar !== 0) padChar = ' ';
		if (!value && value !== 0) value = '';
		
		minLength || (minLength = 2);
		
		padChar = padChar.toString().charAt(0);
		string = value.toString();
		
		while (string.length < minLength)
		{
			string = padChar+string;
		}
		
		return string;
	};
	
	/**
	 * Add a leading zero to the specified number and return it as a string
	 * @memberof 	conbo
	 * @param		{number}	number - The number to add a leading zero to
	 * @param		{number}	minLength - the minumum length of the returned string (default: 2)
	 */
	conbo.addLeadingZero = function(number, minLength)
	{
		return conbo.padLeft(number, minLength, 0);
	};
	
	/**
	 * Format a number using the selected number of decimals, using the 
	 * provided decimal point, thousands separator 
	 * 
	 * @memberof	conbo
	 * @see 		http://phpjs.org/functions/number_format/
	 * @param 		number
	 * @param 		decimals				default: 0
	 * @param 		decimalPoint			default: '.'
	 * @param 		thousandsSeparator		default: ','
	 * @returns		{string}				Formatted number
	 */
	conbo.formatNumber = function(number, decimals, decimalPoint, thousandsSeparator) 
	{
		number = (number+'').replace(/[^0-9+\-Ee.]/g, '');
		
		var n = !isFinite(+number) ? 0 : +number,
			prec = !isFinite(+decimals) ? 0 : Math.abs(decimals),
			sep = conbo.isUndefined(thousandsSeparator) ? ',' : thousandsSeparator,
			dec = conbo.isUndefined(decimalPoint) ? '.' : decimalPoint,
			s = n.toFixed(prec).split('.')
			;
		
		if (s[0].length > 3) 
		{
			s[0] = s[0].replace(/\B(?=(?:\d{3})+(?!\d))/g, sep);
		}
		
		if ((s[1] || '').length < prec) 
		{
			s[1] = s[1] || '';
			s[1] += new Array(prec-s[1].length+1).join('0');
		}
		
		return s.join(dec);
	};
	
	/**
	 * Format a number as a currency
	 * 
	 * @memberof	conbo
	 * @param number
	 * @param symbol
	 * @param suffixed
	 * @param decimals
	 * @param decimalPoint
	 * @param thousandsSeparator
	 */
	conbo.formatCurrency = function(number, symbol, suffixed, decimals, decimalPoint, thousandsSeparator)
	{
		if (conbo.isUndefined(decimals)) decimals = 2;
		symbol || (symbol = '');
		var n = conbo.formatNumber(number, decimals, decimalPoint, thousandsSeparator);
		return suffixed ? n+symbol : symbol+n;
	};
	
	/**
	 * Encodes all of the special characters contained in a string into HTML 
	 * entities, making it safe for use in an HTML document
	 * 
	 * @memberof	conbo
	 * @param string
	 */
	conbo.encodeEntities = function(string)
	{
		if (!conbo.isString(string))
		{
			string = conbo.isNumber(string)
				? string.toString()
				: '';
		}
		
		return string.replace(/[\u00A0-\u9999<>\&]/gim, function(char)
		{
			return '&#'+char.charCodeAt(0)+';';
		});
	};
	
	/**
	 * Decodes all of the HTML entities contained in an string, replacing them with
	 * special characters, making it safe for use in plain text documents
	 * 
	 * @memberof	conbo
	 * @param string
	 */
	conbo.decodeEntities = function(string) 
	{
		if (!conbo.isString(string)) string = '';
		
		return string.replace(/&#(\d+);/g, function(match, dec) 
		{
			return String.fromCharCode(dec);
		});
	};
	
	/**
	 * Copies all of the enumerable values from one or more objects and sets
	 * them to another, without affecting the target object's property
	 * descriptors.
	 * 
	 * Unlike conbo.defineValues, setValues only sets the values on the target 
	 * object and does not destroy and redifine them.
	 * 
	 * @memberof	conbo
	 * @param		{Object}	obj		Object to copy properties to
	 * 
	 * @example	
	 * conbo.setValues({id:1}, {get name() { return 'Arthur'; }}, {get age() { return 42; }});
	 * => {id:1, name:'Arthur', age:42}
	 */
	conbo.setValues = function(obj)
	{
		conbo.rest(arguments).forEach(function(source) 
		{
			if (!source) return;
			
			for (var propName in source) 
			{
				obj[propName] = source[propName];
			}
		});
		
		return obj;
	};
	
	/**
	 * Is the value a Conbo class?
	 * 
	 * @memberof	conbo
	 * @param		{any}		value - Value that might be a class
	 * @param		{class}		classReference - The Conbo class that the value must match or be an extension of (optional) 
	 */
	conbo.isClass = function(value, classReference)
	{
		return !!value 
			&& typeof value == 'function' 
			&& value.prototype instanceof (classReference || conbo.Class)
			;
	};
	
	/**
	 * Copies a property, including defined properties and accessors, 
	 * from one object to another
	 * 
	 * @memberof	conbo
	 * @param		{object}	source - Source object
	 * @param		{string}	sourceName - Name of the property on the source
	 * @param		{object}	target - Target object
	 * @param		{string} 	targetName - Name of the property on the target (default: sourceName)
	 */
	conbo.cloneProperty = function(source, sourceName, target, targetName)
	{
		targetName || (targetName = sourceName);
		
		var descriptor = Object.getOwnPropertyDescriptor(source, sourceName);
		
		if (!!descriptor)
		{
			Object.defineProperty(target, targetName, descriptor);
		}
		else 
		{
			target[targetName] = source[sourceName];
		}
		
		return this;
	};
	
	/**
	 * Sorts the items in an array according to one or more fields in the array. 
	 * The array should have the following characteristics:
	 * 
	 * <ul>
	 * <li>The array is an indexed array, not an associative array.</li>
	 * <li>Each element of the array holds an object with one or more properties.</li>
	 * <li>All of the objects have at least one property in common, the values of which can be used to sort the array. Such a property is called a field.</li>
	 * </ul>
	 * 
	 * @memberof	conbo
	 * @param		{array}		array - The Array to sort
	 * @param		{string}	fieldName - The field/property name to sort on
	 * @param		{object}	options - Optional sort criteria: `descending` (Boolean), `caseInsensitive` (Boolean)
	 */
	conbo.sortOn = function(array, fieldName, options)
	{
		options || (options = {});
		
		if (conbo.isArray(array) && fieldName)
		{
			array.sort(function(a, b)
			{
				var values = [a[fieldName], b[fieldName]];
				
				// Configure
				if (options.descending)
				{
					values.reverse();
				}
				
				if (options.caseInsensitive)
				{
					conbo.forEach(values, function(value, index)
					{
						if (conbo.isString(value)) values[index] = value.toLowerCase();
					});
				}
				
				// Sort
				if (values[0] < values[1]) return -1;
				if (values[0] > values[1]) return 1;
				return 0;
			});
		}
		
		return array;
	};
	
	/**
	 * Is the object an instance of the specified class(es) or implement the
	 * specified pseudo-interface(s)?
	 * 
	 * This method will always return false if the specified object is a Conbo
	 * class, because by it's nature a class is not an instance of anything.
	 * 
	 * @memberof	conbo
	 * @param		obj					The class instance
	 * @param		classOrInterface	The Conbo class or pseudo-interface to compare against
	 * @example							var b = conbo.instanceOf(obj, conbo.EventDispatcher);
	 * @example							var b = conbo.instanceOf(obj, conbo.View, conbo.IInjectable);
	 */
	conbo.instanceOf = function(obj, classOrInterface)
	{
		if (!obj || conbo.isClass(obj)) return false;
		
		var partials = conbo.rest(arguments);
		
		for (var p=0, c=partials.length; p<c; p++)
		{
			classOrInterface = partials[p];
			
			if (!classOrInterface) return false;
			
			try { if (obj instanceof classOrInterface) return true; }
			catch (e) {}
			
			if (conbo.isObject(classOrInterface))
			{
				for (var a in classOrInterface)
				{
					if (!(a in obj) || conbo.isFunction(obj[a]) != conbo.isFunction(classOrInterface[a])) 
					{
						return false;
					}
				}
			}
			else
			{
				return false;
			}
		}
		
		return true;
	};
	
	/**
	 * Loads a CSS file and apply it to the DOM
	 * 
	 * @memberof	conbo
	 * @param 		{String}	url		The CSS file's URL
	 * @param 		{String}	media	The media attribute (defaults to 'all')
	 */
	conbo.loadCss = function(url, media)
	{
		if (!('document' in window) || !!document.querySelector('[href="'+url+'"]'))
		{
			return this;
		}
		
		var link, head; 
			
		link = document.createElement('link');
		link.rel	= 'stylesheet';
		link.type = 'text/css';
		link.href = url;
		link.media = media || 'all';
		
		head = document.getElementsByTagName('head')[0];
		head.appendChild(link);
		
		return this;
	};
	
	/**
	 * Load a JavaScript file and execute it
	 * 
	 * @memberof	conbo
	 * @param 		{String}	url		The JavaScript file's URL
	 * @returns		conbo.Promise
	 */
	conbo.loadScript = function(url)
	{
		if (!$)
		{
			conbo.error('conbo.loadScript requires jQuery');
			return;
		}
		
		var promise = new conbo.Promise();
		
		$.getScript(url).done(function(script, status)
		{
			promise.dispatchResult(script);
		})
		.fail(function(xhr, settings, exception)
		{
			promise.dispatchFault(exception);
		});
		
		return promise;
	};
	
	/*
	 * Property utilities
	 */
	
	/**
	 * Return the names of all the enumerable properties on the specified object, 
	 * i.e. all of the keys that aren't functions
	 * 
	 * @memberof	conbo
	 * @see			#keys
	 * @param		obj			The object to list the properties of
	 * @param		useForIn	Whether or not to include properties further up the prorotype chain
	 */
	conbo.properties = function(obj, useForIn)
	{
		return conbo.difference(conbo.keys(obj, useForIn), conbo.functions(obj));
	};
	
	/**
	 * Makes the specified properties of an object bindable; if no property 
	 * names are passed, all enumarable properties will be made bindable
	 * 
	 * @memberof	conbo
	 * @see 		#makeAllBindable
	 * 
	 * @param		{String}		obj
	 * @param		{Array}			propNames (optional)
	 */
	conbo.makeBindable = function(obj, propNames)
	{
		propNames || (propNames = conbo.properties(obj));
		
		propNames.forEach(function(propName)
		{
			__defineProperty(obj, propName);
		});
		
		return this;
	};
	
	/**
	 * Makes all existing properties of the specified object bindable, and 
	 * optionally create additional bindable properties for each of the property 
	 * names passed in the propNames array
	 * 
	 * @memberof	conbo
	 * @see 		#makeBindable
	 * 
	 * @param		{String}		obj
	 * @param		{Array}			propNames (optional)
	 * @param		{useForIn}		Whether or not to include properties further up the prototype chain
	 */
	conbo.makeAllBindable = function(obj, propNames, useForIn)
	{
		propNames = conbo.uniq((propNames || []).concat(conbo.properties(obj, useForIn)));
		conbo.makeBindable(obj, propNames);
		
		return this;
	};
	
	/**
	 * Is the specified property an accessor (defined using a getter and/or setter)?
	 * 
	 * @memberof	conbo
	 * @returns		Boolean
	 */
	conbo.isAccessor = function(obj, propName)
	{
		if (obj)
		{
			return !!obj.__lookupGetter__(propName) 
				|| !!obj.__lookupSetter__(propName);
		}
		
		return false;
	};
	
	/**
	 * Is the specified property explicitely bindable?
	 * 
	 * @memberof	conbo
	 * @returns		Boolean
	 */
	conbo.isBindable = function(obj, propName)
	{
		if (!conbo.isAccessor(obj, propName))
		{
			return false;
		}
		
		return !!(obj.__lookupSetter__(propName) || {}).bindable;
	};
	
	/**
	 * Parse a template
	 * 
	 * @param	{string}	template - A string containing property names in {{moustache}} or ${ES2015} format to be replaced with property values
	 * @param	{object}	data - An object containing the data to be used to populate the template 
	 * @returns	{string}	The populated template
	 */
	conbo.parseTemplate = function(template, data)
	{
		if (!template) return "";
		
		data || (data = {});
		
		return template.replace(/(({{(.+?)}})|(\${(.+?)}))/g, function(propNameInBrackets, propName) 
		{
			var args = propName.split("|");
			var value, parseFunction;
			
			args[0] = conbo.BindingUtils.cleanPropertyName(args[0]);
			
			try { value = eval("data."+args[0]);			} catch(e) {}
			try { parseFunction = eval("data."+args[1]);	} catch(e) {}
			
			if (!conbo.isFunction(parseFunction)) 
			{
				parseFunction = conbo.BindingUtils.defaultParseFunction;
			}
			
			return parseFunction(value);
		});
	};
	
	/**
	 * Converts a template string into a pre-populated templating method that can 
	 * be evaluated for rendering.
	 * 
	 * @param	{string}	template - A string containing property names in {{moustache}} or ${ES2015} format to be replaced with property values
	 * @param	{object}	defaults - An object containing default values to use when populating the template (optional)
	 * @returns	{function}	A function that can be called with a data object, returning the populated template
	 */
	conbo.compileTemplate = function(template, defaults)
	{
		return function(data)
		{
			return conbo.parseTemplate(template, conbo.setDefaults(data || {}, defaults));
		}
	};
	
	/*
	 * Polyfill methods for useful ECMAScript 5 methods that aren't quite universal
	 */
	
	if (!String.prototype.trim) 
	{
		String.prototype.trim = function () 
		{
			return this.replace(/^\s+|\s+$/g,''); 
		};
	}
	
	if (!window.requestAnimationFrame)
	{
		window.requestAnimationFrame = (function()
		{
			return window.webkitRequestAnimationFrame
				|| window.mozRequestAnimationFrame
				|| function(callback)
				{
					window.setTimeout(callback, 1000 / 60);
				};
		})();
	}
	
	
	/*
	 * Logging
	 */
	
	/**
	 * Should Conbo output data to the console when calls are made to loggin methods?
	 * 
	 * @memberof	conbo
	 * @example
	 * conbo.logEnabled = false;
	 * conbo.log('Blah!');
	 * conbo.warn('Warning!');
	 * conbo.info('Information!'); 
	 * conbo.error('Error!');
	 * // Result: Nothing will be displayed in the console
	 */
	conbo.logEnabled = true;
	
	var logMethods = ['log','warn','info','error'];
	
	logMethods.forEach(function(method)
	{
		conbo[method] = function()
		{
			if (!console || !conbo.logEnabled) return;
			console[method].apply(console, arguments);		
		};
	});
	
})();


/*
 * Internal utility methods
 */

/**
 * Dispatch a property change event from the specified object
 * @private
 */
var __dispatchChange = function(obj, propName)
{
	if (!(obj instanceof conbo.EventDispatcher)) return;
	
	var options = {property:propName, value:obj[propName]};
	
	obj.dispatchEvent(new conbo.ConboEvent('change:'+propName, options));
	obj.dispatchEvent(new conbo.ConboEvent('change', options));
	
	return this;
};

/**
 * Creates a property which can be bound to DOM elements and others
 * 
 * @param	(Object)	obj			The EventDispatcher object on which the property will be defined
 * @param	(String)	propName	The name of the property to be defined
 * @param	(*)			value		The default value of the property (optional)
 * @param	(Function)	getter		The getter function (optional)
 * @param	(Function)	setter		The setter function (optional)
 * @param	(Boolean)	enumerable	Whether of not the property should be enumerable (optional, default: true)
 * @private
 */
var __defineProperty = function(obj, propName, value, getter, setter, enumerable)
{
	if (conbo.isAccessor(obj, propName))
	{
		return this;
	}
	
	if (conbo.isUndefined(value))
	{
		value = obj[propName];
	}
	
	var nogs = !getter && !setter;
	
	if (arguments.length < 6)
	{
		enumerable = propName.indexOf('_') !== 0;
	}
	
	if (nogs)
	{
		getter = function()
		{
			return value;
		};
	
		setter = function(newValue)
		{
			if (!conbo.isEqual(newValue, value)) 
			{
				value = newValue;
				__dispatchChange(this, propName, value);
			}
		};
		
		setter.bindable = true;
	}
	else if (!!setter)
	{
		setter = conbo.wrap(setter, function(fn, newValue)
		{
			fn.call(this, newValue);
			__dispatchChange(this, propName, obj[propName]);
		});
		
		setter.bindable = true;
	}
	
	Object.defineProperty(obj, propName, {enumerable:enumerable, configurable:true, get:getter, set:setter});
	
	return this;
};

/**
 * Define property that can't be enumerated
 * @private
 */
var __defineUnenumerableProperty = function(obj, propName, value)
{
	if (arguments.length == 2)
	{
		value = obj[propName];
	}
	
	Object.defineProperty(obj, propName, {enumerable:false, configurable:true, writable:true, value:value});
	return this;
};


/**
 * Define properties that can't be enumerated
 * @private
 */
var __defineUnenumerableProperties = function(obj, values)
{
	for (var key in values)
	{
		__defineUnenumerableProperty(obj, key, values[key]);
	}
	
	return this;
}

/**
 * Convert enumerable properties of the specified object into non-enumerable ones
 * @private
 */
var __denumerate = function(obj)
{
	var regExp = arguments[1];
	
	var keys = regExp instanceof RegExp
		? conbo.filter(conbo.keys(obj), function(key) { return regExp.test(key); })
		: (arguments.length > 1 ? conbo.rest(arguments) : conbo.keys(obj));
	
	keys.forEach(function(key)
	{
		var descriptor = Object.getOwnPropertyDescriptor(obj, key) 
			|| {value:obj[key], configurable:true, writable:true};
		
		descriptor.enumerable = false;
		Object.defineProperty(obj, key, descriptor);
	});
	
	return this;
};

/*
 * DOM functions and utility methods that require jQuery
 * @author		Neil Rackett
 */

/**
 * Initialize Applications in the DOM using the specified namespace
 * 
 * By default, Conbo scans the entire DOM, but you can limit the
 * scope by specifying a root element
 * 
 * @memberof	conbo
 * @param		{conbo.Namespace} namespace
 * @param		{Element} rootEl - Top most element to scan (optional)
 */
conbo.initDom = function(namespace, rootEl)
{
	if (!namespace)
	{
		throw new Error('initDom: namespace is undefined');
	}
	
	if (conbo.isString(namespace))
	{
		namespace = conbo(namespace);
	}
	
	var $rootEl = $(rootEl || 'html');
	
	$(function()
	{
		$rootEl.find('*').not('.cb-app').each(function(index, el)
	   	{
			var $el = $(el)
	   		  , appName = $el.attr('cb-app') || conbo.toCamelCase(el.tagName, true)
	   		  , appClass = namespace[appName]
	   		  ;
	   		
	   		if (appClass 
	   			&& conbo.isClass(appClass, conbo.Application))
	   		{
	   			new appClass({el:el});
	   		}
	   	});
	});
	
	return this;	
};

/**
 * @private
 */
var __observers = [];

/**
 * @private
 */
var __getObserverIndex = function(namespace, rootEl)
{
	var length = __observers.length;
	
	for (var i=0; i<length; i++)
	{
		var observer = __observers[i];
		
		if (observer[0] == namespace && observer[1] == rootEl)
		{
			return i;
		}
	}
	
	return -1;
};

/**
 * Watch the DOM for new Applications using the specified namespace
 * 
 * By default, Conbo watches the entire DOM, but you can limit the
 * scope by specifying a root element
 * 
 * @memberof	conbo
 * @param		{conbo.Namespace} namespace
 * @param		{Element} rootEl - Top most element to observe (optional)
 */
conbo.observeDom = function(namespace, rootEl)
{
	if (conbo.isString(namespace))
	{
		namespace = conbo(namespace);
	}
	
	if (__getObserverIndex(namespace, rootEl) != -1)
	{
		return;
	}
	
	var mo;
	var $rootEl = $(rootEl || 'html');
	
	mo = new conbo.MutationObserver();
	mo.observe($rootEl[0]);
	
	mo.addEventListener(conbo.ConboEvent.ADD, function(event)
	{
		event.nodes.forEach(function(node)
		{
			var $node = $(node);
			var appName = $node.cbAttrs().app;
			
			if (namespace[appName] && !$node.hasClass('cb-app'))
			{
				new namespace[appName]({el:node});
			}
		});
	});
	
	__observers.push([namespace, rootEl, mo]);
	
	return this;
};

/**
 * Stop watching the DOM for new Applications
 * 
 * @memberof	conbo
 * @param		{conbo.Namespace} namespace
 * @param		{Element} rootEl - Top most element to observe (optional)
 */
conbo.unobserveDom = function(namespace, rootEl)
{
	if (conbo.isString(namespace))
	{
		namespace = conbo(namespace);
	}
	
	var i = __getObserverIndex(namespace, rootEl);
	
	if (i != -1)
	{
		var observer = __observers[i];
		
		observer[2].removeEventListener();
		__observers.slice(i,1);
	}
	
	return this;
};

if (!!$)
{
	/**
	 * Get or set the value of all attributes on a DOM element
	 * 
	 * @memberof	conbo.$
	 * @param 		{object}	attrs - Attributes to set (optional)
	 * 
	 * @example
	 * $el.attrs(); // Returns all attributes as an Object
	 * $el.attrs({foo:"bar", fast:"car"}); // Sets foo and bar attributes
	 */
	$.fn.attrs = function(attrs) 
	{
		var $el = $(this);
		
		// Set
		if (arguments.length) 
		{
			$el.each(function(i, el) 
			{
				var $j = $(el);
				
				for (var attr in attrs) 
				{
					$j.attr(attr, attrs[attr]);
				}
			});
			
			return $el;
		} 
		// Get
		else 
		{
			var a = {};
			
			conbo.forEach($el[0].attributes, function(p)
			{
				a[conbo.toCamelCase(p.nodeName)] = p.nodeValue;
			});
			
			return a;
		}
	};
	
	/**
	 * Return object containing the value of all cb-* attributes on a DOM element
	 * 
	 * @memberof	conbo.$
	 * @param 		{boolean}	camelCase - Should the property names be converted to camelCase? (default: true)
	 * 
	 * @example
	 * $el.cbAttrs();
	 */
	$.fn.cbAttrs = function(camelCase)
	{
		var data = {},
			attrs = conbo.toArray(this.get()[0].attributes),
			count = 0,
			propertyName;
		
		for (var i=0; i<attrs.length; ++i)
		{
			if (attrs[i].name.indexOf('cb-') !== 0) continue;
			
			propertyName = attrs[i].name.substr(3);
			
			if (camelCase !== false)
			{
				propertyName = conbo.toCamelCase(propertyName);
			}
			
			data[propertyName] = attrs[i].value;
		}
		
		return data;
	};
	
	/**
	 * jQuery method to select child elements related to View or Glimpse 
	 * class instances
	 * 
	 * @memberof	conbo.$
	 * @param 		{class}		viewClass - View or Glimpse class to search for
	 * 
	 * @example
	 * $el.cbViews(myNamespace.MyViewClass);
	 */
	$.fn.cbViews = function(viewClass)
	{
		return this.find('.cb-view, .cb-glimpse').filter(function()
		{
			return conbo.instanceOf(this.cbView || this.cbGlimpse, viewClass);
		});
	};
	
	/**
	 * Find elements based on their cb-attribute
	 * @memberof	conbo.$
	 * 
	 * @example
	 * $(':cbAttr');
	 * $('div:cbAttr');
	 */
	$.expr[':'].cbAttr = function(el, index, meta, stack)
	{
		var $el = $(el),
			args = (meta[3] || '').split(','),
			attrs = $el.cbAttrs(),
			keys = conbo.keys(attrs)
			;
		
		if (!keys.length) return false;
		if (!!attrs && !args.length) return true;
		if (!!args[0] && !args[1]) return args[0] in attrs;
		if (!!args[0] && !!args[1]) return attrs[args[0]] == args[1];
		return false;
	};
	
}
/*
 * CSS styles and utilities
 * @author 	Neil Rackett
 */

if (!!$)
{
	var $head = $('head');
	
	if (!!$head.find('#cb-style').length)
	{
		return;
	}
	
	$head.append
	(
		'<style id="cb-style" type="text/css">'+
			'\n.cb-hide { visibility:hidden !important; }'+
			'\n.cb-exclude { display:none !important; }'+
			'\n.cb-disable { pointer-events:none !important; cursor:default !important; }'+
			'\n.cb-app span { font:inherit; color:inherit; }'+
		'\n</style>'
	);
}

/**
 * Class
 * Extendable base class from which all others extend
 * @class		conbo.Class
 * @param 		{object} options - Object containing initialisation options
 */
conbo.Class = function(options) 
{
	this.preinitialize.apply(this, arguments);
	this.initialize.apply(this, arguments);
};

/**
 * @memberof conbo.Class
 */
conbo.Class.prototype =
{
	/**
	 * Preinitialize
	 * 
	 * If the constructor has now been overridden, preinitialize is called 
	 * before any code in the constructor has been run
	 */
	preinitialize: function() {},
	
	/**
	 * Initialize (entry point)
	 * 
	 * If the constructor has now been overridden, initialize is called 
	 * immediately after the constructor has completed
	 */
	initialize: function() {},
	
	/**
	 * Similar to `super` in ActionScript or Java, this property enables 
	 * you to access properties and methods of the super class prototype, 
	 * which is the case of JavaScript is the next prototype up the chain
	 */
	get supro()
	{
		return Object.getPrototypeOf(Object.getPrototypeOf(this));
	},
	
	/**
	 * Scope one or more methods to this class instance
	 * @param 	{function} method - The function to bind to this class instance
	 * @returns	this
	 */
	bind: function(method)
	{
		return conbo.bind.apply(conbo, [method, this].concat(conbo.rest(arguments)));
	},
	
	/**
	 * Scope all methods of this class instance to this class instance
	 * @returns this
	 */
	bindAll: function()
	{
		conbo.bindAll.apply(conbo, [this].concat(conbo.toArray(arguments)));
		return this;
	},
	
	toString: function()
	{
		return 'conbo.Class';
	},
};

__denumerate(conbo.Class.prototype);

/**
 * Extend this class to create a new class
 * 
 * @memberof 	conbo.Class
 * @param		{object}	protoProps - Object containing the new class's prototype
 * @param		{object}	staticProps - Object containing the new class's static methods and properties
 * 
 * @example		
 * var MyClass = conbo.Class.extend
 * ({
 * 	doSomething:function()
 * 	{ 
 * 		console.log(':-)'); 
 * 	}
 * });
 */
conbo.Class.extend = function(protoProps, staticProps)
{
	var child, parent=this;
	
	/**
	 * The constructor function for the new subclass is either defined by you
	 * (the 'constructor' property in your `extend` definition), or defaulted
	 * by us to simply call the parent's constructor.
	 */
	child = protoProps && conbo.has(protoProps, 'constructor')
		? protoProps.constructor
		: function() { return parent.apply(this, arguments); };
	
	conbo.defineValues(child, parent, staticProps);
	
	/**
	 * Set the prototype chain to inherit from parent, without calling
	 * parent's constructor
	 */
	var Surrogate = function(){ this.constructor = child; };
	Surrogate.prototype = parent.prototype;
	child.prototype = new Surrogate();
	
	if (protoProps)
	{
		conbo.defineValues(child.prototype, protoProps);
	}
	
	conbo.makeBindable(child.prototype);
	
	return child;
};

/**
 * Implements the specified pseudo-interface(s) on the class, copying 
 * the default methods or properties from the partial(s) if they have 
 * not already been implemented.
 * 
 * @memberof	conbo.Class
 * @param		{Object} interface - Object containing one or more properties or methods to be implemented (an unlimited number of parameters can be passed)
 * 
 * @example
 * var MyClass = conbo.Class.extend().implement(conbo.IInjectable);
 */
conbo.Class.implement = function()
{
	var implementation = conbo.defineDefaults.apply(conbo, conbo.union([{}], arguments)),
		keys = conbo.keys(implementation),
		prototype = this.prototype;
	
	conbo.defineDefaults(this.prototype, implementation);
	
	var rejected = conbo.reject(keys, function(key)
	{
		return prototype[key] !== conbo.notImplemented;
	});
	
	if (rejected.length)
	{
		throw new Error(prototype.toString()+' does not implement the following method(s): '+rejected.join(', '));
	}
	
	return this;
};

/**
 * Conbo class
 * 
 * Base class for most Conbo framework classes that calls preinitialize before 
 * the constructor and initialize afterwards, populating the options parameter
 * with an empty Object if no parameter is passed and automatically making all
 * properties bindable.
 * 
 * @class		conbo.ConboClass
 * @augments	conbo.Class
 * @author		Neil Rackett
 * @param 		{object}	options - Class configuration object
 */
conbo.ConboClass = conbo.Class.extend(
/** @lends conbo.ConboClass.prototype */
{
	/**
	 * Constructor: DO NOT override! (Use initialize instead)
	 * @param 	{object}	options - Class configuration object
	 */
	constructor: function(options)
	{
		var args = conbo.toArray(arguments);
		if (args[0] === undefined) args[0] = {};
		
		this.preinitialize.apply(this, args);
		this.__construct.apply(this, args);
		
		this.initialize.apply(this, args);
		conbo.makeAllBindable(this, this.bindable);
		this.__initialized.apply(this, args);
	},
	
	toString: function()
	{
		return 'conbo.ConboClass';
	},
	
	__construct: function() {},
	__initialized: function() {}
	
});

__denumerate(conbo.ConboClass.prototype);

/**
 * Conbo namespaces enable you to create modular, encapsulated code, similar to
 * how you might use packages in languages like Java or ActionScript.
 * 
 * By default, namespaces will automatically call initDom() when the HTML page
 * has finished loading.
 * 
 * @class		conbo.Namespace
 * @augments	conbo.Class
 * @author 		Neil Rackett
 * @param 		{object} options - Object containing initialisation options
 */
conbo.Namespace = conbo.ConboClass.extend(
/** @lends conbo.Namespace.prototype */
{
	__construct: function()
	{
		if ($)
		{
			// Automatically initializes the DOM when the page is completely loaded
			var init = this.bind(function()
			{
				if (this.autoInit !== false)
				{
					this.initDom();
				}
			});
			
			$(init);
		}
	},
	
	/**
	 * Search the DOM and initialize Applications contained in this namespace
	 * 
	 * @param 	{Element} 	rootEl - The root element to initialize (optional)
	 * @returns {this}
	 */
	initDom: function(rootEl)
	{
		conbo.initDom(this, rootEl);
		return this;
	},
	
	/**
	 * Watch the DOM and automatically initialize Applications contained in 
	 * this namespace when an element with the appropriate cb-app attribute
	 * is added.
	 * 
	 * @param 	{Element} 	rootEl - The root element to initialize (optional)
	 * @returns {this}
	 */
	observeDom: function(rootEl)
	{
		conbo.observeDom(this, rootEl);
		return this;
	},
	
	/**
	 * Stop watching the DOM for Applications
	 * 
	 * @param 	{Element} 	rootEl - The root element to initialize (optional)
	 * @returns {this}
	 */
	unobserveDom: function(rootEl)
	{
		conbo.unobserveDom(this, rootEl);
		return this;
	},
	
	/**
	 * Add classes, properties or methods to the namespace. Using this method
	 * will not overwrite existing items of the same name.
	 * 
	 * @param 	{object}	obj - An object containing items to add to the namespace 
	 * @returns	{this}
	 */
	extend: function(obj)
	{
		conbo.setDefaults.apply(conbo, [this].concat(conbo.toArray(arguments)));
		return this;
	},
	
});

/**
 * Partial class that enables the ConboJS framework to add the application
 * specific Context class instance and inject specified dependencies 
 * (properties of undefined value which match registered singletons); should
 * be used via the Class.implement method
 * 
 * @augments	conbo
 * @example		var C = conbo.Class.extend().implement(conbo.IInjectable);
 * @author		Neil Rackett
 */
conbo.IInjectable =
{
	get context()
	{
		return this.__context;
	},
	
	set context(value)
	{
		if (value == this.__context) return;
		
		if (value instanceof conbo.Context) 
		{
			value.injectSingletons(this);
		}
		
		this.__context = value;
		
		__denumerate(this, '__context');
	}
	
};

/**
 * Event class
 * 
 * Base class for all events triggered in ConboJS
 * 
 * @class		conbo.Event
 * @augments	conbo.Class
 * @author		Neil Rackett
 * @param 		{string}	type - The type of event this object represents
 */
conbo.Event = conbo.Class.extend(
/** @lends conbo.Event.prototype */
{
	/**
	 * Constructor: DO NOT override! (Use initialize instead)
	 * @param options
	 */
	constructor: function(type)
	{
		this.preinitialize.apply(this, arguments);
		
		if (conbo.isString(type)) 
		{
			this.type = type;
		}
		else 
		{
			conbo.defineDefaults(this, type);
		}
		
		if (!this.type) 
		{
			throw new Error('Invalid or undefined event type');
		}
		
		this.initialize.apply(this, arguments);
	},
	
	/**
	 * Initialize: Override this!
	 * @param type
	 */
	initialize: function(type, data)
	{
		this.data = data;
	},
	
	/**
	 * Create an identical clone of this event
	 * @returns 	Event
	 */
	clone: function()
	{
		return conbo.clone(this);
	},
	
	/**
	 * Prevent whatever the default framework action for this event is
	 */
	preventDefault: function() 
	{
		this.defaultPrevented = true;
		
		return this;
	},
	
	/**
	 * Not currently used
	 */
	stopPropagation: function() 
	{
		this.cancelBubble = true;
		
		return this;
	},
	
	/**
	 * Keep the rest of the handlers from being executed
	 */
	stopImmediatePropagation: function() 
	{
		this.immediatePropagationStopped = true;
		this.stopPropagation();
		
		return this;
	},
	
	toString: function()
	{
		return 'conbo.Event';
	}
},
/** @lends conbo.Event */
{
	ALL: '*',
});

__denumerate(conbo.Event.prototype);

/**
 * conbo.Event
 * 
 * Default event class for events fired by ConboJS
 * 
 * For consistency, callback parameters of Backbone.js derived classes 
 * are event object properties in ConboJS
 * 
 * @class		conbo.ConboEvent
 * @augments	conbo.Event
 * @author		Neil Rackett
 * @param 		{string}	type - The type of event this object represents
 * @param 		{object}	options - Properties to be added to this event object
 */
conbo.ConboEvent = conbo.Event.extend(
/** @lends conbo.ConboEvent.prototype */
{
	initialize: function(type, options)
	{
		conbo.defineDefaults(this, options);
	},
	
	toString: function()
	{
		return 'conbo.ConboEvent';
	}
},
/** @lends conbo.ConboEvent */
{
	/** Special event fires for any triggered event */
	ALL:					'*',
	
	/** When a save call fails on the server (Properties: model, xhr, options) */
	ERROR:					'error',
	
	/** (Properties: model, error, options) when a model's validation fails on the client */	
	INVALID:				'invalid', 			

	/**
	 * When a Bindable instance's attributes have changed (Properties: property, value)
	 * Also, `change:[attribute]` when a specific attribute has been updated (Properties: property, value)								
	 */
	CHANGE:					'change',
	
	/** when a model is added to a collection (Properties: model, collection, options) */
	ADD:					'add', 				

	/**
	 * When a model is removed from a collection (Properties: model, collection, options)
	 * or a View's element has been removed from the DOM
	 */
	REMOVE:					'remove',

	/** (Properties: model, collection, options) when a model is destroyed */
	DESTROY:				'destroy', 			

	/** (Properties: collection, options) when the collection's entire contents have been replaced */
	RESET:					'reset', 			

	/** (Properties: collection, options) when the collection has been re-sorted */
	SORT:					'sort', 			

	/** (Properties: model, xhr, options) when a model (or collection) has started a request to the server */	
	REQUEST:				'request', 			

	/** (Properties: model, response, options) when a model (or collection) has been successfully synced with the server */
	SYNC:					'sync',

	/**
	 * (Properties: router, route, params) Fired by history (or router) when any route has been matched
	 * Also, 'route:[name]' // (Properties: params) Fired by the router when a specific route is matched 
	 */
	ROUTE:					'route', 			
											
	/** Dispatched by history (or router) when the path changes, regardless of whether the route has changed */
	NAVIGATE:				'navigate',

	/** A process, e.g. history, has started */
	STARTED:				'started',

	/** A process, e.g. history, has stopped */
	STOPPED:				'stopped',
	
	// View
	
	/** Template data has been loaded into the View and can now be manipulated in the DOM */
	TEMPLATE_LOADED:		'templateloaded',

	/** An error occurred while loading the template */
	TEMPLATE_ERROR:			'templateerror',

	/** Fired by an element after having one or more property bound to it by Conbo */
	BIND:					'bind',

	/** All elements in HTML have been bound to the View */
	BOUND:					'bound',			

	/** All elements in HTML have been unbound from the View */
	UNBOUND:				'unbound',			

	/** For a View, this means template loaded, elements bound, DOM rendered */
	INIT:					'init',				  

	/** The View has been detached from the DOM */
	DETACH:					'detach',
	
	// Web Services & Promises
	
	/** A result has been received */
	RESULT:					'result',
	
	/** A fault has occurred */
	FAULT:					'fault',			
	
});

__denumerate(conbo.ConboEvent.prototype);

/**
 * Event Dispatcher
 * 
 * Event model designed to bring events into line with DOM events and those 
 * found in HTML DOM, jQuery and ActionScript 2 & 3, offering a more 
 * predictable, object based approach to event dispatching and handling
 * 
 * Should be used as the base class for any class that won't be used for 
 * data binding
 * 
 * @class		conbo.EventDispatcher
 * @augments	conbo.Class
 * @author		Neil Rackett
 * @param 		{object} options - Object containing optional initialisation options, including 'context'
 */
conbo.EventDispatcher = conbo.ConboClass.extend(
/** @lends conbo.EventDispatcher.prototype */
{
	/**
	 * Do not override: use initialize
	 * @private
	 */
	__construct: function(options)
	{
		if (!!options.context)
		{
			this.context = options.context;
		}
	},
	
	/**
	 * Add a listener for a particular event type
	 * 
	 * @param type		{string}	Type of event ('change') or events ('change blur')
	 * @param handler	{function}	Function that should be called
	 * @param scope		{object}	The scope in which to run the event handler (optional)
	 * @param priority	{number}	The event handler's priority when the event is dispatached (default: 0)
	 * @param once		{boolean}	Should the event listener automatically be removed after it has been called once? (default: false) 
	 */
	addEventListener: function(type, handler, scope, priority, once)
	{
		if (!type) throw new Error('Event type undefined');
		if (!handler || !conbo.isFunction(handler)) throw new Error('Event handler is undefined or not a function');

		if (conbo.isString(type)) type = type.split(' ');
		if (conbo.isArray(type)) conbo.forEach(type, function(value, index, list) { this.__addEventListener(value, handler, scope, priority, !!once); }, this);
		
		return this;
	},
	
	/**
	 * Remove a listener for a particular event type
	 * 
	 * @param type		{string}	Type of event ('change') or events ('change blur') (optional: if not specified, all listeners will be removed) 
	 * @param handler	{function}	Function that should be called (optional: if not specified, all listeners of the specified type will be removed)
	 * @param scope		{object} 	The scope in which the handler is set to run (optional)
	 */
	removeEventListener: function(type, handler, scope)
	{
		if (!arguments.length)
		{
			__defineUnenumerableProperty(this, '__queue', {});
			return this;
		}
		
		if (conbo.isString(type)) type = type.split(' ');
		if (!conbo.isArray(type)) type = [undefined];
		
		conbo.forEach(type, function(value, index, list) 
		{
			this.__removeEventListener(value, handler, scope); 
		}, 
		this);
		
		return this;
	},
	
	/**
	 * Does this object have an event listener of the specified type?
	 * 
	 * @param type		{string}	Type of event (e.g. 'change') 
	 * @param handler	{function}	Function that should be called (optional)
	 * @param scope		{object} 	The scope in which the handler is set to run (optional)
	 */
	hasEventListener: function(type, handler, scope)
	{
		if (!this.__queue 
			|| !(type in this.__queue)
			|| !this.__queue[type].length)
		{
			return false;
		}
		
		var queue = this.__queue[type];
		var length = queue.length;
		
		for (var i=0; i<length; i++)
		{
			if ((!handler || queue[i].handler == handler) 
				&& (!scope || queue[i].scope == scope))
			{
				return true;
			}
		}
		
		return false;
	},
	
	/**
	 * Dispatch the event to listeners
	 * @param event		conbo.Event class instance or event type (e.g. 'change')
	 */
	dispatchEvent: function(event)
	{
		if (!event) throw new Error('Event undefined');
		
		var isString = conbo.isString(event);
		
		if (isString)
		{
			conbo.warn('Use of dispatchEvent("'+event+'") is deprecated, please use dispatchEvent(new conbo.Event("'+event+'"))');
		}
		
		if (isString || !(event instanceof conbo.Event))
		{
			event = new conbo.Event(event);
		}
		
		if (!this.__queue || (!(event.type in this.__queue) && !this.__queue.all)) return this;
		
		if (!event.target) event.target = this;
		event.currentTarget = this;
		
		var queue = conbo.union(this.__queue[event.type] || [], this.__queue.all || []);
		if (!queue || !queue.length) return this;
		
		for (var i=0, length=queue.length; i<length; ++i)
		{
			var value = queue[i];
			var returnValue = value.handler.call(value.scope || this, event);
			if (value.once) this.__removeEventListener(event.type, value.handler, value.scope);
			if (returnValue === false || event.immediatePropagationStopped) break;
		}
		
		return this;
	},
	
	/**
	 * Dispatch a change event for one or more changed properties
	 * @param propName
	 */
	dispatchChange: function()
	{
		conbo.forEach(arguments, function(propName)
		{
			__dispatchChange(this, propName);
		},
		this);
		
		return this;
	},

	toString: function()
	{
		return 'conbo.EventDispatcher';
	},

	/**
	 * @private
	 */
	__addEventListener: function(type, handler, scope, priority, once)
	{
		if (type == '*') type = 'all';
		if (!this.__queue) __defineUnenumerableProperty(this, '__queue', {});
		
		if (!this.hasEventListener(type, handler, scope))
		{
			if (!(type in this.__queue)) this.__queue[type] = [];
			this.__queue[type].push({handler:handler, scope:scope, once:once, priority:priority||0});
			this.__queue[type].sort(function(a,b){return b.priority-a.priority;});
		}
	},
	
	/**
	 * @private
	 */
	__removeEventListener: function(type, handler, scope)
	{
		if (type == '*') type = 'all';
		if (!this.__queue) return;
		
		var queue, 
			i, 
			self = this;
		
		var removeFromQueue = function(queue, key)
		{
			for (i=0; i<queue.length; i++)
			{
				if ((!queue[i].handler || queue[i].handler == handler)
					&& (!queue[i].scope || queue[i].scope == scope))
				{
					queue.splice(i--, 1);
				}
			}
			
			if (!queue.length)
			{
				delete self.__queue[key];
			}
		};
		
		if (type in this.__queue)
		{
			queue = this.__queue[type];
			removeFromQueue(queue, type);
		}
		else if (type == undefined)
		{
			conbo.forEach(this.__queue, function(queue, key)
			{
				removeFromQueue(queue, key);
			});
		}
	},
	
}).implement(conbo.IInjectable);

__defineUnenumerableProperty(conbo.EventDispatcher.prototype, 'bindable');
__denumerate(conbo.EventDispatcher.prototype);

/**
 * conbo.Context
 * 
 * This is your application's event bus and dependency injector, and is
 * usually where all your models and web service classes are registered,
 * using mapSingleton(...), and Command classes are mapped to events 
 * 
 * @class		conbo.Context
 * @augments	conbo.EventDispatcher
 * @author		Neil Rackett
 * @param 		{object} options - Object containing initialisation options, including 'app' (Application) and 'namespace' (Namespace) 
 */
conbo.Context = conbo.EventDispatcher.extend(
/** @lends conbo.Context.prototype */
{
	/**
	 * Constructor: DO NOT override! (Use initialize instead)
	 * @param options
	 */
	__construct: function(options)
	{
		__defineUnenumerableProperties(this, 
		{
			__commands: {},
			__singletons: {},
			__app: options.app,
			__namespace: options.namespace || options.app.namespace,
			__parentContext: options instanceof conbo.Context ? options : undefined
		});
		
		this.addEventListener(conbo.Event.ALL, this.__allHandler);
	},
	
	/**
	 * The Application instance associated with this context
	 * @returns {conbo.Application}
	 */
	get app()
	{
		return this.__app;
	},
	
	/**
	 * The Namespace this context exists in
	 * @returns {conbo.Namespace}
	 */
	get namespace()
	{
		return this.__namespace;
	},
	
	/**
	 * If this is a subcontext, this is a reference to the Context that created it
	 * @returns {conbo.Context}
	 */
	get parentContext()
	{
		return this.__parentContext;
	},
	
	/**
	 * Create a new subcontext that shares the same application
	 * and namespace as this one
	 * 
	 * @param	The context class to use (default: conbo.Context)
	 * @returns {conbo.Context}
	 */
	createSubcontext: function(contextClass)
	{
		contextClass || (contextClass = conbo.Context);
		return new contextClass(this);
	},
	
	/**
	 * Map specified Command class the given event
	 */
	mapCommand: function(eventType, commandClass)
	{
		if (!eventType) throw new Error('eventType cannot be undefined');
		if (!commandClass) throw new Error('commandClass for '+eventType+' cannot be undefined');
		
		if (this.__mapMulti(eventType, commandClass, this.mapCommand)) return;
		
		if (this.__commands[eventType] && this.__commands[eventType].indexOf(commandClass) != -1)
		{
			return;
		}
		
		this.__commands[eventType] = this.__commands[eventType] || [];
		this.__commands[eventType].push(commandClass);
		
		return this;
	},
	
	/**
	 * Unmap specified Command class from given event
	 */
	unmapCommand: function(eventType, commandClass)
	{
		if (!eventType) throw new Error('eventType cannot be undefined');
		if (this.__mapMulti(eventType, commandClass, this.unmapCommand)) return;
		
		if (commandClass === undefined)
		{
			delete this.__commands[eventType];
			return;
		}
		
		if (!this.__commands[eventType]) return;
		var index = this.__commands[eventType].indexOf(commandClass);
		if (index == -1) return;
		this.__commands[eventType].splice(index, 1);
		
		return this;
	},
	
	/**
	 * Map class instance to a property name
	 * 
	 * To inject a property into a class, register the property name
	 * with the Context and declare the value as undefined in your class
	 * to enable it to be injected at run time
	 * 
	 * @example		context.mapSingleton('myProperty', MyModel);
	 * @example		myProperty: undefined
	 */
	mapSingleton: function(propertyName, singletonClass)
	{
		if (!propertyName) throw new Error('propertyName cannot be undefined');
		
		if (singletonClass === undefined)
		{
			conbo.warn('singletonClass for '+propertyName+' is undefined');
		}
		
		if (this.__mapMulti(propertyName, singletonClass, this.mapSingleton)) return;
		
		this.__singletons[propertyName] = conbo.isClass(singletonClass)
			// TODO Improved dynamic class instantiation
			? new singletonClass(arguments[2], arguments[3], arguments[4])
			: singletonClass;
			
		return this;
	},
	
	/**
	 * Unmap class instance from a property name
	 */
	unmapSingleton: function(propertyName)
	{
		if (!propertyName) throw new Error('propertyName cannot be undefined');
		if (this.__mapMulti(propertyName, null, this.unmapSingleton)) return;
		
		if (!this.__singletons[propertyName]) return;
		delete this.__singletons[propertyName];
		
		return this;
	},
	
	/**
	 * Map constant value to a property name
	 * 
	 * To inject a constant into a class, register the property name
	 * with the Context and declare the property as undefined in your 
	 * class to enable it to be injected at run time
	 * 
	 * @example		context.mapConstant('MY_VALUE', 123);
	 * @example		MY_VALUE: undefined
	 */
	mapConstant: function(propertyName, value)
	{
		return this.mapSingleton(propertyName, value);
	},
	
	/**
	 * Unmap constant value from a property name
	 */
	unmapConstant: function(propertyName)
	{
		return this.unmapSingleton(propertyName);
	},
	
	/**
	 * Add this Context to the specified Object, or create an object with a 
	 * reference to this Context
	 */
	addTo: function(obj)
	{
		return conbo.defineValues(obj || {}, {context:this});
	},
	
	/**
	 * Inject singleton instances into specified object
	 * 
	 * @param	obj		{object} 	The object to inject singletons into
	 */
	injectSingletons: function(obj)
	{
		for (var a in obj)
		{
			if (obj[a] !== undefined) continue;
			
			if (a in this.__singletons)
			{
				obj[a] = this.__singletons[a];
			}
		}
		
		return this;
	},
	
	/**
	 * Set all singleton instances on the specified object to undefined
	 * 
	 * @param	obj		{object} 	The object to remove singletons from
	 */
	uninjectSingletons: function(obj)
	{
		for (var a in obj)
		{
			if (a in this.__singletons)
			{
				obj[a] = undefined;
			}
		}
		
		return this;
	},
	
	toString: function()
	{
		return 'conbo.Context';
	},
	
	/**
	 * @private
	 */
	__allHandler: function(event)
	{
		var commands = conbo.union(this.__commands.all || [], this.__commands[event.type] || []);
		if (!commands.length) return;
		
		conbo.forEach(commands, function(commandClass, index, list)
		{
			this.__executeCommand(commandClass, event);
		}, 
		this);
	},
	
	/**
	 * @private
	 */
	__executeCommand: function(commandClass, event)
	{
		var command, options;
		
		options = {event:event};
		
		command = new commandClass(this.addTo(options));
		command.execute();
		command = null;
		
		return this;
	},
	
	/**
	 * @private
	 */
	__mapMulti: function(n, c, f)
	{
		if (conbo.isArray(n) || n.indexOf(' ') == -1) return false;
		var names = conbo.isArray(n) ? n : n.split(' ');
		conbo.forEach(names, function(e) { f(e,c); }, this);
		return true;
	}
	
});

__denumerate(conbo.Context.prototype);

/**
 * conbo.Hash
 * A Hash is a bindable object of associated keys and values
 * 
 * @class		conbo.Hash
 * @augments	conbo.EventDispatcher
 * @author 		Neil Rackett
 * @param 		{object} options - Object containing optional initialisation options, including 'source' (object) containing initial values
 */
conbo.Hash = conbo.EventDispatcher.extend(
/** @lends conbo.Hash.prototype */
{
	/**
	 * Constructor: DO NOT override! (Use initialize instead)
	 * @param options
	 */
	__construct: function(options)
	{
		if (!!options.context) this.context = options.context;
		
		conbo.setDefaults(this, options.source, this.defaults);	
		delete this.defaults;
	},
	
	/**
	 * Return an object that can easily be converted into JSON
	 */
	toJSON: function()
	{
		var filter = function(value) 
		{
			return String(value).indexOf('_') !== 0; 
		};
		
		var obj = {},
			keys = conbo.filter(conbo.properties(this), filter);
		
		keys.forEach(function(value) 
		{
			obj[value] = this[value]; 
		}, 
		this);
		
		return obj;
	},
	
	toString: function()
	{
		return 'conbo.Hash';
	}
	
});

__denumerate(conbo.Hash.prototype);

/**
 * A persistent Hash that stores data in LocalStorage or Session
 * 
 * @class		conbo.LocalHash
 * @augments	conbo.Hash
 * @author 		Neil Rackett
 * @param 		{object} options - Object containing initialisation options, including 'name' (string), 'session' (Boolean) and 'source' (object) containing default values; see Hash for other options
 */
conbo.LocalHash = conbo.Hash.extend(
/** @lends conbo.LocalHash.prototype */
{
	__construct: function(options)
	{
		var defaultName = 'ConboLocalHash';
		
		options = conbo.defineDefaults(options, {name:defaultName});
		
		var name = options.name;
		
		var storage = options.session
			? window.sessionStorage
			: window.localStorage;
		
		if (name == defaultName)
		{
			conbo.warn('No name specified for '+this.toString+', using "'+defaultName+'"');
		}
		
		var getLocal = function()
		{
			return name in storage 
				? JSON.parse(storage.getItem(name) || '{}')
				: options.source || {};
		};
		
		// Sync with LocalStorage
		this.addEventListener(conbo.ConboEvent.CHANGE, function(event)
  		{
  			storage.setItem(name, JSON.stringify(this.toJSON()));
  		}, 
  		this, 1000);
		
		options.source = getLocal();
		
		conbo.Hash.prototype.__construct.call(this, options);		
	},
	
	/**
	 * Immediately writes all data to local storage. If you don't use this method, 
	 * Conbo writes the data the next time it detects a change to a bindable property.
	 */
	flush: function()
	{
		this.dispatchEvent(new conbo.ConboEvent(conbo.ConboEvent.CHANGE));
	},
	
	toString: function()
	{
		return 'conbo.LocalHash';
	}
	
});

__denumerate(conbo.LocalHash.prototype);

/**
 * A bindable Array wrapper that can be used when you don't require 
 * web service connectivity.
 * 
 * Plain objects will automatically be converted into an instance of 
 * the specified `itemClass` when added to a List, and the appropriate
 * events dispatched if the items it contains are changed or updated.
 * 
 * @class		conbo.List
 * @augments	conbo.EventDispatcher
 * @author 		Neil Rackett
 * @param 		{object} options - Object containing optional initialisation options, including `source` (array), `context` (Context) and `itemClass` (Class)
 */
conbo.List = conbo.EventDispatcher.extend(
/** @lends conbo.List.prototype */
{
	/**
	 * The class to use for items in this list (plain JS objects will 
	 * automatically be wrapped using this class), defaults to conbo.Hash
	 */
	itemClass: conbo.Hash,
	
	/**
	 * Constructor: DO NOT override! (Use initialize instead)
	 * @param options
	 */
	__construct: function(options) 
	{
		this.addEventListener(conbo.ConboEvent.CHANGE, this.__changeHandler, this, 999);
		
		var listOptions = 
		[
			'context',
			'itemClass'
		];
		
		conbo.setValues(this, conbo.pick(options, listOptions));
		
		this.source = options.source || [];
	},
	
	/**
	 * The Array used as the source for this List
	 */
	get source()
	{
		if (!this._source)
		{
			this._source = [];
		}
		
		return this._source;
	},
	
	set source(value)
	{
		this._source = [];
		this.push.apply(this, conbo.toArray(value));
		this.dispatchChange('source', 'length');
	},
	
	/**
	 * The number of items in the List
	 */
	get length()
	{
		if (this.source)
		{
			return this.source.length;
		}
		
		return 0;
	},
	
	/**
	 * Add an item to the end of the collection.
	 */
	push: function(item)
	{
		var items = conbo.toArray(arguments);
		
		if (items.length)
		{
			this.source.push.apply(this.source, this.__applyItemClass(items));
			this.__updateBindings(items);
			this.dispatchEvent(new conbo.ConboEvent(conbo.ConboEvent.ADD));
			this.dispatchChange('length');
		}
		
		return this.length;
	},
	
	/**
	 * Remove an item from the end of the collection.
	 */
	pop: function()
	{
		if (!this.length) return;
		
		var item = this.source.pop();
		
		this.__updateBindings(item, false);
		this.dispatchEvent(new conbo.ConboEvent(conbo.ConboEvent.REMOVE));
		this.dispatchChange('length');
		
		return item;
	},
	
	/**
	 * Add an item to the beginning of the collection.
	 */
	unshift: function(item) 
	{
		if (item)
		{
			this.source.unshift.apply(this.source, this.__applyItemClass(conbo.toArray(arguments)));
			this.__updateBindings(conbo.toArray(arguments));
			this.dispatchEvent(new conbo.ConboEvent(conbo.ConboEvent.ADD));
			this.dispatchChange('length');
		}
		
		return this.length;
	},
	
	/**
	 * Remove an item from the beginning of the collection.
	 */
	shift: function()
	{
		if (!this.length) return;
		
		var item = this.source.shift();
		
		this.__updateBindings(item, false);
		this.dispatchEvent(new conbo.ConboEvent(conbo.ConboEvent.REMOVE));
		this.dispatchChange('length');
		
		return item;
	},
	
	/**
	 * Slice out a sub-array of items from the collection.
	 */
	slice: function(begin, length)
	{
		begin || (begin = 0);
		if (conbo.isUndefined(length)) length = this.length;
		
		return new conbo.List({source:this.source.slice(begin, length)});
	},
	
	/**
	 * Splice out a sub-array of items from the collection.
	 */
	splice: function(begin, length)
	{
		begin || (begin = 0);
		if (conbo.isUndefined(length)) length = this.length;
		
		var inserts = conbo.rest(arguments,2);
		var items = this.source.splice.apply(this.source, [begin, length].concat(inserts));
		
		if (items.length) this.dispatchEvent(new conbo.ConboEvent(conbo.ConboEvent.REMOVE));
		if (inserts.length) this.dispatchEvent(new conbo.ConboEvent(conbo.ConboEvent.ADD));
		
		if (items.length || inserts.length)
		{
			this.dispatchChange('length');
		}
		
		return new conbo.List({source:items});
	},
	
	/**
	 * Get the item at the given index; similar to array[index]
	 */
	getItemAt: function(index) 
	{
		return this.source[index];
	},
	
	/**
	 * Add (or replace) item at given index with the one specified,
	 * similar to array[index] = value;
	 */
	setItemAt: function(index, item)
	{
		var length = this.length;
		
		var replaced = this.source[index];
		this.__updateBindings(replaced, false);
		
		this.source[index] = model;
		this.__updateBindings(model);
		
		if (this.length > length)
		{
			this.dispatchEvent(new conbo.ConboEvent(conbo.ConboEvent.ADD));
			this.dispatchChange('length');
		}
		
		this.dispatchEvent(new conbo.ConboEvent(conbo.ConboEvent.CHANGE, {item:item}));
		
		return replaced;
	},
	
	/**
	 * Force the collection to re-sort itself.
	 * @param	{function}	compareFunction - Compare function to determine sort order
	 */
	sort: function(compareFunction) 
	{
		this.source.sort(compareFunction);
		this.dispatchEvent(new conbo.ConboEvent(conbo.ConboEvent.SORT));
		this.dispatchEvent(new conbo.ConboEvent(conbo.ConboEvent.CHANGE));
		
		return this;
	},
	
	/**
	 * Create a new collection with an identical list of models as this one.
	 */
	clone: function() 
	{
		return new this.constructor(this.source);
	},
	
	/**
	 * The JSON-friendly representation of the List
	 */
	toJSON: function() 
	{
		var a = [];
		
		this.forEach(function(item)
		{
			if (conbo.isFunction(item.toJSON)) a.push(item.toJSON());
			else a.push(item);
		});
		
		return a;
	},
	
	toString: function()
	{
		return 'conbo.List';
	},
	
	/**
	 * Listen to the events of Bindable values so we can detect changes
	 * @param 	{any}		models
	 * @param 	{Boolean}	enabled
	 * @private
	 */
	__updateBindings: function(items, enabled)
	{
		var method = enabled === false ? 'removeEventListener' : 'addEventListener';
		
		items = (conbo.isArray(items) ? items : [items]).slice();
		
		while (items.length)
		{
			var item = items.pop();
			
			if (item instanceof conbo.EventDispatcher)
			{
				item[method](conbo.ConboEvent.CHANGE, this.dispatchEvent, this);
			}
		}
	},
	
	/**
	 * Enables array access operator, e.g. myList[0]
	 * @private
	 */
	__changeHandler: function(event)
	{
		var i;
		
		var define = this.bind(function(n)
		{
			Object.defineProperty(this, n, 
			{
				get: function() { return this.getItemAt(n); },
				set: function(value) { this.setItemAt(n, value); },
				configurable: true,
				enumerable: true
			});
		});
		
		for (i=0; i<this.length; i++)
		{
			define(i);
		}
		
		while (i in this)
		{
			delete this[i++];
		}
	},
	
	/**
	 * @private
	 */
	__applyItemClass: function(item)
	{
		if (item instanceof Array)
		{
			for (var i=0; i<item.length; i++)
			{
				item[i] = this.__applyItemClass(item[i]);
			}
			
			return item;
		}
		
		if (conbo.isObject(item) 
			&& !conbo.isClass(item)
			&& !(item instanceof conbo.Class)
			)
		{
			item = new this.itemClass({source:item, context:this.context});
		}
		
		return item;
	}
	
}).implement(conbo.IInjectable);

// Utility methods that we want to implement on the List.
var listMethods = 
[
	'forEach', 'map', 'reduce', 'reduceRight', 'find', 'findIndex', 'filter',
	'reject', 'every', 'any', 'contains', 'invoke', 'indexOf', 'lastIndexOf',
	'max', 'min', 'toArray', 'size', 'first', 'head', 'take', 'initial', 'rest',
	'tail', 'drop', 'last', 'without', 'shuffle', 'isEmpty', 'chain', 'sortOn'
];

// Mix in each available Conbo utility method as a proxy
listMethods.forEach(function(method) 
{
	if (!(method in conbo)) return;
	
	conbo.List.prototype[method] = function() 
	{
		var args = [this.source].concat(conbo.toArray(arguments)),
			result = conbo[method].apply(conbo, args);
		
		// TODO What's the performance impact of doing this?
//		this.dispatchEvent(new conbo.ConboEvent(conbo.ConboEvent.CHANGE));
		
		return conbo.isArray(result)
//			? new this.constructor({source:result}) // TODO Return List of same type as original?
			? new conbo.List({source:result, itemClass:this.itemClass})
			: result;
	};
});

__denumerate(conbo.List.prototype);

/**
 * LocalList is a persistent List class that is saved into LocalStorage
 * or SessionStorage
 * 
 * @class		conbo.LocalList
 * @augments	conbo.List
 * @author 		Neil Rackett
 * @param 		{object} options - Object containing initialisation options, including 'name' (String), 'session' (Boolean) and 'source' (Array) of default options
 */
conbo.LocalList = conbo.List.extend(
/** @lends conbo.LocalList.prototype */
{
	__construct: function(options)
	{
		var defaultName = 'ConboLocalList';
		
		options = conbo.defineDefaults(options, this.options, {name:defaultName});
		
		var name = options.name;
		
		var storage = options.session 
			? window.sessionStorage
			: window.localStorage;
		
		if (name == defaultName)
		{
			conbo.warn('No name specified for '+this.toString+', using "'+defaultName+'"');
		}
		
		var getLocal = function()
		{
			return name in storage
				? JSON.parse(storage.getItem(name) || '[]')
				: options.source || [];
		};
		
		// Sync with LocalStorage
		this.addEventListener(conbo.ConboEvent.CHANGE, function(event)
		{
  			storage.setItem(name, JSON.stringify(this));
		}, 
		this, 1000);
		
		options.source = getLocal();
		
		conbo.List.prototype.__construct.call(this, options);
	},
	
	/**
	 * Immediately writes all data to local storage. If you don't use this method, 
	 * Conbo writes the data the next time it detects a change to a bindable property.
	 */
	flush: function()
	{
		this.dispatchEvent(new conbo.ConboEvent(conbo.ConboEvent.CHANGE));
	},
	
	toString: function()
	{
		return 'conbo.LocalList';
	}
	
});

__denumerate(conbo.LocalList.prototype);

/**
 * Attribute Bindings
 * 
 * Functions that can be used to bind DOM elements to properties of Bindable 
 * class instances to DOM elements via their attributes.
 * 
 * @class		conbo.AttributeBindings
 * @augments	conbo.Class
 * @author 		Neil Rackett
 */
conbo.AttributeBindings = conbo.Class.extend(
/** @lends conbo.AttributeBindings.prototype */
{
	initialize: function()
	{
		// Methods that can accept multiple parameters
		
		this.cbClass.multiple = true;
		this.cbStyle.multiple = true;
		
		// Methods that require raw attribute data instead of bound property values
		
		this.cbIncludeIn.raw = true;
		this.cbExcludeFrom.raw = true;
	},
	
	/**
	 * Can the given attribute be bound to multiple properties at the same time?
	 * @param 	{String}	attribute
	 * @returns {Boolean}
	 */
	canHandleMultiple: function(attribute)
	{
		var f = conbo.toCamelCase(attribute);
		
		return (f in this)
			? !!this[f].multiple
			: false;
	},
		
	/**
	 * Makes an element visible
	 * 
	 * @param 		el
	 * @param 		value
	 */
	cbShow: function(el, value)
	{
		this.cbHide(el, !value);
	},
	
	/**
	 * Hides an element by making it invisible, but does not remove
	 * if from the layout of the page, meaning a blank space will remain
	 * 
	 * @param 		el
	 * @param 		value
	 */
	cbHide: function(el, value)
	{
		var $el = $(el);
		
		!!value
			? $el.addClass('cb-hide')
			: $el.removeClass('cb-hide');
	},
	
	/**
	 * Include an element on the screen and in the layout of the page
	 * 
	 * @param 		el
	 * @param 		value
	 */
	cbInclude: function(el, value)
	{
		this.cbExclude(el, !value);
	},
	
	/**
	 * Remove an element from the screen and prevent it having an effect
	 * on the layout of the page
	 * 
	 * @param 		el
	 * @param 		value
	 */
	cbExclude: function(el, value)
	{
		var $el = $(el);
		
		!!value
			? $el.addClass('cb-exclude')
			: $el.removeClass('cb-exclude');
	},
	
	/**
	 * The exact opposite of HTML's built-in `disabled` property
	 * 
	 * @param 		el
	 * @param 		value
	 */
	cbEnabled: function(el, value)
	{
		el.disabled = !value;
	},
	
	/**
	 * Inserts raw HTML into the element, which is rendered as HTML
	 * 
	 * @param 		el
	 * @param 		value
	 */
	cbHtml: function(el, value)
	{
		$(el).html(value);
	},
	
	/**
	 * Inserts text into the element so that it appears on screen exactly as
	 * it's written by converting special characters (<, >, &, etc) into HTML
	 * entities before rendering them, e.g. "8 < 10" becomes "8 &lt; 10", and
	 * line breaks into <br/>
	 * 
	 * @param 		el
	 * @param 		value
	 */
	cbText: function(el, value)
	{
		value = conbo.encodeEntities(value).replace(/\r?\n|\r/g, '<br/>');
		$(el).html(value);
	},
	
	/**
	 * Applies or removes a CSS class to or from the element based on the value
	 * of the bound property, e.g. cb-class="myProperty:class-name"
	 * 
	 * @param 		el
	 * @param 		value
	 */
	cbClass: function(el, value, options, className)
	{
		if (!className)
		{
			conbo.warn('cb-class attributes must specify one or more CSS classes in the format cb-class="myProperty:class-name"');
		}
		
		var $el = $(el);
		
		!!value
			? $el.addClass(className)
			: $el.removeClass(className);
	},
	
	/**
	 * Applies class(es) to the element based on the value contained in a variable. 
	 * Experimental.
	 * 
	 * @param 		el
	 * @param 		value
	 */
	cbClasses: function(el, value)
	{
		var $el = $(el);
		
		if (el.cbClasses)
		{
			$el.removeClass(el.cbClasses);
		}
		
		el.cbClasses = value;
		
		if (value)
		{
			$el.addClass(value);
		}
	},
	
	/**
	 * Apply styles from a variable
	 * 
	 * @param 		el
	 * @param 		value
	 */
	cbStyle: function(el, value, options, styleName)
	{
		if (!styleName)
		{
			conbo.warn('cb-style attributes must specify one or more styles in the format cb-style="myProperty:style-name"');
		}
		
		$(el).css(styleName, value);
	},
	
	/**
	 * Repeat the selected element
	 * 
	 * @param 		el
	 * @param 		value
	 */
	cbRepeat: function(el, values, options, itemRendererClassName)
	{
		var a, 
			args = conbo.toArray(arguments),
			$el = $(el),
			viewClass;
		
		options || (options = {});
		
		if (options.context && options.context.namespace)
		{
			viewClass = conbo.BindingUtils.getClass(itemRendererClassName, options.context.namespace);
		}
		
		viewClass || (viewClass = conbo.ItemRenderer);
		el.cbRepeat || (el.cbRepeat = {});
		
		var elements = el.cbRepeat.elements || [];
		
		$el.removeClass('cb-exclude');
		
		if (el.cbRepeat.list != values && values instanceof conbo.List)
		{
			if (el.cbRepeat.list)
			{
				el.cbRepeat.list.removeEventListener('change', el.cbRepeat.changeHandler);
			}
			
			el.cbRepeat.changeHandler = this.bind(function(event)
			{
				this.cbRepeat.apply(this, args);
			});
			
			values.addEventListener('change', el.cbRepeat.changeHandler);
			el.cbRepeat.list = values;
		}
		
		switch (true)
		{
			case values instanceof Array:
			case values instanceof conbo.List:
				a = values;
				break;
				
			default:
				// To support element lists, etc
				a = conbo.isIterable(values)
					? conbo.toArray(values)
					: [];
				break;
		}
		
		if (elements.length)
		{
			$(elements[0]).before($el);
		}
		
		while (elements.length)
		{
			var rEl = elements.pop();
			
			if (rEl.cbView) rEl.cbView.remove();
			else $(rEl).remove();
		}
		
		// Switched from forEach loop to resolve issues using "new Array(n)"
		// see: http://stackoverflow.com/questions/23460301/foreach-on-array-of-undefined-created-by-array-constructor
		for (var index=0,length=a.length; index<length; ++index)
		{
			var value = values[index];
			
			if (conbo.isObject(value) && !(value instanceof conbo.Hash))
			{
				value = new conbo.Hash({source:value});
			}
			
			var $clone = $el.clone().removeAttr('cb-repeat');
			
			var viewOptions = 
			{
				data: value, 
				el: $clone, 
				index: index,
				isLast: index == a.length-1,
				list: a
			};
			
			var view = new viewClass(conbo.setValues(viewOptions, options));
			
			view.$el.addClass('cb-repeat');
			
			elements.push(view.el);
		};
		
		$el.before(elements);
		
		el.cbRepeat.elements = elements;
		
		elements.length
			? $el.detach()
			: $el.addClass('cb-exclude');
	},
	
	/**
	 * Sets the properties of the element's dataset (it's `data-*` attributes)
	 * using the properties of the object being bound to it. Non-Object values 
	 * will be disregarded. You'll need to use a polyfill for IE <= 10.
	 * 
	 * @param 		el
	 * @param 		value
	 */
	cbDataset: function(el, value)
	{
		if (conbo.isObject(value))
		{
			conbo.setValues(el.dataset, value);
		}
	},
	
	/**
	 * When used with a standard DOM element, the properties of the element's
	 * `dataset` (it's `data-*` attributes) are set using the properties of the 
	 * object being bound to it; you'll need to use a polyfill for IE <= 10
	 * 
	 * When used with a Glimpse, the Glimpse's `data` property is set to
	 * the value of the bound property. 
	 * 
	 * @param 		el
	 * @param 		value
	 */
	cbData: function(el, value)
	{
		if (el.cbGlimpse)
		{
			el.cbGlimpse.data = value;
		}
		else
		{
			this.cbDataset(el, value);
		}
	},
	
	/**
	 * Only includes the specified element in the layout when the View's `currentState`
	 * matches one of the states listed in the attribute's value; multiple states should
	 * be separated by spaces
	 * 
	 * @example		cb-include-in="happy sad melancholy"
	 * 
	 * @param 		el
	 * @param 		value
	 * @param 		options
	 */
	cbIncludeIn: function(el, value, options)
	{
		var view = options.view;
		var states = value.split(' ');
		
		var stateChangeHandler = function()
		{
			this.cbInclude(el, states.indexOf(view.currentState) != -1);
		};
		
		view.addEventListener('change:currentState', stateChangeHandler, this);
		stateChangeHandler.call(this);
	},
	
	/**
	 * Removes the specified element from the layout when the View's `currentState`
	 * matches one of the states listed in the attribute's value; multiple states should
	 * be separated by spaces
	 * 
	 * @example		cb-exclude-from="confused frightened"
	 * 
	 * @param 		el
	 * @param 		value
	 * @param 		options
	 */
	cbExcludeFrom: function(el, value, options)
	{
		var view = options.view;
		var states = value.split(' ');
		
		var stateChangeHandler = function()
		{
			this.cbExclude(el, states.indexOf(view.currentState) != -1);
		};
		
		view.addEventListener('change:currentState', stateChangeHandler, this);
		stateChangeHandler.call(this);
	},
	
	/**
	 * Completely removes an element from the DOM based on a bound property value, 
	 * primarily intended to facilitate graceful degredation and removal of desktop 
	 * features in mobile environments.
	 * 
	 * @example		cb-remove="isMobile"
	 * 
	 * @param 		el
	 * @param 		value
	 */
	cbRemove: function(el, value)
	{
		if (!!value)
		{
			var $el = $(el);
			
			// TODO Remove any bindings?
			
			$el.remove();
		}
	},
	
	/**
	 * The opposite of `cbRemove`
	 * 
	 * @param 		el
	 * @param 		value
	 */
	cbKeep: function(el, value)
	{
		this.cbRemove(el, !value);
	},
	
	/**
	 * Enables the use of cb-onbind attribute to handle the 'bind' event 
	 * dispatched by the element after it has been bound by Conbo
	 * 
	 * @param 		el
	 * @param 		value
	 */
	cbOnbind: function(el, handler)
	{
		el.addEventListener('bind', handler);
	},
	
	/**
	 * Uses JavaScript to open an anchor's HREF so that the link will open in
	 * an iOS WebView instead of Safari
	 * 
	 * @param el
	 */
	cbJshref: function(el)
	{
		if (el.tagName == 'A')
		{
			el.onclick = function(event)
			{
				window.location = el.href;
				event.preventDefault();
				return false;
			};
		}
	},
	
	/*
	 * FORM HANDLING & VALIDATION
	 */
	
	/**
	 * Detects changes to the specified element and applies the CSS class
	 * cb-changed or cb-unchanged, depending on whether the contents have
	 * changed from their original value.
	 * 
	 * @param 		el
	 * @param 		value
	 */
	cbDetectChange: function(el, value)
	{
		var $el = $(el)
			, $form = $el.closest('form')
			, originalValue = $el.val() || $el.html()
			;
		
		var updateForm = function()
		{
			$form.removeClass('cb-changed cb-unchanged')
				.addClass($form.find('.cb-changed').length ? 'cb-changed' : 'cb-unchanged');
		};
		
		var changeHandler = function()
		{
			var changed = (($el.val() || $el.html()) != originalValue);
			
			$el.removeClass('cb-changed cb-unchanged')
				.addClass(changed ? 'cb-changed' : 'cb-unchanged')
				;
			
			updateForm();
		};
		
		$el.on('change input', changeHandler)
			.addClass('cb-unchanged')
			;
		
		updateForm();
	},
	
	/**
	 * Use a method or regex to validate a form element and apply a
	 * cb-valid or cb-invalid CSS class based on the outcome
	 * 
	 * @param 		el
	 * @param 		value
	 */
	cbValidate: function(el, validator)
	{
		var validateFunction;
		
		switch (true)
		{
			case conbo.isFunction(validator):
			{
				validateFunction = validator;
				break;
			}
			
			case conbo.isString(validator):
			{
				validator = new RegExp(validator);
			}
			
			case conbo.isRegExp(validator):
			{
				validateFunction = function(value)
				{
					return validator.test(value);
				};
				
				break;
			}
		}
		
		if (!conbo.isFunction(validateFunction))
		{
			conbo.warn(validator+' cannot be used with cb-validate');
			return;
		}
		
		var $el = $(el)
			, $form = $el.closest('form')
			;
		
		var removeClass = function(regEx) 
		{
			return function (index, classes) 
			{
				return classes.split(/\s+/).filter(function (el)
				{
					return regEx.test(el); 
				})
				.join(' ');
			};
		};
		
		var validate = function()
		{
			// Form item
			
			var value = $el.val() || $el.html()
				, result = validateFunction(value) 
				, valid = (result === true)
				, classes = []
				;
			
			classes.push(valid ? 'cb-valid' : 'cb-invalid');
			
			if (conbo.isString(result))
			{
				classes.push('cb-invalid-'+result);
			}
			
			$el.removeClass('cb-valid cb-invalid')
				.removeClass(removeClass(/^cb-invalid-/))
				.addClass(classes.join(' '))
				;
			
			// Form
			
			if ($form.length)
			{
				$form.removeClass('cb-valid cb-invalid')
					.removeClass(removeClass(/^cb-invalid-/))
					;
				
				if (valid) 
				{
					valid = !$form.find('.cb-invalid').length;
					
					if (valid)
					{
						$form.find('[required]').each(function() 
						{
							var $el = $(this);
							
							if (!$.trim($el.val() || $el.html()))
							{
								valid = false;
								return false; 
							}
						});
					}
				}
				
				$form.addClass(valid ? 'cb-valid' : 'cb-invalid');
			}
			
		};
		
		$el.on('change input blur', validate);
	},
	
	/**
	 * Restricts text input to the specified characters
	 * 
	 * @param 		el
	 * @param 		value
	 */
	cbRestrict: function(el, value)
	{
		// TODO Restrict to text input fields?
		
		if (el.cbRestrict)
		{
			el.removeEventListener('keypress', el.cbRestrict);
		}
		
		el.cbRestrict = function(event)
		{
			if (event.ctrlKey)
			{
				return;
			}
			
			var code = event.keyCode || event.which;
			var char = event.key || String.fromCharCode(code);
			var regExp = value;
				
			if (!conbo.isRegExp(regExp))
			{
				regExp = new RegExp('['+regExp+']', 'g');
			}
			
			if (!char.match(regExp))
			{
				event.preventDefault();
			}
		};
		
		el.addEventListener('keypress', el.cbRestrict);
	},
	
	/**
	 * Limits the number of characters that can be entered into
	 * input and other form fields
	 * 
	 * @param 		el
	 * @param 		value
	 */
	cbMaxChars: function(el, value)
	{
		// TODO Restrict to text input fields?
		
		var $el = $(el);
		
		if (el.cbMaxChars)
		{
			el.removeEventListener('keypress', el.cbMaxChars);
		}
		
		el.cbMaxChars = function(event)
		{
			if (($el.val() || $el.html()).length >= value)
			{
				event.preventDefault();
			}
		};
		
		el.addEventListener('keypress', el.cbMaxChars);
	},
	
});

var BindingUtils__cbAttrs = new conbo.AttributeBindings()
	, BindingUtils__customAttrs = {}
	, BindingUtils__reservedAttrs = ['cb-app', 'cb-view', 'cb-glimpse', 'cb-content']
	, BindingUtils__reservedNamespaces = ['cb', 'data', 'aria']
	, BindingUtils__registeredNamespaces = ['cb']
	;

/**
 * Set the value of one or more property and dispatch a change:[propertyName] event
 * 
 * Event handlers, in line with conbo.Model change:[propertyName] handlers, 
 * should be in the format handler(source, value) {...}
 * 
 * @private
 * @param 	attribute
 * @param 	value
 * @param 	options
 * @example	BindingUtils__set.call(target, 'n', 123);
 * @example	BindingUtils__set.call(target, {n:123, s:'abc'});
 * @returns	this
 */
var BindingUtils__set = function(propertyName, value)
{
	if (this[propertyName] === value)
	{
		return this;
	}
	
	// Ensure numbers are returned as Number not String
	if (value && conbo.isString(value) && !isNaN(value))
	{
		value = parseFloat(value);
		if (isNaN(value)) value = '';
	}
	
	this[propertyName] = value;
	
	return this;
};

/**
 * Is the specified attribute reserved for another purpose?
 * 
 * @private
 * @param 		{String}	value
 * @returns		{Boolean}
 */
var BindingUtils__isReservedAttr = function(value)
{
	return BindingUtils__reservedAttrs.indexOf(value) != -1;
};

/**
 * Attempt to make a property bindable if it isn't already
 * 
 * @private
 * @param 		{String}	value
 * @returns		{Boolean}
 */
var BindingUtils__makeBindable = function(source, propertyName)
{
	if (!conbo.isAccessor(source, propertyName))
	{
		if (source instanceof conbo.EventDispatcher)
		{
			conbo.makeBindable(source, [propertyName]);
		}
		else
		{
			conbo.warn('It will not be possible to detect changes to "'+propertyName+'" because "'+source.toString()+'" is not an EventDispatcher');
		}
	}
}

/**
 * Binding utility class
 * 
 * Used to bind properties of EventDispatcher class instances to DOM elements, 
 * other EventDispatcher class instances or setter functions
 * 
 * @class		conbo.BindingUtils
 * @augments	conbo.Class
 * @author 		Neil Rackett
 */
conbo.BindingUtils = conbo.Class.extend({},
/** @lends conbo.BindingUtils */
{
	/**
	 * Bind a property of a EventDispatcher class instance (e.g. Hash or View) 
	 * to a DOM element's value/content, using Conbo's best judgement to
	 * work out how the value should be bound to the element.
	 * 
	 * This method of binding also allows for the use of a parse function,
	 * which can be used to manipulate bound data in real time
	 * 
	 * @param 		{conbo.EventDispatcher}	source				Class instance which extends from conbo.EventDispatcher (e.g. Hash or Model)
	 * @param 		{String} 				propertyName		Property name to bind
	 * @param 		{DOMElement} 			element				DOM element to bind value to (two-way bind on input/form elements)
	 * @param 		{Function}				parseFunction		Optional method used to parse values before outputting as HTML
	 * 
	 * @returns		{Array}										Array of bindings
	 */
	bindElement: function(source, propertyName, element, parseFunction)
	{
		var isEventDispatcher = source instanceof conbo.EventDispatcher;
		
		if (!element)
		{
			throw new Error('element is undefined');
		}
		
		BindingUtils__makeBindable(source, propertyName);
		
		var scope = this,
			bindings = [],
			eventType,
			eventHandler;
		
		parseFunction || (parseFunction = this.defaultParseFunction);
		
		$(element).each(function(index, el)
		{
			var $el = $(el);
			var tagName = $el[0].tagName;
			
			switch (tagName)
			{
				case 'INPUT':
				case 'SELECT':
				case 'TEXTAREA':
				{	
					var type = ($el.attr('type') || tagName).toLowerCase();
					
					switch (type)
					{
						case 'checkbox':
						{
							$el.prop('checked', !!source[propertyName]);
							
							if (isEventDispatcher)
							{
								eventType = 'change:'+propertyName;
								
								eventHandler = function(event)
								{
									$el.prop('checked', !!event.value);
								};
								
								source.addEventListener(eventType, eventHandler);
								bindings.push([source, eventType, eventHandler]);
							}
							
							eventType = 'input change';
							
							eventHandler = function(event)
							{
								BindingUtils__set.call(source, propertyName, $el.is(':checked'));
							};
							
							$el.on(eventType, eventHandler);
							bindings.push([$el, eventType, eventHandler]);
							
							return;
						}
						
						case 'radio':
						{
							if ($el.val() == source[propertyName]) $el.prop('checked', true);
							
							if (isEventDispatcher)
							{
								eventType = 'change:'+propertyName;
								
								eventHandler = function(event)
								{
									if (event.value == null) event.value = '';
									if ($el.val() != event.value) return; 
									
									$el.prop('checked', true);
								};
								
								source.addEventListener(eventType, eventHandler);
								bindings.push([source, eventType, eventHandler]);
							}
							
							break;
						}
						
						default:
						{
							var setVal = function() 
							{
								$el.val(source[propertyName]); 
							};
							
							// Resolves issue with cb-repeat inside <select>
							if (type == 'select') conbo.defer(setVal);
							else setVal();
							
							if (isEventDispatcher)
							{
								eventType = 'change:'+propertyName;
								
								eventHandler = function(event)
								{
									if (event.value == null) event.value = '';
									if ($el.val() == event.value) return;
									
									$el.val(event.value);
								};
								
								source.addEventListener(eventType, eventHandler);
								bindings.push([source, eventType, eventHandler]);
							}
							
							break;
						}
					}
					
					eventType = 'input change';
					
					eventHandler = function(event)
					{	
						BindingUtils__set.call(source, propertyName, $el.val() === undefined ? $el.html() : $el.val());
					};
					
					$el.on(eventType, eventHandler);
					bindings.push([$el, eventType, eventHandler]);
					
					break;
				}
				
				default:
				{
					$el.html(parseFunction(source[propertyName]));
					
					if (isEventDispatcher)
					{
						eventType = 'change:'+propertyName;
						
						eventHandler = function(event) 
						{
							var html = parseFunction(event.value);
							$el.html(html);
						};
						
						source.addEventListener(eventType, eventHandler);
						bindings.push([source, eventType, eventHandler]);
					}
					
					break;
				}
			}
			
		});
		
		return bindings;
	},
	
	/**
	 * Unbinds the specified property of a bindable class from the specified DOM element
	 * 
	 *  @param	el		DOM element
	 *  @param	view	View class
	 */
	unbindElement: function(source, propertyName, element)
	{
		// TODO Implement unbindElement
	},
	
	/**
	 * Bind a DOM element to the property of a EventDispatcher class instance,
	 * e.g. Hash or Model, using cb-* attributes to specify how the binding
	 * should be made.
	 * 
	 * Two way bindings will automatically be applied where the attribute name 
	 * matches a property on the target element, meaning your EventDispatcher object 
	 * will automatically be updated when the property changes.
	 * 
	 * @param 	{conbo.EventDispatcher}	source			Class instance which extends from conbo.EventDispatcher (e.g. Hash or Model)
	 * @param 	{String}				propertyName	Property name to bind
	 * @param 	{DOMElement}			element			DOM element to bind value to (two-way bind on input/form elements)
	 * @param 	{String}				attributeName	The attribute to bind as it appears in HTML, e.g. "cb-prop-name"
	 * @param 	{Function} 				parseFunction	Method used to parse values before outputting as HTML (optional)
	 * @param	{Object}				options			Options related to this attribute binding (optional)
	 * 
	 * @returns	{Array}					Array of bindings
	 */
	bindAttribute: function(source, propertyName, element, attributeName, parseFunction, options)
	{
		var bindings = [];
		
		if (BindingUtils__isReservedAttr(attributeName))
		{
			return bindings;
		}
		
		if (!element)
		{
			throw new Error('element is undefined');
		}
		
		var split = attributeName.split('-'),
			hasNs = split.length > 1
			;
		
		if (!hasNs)
		{
			return bindings;
		}
		
		if (attributeName == "cb-bind")
		{
			return this.bindElement(source, propertyName, element, parseFunction);
		}
		
		BindingUtils__makeBindable(source, propertyName);
		
		var scope = this,
			eventType,
			eventHandler,
			args = conbo.toArray(arguments).slice(5),
			camelCase = conbo.toCamelCase(attributeName),
			ns = split[0],
			isConboNs = (ns == 'cb'),
			isConbo = isConboNs && camelCase in BindingUtils__cbAttrs,
			isCustom = !isConbo && camelCase in BindingUtils__customAttrs,
			isNative = isConboNs && split.length == 2 && split[1] in element,
			attrFuncs = BindingUtils__cbAttrs
			;
		
		parseFunction || (parseFunction = this.defaultParseFunction);
		
		switch (true)
		{
			// If we have a bespoke handler for this attribute, use it
			case isCustom:
				attrFuncs = BindingUtils__customAttrs;
			
			case isConbo:
			{
				if (!(source instanceof conbo.EventDispatcher))
				{
					conbo.warn('Source is not EventDispatcher');
					return this;
				}
				
				var fn = attrFuncs[camelCase];
				
				if (fn.raw)
				{
					fn.apply(attrFuncs, [element, propertyName].concat(args));
				}
				else
				{
					eventHandler = function(event)
					{
						fn.apply(attrFuncs, [element, parseFunction(source[propertyName])].concat(args));
					};
					
					eventType = 'change:'+propertyName;
					
					source.addEventListener(eventType, eventHandler);
					eventHandler();
					
					bindings.push([source, eventType, eventHandler]);
				}
				
				break;
			}
			
			case isNative:
			{
				var nativeAttr = split[1];
				
				switch (true)
				{
					case nativeAttr.indexOf('on') !== 0 && conbo.isFunction(element[nativeAttr]):
					{
						conbo.warn(attributeName+' is not a recognised attribute, did you mean cb-on'+nativeAttr+'?');
						break;
					}
					
					// If it's an event, add a listener
					case nativeAttr.indexOf('on') === 0:
					{
						if (!conbo.isFunction(source[propertyName]))
						{
							conbo.warn(propertyName+' is not a function and cannot be bound to DOM events');
							return this;
						}
						
						$(element).on(nativeAttr.substr(2), source[propertyName]);
						return this;
					}
					
					// ... otherwise, bind to the native property
					default:
					{
						if (!(source instanceof conbo.EventDispatcher))
						{
							conbo.warn('Source is not EventDispatcher');
							return this;
						}
						
						eventHandler = function()
						{
							var value;
							
							value = parseFunction(source[propertyName]);
							value = conbo.isBoolean(element[nativeAttr]) ? !!value : value;
							
							element[nativeAttr] = value;
						};
					    
						eventType = 'change:'+propertyName;
						source.addEventListener(eventType, eventHandler);
						eventHandler();
						
						bindings.push([source, eventType, eventHandler]);
						
						var $el = $(element);
						
						eventHandler = function()
		     			{
							BindingUtils__set.call(source, propertyName, element[nativeAttr]);
		     			};
						
		     			eventType = 'input change';
						$el.on(eventType, eventHandler);
						
						bindings.push([$el, eventType, eventHandler]);
						
						break;
					}
				}
				
				break;
			}
			
			default:
			{
				conbo.warn(attributeName+' is not recognised or does not exist on specified element');
				break;
			}
		}
		
		return bindings;
	},
	
	/**
	 * Applies the specified read-only Conbo or custom attribute to the specified element
	 * 
	 * @param 	{DOMElement}			element			DOM element to bind value to (two-way bind on input/form elements)
	 * @param 	{String}				attributeName	The attribute to bind as it appears in HTML, e.g. "cb-prop-name"
	 * 
	 * @example
	 * conbo.BindingUtils.applyAttribute(el, "my-custom-attr");
	 */
	applyAttribute: function(element, attributeName)
	{
		if (this.attributeExists(attributeName))
		{
			var camelCase = conbo.toCamelCase(attributeName),
				ns = attributeName.split('-')[0],
				attrFuncs = (ns == 'cb') ? BindingUtils__cbAttrs : BindingUtils__customAttrs,
				fn = attrFuncs[camelCase]
				;
			
			if (fn.readOnly)
			{
				fn.call(attrFuncs, element);
			}
			else
			{
				conbo.warn(attr+' attribute cannot be used without a value');
			}
			
			return this;
		}
		
		conbo.warn(attr+' attribute does not exist');
		
		return this;
	},
	
	/**
	 * Does the specified Conbo or custom attribute exist?
	 * @param 	{String}				attributeName - The attribute name as it appears in HTML, e.g. "cb-prop-name"
	 * @returns	{Boolean}
	 */
	attributeExists: function(attributeName)
	{
		var camelCase = conbo.toCamelCase(attributeName);
		return camelCase in BindingUtils__cbAttrs || camelCase in BindingUtils__customAttrs;
	},
	
	/**
	 * Bind everything within the DOM scope of a View to the specified 
	 * properties of EventDispatcher class instances (e.g. Hash or Model)
	 * 
	 * @param 	{conbo.View}		view		The View class controlling the element
	 * @returns	{this}
	 */
	bindView: function(view)
	{
		if (!view)
		{
			throw new Error('view is undefined');
		}
		
		if (!!view.__bindings)
		{
			this.unbindView(view);
		}
		
		var options = {view:view},
			bindings = [],
			$ignored = view.$('[cb-repeat]'),
			scope = this;
		
		if (!!view.subcontext) 
		{
			view.subcontext.addTo(options);
		}
		
		var ns = view.context && view.context.namespace;
		
		if (ns)
		{
			this.applyViews(view, ns, 'glimpse')
				.applyViews(view, ns, 'view')
				;
		}
		
		view.$('*').add(view.el).filter(function()
		{
			if (this == view.el) return true;
			if ($ignored.find(this).length) return false;
			return true;
		})
		.each(function(index, el)
		{
			var $el = $(el);
			var attrs = $el.attrs();
			
			if (!conbo.keys(attrs).length) 
			{
				return;
			}
			
			var keys = conbo.keys(attrs);
			
			// Prevents Conbo trying to populate repeat templates 
			if (keys.indexOf('cbRepeat') != -1)
			{
				keys = ['cbRepeat'];
			}
			
			keys.forEach(function(key)
			{
				type = conbo.toUnderscoreCase(key, '-');
				
				var typeSplit = type.split('-');
				
				if (typeSplit.length < 2 
					|| BindingUtils__registeredNamespaces.indexOf(typeSplit[0]) == -1 
					|| BindingUtils__isReservedAttr(type))
				{
					return;
				}
				
				var splits = attrs[key].split(',');
				
				if (!BindingUtils__cbAttrs.canHandleMultiple(type))
				{
					splits = [splits[0]];
				}
				
				var splitsLength = splits.length;
				
				for (var i=0; i<splitsLength; i++)
				{
					var parseFunction,
						d = splits[i];
					
					if (!d && !conbo.isString(d))
					{
						scope.applyAttribute(el, type);
						break;
					}
					
					var b = d.split('|'),
						v = b[0].split(':'),
						propertyName = v[0],
						param = v[1],
						split = scope.cleanPropertyName(propertyName).split('.'),
						property = split.pop(),
						model;
					
					try
					{
						parseFunction = !!b[1] ? eval('view.'+scope.cleanPropertyName(b[1])) : undefined;
						parseFunction = conbo.isFunction(parseFunction) ? parseFunction : undefined;
					}
					catch (e) {}
					
					try
					{
						model = !!split.length ? eval('view.'+split.join('.')) : view;
					}
					catch (e) {}
					
					if (!model) 
					{
						conbo.warn(propertyName+' is not defined in this View');
						return;
					}
					
					var opts = conbo.defineValues({propertyName:property}, options);
					var args = [model, property, el, type, parseFunction, opts, param];
					
					bindings = bindings.concat(scope.bindAttribute.apply(scope, args));
				}
				
				// Dispatch a `bind` event from the element at the end of the current call stack
				conbo.defer(function()
				{
					var customEvent;
					
					customEvent = document.createEvent('CustomEvent');
					customEvent.initCustomEvent('bind', false, false, {});					
					
					el.dispatchEvent(customEvent);
				});
			});
			
		});
		
		__defineUnenumerableProperty(view, '__bindings', bindings);
		
		return this;
	},
	
	/**
	 * Removes all data binding from the specified View instance
	 * @param 	{conbo.View}	view
	 * @return	{this}
	 */
	unbindView: function(view)
	{
		if (!view)
		{
			throw new Error('view is undefined');
		}
		
		if (!view.__bindings || !view.__bindings.length)
		{
			return this;
		}
		
		var bindings = view.__bindings;
		
		while (bindings.length)
		{
			var binding = bindings.pop();
			
			try
			{
				switch (true)
				{
					case binding[0] instanceof $:
					{
						binding[0].off(binding[1], binding[2]);
						break;
					}
					
					case binding[0] instanceof conbo.EventDispatcher:
					case !!binding[0] && !!binding[0].removeEventListener:
					{
						binding[0].removeEventListener(binding[1], binding[2]);
						break;
					}
					
					default:
					{
						// Looks like the object's been deleted!
						break;
					}
				}
			}
			catch (e) 
			{
				// TODO ?
			}
		}
		
		delete view.__bindings;
		
		return this;
	},
	
	/**
	 * Applies View and Glimpse classes DOM elements based on their cb-view 
	 * attribute or tag name
	 * 
	 * @param	rootView	DOM element, View or Application class instance
	 * @param	namespace	The current namespace
	 * @param	type		View type, 'view' or 'glimpse' (default: 'view')
	 */
	applyViews: function(rootView, namespace, type)
	{
		var validTypes = ['view', 'glimpse'];
		type || (type = 'view');
		
		if (validTypes.indexOf(type) == -1)
		{
			throw new Error(type+' is not a valid type parameter for applyView');
		}
		
		var typeClass = conbo[type.charAt(0).toUpperCase()+type.slice(1)],
			scope = this
			;
		
		var $rootEl = rootView instanceof conbo.View
			? rootView.$el
			: $(rootView)
			;
		
		// Detects tags with cb-* attributes and custom tag names 
		$rootEl.find('*').not('.cb-view, .cb-glimpse').each(function(index, el)
		{
			var $el = $(el),
				className = $el.cbAttrs()[type] || conbo.toCamelCase(el.tagName, true),
				classReference = scope.getClass(className, namespace)
				;
			
			if (classReference 
				&& conbo.isClass(classReference, typeClass))
			{
				if ((type == 'glimpse' && conbo.isClass(classReference, conbo.Glimpse))
					|| (type == 'view' && conbo.isClass(classReference, conbo.View)))
				{
					// Gets the Context of the "closest" parent View
					var closestView = $el.closest('.cb-view')[0];
						context = closestView ? closestView.cbView.subcontext : rootView.subcontext;
					
					new classReference({el:el, context:context});
				}
			}
		});
		
		return this;
	},
	
	/**
	 * Bind the property of one EventDispatcher class instance (e.g. Hash or View) to another
	 * 
	 * @param 	{conbo.EventDispatcher}	source						Class instance which extends conbo.EventDispatcher
	 * @param 	{String}			sourcePropertyName			Source property name
	 * @param 	{any}				destination					Object or class instance which extends conbo.EventDispatcher
	 * @param 	{String}			destinationPropertyName		Optional (default: sourcePropertyName)
	 * @param 	{Boolean}			twoWay						Optional (default: false)
	 * 
	 * @returns	{this}
	 */
	bindProperty: function(source, sourcePropertyName, destination, destinationPropertyName, twoWay)
	{
		if (!(source instanceof conbo.EventDispatcher))
		{
			throw new Error(sourcePropertyName+' source is not EventDispatcher');
		}
		
		var scope = this;
		
		destinationPropertyName || (destinationPropertyName = sourcePropertyName);
		
		BindingUtils__makeBindable(source, sourcePropertyName);
		
		source.addEventListener('change:'+sourcePropertyName, function(event)
		{
			if (!(destination instanceof conbo.EventDispatcher))
			{
				destination[destinationPropertyName] = event.value;
				return;
			}
			
			BindingUtils__set.call(destination, destinationPropertyName, event.value);
		});
		
		if (twoWay && destination instanceof conbo.EventDispatcher)
		{
			this.bindProperty(destination, destinationPropertyName, source, sourcePropertyName);
		}
		
		return this;
	},
	
	/**
	 * Call a setter function when the specified property of a EventDispatcher 
	 * class instance (e.g. Hash or Model) is changed
	 * 
	 * @param 	{conbo.EventDispatcher}	source				Class instance which extends conbo.EventDispatcher
	 * @param 	{String}			propertyName
	 * @param 	{Function}			setterFunction
	 */
	bindSetter: function(source, propertyName, setterFunction)
	{
		if (!(source instanceof conbo.EventDispatcher))
		{
			throw new Error('Source is not EventDispatcher');
		}
		
		if (!conbo.isFunction(setterFunction))
		{
			if (!setterFunction || !(propertyName in setterFunction))
			{
				throw new Error('Invalid setter function');
			}
			
			setterFunction = setterFunction[propertyName];
		}
		
		BindingUtils__makeBindable(source, propertyName);
		
		source.addEventListener('change:'+propertyName, function(event)
		{
			setterFunction(event.value);
		});
		
		return this;
	},
	
	/**
	 * Default parse function
	 * 
	 * @param	value
	 * @returns	{any}
	 */
	defaultParseFunction: function(value)
	{
		return typeof(value) == 'undefined' ? '' : value;
	},
	
	/**
	 * Remove everything except alphanumberic, dots and underscores from Strings
	 * 
	 * @private
	 * @param 		{String}	view		String value to clean
	 * @returns		{String}
	 */
	cleanPropertyName: function(value)
	{
		return (value || '').replace(/[^\w\._]/g, '');
	},
	
	/**
	 * Attempt to convert string into a conbo.Class in the specified namespace
	 * 
	 * @param 		name
	 * @returns		Class
	 */
	getClass: function(className, namespace)
	{
		if (!className || !namespace) return;
		
		try
		{
			var classReference = namespace[className];
			
			if (conbo.isClass(classReference)) 
			{
				return classReference;
			}
		}
		catch (e) {}
	},
	
	/**
	 * Register a custom attribute handler
	 * 
	 * @param		{string}	name - camelCase version of the attribute name (must include a namespace prefix)
	 * @param		{function}	handler - function that will handle the data bound to the element
	 * @param 		{boolean}	readOnly - Whether or not the attribute is read-only (default: false)
	 * @param 		{boolean}	raw - Whether or not parameters should be passed to the handler as a raw String instead of a bound value (default: false)
	 * @returns 	{this}		BindingUtils
	 * 
	 * @example 
	 * // HTML: <div my-font-name="myProperty"></div>
	 * conbo.BindingUtils.registerAttribute('myFontName', function(el, value, options, param)
	 * {
	 * 	$(el).css('font-name', value);
	 * });
	 */
	registerAttribute: function(name, handler, readOnly, raw)
	{
		if (!conbo.isString(name) || !conbo.isFunction(handler))
		{
			conbo.warn("registerAttribute: both 'name' and 'handler' parameters are required");
			return this;
		}
		
		var split = conbo.toUnderscoreCase(name).split('_');
		
		if (split.length < 2)
		{
			conbo.warn("registerAttribute: "+name+" does not include a namespace, e.g. "+conbo.toCamelCase('my-'+name));
			return this;
		}
		
		var ns = split[0];
		
		if (BindingUtils__reservedNamespaces.indexOf(ns) != -1)
		{
			conbo.warn("registerAttribute: custom attributes cannot to use the "+ns+" namespace");
			return this;
		}
		
		BindingUtils__registeredNamespaces = conbo.union(BindingUtils__registeredNamespaces, [ns]);
		
		conbo.setValues(handler, 
		{
			readOnly: !!readOnly,
			raw: !!raw
		});
		
		BindingUtils__customAttrs[name] = handler;
		
		return this;
	},
	
	/**
	 * Register one or more custom attribute handlers 
	 * 
	 * @see			#registerAttribute
	 * @param 		{object}				handlers - Object containing one or more custom attribute handlers
	 * @param 		{boolean}				readOnly - Whether or not the attributes are read-only (default: false)
	 * @returns 	{conbo.BindingUtils}	BindingUtils
	 * 
	 * @example
	 * conbo.BindingUtils.registerAttributes({myFoo:myFooFunction, myBar:myBarFunction});
	 */
	registerAttributes: function(handlers, readOnly)
	{
		for (var a in handlers)
		{
			this.addAttribute(a, handlers[a], readOnly);
		}
		
		return this;
	},
	
	toString: function()
	{
		return 'conbo.BindingUtils';
	},
});

/**
 * Mutation Observer
 * 
 * Simplified mutation observer dispatches ADD and REMOVE events following 
 * changes in the DOM, compatible with IE9+ and all modern browsers
 * 
 * @class		conbo.MutationObserver
 * @augments	conbo.EventDispatcher
 * @author 		Neil Rackett
 * @param 		{object} options - Object containing initialisation options
 */
conbo.MutationObserver = conbo.EventDispatcher.extend(
/** @lends conbo.MutationObserver.prototype */
{
	initialize: function()
	{
		this.bindAll();
	},
	
	observe: function(el)
	{
		this.disconnect();
		
		if (!el) return;
		
		var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
		
		// Modern browsers
		if (MutationObserver)
		{
			var mo = new MutationObserver(this.bind(function(mutations, observer)
			{
				var added = mutations[0].addedNodes;
				var removed = mutations[0].removedNodes;
				
				if (added.length)
				{
					this.__addHandler(conbo.toArray(added));
				}
			
				if (mutations[0].removedNodes.length)
				{
					this.__removeHandler(conbo.toArray(removed));
				}
			}));
			
			mo.observe(el, {childList:true, subtree:true});
			
			this.__mo = mo;
		}
		// IE9
		else
		{
			el.addEventListener('DOMNodeInserted', this.__addHandler);
			el.addEventListener('DOMNodeRemoved', this.__removeHandler);
			
			this.__el = el;
		}
		
		return this;
	},
	
	disconnect: function()
	{
		var mo = this.__mo;
		var el = this.__el;
		
		if (mo) 
		{
			mo.disconnect();
		}
		
		if (el) 
		{
			el.removeEventListener('DOMNodeInserted', __addHandler);
			el.removeEventListener('DOMNodeRemoved', __removeHandler);
		}
		
		return this;
	},
	
	__addHandler: function(event)
	{
		var nodes = conbo.isArray(event)
			? event
			: [event.target];
		
		this.dispatchEvent(new conbo.ConboEvent(conbo.ConboEvent.ADD, {nodes:nodes}));
	},
	
	__removeHandler: function(event)
	{
		var nodes = conbo.isArray(event)
			? event
			: [event.target];
		
		this.dispatchEvent(new conbo.ConboEvent(conbo.ConboEvent.REMOVE, {nodes:nodes}));
	}
});

/**
 * Promise
 * 
 * @class		conbo.Promise
 * @augments	conbo.EventDispatcher
 * @author 		Neil Rackett
 * @param 		{object} options - Object containing initialisation options
 */
conbo.Promise = conbo.EventDispatcher.extend(
/** @lends conbo.Promise.prototype */
{
	initialize: function(options)
	{
		this.bindAll('dispatchResult', 'dispatchFault');
	},
	
	/**
	 * Dispatch a result event using the specified result
	 * @param 	result
	 * @returns {conbo.Promise}
	 */
	dispatchResult: function(result)
	{
		this.dispatchEvent(new conbo.ConboEvent('result', {result:result}));
		return this;
	},
	
	/**
	 * Dispatch a fault event using the specified fault
	 * @param 	result
	 * @returns {conbo.Promise}
	 */
	dispatchFault: function(fault)
	{
		this.dispatchEvent(new conbo.ConboEvent('fault', {fault:fault}));
		return this;
	},
	
	/**
	 * The class name as a string
	 * @returns {String}
	 */
	toString: function()
	{
		return 'conbo.Promise';
	},
	
});

//__denumerate(conbo.Promise.prototype);

/**
 * Interface class for data renderers, for example an item renderer for
 * use with the cb-repeat attribute
 * 
 * @augments	conbo
 * @author 		Neil Rackett
 */
conbo.IDataRenderer =
{
	data: undefined,
	index: -1,
	isLast: false,
	list: undefined
};

/**
 * Glimpse
 * 
 * A lightweight element wrapper that has no dependencies, no context and 
 * no data binding, but is able to apply a super-simple template.
 * 
 * It's invisible to View, so it's great for creating components, and you 
 * can bind data to it using the `cb-data` attribute to set the data 
 * property of your Glimpse
 * 
 * @class		conbo.Glimpse
 * @augments	conbo.EventDispatcher
 * @author 		Neil Rackett
 * @param 		{object} options - Object containing initialisation options
 */
conbo.Glimpse = conbo.EventDispatcher.extend(
/** @lends conbo.Glimpse.prototype */
{
	/**
	 * Constructor: DO NOT override! (Use initialize instead)
	 * @param options
	 * @private
	 */
	__construct: function(options)
	{
		if (options.el)
		{
			this.el = options.el;
		}
		
		this.__ensureElement();
		
		if (this.template)
		{
			this.el.innerHTML = this.template;
		}
	},
	
	/**
	 * The default `tagName` of a Glimpse is `div`.
	 */
	tagName: 'div',
	
	/**
	 * Initialize is an empty function by default. Override it with your own
	 * initialization logic.
	 */
	initialize: function(){},
		
	/**
	 * The class's element
	 */
	get el()
	{
		return this.__el;
	},
	
	set el(element)
	{
		if (this.__el)
		{
			this.__el.className = this.el.className.replace('cb-glimpse', '');
			delete this.el.cbGlimpse;
		}
		
		__defineUnenumerableProperty(this, '__el', element);
		
		element.className += ' cb-glimpse';
		element.cbGlimpse = this;
		
		this.dispatchChange('el');
	},
	
	toString: function()
	{
		return 'conbo.Glimpse';
	},
	
	/**
	 * Ensure that the View has a DOM element to render into, creating 
	 * a new element using the `id`, `className` and `tagName` properties if
	 * one does not already exist
	 * 
	 * @private
	 */
	__ensureElement: function() 
	{
		var el = this.el;
		
		if (!el) 
		{
			var attrs = conbo.defineValues({}, this.attributes);
			
			el = document.createElement(this.tagName);
			
			if (this.id) el.id = this.id;
			if (this.className) el.className = this.className;
			
			conbo.defineValues(el, attrs);
		}
		else 
		{
			if (this.className) el.className += ' '+this.className;
		}
		
		this.el = el;
		
		return this;
	},
	
});

__denumerate(conbo.Glimpse.prototype);

var View__templateCache = {};

/**
 * View
 * 
 * Creating a conbo.View creates its initial element outside of the DOM,
 * if an existing element is not provided...
 * 
 * @class		conbo.View
 * @augments	conbo.Glimpse
 * @author 		Neil Rackett
 * @param 		{object}	options - Object containing optional initialisation options, including 'attributes', 'className', 'data', 'el', 'id', 'tagName', 'template', 'templateUrl'
 */
conbo.View = conbo.Glimpse.extend(
/** 
 * @lends 		conbo.View.prototype
 */
{
	/**
	 * @member		{object}	attributes - Attributes to apply to the View's element
	 * @memberOf	conbo.View.prototype
	 */
	
	/**
	 * @member		{string}	className - CSS class name(s) to apply to the View's element
	 * @memberOf	conbo.View.prototype
	 */
	
	/**
	 * @member		{object}	data - Arbitrary data Object
	 * @memberOf	conbo.View.prototype
	 */
	
	/**
	 * @member		{string}	id - ID to apply to the View's element
	 * @memberOf	conbo.View.prototype
	 */
	
	/**
	 * @member		{string}	tagName - The tag name to use for the View's element (if no element specified)
	 * @memberOf	conbo.View.prototype
	 */
	
	/**
	 * @member		{string}	template - Template to apply to the View's element
	 * @memberOf	conbo.View.prototype
	 */
	
	/**
	 * @member		{string}	templateUrl - Template to load and apply to the View's element
	 * @memberOf	conbo.View.prototype
	 */
	
	/**
	 * @member		{boolean}	templateCacheEnabled - Whether or not the contents of templateUrl should be cached on first load for use with future instances of this View class (default: true)
	 * @memberOf	conbo.View.prototype
	 */
	
	/**
	 * @member		{boolean}	autoInitTemplate - Whether or not the template should automatically be loaded and applied, rather than waiting for the user to call initTemplate (default: true)
	 * @memberOf	conbo.View.prototype
	 */
	
	/**
	 * Constructor: DO NOT override! (Use initialize instead)
	 * @param options
	 * @private
	 */
	__construct: function(options)
	{
		options = conbo.clone(options) || {};
		
		var viewOptions = conbo.union
		(
			[
				'attributes',
				'className', 
				'data', 
				'el', 
				'id', 
				'tagName', 
				'template', 
				'templateUrl',
				'templateCacheEnabled',
				'autoInitTemplate'
			],
			
			// Adds interface properties
			conbo.intersection
			(
				conbo.properties(this, true), 
				conbo.properties(options)
			)
		);
		
		conbo.setValues(this, conbo.pick(options, viewOptions));
		conbo.makeBindable(this, ['currentState']);
		
		this.__updateEl();
		this.context = options.context;
	},

	__initialized: function(options)
	{
		if (this.hasContent)
		{
			this.__content =  this.$el.html();
		}
		
		if (this.autoInitTemplate !== false)
		{
			this.initTemplate();
		}
	},
	
	/**
	 * Returns a reference to the parent View of this View, based on this 
	 * View element's position in the DOM
	 */
	get parent()
	{
		return this.__getParent();
	},
	
	/**
	 * Returns a reference to the parent Application of this View, based on
	 * this View element's position in the DOM
	 */
	get parentApp()
	{
		return this.__getParent(true);
	},
	
	/**
	 * Does this view have a template?
	 */
	get hasTemplate()
	{
		return !!(this.template || this.templateUrl);
	},
	
	/**
	 * A jQuery wrapped version of the `content` element
	 * 
	 * @see	#content
	 */
	get $content()
	{
		if (this.el)
		{
			var $content = this.$('[cb-content]:first');
			
			if ($content.closest('.cb-view')[0] == this.el)
			{
				return $content;
			}
		}
	},
	
	/**
	 * The element into which HTML content should be placed; this is either the 
	 * first DOM element with a `cb-content` or the root element of this view
	 */
	get content()
	{
		if (this.$content)
		{
			return this.$content[0];
		}
	},
	
	/**
	 * Does this View support HTML content?
	 */
	get hasContent()
	{
		return !!this.content;
	},
	
	/**
	 * A jQuery wrapped version of the body element
	 * @see		body
	 */
	get $body()
	{
		return this.$content || this.$el;
	},
	
	/**
	 * A View's body is the element to which content should be added:
	 * the View's content, if it exists, or the View's main element, if it doesn't
	 */
	get body()
	{
		return this.content || this.el;
	},
	
	/**
	 * The context that will automatically be applied to children
	 * when binding or appending Views inside of this View
	 */
	get subcontext()
	{
		return this.__subcontext || this.context;
	},
	
	set subcontext(value)
	{
		this.__subcontext = value;
	},
	
	/**
	 * jQuery delegate for finding elements within the current view, with 
	 * nested Views and Applications excluded from the search by default. 
	 * 
	 * This should be prefered to global lookups where possible.
	 * 
	 * @param	{string}	selector - The jQuery selector to use
	 * @param	{boolean}	isDeep - Whether or not to include nested views in the search (default: false)
	 */
	$: function(selector, isDeep)
	{
		if (isDeep)
		{
			return this.$el.find(selector);
		}
		
		var $nestedViews = this.$el.find('.cb-app, [cb-app], .cb-view, [cb-view]');
		
		return this.$el.find(selector).filter(function()
		{
			if (!!$nestedViews.find(this).length || !!$nestedViews.filter(this).length) 
			{
				return false;
			}
			
			return true;
		});
	},
	
	/**
	 * Take the View's element element out of the DOM
	 */
	detach: function() 
	{
		this.$el.detach();		
		this.dispatchEvent(new conbo.ConboEvent(conbo.ConboEvent.DETACH));
		
		return this;
	},
	
	/**
	 * Remove and destroy this View by taking the element out of the DOM, 
	 * unbinding it, removing all event listeners and removing the View from 
	 * its Context
	 */
	remove: function()
	{
		this.unbindView()
			.removeEventListener()
			;
		
		this.$el.remove();
		
		if (this.data)
		{
			this.data = undefined;
		}
		
		if (this.context)
		{
			this.context
				.uninjectSingletons(this)
				.removeEventListener(undefined, undefined, this)
				;
			
			this.context = undefined;
		}
		
		this.dispatchEvent(new conbo.ConboEvent(conbo.ConboEvent.REMOVE));
		
		return this;
	},
	
	/**
	 * This View's element wrapped as a jQuery object
	 */
	get $el()
	{
		if ($)
		{
			return $(this.el);
		}
	},
	
	set $el(element)
	{
		this.el = element;
	},
	
	/**
	 * This View's element
	 */
	get el()
	{
		return this.__el;
	},
	
	/**
	 * Change the view's element (`this.el` property) and re-bind events
	 */
	set el(element)
	{
		var isBound = !!this.__bindings;
		var el = this.__el;
		var $el = $(element);
		
		if (!!el) delete el.cbView;
		if (isBound) this.unbindView();
		
		el = $el[0];
		el.cbView = this;
		
		__defineUnenumerableProperty(this, '__el', el);
		
		if (isBound) this.bindView();
		
		this.dispatchChange('el');
	},
	
	/**
	 * Append this DOM element from one View class instance this class 
	 * instances DOM element
	 * 
	 * @param 		view
	 * @returns 	this
	 */
	appendView: function(view)
	{
		if (arguments.length > 1)
		{
			conbo.forEach(arguments, function(view, index, list) 
			{
				this.appendView(view);
			},
			this);
			
			return this;
		}
		
		if (!(view instanceof conbo.View))
		{
			throw new Error('Parameter must be instance of conbo.View class');
		}
	
		this.$body.append(view.el);
		
		return this;
	},
	
	/**
	 * Prepend this DOM element from one View class instance this class 
	 * instances DOM element
	 * 
	 * @param 		view
	 * @returns 	this
	 */
	prependView: function(view)
	{
		if (arguments.length > 1)
		{
			conbo.forEach(arguments, function(view, index, list) 
			{
				this.prependView(view);
			}, 
			this);
			
			return this;
		}
		
		if (!(view instanceof conbo.View))
		{
			throw new Error('Parameter must be instance of conbo.View class');
		}
		
		this.$body.prepend(view.el);
		
		return this;
	},
	
	/**
	 * Automatically bind elements to properties of this View
	 * 
	 * @example	<div cb-bind="property|parseMethod" cb-hide="property">Hello!</div> 
	 * @returns	this
	 */
	bindView: function()
	{
		conbo.BindingUtils.bindView(this);
		this.dispatchEvent(new conbo.ConboEvent(conbo.ConboEvent.BOUND));
		return this;
	},
	
	/**
	 * Unbind elements from class properties
	 * @returns	this
	 */
	unbindView: function() 
	{
		conbo.BindingUtils.unbindView(this);
		this.dispatchEvent(new conbo.ConboEvent(conbo.ConboEvent.UNBOUND));
		return this;
	},
	
	/**
	 * Initialize the View's template, either by loading the templateUrl
	 * or using the contents of the template property, if either exist
	 */
	initTemplate: function()
	{
		var template = this.template;
		
		if (!!this.templateUrl)
		{
			this.loadTemplate();
		}
		else
		{
			if (conbo.isFunction(template))
			{
				template = template(this);
			}
			
			if (conbo.isString(template))
			{
				this.$el.html(template);
			}
			
			this.__initView();
		}
		
		return this;
	},
	
	/**
	 * Load HTML template and use it to populate this View's element
	 * 
	 * @param 	{String}	url			A string containing the URL to which the request is sent
	 */
	loadTemplate: function(url)
	{
		url || (url = this.templateUrl);
		
		this.unbindView();
		
		if (this.templateCacheEnabled !== false && View__templateCache[url])
		{
			this.$el.html(View__templateCache[url]);
			this.__initView();
			
			return this;
		}
		
		var loadHandler = this.bind(function(response, status, xhr)
		{
			if (status == 'error')
			{
				this.dispatchEvent(new conbo.ConboEvent(conbo.ConboEvent.TEMPLATE_ERROR));
				this.$el.empty();
			}
			else
			{
				if (this.templateCacheEnabled !== false)
				{
					View__templateCache[url] = response;
				}
				
				this.$el.html(response);
			}
			
			this.__initView();
		});
		
		this.$el.load(url, undefined, loadHandler);
		
		return this;
	},
	
	toString: function()
	{
		return 'conbo.View';
	},
	
	/**
	 * Populate and render the View's HTML content
	 */
	__initView: function()
	{
		if (this.hasTemplate && this.hasContent)
		{
			this.$content.html(this.__content);
		}
		
		delete this.__content;
		
		this.dispatchEvent(new conbo.ConboEvent(conbo.ConboEvent.TEMPLATE_LOADED))
			.bindView()
			;
		
		conbo.defer(this.bind(function()
		{
			this.dispatchEvent(new conbo.ConboEvent(conbo.ConboEvent.INIT));
		}));
		
		return this;
	},
	
	/**
	 * Ensure that the View has a DOM element to render and that its attributes,
	 * ID and classes are set correctly using the `id`, `className` and 
	 * `tagName` properties.
	 * 
	 * @private
	 */
	__updateEl: function() 
	{
		var attrs = conbo.setValues({}, this.attributes);
		
		if (!this.el) 
		{
			if (this.id) attrs.id = this.id;
			this.el = $('<'+this.tagName+'>');
		}
		
		this.$el
			.addClass('cb-view '+(this.className||''))
			.attr(attrs);
			;
		
		return this;
	},
	
	__getParent: function(findApp)
	{
		if (!this.el || conbo.instanceOf(this, conbo.Application))
		{
			return;
		}
		
		var selector = findApp
			? '.cb-app'
			: '.cb-view';
		
		var el = this.$el.parents(selector)[0];
		
		if (el && (findApp || this.parentApp.$el.has(el).length))
		{
			return el.cbView;
		}
		
		return undefined;
	},

});

__denumerate(conbo.View.prototype);

/**
 * ItemRenderer
 * 
 * A conbo.View class that implements the conbo.IDataRenderer interface
 * 
 * @class		conbo.ItemRenderer
 * @augments	conbo.View
 * @author 		Neil Rackett
 * @param 		{object} options - Object containing initialisation options (see View)
 */
conbo.ItemRenderer = conbo.View.extend().implement(conbo.IDataRenderer);
/**
 * Application
 * 
 * Base application class for client-side applications
 * 
 * @class		conbo.Application
 * @augments	conbo.View
 * @author		Neil Rackett
 * @param 		{object} options - Object containing optional initialisation options, see View
 */
conbo.Application = conbo.View.extend(
/** @lends conbo.Application.prototype */
{
	/**
	 * Constructor: DO NOT override! (Use initialize instead)
	 * @param options
	 * @private
	 */
	__construct: function(options)
	{
		options = conbo.clone(options) || {};
		
		if (!(this.namespace instanceof conbo.Namespace))
		{
			throw new Error('Application namespace must be an instance of conbo.Namespace');
		}
		
		options.app = this;
		options.context = new this.contextClass(options);
		options.el || (options.el = this.__findAppElement());
		
		conbo.View.prototype.__construct.call(this, options);
	},
	
	/**
	 * Default context class to use
	 * You'll normally want to override this with your own
	 */
	get contextClass() 
	{
		return conbo.Context;
	},
	
	/**
	 * If true, the application will automatically apply Glimpse and View 
	 * classes to elements when they're added to the DOM 
	 */
	get observeEnabled()
	{
		return !!this.__mo;
	},
	
	set observeEnabled(value)
	{
		if (value == this.observeEnabled) return;
		
		var mo;
			
		if (value)
		{
			mo = new conbo.MutationObserver();
			mo.observe(this.el);
			
			mo.addEventListener(conbo.ConboEvent.ADD, function()
			{
				conbo.BindingUtils.applyViews(this, this.namespace);
				conbo.BindingUtils.applyViews(this, this.namespace, 'glimpse');
			}, 
			this);
			
			this.__mo = mo;
		}
		else if (this.__mo)
		{
			mo = this.__mo;
			mo.removeEventListener();
			mo.disconnect();
			
			delete this.__mo;
		}
		
		this.dispatchChange('observeEnabled');
		
		return this;
	},
	
	toString: function()
	{
		return 'conbo.Application';
	},
	
	/**
	 * Find element with matching cb-app attribute, if it exists
	 * @private
	 */
	__findAppElement: function()
	{
		var $apps = $('[cb-app]');
		
		if (!$apps.length) return undefined;
		
		if (!this.namespace)
		{
			if ($apps.length)
			{
				conbo.warn('Application namespace not specified: unable to bind to cb-app element');
			}
			
			return undefined;
		}
		
		var appName;
		
		for (var a in this.namespace)
		{
			if (conbo.isClass(this.namespace[a])
				&& this instanceof this.namespace[a])
			{
				appName = a;
				break;
			}
		}
		
		if (!appName) return undefined;
		
		var selector = '[cb-app="'+appName+'"]',
			el = $(selector)[0];
		
		return el || undefined;
	},
	
	/**
	 * Ensure that this class has an element
	 * @override
	 * @private
	 */
	__updateEl: function()
	{
		conbo.View.prototype.__updateEl.call(this);
		this.$el.addClass('cb-app');
	},
	
});

__denumerate(conbo.Application.prototype);

/**
 * conbo.Command
 * 
 * Base class for commands to be registered in your Context 
 * using mapCommand(...)
 * 
 * @class		conbo.Command
 * @augments	conbo.EventDispatcher
 * @author		Neil Rackett
 * @param 		{object} options - Object containing optional initialisation options, including 'context' (Context)
 */
conbo.Command = conbo.EventDispatcher.extend(
/** @lends conbo.Command.prototype */
{
	/**
	 * Constructor: DO NOT override! (Use initialize instead)
	 * @param options
	 */
	__construct: function(options)
	{
		this.context = options.context;
		this.event = options.event || {};
	},
	
	/**
	 * Initialiser included for consistency, but should probably never be used
	 */
	initialize: function() {},
	
	/**
	 * Execute: should be overridden
	 * 
	 * When a Command is called in response to an event registered with the
	 * Context, the class is instantiated, this method is called then the 
	 * class instance is destroyed
	 */
	execute: function() {},
	
	toString: function()
	{
		return 'conbo.Command';
	}
	
}).implement(conbo.IInjectable);

__denumerate(conbo.Command.prototype);

/**
 * HTTP Service
 * 
 * Base class for HTTP data services, with default configuration designed 
 * for use with JSON REST APIs.
 * 
 * For XML data sources, you will need to override decodeFunction to parse 
 * response data, change the contentType and implement encodeFunction if 
 * you're using RPC.  
 * 
 * @class		conbo.HttpService
 * @augments	conbo.EventDispatcher
 * @author 		Neil Rackett
 * @param 		{object} options - Object containing optional initialisation options, including 'rootUrl', 'contentType', 'dataType', 'headers', 'encodeFunction', 'decodeFunction', 'resultClass','makeObjectsBindable'
 */
conbo.HttpService = conbo.EventDispatcher.extend(
/** @lends conbo.HttpService.prototype */
{
	__construct: function(options)
	{
		options = conbo.setDefaults(options, 
		{
			contentType: conbo.HttpService.CONTENT_TYPE_JSON
		});
		
		conbo.setValues(this, conbo.setDefaults(conbo.pick(options, 
		    'rootUrl', 
		    'contentType', 
		    'dataType', 
		    'headers', 
		    'encodeFunction', 
		    'decodeFunction', 
		    'resultClass',
		    'makeObjectsBindable'
		), {
			dataType: 'json'
		}));
		
		conbo.EventDispatcher.prototype.__construct.apply(this, arguments);
	},
	
	/**
	 * The root URL of the web service
	 */
	get rootUrl()
	{
		return this._rootUrl || '';
	},
	
	set rootUrl(value)
	{
		value = String(value);
		
		if (value && value.slice(-1) != '/')
		{
			value += '/';
		}
		
		this._rootUrl = value;
	},
	
	/**
	 * Call a method of the web service
	 * 
	 * @param	{String}	command - The name of the command
	 * @param	{Object}	data - Object containing the data to send to the web service
	 * @param	{String}	method - GET, POST, etc (default: GET)
	 * @param	{Class}		resultClass - Optional
	 */
	call: function(command, data, method, resultClass)
	{
		var contentType;
		
		data = conbo.clone(data || {});
		method || (method = 'GET');
		resultClass || (resultClass = this.resultClass);
		contentType = this.contentType || conbo.HttpService.CONTENT_TYPE_JSON;
		command = this.parseUrl(command, data);
		data = this.encodeFunction(data, method);
		
		var promise = $.ajax
		({
			data: data,
			type: method,
			headers: this.headers,
			url: this.rootUrl+command,
			contentType: contentType,
			dataType: this.dataType,
			dataFilter: this.decodeFunction
		});
		
		var token = new conbo.AsyncToken
		({
			promise: promise, 
			resultClass: resultClass, 
			makeObjectsBindable: this.makeObjectsBindable
		});
		
		token.addResponder(new conbo.Responder(this.dispatchEvent, this.dispatchEvent, this));
		
		return token;
	},
	
	/**
	 * Add one or more remote commands as methods of this class instance
	 * @param	{String}	command - The name of the command
	 * @param	{String}	method - GET, POST, etc (default: GET)
	 * @param	{Class}		resultClass - Optional
	 */
	addCommand: function(command, method, resultClass)
	{
		if (conbo.isObject(command))
		{
			method = command.method;
			resultClass = command.resultClass;
			command = command.command;
		}
		
		this[conbo.toCamelCase(command)] = function(data)
		{
			return this.call(command, data, method, resultClass);
		};
		
		return this;
	},
	
	/**
	 * Add multiple commands as methods of this class instance
	 * @param	{Array}		commands
	 */
	addCommands: function(commands)
	{
		if (!conbo.isArray(commands))
		{
			return this;
		}
		
		commands.forEach(function(command)
		{
			this.addCommand(command);
		}, 
		this);
		
		return this;
	},
	
	/**
	 * Method that encodes data to be sent to the API
	 * 
	 * @param	{object}	data - Object containing the data to be sent to the API
	 * @param	{String}	method - GET, POST, etc (default: GET)
	 */
	encodeFunction: function(data, method)
	{
		return (method || 'GET').toUpperCase() != 'GET' 
				&& this.contentType == conbo.HttpService.CONTENT_TYPE_JSON
			? JSON.stringify(data)
			: data;
	},
	
	/**
	 * Splice data into URL and remove spliced properties from data object
	 */
	parseUrl: function(url, data)
	{
		var parsedUrl = url,
			matches = parsedUrl.match(/:\b\w+\b/g);
		
		if (!!matches)
		{
			matches.forEach(function(key) 
			{
				key = key.substr(1);
				
				if (!(key in data))
				{
					throw new Error('Property "'+key+'" required but not found in data');
				}
			});
		}
			
		conbo.keys(data).forEach(function(key)
		{
			var regExp = new RegExp(':\\b'+key+'\\b', 'g');
			
			if (regExp.test(parsedUrl))
			{
				parsedUrl = parsedUrl.replace(regExp, data[key]);
				delete data[key];
			}
		});
		
		return parsedUrl;
	},
	
	toString: function()
	{
		return 'conbo.HttpService';
	}
	
},
/** @lends conbo.HttpService */
{
	CONTENT_TYPE_JSON: 'application/json',
	CONTENT_TYPE_FORM: 'application/x-www-form-urlencoded'
})
.implement(conbo.IInjectable);

/**
 * Async Token
 * 
 * @class		conbo.AsyncToken
 * @augments	conbo.Promise
 * @author 		Neil Rackett
 * @param 		{object} options - Object containing optional initialisation options, including 'makeObjectsBindable' and 'resultClass'
 */
conbo.AsyncToken = conbo.Promise.extend(
/** @lends conbo.AsyncToken.prototype */
{
	initialize: function(options)
	{
		options || (options = {});
		
		conbo.setValues(this, conbo.pick(options, 
 		    'makeObjectsBindable', 
 		    'resultClass'
 		));
		
		this.responders = [];
		this.bindAll('dispatchResult', 'dispatchFault');
		
		var promise = options.promise;
		if (!promise) return;
		
		promise
			.done(this.dispatchResult)
			.fail(this.dispatchFault);
	},
	
	addResponder: function(responder)
	{
		if (!conbo.instanceOf(responder, conbo.Responder)) 
		{
			conbo.warn(responder+' is not a Responder');
			return;
		}
		
		this.responders.push(responder);
		
		return this;
	},
	
	// override
	dispatchResult: function(result, status, xhr)
	{
		var resultClass = this.resultClass;
		
		if (!resultClass && this.makeObjectsBindable)
		{
			switch (true)
			{
				case conbo.isArray(result):
					resultClass = conbo.List;
					break;
				
				case conbo.isObject(result):
					resultClass = conbo.Hash;
					break;
			}
		}
		
		if (resultClass)
		{
			result = new resultClass(result);
		}
		
		var event = new conbo.ConboEvent('result', {result:result, status:xhr.status, xhr:xhr});
		
		this.responders.forEach(function(responder)
		{
			if (responder.resultHandler)
			{
				responder.resultHandler.call(responder.scope, event);
			}
		});
		
		this.dispatchEvent(event);
		
		return this;
	},
	
	// override
	dispatchFault: function(xhr, status, errorThrown)
	{
		var faultData = 
		{
			error: errorThrown,
			fault: xhr.responseJSON, 
			status: xhr.status,
			xhr: xhr
		};
		
		var event = new conbo.ConboEvent('fault', faultData);
		
		this.responders.forEach(function(responder)
		{
			if (responder.faultHandler)
			{
				responder.faultHandler.call(responder.scope, event);
			}
		});
		
		this.dispatchEvent(event);
		
		return this;
	},
	
	toString: function()
	{
		return 'conbo.AsyncToken';
	},
	
});

__denumerate(conbo.AsyncToken.prototype);

/**
 * Responder
 * 
 * @class		conbo.Responder
 * @augments	conbo.Class
 * @author 		Neil Rackett
 * @param 		{function}	resultHandler - Function that handles successful results
 * @param 		{function}	faultHandler - Function that handles errors
 * @param 		{option} 	scope - The scope the callback functions should be run in
 */
conbo.Responder = conbo.Class.extend(
/** @lends conbo.Responder */
{
	initialize: function(resultHandler, faultHandler, scope)
	{
		this.resultHandler = resultHandler;
		this.faultHandler = faultHandler;
		this.scope = scope;
	},
	
	toString: function()
	{
		return 'conbo.Responder';
	}
});

__denumerate(conbo.Responder.prototype);

/**
 * ISyncable pseudo-interface
 * 
 * @augments	conbo
 * @author 		Neil Rackett
 */
conbo.ISyncable =
{
	load: conbo.notImplemented,
	save: conbo.notImplemented,
	destroy: conbo.notImplemented
};

/**
 * Remote Hash
 * Used for syncing remote data with a local Hash
 * 
 * @class		conbo.RemoteHash
 * @augments	conbo.Hash
 * @author 		Neil Rackett
 * @param 		{object} options - Object containing initialisation options, see Hash
 */
conbo.RemoteHash = conbo.Hash.extend(
/** @lends conbo.RemoteHash.prototype */
{
	/**
	 * Constructor
	 * @param {Object}	options		Object containing `source` (initial properties), `rootUrl` and `command` parameters
	 */
	__construct: function(options)
	{
		options = conbo.defineDefaults(options, this.options);
		
		if (!!options.context) this.context = options.context;
		this.preinitialize(options);
		
		this._httpService = new conbo.HttpService(options);
		this._command = options.command;
		
		var resultHandler = function(event)
		{
			conbo.makeBindable(this, conbo.properties(event.result));
			conbo.setValues(this, event.result);
			
			this.dispatchEvent(event);
		};
		
		this._httpService
			.addEventListener('result', resultHandler, this)
			.addEventListener('fault', this.dispatchEvent, this);
		
		__denumerate(this);
		
		conbo.Hash.prototype.__construct.apply(this, arguments);
	},
	
	load: function(data)
	{
		data = arguments.length ? data : this.toJSON();
		this._httpService.call(this._command, data, 'GET');
		return this;
	},
	
	save: function()
	{
		this._httpService.call(this._command, this.toJSON(), 'POST');
		return this;
	},
	
	destroy: function()
	{
		this._httpService.call(this._command, this.toJSON(), 'DELETE');
		return this;
	},
	
	toString: function()
	{
		return 'conbo.RemoteHash';
	}
	
}).implement(conbo.ISyncable, conbo.IPreinitialize);

__denumerate(conbo.HttpService.prototype);

/**
 * Remote List
 * Used for syncing remote array data with a local List
 * 
 * @class		conbo.RemoteList
 * @augments	conbo.List
 * @author 		Neil Rackett
 * @param 		{object} options - Object containing initialisation options, including HttpService options
 */
conbo.RemoteList = conbo.List.extend(
/** @lends conbo.RemoteList.prototype */
{
	//itemClass: conbo.RemoteHash,
	
	/**
	 * Constructor
	 * @param {Object}	options		Object containing 'source' (Array, optional), 'rootUrl', 'command' and (optionally) 'itemClass' parameters
	 */
	__construct: function(options)
	{
		options = conbo.defineDefaults(options, this.options);
		
		this.context = options.context;
		
		this._httpService = new conbo.HttpService(options);
		this._command = options.command;
		
		var resultHandler = function(event)
		{
			this.source = event.result;
			this.dispatchEvent(event);
		};
		
		this._httpService
			.addEventListener('result', resultHandler, this)
			.addEventListener('fault', this.dispatchEvent, this)
			;
		
		__denumerate(this);
		
		conbo.List.prototype.__construct.apply(this, arguments);
	},
	
	load: function()
	{
		this._httpService.call(this._command, this.toJSON(), 'GET');
		return this;
	},
	
	save: function()
	{
		this._httpService.call(this._command, this.toJSON(), 'POST');
		return this;
	},
	
	destroy: function()
	{
		// TODO
	},
	
	toString: function()
	{
		return 'conbo.RemoteList';
	}
	
}).implement(conbo.ISyncable, conbo.IPreinitialize);

__denumerate(conbo.HttpService.prototype);

/**
 * Cached regex for stripping a leading hash/exclamation/slash and trailing space.
 * @private
 */ 
var routeStripper = /^#!|^[#\/]|\s+$/g;

/**
 * Cached regex for stripping leading and trailing slashes.
 * @private
 */
var rootStripper = /^\/+|\/+$/g;

/**
 * Cached regex for removing a trailing slash.
 * @private
 */
var trailingSlash = /\/$/;

/**
 * conbo.History handles cross-browser history management using the 
 * onhashchange event and hash-bang URL fragments
 * 
 * @see https://developer.mozilla.org/en-US/docs/DOM/window.onhashchange
 * @class		conbo.History
 * @augments	conbo.EventDispatcher
 * @author 		Neil Rackett
 */
conbo.History = conbo.EventDispatcher.extend(
/** @lends conbo.History.prototype */
{
	/**
	 * Has the history handling already been started?
	 */
	started: false,
	
	/**
	 * Constructor: DO NOT override! (Use initialize instead)
	 * @param options
	 * @private
	 */
	__construct: function(options)
	{
		this.handlers = [];
		this.bindAll('checkUrl');
		
		if (typeof window !== 'undefined')
		{
			this.location = window.location;
			this.history = window.history;
		}
		
		if (!!options.context)
		{
			this.context = options.context;
		}
	},
	
	/**
	 * Whether or not Conbo's History class is supported by the current browser
	 */
	get isSupported()
	{
		return 'onhashchange' in window;
	},
	
	/**
	 * Gets the true hash value. Cannot use location.hash directly due
	 * to bug in Firefox where location.hash will always be decoded.
	 */
	getHash: function(window)
	{
		if (window || this.location)
		{
			var match = (window || this).location.href.match(/#!?(.*)$/);
			return match ? match[1] : '';
		}
	},
	
	/**
	 * Get the cross-browser normalized URL fragment, either from the
	 * URL, the hash, or the override.
	 */
	getFragment: function(fragment)
	{
		fragment || (fragment = this.getHash());
		return fragment.replace(routeStripper, '');
	},
	
	/**
	 * Start the hash change handling, returning `true` if the current
	 * URL matches an existing route, and `false` otherwise.
	 */
	start: function(options)
	{
		if (this.started)
		{
			throw new Error("conbo.history has already been started");
		}
		
		this.started = true;
		this.fragment = this.getFragment();
		
		$(window).on('hashchange', this.checkUrl);
		
		if (!(options || {}).silent)
		{
			return this.loadUrl();
		}
		
		this.dispatchEvent(new conbo.ConboEvent(conbo.ConboEvent.STARTED));
		
		return this;
	},
	
	/**
	 * Disable conbo.history, perhaps temporarily. Not useful in a real app,
	 * but possibly useful for unit testing Routers.
	 */
	stop: function()
	{
		$(window).off('hashchange', this.checkUrl);
		this.started = false;
		
		this.dispatchEvent(new conbo.ConboEvent(conbo.ConboEvent.STOPPED));
		
		return this;
	},
	
	/**
	 * Add a route to be tested when the fragment changes. Routes added
	 * later may override previous routes.
	 */
	route: function(route, callback)
	{
		this.handlers.unshift({route:route, callback:callback});
		
		return this;
	},
	
	/**
	 * Checks the current URL to see if it has changed, and if it has,
	 * calls `loadUrl`
	 */
	checkUrl: function(e)
	{
		var changed = this.getFragment() !== this.fragment;
		
		if (changed)
		{
			this.loadUrl() || this.loadUrl(this.getHash());
		}
		
		this.dispatchEvent(new conbo.ConboEvent(conbo.ConboEvent.NAVIGATE));
		
		return !changed;
	},
	
	/**
	 * Attempt to load the current URL fragment. If a route succeeds with a
	 * match, returns `true`. If no defined routes matches the fragment, returns `false`.
	 */
	loadUrl: function(fragmentOverride)
	{
		var fragment = this.fragment = this.getFragment(fragmentOverride);
		
		var matched = conbo.some(this.handlers, function(handler)
		{
			if (handler.route.test(fragment))
			{
				handler.callback(fragment);
				return true;
			}
		});
		
		return matched;
	},
	
	/**
	 * Save a fragment into the hash history, or replace the URL state
	 * if the 'replace' option is passed. You are responsible for properly
	 * URL-encoding the fragment in advance.
	 * 
	 * The options object can contain `trigger: true` if you wish to have the
	 * route callback be fired (not usually desirable), or `replace: true`, if
	 * you wish to modify the current URL without adding an entry to the history.
	 */
	navigate: function(fragment, options)
	{
		if (!this.started) return false;
		
		if (!options || options === true)
		{
			options = {trigger: options};
		}
		
		fragment = this.getFragment(fragment);
		
		if (this.fragment === fragment) 
		{
			return;
		}
		
		this.fragment = fragment;
		this.__updateHash(this.location, fragment, options.replace);
		
		if (options.trigger) 
		{
			this.loadUrl(fragment);
		}
		
		return this;
	},
	
	toString: function()
	{
		return 'conbo.History';
	},
	
	/**
	 * Update the hash location, either replacing the current entry, or
	 * adding a new one to the browser history.
	 * 
	 * @private
	 */
	__updateHash: function(location, fragment, replace)
	{
		if (replace)
		{
			var href = location.href.replace(/(javascript:|#).*$/, '');
			location.replace(href + '#!/' + fragment);
		}
		else
		{
			location.hash = '#!/' + fragment;
		}
	}
	
}).implement(conbo.IInjectable);

__denumerate(conbo.History.prototype);

/**
 * Default instance of the History class
 */
if (document)
{
	conbo.history = new conbo.History();
}

var optionalParam 	= /\((.*?)\)/g;
var namedParam		= /(\(\?)?:\w+/g;
var splatParam		= /\*\w+/g;
var escapeRegExp	= /[\-{}\[\]+?.,\\\^$|#\s]/g;

/**
 * Router
 * 
 * Routers map faux-URLs to actions, and fire events when routes are
 * matched. Creating a new one sets its `routes` hash, if not set statically.
 * 
 * Derived from the Backbone.js class of the same name
 * 
 * @class		conbo.Router
 * @augments	conbo.EventDispatcher
 * @author 		Neil Rackett
 * @param 		{object} options - Object containing initialisation options
 */
conbo.Router = conbo.EventDispatcher.extend(
/** @lends conbo.Router.prototype */
{
	/**
	 * Constructor: DO NOT override! (Use initialize instead)
	 * @private
	 * @param options
	 */
	__construct: function(options) 
	{
		if (options.routes) 
		{
			this.routes = options.routes;
		}
		
		this.__bindRoutes();
		this.context = options.context;
	},
	
	get history()
	{
		return conbo.history;
	},
	
	start: function(options)
	{
		this.history.start(options);
		this.history.addEventListener(conbo.ConboEvent.NAVIGATE, this.dispatchEvent, this);
		this.dispatchEvent(new conbo.ConboEvent(conbo.ConboEvent.STARTED));
		
		return this;
	},
	
	stop: function()
	{
		this.history.stop();
		this.history.removeEventListener(conbo.ConboEvent.NAVIGATE, this.dispatchEvent, this);
		this.dispatchEvent(new conbo.ConboEvent(conbo.ConboEvent.STOPPED));
		
		return this;
	},
	
	/**
	 * Manually bind a single named route to a callback. For example:
	 * 
	 * @example
	 * 		this.route('search/:query/p:num', 'search', function(query, num) {
	 * 			 ...
	 * 		});
	 */ 
	route: function(route, name, callback) 
	{
		if (!conbo.isRegExp(route)) 
		{
			route = this.__routeToRegExp(route);
		}
		
		if (!callback) 
		{
			callback = this[name];
		}
		
		if (conbo.isFunction(name)) 
		{
			callback = name;
			name = '';
		}
		
		if (!callback) 
		{
			callback = this[name];
		}
		
		this.history.route(route, this.bind(function(fragment)
		{
			var args = this.__extractParameters(route, fragment);
			
			callback && callback.apply(this, args);
			
			var options = 
			{
				router:		this,
				route:		route,
				name:		name,
				parameters:	args,
				fragment:	fragment
			};
			
			this.dispatchEvent(new conbo.ConboEvent('route:'+name, options));
			this.dispatchEvent(new conbo.ConboEvent(conbo.ConboEvent.ROUTE, options));
			
			this.history.dispatchEvent(new conbo.ConboEvent(conbo.ConboEvent.ROUTE, options));
		}));
		
		return this;
	},
	
	/**
	 * Simple proxy to `this.history` to save a fragment into the history.
	 */
	navigate: function(fragment, options) 
	{
		this.history.navigate(fragment, options);
		return this;
	},
	
	navigateTo: function(fragment, options) 
	{
		options || (options = {});
		options.trigger = true;
		
		return this.navigate(fragment, options);
	},
	
	get path()
	{
		return this.history.getHash();
	},
	set path(value)
	{
		this.navigateTo(value);
	},
	
	toString: function()
	{
		return 'conbo.Router';
	},
	
	/**
	 * Bind all defined routes to `this.history`. We have to reverse the
	 * order of the routes here to support behavior where the most general
	 * routes can be defined at the bottom of the route map.
	 * 
	 * @private
	 */
	__bindRoutes: function() 
	{
		if (!this.routes)
		{
			return;
		}
		
		var route,
			routes = conbo.keys(this.routes);
		
		while ((route = routes.pop()) != null)
		{
			this.route(route, this.routes[route]);
		}
	},
	
	/**
	 * Convert a route string into a regular expression, suitable for matching
	 * against the current location hash.
	 * 
	 * @private
	 */
	__routeToRegExp: function(route) 
	{
		route = route.replace(escapeRegExp, '\\$&')
			.replace(optionalParam, '(?:$1)?')
			.replace(namedParam, function(match, optional){
				return optional ? match : '([^\/]+)';
			})
			.replace(splatParam, '(.*?)');
		
		return new RegExp('^' + route + '$');
	},

	/**
	 * Given a route, and a URL fragment that it matches, return the array of
	 * extracted decoded parameters. Empty or unmatched parameters will be
	 * treated as `null` to normalize cross-browser behavior.
	 * 
	 * @private
	 */
	__extractParameters: function(route, fragment) 
	{
		var params = route.exec(fragment).slice(1);
		
		return conbo.map(params, function(param) 
		{
			if (param)
			{
				// Fix for Chrome's invalid URI error
				try { return decodeURIComponent(param); }
				catch (e) { return unescape(param); }
			}
			
			return null;
		});
	}
	
}).implement(conbo.IInjectable);

__denumerate(conbo.Router.prototype);


	return conbo;
});