/********************************************************
 * Author: Alex Yule @yuletide unless you don't like it
 * Yes, I know the global namespace is polluted. First JS app!
 * v1.02
 */

/**
 * Full URL to enclosing directory
 */
var baseURL = document.URL.substr(0, document.URL.lastIndexOf("/") + 1);
log("Base URL: " + baseURL);
var appDir = document.URL.substr(document.URL.substr(0, document.URL.lastIndexOf("/")).lastIndexOf("/") + 1, document.URL.lastIndexOf("/") - document.URL.substr(0, document.URL.lastIndexOf("/")).lastIndexOf("/") - 1);
log(appDir);
// TODO: replace with .substring
dojo.require("dijit.layout.BorderContainer");
dojo.require("dijit.layout.ContentPane");
dojo.require("dijit.layout.TabContainer");

dojo.require("dijit.form.Form");
dojo.require("dijit.form.Button");
dojo.require("dijit.form.CheckBox");
dojo.require("dijit.form.ValidationTextBox");
dojo.require("dojo.cookie");
dojo.require("dojo.parser");

dojo.require("esri.map");
dojo.require("esri.layers.FeatureLayer");
dojo.require("esri.layers.agsdynamic");
dojo.require("esri.tasks.gp");
dojo.require("esri.dijit.Popup");
dojo.require("esri.pollmap.widgets");
//dojo.require("fanmap.control.MapCenterZoomController");
var isIE7 = false;
var viewSize = null;
var paneViewSize = null;
/**
 * The number of active, mappable, answerable questions. Used to build the vote UI.
 */
var mapsContainer = null;
var activeQuestions = [];
var mapConfigs = [];
var maps = [];
var panes = [];
var basemaps = [];
var overlays = [];
var mapServices = [];
var paneWidth, paneHeight, panePadding, paneBorderWidth;
var numPanes;
// = config.questions.length;
var featureLayer = null;
var mapsLoaded = 0;
var mapDialog = null;
var megaMap = null;
var megaMapBasemapLayer = null;
var megaMapOverlayLayer = null;
var megaMapOperationalLayer = null;
var userLocation = "";
var userLocationPoint = null;
var activeMapFields = [];
var summaryPane = null;
var uid;
var activeMapIndex;
var _eventConnections = [];
var voteWindow = null;
var mapDialogDirty = true;
var configController = {};
var infoWindow = null;

// tell ie7 they're SOL
if(dojo.isIE == 7) {
	window.alert("Please note this site does not fully support Internet Explorer 7. Please try again using IE8+, Firefox, Opera, Safari or Chrome");
	isIE7 = true;
}

function init() {
	log("Initializing...");
	// dojo.parser.parse();
	dojo.subscribe("pollmap/configLoaded", dojo.hitch(this, function(){
		log("config loaded");
		dojo.parser.parse(); // have dojo parse for widgets
		if(dojo.exists("config.app.theme")) {
			dojo.addClass(dojo.body, config.app.theme);
		}
	
		setupServices();
		// setup the featureLayer if we're in postal mode
		mapsContainer = dojo.byId("mapsContainer");
		loadQuestions();
		// TODO: remove this? only the vote window cares about the questions... -- it can even load the data from the questions table itself?
		loadMaps();
		initListeners();
		initPanes();
		refreshLayout(0);
		initMaps();
		_eventConnections.push(dojo.connect(window, "onresize", refreshLayout));
		_eventConnections.push(dojo.connect(dijit.byId("aboutWindow"), "onLoad", function() {
			if (dojo.exists("FB")){
				FB.XFBML.parse(); // reparse for FB widget in about WIndow	
			}
		}));
		
		viewSize = dojo.window.getBox();
		
		// dojo.parser.parse();
		// things that you want to happen after loading the config and other db tables
		// some hardcoded variable will be used to seed the service request, but everything else
		// will be based on convention.
		// http://server/serviceFolder/data/0 is config?
		// or have some table in there named config at least
	}));

	configController = new esri.pollmap.widgets.ConfigController({});

}

function unload() {
	dojo.forEach(_eventConnections, function(handle) {
		dojo.disconnect(handle);
	});
}

/**
 * Setup the featureLayer
 */
function setupServices() {
	//set up the global services (i.e. feature layer)

	if(!featureLayer && config.app.locationMode == "postal") {
		featureLayer = new esri.layers.FeatureLayer(config.app.featureService);
		// only used for validating postal codes
	}
}

/**
 * Load the questions into activeQuestions
 */
