require.config({ paths: {
	'creatartis-base': '../../lib/creatartis-base.min',
	'sermat': '../../lib/sermat-umd',
	'ludorum': '../../lib/ludorum.min',
	'ludorum-gamepack': '../../lib/ludorum-gamepack',
	'playtester': '../../lib/playtester-common'
}});
require(['ludorum', 'ludorum-gamepack', 'creatartis-base', 'sermat', 'playtester'],
		function (ludorum, ludorum_gamepack, base, Sermat, PlayTesterApp) {
	var BasicHTMLInterface = ludorum.players.UserInterface.BasicHTMLInterface;

	/** Custom HTML interface for Chess.
	*/
	var ChessHTMLInterface = base.declare(BasicHTMLInterface, {
		constructor: function ChessHTMLInterface() {
			BasicHTMLInterface.call(this, {
				document: document,
				container: document.getElementById('board')
			});
		},

		/** CSS class name for the square.
		*/
		__className__: function __className__(square) {
			return !square ? 'ludorum-square-empty' : 'ludorum-square-'+ square.player +'-'+ square.name;
		},

		display: function display(game) {
			this.container.innerHTML = ''; // empty the board's DOM.
			var ui = this,
				moves = game.moves(),
				activePlayer = game.activePlayer(),
				board = game.board,
				movesByFrom = moves ? base.iterable(moves[activePlayer]).groupAll(function (m) {
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
				data.className = ui.__className__(data.square);
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
		}
	});

	/** PlayTesterApp initialization.
	*/
	base.global.APP = new PlayTesterApp(new ludorum_gamepack.Chess(), new ChessHTMLInterface(),
		{ bar: document.getElementsByTagName('footer')[0] });
	APP.playerUI("You")
		.playerRandom()
		.playerMonteCarlo("", true, 1000, 500)
		.playerMonteCarlo("", true, 1000, 1000)
		.playerUCT("", true, 1000, 500)
		.playerUCT("", true, 1000, 1000)
		.playerAlfaBeta("", 3, true)
		.selects(['player0', 'player1'])
		.button('resetButton', document.getElementById('reset'), APP.reset.bind(APP))
		.reset();
}); // require().
