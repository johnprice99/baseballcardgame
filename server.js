var express = require('express'),
    app = express(),
    http = require('http'),
    server = http.createServer(app),
    io = require('socket.io').listen(server),
    fs = require('fs');

io.set('log level', 1); // reduce logging

var Player = require('./public/js/Player.js');
var Game = require('./public/js/Game.js');

server.listen(1337);
console.log('listening to port 1337');

app.get('/', function(request, response) {
    response.sendfile(__dirname + "/public/index.html");
});

app.get('/public/:dir/:file', function(request, response) {
    response.sendfile(__dirname + '/public/'+request.params.dir+'/'+request.params.file);
});

app.get('/public/partials/:dir/:file', function(request, response) {
    response.sendfile(__dirname + '/public/partials/'+request.params.dir+'/'+request.params.file);
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