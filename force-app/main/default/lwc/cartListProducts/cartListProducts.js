import { NavigationMixin } from 'lightning/navigation';
import { LightningElement, wire } from 'lwc';
import searchCartProducts from '@salesforce/apex/ProductController.getProducts';

export default class CartListProducts extends NavigationMixin(LightningElement) {
    searchTerm = '';
    hasResults = true;
    pageNumber = 1;

    @wire(searchCartProducts, {searchTerm: '$searchTerm', pageNumber: '$pageNumber'})
    products;
}