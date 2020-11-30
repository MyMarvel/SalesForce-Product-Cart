import { LightningElement, wire, api, track } from 'lwc';
// Message channels
import { subscribe, publish, MessageContext } from 'lightning/messageService';
import PRODUCTS_FILTERED_MESSAGE from '@salesforce/messageChannel/FilterProductCart__c';
import PRODUCT_CART_CHANGED_MESSAGE from '@salesforce/messageChannel/ProductCartChanged__c';
// For writing Product Cart Items into database
import { createRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import PRODUCT_CART_ITEM_OBJECT from '@salesforce/schema/Product_Cart_Item__c';
import PRODUCT_CART_FIELD from '@salesforce/schema/Product_Cart_Item__c.Product_Cart__c';
import PRODUCT_FIELD from '@salesforce/schema/Product_Cart_Item__c.Product_Cart_Product__c';
import { refreshApex } from '@salesforce/apex';
// My custom Apex controllers
import getProducts from '@salesforce/apex/ProductController.getProducts';
import getCartProducts from '@salesforce/apex/OpportunityProductCartController.getCartProducts';

const USE_DATABASE = false;

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

    get countProductsInCart() {
        return this._filters.productIDs.length;
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

    @api productCartId;

    // Get initial value of products in the Cart (in case a user closed the browser and
    // then want to get back to his incomplete cart to continue his 'shopping')
    /*
    @wire(getCartProducts, { productCartId: '$productCartId' })
    wiredInitialProducts(result) {
        if (result.data && result.data.length > 0) {
            publish(this.messageContext, PRODUCT_CART_CHANGED_MESSAGE, {
                action: 'add',
                productIDs: result.data,
            });
        }
        else if (result.error) {
            this.dispatchEvent(
                new ShowToastEvent({ title: 'Error loading cart products', message: result.error.body.message, variant: 'error' }),
            );
        }
    }
    */

    connectedCallback() {
        // Subscribe to ProductsFiltered message
        this.productFilterSubscription = subscribe(
            this.messageContext,
            PRODUCTS_FILTERED_MESSAGE,
            (message) => this.handleFilterChangeMessage(message)
        );

        /*
        getCartProducts({productCartId: this.productCartId})
            .then(result => {
                // I wanted just to update our tracked property this.appliedFilters so the wired property cartProducts
                // will be updated too, but with no luck. It just doesn't work and I don't know why. Here is what I tried:
                //console.log(this.appliedFilters); I made sure 'this' pointer is our actual lwc oject - it is;
                // Tried the normal way with hardcoded ids which are absolutely exists in my org - doesn't work
                //this.appliedFilters.productIDs = ['a00J000000NrZYKIA3'];
                // Tried to use my 'hack', because I already experienced such kind of issue previously when cartProducts
                // was not updated, so I wrote a helper function to pass a new variable instead of changing just one property
                // It doesn't work too
                //this._applyFilters(true, 'productIDs', ['a00J000000NrZYeIAN']);
                // I tried it without my helper function and assign a brand new object to the tracked variable - no luck either;
                //this.appliedFilters = { searchKey: '', types: [], families: [], productIDs: ["a00J000000NrZYKIA3"], restrictToProductIDs: true };
                // I tried to use refreshApex built-in function with all of the options above, with the same result;
                //refreshApex(this.cartProducts);
                // I made sure all my cache mechanisms in my org and browser are disabled.
                // I tried to move this apex getCartProducts call outside the connectedCallback() function and use @wire decorated instead.
                // I tried the same combinations and got the same result - cartProducts was not updated and my products didn't appear
                // under the 'Your cart' section of the Product Cart accordeon.
                // I tried to use a bulletproof solution with a message channel (it surely works from my cartProductTile component);
                //publish(this.messageContext, PRODUCT_CART_CHANGED_MESSAGE, { action: 'add', productIDs: ['a00J000000NrZYeIAN'] });
                // I tried to use a timeout in case I misunderstand the lwc lifecycle hooks, the same result
                //this.delayTimeout = setTimeout(() => {
                //    publish(this.messageContext, PRODUCT_CART_CHANGED_MESSAGE, { action: 'add', productIDs: ['a00J000000NrZYeIAN'] });
                //}, 5000);
                // In the end, I have to get rid of functionelity for storing any information about my product cart into database since
                // I cannot retrieve it during the component initialization. Therefore, const USE_DATABASE = false. :(
            })
            .catch(error => {
                alert(JSON.stringify(error));
                this.dispatchEvent(
                    new ShowToastEvent({ title: 'Error loading cart products', message: error.body.message, variant: 'error' }),
                );
            });
        */
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
                let productId = message.productIDs[i];
                if(this._filters.productIDs.indexOf(productId) === -1) {
                    this._filters.productIDs.push(productId);
                }
            }
            // I assume that I always call 'add' action with only one product, so I can use just a standard
            // createRecord func instead of custom apex function. It is a good training for me. We can refactor it later if needed
            // by adding just another function to my OpportunityProductCartController apex class.
            if (message.productIDs.length === 1) {
                this._writeProductCartItemToDatabase(message.productIDs[0]);
            }
        }
        else if (message.action == 'delete') {
            for(let i=0; i<message.productIDs.length; i++) {
                this._filters.productIDs = this._filters.productIDs.filter(function(value){ 
                    return value != message.productIDs[i];
                });
            }
            _deleteProductCartItemFromDatabase();
        }
        else if (message.action == 'deleteall') {
            this._filters.productIDs = [];
            _deleteProductCartItemFromDatabase();
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
        //console.log(JSON.stringify(this._filters));
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

    _writeProductCartItemToDatabase(productId) {
        if (USE_DATABASE) {
            let fields = {};
            fields[PRODUCT_CART_FIELD.fieldApiName] = this.productCartId;
            fields[PRODUCT_FIELD.fieldApiName] = productId;
            const recordInput = { apiName: PRODUCT_CART_ITEM_OBJECT.objectApiName, fields };
            createRecord(recordInput)
                .then(record => {
                    console.log('A product was successfully added to the database');
                })
                .catch(error => {
                    this.dispatchEvent(
                        new ShowToastEvent({ title: 'Error creating record', message: error.body.message, variant: 'error' }),
                    );
                });
        }
    }

    _deleteProductCartItemFromDatabase() {
        if (USE_DATABASE) {
            // There is no sense to write an apex class for it since I decided to get rid of database functionality.
        }
    }
}