import { LightningElement, wire } from 'lwc';
// Ligthning Message Service and a message channel
import { publish, MessageContext } from 'lightning/messageService';
import PRODUCTS_FILTERED_MESSAGE from '@salesforce/messageChannel/FilterProductCart__c';

// The delay used when debouncing event handlers before firing the event
const DELAY = 300;
const SEARCH_FILTER_NAME = 'searchKey';

export default class CartProductSearch extends LightningElement {
    currentSearchKey = '';

    @wire(MessageContext) messageContext;

    handleSearchKeyChange(event) {
        this.currentSearchKey = event.target.value;
        this.delayedFireFilterChangeEvent();
    }

    delayedFireFilterChangeEvent() {
        // Debouncing this method: Do not actually fire the event as long as this function is
        // being called within a delay of DELAY. This is to avoid a very large number of Apex
        // method calls in components listening to this event.
        window.clearTimeout(this.delayTimeout);
        // eslint-disable-next-line @lwc/lwc/no-async-operation
        this.delayTimeout = setTimeout(() => {
            // Published ProductsFiltered message
            publish(this.messageContext, PRODUCTS_FILTERED_MESSAGE, {
                filtersGroupName: SEARCH_FILTER_NAME,
                filters: this.currentSearchKey,
            });
        }, DELAY);
    }
}