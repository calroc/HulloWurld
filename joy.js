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
	let tokens = tokenize(text),
		expression = parse(tokens);
	return joy(stack, expression, dictionary);
}

var D = {
	add: function add(stack, expression, dictionary) {
		let a, b;
		[a, [b, stack]] = stack;
		return [[a + b, stack], expression, dictionary];
	}
};

function lookup(name) {
	let thing = D[name];
	if (_.isUndefined(thing)) {
		throw 'I dunno what is ' + name;
	}
	return thing;
}

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

function tokenize(text) {
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
	'dictionary': D
};

}