function loadQuestions() {
	dojo.forEach(config.questions, function(question, i) {
		if(question.active) {
			activeQuestions.push(question);
		}
	});
	log(activeQuestions);
}

/** load maps from config and build mapServices array **/
function loadMaps() {
	log("loading maps from config: " + config.maps.length);
	numPanes = config.maps.length;
	dojo.forEach(config.maps, function(mapConfig, i) {
		log("map "+i);
		log(mapConfig);
		mapConfigs[i] = mapConfig;
		mapServices[i] = new esri.layers.ArcGISDynamicMapServiceLayer(mapConfig.mapService);
		if("mapImageFormat" in config.app) {
			mapServices[i].setImageFormat(config.app.mapImageFormat);
		}
	});
}

function initListeners() {
	initVoteListener();
	if(numPanes == 1) {//config.questions.length == 1) {
		dojo.subscribe("votes/close", function() {
			megamapify(0);
			if (dojo.exists("FB")){
				FB.XFBML.parse();				
			}
		});
	}
}

function initPanes() {
	panePadding = config.app.panePadding || 0;
	paneBorder = config.app.paneBorder || "solid #000";
	if (typeof config.app.paneBorderWidth != "undefined"){
		paneBorderWidth = config.app.paneBorderWidth;
	} else {
		paneBorderWidth = 2;
	}
	
	for(var i = 0; i < numPanes; i++) {
		panes.push(dojo.doc.createElement("div"));
		//        panes[i] =
		dojo.attr(panes[i], "class", "pane");
		//        panes[i].setAttribute("class", "pane"); doesn't work in IE7
		panes[i].setAttribute("id", "pane" + i);
		dojo.style(panes[i], {
			"width" : "200px",
			"height" : "300px"
		});
		mapsContainer.appendChild(panes[i]);

	}
}
/**
 * Get the title for a map, add code here to auto-create titles if ya want
 * Otherwise will use mapConfig.title and subtitle
 */
function getTitle(mapConfig) {
	var _val = "";
	if(mapConfig.title) {
		_val = mapConfig.title;
		if(mapConfig.subtitle) {
			_val += "<p class='subtitle'>" + mapConfig.subtitle + "</p>"; // should this be a more semantic tag?
		}
	}
	// some stub code to auto-create titles
	/**if(question.type == "allocation" && question.title) {
	 _val = question.title;
	 if(question.subtitle) {
	 _val += "<p class='subtitle'>" + question.subtitle + "</p>";
	 }
	 } else {
	 dojo.forEach(question.values, function(value, i, arr) {
	 _val += value.title;
	 if(i < arr.length - 1) {
	 _val += config.app.titleCompareText;
	 }
	 });
	 }**/
	return _val;
}

// initialize all the maps
function initMaps() {
	log("Initializing maps");

	dojo.forEach(panes, function(pane, i) {
		//        log("Pane #" + i);
		//        log(mapServices[i]);
		if(mapServices[i]) {
			basemaps[i] = new esri.layers.ArcGISTiledMapServiceLayer(config.app.basemapTiledService);
			overlays[i] = new esri.layers.ArcGISTiledMapServiceLayer(config.app.overlayTiledService, {
				opacity : config.app.labelOpacity
			});

			hoverify(panes[i]);
			focusify(panes[i]);

			//            log(dojo.contentBox(panes[i]));
			maps[i] = new esri.Map("pane" + i, { extent: esri.geometry.fromJson(config.app.defaultExtent.toJson())});

			/*            dojo.connect(maps[i], "onLayerAdd", function(layer){ // set the extent on the pane to the default extent of the operational layer
			 log("layer loaded");
			 if (layer === mapServices[i]) {
			 //                    maps[i].setExtent(layer.initialExtent);
			 log("layers loaded on map"+i);
			 //log(maps[i].extent);
			 //maps[i].setExtent(esri.geometry.fromJson(config.app.defaultExtent.toJson()));
			 }
			 });*/
			maps[i].addLayer(basemaps[i]);
			maps[i].addLayer(mapServices[i]);
			maps[i].addLayer(overlays[i]);

			_eventConnections.push(dojo.connect(maps[i], 'onLoad', this, function(theMap) {
				//                log("maps" + i + " onLoad");
				mapsLoaded++;
				maps[i].disableMapNavigation();
			}));

			dojo.create("div", {
				"class" : "pane-title",
				"innerHTML" : getTitle(mapConfigs[i])
			}, panes[i], 0);
		} else {
			log("Pane disabled");
			dojo.create("div", {
				"class" : "inactiveText",
				"innerHTML" : config.app.inactiveMapLabel
			}, pane);
		}

		//

	});
	if(panes.length == 1) { // if only one map
	}
}

