# Product Cart application

This project allows user to conveniently choose products for a specific Opportunity record.

## Installation instructions

sfdx force:auth:web:login -d -a DevHub

sfdx force:source:push

sfdx force:user:permset:assign -n Product_Cart_User

sfdx force:data:tree:import --plan ./data/test_product_cart-Opportunity-Product_Cart__c-plan.json

sfdx force:data:tree:import --plan ./data/test_products-Product2-plan.json

sfdx force:org:open