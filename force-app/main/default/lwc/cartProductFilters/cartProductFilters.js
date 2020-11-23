import { LightningElement, wire } from 'lwc';
import { getPicklistValues } from 'lightning/uiObjectInfoApi';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import PRODUCT_OBJECT from '@salesforce/schema/Product2';
import PRODUCT_TYPE_FIELD from '@salesforce/schema/Product2.Product_Type__c';
import PRODUCT_FAMILY_FIELD from '@salesforce/schema/Product2.Family';

export default class CartProductFilters extends LightningElement {
    productRecordTypeID = '';
    @wire(getObjectInfo, { objectApiName: PRODUCT_OBJECT })
    gotProductObjectInfo(value) {
        if (value && value.data) {
            this.productRecordTypeID = value.data.defaultRecordTypeId;
        }
    }

    @wire(getPicklistValues, {
        recordTypeId: '$productRecordTypeID',
        fieldApiName: PRODUCT_FAMILY_FIELD
    })
    productFamilies;

    @wire(getPicklistValues, {
        recordTypeId: '$productRecordTypeID',
        fieldApiName: PRODUCT_TYPE_FIELD
    })
    productTypes;
}