var express = require('express'),
    app = express(),
    http = require('http'),
    server = http.createServer(app),
    io = require('socket.io').listen(server),
    fs = require('fs');

io.set('log level', 1); // reduce logging

var Player = require('./public/js/models/Player.js');
var Game = require('./public/js/models/Game.js');

server.listen(1337);
console.log('listening to port 1337 (use bbcg.local - NOT localhost!!!)');

app.use(express.static(__dirname + '/public'));

var gamePool = {};

/* --- Global/Server-wide functions --- */

global.displayMessage = function(type, message, gamePoolID) {
	//check if game exists
	if (gamePoolID in gamePool) {
		var game = gamePool[gamePoolID];
		game.pitcherSocket.emit('displayMessage', { type: type, text: message });
		game.batterSocket.emit('displayMessage', { type: type, text: message });
	}
}
global.sendGameUpdate = function(gamePoolID) {
	//check if game exists
	if (gamePoolID in gamePool) {
		var gameData = gamePool[gamePoolID];
		var game = gameData.game;
		
		var winningTeam = '';
		var awayScore = game.scores.away.sum();
		var homeScore = game.scores.home.sum();
		
		if (game.gameStarted == false) { //when the game begins
			gameData.pitcherSocket.emit('showModalPopup', 'Game started', 'The game is about to begin. You are the home team, pitching first..', 'OK');
			gameData.batterSocket.emit('showModalPopup', 'Game started', 'You have joined the game and are the away team, batting first.', 'OK');
		}
		else if (game.gameover == true) { //when calling this function from the game over
			var winningScore, losingScore, winningMsg, losingMsg;

			if (awayScore > homeScore) {
				winningTeam = 'away';
				winningScore = awayScore;
				losingScore = homeScore;
			}
			else {
				winningTeam = 'home';
				winningScore = homeScore;
				losingScore = awayScore;
			}

			winningMsg = '<p>Congratulations, you won with a score of '+winningScore+'-'+losingScore+'.<p>';
			losingMsg = '<p>Unfortunately, the '+winningTeam+' team won '+winningScore+'-'+losingScore+'. Better luck next time.<p>';

			//work out whether the away team is the pitching or batting socket
			if (game.teamOnOffense == winningTeam) { //batting team one
				gameData.batterSocket.emit('showModalPopup', 'Game Over - You win!', winningMsg, 'Play Again', true);
				gameData.pitcherSocket.emit('showModalPopup', 'Game Over - You lost.', losingMsg, 'Play Again', true);
			}
			else { //pitching team one
				gameData.pitcherSocket.emit('showModalPopup', 'Game Over - You win!', winningMsg, 'Play Again', true);
				gameData.batterSocket.emit('showModalPopup', 'Game Over - You lost.', losingMsg, 'Play Again', true);
			}
		}
		else { //when calling this function between innings
			var title, winningMsg, losingMsg;

			if (awayScore > homeScore) {
				winningTeam = 'away';
				winningMsg = 'You are in the lead, '+awayScore+'-'+homeScore+'.';
				losingMsg = 'You are currently behind, '+awayScore+'-'+homeScore+'.';
			}
			else if (awayScore < homeScore) {
				winningTeam = 'home';
				winningMsg = 'You are in the lead, '+homeScore+'-'+awayScore+'.';
				losingMsg = 'You are currently behind, '+homeScore+'-'+awayScore+'.';
			}
			else {
				winningMsg = 'The game is tied '+homeScore+'-'+awayScore+'.';
				losingMsg = 'The game is tied '+homeScore+'-'+awayScore+'.';
			}
			
			title = (game.teamOnOffense == 'away') ? 'Middle' : 'End';
			title += ' of inning '+game.currentInning;
			
			//work out whether the away team is the pitching or batting socket
			if (game.teamOnOffense == winningTeam) { //batting team one
				gameData.batterSocket.emit('showModalPopup', title, '<p>'+winningMsg+' You are now pitching.</p>', 'Continue');
				gameData.pitcherSocket.emit('showModalPopup', title, '<p>'+losingMsg + ' You are now batting.</p>', 'Continue');
			}
			else { //pitching team one
				gameData.pitcherSocket.emit('showModalPopup', title, '<p>'+winningMsg + ' You are now batting.</p>', 'Continue');
				gameData.batterSocket.emit('showModalPopup', title, '<p>'+losingMsg + ' You are now pitching.</p>', 'Continue');
			}
			
			//clear the messages per-inning to keep it easy to understand
			gameData.pitcherSocket.emit('clearMessages');
			gameData.batterSocket.emit('clearMessages');
		}
	}
}
global.randomIntBetween = function(low, high) {
	return Math.floor(Math.random() * high) + low;
}
global.switchSockets = function(gamePoolID) {
	if (gamePoolID in gamePool) {
		var game = gamePool[gamePoolID];
		var t = game.pitcherSocket; //temp to switch
		
		game.pitcherSocket = game.batterSocket;
		game.batterSocket = t;
		bindSockets(gamePoolID);
	}
}

