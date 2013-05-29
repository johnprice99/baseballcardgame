<?php

namespace JP\BaseballCardBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Sensio\Bundle\FrameworkExtraBundle\Configuration\Route;
use Sensio\Bundle\FrameworkExtraBundle\Configuration\Template;

use JP\PlayingCardBundle\Entity\Deck;

class DefaultController extends Controller {
    
    private function orderCardsByValueDesc($a, $b) {
        if ($a->getValue() == $b->getValue()) {
            return 0;
        }
        return ($a->getValue() > $b->getValue()) ? -1 : 1;
    }
    
    /**
     * @Route("/")
     * @Template()
     */
    public function indexAction() {
        $cardsPerSuit = 13;
        
        $pitcherDeck = new Deck($cardsPerSuit, array('Clubs', 'Diamonds', 'Hearts', 'Spades'));
        $pitcherDeck->shuffleCards();
        
        //print_r($pitcherDeck->getCardsInHand());
        $pitcherSelectedCards = $pitcherDeck->pickRandomCards(3, true, 'desc');
        usort($pitcherSelectedCards, array("JP\BaseballCardBundle\Controller\DefaultController", "orderCardsByValueDesc"));
        
        $batterDeck = new Deck($cardsPerSuit, array('Clubs', 'Diamonds', 'Hearts', 'Spades'));
        $batterDeck->shuffleCards();
        $batterSelectedCards = array(
            $batterDeck->drawCardsFromTop(5),
            $batterDeck->drawCardsFromTop(5),
            $batterDeck->drawCardsFromTop(5)
        );
        /*
        print_r($batterDeck->getCardsInHand());
        
        print_r($batterOut1Cards);
        print_r($batterOut2Cards);
        print_r($batterOut3Cards);
        print_r($batterDeck->getCardsInHand());
        die();
        $batterDeck->shuffleCards();
        print_r($batterDeck->getCardsInHand());
        die();
        
        
        print_r($batterDeck->getCards());
        die();*/
        
        return array(
            'pitcherDeck' => $pitcherDeck,
            'pitcherSelectedCards' => $pitcherSelectedCards,
            'batterDeck' => $batterDeck,
            'batterSelectedCards' => $batterSelectedCards,
        );
    }
}
