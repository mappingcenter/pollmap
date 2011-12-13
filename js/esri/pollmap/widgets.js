/**
 * @author alex6294
 */
dojo.require("dijit._Widget");

dojo.require("esri.tasks.query");
dojo.provide("esri.pollmap.widgets");

// vote window dependencies (I think)
dojo.require("dijit.form.NumberTextBox");
dojo.require("dijit.Dialog");
dojo.require("dijit.form.Form");
dojo.require("dijit.form.ValidationTextBox"); // for normal pollmap zip validation
dojo.require("dijit.form.FilteringSelect"); // for allocation pollmap autocomplete
dojo.require("esri.layers.FeatureLayer");
dojo.require("esri.mappingcenter.data.AGSAutoCompleteDataStore");
/**
 * VoteWindow
 */
dojo.declare("esri.pollmap.widgets.VoteWindow", [dijit._Widget, dijit._Templated], {
    allocationTotal: 100,
    widgetsInTemplate: true,
    templateString: dojo.cache(appDir, "js/esri/pollmap/templates/VoteWindow.html"),
    questions: null,
    activeQuestions: null,
    dataSource: "config",
    dataObj: "questions",
    anchorNode: null,
    locationLabel: "",
    featureService: "",
    featureLayer: null,
    locationMinLength: 5,
    locationMaxLength: 5,
    invalidLocationMessage: "",
    locationInputLabelText: "",
    dialog: null,
    votes: null,
    created: false,
    firstStartup: true,
    lastLocation: "",
    lastLocationValid: false,
    locationInput: null,
    questionInputs: null,
    labels: null,
    validating: false,
    _eventConnections: null,
    isAllocationQuestionMode: false,
    isNormalQuestionMode: false, // radio buttons, crir etc...
    allocationInputs: null,
    currency: "$",
    autocompleteDataStore: null,
    allocationRemainingNode: null,
    allocationRemaining: 0,
    
    constructor: function(/* Object */args){
    	log("VoteWindow constructor");
        log(args);
        dojo.safeMixin(this, args);// mixin passed args
        this.loadCSS();
        
        // initialize complex instance variables
        // http://www.enterprisedojo.com/2011/05/17/dojo-beginner-gotcha-accidental-static-fields/
        this.activeQuestions = [];
        this.votes = {};
        this.questionInputs = [];
        this.labels = [];
        this._eventConnections = [];
        this.allocationInputs = [];
        
        
        if ("locationField" in config.app) {
            this.locationField = config.app.locationField;
        }
        
        if ("allocationTotal" in config.app) {
            this.allocationTotal = config.app.allocationTotal;
        }
        this.allocationRemaining = this.allocationTotal;
        
        if ("currency" in config.app) {
            this.currency = config.app.currency;
        }
        
        if (config.app.locationMode == "postal") { // TODO: make this only happen if config explicitly says, based on type of pollmap, not type of question
        	this.locationInputLabelText = config.app.locationInputLabelText || "Enter US or Canadian postal code:";
        	this.invalidLocationMessage = config.app.invalidLocationMessage || "Please enter a valid US (5 digit) ZIP or Canadian (3 character) postal code.";
        	
        	// setup featureLayer for postal code validation
        	if (!featureLayer){
            	this.featureLayer = featureLayer = new esri.layers.FeatureLayer(config.app.featureService);
           	}
        } else if (config.app.locationMode == "city") {
            this.setupAutocomplete();
            this.locationInputLabelText = config.app.locationInputLabelText || "Your city:";
            this.invalidLocationMessage = config.app.invalidLocationMessage || "City not found, please enter a nearby city.";
        	
        }
        dojo.subscribe("votes/success", this, this.onVoteSuccess);
        dojo.subscribe("votes/error", this, this.onVoteError);
        
        this.loadQuestions(); // load and scan the questions
        //TODO: interrogate questions value
        
    },
    postCreate: function(){
    	log("VoteWindow postCreate");
       	this.inherited(arguments);

        // this.created = true;
        this.dialog = new dijit.Dialog({
            content: this.domNode,
            "class": "vote-window-dialog"
        });
        
        dojo.attr(this.locationLabelNode, "innerHTML", this.locationInputLabelText);
        
    },
    
    startup: function(){
    	// workaround for strange bug that appeared after upgrading to dojo 1.6 caused by our dialog calling startup on its child (this widget)
    	if (this.firstStartup){
        	this.firstStartup = false;
    		log("votewindow startup");
        	this.buildUI();
      }
    },
    
    /**
     * Loads the questions from the VoteWindow's data source and populates the activeQuestions array from that. Currently inactive questions are only half-supported
     */
    loadQuestions: function(){
        // hook up data source, first make sure it exists
        if (dojo.isObject(dojo.global[this.dataSource])) {
            this.questions = dojo.global[this.dataSource][this.dataObj];
            log("Questions loaded into VoteWindow widget");
            //            log(this.questions);
        } else {
            err("Error loading data source for VoteWindow widget");
        }
        
        dojo.forEach(this.questions, dojo.hitch(this, function(question){
            if (typeof question.active == "undefined" || question.active == true) { // allow blank active value to default to true, since inactive questions are rare and intentional
                this.activeQuestions.push(question);
            }
        }));
        log("Active questions:");
        log(this.activeQuestions);
    },
    
    /**
     * This method builds the VoteWindow UI depending on the question type
     */
    buildUI: function(){
        var questionContainer, row, cellClass, cell, input;
        
        // build location input
        
        
        // add a css class to the location input fieldset for automatic field-length styling
		if(config.app.locationMode) {
			dojo.query(".vote-location").forEach(function(node) {
				dojo.addClass(node, config.app.locationMode);
			});
		}
        
        if (config.app.locationMode == "postal") {
            this.locationInput = new dijit.form.ValidationTextBox({
                required: true
            }, this.locationInputNode);
            
            dojo.addClass(this.locationInput, "postal-input"); // for css to conditionally style postal zip input
            this._eventConnections.push(dojo.connect(this.locationInput, "onKeyDown", this.onLocationInputKeyDown)); // attach keydown handler
            this.setupLocationValidators(); // has to happen after locationInput is created, sets up the validators
        } else if (config.app.locationMode == "city") {
            this.locationInput = new dijit.form.FilteringSelect({
                name: "location",
                store: this.autocompleteDataStore,
                //                labelAttr: config.app.locationDisplayField, There is no way to specify the field from which dojo pulls the value, SERIOUSLY!?
                searchAttr: config.app.locationDisplayField, // the attribute used BOTH for searching and for submitting
                invalidMessage: this.invalidLocationMessage,
                autocomplete: true,
                required: true,
                hasDownArrow: false
            }, this.locationInputNode);
            //            this.locationInput._setValueAttr(config.app.locationField); // undocumented internal function to set the value field? SERIOUSLY FOLKS?!!!!!! oh how I miss Flex
        }
        
        
        dojo.forEach(this.activeQuestions, dojo.hitch(this, function(question, i){
            log("Question " + i);
            
            
            // ***************** NORMAL VOTE UI ********************* //
            if (typeof question.type == "undefined" || question.type === "" || question.type == "radio") { // radio question type or not defined
                questionContainer = dojo.create("tr", {
                    "class": "vote-form-question",
                    "id": "question" + i
                }, this.questionsNode);
                dojo.forEach(question.values, function(value, j, arr){
                    //                log("Value " + j);
                    //                log(value);
                    if (j === 0) {
                        cellClass = "first";
						if(question.label) {
                              dojo.create("td", {
                                    innerHTML : question.label,
                                    "class" : "question-label"
                              }, questionContainer)
                        }
                    }
                    if (j > 0) {
                        dojo.create("td", {
                            innerHTML: config.app.choiceCompareText,
                            "class": "middle"
                        }, questionContainer);
                    }
                    if (j == arr.length - 1) {
                        cellClass = "last";
                    }
                    cell = dojo.create("td", {
                        "class": cellClass
                    }, questionContainer);
                    dojo.create("input", {
                        type: "radio",
                        id: "radio" + i + j,
                        name: "question" + i,
                        value: value.value,
                        "class": "crirHiddenJS" //TODO: add a vote-specific class and get rid of CRIR!!
                    }, cell);
                    dojo.create("label", {
                        "for": "radio" + i + j,
                        id: "label" + i + j,
                        innerHTML: value.title,
                        value: value.value
                    }, cell);
                    
                    // TODO: initialize a datastore on app load, structured by the config to hold form values
                }, this);
                
                // ***************** ALLOCATE UI ********************* //   
            } else if (question.type == "allocation") {
                // build the questions
                dojo.forEach(question.values, function(value, j, arr){
                    row = dojo.create("tr", {}, this.questionsNode);
                    cell = dojo.create("td", {
                        innerHTML: this.currency
                    }, row); // TODO create a separate table for each question to avoid column-mismatches -- allocation uses 2 columns, normal uses 3
                    input = new dijit.form.NumberTextBox({
                        "class": "allocationInput",
                        label: value.title,
                        currency: "USD",
                        name: value.value, // store the field name for access later when we gather the votes
                        constraints: {
                            places: 0,
                            min: 0,
                            max: 100
                        }
                    });
                    cell.appendChild(input.domNode);
                    this.allocationInputs.push(input);
                    dojo.create("td", {
                        "class": "allocationLabel text-left",
                        innerHTML: value.title
                    }, row);
                }, this);
                
                // build remaining row
                var remainingRow = dojo.create("tr", {}, this.questionsNode); // remaining funds row
                dojo.create("td", { // span to hold remaining funds value, updates as user enters stuff
                    innerHTML: "<span id='allocationRemainingText'>" + this.currency + this.allocationTotal + "</span>",
                    "class": "allocationRemaining text-right"
                }, remainingRow);
                
                dojo.create("td", { // remaining funds label
                    innerHTML: config.app.allocationRemainingLabel,
                    "class": "allocationLabel text-left allocationRemainingLabel"
                }, remainingRow);
                
                // setup event listener for allocation changes
                //                dojo.query(".allocationInput").connect("onChange", this, this.onAllocationChange);
                dojo.forEach(this.allocationInputs, function(input){
                    this._eventConnections.push(dojo.connect(input, "onChange", this, this.onAllocationChange));
                }, this);
                            
            } else if (question.type == "autocomplete"){
        		log("Autocomplete question!");
        		this.setupQuestionAutocomplete(question);
        		log("Autocomplete setup, now building question UI");		
               	row = dojo.create("tr", {}, this.questionsNode);
                dojo.create("td", {innerHTML: question.label, "class": "questionAutocompleteLabel"}, row);
                cell = dojo.create("td", {}, row); // TODO create a separate table for each question to avoid column-mismatches -- allocation uses 2 columns, normal uses 3
        		question.autocompleteInput = new dijit.form.FilteringSelect({
	                name: "question"+i,
	                store: question.autocompleteDataStore,
	                searchAttr: question.autocompleteQueryField, // the attribute used for searching
	                // invalidMessage: this.invalidLocationMessage,
	                autocomplete: true,
	                // required: true,
	                hasDownArrow: false
	            }, cell);
	            
	            // store it here too just in case
 				this.questionInputs.push(question.autocompleteInput);
 				log("question "+i+" setup complete");
             	
           	} else if (question.type == "rank") {
           		throw new Error("Unimplemented question type");
                //TODO: implement this
            }
        }));
        
        log("about to show dialog");
        this.dialog.show();
        log("dialog shown");
        dojo.fadeOut({
            node: this.dialog.domNode
        }).play();
        log("dialog faded out");
        if (config.app.questionMode == "normal" || config.app.questionMode == "radio") { // only run crir if we have radio buttons
            if (typeof crir == "object") { // don't load if we're in IE7
            	log("Initializing crir for radio button formatting");
                crir.init(); // for better label/checkbox formatting
            }
        }
        // make sure columns are equally sized. code here only applies to 2 variable questions (for now)
        this.dialog.layout();
        
        try { // TODO: only run this if we have a normal question
            log("Setting column widths");
            var firstCell = dojo.query("td.first", this.domNode)[0];
            var lastCell = dojo.query("td.last", this.domNode)[0];
            var firstWidth = parseInt(dojo.style(firstCell, "width"), 10);
            log(firstWidth);
            var lastWidth = parseInt(dojo.style(lastCell, "width"), 10);
            log(lastWidth);
            if (firstWidth > lastWidth) {
                log("styling last cell");
                dojo.style(lastCell, {
                    "width": firstWidth + "px"
                });
            } else if (lastWidth > firstWidth) {
                log("styling first cell");
                dojo.style(firstCell, {
                    "width": lastWidth + "px"
                });
            }
        } catch (e) {
            // something went wrong, or we had no "normal" questions
        }
        // fade dialog back in once everything is laid out
        setTimeout(dojo.hitch(this, function(){
            this.dialog.layout();
            dojo.fadeIn({
                node: voteWindow.dialog.domNode,
                duration: 500
            }).play();
        }), 100);
        
        //        log(dojo.getComputedStyle(this.dialog.domNode).left);
        //        log(dojo.getComputedStyle(this.dialog.domNode).right);
    },
    onInputClick: function(event){
        //        log(event);
        //        log(this.label);
        //        log(dojo.indexOf(this.buttons, dijit.by event.target));
    },
    onLocationInputKeyDown: function(event){
        //        this.onSubmit();
        if (event.keyCode == 13) { // if user pressed enter
            //  this.onSubmit();
        }
    },
    /**
     * Called when allocation changes
     * @param {Object} event DOJO EVENT, not DOM event
     */
    onAllocationChange: function(event){
        log("Allocation changed");
        //        log("item 0 value " + this.allocationInputs[0].value);
        // calculate allocation remaining
        var _total = 0;
        dojo.forEach(this.allocationInputs, function(input){
            if (!isNaN(input.value)) {
                _total += input.value;
            }
        });
        //        log(_total);
        //        log(this.allocationTotal);
        this.setAllocationRemaining(this.allocationTotal - _total);
    },
    /**
     * Sets the value of dojo.byId("allocationRemainingText") to the new value with proper formatting, sets negative class as appropriate
     * @param {Object} value
     */
    setAllocationRemaining: function(value){
        log("setting allocationRemaining");
        dojo.removeClass(this.domNode, "vote-question-error");
        
        var _str = "";
        this.allocationRemaining = value;
        if (!this.allocationRemainingNode) {
            this.allocationRemainingNode = dojo.byId("allocationRemainingText");
        }
        if (value < 0) {
            _str = "&ndash;" + this.currency;
            dojo.addClass(this.allocationRemainingNode, "negative");
            value = -value; // we've added the negative already before the currency symbol
        } else if (value === 0) {
            // all done
            dojo.removeClass(this.allocationRemainingNode, "negative");
            dojo.addClass(this.allocationRemainingNode, "allocated");
            _str = this.currency;
        } else {
            dojo.removeClass(this.allocationRemainingNode, "negative"); // remove all classes
            dojo.removeClass(this.allocationRemainingNode, "allocated");
            _str = this.currency;
            // still have funds left
        }
        _str += value;
        this.allocationRemainingNode.innerHTML = _str;
        // set the value and class if negative
        log(this.allocationRemaining);
    },
    
    /**
     * Called onSubmit. Returns true if at least one issue has been allocated to and total allocation is not greater than this.allocationTotal. Displays a warning if all funds have not been allocated
     */
    isAllocationValid: function(){
        log("validating allocation");
        if (this.allocationRemaining === 0) {
            log("all set");
            // all set
            dojo.removeClass(this.domNode, "vote-question-error");
            return true;
        } else if (this.allocationRemaining < 0) {
            log("too much allocated");
            dojo.attr(this.voteQuestionErrorText, "innerHTML", config.app.negativeAllocationErrorText);
            dojo.addClass(this.domNode, "vote-question-error");
            
            // too much allocated, show negative-allocation-error text
            return false;
        } else if (this.allocationRemaining == this.allocationTotal) {
            log("nothing allocated");
            // nothing allocated, show no-vote-error-text
            dojo.attr(this.voteQuestionErrorText, "innerHTML", config.app.noAllocationErrorText);
            dojo.addClass(this.domNode, "vote-question-error");
            return false;
        } else {
            log("some allocated");
            // remaining funds
            dojo.removeClass(this.domNode, "vote-question-error");
            return window.confirm("You still have funds remaining, vote anyways?");
        }
        return false;
    },
    
    setupLocationValidators: function(){
    
        this.locationInput.regExp = config.app.locationRegex;
        this._eventConnections.push(dojo.connect(this.locationInput, "onBlur", this.voteForm.validate));
        this.locationInput.invalidMessage = this.invalidLocationMessage;
        
        // TODO: setup validators for allocation pollmap?
    
        // setup validator for text field
        //        this.locationInput.validator = this.locationValidatorFactory();
        //        this._eventConnections.push(dojo.connect(this.locationInput, "onkeyup", this, this.validateForm));
    },
    
    setupAutocomplete: function(){
        log("setting up autocomplete");
        this.autocompleteDataStore = new esri.mappingcenter.data.AGSAutoCompleteDataStore({
            url: config.app.autocompleteService,
            idField: config.app.locationField, // the field to set as the field.value
            queryField: config.app.locationDisplayField // the field to match against the entered value, should be an easily-readable, diacritic-free place name
        });
    },
    
    // sets up autocomplete for a given question, storing references to all its stuff in the config.app.question object itself?
    setupQuestionAutocomplete: function(question) {
    	log("setting up autocomplete for question "+question);
    	question.autocompleteDataStore = new esri.mappingcenter.data.AGSAutoCompleteDataStore({
    		url: question.autocompleteService,
    		idField: question.autocompleteIDField || "field",
    		queryField: question.autocompleteQueryField || "shortname"
    	});
    },
    /**
     * Return a generic location validator that uses whatever fields were specified here/in the config
     */
    locationValidatorFactory: function(){ // not in use
        //        var ret = false;
        return dojo.hitch(this, function(value, constraints){ // workaround so we can access widget variables from validator function (this.locationMinLength etc...)
            //            if (this.lastLocationValid && value == this.lastLocation) { //
            //                this.lastLocationValid = true;
            //            } else {
            //                this.lastLocationValid = false; // use this to store the current status once we've checked it
            //            }
            //            this.lastLocation = value;
            
            
            if (value.length < this.locationMinLength || value.length > this.locationMaxLength) {
                return false;
                //                this.lastLocationValid = false;
            } else {
                return true;
                // do server validation
                //                this.validating = true;
                //                this.interval = setInterval(dojo.hitch(this, function(){
                //                    log("validating");
                //                    if (!this.validating) {
                //                        log("Clearing interval");
                //                        clearInterval(this.interval);
                //                    }
                //                }), 20);
                //                return this.lastLocationValid;
            
            }
            // returns nothing, which == fail
        
        });
    },
    
    
    /**
     * Load the widget styles.
     */
    loadCSS: function(){
        /** standard css loading code **/
        var css = [dojo.moduleUrl("esri.pollmap", "css/votewindow.css?v=1")];
        var head = document.getElementsByTagName("head").item(0), link;
        for (var i = 0, il = css.length; i < il; i++) {
            link = document.createElement("link");
            link.type = "text/css";
            link.rel = "stylesheet";
            link.href = css[i].toString();
            head.appendChild(link);
        }
    },
    
    /**
     * Setter for this.validating
     * @param {boolean} value
     */
    setUpdating: function(/*boolean*/value){
        if (value === true) {
            this.updating = true;
            dojo.addClass(this.domNode, "updating");
        } else if (value === false) {
            this.updating = false;
            dojo.removeClass(this.domNode, "updating");
        }
    },
    
    onSubmit: function(){
        log("onSubmit");
        if (this.updating) {
            log("Nice try, this isn't Chicago!");
            return;
        }
        this.setUpdating(true);
        log(this);
        if (this.validateForm()) { // calls all built in validators
            var query = new esri.tasks.Query();
            query.where = this.locationField + " = '" + this.locationInput.value + "'"; // build the where clause using the location field specified in the config
            query.returnGeometry = false;
            //                log(query);
            // TODO: create loading graphic for this
            
            if (config.app.locationMode == "postal") { // postal code 
                this.featureLayer.queryCount(query, dojo.hitch(this, function(obj){ // TODO: switch to querytask
                    if (obj > 0) {
                        log("Valid location");
                        this.sendVotes();
                    } else {
                        this.locationInput.displayMessage(this.invalidLocationMessage);
                        this.setUpdating(false);
                    }
                    
                }), function(err){
                    log("Error validating postal code" + dojo.toJson(err));
                    this.setUpdating(false);
                });
            } else if (config.app.locationMode == "city") { // location already validated if we got this far
                this.sendVotes();
            }
        } else {
            //window.alert("Please select at least one team, and enter a valid ZIP code to vote.");
            this.setUpdating(false);
            log("Invalid form, waiting for resubmission to vote");
        }
        
        
    },
    
    
    /**
     * Validate the form and build the this.votes.votes object TODO make 
     */
    validateForm: function(){
        log("Validating Form");
        if (this.voteForm.validate()) {
            var votes = [];
            if (config.app.questionMode == "allocation") {
                if (this.isAllocationValid()) {
                    // build votes object
                    
                    dojo.forEach(this.allocationInputs, function(input){
                        if (!isNaN(input.value)) {
                            votes.push(input.name + " " + input.value);
                        }
                        
                    }, this);
                    this.votes.votes = votes.join("; ");
                    if (votes.length == 1){
                        this.votes.votes += "; ";
                    }
                    log("Votes: " + this.votes.votes);
                    return true;
                } else {
                    return false;
                }
            } else if (config.app.questionMode == "autocomplete") {
            	// do stuff
            	dojo.forEach(this.questionInputs, function(input){
            		if (input.value){
            			votes.push(input.value);
            		}
            	});
            	if (votes.length){
            		this.votes.votes = votes.join(" ");
            		return true
            	} else {
            		return false
            	}
            	
            	
            } else {
                dojo.forEach(dojo.query(".crirHidden"), function(o){ // new vote harvesting code, dependent on .crir stuff
                    if (o.checked) {
                        votes.push(o.value);
                    }
                });
                if (votes.length) {
                    this.votes.votes = votes.join(" ");
                    return true;
                } else {
                    log("NO VOTES!");
                    dojo.set(this.voteQuestionErrorText, "innerHTML", config.app.noVotesErrorText);
                    dojo.addClass(this.domNode, "vote-question-error");
                    return false;
                }
            }
            
        } else {
            // message should show up automatically
            return false;
        }
        
    },
    showVoteErrorDialog: function(text){
        var d = new dijit.Dialog({
            content: "<div id='vote-error-dialog'>" + text + "</div>"
        });
        d.show();
        dojo.fadeOut({
            delay: 1000,
            node: "vote-error-dialog",
            onEnd: function(){
                d.hide();
            }
        }).play();
    },
    
    onVoteSuccess: function(){
        this.setUpdating(false);
        if (!!config.app.isPaneUI) {
            log("VoteWindow: Vote Success detected");
            dojo.addClass(this.domNode, "vote-success");
        } else {
            this.onDialogClose();
        }
        
        
    },
    onVoteError: function(){
        this.setUpdating(false);
        log("VoteWindow: Vote Error detected");
        dojo.addClass(this.domNode, "vote-error");
    },
    
    onDialogClose: function(){
        log(this);
        this.dialog.onCancel();
        log("VoteWindow dialog closed");
        dojo.publish("votes/close");
    },
    
    voteComplete: function(){
    
        //        window.setTimeout(dojo.hitch(this, function(){
        //            this.dialog.hide();
        //        }), 5000);
    
    },
    
    sendVotes: function(){
        this.setUpdating(true);
        log("Publishing votes");
        if (typeof this.locationInput.value === "string") {
            this.votes.location = this.locationInput.value.toUpperCase(); // upper-case the value, just for consistency    
        } else {
            this.votes.location = this.locationInput.value;
        }
        this.votes.uid = ""; // main app will set this before submitting the votes to the server
        log(this.votes);
        dojo.publish("votes/submit", [this.votes]);
        
    },
    
    refresh: function(){
        //        log(dojo.getComputedStyle(this.dialog.domNode).left);
        //        log(dojo.getComputedStyle(this.dialog.domNode).right);
        this.dialog.layout();
        //        log(dojo.getComputedStyle(this.dialog.domNode).left);
        //        log(dojo.getComputedStyle(this.dialog.domNode).right);
    },
    destroy: function(){
        dojo.forEach(this._eventConnections, function(handle){
            dojo.disconnect(handle);
        });
    }
    
});


