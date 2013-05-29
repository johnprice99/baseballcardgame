<?php

//No mutator methods, as once a card is created, it cannot be changed

namespace JP\PlayingCardBundle\Entity;

class PlayingCard {
	
	protected $value;
	protected $suit;

	public function __construct($value, $suit) {
		$this->value = $value;
        $this->suit = $suit;
	}
	
	public function getValue() {
		return $this->value;
	}
    
    /*
     * Returns the card face value (so if 1 => A, 11 = J etc)
     */
    public function getFaceValue() {
        switch ($this->value) {
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
                return $this->value;
        }
    }
    
	public function getSuit() {
		return $this->suit;
	}
}
