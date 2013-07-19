function GameCtrl($scope, socket) {
	$scope.messages = [];
	
	socket.on('showModalPopup', function (message) {
		document.querySelector('#modalPopup').innerHTML = message;
		$scope.showModalPopup = true;
	});
			
	socket.on('displayMessage', function(message) {
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
	
	$scope.joinGame = function() {
		var gameID = document.querySelector('#gameID').value;
		if (!gameID) {
			$scope.alert('Invalid game ID', '<p>You must enter a game ID to join</p>');
			return;
		}
		socket.emit('joinGame', gameID);
	}
			
	$scope.createGame = function() {
		socket.emit('createGame');
	}
			
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
	
	/*window.onbeforeunload = function (e) {
		if (!$scope.game.gameover) {
			var message = "This will cancel your current game and you will be marked as the loser.", e = e || window.event;
			// For IE and Firefox
			if (e) {
				e.returnValue = message;
			}
			// For Safari
			return message;
		}
	};*/
	
	/* --- Modal popup code --- */
	
	$scope.alert = function(title, message) {
		$scope.modal = {
			"title" : title,
			"message" : message,
			"show" : true
		}
	}
	$scope.closeModalPopup = function(title, message) {
		$scope.modal.show = false;
	}
}