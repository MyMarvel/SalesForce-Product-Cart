import { LightningElement, api } from 'lwc';

export default class CartAccordeonBody extends LightningElement {
    countPorductsInCart = 0;

    // Product Cart ID
    @api recordId;

    get cartAccordeonLabel() {
        return 'Your Cart (' + this.countPorductsInCart + ')';
    }

    handleCartUpdate(event) {
        this.countPorductsInCart = event.detail;
    }
}