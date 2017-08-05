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

	/** Custom HTML interface for Connect4.
	*/
	var ConnectFourHTMLInterface = base.declare(BasicHTMLInterface, {
		constructor: function ConnectFourHTMLInterface() {
			BasicHTMLInterface.call(this, {
				document: document,
				container: document.getElementById('board')
			});
		},

		/** Each of the board's squares looks are customized via CSS.
		*/
		classNames: {
			'0': "ludorum-square-player0",
			'1': "ludorum-square-player1",
			'.': "ludorum-square-empty"
		},

		/** This is a mapping from the board to HTML for each of the board's squares.
		*/
		squareHTML: {
			'0': "&#x25CF;",
			'1': "&#x25CF;",
			'.': "&nbsp;"
		},

		display: function display(game) {
			this.container.innerHTML = ''; // empty the board's DOM.
			var ui = this,
				moves = game.moves(),
				activePlayer = game.activePlayer(),
				board = game.board,
				classNames = this.classNames,
				squareHTML = this.squareHTML;
			moves = moves && moves[activePlayer];
			var table = game.board.renderAsHTMLTable(this.document, this.container, function (data) {
					data.className = classNames[data.square];
					data.innerHTML = squareHTML[data.square];
					if (moves && moves.indexOf(data.coord[1]) >= 0) {
						data.move = data.coord[1];
						data.activePlayer = activePlayer;
						data.onclick = ui.perform.bind(ui, data.move, activePlayer);
					}
				});
			table.insertBefore(
				ui.build(ui.document.createElement('colgroup'),
					base.Iterable.repeat(['col'], game.board.width).toArray()),
				table.firstChild
			);
			return ui;
		}
	});

	/** PlayTesterApp initialization.
	*/
	base.global.APP = new PlayTesterApp(new ludorum_gamepack.ConnectFour(), new ConnectFourHTMLInterface(),
		{ bar: document.getElementsByTagName('footer')[0] });
	APP.playerUI("You")
		.playerRandom()
		.playerMonteCarlo("", true, Infinity, 100)
		.playerMonteCarlo("", true, Infinity, 1000)
		.playerAlfaBeta("", true, 3)
		.playerAlfaBeta("", true, 5)
		.selects(['player0', 'player1'])
		.button('resetButton', document.getElementById('reset'), APP.reset.bind(APP))
		.reset();
}); // require().
