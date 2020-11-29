public with sharing class ProductController {
    static Integer PAGE_SIZE = 12;

    public class Filters {
        @AuraEnabled
        public String searchKey { get; set; }
        @AuraEnabled
        public String[] types { get; set; }
        @AuraEnabled
        public String[] families { get; set; }
        @AuraEnabled
        public Boolean restrictToProductIDs { get; set; }
        @AuraEnabled
        public String[] productIDs { get; set; }
    }

    @AuraEnabled(Cacheable=true)
    public static PagedResult getProducts(Filters filters, Integer pageNumber) {
        System.debug('getProduct was launched');
        String searchKey, whereClause = '';
        String[] types = new List<String>{}, families = new List<String>{}, criteria = new List<String>{}, productIDs = new List<String>{};

        if (filters != null) {
            if (!String.isEmpty(filters.searchKey)) {
                searchKey = '%' + filters.searchKey + '%';
                criteria.add('Name LIKE :searchKey');
            }
            if (filters.types != null && filters.types.size() > 0) {
                types = filters.types;
                criteria.add('Product_Type__c IN :types');
            }
            if (filters.families != null && filters.families.size() > 0) {
                families = filters.families;
                criteria.add('Family IN :families');
            }
            if (filters.restrictToProductIDs != null
            && filters.restrictToProductIDs == true
            && filters.productIDs != null
            && filters.productIDs.size() > 0) {
                productIDs = filters.productIDs;
                criteria.add('Id IN :productIDs');
            }
            if (criteria.size() > 0) {
                whereClause = 'WHERE ' + String.join(criteria, ' AND ');
            }
        }
        System.debug('getProduct WHERE clause: '
            + whereClause
                .replace(':types',  String.join(types, ','))
                .replace(':families',  String.join(families, ','))
        );

        Integer pageSize = ProductController.PAGE_SIZE;
        Integer offset = (pageNumber - 1) * pageSize;
        PagedResult result = new PagedResult();
        result.pageSize = pageSize;
        result.pageNumber = pageNumber;
        result.totalItemCount = Database.countQuery(
            'SELECT count() FROM Product2 ' + whereClause
        );
        result.records = Database.query(
            'SELECT Id, Name, Description, Product_Image_URL__c FROM Product2 ' +
            whereClause +
            ' WITH SECURITY_ENFORCED' +
            ' ORDER BY Name LIMIT :pageSize OFFSET :offset'
        );
        System.debug('getProduct count records: ' + String.valueOf(result.totalItemCount));
        return result;
    }

    @AuraEnabled(Cacheable=true)
    public static Product2[] getSimilarProducts(Id productId, Id familyId) {
        return [
            SELECT
                Id,
                Name,
                Description,
                Product_Image_URL__c
            FROM Product2
            WHERE Family = :familyId AND Id != :productId
            WITH SECURITY_ENFORCED
        ];
    }
}
