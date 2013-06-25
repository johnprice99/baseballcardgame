var PlayingCard = require('./PlayingCard.js');

function Deck(perSuit, suits) {
    this.cardsInHand = []; //used to represent the deck of cards left in a user's hand
    this.drawnCards = [];
    
    for (i=0; i<suits.length; i++) { //for each suit
        for (j=1; j<=perSuit; j++) {
            //create a new card
            this.addCardToHand(new PlayingCard(j, suits[i]));
        }
    }
}

Deck.prototype = {
    constructor: Deck,
    addCardToHand: function(card) {
        this.cardsInHand.push(card);
    },
    getAllCards: function() {
        return this.cardsInHand.concat(this.drawnCards)
    },
    shuffleCards: function() {
        //merges both cards together again and shuffles them in hand
        this.cardsInHand = this.getAllCards();
        this.drawnCards = [];
        
        var counter = this.cardsInHand.length, temp, index;
        // While there are elements in the array
        while (counter > 0) {
            // Pick a random index
            index = (Math.random() * counter--) | 0;

            // And swap the last element with it
            temp = this.cardsInHand[counter];
            this.cardsInHand[counter] = this.cardsInHand[index];
            this.cardsInHand[index] = temp;
        }
    },
    drawCardsFromTop: function(numberOfCards) {
        var drawnThisTurn = [];
        
        //if trying to pick more cards than exist, just return all cards
        if (numberOfCards >= this.cardsInHand.length) {
            drawnThisTurn = this.cardsInHand;
            this.cardsInHand = [];
            this.drawnCards = this.drawnCards.concat(drawnThisTurn);
            return drawnThisTurn;
        }
        
        drawnThisTurn = this.cardsInHand.slice(0, numberOfCards);
        this.cardsInHand = this.cardsInHand.splice(numberOfCards, this.cardsInHand.length-numberOfCards); //remove the cards from the hand pack
        this.drawnCards = this.drawnCards.concat(drawnThisTurn);
        return drawnThisTurn;
    },
    pickRandomCards: function(numberOfCards) {
        var drawnThisTurn = [];
        console.log(numberOfCards);
        
        //if trying to pick more cards than exist, just return all cards
        if (numberOfCards >= this.cardsInHand.length) {
            drawnThisTurn = this.cardsInHand;
            this.cardsInHand = [];
            this.drawnCards = this.drawnCards.concat(drawnThisTurn);
            return drawnThisTurn;
        }
        
        randomCards = [];
        for(i=1;i<=numberOfCards;i++) {
            var randomKey = Math.floor(Math.random()*this.cardsInHand.length);
            randomCards.push(this.cardsInHand[randomKey]);
            this.cardsInHand.splice(randomKey,1);
        }
        this.drawnCards = this.drawnCards.concat(randomCards);
        return randomCards;
    }
};

//export for use in nodeJS
module.exports = Deck