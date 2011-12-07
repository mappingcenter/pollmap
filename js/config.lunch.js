/**
 * @author alex6294
 * main cloud web server: 50.17.251.144
 * config schema version 2.0
 * // added theme
 */

// strings
var webMercator = new esri.SpatialReference({
	"wkid" : 102100
})
var winkel = new esri.SpatialReference({
	"wkt" : 'PROJCS["World_Winkel_Tripel_NGS",GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137.0,298.257223563]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]],PROJECTION["Winkel_Tripel"],PARAMETER["False_Easting",0.0],PARAMETER["False_Northing",0.0],PARAMETER["Central_Meridian",-96.0],PARAMETER["Standard_Parallel_1",50.467],UNIT["Meter",1.0]]'
});

var baseSR = webMercator;

var config = {
	app : {
		appTitle : "PollMap: Lunch Habits Edition",
		version : "1.2a2", // app version
		debug : true,
		locationMode : "postal", // "city" or "postal" REQUIRED
		questionMode : "radio", //"autocomplete" or "allocation" or "radio" eventually may allow this on a per-question basis, but not now REQUIRED
		cookieName : "LunchHabits2011UID", // the name of the cookie used to track voters
		theme : "slate", //"foam", // slate, foam or... TODO: create theming system :D CSS framework?

		basemapTiledService : "http://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer", //"http://pollmap.esri.com/ArcGIS/rest/services/Canvas/World_EarthDay_0419_BASE/MapServer",
		overlayTiledService : "http://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer", //"http://pollmap.esri.com/ArcGIS/rest/services/Canvas/World_EarthDay_0419_REFERENCE/MapServer",
		geometryService : "http://saratoga/arcgis/services/LunchHabits/Geometry/GeometryServer",
		featureService : "http://saratoga/ArcGIS/rest/services/LunchHabits/PostalCodes/MapServer/0", //"http://niflheim.esri.com/ArcGIS/rest/services/earthday/earthday_places/MapServer/0",//"http://pollmap.esri.com/ArcGIS/rest/services/Zips_Winkel/MapServer/0", use for zip validation
		/**
		 * The service to use for autocomplete, required if locationMode == "city"
		 */
		autocompleteService : "", //"http://pollmap.esri.com/ArcGIS/rest/services/Earthday/earthday_places_autocomplete/MapServer/0",
		summaryService : "http://saratoga.esri.com/ArcGIS/rest/services/LunchHabits/Tools/GPServer/Summarize", //"http://50.17.250.45/ArcGIS/rest/services/earthday/Vote/GPServer/Summarize",
		voteService : "http://saratoga.esri.com/ArcGIS/rest/services/LunchHabits/Tools/GPServer/Vote", //"http://50.17.250.45/ArcGIS/rest/services/earthday/Vote/GPServer/Vote",
		configService : "",//http://niflheim.esri.com/ArcGIS/rest/services/collegefootball/tools/GPServer/Config",
		identifyService : "http://saratoga/ArcGIS/rest/services/LunchHabits/PostalCodes/MapServer/0", // "http://pollmap.esri.com/ArcGIS/rest/services/Zips_Poly_Winkel/MapServer/0",
		locationField : "POSTAL", // This should not change. old values: "GEONAMEID", "POSTAL" // the unique ID for each place record
		locationLabelField : "", //"FIRST_DISP_NAME", // just the city name
		locationDisplayField : "", //"DISP_NAME", // the display name, used for autocomplete, the entire country, province etc...
		isGpAsynch : false, // are the services asynchronous? shouldn't be.

		defaultExtent : new esri.geometry.Extent(-18000498, 1675552, -5115899, 7765267, webMercator), // north america: new esri.geometry.Extent(-3280498, 2158621, 2995899, 7065267, winkel), safe world: new esri.geometry.Extent(-13531188, -1575214, 4060334, 8952304, baseSR),
		fullExtent : new esri.geometry.Extent(-22424404, 1300000, -2856071, 9861354, webMercator), // world: new esri.geometry.Extent(-72516023, -33265069, 72516023, 33265069, baseSR),
		spatialReference : baseSR,

		// formatting
		labelOpacity : 1, // set to 0.8 when vote count is low
		uidField : "COOKIE",
		currency : "$", // used for money allocation questions
		bgColor : "#D0CFD4", // the main theme bg color, used for various stylings (sidebar, map component, etc) [UNUSED]
		allocationTotal : 100, // if you want to customize this...
		isPaneUI : false, // set to false disable all the pane stuff REQUIRED

		// other crap
		bingKey : "An6SgqsInViLijKakhLhIFdFzEPk1uv_HRoW0fqXBekZVdl9bgtoVedIsOvnT6jF",
		geocodeZoomLevel : 8, //5, //1:577k THIS MUST BE A NUMBER, not a string
		inactiveMapLabel : "",

		// optional overrides:
		locationInputLabelText : "", // override here if desired, otherwise will set based on locationMode
		invalidLocationMessage : "", // override here if desired, otherwise will set based on locationMode

		// stuff not likely to change
		panePadding : 0,
		paneBorderWidth : 2,
		paneBorder : "solid #000",

		// messages
		noVotesErrorText : "Please vote at least once!",
		noAllocationErrorText : "Please allocate funds to at least one item!",
		negativeAllocationErrorText : "You have allocated too much!",
		geocodeViewPrompt : "Enter postal code",

		locationRegex : "(^\\d{5}$)|(^[ABCEGHJKLMNPRSTVXYabceghjklmnprstvxy]{1}\\d{1}[A-Za-z]{1})", // *\\d{1}[A-Z]{1}\\d{1}$)", // http://geekswithblogs.net/MainaD/archive/2007/12/03/117321.aspx
		titleCompareText : "", // " or ", " vs. "  
		summarizeDelay : 1000,
		mapDialogPadding : 30,
		geocodeZoomTimeout : 1000,
		mapImageFormat : "png32" //must be a valid image format for server, either png8 png24 or png32 recommended
		/**
		 * The extent beyond which summary requests fail
		 */
		/*maxSummaryExtent: new esri.geometry.Extent({
		"xmin": -13679602, // North America winkel: -5775402,
		"ymin": 1850427, // not used
		"xmax": 14418647, // North America winkel: 3489988,
		"ymax": 9481900, // not used
		"spatialReference": baseSR
		}),*/
		/**
		 * The array of app questions, each a JS Object with an array of values, a type, and a mapService
		 * Type can be either "autocomplete" (or undefined) for classic one-option voting or "allocation" to divide $100 among the options
		 * Possible future types: "rank"
		 */
	},
	questions : [{
		type : "radio", // "radio" or "allocation" or "autocomplete",
		label : "Gender: ", // required for "autocomplete" question type
		//inputType : "radio", // "autocomplete" (or "dropdown" [unimplemented]) only applies if using the "autocomplete" question type
		//autocompleteService : "http://niflheim/ArcGIS/rest/services/collegefootball/data/MapServer/1", // the choices to use when populating the autocomplete
		//autocompleteQueryField : "shortname",
		//autocompleteIDField : "field",
		title : "Gender",
		subtitle: "About You:",
		shuffle : false, // whether to randomize the order of the questions on load [unimplemented]
		active : true,
		values : [{
		label : "Male",
		value : "CHOICE01",
		title : "Male"
		},{
		label : "Female",
		value : "CHOICE02",
		title : "Female"			
		}]
	},{
		type : "radio", // "radio" or "allocation" or "autocomplete",
		label : "Age range: ", // required for "autocomplete" question type
		inputType : "autocomplete", // "autocomplete" (or "dropdown" [unimplemented]) only applies if using the "autocomplete" question type
		title : "Age range: ",
		// subtitle: "Dot color represents majority vote in that city",
		shuffle : false, // whether to randomize the order of the questions on load [unimplemented]
		active : true,
		values : [{
		label : "Under 18",
		value : "CHOICE03",
		title : "Under 18"
		},{
		label : "18 - 25",
		value : "CHOICE04",
		title : "18 - 25"			
		},{
		label : "26 - 40",
		value : "CHOICE05",
		title : "26 - 40"			
		},{
		label : "41 - 65",
		value : "CHOICE06",
		title : "41 - 65"			
		},{
		label : "Over 65",
		value : "CHOICE07",
		title : "Over 65"			
		}]
	},{
		type : "radio", // "radio" or "allocation" or "autocomplete",
		label : "Where did you eat?", // required for "autocomplete" question type
		inputType : "autocomplete", // "autocomplete" (or "dropdown" [unimplemented]) only applies if using the "autocomplete" question type
		title : "Where did you eat?",
		subtitle: "About your most recent lunch:",
		shuffle : false, // whether to randomize the order of the questions on load [unimplemented]
		active : true,
		values : [{
		label : "Vehicle",
		value : "CHOICE08",
		title : "Vehicle"
		},{
		label : "Desk",
		value : "CHOICE09",
		title : "Desk"			
		},{
		label : "Restaurant",
		value : "CHOICE10",
		title : "Restaurant"			
		},{
		label : "Home",
		value : "CHOICE11",
		title : "Home"			
		},{
		label : "Meeting",
		value : "CHOICE12",
		title : "Meeting"			
		},{
		label : "Other",
		value : "CHOICE13",
		title : "Other"			
		}]
	},{
		type : "radio", // "radio" or "allocation" or "autocomplete",
		label : "Did you eat alone?", // required for "autocomplete" question type
		inputType : "autocomplete", // "autocomplete" (or "dropdown" [unimplemented]) only applies if using the "autocomplete" question type
		title : "Did you eat alone?",
		// subtitle: "Dot color represents majority vote in that city",
		shuffle : false, // whether to randomize the order of the questions on load [unimplemented]
		active : true,
		values : [{
		label : "Yes",
		value : "CHOICE14",
		title : "Yes"
		},{
		label : "No",
		value : "CHOICE15",
		title : "No"			
		}]
	},{
		type : "radio", // "radio" or "allocation" or "autocomplete",
		label : "What did you drink?", // required for "autocomplete" question type
		inputType : "autocomplete", // "autocomplete" (or "dropdown" [unimplemented]) only applies if using the "autocomplete" question type
		title : "What did you drink?",
		// subtitle: "Dot color represents majority vote in that city",
		shuffle : false, // whether to randomize the order of the questions on load [unimplemented]
		active : true,
		values : [{
		label : "Soda / Pop",
		value : "CHOICE16",
		title : "Soda / Pop"
		},{
		label : "Water",
		value : "CHOICE17",
		title : "Water"			
		},{
		label : "Milk",
		value : "CHOICE18",
		title : "Milk"			
		},{
		label : "Coffee / Tea",
		value : "CHOICE19",
		title : "Coffee / Tea"			
		},{
		label : "Beer / Wine",
		value : "CHOICE20",
		title : "Beer / Wine"			
		},{
		label : "Juice",
		value : "CHOICE21",
		title : "Juice"			
		},{
		label : "Other",
		value : "CHOICE22",
		title : "Other"			
		}]
	},{
		type : "radio", // "radio" or "allocation" or "autocomplete",
		label : "What beverage size?", // required for "autocomplete" question type
		inputType : "autocomplete", // "autocomplete" (or "dropdown" [unimplemented]) only applies if using the "autocomplete" question type
		title : "What beverage size?",
		// subtitle: "Dot color represents majority vote in that city",
		shuffle : false, // whether to randomize the order of the questions on load [unimplemented]
		active : true,
		values : [{
		label : "Small",
		value : "CHOICE23",
		title : "Small"
		},{
		label : "Medium",
		value : "CHOICE24",
		title : "Medium"			
		},{
		label : "Large",
		value : "CHOICE25",
		title : "Large"			
		},{
		label : "Extra Large",
		value : "CHOICE26",
		title : "Extra Large"			
		}]
	}],
	maps : [{
/**		mapService : "http://saratoga.esri.com/ArcGIS/rest/services/LunchHabits/Gender/MapServer",
		title : "Gender",
		values : [{
			label : "Male",
			value : "CHOICE01",
			title : "Male",
			color : ["#6677CD", "#6677CD"]
		}, {
			label : "Female",
			value : "CHOICE02",
			title : "Female",
			color : ["#F57AB5", "#F57AB5"]
		}]
	}, {
		mapService : "http://saratoga.esri.com/ArcGIS/rest/services/LunchHabits/Gender/MapServer",
		title : "Age",
		values : [{
			label : "Under 18",
			value : "CHOICE03",
			title : "Under 18",
			color : ["#081C5A", "#081C5A"]
		}, {
			label : "18 - 25",
			value : "CHOICE04",
			title : "18 - 25",
			color : ["#00459C", "#00459C"]

		}, {
			label : "26 - 40",
			value : "CHOICE05",
			title : "26 - 40",
			color : ["#00459C", "#00459C"]

		}, {
			label : "41 - 65",
			value : "CHOICE06",
			title : "41 - 65",
			color : ["#00459C", "#00459C"]

		}, {
			label : "Over 65",
			value : "CHOICE07",
			title : "Over 65",
			color : ["#00459C", "#00459C"]

		}]
	}, {*/
		mapService : "http://saratoga.esri.com/ArcGIS/rest/services/LunchHabits/AteAt/MapServer",
		title : "Lunch Location",
		values : [{
			label : "Vehicle",
			value : "CHOICE08",
			title : "Vehicle",
			color : ["#E6E600", "#E6E600"]
		}, {
			label : "Desk",
			value : "CHOICE09",
			title : "Desk",
			color : ["#C29ED7", "#C29ED7"]
		}, {
			label : "Restaurant",
			value : "CHOICE10",
			title : "Restaurant",
			color : ["#C48798", "#C48798"]
		}, {
			label : "Home",
			value : "CHOICE11",
			title : "Home",
			color : ["#D7C29E", "#D7C29E"]
		}, {
			label : "Meeting",
			value : "CHOICE12",
			title : "Meeting",
			color : ["#ABCD66", "#ABCD66"]
		}, {
			label : "Other",
			value : "CHOICE13",
			title : "Other",
			color : ["#9EBBD7", "#9EBBD7"]
		}]
	}, {
		mapService : "http://saratoga.esri.com/ArcGIS/rest/services/LunchHabits/EatAlone/MapServer",
		title : "Eating Alone",
		values : [{
			label : "Yes",
			value : "CHOICE14",
			title : "Yes",
			color : ["#89CD66", "#89CD66"]
		}, {
			label : "No",
			value : "CHOICE15",
			title : "No",
			color : ["#CD6666", "#CD6666"]
		}]
	}, {
		mapService : "http://saratoga.esri.com/ArcGIS/rest/services/LunchHabits/Beverage/MapServer",
		title : "Beverage Choice",
		values : [{
			label : "Soda / Pop",
			value : "CHOICE16",
			title : "Soda / Pop",
			color : ["#B59D88", "#B59D88"]
		}, {
			label : "Water",
			value : "CHOICE17",
			title : "Water",
			color : ["#A5E0F2", "#A5E0F2"]
		}, {
			label : "Milk",
			value : "CHOICE18",
			title : "Milk",
			color : ["#FFFFFF", "#FFFFFF"]
		}, {
			label : "Coffee / Tea",
			value : "CHOICE19",
			title : "Coffee / Tea",
			color : ["#A5AB8E", "#A5AB8E"]
		}, {
			label : "Beer / Wine",
			value : "CHOICE20",
			title : "Beer / Wine",
			color : ["#C48798", "#C48798"]
		}, {
			label : "Juice",
			value : "CHOICE21",
			title : "Juice",
			color : ["#F5D467", "#F5D467"]
		}, {
			label : "Other",
			value : "CHOICE22",
			title : "Other",
			color : ["#9EBBD7", "#9EBBD7"]
		}]
	}, {
		mapService : "http://saratoga.esri.com/ArcGIS/rest/services/LunchHabits/DrinkSize/MapServer",
		title : "Drink Size",
		values : [{
			label : "Small",
			value : "CHOICE23",
			title : "Small",
			color : ["#73DFFF", "#73DFFF"]
		}, {
			label : "Medium",
			value : "CHOICE24",
			title : "Medium",
			color : ["#B6F23F", "#B6F23F"]
		}, {
			label : "Large",
			value : "CHOICE25",
			title : "Large",
			color : ["#AA6ECC", "#AA6ECC"]
		}, {
			label : "Extra Large",
			value : "CHOICE26",
			title : "Extra Large",
			color : ["#EDBB5C", "#EDBB5C"]
		}]
	}]
};
