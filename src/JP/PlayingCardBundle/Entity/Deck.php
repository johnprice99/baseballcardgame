<?php

namespace JP\PlayingCardBundle\Entity;

use JP\PlayingCardBundle\Entity\PlayingCard;

class Deck {
	
    protected $cardsInHand; //used to represent the deck of cards left in a user's hand
    private $drawnCards; //used to hold card that have been drawn (to simulate creating piles of cards). When shuffling, all cards from here are added back into the deck.
    
    // When you create a new deck, you need to create the cards too
    public function __construct($perSuit = 13, $suits = array('Clubs', 'Diamonds', 'Hearts', 'Spades')) {
        $this->drawnCards = array();
        
        foreach ($suits as $suit) {
            for ($i=1; $i <= $perSuit; $i++) {
                //create a new card
                $this->addCardToHand(new PlayingCard($i, $suit));
            }
        }
    }
	
	public function addCardToHand($card) {
        $this->cardsInHand[] = $card;
	}
    
	public function getCardsInHand() {
		return $this->cardsInHand;
	}
    
    //Get all cards in the deck, whether they are in hand or not
    public function getAllCards() {
        return array_merge($this->cardsInHand, $this->drawnCards);
    }
    
    public function shuffleCards() {
        //merges both cards together again and shuffles them in hand
        $this->cardsInHand = $this->getAllCards();
        $this->drawnCards = array();
        shuffle($this->cardsInHand);
    }
    
    public function pickRandomCards($numberOfCards) {
        //if trying to pick more cards than exist, just return all cards
        if ($numberOfCards > count($this->cardsInHand)) {
            $drawnThisTurn = $this->cardsInHand;
            $this->cardsInHand = array();
            $this->drawnCards = array_merge($this->drawnCards, $drawnThisTurn);
            return $drawnThisTurn;
        }
        
        $randomCards = array();
        $randomKeys = array_rand($this->cardsInHand, $numberOfCards);

        if ($numberOfCards > 1) {
            foreach ($randomKeys as $key) {
                $randomCards[] = $this->cardsInHand[$key];
                //remove card from hand array
                unset($this->cardsInHand[$key]);
            }
        }
        else {
            $randomCards[] = $this->cardsInHand[$randomKeys];
            //remove card from hand array
            unset($this->cardsInHand[$key]);
        }
        $this->drawnCards = array_merge($this->drawnCards, $randomCards);
        
        return $randomCards;
    }
    
    public function drawCardsFromTop($numberOfCards) {
        //if trying to pick more cards than exist, just return all cards
        if ($numberOfCards > count($this->cardsInHand)) {
            $drawnThisTurn = $this->cardsInHand;
            $this->cardsInHand = array();
            $this->drawnCards = array_merge($this->drawnCards, $drawnThisTurn);
            return $drawnThisTurn;
        }
        
        $drawnThisTurn = array_slice($this->cardsInHand, 0, $numberOfCards);
        $this->cardsInHand = array_splice($this->cardsInHand, $numberOfCards); //remove the cards from the hand pack
        $this->drawnCards = array_merge($this->drawnCards, $drawnThisTurn);
        return $drawnThisTurn;
    }
}
