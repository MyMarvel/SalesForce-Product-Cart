import { LightningElement, wire, track } from 'lwc';
import { subscribe, publish, MessageContext } from 'lightning/messageService';
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
    pageNumber = 1;

    set setAppliedFilters(val) {
        this.appliedFilters = val;
        // Creates the event with the data.
        let myEvent = new CustomEvent("cartupdate", {
            detail: this.appliedFilters.productIDs.length
        });
        this.dispatchEvent(myEvent);
    }

    // My main variable - cartProducts
    @wire(getProducts, {filters: '$appliedFilters', pageNumber: '$pageNumber'})
    cartProducts;

    // Subscription
    @wire(MessageContext) messageContext;
    productFilterSubscription;
    cartProductsSubscription;

    // Confirmation dialog
    @track isDialogVisible = false;
    activeConfirmation;
    confirmationMessage;

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
        this._applyFilters(this.applyProductFilters, message.filtersGroupName, message.filters);
    }

    handleApplyProductFiltersChange() {
        this.applyProductFilters = !this.applyProductFilters;
        if (this.applyProductFilters) {
            this.setAppliedFilters = this._filters;
        }
        else {
            // Reset the applied filters and leave only products from the user's cart
            this.setAppliedFilters = {
                restrictToProductIDs: true,
                productIDs: this._filters.productIDs
            };
        }
    }

    handleProductCartChangedMessage(message) {
        if (message.action == 'add') {
            for(let i=0; i<message.productIDs.length; i++) {
                let productID = message.productIDs[i];
                if(this._filters.productIDs.indexOf(productID) === -1) {
                    this._filters.productIDs.push(productID);
                }
            }
            // Call apex class to actually add it to the database
        }
        else if (message.action == 'delete') {
            for(let i=0; i<message.productIDs.length; i++) {
                this._filters.productIDs = this._filters.productIDs.filter(function(value){ 
                    return value != message.productIDs[i];
                });
            }
        }
        else if (message.action == 'deleteall') {
            this._filters.productIDs = [];
        }
        else {
            console.log('ERROR: wrong message action, could by only (add, delete, deleteall): ' + message.action);
            return;
        }
        this._applyFilters(true);
    }

    _applyFilters(applyImmidiately, key, value) {
        // It is strange, but this doesn't fire the cart update event :(
        //this.appliedFilters.productIDs = this._filters.productIDs;
        // Therefore, I had to write this trick
        let tmp = {
            searchKey: '', //Don't want to search inside the Cart by the same search box the Product List have.
            types: this._filters.types,
            families: this._filters.families,
            restrictToProductIDs: true,
            productIDs: this._filters.productIDs
        };
        if (key) {
            // Add new filter if needed
            tmp[key] = value;
        }
        this._filters = tmp;
        console.log(JSON.stringify(this._filters));
        if (applyImmidiately) {
            // I use setter instead of the original this.appliedFilters only to pass the updated count of products to the parent component.
            this.setAppliedFilters = tmp;
        }
    }

    handleDeleteAllClick() {
        this.isDialogVisible = true;
        this.activeConfirmation = 'deleteall';
        this.confirmationMessage = 'All products would be deleted from your cart. Are you sure?';
    }

    handleCheckoutClick() {
        this.isDialogVisible = true;
        this.activeConfirmation = 'checkout';
        this.confirmationMessage = 'All Products from your cart would be moved as Line Items to the Opportunity record. It will replace all current Opportunity Line Items with yours. Are you sure you want to proceed?';
    }

    handleConfirmationClick(event){
        if(event.target.name === 'confirmModal'){
            // When user clicks outside of the dialog area, the event is dispatched with detail value  as 1
            if(event.detail !== 1){
                if(event.detail.status === 'confirm') {
                    if (this.activeConfirmation == 'checkout') {
                        // TODO
                    }
                    else if (this.activeConfirmation == 'deleteall') {
                        // Publish a message so our component will be aware of our intent :)
                        publish(this.messageContext, PRODUCT_CART_CHANGED_MESSAGE, {
                            action: 'deleteall',
                            productIDs: [],
                        });                
                    }
                }
                else if(event.detail.status === 'cancel'){
                    //do nothing
                }
            }
            this.isDialogVisible = false;
        }
    }
}