import { LightningElement } from 'lwc';

export default class CartAccordeonBody extends LightningElement {
    countPorductsInCart = 0;

    get cartAccordeonLabel() {
        return 'Your Cart (' + this.countPorductsInCart + ')';
    }

    handleCartUpdate(event) {
        this.countPorductsInCart = event.detail;
    }
}