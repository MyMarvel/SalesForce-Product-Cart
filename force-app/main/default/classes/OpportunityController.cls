public with sharing class OpportunityController {
    @AuraEnabled(Cacheable=true)
    public static String getOpportunityProductCart(String opportunityID, String currentUserID) {
        // I can get the user id straight here, in Apex, but I prefer to specify it as the function's attribute for clarity and cachable
        // Id userId = UserInfo.getUserId();
        List<Product_Cart__c> productCarts = [
            SELECT
                Id
            FROM Product_Cart__c
            WHERE Opportunity__c = :opportunityID AND CreatedById = :currentUserID
            LIMIT 1
        ];
        if (productCarts.size() > 0) {
            return productCarts[0].Id;
        }
        else {
            // TODO: Create a new Cart object
            throw new AuraHandledException('ERROR: The Product Cart object for given user is not found.');
        }
    }
}