function generateGameID() {
	//first, generate the ID
	var genKey = "";
    //var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    for (var i=0; i<5; i++) {
        genKey += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	//check that the ID doesn't already exist
	if (genKey in gamePool) {
		//if it does, regenerate again
		genKey = generateGameID();
	}
	
	//if not, return the generated value
    return genKey;
}

/* --- Gameplay functions --- */

function playBall(gamePoolID) {
	//check if game exists
	if (gamePoolID in gamePool) {
		var gameData = gamePool[gamePoolID];
		var game = gameData.game;
			
		game.pitcherDeck = game.homeTeam.deck;
		game.batterDeck = game.awayTeam.deck;
		game.playBall();
		
		//send the updated game model to each socket so that the frontend can be updated correctly
		gameData.pitcherSocket.emit('updateGameModel', game);
		gameData.batterSocket.emit('updateGameModel', game);
		
		bindSockets(gamePoolID);
	}
}

function bindSockets(gamePoolID) {
	//check if game exists
	if (gamePoolID in gamePool) {
		var gameData = gamePool[gamePoolID];
		var game = gameData.game;
			
		gameData.batterSocket.removeAllListeners("throwPitch");
		gameData.pitcherSocket.removeAllListeners("swingBat");
		gameData.pitcherSocket.removeAllListeners("stealBase");

		//wait for the pitcher to select either one of the 3 pitching cards or the top of the deck
		gameData.pitcherSocket.on('throwPitch', function(data) {
			//check if we are just drawing from the top of the deck
			if (data.index > 3) {
				//add the previous selected card to the bottom of the pitcher's deck
				if (game.pitcherCard != 0) {
					game.pitcherDeck.addCardToHand(game.pitcherCard);
				}
				game.pitcherCard = game.pitcherDeck.drawCardsFromTop(1)[0];
			}
			else {
				game.pitcherCard = game.pitcherSelections[data.index];
				//this needs to be done here, or refactor the resultPlay() function
				game.pitcherDeck.addCardToHand(game.pitcherSelections.splice(data.index, 1)[0]);
			}

			game.batterCard = 0;
			game.pitcherReady = true;
			
			gameData.batterSocket.emit('updateGameModel', game);
			gameData.pitcherSocket.emit('updateGameModel', game);
		});
		//send the signal to the batter that the pitcher is ready, and let the batter select their card
		//send the result play once the batter has made their selection
		gameData.batterSocket.on('swingBat', function(data) {
			//set the batter's card
			game.batterCard = game.batterSelections[game.outs][data.index];
			game.pitcherReady = false;

			//work out the play outcome
			game.resultPlay(data.index);

			gameData.batterSocket.emit('updateGameModel', game);
			gameData.pitcherSocket.emit('updateGameModel', game);
			
			if (game.gameover === true) {
				sendGameUpdate(gamePoolID);
				delete gamePool[gamePoolID];
			}
		});

		gameData.batterSocket.on('stealBase', function(data) {
			game.stealBase(data.base);
			
			gameData.batterSocket.emit('updateGameModel', game);
			gameData.pitcherSocket.emit('updateGameModel', game);
		});

		gameData.batterSocket.emit('updateRole', 'batter');
		gameData.pitcherSocket.emit('updateRole', 'pitcher');
	}
}

/* --- Socket IO functions --- */

