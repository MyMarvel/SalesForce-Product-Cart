import { LightningElement, api, wire, track } from 'lwc';

// Ligthning Message Service and a message channel
import { publish, MessageContext } from 'lightning/messageService';
import PRODUCTS_FILTERED_MESSAGE from '@salesforce/messageChannel/FilterProductCart__c';

// The delay used when debouncing event handlers before firing the event
const DELAY = 100;

export default class CartCheckboxFilters extends LightningElement {
    @api filtersList;
    @api filtersGroupName;
    @track isCheckboxAllChecked = true;
    @track otherCheckboxesChecked = true;

    currentFilters = new Array();

    @wire(MessageContext) messageContext;

    connectedCallback() {
        this.currentFilters = this.filtersList.values.map(
            (item) => item.value
        );
    }

    handleCheckboxChange(event) {
        let value = event.target.dataset.value;
        if (event.target.checked) {
            // Add it to the current values list
            if (!this.currentFilters.includes(value)) {
                this.currentFilters.push(value);
            }
        } else {
            // Remove it from the current values list
            this.currentFilters = this.currentFilters.filter(
                (item) => item !== value
            );
        }
        // Published ProductsFiltered message
        this.fireFilterChangeEvent();
    }

    handleCheckboxChangeAll(event) {
        this.isCheckboxAllChecked = !this.isCheckboxAllChecked;
        this.otherCheckboxesChecked = this.isCheckboxAllChecked;
        // The change of otherCheckboxesChecked variable does not trigger the 'changed' event on the checkboxes
        // for some reason, therefore no handleCheckboxChange is fired and productList is not updated
        // I have to manually update the state of the triggers and send a new message to the list component
        if (this.isCheckboxAllChecked) {
            // Let Apex class know we checked all checkboxes
            this.currentFilters = this.filtersList.values.map(
                (item) => item.value
            );
        }
        else {
            this.currentFilters = [];
        }
        this.fireFilterChangeEvent();
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
                filtersGroupName: this.filtersGroupName,
                filters: this.currentFilters,
            });
        }, DELAY);
    }

    fireFilterChangeEvent() {
        publish(this.messageContext, PRODUCTS_FILTERED_MESSAGE, {
            filtersGroupName: this.filtersGroupName,
            filters: this.currentFilters,
        });
    }
}