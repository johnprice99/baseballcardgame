/* Game Object */
Array.max = function(array){
    return Math.max.apply(Math, array);
};
Array.prototype.sum = function() {
	return this.reduce(function(a,b){return a+b;});
};

function Game() {
	this.gamePoolID;
	
	this.gameStarted = false;
	this.gameover = false;
    
	this.bases = [0,0,0];
	this.scores = {
		'away' : [0,0,0,0,0,0,0,0,0],
		'home' : [0,0,0,0,0,0,0,0,0]
	},
	this.currentInning = 1;
	this.teamOnOffense = 'away';
	this.outs = 0;

	this.homeTeam;
	this.awayTeam;
	
	this.pitcherDeck;
	this.batterDeck;
	
	this.pitcherReady = false;
	
	this.pitcherCard = 0;
	this.batterCard = 0;

    this.pitcherSelections = [];
    this.batterSelections = [];
}

Game.prototype = {
	constructor: Game,
    playBall: function() { //this will only be run once per game
		this.gameStarted = true;
        //displayMessage('', '==========PLAY BALL!==========', this.gamePoolID);
        this.homeTeam.deck.shuffleCards();
        this.awayTeam.deck.shuffleCards();
        this.loadPitcherCards();
        this.loadBatterCards(true);
    },
	loadPitcherCards: function(loadAllOuts) {
		this.pitcherSelections = this.pitcherDeck.pickRandomCards(3);
	},
    loadBatterCards: function(loadAllOuts) {
        if (loadAllOuts) {
            this.batterSelections[0] = this.batterDeck.drawCardsFromTop(5);
            this.batterSelections[1] = this.batterDeck.drawCardsFromTop(5);
            this.batterSelections[2] = this.batterDeck.drawCardsFromTop(5);
        }
        else {
            if (this.outs == 0) {
                this.batterSelections[0] = this.batterDeck.drawCardsFromTop(5);
            }
            else if (this.outs == 1) {
                this.batterSelections[1] = this.batterDeck.drawCardsFromTop(5);
            }
            else if (this.outs == 2) {
                this.batterSelections[2] = this.batterDeck.drawCardsFromTop(5);
            }
        }
    },
	addRuns: function(number) {
		var plural = (number === 1) ? '' : 's';
		displayMessage('event', number + ' run'+plural+' scored', this.gamePoolID);
		this.scores[this.teamOnOffense][this.currentInning-1] += number;
		//check if we are now in inning 9, if so then check if the home score is more than the away, if so the game is over
		var numberOfInnings = this.scores.away.length;
		if (this.currentInning === numberOfInnings && this.teamOnOffense === 'home' && this.scores.home.sum() > this.scores.away.sum()) {
			displayMessage('event', 'Walk off score to win the game!!!', this.gamePoolID);
			this.gameover = true;
		}
	},
	addRunnerToBase : function(base)  {
		this.bases[base-1] = 1;
	},
	removeRunnerFromBase : function(base)  {
		this.bases[base-1] = 0;
	},
	moveRunnersUp : function(placesToMove)  {
		if (typeof placesToMove === 'undefined') { placesToMove = 1; }
		
		var runsScoredOnPlay = 0;

		for (c=0;c<placesToMove;c++) {
			if (this.bases[2] === 1) {
				runsScoredOnPlay++;
			}
			this.bases.pop(); //remove the last element from the array (runner in from third)
			this.bases.unshift(0); //add no runner at first
		}
		if (placesToMove == 4) { //if there was a home run
			runsScoredOnPlay += 1;
		}
		if (runsScoredOnPlay) {
			this.addRuns(runsScoredOnPlay);
		}
	},
	stealBase: function (base) {
		switch (base) {
			case 2:
				this.removeRunnerFromBase(1);
				displayMessage('notice', 'The runner is off from first, trying to steal second...', this.gamePoolID);
				
				var diceRoll = this.rollDice();
				var pitcherHigh = Array.max(diceRoll.pitcher);
				var batterHigh = Array.max(diceRoll.batter);

				if (batterHigh >= pitcherHigh) {
					displayMessage('', 'Pitcher high: '+pitcherHigh+', Runner high: '+batterHigh+' (Runner wins)', this.gamePoolID);
					displayMessage('event', 'Second base was stolen successfully!', this.gamePoolID);
					this.addRunnerToBase(2);
				}
				else {
					displayMessage('', 'Pitcher high: '+pitcherHigh+', Runner high: '+batterHigh+' (Pitcher wins)', this.gamePoolID);
					displayMessage('out', 'Caught stealing second base!', this.gamePoolID);
					this.addOut();
				}
				break;
			case 3:
				this.removeRunnerFromBase(2);
				displayMessage('notice', 'The runner is off from second, trying to steal third...', this.gamePoolID);

				var diceRoll = this.rollDice(true);
				var pitcherHigh = Array.max(diceRoll.pitcher);
				var batterHigh = Array.max(diceRoll.batter);
				
				if (batterHigh >= pitcherHigh) {
					displayMessage('', 'Pitcher high: '+pitcherHigh+', Runner high: '+batterHigh+' (Runner wins)', this.gamePoolID);
					displayMessage('event', 'Third base has been stolen successfully!', this.gamePoolID);
					this.addRunnerToBase(3);
				}
				else {
					displayMessage('', 'Pitcher high: '+pitcherHigh+', Runner high: '+batterHigh+' (Pitcher wins)', this.gamePoolID);
					displayMessage('out', 'Caught stealing third base!', this.gamePoolID);
					this.addOut();
				}
				break;
			case 4:
				this.removeRunnerFromBase(3);
				displayMessage('notice', 'The runner is going to attempt to steal home!', this.gamePoolID);

				var diceRoll = this.rollDice(true);
				var pitcherHigh = Array.max(diceRoll.pitcher);
				var batterHigh = Array.max(diceRoll.batter);
				
				if (batterHigh >= (pitcherHigh+2)) {
					displayMessage('', 'Pitcher high: '+pitcherHigh+', Runner high: '+batterHigh+' (Runner wins)', this.gamePoolID);
					displayMessage('event', 'AND HOME IS STOLEN SUCCESSFULLY!!!', this.gamePoolID);
					this.addRuns(1);
				}
				else {
					displayMessage('', 'Pitcher high: '+pitcherHigh+', Runner high: '+batterHigh+' (Pitcher wins)', this.gamePoolID);
					displayMessage('out', 'Caught trying to steal home.', this.gamePoolID);
					this.addOut();
				}
				break;
			case 5: //double steal is a little less difficult than stealing home, but little more than stealing third
				this.removeRunnerFromBase(1);
				this.removeRunnerFromBase(2);
				displayMessage('notice', 'The double steal try now...', this.gamePoolID);

				var diceRoll = this.rollDice(true);
				var pitcherHigh = Array.max(diceRoll.pitcher);
				var batterHigh = Array.max(diceRoll.batter);

				if (batterHigh >= (pitcherHigh+1)) {
					displayMessage('', 'Pitcher high: '+pitcherHigh+', Runner high: '+batterHigh+' (Runner wins)', this.gamePoolID);
					displayMessage('event', 'The double steal was successful. Both runners move up a base.', this.gamePoolID);
					this.addRunnerToBase(2);
					this.addRunnerToBase(3);
				}
				else {
					displayMessage('', 'Pitcher high: '+pitcherHigh+', Runner high: '+batterHigh+' (Pitcher wins)', this.gamePoolID);
					displayMessage('out', 'The double steal was not successful and the runner is out at third.', this.gamePoolID);
					this.addRunnerToBase(2);
					this.addOut();
				}
				break;
		}
	},
	addOut: function() {
		if (this.outs === 2) {
			this.changeInning();
		}
		else {
			//move all cards from this out selection into the batter's hand
			for (i=0;i<this.batterSelections[this.outs].length;i++) {
				this.batterDeck.addCardToHand(this.batterSelections[this.outs][i]);
			}
			//now clear out the array to make sure there is no duplication of cards
			this.batterSelections[this.outs] = null;
			
			this.outs++;
			var msg = this.outs + ' out';
			if (this.outs > 1) { msg += 's'; }
			displayMessage('notice', msg, this.gamePoolID);
		}
	},
	changeInning: function() {
		//check if the game is over
		var numberOfInnings = this.scores.away.length;
		
        //shuffle all player cards for new inning
        this.homeTeam.deck.shuffleCards();
        this.awayTeam.deck.shuffleCards();

		switch(this.teamOnOffense) {
			case 'away':
				if (this.currentInning === numberOfInnings && this.scores.home.sum() > this.scores.away.sum()) {
					this.gameover = true;
				}
				else {
					sendGameUpdate(this.gamePoolID);
					this.teamOnOffense = 'home';
					this.batterDeck = this.homeTeam.deck;
					this.pitcherDeck = this.awayTeam.deck;
				}
				break;
			case 'home':
				if (this.currentInning == numberOfInnings && this.scores.home.sum() == this.scores.away.sum()) {
					//the game is tied. lets add another inning to the game
					this.scores.away.push(0);
					this.scores.home.push(0);
					numberOfInnings++;
				}
				
				if (this.currentInning < numberOfInnings) {
					sendGameUpdate(this.gamePoolID);
					this.currentInning++;
					this.teamOnOffense = 'away';
					this.batterDeck = this.awayTeam.deck;
					this.pitcherDeck = this.homeTeam.deck;
				}
				else {
					this.gameover = true;
				}
				break;
		}
		
		//now, after all that, if the game is over we do not clear and switch sockets etc
		if (this.gameover == false) {
			//displayMessage('notice', 'The side is retired.', this.gamePoolID);
			//displayMessage('notice', '===CHANGE INNING===', this.gamePoolID);
			this.outs = 0;
			this.clearBases();
			this.pitcherCard = 0;
			this.batterCard = 0;

			this.loadPitcherCards(); //get 3 cards for the pitcher to select from
			this.loadBatterCards(true);
			switchSockets(this.gamePoolID);
		}
		else {
			sendGameUpdate(this.gamePoolID); //send this to alert the game over
		}
	},
	clearBases: function() {
		this.bases = [0,0,0];
	},
	rollDice: function (extraPitcherDice, extraBatterDice) {
		displayMessage('', 'Rolling dice to determine outcome...', this.gamePoolID);
		if (typeof extraPitcherDice === 'undefined') { extraPitcherDice = false; }
		if (typeof extraBatterDice === 'undefined') { extraBatterDice = false; }

		var results = {
			'pitcher' : [randomIntBetween(1, 6)],
			'batter' : [randomIntBetween(1, 6)]
		};

		if (extraPitcherDice) {
			results.pitcher.push(randomIntBetween(1, 6));
		}

		if (extraBatterDice) {
			results.batter.push(randomIntBetween(1, 6));
		}
		return results;
	},
	resultPlay: function(index) { //index is used to determine which batter card was selected (maybe need to change this to include pitcher at some point...)
		var playDifference = this.pitcherCard.value - this.batterCard.value; //if <= 0 then batter wins duel

		//move the batter's card back into the hand (the pitchers is moved from their selections in the server level 
		var selectedCard = this.batterSelections[this.outs].splice(index, 1)[0];
		this.batterDeck.addCardToHand(selectedCard);
		//also, need to remove this from the drawncards pile, otherwise we could end up with too many cards...
		//loop through all cards in the hand and check if they match the value and suit of the selected card, if it does, remove it from the array and break the loop
		for (i=0; i<=this.batterDeck.drawnCards.length; i++) {
			drawnCard = this.batterDeck.drawnCards[i];
			if (drawnCard === selectedCard) {
				this.batterDeck.drawnCards.splice(i, 1);
				break;
			}
		}
		
		//playDifference = -3; USE FOR TESTING
		
		if (playDifference < 0) { //base hit
			displayMessage('', 'Pitcher: ' + this.pitcherCard.value + ', Batter: ' + this.batterCard.value + ' (Batter wins)', this.gamePoolID);
			
			if (!this.batterSelections[this.outs].length) {
				displayMessage('notice', 'Replenishing batter cards...', this.gamePoolID);
				this.loadBatterCards(false); //only load the batter card array being replenished
			}
			
			playDifference = Math.abs(playDifference); //get the absolute value to decide outcome
			if (playDifference > 10) { // 11, 12, 13
				displayMessage('hit', 'Around to third on the triple.', this.gamePoolID);
				this.moveRunnersUp(3);
				this.addRunnerToBase(3);
				return 'triple';
			}
			else if (playDifference > 6) { // 7, 8, 9, 10
				displayMessage('hit', 'Safely into second for a double.', this.gamePoolID);
				this.moveRunnersUp(2);
				this.addRunnerToBase(2);
				return 'double';
			}
			else if (playDifference > 2) { // 3, 4, 5, 6
				displayMessage('hit', 'Hit into play and gets a single.', this.gamePoolID);
				this.moveRunnersUp();
				this.addRunnerToBase(1);
				return 'single';
			}
			displayMessage('event', 'The batter walks to first base thanks to 4 pitches outside the zone.', this.gamePoolID);
			//check if there is a runner on first, if so move them onto second then move this guy onto first
			if (this.bases[0] === 1) {
				//also check if runner on second, and move to third
				if (this.bases[1] === 1) {
					//also check if runner on third, and move home and score
					if (this.bases[2] === 1) {
						displayMessage('event', 'The pitcher walks in a run to score from third.', this.gamePoolID);
						this.removeRunnerFromBase(3);
						this.addRuns(1);
					}
					this.removeRunnerFromBase(2);
					this.addRunnerToBase(3);
				}
				this.removeRunnerFromBase(1);
				this.addRunnerToBase(2);
			}
			this.addRunnerToBase(1);
			return 'walk'; // 1, 2
		}
		else if(playDifference === 0) { //home run
			displayMessage('', 'Pitcher: ' + this.pitcherCard.value + ', Batter: ' + this.batterCard.value + ' (Batter wins)', this.gamePoolID);
			displayMessage('notice', 'That ball is deep... the defender is running back towards the wall...', this.gamePoolID);
			//roll a dice to see if the defence robs it at the wall
			var diceRoll = this.rollDice(false, true);
			var pitcherHigh = Array.max(diceRoll.pitcher);
			var batterHigh = Array.max(diceRoll.batter);

			if (pitcherHigh >= batterHigh) {
				displayMessage('', 'Pitcher high: '+pitcherHigh+', Batter high: '+batterHigh+' (Pitcher wins)', this.gamePoolID);
				displayMessage('out', 'AND THE BALL IS CAUGHT! Robbed of a home run!', this.gamePoolID);
				this.addOut();
				return 'out - robbed home run';
			}
			else {
				displayMessage('', 'Pitcher high: '+pitcherHigh+', Batter high: '+batterHigh+' (Batter wins)', this.gamePoolID);
				displayMessage('hit', 'And it\'s a home run!', this.gamePoolID);
				
				//move the card back into the hand
				//this.batterDeck.addCardToHand(this.batterSelections[this.outs].splice(index, 1)[0]);
				
				this.moveRunnersUp(4);
				//this.addRuns(1); //this run is now added on the move runners up to add up the runs scored correctly - otehrwise end up with 2 messages saying how many scored (2 runs scored, 1 run scored)
				return 'home run';
			}
		}
		else { //pitcher wins
			displayMessage('', 'Pitcher: ' + this.pitcherCard.value + ', Batter: ' + this.batterCard.value + ' (Pitcher wins)', this.gamePoolID);			
			if (playDifference > 8) {
				displayMessage('out', 'A long fly ball into the outfield.', this.gamePoolID);
				this.addOut();
				//if there is a runner on third then they will run in to score
				if (this.bases[2] === 1) {
					this.removeRunnerFromBase(3);
					this.addRuns(1);
					displayMessage('event', 'They get the runner in thanks to a sacrifice fly!', this.gamePoolID);
					return 'Sacrifice fly ball';
				}
				return 'fly ball'; // 9, 10, 11, 12, 13
			}
			else if (playDifference > 3) { // 4, 5, 6, 7, 8
				//now check that there is more than 1 out left to go and see if there is a runner on first base, if so then roll the dice to see if you get a double play
				if (this.outs < 2 && this.bases[0] === 1) {
					displayMessage('notice', 'It\'s a ground ball. Attempting the double play...', this.gamePoolID);
					this.addOut();
					
					//now we need to check if there was a runner on second, if so then they will move to third
					if (this.bases[1] === 1) {
						this.removeRunnerFromBase(2);
						this.addRunnerToBase(3);
					}

					//double play attempt
					var diceRoll = this.rollDice();
					var pitcherHigh = Array.max(diceRoll.pitcher);
					var batterHigh = Array.max(diceRoll.batter);

					if (pitcherHigh >= batterHigh) {
						displayMessage('', 'Defence high: '+pitcherHigh+', Batter high: '+batterHigh+' (Defence wins)', this.gamePoolID);
						displayMessage('out', 'A smooth double play to retire both runners.', this.gamePoolID);
						this.addOut();
						this.removeRunnerFromBase(1);
						return 'ground ball double play';
					}
					else {
						displayMessage('', 'Defence high: '+pitcherHigh+', Batter high: '+batterHigh+' (Batter wins)', this.gamePoolID);
						displayMessage('out', 'There\'s no play at first, so they only get the one.', this.gamePoolID);
						return 'ground ball - feilders choice';
					}
				}
				displayMessage('out', 'Out from a ground ball.', this.gamePoolID);
				this.addOut();
				return 'ground ball';
			}
			displayMessage('out', 'Strikes him out.', this.gamePoolID);
			this.addOut();
			return 'strikeout'; // 1, 2, 3
		}
	}
};

//export for use in nodeJS
module.exports = Game;