require.config({ paths: {
	'creatartis-base': '../../lib/creatartis-base', 
	'sermat': '../../lib/sermat-umd',
	'ludorum': '../../lib/ludorum',
	'ludorum-gamepack': '../../lib/ludorum-gamepack',
	'playtester': '../../lib/playtester-common'
}});
require(['ludorum', 'ludorum-gamepack', 'creatartis-base', 'sermat', 'playtester'], 
		function (ludorum, ludorum_gamepack, base, Sermat, PlayTesterApp) {
	var BasicHTMLInterface = ludorum.players.UserInterface.BasicHTMLInterface;

	/** Custom HTML interface for Othello.
	*/
	var OthelloHTMLInterface = base.declare(BasicHTMLInterface, {
		constructor: function OthelloHTMLInterface() {
			BasicHTMLInterface.call(this, {
				document: document,
				container: document.getElementById('board')
			});
		},
	
		/** Each of the board's squares looks are customized via CSS.
		*/
		classNames: { 
			'B': "ludorum-square-Black",
			'W': "ludorum-square-White",
			'.': "ludorum-square-empty"
		},
		
		display: function display(game) {
			this.container.innerHTML = ''; // empty the board's DOM.
			var ui = this,
				moves = game.moves(),
				activePlayer = game.activePlayer(),
				board = game.board,
				classNames = this.classNames;
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
		}
	});

	/** PlayTesterApp initialization.
	*/
	base.global.APP = new PlayTesterApp(new ludorum_gamepack.Othello(), new OthelloHTMLInterface(),
		{ bar: document.getElementsByTagName('footer')[0] });
	APP.playerUI("You")
		.playerRandom()
		.playerMonteCarlo("", true, Infinity, 100)
		.playerMonteCarlo("", true, Infinity, 500)
		.playerUCT("", true, Infinity, 100)
		.playerUCT("", true, Infinity, 500)
		.playerAlfaBeta("", 3, true, 'ludorum_gamepack.Othello.heuristics.defaultHeuristic')
		.selects(['player0', 'player1'])
		.button('resetButton', document.getElementById('reset'), APP.reset.bind(APP))
		.reset();
}); // require().