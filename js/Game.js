/* Game Object */

function Game() {
	this.bases = [0,0,0];
	this.scores = {
		'away' : [0,0,0,0,0,0,0,0,0],
		'home' : [0,0,0,0,0,0,0,0,0]
	},
	this.currentInning = 1;
	this.teamOnOffense = 'away';
	this.outs = 0;
	this.pitcherCardValue = 0;
	this.batterCardValue = 0;

	this.gameover = false;
}

Game.prototype = {
	constructor: Game,
	addRuns: function(number) {
		var plural = (number === 1) ? '' : 's';
		displayMessage('event', number + ' run'+plural+' scored');
		this.scores[this.teamOnOffense][this.currentInning-1] += number;
		//check if we are now in inning 9, if so then check if the home score is more than the away, if so the game is over
		var numberOfInnings = this.scores.away.length;
		if (this.currentInning === numberOfInnings && this.teamOnOffense === 'home' && this.scores.home.sum() > this.scores.away.sum()) {
			displayMessage('event', 'Walk off score to win the game!!!');
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

		for (c=0;c<placesToMove;c++) {
			if (this.bases[2] === 1) {
				this.addRuns(1);
			}
			this.bases.pop(); //remove the last element from the array (runner in from third)
			this.bases.unshift(0); //add no runner at first
		}
	},
	stealBase: function (base) {
		switch (base) {
			case 2:
				this.removeRunnerFromBase(1);
				displayMessage('notice', 'The runner is off from first, trying to steal second...');
				
				var diceRoll = this.rollDice();
				var pitcherHigh = Array.max(diceRoll.pitcher);
				var batterHigh = Array.max(diceRoll.batter);

				if (batterHigh >= pitcherHigh) {
					displayMessage('', 'Pitcher high: '+pitcherHigh+', Runner high: '+batterHigh+' (Runner wins)');
					displayMessage('event', 'Second base was stolen successfully!');
					this.addRunnerToBase(2);
				}
				else {
					displayMessage('', 'Pitcher high: '+pitcherHigh+', Runner high: '+batterHigh+' (Pitcher wins)');
					displayMessage('out', 'Caught stealing second base!');
					this.addOut();
				}
				break;
			case 3:
				this.removeRunnerFromBase(2);
				displayMessage('notice', 'The runner is off from second, trying to steal third...');

				var diceRoll = this.rollDice(true);
				var pitcherHigh = Array.max(diceRoll.pitcher);
				var batterHigh = Array.max(diceRoll.batter);
				
				if (batterHigh >= pitcherHigh) {
					displayMessage('', 'Pitcher high: '+pitcherHigh+', Runner high: '+batterHigh+' (Runner wins)');
					displayMessage('event', 'Third base has been stolen successfully!');
					this.addRunnerToBase(3);
				}
				else {
					displayMessage('', 'Pitcher high: '+pitcherHigh+', Runner high: '+batterHigh+' (Pitcher wins)');
					displayMessage('out', 'Caught stealing third base!');
					this.addOut();
				}
				break;
			case 4:
				this.removeRunnerFromBase(3);
				displayMessage('notice', 'The runner is going to attempt to steal home!');

				var diceRoll = this.rollDice(true);
				var pitcherHigh = Array.max(diceRoll.pitcher);
				var batterHigh = Array.max(diceRoll.batter);
				
				if (batterHigh >= (pitcherHigh+2)) {
					displayMessage('', 'Pitcher high: '+pitcherHigh+', Runner high: '+batterHigh+' (Runner wins)');
					displayMessage('event', 'AND HOME IS STOLEN SUCCESSFULLY!!!');
					this.addRuns(1);
				}
				else {
					displayMessage('', 'Pitcher high: '+pitcherHigh+', Runner high: '+batterHigh+' (Pitcher wins)');
					displayMessage('out', 'Caught trying to steal home.');
					this.addOut();
				}
				break;
			case 5: //double steal is a little less difficult than stealing home, but little more than stealing third
				this.removeRunnerFromBase(1);
				this.removeRunnerFromBase(2);
				displayMessage('notice', 'The double steal try now...');

				var diceRoll = this.rollDice(true);
				var pitcherHigh = Array.max(diceRoll.pitcher);
				var batterHigh = Array.max(diceRoll.batter);

				if (batterHigh >= (pitcherHigh+1)) {
					displayMessage('', 'Pitcher high: '+pitcherHigh+', Runner high: '+batterHigh+' (Runner wins)');
					displayMessage('event', 'The double steal was successful. Both runners move up a base.');
					this.addRunnerToBase(2);
					this.addRunnerToBase(3);
				}
				else {
					displayMessage('', 'Pitcher high: '+pitcherHigh+', Runner high: '+batterHigh+' (Pitcher wins)');
					displayMessage('out', 'The double steal was not successful and the runner is out at third.');
					this.addRunnerToBase(2);
					this.addOut();
				}
				break;
		}
	},
	addOut: function() {
		if (this.outs === 2) {
			this.changeInning();
			displayMessage('notice', 'The side is retired.');
		}
		else {
			this.outs++;
			var msg = this.outs + ' out';
			if (this.outs > 1) { msg += 's'; }
			displayMessage('notice', msg);
		}
	},
	changeInning: function() {
		//check if the game is over
		var numberOfInnings = this.scores.away.length;

		switch(this.teamOnOffense) {
			case 'away':
				if (this.currentInning === numberOfInnings && this.scores.home.sum() > this.scores.away.sum()) {
					this.gameover = true;
				}
				else {
					this.teamOnOffense = 'home';
				}
				break;
			case 'home':
				if (this.currentInning < numberOfInnings) {
					this.currentInning++;
					this.teamOnOffense = 'away';
				}
				else {
					this.gameover = true;
				}
				break;
		}
		this.outs = 0;
		this.clearBases();
		this.pitcherCardValue = 0;
		this.batterCardValue = 0;
		setupNextInning();
	},
	getBases: function() {
		return this.bases;
	},
	clearBases: function() {
		this.bases = [0,0,0];
	},
	rollDice: function (extraPitcherDice, extraBatterDice) {
		displayMessage('', 'Rolling dice to determine outcome...');
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
	resultPlay: function() {
		var playDifference = this.pitcherCardValue - this.batterCardValue; //if <= 0 then batter wins duel

		if (playDifference < 0) { //base hit
			displayMessage('', 'Pitcher: ' + this.pitcherCardValue + ', Batter: ' + this.batterCardValue + ' (Batter wins)');
			playDifference = Math.abs(playDifference); //get the absolute value to decide outcome
			if (playDifference > 10) { // 11, 12, 13
				displayMessage('hit', 'Around to third on the triple.');
				this.moveRunnersUp(3);
				this.addRunnerToBase(3);
				return 'triple';
			}
			else if (playDifference > 6) { // 7, 8, 9, 10
				displayMessage('hit', 'Safely into second for a double.');
				this.moveRunnersUp(2);
				this.addRunnerToBase(2);
				return 'double';
			}
			else if (playDifference > 2) { // 3, 4, 5, 6
				displayMessage('hit', 'Hit into play and gets a single.');
				this.moveRunnersUp();
				this.addRunnerToBase(1);
				return 'single';
			}
			displayMessage('event', 'The batter walks to first base thanks to 4 pitches outside the zone.');
			//check if there is a runner on first, if so move them onto second then move this guy onto first
			if (this.bases[0] === 1) {
				//also check if runner on second, and move to third
				if (this.bases[1] === 1) {
					//also check if runner on third, and move home and score
					if (this.bases[2] === 1) {
						displayMessage('event', 'The pitcher walks in a run to score from third.');
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
			displayMessage('', 'Pitcher: ' + this.pitcherCardValue + ', Batter: ' + this.batterCardValue + ' (Batter wins)');
			displayMessage('notice', 'That ball is deep... the defender is running back towards the wall...');
			//roll a dice to see if the defence robs it at the wall
			var diceRoll = this.rollDice(false, true);
			var pitcherHigh = Array.max(diceRoll.pitcher);
			var batterHigh = Array.max(diceRoll.batter);

			if (pitcherHigh >= batterHigh) {
				displayMessage('', 'Pitcher high: '+pitcherHigh+', Batter high: '+batterHigh+' (Pitcher wins)');
				displayMessage('out', 'AND THE BALL IS CAUGHT! Robbed of a home run!');
				this.addOut();
				return 'out - robbed home run';
			}
			else {
				displayMessage('', 'Pitcher high: '+pitcherHigh+', Batter high: '+batterHigh+' (Batter wins)');
				displayMessage('hit', 'And it\'s a home run!');
				this.moveRunnersUp(4);
				this.addRuns(1);
				return 'home run';
			}
		}
		else { //pitcher wins
			displayMessage('', 'Pitcher: ' + this.pitcherCardValue + ', Batter: ' + this.batterCardValue + ' (Pitcher wins)');
			if (playDifference > 8) {
				displayMessage('out', 'A long fly ball into the outfield.');
				this.addOut();
				//if there is a runner on third then they will run in to score
				if (this.bases[2] === 1) {
					this.removeRunnerFromBase(3);
					this.addRuns(1);
					displayMessage('event', 'They get the runner in thanks to a sacrifice fly!');
					return 'Sacrifice fly ball';
				}
				return 'fly ball'; // 9, 10, 11, 12, 13
			}
			else if (playDifference > 3) { // 4, 5, 6, 7, 8
				displayMessage('out', 'Out from a ground ball.');
				this.addOut();
				//now check that there is more than 1 out left to go and see if there is a runner on first base, if so then roll the dice to see if you get a double play
				if (this.outs >= 1 && this.bases[0] === 1) {
					displayMessage('notice', 'It\'s a ground ball. Attempting the double play...');
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
						displayMessage('', 'Defence high: '+pitcherHigh+', Batter high: '+batterHigh+' (Defence wins)');
						displayMessage('out', 'A smooth double play to retire both runners.');
						this.addOut();
						this.removeRunnerFromBase(1);
						return 'ground ball double play';
					}
					else {
						displayMessage('', 'Defence high: '+pitcherHigh+', Batter high: '+batterHigh+' (Batter wins)');
						displayMessage('out', 'There\'s no play at first, so they only get the one.');
						return 'ground ball - feilders choice';
					}
				}
				return 'ground ball';
			}
			displayMessage('out', 'Strikes him out.');
			this.addOut();
			return 'strikeout'; // 1, 2, 3
		}
	}
};