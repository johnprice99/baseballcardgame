<?php

namespace JP\AjaxBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Sensio\Bundle\FrameworkExtraBundle\Configuration\Route;

/**
 * @Route("/ajax")
 */
class DefaultController extends Controller {

    /**
     * @Route("/getCards")
     */
    public function getCards() {
        echo 'ajax getCards()';
        die();
    }
}
