({
    myAction : function(component, event, helper) {

    },

    doInit: function(cmp) {
        // Get user id
        // Get opportunity id
        // Load product cart obj for this user in the backend, return cart id
        let cartId = 'a00P0000006TulkIAC';
        // TODO: Figure out how to render a link to a record by it's id without hardcoding the path
        //$A.get("e.force:navigateToURL").setParams({"url": "lightning/r/Product_Cart__c/" + cartId +  "/view" + "&retURL=" + encURI()}).fire();
        let navEvt = $A.get("e.force:navigateToSObject");
        navEvt.setParams({
          "recordId": cartId,
          "slideDevName": "related"
        });
        navEvt.fire();
    }
})