var refreshTimer, aspect;
/**
 * Refreshes the layout
 * @param {Number} interval
 */
function refreshLayout(/* Number */interval) {
	function _refresh() {
		log("Refreshing Panes");
		viewSize = dojo.window.getBox();
		paneViewSize = {
			w : viewSize.w - parseInt(dojo.getComputedStyle(dojo.byId("sidebar")).width, 10),
			h : viewSize.h
		};
		if(panes.length == 1) {
			paneWidth = paneViewSize.w;
			paneHeight = paneViewSize.h;
		} else {
			log("Aspect ratio: " + paneViewSize.w / paneViewSize.h);
			aspect = paneViewSize.w / paneViewSize.h;
			if(aspect > 1.3 && numPanes > 2) {
				// landscape
				paneWidth = Math.floor(paneViewSize.w * 2 / numPanes - 2 * panePadding - 2 * paneBorderWidth);
				paneHeight = Math.floor(paneViewSize.h / 2 - 2 * panePadding - 2 * paneBorderWidth);

			} else {
				// portrait
				paneWidth = Math.floor(paneViewSize.w / 2 - 2 * panePadding - 2 * paneBorderWidth);
				paneHeight = Math.floor(paneViewSize.h * 2 / numPanes - 2 * panePadding - 2 * paneBorderWidth);
			}
		}

		for(var i = 0; i < numPanes; i++) {
			dojo.style(panes[i], {
				"width" : paneWidth + "px",
				"height" : paneHeight + "px",
				"border" : paneBorderWidth + "px " + paneBorder,
				"padding" : panePadding + "px"
			});
			log("width" + paneWidth + "px" + "height" + paneHeight + "px" + "border" + paneBorderWidth + "px " + paneBorder + "padding" + panePadding + "px");
			log(dojo.clone(panes[i]));
			if(mapsLoaded == mapConfigs.length) {
				if(maps[i]) {
					maps[i].resize();
					maps[i].reposition();

				}
			}
		}

		if(megaMap && mapDialog.open) {
			mapDialog.layout();
			resizeMegaMap();
		}
		voteWindow = dijit.byId("voteWindow");
		if(voteWindow && voteWindow.dialog.open) {
			voteWindow.refresh();
		}
	}

	if(interval === 0) {
		_refresh();
	} else if( typeof interval == "undefined") {
		interval = 100;
	}
	if(interval) {
		refreshTimer = setTimeout(_refresh, interval);
	}

}

/**
 * Saves user location, adds UID to vote object, then publishes vote message
 * @param {Object} votes
 */
function sendVotes(votes) {

	log("Saving user location");
	if(config.app.locationMode == "postal") {
		userLocation = votes.location;
		// then votes.location is consumable by geocoder
	} else if(config.app.locationMode && config.app.locationMode == "city") {
		if(voteWindow.locationInput.item) {
			userLocation = voteWindow.locationInput.item[config.app.locationDisplayField];
			log("User location set to " + userLocation);
		}

	}

	if(this.getUID()) {
		votes.uid = this.getUID();
	}

	log(votes);
	log("Sending votes");
	var voteService = new esri.tasks.Geoprocessor(config.app.voteService);
	voteService.execute(votes, function(result) {
		log("vote successfully submitted");
		//        log(result);
		dojo.publish("votes/success");

	}, function(err) {
		dojo.publish("votes/error"); // are we catching this?
		err("VOTING ERROR");
		log(err);
	});
}

/**
 * Get the user's id, either from cookies, or generated randomly
 */
function getUID() {
	// do facebook stuff first
	if(!uid) {
		if(!dojo.cookie(config.app.cookieName)) {
			log("setting UID cookie");
			uid = Math.floor(Math.random() * 10000000001);
			//random UID. Good enough for our purposes? Or store a value, then increment?
			dojo.cookie(config.app.cookieName, uid);
		} else {
			log("reading UID cookie");
			uid = dojo.cookie(config.app.cookieName);
			log("UID " + uid);
		}

	}
	return uid;

}

/** listeners and other event handlers  and their initializers **/

function initVoteListener() {
	dojo.subscribe("votes/submit", dojo.hitch(this, sendVotes));
}

function hoverify(pane) {
	_eventConnections.push(dojo.connect(pane, 'onmouseenter', function() {
		dojo.addClass(this, 'pane-hover');
	}));
	_eventConnections.push(dojo.connect(pane, 'onmouseleave', function() {
		dojo.removeClass(this, 'pane-hover');
	}));
}

