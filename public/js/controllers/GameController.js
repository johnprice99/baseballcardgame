function GameCtrl($scope, socket) {
	$scope.messages = [];
	$scope.modal = {
		"title" : "",
		"message" : "",
		"button" : "",
		"restartButton" : false,
		"show" : false
	};
	$scope.clearMessageOnModalClose = false;
	
	socket.on('showModalPopup', function (title, message, button, restartButton) {
		$scope.alert(title, message, button, restartButton);
	});
	
	socket.on('updateControlCenterMessage', function (message) {
		document.querySelector('#controlCenter').innerHTML = message;
	});
	
	socket.on('displayMessage', function(message) {
		$scope.messages.push(message);
	});
	
	socket.on('clearMessages', function(message) {
		$scope.clearMessageOnModalClose = true;
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
	
	$scope.joinGame = function() {
		var gameID = document.querySelector('#gameID').value;
		if (!gameID) {
			$scope.alert('Invalid game ID', '<p>You must enter a game ID to join</p>', 'OK');
			return;
		}
		socket.emit('joinGame', gameID);
	};
			
	$scope.createGame = function() {
		socket.emit('createGame');
	};
			
	$scope.selectPitcherCard = function(index) {
		if (!$scope.game.gameover && !$scope.game.pitcherReady) { //prevent double clicking
			socket.emit('throwPitch', { index: index });
		}
	};

	$scope.selectBatterCard = function(index) {
		if (!$scope.game.gameover && $scope.game.pitcherReady) {
			socket.emit('swingBat', { index: index });
		}
	};

	$scope.stealBase = function(base) {
		if (!$scope.game.pitcherReady) {
			socket.emit('stealBase', { base: base });
		}
		else {
			$scope.alert('You cannot steal now', 'You can only steal before the pitcher has thrown their pitch', 'OK');
		}
	};
	
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
	
	$scope.restartGame = function() {
		location.reload();
	}
	
	/* --- Modal popup code --- */
	
	$scope.alert = function(title, message, button, restartButton) {
		if (restartButton === undefined) {
			restartButton = false;
		}
		
		$scope.modal = {
			"title" : title,
			"message" : message,
			"button" : button,
			"restartButton" : restartButton,
			"show" : true
		};
	};
	
	$scope.closeModalPopup = function() {
		$scope.modal.show = false;
		if ($scope.clearMessageOnModalClose == true) {
			$scope.messages = [];
			$scope.clearMessageOnModalClose = false;
		}
	};
}