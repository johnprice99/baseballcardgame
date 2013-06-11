/* main.js */

function displayMessage(type, message) {
	console.log(message);
	$('#messageBox').append('<p class="'+type+'">'+message+'</p>').animate({
		scrollTop:$("#messageBox")[0].scrollHeight
	}, 1000);
}

function stealBase(base) {
	hideStealButtons();
	game.stealBase(base);
	updateBoard();
}

function hideStealButtons() {
	//hide all steal buttons
	$('button.stealButton').addClass('hidden');
}

function clearOuts() {
	$('ul#outs li').removeClass('out');
}

function updateBoxScore(list, score) {
	list.empty();
	for(inningScore=0; inningScore < score.length; inningScore++) {
		list.append('<li>' + score[inningScore] + '</li>');
	}
	//also add an li to display the total runs
	list.append('<li>' + score.sum() + '</li>');
}

function updateBoard() {
	console.log('BASES:');
	console.log(game.bases);
	//Update current inning
	$('#inning').html(game.currentInning);

	$('#teamOnOffense').removeClass().addClass(game.teamOnOffense);
	$('#scoreboard #homeTeamLabel').removeClass('highlight');
	$('#scoreboard #awayTeamLabel').removeClass('highlight');
	$('#scoreboard #'+game.teamOnOffense+'TeamLabel').addClass('highlight');

	//update the number of outs
	if (game.outs >= 1) {
		$('ul#outs li').eq(1).addClass('out');
	}
	if (game.outs === 2) {
		$('ul#outs li').eq(0).addClass('out');
	}
	
	//update the display of runners on base
	$('.base').not('#home').removeClass('hasRunner');
	if (game.bases[0] === 1) {
		$('.base#first').addClass('hasRunner');
	}
	if (game.bases[1] === 1) {
		$('.base#second').addClass('hasRunner');
	}
	if (game.bases[2] === 1) {
		$('.base#third').addClass('hasRunner');
	}

	//update the away score
	updateBoxScore($('#scoreboard #visitor'), game.scores.away);

	//update the home score
	updateBoxScore($('#scoreboard #home'), game.scores.home);

	//Check if there are any steal attempts available
	//if there is nobody on second base, then show the option to steal second
	if (game.bases[0] === 1 && game.bases[1] === 0) {
		$('button#stealSecond').removeClass('hidden');
	}
	//if there is nobody on third base, then show the option to steal third
	if (game.bases[1] === 1 && game.bases[2] === 0) {
		$('button#stealThird').removeClass('hidden');
	}
	//if there is somebody on first and second, and nobody on third, then show the double steal button
	if (game.bases[0] === 1 && game.bases[1] === 1 && game.bases[2] === 0) {
		$('button#stealSecondAndThird').removeClass('hidden');
	}
	//if there is somebody on third base, then show the option to steal home
	if (game.bases[2] === 1) {
		$('button#stealHome').removeClass('hidden');
	}

	//if it is game over
	if (game.gameover === true) {
		$('#pitcherCard').remove();
		$('#playerCards ul li').remove();
		hideStealButtons();
		displayMessage('', '==========GAME OVER==========');
	}
}

function loadBatterCards() {
	$('#playerCards ul').empty();
	for (var i=1;i<=5;i++) {
		$('#playerCards ul').append('<li><section class="card back"></section></li>');
	}
}

function setupNextInning() {
	clearOuts();
	hideStealButtons();
	loadBatterCards();
	pitcherReady = false;
	$('#pitcherCard').html('').addClass('back');
}

function nextBatter() {
	game.pitcherCardValue = 0;
	game.batterCardValue = 0;
	
	if (!game.gameover) {
		$('#pitcherCard').html('').addClass('back');
		if (!$('#playerCards ul li').length) {
			displayMessage('notice', 'Replenishing batter cards...');
			loadBatterCards();
		}
	}
}

/* --- Initialisation --- */
var game = new Game();
var pitcherReady = false;

$(function() {
	updateBoard();

	$('#pitcherCard').on('click', function() {
		if (!game.gameover && $(this).is('.back')) {
			game.pitcherCardValue = randomIntBetween(1, 13);
			$(this).html(game.pitcherCardValue).removeClass('back');
			pitcherReady = true;
		}
	});

	$(document).on('click', '#playerCards .card', function() {
		if (!game.gameover && pitcherReady) {
			var clickedCard = $(this);
			game.batterCardValue = randomIntBetween(1, 13);
			clickedCard.html(game.batterCardValue).removeClass('back');

			game.resultPlay();
			updateBoard();
			pitcherReady = false;
			setTimeout(function() {
				clickedCard.parent().remove();
				nextBatter();
			}, 3000);
		}
	});

	$('button#stealSecond').on('click', function() {
		stealBase(2);
	});
	$('button#stealThird').on('click', function() {
		stealBase(3);
	});
	$('button#stealSecondAndThird').on('click', function() {
		//5 is a special number for the double steal
		stealBase(5);
	});
	$('button#stealHome').on('click', function() {
		stealBase(4);
	});
});

//ERROR: Not sure the base runners are correctly shown on the board - we are seeing base runners on all bases and all steal buttons are showing too!
//TODO: No longer says when the half inning or full inning changes
//ERROR: End of inning seems to ignore the timeout?
//TODO: Clean up some messages, if 2/3 runs score it should say so instead of repeating the message
//TODO: If the game is tied then add an extra inning
//TODO: Assign a role to each player, home player and away - then make sure that they can only pitch/hit when it is their turn
//TODO: Model cards and decks within JS -- Copy each functionality from the PHP classes (shuffle, add, pick random etc)
//TODO: Allow the user to name their team for the game
//TODO: Add node.js functionality to allow concurrent users