dojo.require("esri.tasks.geometry");
// dojo.require("esri.virtualearth.VEGeocoder");
dojo.require("esri.tasks.locator");
/**
 * Geocoder
 * updated to remove all bing geocoding
 */
dojo.declare("esri.pollmap.widgets.Geocoder", [dijit._Widget], {
    spatialReference: "",
    geometryService: null,
    veGeocoder: null,
    bingKey: "",
    spatialReference: null,
    lastGeocodeResult: null,
    lastProjectResult: null,
    locator: null,
    
    /**
     * Constructor
     * @param {Object} args
     */
    constructor: function(/* Object */args){
        log("Building Geocoder");
        dojo.safeMixin(this, args); // mixin passed args
        if (typeof config == "object") {
        	
            /*this.geometryService = new esri.tasks.GeometryService(config.app.geometryService);
            this.bingKey = config.app.bingKey;*/
           this.locatorService = config.app.locatorService;
           this.spatialReference = config.app.spatialReference;
        } else {
            log("ERROR: Can't geocode without a config file, unless you passed in the params...");
        }
        
		this.locator = new esri.tasks.Locator(this.locatorService);
		this.locator.setOutSpatialReference(this.spatialReference);
        // this.veGeocoder = new esri.virtualearth.VEGeocoder({
            // bingMapsKey: this.bingKey
        // });
        dojo.subscribe("geocode", dojo.hitch(this, this.geocode));
        
        dojo.subscribe("geocode/zoom", dojo.hitch(this, function(data){
            log("Geocode and Zoom!");
            this.geocode(data, function(point){
                log("Sending to zoom");
                var params = {
                    point: point // the point returned by the geocoder. TODO: use bestExtent
                };
                if (typeof data.map != "undefined") {
                    param.map = data.map; // if a map reference has been passed, add it to the params
                }
                log(params);
                // if no map param, then centerAndZoom will default to megaMap
                dojo.publish("mapCenterZoom", [params]);
            });
            
            
        }));
    },
    
    geocode: function(data, callback){
    
        var location = {};
        
        if (typeof data == "object") {
            location.SingleLine = data.location;
        } else if (typeof data == "string") {
            location.SingleLine = data;
        } else {
            throw new Error("ERROR doing geocode, invalid input");
        }
        
        
        log("Doing geocode: " + dojo.toJson(data));
        
        this.locator.addressToLocations(location).then(function(result){
        	log("geocode complete");
        	if (result.length && result[0].location){
        		callback && callback(result[0].location);
        	}
        }, function(err){
        	err(err);
        });
        
        // this.veGeocoder.addressToLocations(location, dojo.hitch(this, function(results){
            // log("Geocoding complete");
            // log(results);
            // if (results.length > 0) {
                // this.lastGeocodeResult = results[0];
//                 
                // log("Projecting top candidate");
                // log(this.spatialReference);
//                 
                // try {
                    // log(results[0].location);
                    // results[0].location.setSpatialReference(new esri.SpatialReference({
                        // "wkid": 4326
                    // }));
                    // this.geometryService.project([results[0].location], this.spatialReference, dojo.hitch(this, function(results){
                        // if (results.length > 0) {
                            // this.lastProjectResult = results[0];
                            // log("Projection successful");
                            // log(results);
                            // dojo.publish("geocode/done", [results[0]]);
                            // callback && callback(results[0]);
                        // } else {
                            // log("No results");
                        // }
//                         
                    // }), function(err){
                        // log("PROJECTION ERROR!");
                        // throw new Error("Error projecting geocode result: " + dojo.toJson(err));
                    // });
                // } catch (e) {
                    // log("catching projection error");
                    // log(e);
                // }
            // } else {
                // log("Nothing found for " + dojo.toJson(data));
            // }
        // }), function(err){
            // log("GEOCODING ERROR!");
            // throw new Error("Geocoding Error: " + dojo.toJson(err));
        // });
    }
});
/**
 * A simple geocode view
 */