io.sockets.on('connection', function(socket) {
	socket.on('joinGame', function(gameID) { //in future, if any user disconnects, then the game is over
		joinGame(socket, gameID);
    });
	socket.on('createGame', function(gameID) { //in future, if any user disconnects, then the game is over
		createGame(socket);
    });
	socket.on('disconnect', function() { //if any user disconnects, then the game is over
		// When a user disconnects, notify the winner and remove the game from the game array
		socket.get('gameID', function (err, gamePoolID) {
			if (gamePoolID !== null) {
				socket.get('playerTeam', function (err, playerTeam) {
					closeConnection(playerTeam.location, gamePoolID);
				});
			}
		});
    });
});

function createGame(socket) {
	//fist, check that this socket doesn't already have a game ID - if it does then just stop
	socket.get('gameID', function (err, gamePoolID) {
		if (gamePoolID === null) {
			//Generate a new Game ID, and display this to the user
			var gameID = generateGameID();
			//Add the user as the home team and add the game to the game array
			var newGame = new Game();
			newGame.gamePoolID = gameID;
			var playerTeam = new Player('home', 'Home');
			newGame.homeTeam = playerTeam;
			var newGameObject = {
				game: newGame,
				pitcherSocket: socket
			}
			gamePool[gameID] = newGameObject;
			//set the socket game ID, need to make sure that the user can only generate one game ID per connection
			socket.set('gameID', gameID);
			socket.set('playerTeam', playerTeam); //not sure if i need this anymore?
			socket.emit('updateTeam', playerTeam.location);
			
			//socket.emit('displayMessage', { type: '', text: 'You are the '+playerTeam.location+' team' });
			socket.emit('updateControlCenterMessage', '<p>Your game ID is: <span>'+gameID+'</span></p><p>Waiting for an away team to join...<p>');
		}
	});
}

function joinGame(socket, gameID) {
	//fist, check that this socket doesn't already have a game ID - if it does then just stop
	socket.get('gameID', function (err, gamePoolID) {
		if (gamePoolID === null) {
			// Check if the game exists
			if (gameID in gamePool) {
				joinedGameData = gamePool[gameID];
				joinedGame = joinedGameData.game;
				// If it does, then check that the home team is present and the away team is empty
				if (joinedGame.awayTeam == null) {
					joinedGameData.batterSocket = socket;
					// If all ok, then add this player as the away team               
					var playerTeam = new Player('away', 'Visitor');
					joinedGame.awayTeam = playerTeam;
					socket.set('gameID', gameID);
					socket.set('playerTeam', playerTeam); //not sure if i need this anymore?
					socket.emit('updateTeam', playerTeam.location);
					//socket.emit('displayMessage', { type: '', text: 'You are the '+playerTeam.location+' team' });
					//When both teams are ready, send a message to both players that we can proceed, assign the roles (pitcher/batter) and start the game (playBall)
					
					sendGameUpdate(gameID);
					playBall(gameID);
				}
				else {
					socket.emit('showModalPopup', 'Invalid game ID', '<p>The game ID, '+gameID+', already has both teams playing.</p><p>Check your game ID or start a new game.</p>', 'OK');
				}
			}
			else {
				//If the game doesn't exist, error and send back to start a new game
				socket.emit('showModalPopup', 'Invalid game ID', '<p>The game ID <strong>'+gameID+'</strong> does not exist.</p><p>Start a new game.</p>', 'OK');
			}
		}
	});
}

function closeConnection(leavingTeam, gamePoolID) {	
	if (gamePoolID in gamePool) {
		var gameData = gamePool[gamePoolID];
		var game = gameData.game;
		
		delete gamePool[gamePoolID];
		
		if (game.gameover == false) {
			game.gameover = true;
			if (gameData.pitcherSocket !== undefined) {
				gameData.pitcherSocket.emit('updateGameModel', game);
				gameData.pitcherSocket.emit('showModalPopup', 'Game Over - You win!', '<p>The '+leavingTeam+' team has disconnected.<p>', 'Play Again', true);
			}
			if (gameData.batterSocket !== undefined) {
				gameData.batterSocket.emit('updateGameModel', game);
				gameData.batterSocket.emit('showModalPopup', 'Game Over - You win!', '<p>The '+leavingTeam+' team has disconnected.<p>', 'Play Again', true);
			}
		}
    }
}