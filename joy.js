/*

	         _/                      _/                   _/   _/_/_/   
	        _/   _/_/   _/    _/       _/_/_/            _/ _/          
	       _/ _/    _/ _/    _/    _/ _/    _/          _/   _/_/       
	_/    _/ _/    _/ _/    _/    _/ _/    _/    _/    _/       _/      
	 _/_/     _/_/     _/_/_/    _/ _/    _/      _/_/   _/_/_/         
	                      _/                                            
	                 _/_/                                               

	An implementation of Manfred von Thun's Joy in CPS in Javascript.

	(CPS = Continuation-Passing Style)

	Depends on https://github.com/aaditmshah/lexer

	Copyright © 2017 Simon Forman

	This program is free software: you can redistribute it and/or modify
	it under the terms of the GNU General Public License as published by
	the Free Software Foundation, either version 3 of the License, or
	(at your option) any later version.

	This program is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	GNU General Public License for more details.

	You should have received a copy of the GNU General Public License
	along with this program.  If not, see <http://www.gnu.org/licenses/>.

*/


function Joy(Lexer) {

function joy(stack, expression, dictionary) {
	let term;
	while (!_.isEmpty(expression)) {
		[term, expression] = expression;
		if (_.isFunction(term)) {
			[stack, expression, dictionary] = term(stack, expression, dictionary);
		} else {
			stack = [term, stack];
		}
	}
	return [stack, expression, dictionary];
}

function run(text, stack, dictionary) {
	let expression = text_to_expression(text, dictionary);
	return joy(stack, expression, dictionary);
}

function text_to_expression(text, dictionary) {
	let tokens = tokenize(text, dictionary);
	return parse(tokens);
}

var D = {
	add: function add(stack, expression, dictionary) {
		let a, b;
		[a, [b, stack]] = stack;
		return [[a + b, stack], expression, dictionary];
	}
};

function lookup(name) {
	let thing = lookup.dictionary[name];
	if (_.isUndefined(thing)) {
		throw 'I dunno what is ' + name;
	}
	return thing;
}

lookup.dictionary = D;

var lexer = new Lexer();
// Float
lexer.addRule(/-?\d+\.\d*/, (s) => (+s));
// Int
lexer.addRule(/-?\d+/, (s) => (+s));
// Brackets
lexer.addRule(/\[|\]/, _.identity);
// Identifier
lexer.addRule(/[\w!@$%^&*()_+<>?|\/;:`~,.=-]+/, lookup);
// Strings
lexer.addRule(/"(?:[^"\\]|\\.)*"/, (s) => (s.slice(1, -1)));
// Blankspace
lexer.addRule(/\s+/, function () {});

function tokenize(text, dictionary) {
	lookup.dictionary = dictionary;
	lexer.setInput(text);
	return mori.intoArray(mori.takeWhile(_.identity, mori.repeatedly(() => lexer.lex())));
}

function parse(tokens) {
	let frame = [],
		stack = [];

	_.each(tokens, function (tok) {
		if (tok == '[') {
			stack.push(frame);
			frame = [];
			stack[stack.length - 1].push(frame);
		} else if (tok == ']') {
			frame = stack.pop();
			frame[frame.length - 1] = array_to_stack(frame[frame.length - 1]);
		} else {
			frame.push(tok);
		}
	});

	return array_to_stack(frame);
}

function array_to_stack(arr) {
	let stack = [];
	_.forEachRight(arr, function (item) {
		stack = [item, stack];
	});
	return stack;
}

// var S = [],
// 	E = [14, [23, [D.add, []]]],
// 	s, e, d;
// [s, e, d] = joy(S, E, D)
// console.log(s.toSource())
// var test_source = '[123.456 ] 23 18 add "it does work." 789';
// [s, e, d] = run(test_source, [], D);
// console.log(s.toSource())

return {
	'joy': joy,
	'run': run,
	'dictionary': D,
	'text_to_expression': text_to_expression
};

}