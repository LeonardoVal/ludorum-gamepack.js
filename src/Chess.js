/** # Chess

Implementation of [Chess](http://www.fide.com/component/handbook/?id=124&view=article) for Ludorum.
*/
var Piece = declare({
	constructor: function Piece(player, position) {
		this.player = player;
		this.position = position;
	},

	moves: base.objects.unimplemented('Piece', 'moves'),
	
	canMove: base.objects.unimplemented('Piece', 'canMove'),
	
	moveTo: function moveTo(position) {
		return new this.constructor(this.player, position);
	},
	
	next: function (game, board, move) {
		return board.clone()
			.__place__(move[1])
			.__place__(move[2], this.moveTo(move[2]));
	}
});

var Chess = games.Chess = declare(Game, {
	name: 'Chess',

	/** The game is played by two players: White and Black. White moves first.
	*/
	players: ["White", "Black"],
	
	/** The constructor takes the `activePlayer` (`"White"` by default), and the `board` as an 
	instance of `CheckerboardFromPieces` (with the initial setup by default).	
	*/
	constructor: function Chess(activePlayer, board){
		Game.call(this, activePlayer);
		var game = this;
		if (!board) {
			this.board = this.initialBoard();
		} else if (Array.isArray(board)) {
			this.board = new ludorum.utils.CheckerboardFromPieces(board[0], board[1], board[2].map(function (p) {
				return new (game.kinds[p[0]])(p[1], p[2]);
			}));
		} else {
			this.board = board; // Trusts it is an instance of Checkerboard or compatible.
		}
		// Classify pieces by player and kind.
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
	'dual kinds': { /* To be completed latter. */ }, 
	
	/** The initial board of Chess has the first rank of the board with the following pieces for 
	Whites: Rook, Knight, Bishop, Queen, King, Bishop, Knight and Rook. The next rank has 8 Pawns.
	Blacks have a symmetrical layout on their ranks.
	*/
	initialBoard: function initialBoard() {
		var kinds = this.kinds,
			players = this.players,
			pieces = Iterable.chain(
				Iterable.product([1], [0,1,2,3,4,5,6,7]).map(function (p) {
					return new kinds.Pawn(players[0], p);
				}), 
				[
				new kinds.Rook(players[0], [0,0]),
				new kinds.Knight(players[0], [0,1]),
				new kinds.Bishop(players[0], [0,2]),
				new kinds.Queen(players[0], [0,3]),
				new kinds.King(players[0], [0,4]),
				new kinds.Bishop(players[0], [0,5]),
				new kinds.Knight(players[0], [0,6]),
				new kinds.Rook(players[0], [0,7]),
				],
				Iterable.product([6], [0,1,2,3,4,5,6,7]).map(function (p) {
					return new kinds.Pawn(players[1], p);
				}),
				[
				new kinds.Rook(players[1], [7,0]),
				new kinds.Knight(players[1], [7,1]),
				new kinds.Bishop(players[1], [7,2]),
				new kinds.Queen(players[1], [7,3]),
				new kinds.King(players[1], [7,4]),
				new kinds.Bishop(players[1], [7,5]),
				new kinds.Knight(players[1], [7,6]),
				new kinds.Rook(players[1], [7,7]),
				]
			).toArray();
		return new ludorum.utils.CheckerboardFromPieces(8, 8, pieces);
	},
	
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
		var move = moves[this.activePlayer()],
			movingPiece = this.board.square(move[1]);
		return new this.constructor(this.opponent(), movingPiece.next(this, this.board, move));
	},
	
	/** TODO.
	*/
	result: function result() {
		//FIXME
		if (this.moves()) {
			return null;
		} else if (this.checkMoves.length > 0) { // Checkmate!
			return this.defeat();
		} else { // Stalemate.
			return this.draw();
		}
	},
	
	// ## User intefaces ###########################################################################
	
	/** The `display(ui)` method is called by a `UserInterface` to render the game state. The only 
	supported user interface type is `BasicHTMLInterface`. The look can be configured using CSS 
	classes.
	*/
	display: function display(ui) {
		raiseIf(!ui || !(ui instanceof UserInterface.BasicHTMLInterface), "Unsupported UI!");
		return this.__displayHTML__(ui);
	},
	
	__displayHTML__: function __displayHTML__(ui) {
		var game = this,
			moves = this.moves(),
			activePlayer = this.activePlayer(),
			board = this.board,
			movesByFrom = moves ? iterable(moves[activePlayer]).groupAll(function (m) {
				return m[1] +'';
			}) : {},
			selectedMoves = ui.selectedPiece && iterable(movesByFrom[ui.selectedPiece]).map(function (m) {
				return [m[2] +'', m];
			}).toObject();
		board.renderAsHTMLTable(ui.document, ui.container, function (data) {
			/** The graphic of the square is defined by a CSS class. E.g. `ludorum-square-empty`, 
			`ludorum-square-White-Rook`, `ludorum-square-Black-Pawn` or `ludorum-square-move`.  
			*/
			var coordString = data.coord +'';
			data.className = !data.square ? 'ludorum-square-empty' :
				'ludorum-square-'+ data.square.player +'-'+ data.square.name;
			data.innerHTML = '&nbsp;';			
			if (ui.selectedPiece) {
				if (selectedMoves && selectedMoves.hasOwnProperty(coordString)) {
					data.className = 'ludorum-square-'+ activePlayer +'-move';
					data.onclick = function () {
						var selectedPiece = ui.selectedPiece;
						ui.selectedPiece = null;
						ui.perform(selectedMoves[coordString], activePlayer);
					};
				}
			}
			if (movesByFrom.hasOwnProperty(coordString)) {
				data.onclick = function () {
					ui.selectedPiece = coordString;
					ui.display(game); // Redraw the game state.     
				};
			}
		});
		return ui;
	},
	
	// ## Utility methods ##########################################################################
	
	/** The game state serialization simply contains the constructor arguments.
	*/
	__serialize__: function __serialize__() {
		var board = this.board;
		return [this.name, this.activePlayer(), [board.height, board.width, board.pieces.map(function (p) {
			return [p.name, p.player, p.position];
		})]];
	},
	
	/** The default string representation of Chess is the 
	[Forsyth–Edwards notation](http://en.wikipedia.org/wiki/Forsyth%E2%80%93Edwards_Notation).
	*/
	toString: function toString() {
		var board = this.board;
		return board.horizontals().reverse().map(function (hline) {
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
		}).join('/') +
		" "+ (this.activePlayer().charAt(0).toLowerCase());
		//TODO Castling, en-passant and move counts
	},
	
	// ## Heuristics ###############################################################################
	
	/** `Chess.heuristics` is a bundle of helper functions to build heuristic evaluation functions 
	for this game.
	*/
	'static heuristics': {
		// TODO
	}	
}); // declare Othello.

