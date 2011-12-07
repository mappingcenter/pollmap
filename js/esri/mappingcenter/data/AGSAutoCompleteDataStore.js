dojo.provide("esri.mappingcenter.data.AGSAutoCompleteDataStore");
dojo.require("esri.tasks.query");
dojo.require("dojo.data.util.simpleFetch");
dojo.declare("esri.mappingcenter.data.AGSAutoCompleteDataStore", null, {
    /**
     * Url to a layer set to return only a limited number of records (10)
     */
    url: "",
    outFields: ["DISP_NAME", "GEONAMEID"], //default values
    idField: "GEONAMEID",
    queryField: "DISP_NAME",
    _queryTask: null,
    _queryParams: null,
    _query: null,
    _storeRef: "_S", // a reference to the store is kept in every item in the _S attribute
    _itemCache: {}, // hash of items
    constructor: function(args){
        log("Initializing AGSAutoCompleteDataStore");
        log(args);
        if (args && args.url) {
            this.url = args.url;
        }
        
        if (args && args.idField) {
            this.idField = args.idField;
        }
        
        if (args && args.queryField) {
            this.queryField = args.queryField;
        }
        
        if (args && args.outFields) {
            this.outFields = args.outFields;
        } else {
            this.outFields = [this.idField, this.queryField]; // default to the query and id fields
        }
        
        this._queryTask = new esri.tasks.QueryTask(this.url);
        this._query = new esri.tasks.Query();
        this._query.outFields = this.outFields;
        this._query.returnGeometry = false;
    },
    /**
     * Sets this._query.where and executes this._queryTask with the proper handlers
     * @param {dojo.data.request} request
     * @param {Function} fetchHandler
     * @param {Function} errorHandler
     */
    _fetchItems: function(/* dojo.data.request */request, /* function */ fetchHandler, /* function */ errorHandler){
        this._itemCache = {};
        log("AGSQueryDataStore _fetchItems");
        log(request);
        if (!request.query) {
            request.query = {};
            request.query[this.queryField] = "A*"; // if no request, default to A
        }
        
        // get the value from the request
        var value = request.query[this.queryField];
        value = value.replace("*", ""); // get rid of the star // TODO dynamically create the sql query based on the input pattern
        this._query.where = "LEFT(" + this.queryField + "," + value.length + ")='" + value + "'"; // i.e. LEFT(DISP_NAME,3) = 'Chi'
        // this._query.where = "this.queryField LIKE %"+value+"%";
        // this._query.text = value;
        var self = this; // pulled into handler by closures
        this._queryTask.execute(this._query, function(data){
            // process features
            fetchHandler(self._processResults(data), request); // fetchHandler references a function passed in by simpleFetch (?)
        }, errorHandler); // execute the query task, pass along handler args
    },
    /**
     * Handles the queryTask results, builds array of items, caches each item by Id, adds reference (_S) to this datastore
     * @param {Object} results
     */
    _processResults: function(results){
        // called by _fetchItems on completion of the query
        var items = [];
        log("AGSACDS: processing results");
        log(results);
        if (results.features.length) {
//            items = results.features;
            // Add a reference to this dataStore so isItem works
            var storeObject = this;
            dojo.forEach(results.features, function(feature){
                feature.attributes[storeObject._storeRef] = storeObject;
                feature.attributes.value = feature.attributes[storeObject.idField]; // Workaround since Dojo intelligently prevents anyone from specifying what field to use for the value. WOW.
                items.push(feature.attributes);
                storeObject._itemCache[feature.attributes[storeObject.idField]] = feature.attributes;
            });
        }
        
        return items;
    },
    /**
     * Reports what features this dataStore supports
     */
    getFeatures: function(){
        return {
            "dojo.data.api.Read": true,
            "dojo.data.api.Identity": true
        };
    },
    /**
     * Returns data attributes
     */
    getAttributes: function(){
        log("getAttributes");
        return this.outFields.split(", ");
    },
    
    /**
     * Checks if an item is part of this data store
     */
    isItem: function(item){
        return item && item[this._storeRef] === this;
    },
    
    /**
     * Used by lazy-loading data sources
     */
    isItemLoaded: function(item){
        return this.isItem(item);
    },
    
    loadItem: function(keywordArgs){
    },
    /**
     * See dojo.data.api.Read.getValue()
     * @param {Object} item
     * @param {Object} attribute
     */
    getValues: function(item, attribute){
        if (!this.isItem(item)) {
            throw new Error("AGSQueryDataStore: invalid item");
        }
        
        if (typeof attribute !== "string") {
            throw new Error("AGSQueryDataStore: invalid attribute");
        }
        
        try {
            return [item[attribute]];
        } catch (e) {
            return [];
        }
    },
    
    /**
     * Basic read out of items array
     */
    getValue: function(item, attribute){
        var values = this.getValues(item, attribute);
        return values.length === 0 ? undefined : values[0];
    },
    
    hasAttribute: function(item, attribute){
        return attribute in item;
    },
    
    containsValue: function(item, attribute, value){
        var values = this.getValues(item, attribute);
        return dojo.some(values, function(thisValue){
            return thisValue == value;
        });
    },
    // dojo.data.api.Identity
    /**
     * Returns the unique identifier for an item
     * @param {Object} item
     */
    getIdentity: function(item){
        return item[this.idField];
    },
    /**
     * Returns an array of attribute names used to generate an item's identity
     */
    getIdentityAttributes: function(){
        return [this.idField];
    },
    /**
     * Given the identity of an item, this method returns the item that has that identity through the onItem callback.
     * @param {Object} args
     */
    fetchItemByIdentity: function(args){
        log("AGACDS: fetchItemByIdentity");
        log(args);
        var scope = typeof args == "object"? "scope" in args ? args[scope] : dojo.global :dojo.global;
        try {
            if (this._itemCache[args.identity]) {
                dojo.call(args.onItem, this._itemCache[args.identity], scope);
            } else {
                dojo.call(args.onItem, null, scope);
            }
        } catch(e){
            if (args.onError){
                dojo.call(args.onError, e, scope);
            }
        }
    }    
});

dojo.extend(esri.mappingcenter.data.AGSAutoCompleteDataStore, dojo.data.util.simpleFetch);
