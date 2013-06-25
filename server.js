/*

DONE
Step 1 - Two browsers connect
Step 2 - When both teams are ready, send a message to both players that we can proceed, assign the roles (pitcher/batter) and start the game (playBall)

TODO
Step 3 - Listen for when the pitcher is ready (pitcher selects a card) and select the appropriate card and return the value to them
Step 4 - Pitcher recieves the message from the server about the value of their card
Step 5 - Batter recieves message that they can proceed with their turn (and the pitcher's card value)
Step 6 - Listen for when the batter selects a card and select the appropriate one for them and return the value to them
Step 7 - Send out both card values to both players so they can see what they have selected
Step 8 - The play progresses and the game board is updated... (more steps after this)

*/

var express = require('express'),
    app = express(),
    http = require('http'),
    server = http.createServer(app),
    io = require('socket.io').listen(server),
    fs = require('fs');

//io.set('log level', 1); // reduce logging

var Player = require('./js/Player.js');
var Game = require('./js/Game.js');

server.listen(1337);
console.log('listening to port 1337');

app.get('/', function(request, response) {
    response.sendfile(__dirname + "/index.html");
});

app.get('/partials/:index', function(request, response){
    response.sendfile(__dirname + "/partials/"+request.params.index);
});

var game = new Game();
var pitcherSocket, batterSocket;

io.sockets.on('connection', function(socket) {
    if (game.homeTeam != null && game.awayTeam != null) {
        socket.emit('consoleMessage', 'There are no teams available at the moment');
        return;
    }
    else {
        if (game.homeTeam == null) {
			var playerTeam = new Player('home', 'Home');
			game.homeTeam = playerTeam;
			pitcherSocket = socket;
        }
        else if(game.awayTeam == null) {
			var playerTeam = new Player('away', 'Visitor');
			game.awayTeam = playerTeam;
			batterSocket = socket;
        }
        socket.set('playerTeam', playerTeam);
        socket.emit('consoleMessage', 'You are the '+playerTeam.location+' team');
    }
    
    if (game.homeTeam != null && game.awayTeam != null) {
        //Step 2 - When both teams are ready, send a message to both players that we can proceed, assign the roles (pitcher/batter) and start the game (playBall)
		playBall(socket);
    }
	
	socket.on('disconnect', function() { //in future, if any user disconnects, then the game is over
        socket.get('playerTeam', function (err, playerTeam) {
            closeConnection(playerTeam.location);
        });
    });
});

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

function closeConnection(myTeam) {
    if (myTeam !== null) {
        if (myTeam == 'home') {
            game.homeTeam = null;
        }
        else if(myTeam == 'away') {
            game.awayTeam = null;
        }
        io.sockets.emit('consoleMessage', myTeam+' team has disconnected');
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
}