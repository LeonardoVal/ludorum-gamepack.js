/** Package wrapper and layout.
*/
(function (global, init) { "use strict"; // Universal Module Definition.
	if (typeof define === 'function' && define.amd) {
		define(['creatartis-base', 'sermat', 'ludorum'], init); // AMD module.
	} else if (typeof module === 'object' && module.exports) {
		module.exports = init(require('creatartis-base'), require('sermat'), require('ludorum')); // CommonJS module.
	} else { // Browser or web worker (probably).
		global.ludorum_gamepack = init(global.base, global.ludorum); // Assumes base is loaded.
	}
})(this, function __init__(base, Sermat, ludorum) { "use strict";
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
		__package__: 'ludorum-gamepack',
		__name__: 'ludorum_gamepack',
		__init__: __init__,
		__dependencies__: [base, Sermat, ludorum],
		__SERMAT__: { include: [base, ludorum] }
	};

/** # ConnectFour.

Implementation of the [Connect Four game](http://en.wikipedia.org/wiki/Connect_Four), based on
Ludorum's `ConnectionGame`.
*/
exports.ConnectFour = declare(ludorum.games.ConnectionGame, {
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
	next: function next(moves) {
		var activePlayer = this.activePlayer(),
			board = this.board.string,
			column = +moves[activePlayer],
			height = this.height,
			width = this.width;
		for (var row = 0; row < height; ++row) {
			if (board.charAt(row * width + column) === '.') {
				return new this.constructor(this.opponent(), 
					this.board.place([row, column], activePlayer === this.players[0] ? '0' : '1'));
			}
		}
		throw new Error('Invalid move '+ JSON.stringify(moves) +'!');
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

/** # Othello

Implementation of [Othello (aka Reversi)](http://en.wikipedia.org/wiki/Reversi) for Ludorum.
*/
var Othello = exports.Othello = declare(Game, {
	name: 'Othello',

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
		if (!this.moves()) {
			var opponent = this.opponent();
			if (this.moves(opponent)) {
				this.activePlayers = [opponent];
			}
		}
	},
	
	/** `makeBoard(rows=8, columns=8, string)` is used to build the initial board.
	*/
	'dual makeBoard': function makeBoard(rows, columns, string){
		rows = isNaN(rows) ? 8 : +rows;
		columns = isNaN(columns) ? 8 : +columns;
		raiseIf(rows < 4 || columns < 4 || rows % 2 || columns % 2, "An Othello board must have even dimensions greater than 3.");
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
	
	/** A move always places a piece in an empty square, if and only if by doing so one or more 
	lines of the opponent's pieces get enclosed between pieces of the active player.
	*/
	moves: function moves(player){
		player = player || this.activePlayer();
		if (this.hasOwnProperty('__moves'+ player +'__')) {
			return this['__moves'+ player +'__'];
		}
		var board = this.board,
			coords = {},
			regexps = this.__MOVE_REGEXPS__[player];
		this.lines(board.height, board.width).forEach(function(line){
			regexps.forEach(function (regexp) {
				board.asString(line).replace(regexp, function(m, i){
					var coord = m.charAt(0) === "." ? line[i] : line[m.length - 1 + i];
					coords[coord] = coord;
					return m;
				});
			});
		});
		var _moves = [];
		for (var id in coords) {
			_moves.push(coords[id]);
		}
		_moves = _moves.length > 0 ? obj(player, _moves) : null;
		if (arguments.length < 1) {
			return this['__moves'+ player +'__'] = _moves; // Cache the result.
		}
		return _moves;
	},
	
	/** When the active player encloses one or more lines of opponent's pieces between two of its 
	own, all those are turned into active player's pieces.
	*/
	next: function next(moves) {
		var board = this.board.clone(),
			activePlayer = this.activePlayer(),
			piece, valid;
		if (!moves.hasOwnProperty(activePlayer) || !board.isValidCoord(moves[activePlayer])) {
			throw new Error("Invalid moves "+ JSON.stringify(moves) +"!");
		} else if (activePlayer == this.players[0]) {
			piece = "B";
			valid = /^W+B/;
		} else {
			piece = "W";
			valid = /^B+W/;
		}
		board.walks(moves[activePlayer], Checkerboard.DIRECTIONS.EVERY).forEach(function (walk){
			var match = valid.exec(board.asString(walk).substr(1));
			if (match){
				walk.toArray().slice(0, match[0].length).forEach(function(coord){
					board.__place__(coord, piece);
				});
			}
		});
		return new this.constructor(this.opponent(), [board.height, board.width, board.string]);
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
		identifier: 'Othello',
		serializer: function serialize_Othello(obj) {
			return [obj.activePlayer(), [obj.board.height, obj.board.width, obj.board.string]];
		}
	},
	
	// ## Heuristics ###############################################################################
	
	/** `Othello.heuristics` is a bundle of helper functions to build heuristic evaluation functions 
	for this game.
	*/
	'static heuristics': {
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
	}	
}); // declare Othello.

/** The default heuristic combines piece and mobility ratios with weights that ponder corners and 
borders but penalizes the squares next to the corners.
*/
Othello.heuristics.defaultHeuristic = ludorum.players.HeuristicPlayer.composite(
	Othello.heuristics.heuristicFromSymmetricWeights(
		[+9,-3,+3,+3, -3,-3,-1,-1, +3,-1,+1,+1, +3,-1,+1,+1]
	), 0.6,
	Othello.heuristics.pieceRatio, 0.2,
	Othello.heuristics.mobilityRatio, 0.2
);

/** # Mancala

Implementation of the [Kalah](http://en.wikipedia.org/wiki/Kalah) member of the 
[Mancala family of games](http://en.wikipedia.org/wiki/Mancala).
*/
exports.Mancala = declare(Game, {
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
	next: function next(moves) {
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
		return new this.constructor(freeTurn ? activePlayer : this.opponent(), newBoard);
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
		identifier: 'Mancala',
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
	},
	
	// ## Heuristics and AI ########################################################################

	/** `Mancala.heuristics` is a bundle of helper functions to build heuristic evaluation functions
	for this game.
	*/
	'static heuristics': {
		/** + `heuristicFromWeights(weights=default weights)` builds an heuristic evaluation 
			function from weights for each square in the board. The result of the function is the 
			normalized weighted sum.
		*/
		heuristicFromWeights: function heuristicFromWeights(weights) {
			var weightSum = iterable(weights).map(Math.abs).sum();
			function __heuristic__(game, player) {
				var seedSum = 0, signum;
				switch (game.players.indexOf(player)) {
					case 0: signum = 1; break; // North.
					case 1: signum = -1; break; // South.
					default: throw new Error("Invalid player "+ player +".");
				}
				return iterable(game.board).map(function (seeds, i) {
					seedSum += seeds;
					return seeds * weights[i]; //TODO Normalize weights before.
				}).sum() / weightSum / seedSum * signum;
			}
			__heuristic__.weights = weights;
			return __heuristic__;
		}
	},
	
	// ## Mancala type initialization ##############################################################

	'': function () {
		/** The `makeBoard` can also be used without an instance of Mancala.
		*/
		this.makeBoard = this.prototype.makeBoard;
		
		/** The `defaultHeuristic `for Mancala is based on weights for each square. Stores are worth
		5 and houses 1, own possitive and the opponent's negative.
		*/
		this.heuristics.defaultHeuristic = this.heuristics.heuristicFromWeights(
			[+1,+1,+1,+1,+1,+1,+5, 
			 -1,-1,-1,-1,-1,-1,-5]
		);
	}
}); // declare Mancala.


/** # Colograph

Implementation of the game Colograph, a competitive version of the classic [graph colouring problem](http://en.wikipedia.org/wiki/Graph_coloring).
*/ 	
exports.Colograph = declare(Game, {
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
		for (var i = 0; i < this.edges.length; i++) {
			if (!this.colours.hasOwnProperty(i)) {
				uncoloured.push(i);
			}
		}
		return uncoloured.length < 1 ? null : obj(this.activePlayer(), uncoloured);
	},

	/** The result of any move is the colouring of one previously uncoloured node with the active 
	players's colour.
	*/
	next: function next(moves) {
		var activePlayer = this.activePlayer(), 
			move = +moves[activePlayer] >> 0;
		raiseIf(move < 0 || move >= this.colours.length, 
			'Invalid move: node ', move, ' does not exist in ', this, '.');
		raiseIf(this.colours[move] >= 0, 
			'Invalid move: node ', move, ' has already been coloured in ', this, '.');
		var newColours = copy(obj(move, activePlayer), this.colours);
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
		return new this.constructor({
			activePlayer: this.opponent(activePlayer),
			colours: newColours,
			edges: this.edges,
			shapes: this.shapes,
			scoreSameShape: this.scoreSameShape,
			scoreDifferentShape: this.scoreDifferentShape
		});
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
	
	// ## Heuristics. ##############################################################################
	
	/** `heuristics` is a namespace for heuristic evaluation functions to be used with artificial 
	intelligence methods such as Minimax.
	*/
	'static heuristics': {
		/** + `scoreDifference(game, player)` is a simple heuristic that uses the current score.
		*/
		scoreDifference: function scoreDifference(game, player) {
			var score = game.score(),
				result = 0;
			for (var p in score) {
				result += p === player ? score[p] : -score[p];
			}
			return result / game.edges.length / 2;
		}
	},
	
	// ## Graph generation. ########################################################################

	/** One of the nice features of this game is the variety that comes from chaning the graph on 
	which the game is played. `randomGraph` can be used to generate graphs to experiment with.
	*/
	'static randomGraph': function randomGraph(nodeCount, edgeCount, random) {
		nodeCount = Math.max(2, +nodeCount >> 0);
		edgeCount = Math.max(nodeCount - 1, +edgeCount >> 0);
		var edges = basis.iterables.range(nodeCount - 1).map(function (i) {
			return random.split(1, basis.iterables.range(i + 1, nodeCount).toArray());
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
	'static randomGame': function randomGame(args) {
		params = base.initialize({}, params)
			.object('random', { defaultValue: randomness.DEFAULT })
			.integer('nodeCount', { defaultValue: 8, coerce: true })
			.integer('edgeCount', { defaultValue: 11, coerce: true })
			.integer('shapeCount', { defaultValue: 4, coerce: true, minimum: 1, maximum: 4 })
			.subject;
		var SHAPES = ['circle', 'triangle', 'square', 'star'];
		return new Colograph({ 
			edges: this.randomGraph(params.nodeCount, params.edgeCount, params.random),
			shapes: params.random.randoms(params.nodeCount, 0, params.shapeCount).map(function (r) {
				return SHAPES[r|0];
			}),
			scoreSameShape: 1
		});
	},
	
	// ## Human interface based on KineticJS. ######################################################
	
	/** This legacy code is an implementation of a UI for Colograph using 
	[KineticJS](http://kineticjs.com/). Not entirely compatible yet.
	*/
	'static KineticUI': declare(UserInterface, {
		constructor: function KineticUI(args) {
			UserInterface.call(this, args);
			initialize(this, args)
				.string("container", { defaultValue: "colograph-container" })
				.object("Kinetic", { defaultValue: window.Kinetic })
				.integer('canvasRadius', { defaultValue: NaN, coerce: true })
				.integer('nodeRadius', { defaultValue: 15, coerce: true })
				.array('playerColours', { defaultValue: ['red', 'blue'] });
			if (isNaN(this.canvasRadius)) {
				this.canvasRadius = (Math.min(screen.width, screen.height) * 0.6) >> 1;
			}
			var stage = this.stage = new Kinetic.Stage({ 
					container: this.container, 
					width: this.canvasRadius * 2, 
					height: this.canvasRadius * 2 
				}),
				layer = this.layer = new Kinetic.Layer({ 
					clearBeforeDraw: true, 
					offsetX: -this.canvasRadius, 
					offsetY: -this.canvasRadius 
				}),
				game = this.match.state();
			stage.add(layer);
			setInterval(stage.draw.bind(stage), 1000 / 30);
			layer.destroyChildren();
			this.edges = {};
			this.nodes = {};
			this.drawEdges(game);
			this.drawNodes(game);
		},
		
		drawEdges: function drawEdges(game) {
			var angle = 2 * Math.PI / game.edges.length,
				radius = this.canvasRadius - this.nodeRadius * 2,
				ui = this;
			game.edges.forEach(function (n2s, n1) { // Create lines.
				n2s.forEach(function (n2) {
					var line = new ui.Kinetic.Line({
						points: [radius * Math.cos(angle * n1), radius * Math.sin(angle * n1),
								radius * Math.cos(angle * n2), radius * Math.sin(angle * n2)],
						stroke: "black", strokeWidth: 2
					});
					ui.edges[n1+','+n2] = line;
					ui.layer.add(line);
				});
			});
		},
		
		drawNodes: function drawNodes(game) {
			var angle = 2 * Math.PI / game.edges.length,
				radius = this.canvasRadius - this.nodeRadius * 2,
				ui = this;
			game.edges.forEach(function (adjs, n) {
				var shape,
					x = radius * Math.cos(angle * n),
					y = radius * Math.sin(angle * n);
				switch (game.shapes[n]) {
					case 'square': 
						shape = ui.drawSquare(x, y, ui.nodeRadius, n); break;
					case 'triangle': 
						shape = ui.drawTriangle(x, y, ui.nodeRadius, n); break;
					case 'star': 
						shape = ui.drawStar(x, y, ui.nodeRadius, n); break;
					default: 
						shape = ui.drawCircle(x, y, ui.nodeRadius, n);
				}
				shape.on('mouseover', function () {
					shape.setScale(1.2);
				});
				shape.on('mouseout', function () {
					shape.setScale(1);
				});
				shape.on('click tap', function () {
					ui.perform(n);
				});
				shape.setRotation(Math.random() * 2 * Math.PI);//FIXME
				ui.nodes[n] = shape;
				ui.layer.add(shape);
			});
		},
		
		drawCircle: function drawCircle(x, y, r, n) {
			return new this.Kinetic.Circle({ 
				x: x, y: y, radius: r,
				fill: "white", stroke: "black", strokeWidth: 2
			});
		},
		
		drawSquare: function drawSquare(x, y, r, n) {
			return new this.Kinetic.Rect({ 
				x: x, y: y, width: r * 2, height: r * 2,
				offsetX: r, offsetY: r,
				fill: "white", stroke: "black", strokeWidth: 2
			});
		},
		
		drawStar: function drawStar(x, y, r, n) {
			return new Kinetic.Star({ numPoints: 5,
				x: x, y: y, innerRadius: r * 0.6, outerRadius: r * 1.5,
				fill: 'white', stroke: 'black', strokeWidth: 2
			});
		},
		
		drawTriangle: function drawTriangle(x, y, r, n) {
			return new Kinetic.RegularPolygon({ sides: 3,
				x: x, y: y, radius: r * 1.25,
				fill: 'white', stroke: 'black', strokeWidth: 2
			});
		},
		
		display: function display(game) {
			this.updateEdges(game);
			this.updateNodes(game);
		},
		
		updateEdges: function updateEdges(game) {
			var ui = this;
			game.edges.forEach(function (n2s, n1) {
				n2s.forEach(function (n2) {
					var k = n1+','+n2;
					ui.edges[k].setStroke(game.colours[k] || "black");
				});
			});
		},
		
		updateNodes: function updateNodes(game) {
			var ui = this;
			game.edges.forEach(function (adjs, n) {
				var colour = game.colours[n];
				if (colour) {
					ui.nodes[n].setFill(colour);
					ui.nodes[n].off('mouseover mouseout click tap');
				}
			});
		}
	}) // KineticJSCircleUI.
	
}); // declare Colograph.	


/** # Chess

Implementation of [Chess](http://www.fide.com/component/handbook/?id=124&view=article) for Ludorum.
*/

/** `Piece` is the base class for all pieces in the game. Pieces' classes help to calculate moves,
and the effects these moves have on the board.
*/
var Piece = declare({
	constructor: function Piece(player, position) {
		this.player = player;
		this.position = position;
	},

	moves: base.objects.unimplemented('Piece', 'moves(game, board)'),
	
	canMove: base.objects.unimplemented('Piece', 'canMove(game, board, position)'),
	
	moveTo: function moveTo(position) {
		return new this.constructor(this.player, position);
	},
	
	next: function (game, board, move) {
		return board.clone()
			.__place__(move[1])
			.__place__(move[2], this.moveTo(move[2]));
	}
});

var Chess = exports.Chess = declare(Game, {
	name: 'Chess',

	/** The game is played by two players: White and Black. White moves first.
	*/
	players: ["White", "Black"],
	
	/** The constructor takes the `activePlayer` (`"White"` by default), and the `board` as an 
	instance of `CheckerboardFromPieces` (with the initial setup by default).	
	*/
	constructor: function Chess(params){
		params = params || {};
		Game.call(this, params.activePlayer || this.players[0]);
		this.board = !params.board ? this.initialBoard 
			: typeof params.board === 'string' ? Chess.boardFromFEN(params.board)
			: params.board;
		this.castling = params.castling || "KQkq";
		this.enPassant = params.enPassant;
		this.halfMoves = params.halfMoves |0;
		this.fullMoves = Math.max(params.fullMoves |0, 1);

		// Classify pieces by player and kind.
		var game = this;
		this.pieces = iterable(this.players).map(function (player) {
			return [player, iterable(game.kinds).mapApply(function (kindName, kindConstructor) {
				return [kindName, []];
			}).toObject()];
		}).toObject();
		iterable(this.board.pieces).forEachApply(function (_, piece) {
			game.pieces[piece.player][piece.name].push(piece);
		});
	},

	
	/** The piece `kinds` of Chess are: Pawn, Knight, Bishop, Rook, Queen and King.
	*/
	'dual kinds': {
		Pawn: declare(Piece, {
			name: 'Pawn',
			
			moves: function moves(game, board) { // TODO En passant captures.
				var piece = this,
					direction = (this.player === game.players[0]) ? -1 : +1,
					r = [],
					p = [this.position[0] + direction, this.position[1]];
				if (!board.square(p)) { // move forward
					r.push(p);
				}
				[[direction,-1], [direction,+1]].map(function (d) { // capture to the sides.
					return [piece.position[0] + d[0], piece.position[1] + d[1]];
				}).forEach(function (p) {
					if (board.isValidCoord(p)) {
						var square = board.square(p);
						if (square && square.player !== piece.player) {
							r.push(p);
						}
					}
				});
				if (this.position[0] === (direction > 0 ? 1 : board.height - 2)) { // double forward at first rank.
					p = [this.position[0] + 2 * direction, this.position[1]];
					if (!board.square(p)) { // move forward
						r.push(p);
					}
				}
				if (this.position[0] === (direction < 0 ? 1 : board.height - 2)) { // Promotions at the last rank.
					var promotions = ['Knight', 'Bishop', 'Rook', 'Queen'];
					return iterable(r).map(function (p) {
						return promotions.map(function (k) {
							return ['promote', piece.position, p, k];
						});
					}).flatten();
				} else {
					return iterable(r).map(function (p) {
						return ['move', piece.position, p];
					});
				}
			},
			
			//canMove: TODO,
			
			next: function next(game, board, move) {
				if (move[0] === 'move') {
					return Piece.prototype.next.call(this, game, board, move);
				} else { // Promotion
					return board.clone()
						.__place__(move[1])
						.__place__(move[2], new Chess.kinds[move[3]](this.player, move[2]));
				}
			},
			
			toString: function toString() {
				return this.player === "White" ? "P" : "p";
			}
		}), // declare Chess.kinds.Pawn

		Knight: declare(Piece, {
			name: 'Knight',
			
			DELTAS: [[+2,+1],[+1,+2],[+2,-1],[-1,+2],[-2,-1],[-1,-2],[-2,+1],[+1,-2]],
			
			moves: function moves(game, board) {
				var piece = this;
				return iterable(this.DELTAS).map(function (d) {
					return ['move', piece.position, [piece.position[0] + d[0], piece.position[1] + d[1]]];
				}, function (m) {
					if (board.isValidCoord(m[2])) {
						var s = board.square(m[2]);
						return !s || s.player !== piece.player;
					} else {
						return false;
					}
				});
			},
			
			//canMove: TODO,
			
			toString: function toString() {
				return this.player === "White" ? "N" : "n";
			}
		}), // declare Chess.kinds.Knight

		Bishop: declare(Piece, {
			name: 'Bishop',
			
			moves: function moves(game, board) {
				var piece = this;
				return iterable(board.walks(this.position, Checkerboard.DIRECTIONS.DIAGONAL)).map(function (walk) {
					var cont = true;
					return walk.tail().takeWhile(function (p) { 
						var square = board.square(p),
							r = cont && (!square || square.player !== piece.player);
						cont = cont && !square;
						return r;
					}).map(function (p) {
						return ['move', piece.position, p];
					});
				}).flatten();
			},
			
			//canMove: TODO,
			
			next: function (game, board, move) {
				return board.clone()
					.__place__(move[1])
					.__place__(move[2], new this.constructor(this.player, move[2]));
			},
			
			toString: function toString() {
				return this.player === "White" ? "B" : "b";
			}
		}), // declare Chess.kinds.Bishop
		
		Rook: declare(Piece, {
			name: 'Rook',
			
			moves: function moves(game, board) {
				var piece = this;
				return iterable(board.walks(this.position, Checkerboard.DIRECTIONS.ORTHOGONAL)).map(function (walk) {
					var cont = true;
					return walk.tail().takeWhile(function (p) {
						var square = board.square(p),
							r = cont && (!square || square.player !== piece.player);
						cont = cont && !square;
						return r;
					}).map(function (p) {
						return ['move', piece.position, p];
					});
				}).flatten();
			},
			
			//canMove: TODO,
			
			toString: function toString() {
				return this.player === "White" ? "R" : "r";
			}
		}), // declare Chess.kinds.Rook

		Queen: declare(Piece, {
			name: 'Queen',
			
			moves: function moves(game, board) {
				var piece = this;
				return iterable(board.walks(this.position, Checkerboard.DIRECTIONS.EVERY)).map(function (walk) {
					var cont = true;
					return walk.tail().takeWhile(function (p) { 
						var square = board.square(p),
							r = cont && (!square || square.player !== piece.player);
						cont = cont && !square;
						return r;
					}).map(function (p) {
						return ['move', piece.position, p];
					});
				}).flatten();
			},
			
			//canMove: TODO,
			
			toString: function toString() {
				return this.player === "White" ? "Q" : "q";
			}
		}), // declare Chess.kinds.Queen
		
		King: declare(Piece, { // TODO Castling.
			name: 'King',
			
			moves: function moves(game, board) {
				var piece = this;
				return iterable(Checkerboard.DIRECTIONS.EVERY).map(function (d) {
					return ['move', piece.position, [piece.position[0] + d[0], piece.position[1] + d[1]]];
				}, function (m) {
					if (board.isValidCoord(m[2])) {
						var s = board.square(m[2]);
						return !s || s.player !== piece.player;
					} else {
						return false;
					}
				});
			},
			
			canMove: function canMove(game, board, pos) {
				if (board.isValidCoord(pos)	&&
						(Math.abs(this.position[0] - pos[0]) === 1) !== (Math.abs(this.position[1] - pos[1]) === 1)
					) {
					var sq = board.square(pos);
					return !sq || sq.player !== this.player;
				} else {
					return false;
				}
			},
			
			toString: function toString() {
				return this.player === "White" ? "K" : "k";
			}
		}) // declare Chess.kinds.King
	}, 
	
	// ## Game methods #############################################################################
	
	/** A move always places a piece in an empty square, if and only if by doing so one or more 
	lines of the opponent's pieces get enclosed between pieces of the active player.
	*/
	moves: function moves() {
		if (!this.hasOwnProperty('__moves__')) {
			var game = this,
				board = this.board,
				activePlayer = this.activePlayer(),
				king = this.pieces[activePlayer].King[0];
				this.checkMoves = []; /*FIXME iterable(this.pieces[this.opponent()]).select(1).flatten().filter(function (p) {
					return p.canMove(king.position);
				}).toArray();*/
			if (this.checkMoves.length < 1) { // Active player's king is not in check.
				this.__moves__ = base.obj(activePlayer, iterable(this.pieces[activePlayer])
					.mapApply(function (kind, pieces) {
						return pieces;
					}).flatten().map(function (p) {
						return p.moves(game, board);
					}).flatten().toArray()
				);
			} else { 
				throw new Error('Do not know what to do when in check!');//FIXME
			}
		}
		return this.__moves__;
	},
	
	/** TODO.
	*/
	next: function next(moves) {
		//FIXME
		var activePlayer = this.activePlayer(),
			move = moves[activePlayer],
			movingPiece = this.board.square(move[1]);
		console.log(this+"");//FIXME
		return new this.constructor({
			activePlayer: this.opponent(), 
			board: movingPiece.next(this, this.board, move),
			castling: this.castling,
			enPassant: null,
			halfMoves: this.halfMoves,
			fullMoves: this.fullMoves + (activePlayer === 'Black' ? 1 : 0)
		});
	},
	
	/** TODO.
	*/
	result: function result() {
		//FIXME
		if (this.moves()[this.activePlayer()]) {
			return null;
		} else if (this.checkMoves.length > 0) { // Checkmate!
			return this.defeat();
		} else { // Stalemate.
			return this.draw();
		}
	},
	
	// ## Utility methods ##########################################################################
	
	/** The game state serialization uses [Forsyth–Edwards notation](http://en.wikipedia.org/wiki/Forsyth%E2%80%93Edwards_Notation).
	*/
	'static __SERMAT__': {
		identifier: 'Chess',
		serializer: function serialize_Chess(obj) {
			return [obj.toFEN()];
		},
		materializer: function materialize_Chess(obj, args) {
			return args ? Chess.fromFEN(args[0]) : null;
		}
	},
	
	'dual coordFromString': function coordFromString(str) {
		return [+str.charAt(1) + 1, str.charCodeAt(0) - 'a'.charCodeAt(0)];
	},
	
	'dual coordToString': function coordToString(coord) {
		return String.fromCharCode('a'.charCodeAt(0) + coord[1]) + (coord[0] + 1);
	},
	
	/** The default string representation of Chess is the 
	[Forsyth–Edwards notation](http://en.wikipedia.org/wiki/Forsyth%E2%80%93Edwards_Notation).
	*/
	toString: function toString() {
		return this.toFEN();
	},
	
	toFEN: function toFEN() {
		var board = this.board,
			result = board.horizontals().map(function (hline) {
				var lineText = '', 
					emptySquares = 0;
				hline.forEach(function (coord) {
					var p = board.square(coord);
					if (!p) {
						emptySquares++;
					} else {
						if (emptySquares > 0) {
							lineText += emptySquares;
							emptySquares = 0;
						}
						lineText += p.toString();
					}
				});
				if (emptySquares > 0) {
					lineText += emptySquares;
				}
				return lineText;
			}).join('/');
		result += " "+ (this.activePlayer().charAt(0).toLowerCase());
		result += " "+ this.castling;
		result += " "+ (this.enPassant ? this.coordToString(this.enPassant) : "-");
		result += " "+ this.halfMoves +" "+ this.fullMoves;
		return result;
	},
	
	/** The `fromFEN` function parses a string in [Forsyth–Edwards notation](http://en.wikipedia.org/wiki/Forsyth%E2%80%93Edwards_Notation)
	and builds the corresponding game state.
	*/	
	'static fromFEN': function fromFEN(str) {
		str = str.trim();
		var match = this.FEN_REGEXP.exec(str);
		raiseIf(!match, "Invalid FEN string '", str, "'!");
		return new this({
			board: this.boardFromFEN(match[1]),
			activePlayer: match[2] === 'w' ? 'White' : 'Black',
			castling: match[3] === '-' ? "" : match[3],
			enPassant: match[4] === '-' ? null : this.coordFromString(match[4]),
			halfMoves: +match[5],
			fullMoves: +match[6]
		});
	},
	
	/** To parse a string in [Forsyth–Edwards notation](http://en.wikipedia.org/wiki/Forsyth%E2%80%93Edwards_Notation)
	this is regular expression is used. Capturing groups are: board, active player, castling, en 
	passant, half move and full move. Spaces at beginning and end must be trimmed before matching.
	*/
	'static FEN_REGEXP':
		/^((?:[pnbrqkPNBRQK12345678]+\/){7}[pnbrqkPNBRQK12345678]+)\s+([wb])\s+(-|[KQkq]+)\s+(-|[a-h][1-8])\s+(\d+)\s+(\d+)$/,
	
	'dual boardFromFEN': function boardFromFEN(str) {
		var rows = str.split('/'),
			kinds = {
				'p': this.kinds.Pawn,
				'n': this.kinds.Knight,
				'b': this.kinds.Bishop,
				'r': this.kinds.Rook,
				'q': this.kinds.Queen,
				'k': this.kinds.King
			},
			pieces = [];
		rows.forEach(function (row, r) {
			var c = 0;
			iterable(row).forEach(function (sq) {
				if (!isNaN(sq)) {
					c += sq |0;
				} else {
					pieces.push(new kinds[sq.toLowerCase()](
						sq === sq.toLowerCase() ? 'Black' : 'White',
						[r, c]
					));
					c++;
				}
			});
		});
		return new ludorum.utils.CheckerboardFromPieces(8, 8, pieces);
	},
	
	// ## Heuristics ###############################################################################
	
	/** `Chess.heuristics` is a bundle of helper functions to build heuristic evaluation functions 
	for this game.
	*/
	'static heuristics': {
		// TODO
	}	
}); // declare Othello.

// ## Initial board ################################################################################

/** The initial board of Chess has the first rank of the board with the following pieces for Whites:
Rook, Knight, Bishop, Queen, King, Bishop, Knight and Rook. The next rank has 8 Pawns. Blacks have a
symmetrical layout on their ranks.
*/
Chess.initialBoard = Chess.prototype.initialBoard =
	Chess.boardFromFEN('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR');

// See __prologue__.js
	'Chess Colograph ConnectFour Mancala Othello'.split(/\s+/).forEach(function (id) {
		var game = exports[id];
		ludorum.games[id] = game;
		if (game.__SERMAT__) {
			game.__SERMAT__.identifier = exports.__package__ +'.'+ game.__SERMAT__.identifier;
			exports.__SERMAT__.include.push(game);
		}
	});
	Sermat.include(exports); // Ludorum uses Sermat internally.
	
	return exports;
});
//# sourceMappingURL=ludorum-gamepack.js.map