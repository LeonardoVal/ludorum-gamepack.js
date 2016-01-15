var APP = {};

require.config({ 
	paths: { 
		'creatartis-base': '../../lib/creatartis-base',
		'sermat': '../../lib/sermat-umd',
		'ludorum': '../../lib/ludorum',
		'ludorum-gamepack': '../../lib/ludorum-gamepack'
	}
});
require(['creatartis-base', 'ludorum', 'ludorum-gamepack'], function (base, ludorum, ludorum_gamepack) {
	APP.imports = { base: base, ludorum: ludorum, 'ludorum-gamepack': ludorum_gamepack };

// Player options. /////////////////////////////////////////////////////////////
	var PLAYER_OPTIONS = APP.PLAYER_OPTIONS = [
			{title: "You", builder: function () { 
				return new ludorum.players.UserInterfacePlayer(); 
			}, runOnWorker: false },
			{title: "Random", builder: function () { 
				return new ludorum.players.RandomPlayer();
			}, runOnWorker: false },
			{title: "MonteCarlo (0.5seg)", builder: function () {
				return new ludorum.players.MonteCarloPlayer({ simulationCount: 100, timeCap: 500 });
			}, runOnWorker: true },
			{title: "MonteCarlo (1.0seg)", builder: function () {
				return new ludorum.players.MonteCarloPlayer({ simulationCount: 100, timeCap: 1000 });
			}, runOnWorker: true },
			{title: "AlphaBeta (h=3)", builder: function () {
				return new ludorum.players.AlphaBetaPlayer({ horizon: 3, 
					heuristic: ludorum.players.HeuristicPlayer.composite(
						ludorum.games.Othello.heuristics.heuristicFromSymmetricWeights(
							[+9,-3,+3,+3, -3,-3,-1,-1, +3,-1,+1,+1, +3,-1,+1,+1]
						), 0.6,
						ludorum.games.Othello.heuristics.pieceRatio, 0.2,
						ludorum.games.Othello.heuristics.mobilityRatio, 0.2
					)
				});
			}, runOnWorker: true },
			{title: "UCT (1.0seg)", builder: function () {
				return new ludorum.players.UCTPlayer({ simulationCount: 2000, timeCap: 1000 });
			}, runOnWorker: true }
		];
	APP.players = [PLAYER_OPTIONS[0].builder(), PLAYER_OPTIONS[0].builder()];
	$('#player0, #player1').html(PLAYER_OPTIONS.map(function (option, i) {
		return '<option value="'+ i +'">'+ option.title +'</option>';
	}).join(''));
	$('#player0, #player1').change(function () {
		var i = this.id === 'player0' ? 0 : 1;
		(function (option) {
			if (option.runOnWorker) {
				return ludorum.players.WebWorkerPlayer.create({ 
					playerBuilder: option.builder,
					dependencies: [ludorum_gamepack]
				});
			} else {
				return base.Future.when(option.builder());
			}
		})(PLAYER_OPTIONS[+this.value]).then(function (player) {
			APP.players[i] = player;
			APP.reset();
		});
	});
	
// Buttons. ////////////////////////////////////////////////////////////////////
	$('#reset').click(APP.reset = function reset() {
		var game = new ludorum.games.Chess(),
			match = new ludorum.Match(game, APP.players);
		$('#player0-name').html(base.Text.escapeXML(game.players[0]));
		$('#player1-name').html(base.Text.escapeXML(game.players[1]));
		APP.ui = new ludorum.players.UserInterface.BasicHTMLInterface({ match: match, container: 'board' });
		match.events.on('begin', function (game) {
			$('footer').html(base.Text.escapeXML(
				"Turn "+ game.activePlayer() +"."
			));
		});
		match.events.on('next', function (game, next) {
			$('footer').html(base.Text.escapeXML(
				"Turn "+ next.activePlayer() +"."
			));
		});
		match.events.on('end', function (game, results) {
			var player0 = game.players[0];
			$('footer').html(
				base.Text.escapeXML(
					(results[player0] === 0 ? 'Drawed game.' : 
						(results[player0] > 0 ? player0 : game.players[1]) +' wins.')) 
				+'<br/>'+
				base.Text.escapeXML(JSON.stringify(results))
			);
		});
		match.run();
	});
	
// Start.
	APP.reset();
}); // require().