dojo.declare("esri.pollmap.widgets.GeocodeView", [dijit._Widget, dijit._Templated], {
    templateString: dojo.cache(appDir, "js/esri/pollmap/templates/GeocodeView.html"),
    _eventConnections: null,
    constructor: function(){
    	this._eventConnections = [];
        this.loadCSS();
    },
    
    postCreate: function(){
        if (typeof config != "undefined" && typeof config.app.geocodeViewPrompt != "undefined") {
            this.geocodeViewInput.value = config.app.geocodeViewPrompt;
        }
        this._eventConnections.push(dojo.connect(this.geocodeViewInput, "onClick", this.onInputClick));
        this._eventConnections.push(dojo.connect(this.geocodeViewInput, "onKeyDown", this, this.onInputKeyDown));
    },
    onSubmit: function(){
        //        log("onSubmit");
        dojo.publish("geocode/zoom", [this.geocodeViewInput.value]);
    },
    onInputKeyDown: function(evt){
        //        log("onInputKeyDown");
        
        if (evt.keyCode == 13) { // if user pressed enter
            this.onSubmit();
        }
    },
    onInputClick: function(evt){
        if (evt.target.value == config.app.geocodeViewPrompt) {
            evt.target.select();
        }
    },
    /**
     * Load the widget styles.
     */
    loadCSS: function(){
        /** standard css loading code **/
        var css = [dojo.moduleUrl("esri.pollmap", "css/geocodeview.css")];
        var head = document.getElementsByTagName("head").item(0), link;
        for (var i = 0, il = css.length; i < il; i++) {
            link = document.createElement("link");
            link.type = "text/css";
            link.rel = "stylesheet";
            link.href = css[i].toString();
            head.appendChild(link);
        }
    },
    destroy: function(){
        dojo.forEach(_eventConnections, function(handle){
            dojo.disconnect(handle);
        });
    }
    
});

