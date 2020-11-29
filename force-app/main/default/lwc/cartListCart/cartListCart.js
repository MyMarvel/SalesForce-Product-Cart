import { LightningElement, wire, track } from 'lwc';
import { subscribe, MessageContext } from 'lightning/messageService';
import PRODUCTS_FILTERED_MESSAGE from '@salesforce/messageChannel/FilterProductCart__c';
import PRODUCT_CART_CHANGED_MESSAGE from '@salesforce/messageChannel/ProductCartChanged__c';
// My custom Apex controllers
import getProducts from '@salesforce/apex/ProductController.getProducts';
import getCartProducts from '@salesforce/apex/OpportunityProductCartController.getCartProducts';

export default class CartListCart extends LightningElement {
    // We need a private _filters array to store all current filters from the page, because it is the only way to know
    // which filters we have to apply when a user clicks on 'Apply filters from Left Column' checkbox.
    _filters = { searchKey: '', types: [], families: [], productIDs: [], restrictToProductIDs: true };
    @track appliedFilters = { searchKey: '', types: [], families: [], productIDs: [], restrictToProductIDs: true };
    applyProductFilters = false;

    @wire(getProducts, {filters: '$appliedFilters'})
    cartProducts;

    @wire(MessageContext) messageContext;

    productFilterSubscription;
    cartProductsSubscription;

    connectedCallback() {
        // Subscribe to ProductsFiltered message
        this.productFilterSubscription = subscribe(
            this.messageContext,
            PRODUCTS_FILTERED_MESSAGE,
            (message) => this.handleFilterChangeMessage(message)
        );
        // Get initial value of products in the Cart (in case a user closed the browser and
        // then want to get back to his incomplete cart to continue his 'shopping')
        // TODO: call apex class for it
        this._filters.productIDs = [];
        // Apply them immidiately
        this.appliedFilters.productIDs = this._filters.productIDs;
        // Subscribe to events when a user adds or deletes products from his cart
        this.cartProductsSubscription = subscribe(
            this.messageContext,
            PRODUCT_CART_CHANGED_MESSAGE,
            (message) => this.handleProductCartChangedMessage(message)
        );
    }

    handleFilterChangeMessage(message) {
        // See cartListProducts.js, handleFilterChangeMessage() function for more details
        let tmp = {
            searchKey: this._filters.searchKey,
            types: this._filters.types,
            families: this._filters.families,
            restrictToProductIDs: true,
            productIDs: this._filters.productIDs
        };
        tmp[message.filtersGroupName] = message.filters;
        this._filters = tmp;
        console.log(JSON.stringify(this._filters));
        if (this.applyProductFilters) {
            this.appliedFilters = this._filters;
        }
    }

    handleApplyProductFiltersChange() {
        this.applyProductFilters = !this.applyProductFilters;
        if (this.applyProductFilters) {
            this.appliedFilters = this._filters;
        }
        else {
            // Reset the applied filters and leave only products from the user's cart
            this.appliedFilters = {
                restrictToProductIDs: true,
                productIDs: this._filters.productIDs
            };
        }
    }

    handleProductCartChangedMessage(message) {
        if (message.action == 'add') {
            for(let i=0; i<message.productIDs.length; i++) {
                this._filters.productIDs.push(message.productIDs[i]);
            }
            // Apply them immidiately
            this.appliedFilters.productIDs = this._filters.productIDs;
            // Call apex class to actually add it to the database
        }
        else if (message.action == 'delete') {

        }
        else if (message.action == 'deleteall') {

        }
        else {
            console.log('ERROR: wrong message action, could by only (add, delete, deleteall): ' + message.action);
        }
    }
}