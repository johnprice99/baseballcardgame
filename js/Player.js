var Deck = require('./Deck.js');

function Player(location, name) {
	this.location = location;
	this.name = name;
	//this.color = 'red' <-- allow colour of deck changing eventually along with name
	this.deck = new Deck(13, ['Clubs', 'Diamonds', 'Hearts', 'Spades']);
}

Player.prototype = {
    constructor: Player
};

//export for use in nodeJS
module.exports = Player;