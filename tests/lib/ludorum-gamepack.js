/** Package wrapper and layout.
*/
(function (global, init) { "use strict"; // Universal Module Definition.
	if (typeof define === 'function' && define.amd) {
		define(['creatartis-base', 'ludorum'], init); // AMD module.
	} else if (typeof module === 'object' && module.exports) {
		module.exports = init(require('creatartis-base'), require('ludorum')); // CommonJS module.
	} else { // Browser or web worker (probably).
		global.ludorum_gamepack = init(global.base, global.ludorum); // Assumes base is loaded.
	}
})(this, function __init__(base, ludorum) { "use strict";
// Import synonyms. ////////////////////////////////////////////////////////////////////////////////
	var declare = base.declare,
		obj = base.obj,
		copy = base.copy,
		raise = base.raise,
		raiseIf = base.raiseIf,
		Iterable = base.Iterable,
		iterable = base.iterable,
		Game = ludorum.Game,
		games = ludorum.games,
		Checkerboard = ludorum.utils.Checkerboard,
		CheckerboardFromString = ludorum.utils.CheckerboardFromString,
		UserInterface = ludorum.players.UserInterface;

// Library layout. /////////////////////////////////////////////////////////////////////////////////
	var exports = {
		__name__: 'ludorum-gamepack',
		__init__: __init__,
		__dependencies__: [base, ludorum]
	};

/** # ConnectFour.

Implementation of the [Connect Four game](http://en.wikipedia.org/wiki/Connect_Four), 
based on [`ConnectionGame`](ConnectionGame.js.html).
*/
games.ConnectFour = declare(games.ConnectionGame, {
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
	
	/** The game's players are Yellow and Red, since these are the classic 
	colours of the pieces.
	*/
	players: ['Yellow', 'Red'],
	
	/** The active players `moves()` are the indexes of every column that has 
	not reached the top height.
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

	/** The `next(moves)` game state drops a piece at the column with the index
	of the active player's move.
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
	
	// ## User intefaces #######################################################
	
	/** The `display(ui)` method is called by a `UserInterface` to render the
	game state. The only supported user interface type is `BasicHTMLInterface`.
	The look can be configured using CSS classes.
	*/
	display: function display(ui) {
		raiseIf(!ui || !(ui instanceof UserInterface.BasicHTMLInterface), "Unsupported UI!");
		var moves = this.moves(),
			activePlayer = this.activePlayer(),
			board = this.board;
		moves = moves && moves[activePlayer];
		var table = this.board.renderAsHTMLTable(ui.document, ui.container, function (data) {
				data.className = data.square === '.' ? 'ludorum-empty' : 'ludorum-player'+ data.square;
				data.innerHTML = data.square === '.' ? "&nbsp;" : "&#x25CF;";
				if (moves && moves.indexOf(data.coord[1]) >= 0) {
					data.move = data.coord[1];
					data.activePlayer = activePlayer;
					data.onclick = ui.perform.bind(ui, data.move, activePlayer);
				}
			});
		table.insertBefore(
			ui.build(ui.document.createElement('colgroup'), 
				Iterable.repeat(['col'], this.board.width).toArray()),
			table.firstChild
		);
		return ui;
	},
	
	// ## Utility methods ######################################################
	
	/** The serialization of the game is a representation of a call to its
	constructor (inherited from [`ConnectionGame`](ConnectionGame.js.html)).
	*/
	__serialize__: function __serialize__() {
		return [this.name, this.activePlayer(), this.board.string];
	}
}); // declare ConnectFour.

/** # Othello

Implementation of [Othello (aka Reversi)](http://en.wikipedia.org/wiki/Reversi) for Ludorum.
*/
games.Othello = declare(Game, {
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
		if (!player && this.__moves__) {
			return this.__moves__;
		}
		player = player || this.activePlayer();
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
		return this.__moves__ = (_moves.length > 0 ? obj(player, _moves) : null);
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
	
	// ## User intefaces ###########################################################################
	
	/** The `display(ui)` method is called by a `UserInterface` to render the game state. The only 
	supported user interface type is `BasicHTMLInterface`. The look can be configured using CSS 
	classes.
	*/
	display: function display(ui) {
		raiseIf(!ui || !(ui instanceof UserInterface.BasicHTMLInterface), "Unsupported UI!");
		var moves = this.moves(),
			activePlayer = this.activePlayer(),
			board = this.board,
			classNames = {
				'B': "ludorum-square-Black",
				'W': "ludorum-square-White",
				'.': "ludorum-square-empty"
			};
		moves = moves && moves[activePlayer].map(JSON.stringify);
		board.renderAsHTMLTable(ui.document, ui.container, function (data) {
			data.className = classNames[data.square];
			data.innerHTML = '&nbsp;';
			var move = JSON.stringify(data.coord);
			if (moves && moves.indexOf(move) >= 0) {
				data.move = data.coord;
				data.activePlayer = activePlayer;
				data.className = "ludorum-square-move";
				data.onclick = ui.perform.bind(ui, data.move, activePlayer);
			}
		});
		return ui;
	},
	
	// ## Utility methods ##########################################################################
	
	/** The game state serialization simply contains the constructor arguments.
	*/
	__serialize__: function __serialize__() {
		var board = this.board;
		return [this.name, this.activePlayer(), [board.height, board.width, board.string]];
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


/** # Mancala

Implementation of the [Kalah](http://en.wikipedia.org/wiki/Kalah) member of the 
[Mancala family of games](http://en.wikipedia.org/wiki/Mancala).
*/
games.Mancala = declare(Game, {
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
	__serialize__: function __serialize__() {
		return [this.name, this.activePlayer(), this.board.slice()];
	},

	identifier: function identifier() {
		return this.activePlayer().charAt(0) + this.board.map(function (n) {
			return ('00'+ n.toString(36)).substr(-2);
		}).join('');
	},

	// ## User intefaces ###########################################################################
	
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
	
	/** The `display(ui)` method is called by a `UserInterface` to render the game state. The only
	supported user interface type is `BasicHTMLInterface`. The look can be configured using CSS
	classes.
	*/
	display: function display(ui) {
		raiseIf(!ui || !(ui instanceof UserInterface.BasicHTMLInterface), "Unsupported UI!");
		return this.__displayHTML__(ui);
	},
	
	/** Board is displayed in HTML as a table with two rows: north and south. The north row has the
	two stores on each side, as `TD`s with `rowspan=2`. Each table cell (houses and stores) contains
	the number of seeds inside it. 
	*/
	__displayHTML__: function __displayHTML__(ui) {
		var table, tr, td, data,
			mancala = this,
			north = this.players[0], 
			south = this.players[1],
			activePlayer = this.activePlayer(),
			moves = this.moves(),
			boardSquare = function boardSquare(td, i, isStore) {
				var data = {
					id: "ludorum-square-"+ i,
					className: isStore ? "ludorum-square-store" : "ludorum-square-house",
					square: mancala.board[i],
					innerHTML: base.Text.escapeXML(mancala.board[i])
				};
				if (!isStore && moves && moves[activePlayer] && moves[activePlayer].indexOf(i) >= 0) {
					data.move = i;
					data.activePlayer = activePlayer;
					data.className = "ludorum-square-move";
					td.onclick = data.onclick = ui.perform.bind(ui, data.move, activePlayer);
				}
				td['ludorum-data'] = data;
				td.id = data.id;
				td.className = data.className;
				td.innerHTML = data.innerHTML;
				td.setAttribute("rowspan", isStore ? 2 : 1);
				return td;
			};
		ui.container.appendChild(table = document.createElement('table'));
		table.appendChild(tr = document.createElement('tr'));
		tr.appendChild(boardSquare(document.createElement('td'), this.store(north), true));
		this.houses(north).reverse().forEach(function (h) {
			tr.appendChild(boardSquare(document.createElement('td'), h, false));
		});
		tr.appendChild(boardSquare(document.createElement('td'), this.store(south), true));
		table.appendChild(tr = document.createElement('tr'));
		this.houses(south).forEach(function (h) {
			tr.appendChild(boardSquare(document.createElement('td'), h, false));
		});
		return ui;
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

Implementation of the game Colograph, a competitive version of the classic 
[graph colouring problem](http://en.wikipedia.org/wiki/Graph_coloring).
*/ 	
games.Colograph = declare(Game, {
	name: 'Colograph',
	
	/** The constructor takes the following arguments:
	*/
	constructor: function Colograph(args) {
		/** + `activePlayer`: There is only one active player per turn, and it 
			is the first player by default.
		*/
		Game.call(this, args ? args.activePlayer : undefined);
		base.initialize(this, args)
		/** + `colours`: The colour of each node in the graph is given by an
			array of integers, each being the node's player index in the players 
			array, or -1 for uncoloured nodes. By default all nodes are not 
			coloured, which is the initial game state.
		*/
			.object('colours', { defaultValue: {} })
		/** + `edges`: The edges of the graph are represented by an array of 
			arrays of integers, acting as an adjacency list. 
		*/
			.array('edges', { defaultValue: [[1,3],[2],[3],[]] })
		/** + `shapes`: Each of the graph's nodes can have a certain shape. This
			is specified by an array of strings, one for each node.
		*/
			.array('shapes', { defaultValue: ['circle', 'triangle', 'square', 'star'] })
		/** + `scoreSameShape=-1`: Score added by each coloured edge that binds 
			two nodes of the same shape.
		*/
			.number('scoreSameShape', { defaultValue: -1, coerce: true })
		/** + `scoreDifferentShape=-1`: Score added by each coloured edge that 
			binds two nodes of different shapes.
		*/
			.number('scoreDifferentShape', { defaultValue: -1, coerce: true });
	},
	
	/** There are two roles in this game: Red and Blue.
	*/
	players: ['Red', 'Blue'],
	
	/** Scores are calculated for each player with the edges of their colour. An 
	edge connecting two nodes of the same colour is considered to be of that 
	colour.
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
	
	/** The game ends when the active player has no moves, i.e. when all nodes
	in the graph have been coloured. The match is won by the player with the
	greatest score.
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

	/** The result of any move is the colouring of one previously uncoloured 
	node with the active players's colour.
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

	__serialize__: function __serialize__() {
		return [this.name, {
			activePlayer: this.activePlayer(), 
			colours: this.colours,
			edges: this.edges,
			shapes: this.shapes,
			scoreSameShape: this.scoreSameShape,
			scoreDifferentShape: this.scoreDifferentShape
		}];
	},
	
	// ## Game properties. #####################################################

	/** `edgeColour(node1, node2)` returns a colour (player index) if the nodes 
	are joined by an edge, and both have that same colour.
	*/
	edgeColour: function edgeColour(node1, node2) {
		var connected = this.edges[node1].indexOf(node2) >= 0 || this.edges[node2].indexOf(node1) >= 0,
			colour1 = this.colours[node1],
			colour2 = this.colours[node2];
		return connected && colour1 >= 0 && colour1 === colour2 ? colour1 : -1;
	},
	
	// ## Heuristics. ##########################################################
	
	/** `heuristics` is a namespace for heuristic evaluation functions to be 
	used with artificial intelligence methods such as Minimax.
	*/
	'static heuristics': {
		/** + `scoreDifference(game, player)` is a simple heuristic that uses
		the current score.
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
	
	// ## Graph generation. ####################################################

	/** One of the nice features of this game is the variety that comes from
	chaning the graph on which the game is played. `randomGraph` can be used to
	generate graphs to experiment with.
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
	
	/** `randomGame(params)` will generates a random Colograph game with a 
	random graph.
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
	
	// ## Human interface based on KineticJS. ##################################
	
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


// See __prologue__.js
	return exports;
});

//# sourceMappingURL=ludorum-gamepack.js.map