public with sharing class OpportunityProductCartController {
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

    @AuraEnabled(Cacheable=true)
    public static List<Id> getCartProducts(String productCartId) {
        List<Id> productIDs = new List<Id>();
        List<Product_Cart_Item__c> productsInCart = [
            SELECT
                Product_Cart_Product__c
            FROM Product_Cart_Item__c
            WHERE Product_Cart__c = :productCartId
        ];
        for (Product_Cart_Item__c product : productsInCart) {
            productIDs.add(product.Id);
        }
        return productIDs;
    }

    @AuraEnabled
    public static Boolean saveProductCartItemAsOpportunityItems(List<String> productCartProductIds, String opportunityId) {
        List<OpportunityLineItem> opportunityLineItems = new List<OpportunityLineItem>();
        for (String productId : productCartProductIds) {
            // TODO: more required fields?
            OpportunityLineItem opportunityItemRecord = new OpportunityLineItem(OpportunityId=opportunityId, Product2Id=productId);
            opportunityLineItems.add(opportunityItemRecord);
        }
        try {
            insert opportunityLineItems;
        }
        catch(DmlException e) {
            throw new AuraHandledException(e.getMessage());
        }
        return true;
    }
}