/**
 * This widget listens for mapCenterZoom messages, then pans and zooms the map to the attached locatoin and level
 */
dojo.declare("esri.pollmap.widgets.MapCenterZoomController", [dijit._Widget], {
    zoomLevel: "", // option to pass in a custom zoom level
    //    _level: "",
    constructor: function(/* Object */args){
        log("Building MapCenterZoomController: " + args);
        dojo.safeMixin(this, args);// mixin passed args
        if (!this.zoomLevel && typeof config == "object" && typeof config.app.geocodeZoomLevel == "number") { // if config file exists
            log("Setting zoom level to config value of " + config.app.geocodeZoomLevel);
            this.zoomLevel = config.app.geocodeZoomLevel; // try to get zoomLevel from config file
        } else {
            log("Setting default geocode zoom level");
            this.zoomLevel = 10; // just pick one
        }
        
        
        dojo.subscribe("mapCenterZoom", this, function(data){
            log("MapCenterZoomController: mapCenterZoom message detected");
            //            var level;
            if (typeof data.map == "undefined") {
                if (megaMap) {
                    data.map = megaMap;
                } else {
                    return; // if no map reference, don't do jack
                }
            }
            if (typeof data.level == "undefined") {
                data.level = this.zoomLevel; // if no level in payload, use value pulled from config during construction
            }
            
            if (typeof data.point != "undefined" && dojo.isObject(data.point)) { // make sure point is passed in and is an object
                if (data.level) {
                    level = data.level;
                } else {
                    data.level = this.zoomLevel;
                }
                log("Zooming and Centering Map to level: " + data.level);
                
                data.map.centerAndZoom(data.point, data.level);
            } else {
                log("Warning: Invalid mapCenterZoom request, must include point!");
            }
        });
    }
});

