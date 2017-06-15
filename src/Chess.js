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
	next: function next(moves, haps, update) {
		//FIXME WIP
		raiseIf(haps, 'Haps are not required (given ', haps, ')!');
		var activePlayer = this.activePlayer(),
			move = moves[activePlayer],
			movingPiece = this.board.square(move[1]);
		//console.log(this+"");//LOG
		var args = {
			activePlayer: this.opponent(), 
			board: movingPiece.next(this, this.board, move),
			castling: this.castling,
			enPassant: null,
			halfMoves: this.halfMoves,
			fullMoves: this.fullMoves + (activePlayer === 'Black' ? 1 : 0)
		};
		if (update) {
			this.constructor(args);
			return this;
		} else {
			return new this.constructor(args);
		}
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