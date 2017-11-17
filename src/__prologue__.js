/** Package wrapper and layout.
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
