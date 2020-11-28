import { NavigationMixin } from 'lightning/navigation';
import { LightningElement, api } from 'lwc';

export default class CartProductTile extends NavigationMixin(LightningElement) {
    @api product;

    handleOpenRecordClick() {
		this[NavigationMixin.Navigate]({
			type: 'standard__recordPage',
			attributes: {
				recordId: this.product.Id,
				objectApiName: 'Product2',
				actionName: 'view',
			},
		});
    }

    handleAddToCartClick() {
        alert('okay :(');
    }
}