import { NavigationMixin } from 'lightning/navigation';
import { LightningElement, wire, track } from 'lwc';
// My custom Apex controller
import getProducts from '@salesforce/apex/ProductController.getProducts';
// Ligthning Message Service and a message channel
import { subscribe, MessageContext } from 'lightning/messageService';
import PRODUCTS_FILTERED_MESSAGE from '@salesforce/messageChannel/FilterProductCart__c';

export default class CartListProducts extends NavigationMixin(LightningElement) {
    searchTerm = '';
    hasResults = true;
    pageNumber = 1;
    @track filters = { searchKey: '', types: [], families: [] };

    @wire(getProducts, {filters: '$filters', pageNumber: '$pageNumber'})
    products;

    @wire(MessageContext) messageContext;

    productFilterSubscription;

    connectedCallback() {
        // Subscribe to ProductsFiltered message
        this.productFilterSubscription = subscribe(
            this.messageContext,
            PRODUCTS_FILTERED_MESSAGE,
            (message) => this.handleFilterChange(message)
        );
    }

    handleFilterChange(message) {
        // TODO: This doesn't trigger the Apex class update, dont know why, I did use @track as described in the documentation 
        // https://developer.salesforce.com/docs/component-library/documentation/en/lwc/lwc.reactivity_fields
        // this.filters[message.filtersGroupName] = message.filters;
        // Even this doesn't work
        // this.filters.searchKey = Math.random();
        // This is the only way I managed to trigger my Apex class execution:
        let tmp = { searchKey: this.filters.searchKey,  types: this.filters.types, families: this.filters.families };
        tmp[message.filtersGroupName] = message.filters;
        this.filters = tmp;
        //alert(JSON.stringify(this.filters));
        this.pageNumber = 1;
    }

	handleProductView(event) {
		// Get product record id from productview event
		const productId = event.detail;
		// Navigate to product record page
		this[NavigationMixin.Navigate]({
			type: 'standard__recordPage',
			attributes: {
				recordId: productId,
				objectApiName: 'Product2',
				actionName: 'view',
			},
		});
	}
}