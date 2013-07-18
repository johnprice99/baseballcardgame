function GameCtrl($scope, socket) {
	$scope.messages = [];
	
	socket.on('consoleLog', function (message) {
		console.log(message);
	});
	
	socket.on('displayMessage', function(message) {
		//console.log(message.text);
		$scope.messages.push(message);
	});

	socket.on('updateGameModel', function(game) {
		$scope.game = game;
	});

	socket.on('updateRole', function(role) {
		$scope.myRole = role;
	});

	socket.on('updateTeam', function(team) {
		$scope.myTeam = team;
	});

	/*----- User interaction events -----*/

	$scope.selectPitcherCard = function(index) {
		if (!$scope.game.gameover && !$scope.game.pitcherReady) { //prevent double clicking
			socket.emit('throwPitch', { index: index });
		}
	}

	$scope.selectBatterCard = function(index) {
		if (!$scope.game.gameover && $scope.game.pitcherReady) {
			socket.emit('swingBat', { index: index });
		}
	};

	$scope.stealBase = function(base) {
		socket.emit('stealBase', { base: base });
	}
	
	window.onbeforeunload = function (e) {
		if (!$scope.game.gameover) {
			var message = "This will cancel your current game and you will be marked as the loser.", e = e || window.event;
			// For IE and Firefox
			if (e) {
				e.returnValue = message;
			}
			// For Safari
			return message;
		}
	};
}