dojo.require("esri.pollmap.util");
dojo.declare("esri.pollmap.widgets.SummaryController", [dijit._Widget], {
    summaryService: null,
    summaryServiceParams: null,
    fields: "",
    extentUtil: new esri.pollmap.util.ExtentUtil(),
    _attrs: null,
    _lastResult: null,
    _lastResultRaw: null,
    _summarizeTimer: null,
    _didMapPan: false, // try to catch first load?
    _isWaiting: false,
    summarizeDelay: 1000,
    constructor: function(/* Object */args){
        log("Building SummaryController: " + args);
        dojo.safeMixin(this, args);// mixin passed args
        
        // http://www.enterprisedojo.com/2011/05/17/dojo-beginner-gotcha-accidental-static-fields/
        this._attrs = {};
        this._lastResult = [];
        this._lastResultRaw = {};
        
        if (!this.summaryService && config.app.summaryService) { // service passed in via constructor gets used first
            this.summaryService = new esri.tasks.Geoprocessor(config.app.summaryService);
            //            log(this.summaryService);
        } else if (!this.summaryService) {
            throw new Error('Error building Summary Controller, no summary service provided!');
        }
        
        dojo.subscribe("summarize", dojo.hitch(this, this.onSummarize));
        dojo.subscribe("megaMapPanStart", dojo.hitch(this, this.onPanStart));
        dojo.subscribe("megaMapPanEnd", dojo.hitch(this, this.onPanEnd));
        
    },
    onSummarize: function(data){
    
        this.summaryServiceParams = {};
        
        log("Summary request received");
        //        log(data);
        //        console.warn("Setting timer");
        if (data.fields && data.extent) {
        
            // check if request goes outside bounds of maxSummaryExtent
            // if it does, revert to the corresponding maxSummary value
            
            if (config.app.maxSummaryExtent) {
            
            
                if (data.extent.xmin < config.app.maxSummaryExtent.xmin) {
                    data.extent.xmin = config.app.maxSummaryExtent.xmin;
                }
                
                if (data.extent.xmax > config.app.maxSummaryExtent.xmax) {
                    data.extent.xmax = config.app.maxSummaryExtent.xmax;
                }
            }
            //            if (data.extent.ymin < config.app.maxSummaryExtent.ymin) {
            //                data.extent.ymin = config.app.maxSummaryExtent.ymin;
            //            }
            //            if (data.extent.ymax > config.app.maxSummaryExtent.ymax) {
            //                data.extent.ymax = config.app.maxSummaryExtent.ymax;
            //            }
            //            
            
            this._isWaiting = true;
            this._summarizeTimer = setTimeout(dojo.hitch(this, function(){
                log("TIMER COMPLETE, SENDING SUMMARY!");
                this._isWaiting = false;
                this.summaryServiceParams.FEATURE_SET = this.extentUtil.extentToFeatureSet(data.extent);
                this.summaryServiceParams.FIELDS = data.fields;
                // do stuff
                log("executing summary service with fields: "+dojo.toJson(data.fields));
                this.summaryService.execute(this.summaryServiceParams, dojo.hitch(this, function(results){
                    log("Summary service execution successful");
                    log(results);
                    this._lastResultRaw = results;
                    this._lastResult = [];
                    if (results.length && results[0].value.features.length) {
                        this._attrs = results[0].value.features[0].attributes;
                        for (var key in this._attrs) {
                            if (key.indexOf("SUM") > -1) { // if its a sum field ala SUM_DUKE
                                this._lastResult.push({
                                    field: key.substr(4),
                                    value: this._attrs[key]
                                }); // store as just "DUKE"
                            }
                        }
                    } else {
                        log("No features in current extent");
                    }
                    
                    dojo.publish("summarize/result", [this._lastResult]);
                    /* sample response:
                     * dojo.io.script.jsonp_dojoIoScript31._jsonpCallback({"results":[{"paramName":"RESULTS","dataType":"GPRecordSet","value":{"features":[{"attributes":{"Rowid":1,"OBJECTID":0,"FREQUENCY":40791,"SUM_KANSAS":13080,"SUM_LOUISVILLE":24799}}],"exceededTransferLimit":false}}],"messages":[{"type":"esriJobMessageTypeInformative","description":"Executing (Summarize): Script \"Feature Set\" \"KANSAS LOUISVILLE\""},{"type":"esriJobMessageTypeInformative","description":"Start Time: Fri Mar 11 18:53:49 2011"},{"type":"esriJobMessageTypeInformative","description":"Running script Script..."},{"type":"esriJobMessageTypeInformative","description":"Completed script Script..."},{"type":"esriJobMessageTypeInformative","description":"Succeeded at Fri Mar 11 18:53:52 2011 (Elapsed Time: 3.00 seconds)"}]});
                     */
                }), function(err){
                    log("Error running summary service");
                    log(err);
                    // HACK TODO: REMOVE THIS
                    if (!!summaryPane){
                        summaryPane.hide();
                    }
                });
            }), config.app.summarizeDelay);
        }
        
    },
    /**
     * Handles megaMap pan start, if we're waiting for a summarize request, clear the timeout so it doesn't fire
     * @param {Object} data
     */
    onPanStart: function(data){
    
        //        console.warn("SC panstart");
        //        console.warn(this);
        if (this._isWaiting === true) {
            //            console.warn("clearing timer");
            clearTimeout(this._summarizeTimer);
            this._isWaiting = false;
        }
        
    },
    processResults: function(results){
    
    }
});



