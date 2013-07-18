var express = require('express'),
    app = express(),
    http = require('http'),
    server = http.createServer(app),
    io = require('socket.io').listen(server),
    fs = require('fs');

//io.set('log level', 1); // reduce logging

var Player = require('./public/js/models/Player.js');
var Game = require('./public/js/models/Game.js');

server.listen(1337);
console.log('listening to port 1337 (use bbcg.local - NOT localhost!!!)');

app.use(express.static(__dirname + '/public'));

var gamePool = {};
/*var game;
var pitcherSocket, batterSocket;*/

/* --- Global/Server-wide functions --- */

global.displayMessage = function(type, message) {
	io.sockets.emit('displayMessage', { type: type, text: message });
}
global.randomIntBetween = function(low, high) {
	return Math.floor(Math.random() * high) + low;
}
global.switchSockets = function() {
	var t = pitcherSocket; //temp to switch
	pitcherSocket = batterSocket;
	batterSocket = t;
	bindSockets();
}

function generateGameID() {
	//first, generate the ID
	var genKey = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

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
		socket.get('gameID', function (err, socketGameID) {
			if (socketGameID !== null) {
				console.log('player left, need to remove the game from the server');
				/*socket.get('playerTeam', function (err, playerTeam) {
					closeConnection(playerTeam.location);
				});*/
				removeGame(socketGameID);
			}
		});
    });
	/*
	if (!game || game.homeTeam == null) {
		//create a new game whenever the home team connects
		game = new Game();
		var playerTeam = new Player('home', 'Home');
		game.homeTeam = playerTeam;
		pitcherSocket = socket;
	}
	else if(game.awayTeam == null) {
		var playerTeam = new Player('away', 'Visitor');
		game.awayTeam = playerTeam;
		batterSocket = socket;
	}
	socket.set('playerTeam', playerTeam); //not sure if i need this anymore?
	socket.emit('updateTeam', playerTeam.location);
	socket.emit('displayMessage', { type: '', text: 'You are the '+playerTeam.location+' team' });
    
    if (game.homeTeam != null && game.awayTeam != null) {
        //Step 2 - When both teams are ready, send a message to both players that we can proceed, assign the roles (pitcher/batter) and start the game (playBall)
		playBall(socket);
    }
	
	socket.on('disconnect', function() { //in future, if any user disconnects, then the game is over
        socket.get('playerTeam', function (err, playerTeam) {
            closeConnection(playerTeam.location);
        });
    });
	*/
});

/*function closeConnection(myTeam) {
    if (myTeam !== null) {
        if (myTeam == 'home') {
            game.homeTeam = null;
        }
        else if(myTeam == 'away') {
            game.awayTeam = null;
        }
		displayMessage('', myTeam+' team has disconnected. You win!');
		game.gameover = true;
    }
}

function playBall() {
	game.pitcherDeck = game.homeTeam.deck;
	game.batterDeck = game.awayTeam.deck;

	//pick three cards for the pitcher and send them back to the pitching team
	//send the first 5 cards for the batting team to pick from
	game.playBall();

	//send the updated game model to each socket so that the frontend can be updated correctly
	io.sockets.emit('updateGameModel', game);
	
	bindSockets();
}

function bindSockets() {
	batterSocket.removeAllListeners("throwPitch");
	pitcherSocket.removeAllListeners("swingBat");
	pitcherSocket.removeAllListeners("stealBase");

	//wait for the pitcher to select either one of the 3 pitching cards or the top of the deck
	pitcherSocket.on('throwPitch', function(data) {
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

		io.sockets.emit('updateGameModel', game);
	});
	//send the signal to the batter that the pitcher is ready, and let the batter select their card
	//send the result play once the batter has made their selection
	batterSocket.on('swingBat', function(data) {
		//set the batter's card
		game.batterCard = game.batterSelections[game.outs][data.index];
		game.pitcherReady = false;

		//work out the play outcome
		game.resultPlay(data.index);

		if (game.gameover === true) {
			game.finishGame();
		}

		io.sockets.emit('updateGameModel', game);
	});

	batterSocket.on('stealBase', function(data) {
		game.stealBase(data.base);
		io.sockets.emit('updateGameModel', game);
	});

	batterSocket.emit('updateRole', 'batter');
	pitcherSocket.emit('updateRole', 'pitcher');
}*/

function createGame(socket) {
	//fist, check that this socket doesn't already have a game ID - if it does then just stop
	socket.get('gameID', function (err, socketGameID) {
		if (socketGameID === null) {
			console.log('creating a new game');
			console.log('current game pool');
			console.log(gamePool);
			//Generate a new Game ID, and display this to the user
			var gameID = generateGameID();
			//Add the user as the home team and add the game to the game array
			gamePool[gameID] = 'new game';
			console.log('new game pool');
			console.log(gamePool);
			//set the socket game ID, need to make sure that the user can only generate one game ID per connection
			socket.set('gameID', gameID);
			socket.emit('consoleLog', 'Your game ID is: '+gameID);
		}
	});
}

function joinGame(socket, gameID) {
	//fist, check that this socket doesn't already have a game ID - if it does then just stop
	socket.get('gameID', function (err, socketGameID) {
		if (socketGameID === null) {
			console.log('trying to join game: '+gameID);
			console.log('current game pool');
			console.log(gamePool);
			// Check if the game exists
			if (gameID in gamePool) {
				console.log('the game exists, so connect to this game');
				socket.set('gameID', gameID);
				// If it does, then check that the home team is present and the away team is empty
				//     -> If all ok, then add this player as the away team               
				//     -> If not, then error and do not inturrupt the other game going on
			}
			else {
				//If the game doesn't exist, error and send back to start a new game
				socket.emit('consoleLog', 'The game ID, '+gameID+', does not exist. Please start a new game.');
			}
		}
	});
}

function removeGame(gameID) {
	console.log('trying to remove game: '+gameID);
    console.log('current game pool');
	console.log(gamePool);
	delete gamePool[gameID];
    console.log('after removal game pool');
	console.log(gamePool);
}