function focusify(pane) {
	_eventConnections.push(dojo.connect(pane, "onclick", function(evt) {
		//        log(dojo.indexOf(panes, this)); // the pane index
		megamapify(dojo.indexOf(panes, this));
	}));
}

function megamapify(index) {// pane index
	activeMapIndex = index;
	log("MEGAMAPIFY! " + index);
	activeMapFields = [];
	dojo.forEach(mapConfigs[index].values, function(value) {
		log("Populating activeMapFields " + value.value);
		activeMapFields.push(value.value);
	});
	if(!mapDialog) {
		mapDialog = new dijit.Dialog({
			"class" : "map-dialog mega-map",
			"draggable" : false,
			"content" : "<div class='map-dialog-map' id='megaMapNode' style='" + "width:" + (dojo.window.getBox().w - 2 * config.app.mapDialogPadding) + "px; height:" + (dojo.window.getBox().h - 2 * config.app.mapDialogPadding) + "px;'></div>" + "<div id='megaMapClose' class='closeIcon'></div>" + "<div id='summaryPaneNode'></div>" + "<div id='megaMapHeader'></div>" + "<div id='megaMapUpdating'></div>" + "<div id='megaMapTitle'></div>" + "<div class='zoom-button'><a href='#' onclick='megaMap.setExtent(config.app.fullExtent)'>All<br/>Votes</a></div>" + config.app.megaMapSocialWidgetsHTML
		});

		mapDialog.show();
		
		if (dojo.exists("FB")){		
			FB.XFBML.parse(); // reparse for FB widget. TODO: Is this redundant?  
		}
		dojo.fadeOut({
			node : mapDialog.domNode
		}).play();

		var closeBtn = dojo.byId("megaMapClose");
		_eventConnections.push(dojo.connect(closeBtn, "onclick", function() {
			mapDialog.onCancel();
		}));
		summaryPane = new esri.pollmap.widgets.SummaryPane();
		summaryPane.activeMapFields = activeMapFields;

		mapDialog.domNode.appendChild(summaryPane.domNode);

		createMegaMap();
		log("Map Dialog created: " + dojo.getComputedStyle(mapDialog.domNode).bottom);

		if(userLocation) {// if this is the first load of the map dialog, zoom to user location
			log("Zooming to user location " + userLocation);
			setTimeout(function() {
				dojo.publish("geocode/zoom", [userLocation]);
			}, config.app.geocodeZoomTimeout);
		}
	} else {
		summaryPane.activeMapFields = activeMapFields;
		mapDialog.show();
		resizeMegaMap();
	}

	//    log("megaMapOperationalLayer "+megaMapOperationalLayer);
	if(megaMapOperationalLayer) {
		megaMap.removeLayer(megaMapOperationalLayer);
		// if it exists, remove it
	}
	megaMapOperationalLayer = new esri.layers.ArcGISDynamicMapServiceLayer(mapServices[index].url);
	if("mapImageFormat" in config.app) {
		megaMapOperationalLayer.setImageFormat(config.app.mapImageFormat);
	}

	dojo.byId("megaMapTitle").innerHTML = this.getTitle(mapConfigs[index]);
	//config.questions[index]);
	// set the title on the megamap
	megaMap.addLayer(megaMapOperationalLayer, 1);
	_eventConnections.push(dojo.connect(megaMap, "onClick", onMegaMapClick));
	_eventConnections.push(dojo.connect(megaMap, "onUpdateStart", onMegaMapUpdateStart));
	_eventConnections.push(dojo.connect(megaMap, "onUpdateEnd", onMegaMapUpdateEnd));
	dojo.subscribe("identify/result", onIdentifyResult);
	dojo.subscribe("identify/submitted", onIdentifySubmitted);

	log("inspecting mapDialog");
	log(dojo.style(mapDialog.domNode, "top"));
	log(dojo.style(mapDialog.domNode, "bottom"));
	checkMapDialogLayout();
	refreshLayout(200);
	// just in case
}