dojo.require("dojox.charting.Chart2D");
dojo.require("dojox.charting.action2d.Highlight");
dojo.require("dojox.charting.action2d.MoveSlice");
dojo.require("dojox.charting.action2d.Tooltip");
dojo.require("dojox.charting.themes.Tufte");
dojo.require("dojox.charting.widget.Legend");
/**
 * This widget provides a summary view for its associated map
 */
dojo.declare("esri.pollmap.widgets.SummaryPane", [dijit._Widget, dijit._Templated], {
    /*
     * A reference to a map object, used to identify the summary package?
     */
    map: null,
    templateString: dojo.cache(appDir, "js/esri/pollmap/templates/SummaryPane.html"),
    widgetsInTemplate: true,
    summaryChart: null,
    dataStore: null,
    _series: null,
    updating: false,
    question: null,
    fadeIn: null,
    fadeOut: null,
    _eventConnections: null,
    visible: false,
    chartTip: null,
    chartHover: null,
    chartMove: null,
    activeMapFields: null,
    legend: null,
    allocationTotal: 100, // default
    constructor: function(){
        log("constructing summary pane");
        this._series = [];
        //        dojo.safeMixin(this, args);
        
        // http://www.enterprisedojo.com/2011/05/17/dojo-beginner-gotcha-accidental-static-fields/
        this._eventConnections = [];
        this.activeMapFields = [];
        
        this.setupListeners();
        
        this.loadCSS();
        if (config.app.questionMode == "allocation" && config.app.allocationTotal) {
            this.allocationTotal = config.app.allocationTotal;
        }
    },
    loadCSS: function(){
    
        /** standard css loading code **/
        var css = [dojo.moduleUrl("esri.pollmap", "css/summarypane.css?v=1")];
        var head = document.getElementsByTagName("head").item(0), link;
        for (var i = 0, il = css.length; i < il; i++) {
            link = document.createElement("link");
            link.type = "text/css";
            link.rel = "stylesheet";
            link.href = css[i].toString();
            head.appendChild(link);
        }
        
    },
    postCreate: function(){
        this.fadeIn = new dojo.fadeIn({
            node: this.domNode
        });
        this.fadeOut = new dojo.fadeOut({
            node: this.domNode
        });
        log("postcreate");
        
        
        
        this._eventConnections.push(dojo.connect(mapDialog, "onHide", this, this.hide)); // hide the summary pane when the mapDialog is hidden
    },
    show: function(){
        if (!this.isVisible()) {
            this.fadeIn.play();
        }
        mapDialog.layout(); // HACK
    },
    hide: function(){
        if (this.isVisible()) {
            this.fadeOut.play();
        }
    },
    /**
     * Checks if the dialog is currently visible on screen
     */
    isVisible: function(){
        return (dojo.getComputedStyle(this.domNode).opacity > 0);
    },
    /**
     * Sets the current active question using the megaMapOperationalLayer
     */
    setCurrentQuestion: function(){ // sets the current question using the megaMapOperationalLayer
        log("setting current question");
        //    log(megaMapOperationalLayer.url);
        dojo.forEach(config.maps, function(question){
            if (megaMapOperationalLayer.url == question.mapService) {
                this.question = question;
                //                log("Setting current question to "+dojo.toJson(question));
                return;
            }
        }, this);
    },
    
    updateChart: function(){
    
    },
    setupListeners: function(){
        // if showing
        dojo.subscribe("summarize/result", dojo.hitch(this, this.onSummarizeResult));
        dojo.subscribe("summarize", dojo.hitch(this, this.onSummarize));
    },
    
    createSummaryChart: function(){
        log("building chart");
        this.summaryChart = new dojox.charting.Chart2D(this.summaryChartNode);
        this.summaryChart.setTheme(dojox.charting.themes.Tufte);
        //        this.summaryChart.setTheme(dojox.charing.themes.Tufte); // just need the transparent bg
        this.summaryChart.addPlot("default", {
            type: "Pie",
            labels: false,
            fontColor: "#000000",
            radius: 40,
            fixed: true,
            startAngle: -180
            //            fontColor: "#FFFFFF",
            //            radius: 60,
            //            labelOffset: -20
        });
        
        //        this.chartMove = new dojox.charting.action2d.MoveSlice(this.summaryChart, "default");
        //        this.chartTip = new dojox.charting.action2d.Tooltip(this.summaryChart, "default");
        //        this.chartHover = new dojo
        
        this.legend = new dojox.charting.widget.Legend({
            chart: this.summaryChart,
            horizontal: false
        }, this.legendNode);
        
    },
    
    
    
    onSummarizeResult: function(results){
    
        if (!this.summaryChart) {
            this.createSummaryChart();
            //            FB.XFBML.parse(); // enable if using fb like button in summary pane
        
        
        }
        log("activeMapFields & results ");
        log(activeMapFields);
        log(results);
        this.setUpdating(false); // no more loading icon
        this.show();
        
        this.setCurrentQuestion(); // TODO: this should be moved elsewhere
        log(dojo.toJson(results));
        
        if (this.summaryChart.series.length) {
            this.summaryChart.removeSeries("default");
        }
        var totalVotes = 0;
        if (results.length === 0){
            this.hide();
        } else if (this.activeMapFields.length && ((results[0].field) == this.activeMapFields[0] || (results[0].field) == this.activeMapFields[1])) {
        
        
            dojo.forEach(results, function(obj, i){
                totalVotes += obj.value;
            });
            

            // dojo.style(this.loadingNode, {display:"none"})
            dojo.forEach(results, dojo.hitch(this, function(obj, i){
                log(obj.value);
                log(totalVotes);
                this._series[i] = {
                    legend: this.question.values[i].label + " (" + Math.round(100 * obj.value / totalVotes) + "%)",
                    tooltip: this.question.values[i].title,
                    fill: this.question.values[i].color[0],
                    label: this.question.values[i].label,
                    stroke: this.question.values[i].color[1],
                    y: obj.value === 0 ? 0.001 : obj.value // set value to 0.001 if 0 to get around dojo chart bug
                };
            }));
            this.summaryChart.addSeries("default", this._series);
            
        } else {
            log("discarding old summary request");
        }
        
        if (config.app.questionMode == "allocation") {
            this.summaryTitle.innerHTML = config.app.currency + dojo.number.format(totalVotes) + config.app.allocationSummarySuffix; // dojo.number.format accepts locale and other args if you want to change how this is formatted
        } else {
            this.summaryTitle.innerHTML = totalVotes + config.app.voteSummarySuffix;
        }
        
        
        
        
        
        //        var move = new dojox.charting.action2d.MoveSlice(this.summaryChart);
        this.summaryChart.render();
        this.legend.refresh();
        
        
    },
    
    updateSummaryText: function(){
    
    },
    /**
     * Setter for this.updating
     * @param {boolean} value
     */
    setUpdating: function(/*boolean*/value){
        if (value === true) {
            this.updating = true;
            dojo.addClass(this.domNode, "updating");
        } else if (value === false) {
            this.updating = false;
            dojo.removeClass(this.domNode, "updating");
        }
    },
    /**
     * Use for displaying loading animation
     */
    onSummarize: function(){
        log("SummaryPane: Summary request detected");
        this.setUpdating(true);
        // do some loading animation stuff
        // updating = true
        // dojo.style(this.loadingNode, {display:"block"}) 
    },
    /**
     * Disconnect all connections
     */
    destroy: function(){
        dojo.forEach(_eventconnections, function(handle){
            dojo.disconnect(handle);
        });
    }
});

