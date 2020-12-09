({
    myAction : function(component, event, helper) {

    },

    doInit: function(component) {
        // Get user id & opportunity id
        let oppID = component.get("v.recordId");
        var userID = $A.get("$SObjectType.CurrentUser.Id");
        // Load product cart obj for this user in the backend, return cart id
        // Call apex class method
        var action = component.get('c.getOpportunityProductCart');
        action.setParams({ opportunityID : oppID, currentUserID: userID });
        action.setCallback(this, function(response) {
          //Get state of response
          var state = response.getState();
          if (state === "SUCCESS") {
              // Redirect user to the Cart
              let cartId = response.getReturnValue();
              let navEvt = $A.get("e.force:navigateToSObject");
              navEvt.setParams({
                "recordId": cartId,
                "slideDevName": "related"
              });
              navEvt.fire();
          }
          else if (state === "ERROR") {
            let errors = response.getError();
            let message = 'Unknown error'; // Default error message
            // Retrieve the error message sent by the server
            if (errors && Array.isArray(errors) && errors.length > 0) {
                message = errors[0].message;
            }
            // Display the message to console
            console.error(message);
            $A.get("e.force:closeQuickAction").fire();
            component.find('notify').showToast({
                "variant": "error",
                "title": "Error",
                "message": message,
                "mode": 'sticky'
            });
          }
        });
        $A.enqueueAction(action);
    }
})
