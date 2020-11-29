import { NavigationMixin } from 'lightning/navigation';
import { LightningElement, api, wire } from 'lwc';
import { publish, MessageContext } from 'lightning/messageService';
import PRODUCT_CART_CHANGED_MESSAGE from '@salesforce/messageChannel/ProductCartChanged__c';

export default class CartProductTile extends NavigationMixin(LightningElement) {
	@api product;
	
	@wire(MessageContext) messageContext;

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
		publish(this.messageContext, PRODUCT_CART_CHANGED_MESSAGE, {
			action: 'add',
			productIDs: [this.product.Id],
		});
    }
}