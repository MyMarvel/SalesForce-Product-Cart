import { LightningElement, api } from 'lwc';

export default class CartProductTile extends LightningElement {
    @api product;

    handleOpenRecordClick() {
        const selectEvent = new CustomEvent('productview', {
            detail: this.product.Id
        });
        this.dispatchEvent(selectEvent);
    }
}