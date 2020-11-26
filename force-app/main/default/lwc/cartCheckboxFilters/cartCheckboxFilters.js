import { LightningElement, api, wire, track } from 'lwc';

// Ligthning Message Service and a message channel
import { publish, MessageContext } from 'lightning/messageService';
import PRODUCTS_FILTERED_MESSAGE from '@salesforce/messageChannel/FilterProductCart__c';

// The delay used when debouncing event handlers before firing the event
const DELAY = 350;

export default class CartCheckboxFilters extends LightningElement {
    @api filtersList;
    @api filtersGroupName;
    @track isCheckboxAllChecked = true;
    @track otherCheckboxesChecked = true;

    filters = [];

    @wire(MessageContext) messageContext;

    handleCheckboxChange(event) {
        return;
        if (!this.filters.categories) {
            // Lazy initialize filters with all values initially set
            this.filters = this.filtersList.values.map(
                (item) => item.value
            );
        }
        const value = event.target.dataset.value;
        const filterArray = this.filters[event.target.dataset.filter];
        if (event.target.checked) {
            if (!filterArray.includes(value)) {
                filterArray.push(value);
            }
        } else {
            this.filters[event.target.dataset.filter] = filterArray.filter(
                (item) => item !== value
            );
        }
        // Published ProductsFiltered message
        publish(this.messageContext, PRODUCTS_FILTERED_MESSAGE, {
            filters: this.filters,
            filtersGroupName: this.filtersGroupName
        });
    }

    handleCheckboxChangeAll(event) {
        this.isCheckboxAllChecked = !this.isCheckboxAllChecked;
        this.otherCheckboxesChecked = this.isCheckboxAllChecked;
    }

}