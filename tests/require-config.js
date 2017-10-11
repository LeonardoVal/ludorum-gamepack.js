// Generated code, please do NOT modify.
(function () { "use strict";
	define([], function () {
		var config = {
			"paths": {
				"ludorum-gamepack": "../build/ludorum-gamepack",
				"ludorum-game-connect4": "../node_modules/@creatartis/ludorum-game-connect4/build/ludorum-game-connect4.min",
				"ludorum-game-colograph": "../node_modules/@creatartis/ludorum-game-colograph/build/ludorum-game-colograph.min",
				"ludorum-game-mancala": "../node_modules/@creatartis/ludorum-game-mancala/build/ludorum-game-mancala.min",
				"ludorum-game-reversi": "../node_modules/@creatartis/ludorum-game-reversi/build/ludorum-game-reversi.min",
				"sermat": "../node_modules/sermat/build/sermat-umd-min",
				"creatartis-base": "../node_modules/creatartis-base/build/creatartis-base.min",
				"ludorum": "../node_modules/ludorum/build/ludorum.min"
			}
		};
		if (window.__karma__) {
			config.baseUrl = '/base';
			for (var p in config.paths) {
				config.paths[p] = config.paths[p].replace(/^\.\.\//, '/base/');
			}
			config.deps = Object.keys(window.__karma__.files) // Dynamically load all test files
				.filter(function (file) { // Filter test modules.
					return /\.test\.js$/.test(file);
				}).map(function (file) { // Normalize paths to RequireJS module names.
					return file.replace(/^\/base\/(.*?)\.js$/, '$1');
				});
		}
		require.config(config);
		console.log("RequireJS configuration: "+ JSON.stringify(config, null, '  '));
	});
})();