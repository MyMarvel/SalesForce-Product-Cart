import {LightningElement, api} from 'lwc';

/**
 * See document reference: https://medium.com/@marcoalmodova/a-lwc-confirmation-dialog-5aa486e301e4
 */
export default class ConfirmationDialog extends LightningElement {
    @api visible; //used to hide/show dialog
    @api title; //modal title
    @api name; //reference name of the component
    @api message; //modal message
    @api confirmLabel; //confirm button label
    @api cancelLabel; //cancel button label
    @api originalMessage; //any event/message/detail to be published back to the parent component

    //handles button clicks
    handleClick(event){
        //creates object which will be published to the parent component
        let finalEvent = {
            originalMessage: this.originalMessage,
            status: event.target.name
        };

        //dispatch a 'click' event so the parent component can handle it
        this.dispatchEvent(new CustomEvent('click', {detail: finalEvent}));
    }
}