dojo.require("esri.tasks.identify");
/**
 * Handles all the identify stuff in the background, controlled via pub/sub
 */
dojo.declare("esri.pollmap.widgets.IdentifyController", [dijit._Widget], {
    identifyParams: null,
    url: "",
    task: null,
    constructor: function(/*Object*/args){
        log("Building Identify Controller");
        if ("identifyService" in config.app) {
            this.url = config.app.identifyService; // not even gonna fail gracefully here, since you better have one defined!    
        } else {
            err("Error building IdentifyController, please specify identifyService in your config file!");
            return;
        }
        this.task = new esri.tasks.IdentifyTask(this.url);
        this.identifyParams = new esri.tasks.IdentifyParameters();
        this.identifyParams.layerIds = [0];
        this.identifyParams.layerOption = esri.tasks.IdentifyParameters.LAYER_OPTION_ALL;
        this.identifyParams.returnGeometry = true;
        this.identifyParams.tolerance = 3;
        
        dojo.subscribe("identify", dojo.hitch(this, this.onIdentify));
        
    },
    onIdentify: function(args){
        log("IdentifyController: Identify request received");
        log(dojo.toJson(this.identifyParams));
        log(this.task);
        log(dojo.toJson(this.task));
        /*
         * args should have the following properties:
         * geometry
         * extent
         * width
         * height
         */
        this.identifyParams.geometry = args.geometry;
        this.identifyParams.mapExtent = args.extent;
        this.identifyParams.width = args.width;
        this.identifyParams.height = args.height;
        log("IdentifyController: executing identify task");
        log(this.identifyParams);
        log(this.task);
        this.task.execute(this.identifyParams, function(results){
            log("Identify successful");
            log(results);
            dojo.publish("identify/result", [results]);
        }, function(err){
            console.error("Error doing identify " + dojo.toJson(err));
        });
    }
});