// ## Pieces #######################################################################################

Chess.kinds.Bishop = declare(Piece, {
	name: 'Bishop',
	game: Chess,
	
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
	
	next: function (game, board, move) {
		return board.clone()
			.__place__(move[1])
			.__place__(move[2], new this.constructor(this.player, move[2]));
	},
	
	toString: function toString() {
		return this.player === "White" ? "B" : "b";
	}
}); // declare Chess.kinds.Bishop

Chess.kinds.King = declare(Piece, { // TODO Castling.
	name: 'King',
	game: Chess,
	
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
	
	toString: function toString() {
		return this.player === "White" ? "K" : "k";
	}
}); // declare Chess.kinds.King

Chess.kinds.Knight = declare(Piece, {
	name: 'Knight',
	game: Chess,
	
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
	
	toString: function toString() {
		return this.player === "White" ? "N" : "n";
	}
}); // declare Chess.kinds.Knight

Chess.kinds.Pawn = declare(Piece, {
	name: 'Pawn',
	game: Chess,
	
	moves: function moves(game, board) { // TODO En passant captures.
		var piece = this,
			direction = (this.player === game.players[0]) ? +1 : -1,
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
		if (this.position[0] === (direction > 0 ? board.height - 2 : 1)) { // Promotions at the last rank.
			var promotions = ['Knight', 'Bishop', 'Rook', 'Queen'];
			return iterable(r).map(function (p) {
				return promotions.map(function (k) {
					return ['promote', piece, p, k];
				});
			}).flatten();
		} else {
			return iterable(r).map(function (p) {
				return ['move', piece.position, p];
			});
		}
	},
	
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
}); // declare Chess.kinds.Pawn

Chess.kinds.Rook = declare(Piece, {
	name: 'Rook',
	game: Chess,
	
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
	
	toString: function toString() {
		return this.player === "White" ? "R" : "r";
	}
}); // declare Chess.kinds.Rook

Chess.kinds.Queen = declare(Piece, {
	name: 'Queen',
	game: Chess,
	
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
	
	toString: function toString() {
		return this.player === "White" ? "Q" : "q";
	}
}); // declare Chess.kinds.Queen