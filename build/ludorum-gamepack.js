(function (init) { "use strict";
			if (typeof define === 'function' && define.amd) {
				define(["creatartis-base","sermat","ludorum"], init); // AMD module.
			} else if (typeof exports === 'object' && module.exports) {
				module.exports = init(require("creatartis-base"),require("sermat"),require("ludorum")); // CommonJS module.
			} else {
				this["ludorum-gamepack"] = init(this.base,this.Sermat,this.ludorum); // Browser.
			}
		}).call(this,/** Package wrapper and layout.
*/
function __init__(base, Sermat, ludorum) { "use strict";
// Import synonyms. ////////////////////////////////////////////////////////////////////////////////

// Library layout. /////////////////////////////////////////////////////////////////////////////////
	var exports = {
		__package__: 'ludorum-gamepack',
		__name__: 'ludorum_gamepack',
		__init__: __init__,
		__dependencies__: [base, Sermat, ludorum],
		__SERMAT__: { include: [base, ludorum] }
	};

// Imports /////////////////////////////////////////////////////////////////////////////////////////
/* jshint -W034 */ // Avoid JSHint warning for unnecesary "use strict" directive.

var that = {
	base: base,
	Sermat: Sermat,
	ludorum: ludorum
};


(function () { this['ludorum-game-connect4'] = (/** Package wrapper and layout.
*/
function __init__(base, Sermat, ludorum) { "use strict";
// Import synonyms. ////////////////////////////////////////////////////////////////////////////////
	var declare = base.declare,
		//obj = base.obj,
		//copy = base.copy,
		raise = base.raise,
		raiseIf = base.raiseIf,
		Iterable = base.Iterable,
		iterable = base.iterable,
		Game = ludorum.Game,
		UserInterface = ludorum.players.UserInterface;

// Library layout. /////////////////////////////////////////////////////////////////////////////////
	var exports = {
		__package__: 'ludorum-game-connect4',
		__name__: 'ludorum_game_connect4',
		__init__: __init__,
		__dependencies__: [base, Sermat, ludorum],
		__SERMAT__: { include: [base, ludorum] }
	};


/** # ConnectFour.

Implementation of the [Connect Four game](http://en.wikipedia.org/wiki/Connect_Four), based on
Ludorum's `ConnectionGame`.
*/
var ConnectFour = exports.ConnectFour = declare(ludorum.games.ConnectionGame, {
	name: 'ConnectFour',

	/** The default `height` of the board is 6 ...
	*/
	height: 6,

	/** ... and the default `width` of the board is 7.
	*/
	width: 7,

	/** The default `lineLength` to win the game is 4.
	*/
	lineLength: 4,

	/** The game's players are Yellow and Red, since these are the classic colours of the pieces.
	*/
	players: ['Yellow', 'Red'],

	/** The active players `moves()` are the indexes of every column that has not reached the top
	height.
	*/
	moves: function moves() {
		var result = null;
		if (!this.result()) {
			var ms = [],
				board = this.board.string,
				offset = (this.height - 1) * this.width;
			for (var i = 0; i < board.length; ++i) {
				if (board.charAt(offset + i) === '.') {
					ms.push(i);
				}
			}
			if (ms.length > 0) {
				result = {};
				result[this.activePlayer()] = ms;
			}
		}
		return result;
	},

	/** The `next(moves)` game state drops a piece at the column with the index of the active
	player's move.
	*/
	next: function next(moves, haps, update) {
		raiseIf(haps, 'Haps are not required (given ', haps, ')!');
		var activePlayer = this.activePlayer(),
			board = this.board.string,
			column = +moves[activePlayer],
			height = this.height,
			width = this.width;
		for (var row = 0; row < height; ++row) {
			if (board.charAt(row * width + column) === '.') {
				var v = activePlayer === this.players[0] ? '0' : '1';
				if (update) {
					this.activatePlayers(this.opponent());
					this.board.__place__([row, column], v);
					delete this.__moves__; // Invalidate cached values.
					delete this.__result__;
					return this;
				} else {
					return new this.constructor(this.opponent(),
						this.board.place([row, column], v));
				}
			}
		}
		throw new Error('Invalid move '+ JSON.stringify(moves) +'!');
	},

	result: function result() { //FIXME Workaround for bugs in Ludorum v0.2.0.
		var lineLength = this.lineLength,
			lines = this.board.asStrings(this.__lines__(this.height, this.width, lineLength)).join(' ');
		for (var i = 0; i < this.players.length; ++i) {
			if (lines.indexOf(i.toString(36).repeat(lineLength)) >= 0) {
				return this.victory([this.players[i]]);
			}
		}
		if (lines.indexOf('.') < 0) { // No empty squares means a tie.
			return this.tied();
		}
		return null; // The game continues.
	},

	// ## Utility methods ##########################################################################

	/** Serialization is delegated to the serializer of the parent class.
	*/
	'static __SERMAT__': {
		identifier: 'ConnectFour',
		serializer: function serialize_ConnectFour(obj) {
			return ludorum.games.ConnectionGame.__SERMAT__.serializer(obj);
		}
	},
}); // declare ConnectFour.

/** Adding Mancala to `ludorum.games`.
*/
ludorum.games.ConnectFour = ConnectFour;

/** Sermat serialization.
*/
ConnectFour.__SERMAT__.identifier = exports.__package__ +'.'+ ConnectFour.__SERMAT__.identifier;
exports.__SERMAT__.include.push(ConnectFour);
Sermat.include(exports);


// See __prologue__.js
	return exports;
}

)(base, Sermat, ludorum); }).call(that);


(function () { this['ludorum-game-colograph'] = (/** Package wrapper and layout.
*/
function __init__(base, Sermat, ludorum) { "use strict";
// Import synonyms. ////////////////////////////////////////////////////////////////////////////////
	var declare = base.declare,
		obj = base.obj,
		copy = base.copy,
		raise = base.raise,
		raiseIf = base.raiseIf,
		Iterable = base.Iterable,
		iterable = base.iterable,
		Game = ludorum.Game,
		UserInterface = ludorum.players.UserInterface;

// Library layout. /////////////////////////////////////////////////////////////////////////////////
	var exports = {
		__package__: 'ludorum-game-colograph',
		__name__: 'ludorum_game_colograph',
		__init__: __init__,
		__dependencies__: [base, Sermat, ludorum],
		__SERMAT__: { include: [base, ludorum] }
	};


/** # Colograph

Implementation of the game Colograph, a competitive version of the classic [graph colouring problem](http://en.wikipedia.org/wiki/Graph_coloring).
*/
var Colograph = exports.Colograph = declare(Game, {
	name: 'Colograph',

	/** The constructor takes the following arguments:
	*/
	constructor: function Colograph(args) {
		/** + `activePlayer`: There is only one active player per turn, and it is the first player
			by default.
		*/
		Game.call(this, args ? args.activePlayer : undefined);
		base.initialize(this, args)
		/** + `colours`: The colour of each node in the graph is given by an array of integers, each
			being the node's player index in the players array, or -1 for uncoloured nodes. By
			default all nodes are not coloured, which is the initial game state.
		*/
			.object('colours', { defaultValue: {} })
		/** + `edges`: The edges of the graph are represented by an array of arrays of integers,
			acting as an adjacency list.
		*/
			.array('edges', { defaultValue: [[1,3],[2],[3],[]] })
		/** + `shapes`: Each of the graph's nodes can have a certain shape. This is specified by an
			array of strings, one for each node.
		*/
			.array('shapes', { defaultValue: ['circle', 'triangle', 'square', 'star'] })
		/** + `scoreSameShape=-1`: Score added by each coloured edge that binds two nodes of the
			same shape.
		*/
			.number('scoreSameShape', { defaultValue: -1, coerce: true })
		/** + `scoreDifferentShape=-1`: Score added by each coloured edge that binds two nodes of
			different shapes.
		*/
			.number('scoreDifferentShape', { defaultValue: -1, coerce: true });
	},

	/** There are two roles in this game: Red and Blue.
	*/
	players: ['Red', 'Blue'],

	/** Scores are calculated for each player with the edges of their colour. An edge connecting two
	nodes of the same colour is considered to be of that colour.
	*/
	score: function score() {
		var points = {},
			shapes = this.shapes,
			colours = this.colours,
			scoreSameShape = this.scoreSameShape,
			scoreDifferentShape = this.scoreDifferentShape,
			startingPoints = this.edges.length;
		this.players.forEach(function (player) {
			points[player] = startingPoints;
		});
		iterable(this.edges).forEach(function (n1_edges, n1) {
			n1_edges.forEach(function (n2) {
				var k = n1 +','+ n2;
				if (colours.hasOwnProperty(k)) {
					points[colours[k]] += shapes[n1] === shapes[n2] ? scoreSameShape : scoreDifferentShape;
				}
			});
		});
		return points;
	},

	/** The game ends when the active player has no moves, i.e. when all nodes in the graph have
	been coloured. The match is won by the player with the greatest score.
	*/
	result: function result() {
		if (!this.moves()) { // If the active player cannot move, the game is over.
			var points = this.score(),
				players = this.players;
			return this.zerosumResult(points[players[0]] - points[players[1]], players[0]);
		} else {
			return null; // The game continues.
		}
	},

	/** Every non coloured node is a possible move for the active player.
	*/
	moves: function moves() {
		var colours = this.colours,
			uncoloured = [];
		for (var i = 0, len = this.edges.length; i < len; i++) {
			if (!colours.hasOwnProperty(i)) {
				uncoloured.push(i);
			}
		}
		return uncoloured.length < 1 ? null : obj(this.activePlayer(), uncoloured);
	},

	/** The result of any move is the colouring of one previously uncoloured node with the active
	players's colour.
	*/
	next: function next(moves, haps, update) {
		raiseIf(haps, 'Haps are not required (given ', haps, ')!');
		var activePlayer = this.activePlayer(),
			move = moves[activePlayer] |0;
		raiseIf(move < 0 || move >= this.edges.length,
			'Invalid move: node ', move, ' does not exist in ', this, '.');
		raiseIf(this.colours.hasOwnProperty(move),
			'Invalid move: node ', move, ' has already been coloured in ', this, '.');
		var newColours = Object.assign(obj(move, activePlayer), this.colours);
		this.edges[move].forEach(function (n2) { // Colour edges from the one coloured in this move.
			if (newColours[n2] === activePlayer) {
				newColours[move +','+ n2] = activePlayer;
			}
		});
		this.edges.forEach(function (adjs, n1) { // Colour edges to the one coloured in this move.
			if (n1 !== move && adjs.indexOf(move) >= 0 && newColours[n1] === activePlayer) {
				newColours[n1 +','+ move] = activePlayer;
			}
		});
		var args = {
			activePlayer: this.opponent(activePlayer),
			colours: newColours,
			edges: this.edges,
			shapes: this.shapes,
			scoreSameShape: this.scoreSameShape,
			scoreDifferentShape: this.scoreDifferentShape
		};
		if (update) {
			this.constructor(args);
			return this;
		} else {
			return new this.constructor(args);
		}
	},

	// ## Utility methods ##########################################################################

	/** Serialization is used in the `toString()` method, but it is also vital for sending the game
	state across a network or the marshalling between the rendering thread and a webworker.
	*/
	'static __SERMAT__': {
		identifier: 'Colograph',
		serializer: function serialize_Colograph(obj) {
			return [{
				activePlayer: obj.activePlayer(),
				colours: obj.colours,
				edges: obj.edges,
				shapes: obj.shapes,
				scoreSameShape: obj.scoreSameShape,
				scoreDifferentShape: obj.scoreDifferentShape
			}];
		}
	},

	// ## Game properties. #########################################################################

	/** `edgeColour(node1, node2)` returns a colour (player index) if the nodes are joined by an
	edge, and both have that same colour.
	*/
	edgeColour: function edgeColour(node1, node2) {
		var connected = this.edges[node1].indexOf(node2) >= 0 || this.edges[node2].indexOf(node1) >= 0,
			colour1 = this.colours[node1],
			colour2 = this.colours[node2];
		return connected && colour1 >= 0 && colour1 === colour2 ? colour1 : -1;
	},

	// ## Graph generation. ########################################################################

	/** One of the nice features of this game is the variety that comes from chaning the graph on
	which the game is played. `randomGraph` can be used to generate graphs to experiment with.
	*/
	'static randomGraph': function randomGraph(nodeCount, edgeCount, random) {
		nodeCount = Math.max(2, +nodeCount >> 0);
		edgeCount = Math.max(nodeCount - 1, +edgeCount >> 0);
		var edges = Iterable.range(nodeCount - 1).map(function (i) {
			return random.split(1, Iterable.range(i + 1, nodeCount).toArray());
		}).toArray();
		for (var n = edgeCount - (nodeCount - 1), pair, pair2; n > 0; n--) {
			pair = random.choice(edges);
			if (pair[1].length > 0) {
				pair2 = random.split(1, pair[1]);
				pair[0].push(pair2[0][0]);
				pair[1] = pair2[1];
				n--;
			}
		}
		edges = edges.map(function (pair) {
			return pair[0];
		});
		edges.push([]); // Last node has no edges.
		return edges;
	},

	/** `randomGame(params)` will generates a random Colograph game with a random graph.
	*/
	'static randomGame': function randomGame(params) {
		params = base.initialize({}, params)
			.object('random', { defaultValue: base.Randomness.DEFAULT })
			.integer('nodeCount', { defaultValue: 8, coerce: true })
			.integer('edgeCount', { defaultValue: 11, coerce: true })
			.integer('shapeCount', { defaultValue: 4, coerce: true, minimum: 1, maximum: 4 })
			.array('shapes', { defaultValue: ['circle', 'triangle', 'square', 'star'] })
			.subject;
		return new this({
			edges: this.randomGraph(params.nodeCount, params.edgeCount, params.random),
			shapes: params.random.randoms(params.nodeCount, 0, params.shapeCount).map(function (r) {
				return params.shapes[r|0];
			}),
			scoreSameShape: 1
		});
	}
}); // declare Colograph.

/** Adding Mancala to `ludorum.games`.
*/
ludorum.games.Colograph = Colograph;

/** Sermat serialization.
*/
Colograph.__SERMAT__.identifier = exports.__package__ +'.'+ Colograph.__SERMAT__.identifier;
exports.__SERMAT__.include.push(Colograph);
Sermat.include(exports);


/** # User interface

The user interface for playtesters is based on [SVG](https://www.w3.org/TR/SVG/).
*/

Object.assign(Colograph.prototype, {

/** Nodes in the `Colograph` object do not have a defined position. Yet they must be given one if
the board is going to be rendered properly. This _arrangement_ methods calculate an array of
positions for every node in the game, follwing different criteria:

+ `circularArrangement` puts all nodes in a circle of a given `radius`.
*/
	circularArrangement: function circularArrangement(radius) {
		radius = radius || 200;
		var angle = 2 * Math.PI / this.edges.length;
		return this.edges.map(function (adjs, n) {
			return [Math.round(radius * Math.cos(angle * n)),
				Math.round(radius * Math.sin(angle * n))];
		});
	},

	//TODO More arrangement options.

/** Each player in the game represents a `playerColour`. If the game state has a `playerColours`
property defined, it is assumed it maps players with CSS colour names. Else the players' names in
lowercase are used as CSS colour names.
*/
	playerColour: function (player, playerColours) {
		playerColours = playerColours || this.playerColours;
		return playerColours && playerColours[player] ||
			player && (player +'').toLowerCase() || '';
	},

/** ## SVG #########################################################################################

These function implement the generation of Colograph game interfaces based on [Scalable Vector
Graphics (a.k.a. SVG)](https://www.w3.org/TR/SVG/).
*/

/** The _envelope_ of the SVG definitions include the processing instruction (`<?xml ... ?>`), the
SVG's DOCTYPE and the root element `svg`. The `xlink` namespace is used in the `use` elements.
*/
	__svgEnvelope__: function __svgEnvelope__(width, height, source) {
		return '<?xml version="1.0" standalone="no"?>\n'+
			'<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" '+
				'"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n'+
			'<svg height="'+ height +'px" width="'+ width +'px" version="1.1"\n'+
				'xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">\n'+
			(Array.isArray(source) ? source.join('\n\t') : source) +
			'\n</svg>';
	},

/** The generated SVG for a Colograph game uses CSS styles as much as possible. Two style are
defined for each player and the blank state, one for edges and one for nodes.
*/
	__svgStyles__: function __svgStyles__(playerColours) {
		var game = this;
		return '<style type="text/css" ><![CDATA[\n'+
			'\t.blank-node { stroke:black; stroke-width:2px; fill:white; }\n'+
			'\t.blank-node:hover { stroke-width:4px; }\n'+
			'\t.blank-edge { stroke:black; stroke-width:2px; }\n'+
			this.players.map(function (p) { // Embedded CSS Styles
				var colour = game.playerColour(p, playerColours);
				return '\t.'+ colour +'-node { stroke:black; stroke-width:2px; fill:'+ colour +
					'}\n\t.'+	colour +'-edge { stroke:'+ colour +'; stroke-width:2px }';
			}).join('\n') +
			'\t]]>\n\t</style>\n';
	},

/** All possible node shapes are defined in a `defs` element, so they can be reused. A translate
transform is used to put each node in its corresponding possition. Still, `nodeSize` has to be
provided, since scaling may lead to weird results.
*/
	__svgDefs__: function __svgDefs__(nodeSize) {
		nodeSize = nodeSize || 30;
		return ['<defs>',
			this.__svgDefCircle__(nodeSize),
			this.__svgDefSquare__(nodeSize),
			this.__svgDefStar__(nodeSize),
			this.__svgDefTriangle__(nodeSize),
			this.__svgDefPentagon__(nodeSize),
			this.__svgDefHexagon__(nodeSize),
			'</defs>'
		].join('\n');
	},

/** Some of the available shapes are defined as polygons, given the `points` of their vertices.
These points are multiplied by `nodeSize`, hence the shape they defined must be centered at (0,0)
and must have a size of 1.
*/
	__svgDefPolygon__: function __svgDefPolygon__(name, points, nodeSize) {
		points = points.map(function (p) {
			return [p[0] * nodeSize, p[1] * nodeSize];
		});
		return '\t<polygon id="'+ name +'-node" points="'+ points.join(' ') +'"/>';
	},

/** Available shapes are:
	+ `circle`,
*/
	__svgDefCircle__: function __svgDefCircle__(nodeSize) {
		return '\t<circle id="circle-node" r="'+ (nodeSize / 2) +'px" cx="0" cy="0"/>';
	},

/** + `square`,
*/
	__svgDefSquare__: function __svgDefSquare__(nodeSize) {
		return '\t<rect id="square-node" width="'+ nodeSize +'px" height="'+ nodeSize +'px"'+
			' x="-'+ (nodeSize / 2) +'" y="-'+ (nodeSize / 2) +'"/>';
	},

/** + `triangle` (equilateral),
*/
	__svgDefTriangle__: function __svgDefTriangle__(nodeSize) {
		return this.__svgDefPolygon__('triangle', [
				[-0.50,+0.44], [+0.00,-0.44], [+0.50,+0.44]
			], nodeSize);
	},

/** + `star` (five points),
*/
	__svgDefStar__: function __svgDefStar__(nodeSize) {
		return this.__svgDefPolygon__('star', [
				[+0.00,-0.48], [+0.12,-0.10], [+0.50,-0.10], [+0.20,+0.10], [+0.30,+0.48],
				[+0.00,+0.26], [-0.30,+0.48], [-0.20,+0.10], [-0.50,-0.10], [-0.12,-0.10]
			], nodeSize);
	},

/** + `pentagon` (regular),
*/
	__svgDefPentagon__: function __svgDefPentagon__(nodeSize) {
		return this.__svgDefPolygon__('pentagon', [
				[+0.00,-0.48], [+0.50,-0.10], [+0.30,+0.48], [-0.30,+0.48], [-0.50,-0.10]
			], nodeSize);
	},

/** + `hexagon` (regular),
*/
	__svgDefHexagon__: function __svgDefHexagon__(nodeSize) {
		return this.__svgDefPolygon__('pentagon', [
				[+0.00,-0.50], [+0.42,-0.24], [+0.42,+0.24], [+0.00,+0.50], [-0.42,+0.24],
				[-0.42,-0.24]
			], nodeSize);
	},

/** The method `toSVG` generates the SVG representation of a Colograph game state.
*/
	toSVG: function toSVG(width, height, nodeSize, positions) {
		width = width || 400;
		height = height || 400;
		positions = positions || this.circularArrangement(Math.max(width, height) / 2.5);
		var game = this,
			colours = this.colours,
		 	svg = [
				this.__svgStyles__(),
				this.__svgDefs__(nodeSize),
				'\t<g id="colograph" transform="translate('+ (width / 2) +','+ (height / 2) +')">'
			];
		/** Edges are drawn before the nodes, so they do not appear in front of them.
		*/
		this.edges.forEach(function (n2s, n1) {
			var pos1 = positions[n1];
			n2s.forEach(function (n2) {
				var pos2 = positions[n2],
					colour = colours[n1 +','+ n2],
					cssClass = (game.playerColour(colour) || 'blank') +'-edge';
				svg.push('\t<line class="'+ cssClass +'" x1="'+ pos1[0] +'" y1="'+ pos1[1] +
					'" x2="'+ pos2[0] +'" y2="'+ pos2[1] +'"/>');
			});
		});
		/** Node shapes reuse the definitions generated before, and are put in place with a
		translation transform.
		*/
		var shapes = this.shapes;
		this.edges.forEach(function (adjs, n) {
			var pos = positions[n],
				colour = colours[n],
				cssClass = (game.playerColour(colour) || 'blank') +'-node';
			svg.push('<use id="node'+ n +'" xlink:href="#'+ shapes[n] +'-node" '+
				'transform="translate('+ pos.join(',') +')" class="'+ cssClass +'" '+
				'data-ludorum-move="'+ n +'"/>');
		});
		svg.push('\t</g>');
		return this.__svgEnvelope__(width, height, svg);
	} // Colograph.toSVG
}); //


// # AI for Colograph.

// ## Heuristics ###################################################################################

/** `heuristics` is a namespace for heuristic evaluation functions to be used with artificial
intelligence methods such as Minimax.
*/
Colograph.heuristics = {
	/** `scoreDifference(game, player)` is a simple heuristic that uses the current score.
	*/
	scoreDifference: function scoreDifference(game, player) {
		var score = game.score(),
			result = 0;
		for (var p in score) {
			result += p === player ? score[p] : -score[p];
		}
		return result / game.edges.length / 2;
	}
}; // Colograph.heuristics


// See __prologue__.js
	return exports;
}

)(base, Sermat, ludorum); }).call(that);


(function () { this['ludorum-game-mancala'] = (/** Package wrapper and layout.
*/
function __init__(base, Sermat, ludorum) { "use strict";
// Import synonyms. ////////////////////////////////////////////////////////////////////////////////
	var declare = base.declare,
		//obj = base.obj,
		//copy = base.copy,
		raise = base.raise,
		raiseIf = base.raiseIf,
		Iterable = base.Iterable,
		iterable = base.iterable,
		Game = ludorum.Game,
		UserInterface = ludorum.players.UserInterface;

// Library layout. /////////////////////////////////////////////////////////////////////////////////
	var exports = {
		__package__: 'ludorum-game-mancala',
		__name__: 'ludorum_game_mancala',
		__init__: __init__,
		__dependencies__: [base, Sermat, ludorum],
		__SERMAT__: { include: [base, ludorum] }
	};


/** # Mancala

Implementation of the [Kalah](http://en.wikipedia.org/wiki/Kalah) member of the
[Mancala family of games](http://en.wikipedia.org/wiki/Mancala).
*/
var Mancala = exports.Mancala = declare(Game, {
	name: 'Mancala',

	/** The constructor takes the `activePlayer` (`"North"` by default) and the board as an array of
	integers (initial board by default).
	*/
	constructor: function Mancala(activePlayer, board){
		Game.call(this, activePlayer);
		this.board = board || this.makeBoard();
	},

	/** `makeBoard(seeds, houses)` builds an array for the given amounts of houses and seeds per
	house. By default 4 seeds and 6 houses per player are assumed.
	*/
	makeBoard: function makeBoard(seeds, houses){
		seeds = isNaN(seeds) ? 4 : +seeds;
		houses = isNaN(houses) ? 6 : +houses;
		var result = [];
		for(var j = 0; j < 2; j++){
			for(var i = 0; i < houses; i++){
				result.push(seeds);
			}
			result.push(0);
		}
		return result;
	},

	/** The players' roles in a Mancala match are `"North"` and `"South"`.
	*/
	players: ["North", "South"],

	/** If `emptyCapture` is true, making a capture only moves the active player's seed to his
	store, and the opponents seeds are not captured. By default this is false.
	*/
	emptyCapture: false,

	/** If `countRemainingSeeds` is true, at the end of the game if a player has seeds on his
	houses, those seeds are included in his score. This is the default behaviour.
	*/
	countRemainingSeeds: true,

	// ## Game state information ###################################################################

	/** `store(player)` returns the index in this game's board of the player's store.
	*/
	store: function store(player){
		switch (this.players.indexOf(player)) {
			case 0: return this.board.length / 2 - 1; // Store of North.
			case 1: return this.board.length - 1; // Store of South.
			default: throw new Error("Invalid player "+ player +".");
		}
	},

	/** `houses(player)` returns an array with the indexes of the player's houses in this game's
	board.
	*/
	houses: function houses(player){
		switch (this.players.indexOf(player)) {
			case 0: return Iterable.range(0, this.board.length / 2 - 1).toArray(); // Store of North.
			case 1: return Iterable.range(this.board.length / 2, this.board.length - 1).toArray(); // Store of South.
			default: throw new Error("Invalid player "+ player +".");
		}
	},

	/** The house in front of a players house is calculated by `oppositeHouse(player, i)`. It
	returns the index of the opposite house of `i` for the given player, or a negative if `i` is not
	a house of the given player. This is necessary for resolving captures.
	*/
	oppositeHouse: function oppositeHouse(player, i) {
		var playerHouses = this.houses(player),
			opponentHouses = this.houses(this.opponent(player)),
			index = playerHouses.indexOf(i);
		return index < 0 ? index : opponentHouses.reverse()[index];
	},

	/** The flow of seeds on the board is defined by `nextSquare(player, i)`. It returns the index
	of the square following `i` for the given player.
	*/
	nextSquare: function nextSquare(player, i){
		do {
			i = (i + 1) % this.board.length;
		} while (i === this.store(this.opponent(player)));
		return i;
	},

	// ## Game logic ###############################################################################

	/** A move for a Mancala player is an index of the square in the board.
	*/
	moves: function moves(){
		if (this.result()) {
			return null;
		} else {
			var board = this.board,
				result = {},
				activePlayer = this.activePlayer();
			result[activePlayer] = this.houses(activePlayer).filter(function(house){
				return board[house] > 0; // The house has seeds.
			});
			return result[activePlayer].length > 0 ? result : null;
		}
	},

	/** The game ends when the active player cannot move. The `score()` for each player is the seed
	count of its store and (if `countRemainingSeeds` is true) the houses on its side of the board.
	*/
	scores: function scores() {
		var game = this,
			board = this.board,
			sides = this.players.map(function (player) {
				return iterable(game.houses(player)).map(function (h) {
					return board[h];
				}).sum();
			});
		if (sides[0] > 0 && sides[1] > 0) { // Both sides have seeds.
			return null;
		} else { // One side has no seeds.
			var _scores = {};
			this.players.forEach(function (player, i) {
				_scores[player] = board[game.store(player)] + game.countRemainingSeeds * sides[i];
			});
			return _scores;
		}
	},

	/** The result for each player is the difference between its score and the opponent's.
	*/
	result: function result() {
		var scores = this.scores(),
			players = this.players;
		return scores && this.zerosumResult(scores[players[0]] - scores[players[1]], players[0]);
	},

	/** The `next(moves)` game state implies taking all seeds from the selected house and moving
	them across the board, placing one seed at each step. A player can pass through its store but
	not through the opponent's. If the move ends at the active player's store, then it has another
	move. If it ends at an empty house, capture may occur.
	*/
	next: function next(moves, haps, update) {
		raiseIf(haps, 'Haps are not required (given ', haps, ')!');
		var activePlayer = this.activePlayer(),
			move = +moves[activePlayer],
			newBoard = this.board.slice(0),
			seeds = newBoard[move],
			freeTurn = false,
			store, oppositeHouse;
		raiseIf(seeds < 1, "Invalid move ", move, " for game ", this);
		// Move.
		newBoard[move] = 0;
		for (; seeds > 0; seeds--) {
			move = this.nextSquare(activePlayer, move);
			newBoard[move]++;
		}
		// Free turn if last square of the move is the player's store.
		freeTurn = move == this.store(activePlayer);
		// Capture.
		if (!freeTurn) {
			oppositeHouse = this.oppositeHouse(activePlayer, move);
			if (oppositeHouse >= 0 && newBoard[move] == 1 && newBoard[oppositeHouse] > 0) {
				store = this.store(activePlayer);
				newBoard[store]++;
				newBoard[move] = 0;
				if (!this.emptyCapture) {
					newBoard[store] += newBoard[oppositeHouse];
					newBoard[oppositeHouse] = 0;
				}
			}
		}
		var nextPlayer = freeTurn ? activePlayer : this.opponent();
		if (update) {
			this.activatePlayers(nextPlayer);
			this.board = newBoard;
			return this;
		} else {
			return new this.constructor(nextPlayer, newBoard);
		}
	},

	/** The `resultBounds` for a Mancala game are estimated with the total number of seeds in the
	board. It is very unlikely to get these result though.
	*/
	resultBounds: function resultBounds() {
		var stoneCount = iterable(this.board).sum();
		return [-stoneCount,+stoneCount];
	},

	// ## Utility methods ##########################################################################

	/** Serialization is used in the `toString()` method, but it is also vital for sending the game
	state across a network or the marshalling between the rendering thread and a webworker.
	*/
	'static __SERMAT__': {
		identifier: exports.__package__ +'.Mancala',
		serializer: function serialize_Mancala(obj) {
			return [obj.activePlayer(), obj.board];
		}
	},

	identifier: function identifier() {
		return this.activePlayer().charAt(0) + this.board.map(function (n) {
			return ('00'+ n.toString(36)).substr(-2);
		}).join('');
	},

	/** `printBoard()` creates a text (ASCII) version of the board.
	*/
	printBoard: function printBoard() {
		var game = this,
			lpad = base.Text.lpad,
			north = this.players[0],
			northHouses = this.houses(north).map(function (h) {
				return lpad(''+ game.board[h], 2, '0');
			}).reverse(),
			northStore = lpad(''+ this.board[this.store(north)], 2, '0'),
			south = this.players[1],
			southHouses = this.houses(south).map(function (h) {
				return lpad(''+ game.board[h], 2, '0');
			}),
			southStore = lpad(''+ this.board[this.store(south)], 2, '0');
		return "   "+ northHouses.join(" | ") +"   \n"+
			northStore +" ".repeat(northHouses.length * 2 + (northHouses.length - 1) * 3 + 2) + southStore +"\n"+
			"   "+ southHouses.join(" | ") +"   ";
	}
}); // declare Mancala.

// ## Mancala type initialization ##################################################################

/** The `makeBoard` can also be used without an instance of Mancala.
*/
Mancala.makeBoard = Mancala.prototype.makeBoard;

/** Adding Mancala to `ludorum.games`.
*/
ludorum.games.Mancala = Mancala;

/** Sermat serialization.
*/
exports.__SERMAT__.include.push(Mancala);
Sermat.include(exports);


/** # Heuristics for Mancala

`Mancala.heuristics` is a bundle of helper functions to build heuristic evaluation functions for
this game.
*/
Mancala.heuristics = {
	/** + `heuristicFromWeights(weights=default weights)` builds an heuristic evaluation
		function from weights for each square in the board. The result of the function is the
		normalized weighted sum.
	*/
	fromWeights: function fromWeights(weights) {
		var weightSum = iterable(weights).map(Math.abs).sum();
		function __heuristic__(game, player) {
			var seedSum = 0, signum, result;
			switch (game.players.indexOf(player)) {
				case 0: signum = 1; break; // North.
				case 1: signum = -1; break; // South.
				default: throw new Error("Invalid player "+ player +".");
			}
			result = iterable(game.board).map(function (seeds, i) {
				seedSum += seeds;
				return seeds * weights[i]; //TODO Normalize weights before.
			}).sum() / weightSum / seedSum * signum;
			return result;
		}
		__heuristic__.weights = weights;
		return __heuristic__;
	}
};

/** The `DEFAULT` heuristic for Mancala is based on weights for each square. Stores are worth 5 and
houses 1, own possitive and the opponent's negative.
*/
Mancala.heuristics.DEFAULT = Mancala.heuristics.fromWeights(
	[+1,+1,+1,+1,+1,+1,+5, /**/ -1,-1,-1,-1,-1,-1,-5]
);


// See __prologue__.js
	return exports;
}

)(base, Sermat, ludorum); }).call(that);


(function () { this['ludorum-game-reversi'] = (/** Package wrapper and layout.
*/
function __init__(base, Sermat, ludorum) { "use strict";
// Import synonyms. ////////////////////////////////////////////////////////////////////////////////
	var declare = base.declare,
		obj = base.obj,
		copy = base.copy,
		raise = base.raise,
		raiseIf = base.raiseIf,
		Iterable = base.Iterable,
		iterable = base.iterable,
		Game = ludorum.Game,
		Checkerboard = ludorum.utils.Checkerboard,
		CheckerboardFromString = ludorum.utils.CheckerboardFromString,
		UserInterface = ludorum.players.UserInterface;

// Library layout. /////////////////////////////////////////////////////////////////////////////////
	var exports = {
		__package__: 'ludorum-game-reversi',
		__name__: 'ludorum_game_reversi',
		__init__: __init__,
		__dependencies__: [base, Sermat, ludorum],
		__SERMAT__: { include: [base, ludorum] }
	};


/** # Reversi

Implementation of [Reversi](http://en.wikipedia.org/wiki/Reversi) for Ludorum.
*/
var Reversi = exports.Reversi = declare(Game, {
	name: 'Reversi',

	/** The constructor takes the `activePlayer` (`"Black"` by default) and a board (initial board
	by default). The board is represented by an array of two integers and a string:
	`[rows, columns, string]`. The string must have:

	+ `'W'` for every square occupied by a white piece.
	+ `'B'` for every square occupied by a black piece.
	+ `'.'` for every empty square.
	*/
	constructor: function Othello(activePlayer, board){
		Game.call(this, activePlayer);
		this.board = this.makeBoard.apply(this, board || []);
	},

	/** `makeBoard(rows=8, columns=8, string)` is used to build the initial board.
	*/
	'dual makeBoard': function makeBoard(rows, columns, string){ //FIXME
		rows = isNaN(rows) ? 8 : +rows;
		columns = isNaN(columns) ? 8 : +columns;
		raiseIf(rows < 4 || columns < 4 || rows % 2 || columns % 2,
			"An Reversi board must have even dimensions greater than 3.");
		if (typeof string === 'string') {
			return new CheckerboardFromString(rows, columns, string);
		} else {
			return new CheckerboardFromString(rows, columns);
		}
	},

	/** The game is played by two players: Black and White. Black moves first.
	*/
	players: ["Black", "White"],

	/** Much of the move calculations are based on the possible lines in the board. These are
	calculated and cached by the `lines(rows, cols)` function.
	*/
	lines: (function (cache) {
		return function lines(rows, cols) {
			var key = rows +'x'+ cols,
				result = cache[key];
			if (typeof result === 'undefined') {
				result = cache[key] = new Checkerboard(rows, cols).lines().map(function(line) {
					return line.toArray();
				}, function(line){
					return line.length > 2;
				}).toArray();
			}
			return result;
		};
	})({}),

	/** Another optimization in the move logic uses regular expressions to match patterns in the
	board. These are predefined as a _class_ member.
	*/
	__MOVE_REGEXPS__: {
		"Black": [/\.W+B/g, /BW+\./g],
		"White": [/\.B+W/g, /WB+\./g]
	},

	/** The board's center is defined by the coordinates of the middle four squares.
	*/
	'dual boardCenter': function boardCenter(board) {
		board = board || this.board;
		var w = board.width,
			h = board.height;
		return [[h/2, w/2-1], [h/2-1, w/2], [h/2, w/2], [h/2-1, w/2-1]];
	},

	/** A move always places a piece in an empty square. If there are empty square at the center of
	the board, the active player must place a piece in one of them. Else, a piece can be placed if
	and only if by doing so one or more lines of the opponent's pieces get enclosed between pieces
	of the active player.
	*/
	moves: function moves(player){
		player = player || this.activePlayer();
		if (this.hasOwnProperty('__moves'+ player +'__')) {
			return this['__moves'+ player +'__'];
		}
		var board = this.board,
			coords = {},
			regexps = this.__MOVE_REGEXPS__[player];
		var _moves = this.boardCenter().filter(function (coord) {
				return board.square(coord) === '.';
			});
		if (_moves.length < 1) {
			this.lines(board.height, board.width).forEach(function(line){
				regexps.forEach(function (regexp) {
					board.asString(line).replace(regexp, function(m, i){
						var coord = m.charAt(0) === "." ? line[i] : line[m.length - 1 + i];
						coords[coord] = coord;
						return m;
					});
				});
			});
			for (var id in coords) {
				_moves.push(coords[id]);
			}
		}
		_moves = _moves.length > 0 ? obj(player, _moves) : null;
		if (arguments.length < 1) {
			return this['__moves'+ player +'__'] = _moves; // Cache the result.
		}
		return _moves;
	},

	validMoves: function validMoves(moves) {
		var allMoves = this.moves();
		for (var player in allMoves) {
			if (!moves.hasOwnProperty(player)) {
				return false;
			}
			var validMove = allMoves[player].join('\n').indexOf(moves[player] +'') >= 0;
			if (!validMove) {
				return false;
			}
		}
		return true;
	},

	/** When the active player encloses one or more lines of opponent's pieces between two of its
	own, all those are turned into active player's pieces.
	*/
	next: function next(moves, haps, update) {
		raiseIf(haps, 'Haps are not required (given ', haps, ')!');
		if (!this.validMoves(moves)) {
			raise("Invalid moves "+ JSON.stringify(moves) +"!");
		}
		var board = this.board.clone(),
			activePlayer = this.activePlayer(),
			move = moves[activePlayer],
			piece, valid;
		if (activePlayer == this.players[0]) {
			piece = "B";
			valid = /^W+B/;
		} else {
			piece = "W";
			valid = /^B+W/;
		}
		if (this.boardCenter().join('\n').indexOf(move +'') >= 0) { // Place piece at center.
			board.__place__(move, piece);
		} else {
			board.walks(move, Checkerboard.DIRECTIONS.EVERY).forEach(function (walk){
				var match = valid.exec(board.asString(walk).substr(1));
				if (match){
					walk.toArray().slice(0, match[0].length).forEach(function(coord){
						board.__place__(coord, piece);
					});
				}
			});
		}
		if (update) {
			this.constructor(this.opponent(), [board.height, board.width, board.string]);
			return this;
		} else {
			return new this.constructor(this.opponent(), [board.height, board.width, board.string]);
		}
	},

	/** A match ends when the active player cannot move. The winner is the one with more pieces of
	its color in the board at the end.
	*/
	result: function result() {
		if (this.moves()) {
			return null;
		} else {
			var weight = {"W": -1, "B": 1},
				res_b = iterable(this.board.string).map(function(m){
					return weight[m] || 0;
				}).sum();
			return this.zerosumResult(res_b, "Black");
		}
	},

	/** The actual score is calculated as the difference in piece count. This means that the maximum
	victory (maybe impossible) is to fill the board with pieces of only one colour.
	*/
	resultBounds: function resultBounds() {
		var squareCount = this.board.width * this.board.height;
		return [-squareCount, +squareCount];
	},

	// ## Utility methods ##########################################################################

	/** The game state serialization simply contains the constructor arguments.
	*/
	'static __SERMAT__': {
		identifier: exports.__package__ +'.Reversi',
		serializer: function serialize_Reversi(obj) {
			return [obj.activePlayer(), [obj.board.height, obj.board.width, obj.board.string]];
		}
	}
}); // declare Reversi.

/** Adding Reversi to `ludorum.games`.
*/
ludorum.games.Reversi = Reversi;

/** Sermat serialization.
*/
exports.__SERMAT__.include.push(Reversi);


/** # Othello

Implementation of the [Othello variant of Reversi](http://www.worldothello.org/?q=content/reversi-versus-othello)
for Ludorum.
*/
var Othello = exports.Othello = declare(Reversi, {
	name: 'Reversi',

	/** One main difference between Reversi and Othello is that is a player has no moves, the turn
	passes to the other player. A match ends only when both players cannot move.
	*/
	constructor: function Othello(activePlayer, board){
		Reversi.call(this, activePlayer, board);
		if (!this.moves()) {
			var opponent = this.opponent();
			if (this.moves(opponent)) {
				this.activePlayers = [opponent];
			}
		}
	},

	/** `makeBoard(rows=8, columns=8, string)` is used to build the initial board. The starting
	board of Othello is not empty, like Reversi. The four center squares are defined.
	*/
	'dual makeBoard': function makeBoard(rows, columns, string){
		rows = isNaN(rows) ? 8 : +rows;
		columns = isNaN(columns) ? 8 : +columns;
		raiseIf(rows < 4 || columns < 4 || rows % 2 || columns % 2,
			"An Othello board must have even dimensions greater than 3.");
		if (typeof string === 'string') {
			return new CheckerboardFromString(rows, columns, string);
		} else {
			return new CheckerboardFromString(rows, columns)
				.__place__([rows / 2, columns / 2 - 1], "W")
				.__place__([rows / 2 - 1, columns / 2], "W")
				.__place__([rows / 2, columns / 2], "B")
				.__place__([rows / 2 - 1, columns / 2 - 1], "B");
		}
	},

	// ## Utility methods ##########################################################################

	/** The game state serialization simply contains the constructor arguments.
	*/
	'static __SERMAT__': {
		identifier: exports.__package__ +'.Othello',
		serializer: function serialize_Othello(obj) {
			return [obj.activePlayer(), [obj.board.height, obj.board.width, obj.board.string]];
		}
	}
}); // declare Othello.

/** Adding Othello to `ludorum.games`.
*/
ludorum.games.Othello = Othello;

/** Sermat serialization.
*/
exports.__SERMAT__.include.push(Othello);


/** # Heuristics for Mancala

`Othello.heuristics` is a bundle of helper functions to build heuristic evaluation functions for
this game.
*/
var heuristics = exports.heuristics = {
	/** `heuristicFromWeights(weights)` returns an heuristic function that may be used with any
	heuristic based player. Weights are normalized, so the result is in (-1,+1) (exclusively).
	*/
	heuristicFromWeights: function heuristicFromWeights(weights) {
		var weightCount = weights.length,
			weightSum = iterable(weights).map(Math.abs).sum(); // Used to normalize the sum.
		var heuristic = function __heuristic__(game, player) {
			var board = game.board;
			raiseIf(board.height * board.width !== weightCount, "Wrong amount of weights!");
			return board.weightedSum(weights, {
				'W': player.charAt(0) === 'W' ? 1 : -1,
				'B': player.charAt(0) === 'B' ? 1 : -1
			}) / weightSum;
		};
		heuristic.weights = weights;
		return heuristic;
	},

	/** `heuristicFromSymmetricWeights(weights)` is similar to `heuristicFromWeights()` but
	instead of demanding a weight for every square in the board, it uses only the upper left
	quadrant and builds the rest by symmetry. Hence only a quarter of the weights is required.
	*/
	heuristicFromSymmetricWeights: function heuristicFromSymmetricWeights(weights, rows, columns) {
		rows = isNaN(rows) ? 8 : rows | 0;
		columns = isNaN(columns) ? 8 : columns | 0;
		var width = Math.ceil(rows / 2);
		raiseIf(width * Math.ceil(columns / 2) > weights.length, "Not enough weights!");
		weights = Iterable.range(columns).map(function (column) {
			var i = column < columns / 2 ? column : columns - column - 1,
				left = i * width,
				right = (i + 1) * width;
			return weights.slice(left, right)
				.concat(weights.slice(left, right - rows % 2).reverse());
		}).flatten().toArray();
		return this.heuristicFromWeights(weights);
	},

	/** `pieceRatio(game, player)` is an heuristic criteria based on the difference of the piece
	counts of both players.
	*/
	pieceRatio: function pieceRatio(game, player) {
		var playerPieceCount = 0, opponentPieceCount = 0;
		iterable(game.board.string).forEach(function (sq) {
			if (sq !== '.') {
				if (sq === player.charAt(0)) {
					++playerPieceCount;
				} else {
					++opponentPieceCount;
				}
			}
		});
		return (playerPieceCount - opponentPieceCount) / (playerPieceCount + opponentPieceCount) || 0;
	},

	/** `mobilityRatio(game, player)` is an heuristic criteria based on the difference of the
	move counts of both players.
	*/
	mobilityRatio: function mobilityRatio(game, player) {
		var opponent = game.opponent(player),
			playerMoves = game.moves(player),
			opponentMoves = game.moves(opponent),
			playerMoveCount = playerMoves && playerMoves[player] && playerMoves[player].length || 0,
			opponentMoveCount = opponentMoves && opponentMoves[opponent] && opponentMoves[opponent].length || 0;
		return (playerMoveCount - opponentMoveCount) / (playerMoveCount + opponentMoveCount) || 0;
	}
};

/** The default heuristic combines piece and mobility ratios with weights that ponder corners and
borders but penalizes the squares next to the corners.
*/
heuristics.defaultHeuristic = ludorum.players.HeuristicPlayer.composite(
	heuristics.heuristicFromSymmetricWeights(
		[+9,-3,+3,+3, -3,-3,-1,-1, +3,-1,+1,+1, +3,-1,+1,+1]
	), 0.6,
	heuristics.pieceRatio, 0.2,
	heuristics.mobilityRatio, 0.2
);


// See __prologue__.js
	Sermat.include(exports);
	
	return exports;
}

)(base, Sermat, ludorum); }).call(that);


// See __prologue__.js
	exports.mancala = {
		Mancala: that['ludorum-game-mancala'].Mancala
	};
	exports.colograph = {
		Colograph: that['ludorum-game-colograph'].Colograph
	};
	exports.connect4 = {
		ConnectFour: that['ludorum-game-connect4'].ConnectFour
	};
	exports.reversi = {
		Reversi: that['ludorum-game-reversi'].Reversi,
		Othello: that['ludorum-game-reversi'].Othello
	};

	return exports;
}
);
//# sourceMappingURL=ludorum-gamepack.js.map