function createMegaMap() {
	if(megaMap) {
		return;
		// if it already exists, don't create it again
	}

	// mega map
	megaMapBasemapLayer = new esri.layers.ArcGISTiledMapServiceLayer(config.app.basemapTiledService);
	megaMapOverlayLayer = new esri.layers.ArcGISTiledMapServiceLayer(config.app.overlayTiledService, {
		opacity : config.app.labelOpacity // TODO: put in defaults for values like this
	});
	
	
	infoWindow = new esri.dijit.Popup({
          fillSymbol: new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_SOLID, 
          	new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, 
          		new dojo.Color([255,0,0]), 2), 
          		new dojo.Color([255,255,0,0.25]))
        }, dojo.create("div"));
	
	megaMap = new esri.Map("megaMapNode", {
		extent : esri.geometry.fromJson(config.app.defaultExtent.toJson()),
		infoWindow: infoWindow
	});

	_eventConnections.push(dojo.connect(megaMap, "onExtentChange", function(extent) {
		log("MEGAMAP extent change. Sending summarize request");
		dojo.publish("summarize", [{
			extent : esri.geometry.fromJson(extent.toJson()),
			fields : activeMapFields.join(" ")
		}]);
	}));

	_eventConnections.push(dojo.connect(megaMap, "onPanStart", function(_extent, _point) {
		dojo.publish("megaMapPanStart");
	}));

	megaMap.addLayer(megaMapBasemapLayer);
	megaMap.addLayer(megaMapOverlayLayer);
}

function resizeMegaMap() {
	log("New size = ", (viewSize.w - 2 * config.app.mapDialogPadding), (viewSize.h - 2 * config.app.mapDialogPadding));

	dojo.style(megaMap.container, {
		"width" : parseInt((viewSize.w - 2 * config.app.mapDialogPadding), 10) + "px",
		"height" : parseInt((viewSize.h - 2 * config.app.mapDialogPadding), 10) + "px"
	});

	megaMap.resize();
	if(mapDialog) {
		mapDialog.layout();
	}
	megaMap.reposition();
}

function onMegaMapClick(evt) {
	   log("mega map clicked, sending identify request");
	   var _params = {};
	   _params.geometry = evt.mapPoint;
	   _params.extent = megaMap.extent;
	   _params.width = megaMap.width;
	   _params.height = megaMap.height;
	   _params.screenPoint = evt.screenPoint; // just in case
	   dojo.publish("identify", [_params]);
}

var megaMapTop, megaMapBottom;
function checkMapDialogLayout() {
	log("checking map dialog");
	if(mapDialogDirty) {
		megaMapTop = dojo.style(mapDialog.domNode, "top");
		megaMapBottom = dojo.style(mapDialog.domNode, "bottom");
		if( typeof megaMapTop == "string" && megaMapTop.indexOf("px") > 0) {
			megaMapTop = megaMapTop.substring(0, megaMapTop.indexOf("px"));
			log(megaMapTop);

		}

		if( typeof megaMapBottom == "string" && megaMapBottom.indexOf("px") > 0) {
			megaMapBottom = megaMapBottom.substring(0, megaMapBottom.indexOf("px"));
			log(megaMapBottom);
		}
		if(megaMapTop > config.app.mapDialogPadding + 5 || megaMapTop < 0 || megaMapBottom < 0) {
			log("ALIGNMENT ERROR, REFRESHING");
			mapDialog.layout();
			setTimeout(dojo.hitch(this, function() {
				checkMapDialogLayout();
				dojo.fadeIn({
					node : mapDialog.domNode,
					duration : 500
				}).play();
			}), 100);
			return false;
		} else {
			log("dialog ok");
			mapDialogDirty = false;
			dojo.fadeIn({
				node : mapDialog.domNode,
				duration : 500
			}).play();
			return true;

		}
	} else {
		//        log("map dialog not dirty");
	}

}

function onMegaMapUpdateStart(evt) {
	log("inspecting mapDialog - map updatestart");
	log(dojo.style(mapDialog.domNode, "top"));
	log(dojo.style(mapDialog.domNode, "bottom"));
	dojo.addClass(mapDialog, "updating");
	checkMapDialogLayout();
}

function onMegaMapUpdateEnd(evt) {
	dojo.removeClass(mapDialog, "updating");
	log("inspecting mapDialog - map updateend");
	log(dojo.style(mapDialog.domNode, "top"));
	log(dojo.style(mapDialog.domNode, "bottom"));
	checkMapDialogLayout();
}

/**
 * Gets called when 
 */
function onIdentifyResult(results) {
	log("App: Identify Result received");
	log(results);
}

/**
 * Gets called when identify is submitted
 * @param args An array of arguments [deferred, screenPoint] where deferred is the Deferred returned by 
 *  identifyTask.execute, and screenPoint is the screenPoint where the user clicked
 */
function onIdentifySubmitted(params) {
	log("App: Identify Submitted");
	log(params);
	if (megaMap){
		try{
		megaMap.infoWindow.setFeatures([params.deferred])
		} catch(e){
			err(e);
		}		
		megaMap.infoWindow.show(params.screenPoint);
	}
}

dojo.addOnLoad(init);
dojo.addOnWindowUnload(unload);