/*****
 * Config loader, loads config from either a variable, a file, or a web service and dispatches the appropriate events so the app can continue loading
 */
dojo.declare("esri.pollmap.widgets.ConfigController", [dijit._Widget],{
	method: "", // file, webservice, or jsobj? wtf
	_remoteConfig: null,
	_xhrArgs: null,
	_configService: null,
	_configServiceParams: null, // these are all optional for now, not secure to pass the db server name in plaintext, so might as well hardcode it all
	constructor: function(/*Object*/args){
		log("Config Controller constructing");
		dojo.safeMixin(this, args);
		
		this._remoteConfig = {};
		this._xhrArgs = {
			"url": config.app.configService,
			"handleAs": "JSON",
			"load": this.onConfigLoaded,
			"error": this.onError
		};
		this._configService = {};
		this._configServiceParams = {
			datasource: "",
			tableprefix: ""
		};
		
		// dojo.publish("pollmap/configLoaded", [config]);
		if (config.app.configService){
			this._configService = new esri.tasks.Geoprocessor(config.app.configService); 	
			this._configService.execute(this._configServiceParams, dojo.hitch(this, this._onConfigLoaded));
		} else {
			log("Config service not found");
			dojo.publish("pollmap/configLoaded", [config]); // if no remote config, assume (hope) for local config
		}
		
		
	},
	_onConfigLoaded: function(data){
		remoteConfig = dojo.fromJson(data[0].value); 
		log("Config loaded");
		config.maps = remoteConfig.maps;
		config.questions = remoteConfig.questions;
		dojo.safeMixin(config.app, this._buildAppConfig(remoteConfig.app));
		dojo.publish("pollmap/configLoaded", [config]);
	},
	_onConfigLoadError: function(err){
		throw new Error("Error loading config from server " + dojo.toJson(err));
	},
	_buildAppConfig: function(remoteAppConfig){
		log("building app config");
		var appConfig = {};
		// convert all JSON items into real JS objects, but only for app config
		for (var key in remoteAppConfig){
			var item = remoteAppConfig[key];
			log(key+": "+item);
			appConfig[key] = eval(item);
		}
		return appConfig;
	}
});
