/* Playing card Object */

function PlayingCard(value, suit) {
    this.value = value;
    this.suit = suit;
}

PlayingCard.prototype = {
    constructor: PlayingCard,
    getFaceValue: function() {
        switch (this.value) {
            case 1:
                return 'A';
                break;
            case 11:
                return 'J';
                break;
            case 12:
                return 'Q';
                break;
            case 13:
                return 'K';
                break;
            default:
                return this.value;
        }
    }
};

//export for use in nodeJS
module.exports = PlayingCard