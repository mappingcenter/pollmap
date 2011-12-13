/**
 * config schema version 2.1
 * please note that all niflheim services are internal esri test services and won't work for those trying out the pollmap externally!
 * // added theme
 */

// strings
var webMercator = new esri.SpatialReference({
	"wkid" : 102100
})
var winkel = new esri.SpatialReference({
	"wkt" : 'PROJCS["World_Winkel_Tripel_NGS",GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137.0,298.257223563]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]],PROJECTION["Winkel_Tripel"],PARAMETER["False_Easting",0.0],PARAMETER["False_Northing",0.0],PARAMETER["Central_Meridian",-96.0],PARAMETER["Standard_Parallel_1",50.467],UNIT["Meter",1.0]]'
});

var baseSR = winkel;

var config = {
	app : {
		appTitle : "FanMap: College Football Edition",
		version : "2.0.1", // app version
		
		// app modes
		locationMode : "postal", // "city" or "postal" REQUIRED
		questionMode : "autocomplete", //"autocomplete" or "allocation" or "radio" 
		cookieName : "xxx2011UID", // *CHANGE THIS* the name of the cookie used to track voters
		theme : "slate", //"foam" or "slate" or... Used to make it easier to create separate looks in CSS
		isPaneUI : true, // set to false when using only one map REQUIRED
		debug : true, // set to false for production

		// services
		basemapTiledService : "http://fanmap.esri.com/ArcGIS/rest/services/WT_Slate_Base2/MapServer", //"http://pollmap.esri.com/ArcGIS/rest/services/Canvas/World_EarthDay_0419_BASE/MapServer",
		overlayTiledService : "http://fanmap.esri.com/ArcGIS/rest/services/WT_MM16_Ref_Overlay/MapServer", //"http://pollmap.esri.com/ArcGIS/rest/services/Canvas/World_EarthDay_0419_REFERENCE/MapServer",
		geometryService : "http://50.17.250.45/arcgis/rest/services/Geometry/GeometryServer",
		featureService : "http://niflheim.esri.com/ArcGIS/rest/services/collegefootball/data/MapServer/0", //"http://niflheim.esri.com/ArcGIS/rest/services/earthday/earthday_places/MapServer/0",//"http://pollmap.esri.com/ArcGIS/rest/services/Zips_Winkel/MapServer/0", use for zip validation
		locatorService : "http://tasks.arcgisonline.com/ArcGIS/rest/services/Locators/ESRI_Places_World/GeocodeServer",
		/**
		 * The service to use for autocomplete, required if locationMode == "city"
		 */
		autocompleteService : "", //"http://pollmap.esri.com/ArcGIS/rest/services/Earthday/earthday_places_autocomplete/MapServer/0",
		summaryService : "http://niflheim.esri.com/ArcGIS/rest/services/collegefootball/tools/GPServer/Summarize", //"http://50.17.250.45/ArcGIS/rest/services/earthday/Vote/GPServer/Summarize",
		voteService : "http://niflheim.esri.com/ArcGIS/rest/services/collegefootball/tools/GPServer/Vote", //"http://50.17.250.45/ArcGIS/rest/services/earthday/Vote/GPServer/Vote",
		configService : "", //"http://niflheim.esri.com/ArcGIS/rest/services/collegefootball/tools/GPServer/Config", // set to "" if you do not wish to use a server-side config service 
		identifyService : "http://niflheim.esri.com/ArcGIS/rest/services/collegefootball/data/MapServer/identify", //unimplemented  		
		// extents		
		defaultExtent : new esri.geometry.Extent(-3280498, 2158621, 2995899, 7065267, winkel), // north america: new esri.geometry.Extent(-3280498, 2158621, 2995899, 7065267, winkel), safe world: new esri.geometry.Extent(-13531188, -1575214, 4060334, 8952304, baseSR),
		fullExtent : new esri.geometry.Extent(-8424404, 1725683, 7856071, 8261354, winkel), // world: new esri.geometry.Extent(-72516023, -33265069, 72516023, 33265069, baseSR),
		spatialReference : baseSR,
		geocodeZoomLevel : 8, //5, //1:577k THIS MUST BE A NUMBER, not a string

		// optional overrides:
		locationInputLabelText : "", // override here if desired, otherwise will set based on locationMode
		invalidLocationMessage : "", // override here if desired, otherwise will set based on locationMode

		// strings
		noVotesErrorText : "Please vote at least once!",
		noAllocationErrorText : "Please allocate funds to at least one item!",
		negativeAllocationErrorText : "You have allocated too much!",
		geocodeViewPrompt : "Enter postal code or city",
		allocationRemainingLabel: "Remaining Funds",
		allocationSummarySuffix: " allocated in this area",
		voteSummarySuffix: " votes in this area",
		choiceCompareText : "",// " vs. " " or " // This is used in between options when using "radio" question mode. 
		//titleCompareText : "", 		 * You can comment in some code in script.js (around line 212) to have the app generate map titles from its options, that will use this
		megaMapSocialWidgetsHTML: '<div class="social-widgets vertical"><fb:like href="http://" layout="box_count" show_faces="false" width="20" font="" colorscheme="dark"></fb:like>' + '<iframe class="twitter-count-vertical" allowtransparency="true" frameborder="0" scrolling="no" src="http://platform.twitter.com/widgets/tweet_button.html?count=vertical&via=mappingcenter&url=http://&text=How%20would%20you%20allocate%20%24100%20among%207%20enviro%20issues%3F%20%23Esri%20%23EarthDay%20%23PollMap&url=http%3A%2F%2Fpollmap.esri.com%2Fearthday%2F"></iframe>',

		// Formatting
		panePadding : 0,
		paneBorderWidth : 2,
		paneBorder : "solid #000",
		labelOpacity : 1, // set to 0.8 when vote count is low to not obscure the dots
		currency : "$", // used for money allocation questions
		bgColor : "#D7DED6", // the main theme bg color, used for various stylings (sidebar, map component, etc) [UNUSED]
		mapDialogPadding : 30,


		// regex, used to validate zip code entries
		locationRegex : "(^\\d{5}$)|(^[ABCEGHJKLMNPRSTVXYabceghjklmnprstvxy]{1}\\d{1}[A-Za-z]{1})", // *\\d{1}[A-Z]{1}\\d{1}$)", // http://geekswithblogs.net/MainaD/archive/2007/12/03/117321.aspx
		
		// parameters
		summarizeDelay : 1000,
		geocodeZoomTimeout : 1000,
		mapImageFormat : "png8", //must be a valid image format for server, either png8 png24 or png32 recommended
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
		 * Type can be either "autocomplete", "radio", or "allocation" to divide $100 among the options
		 */
		
		// fields for city autocomplete
		locationLabelField : "", //"FIRST_DISP_NAME", // just the city name
		locationDisplayField : "", //"DISP_NAME", // the display name, used for autocomplete, the entire country, province etc...
		// other fields -- dont change these
		uidField : "COOKIE",
		locationField : "LOCATION", // This should not change. old values: "GEONAMEID", "POSTAL" // the unique ID for each place record

		// other stuff
		allocationTotal : 100, // if you want to customize this...
		isGpAsynch : false, // are the services asynchronous? shouldn't be. app does NOT support asynch!!!!
		inactiveMapLabel : ""
	},
	questions : [{
		type : "autocomplete", // "radio" or "allocation" or "autocomplete",
		label : "Team: ", // required for "autocomplete" question type, also used for "radio" if present...
		autocompleteService : "http://niflheim.esri.com/ArcGIS/rest/services/collegefootball/data/MapServer/1", // the choices to use when populating the autocomplete
		autocompleteQueryField : "shortname",
		autocompleteIDField : "field",
		title : "NCAA Football: Which team do you support?",
		// subtitle: "Dot color represents majority vote in that city",
		shuffle : true, // whether to randomize the order of the questions on load [unimplemented]
		active : true
		// values : [{ // only used for radio or allocation type questions
		// label : "UConn",
		// value : "CHOICE001",
		// title : "UConn"
		// }, { 
		// label : "UAB",
		// value : "CHOICE002",
		// title : "UAB"
		// }]
	}],

	maps : [{
		mapService : "http://niflheim.esri.com/ArcGIS/rest/services/collegefootball/map01/MapServer",
		title : "The Big 8",
		values : [{
			label : "108",
			value : "CHOICE108",
			title : "108",
			color : ["#081C5A", "#081C5A"]
		}, {
			label : "109",
			value : "CHOICE109",
			title : "109",
			color : ["#00459C", "#00459C"]

		}, {
			label : "110",
			value : "CHOICE110",
			title : "110",
			color : ["#00459C", "#00459C"]

		}, {
			label : "111",
			value : "CHOICE111",
			title : "111",
			color : ["#00459C", "#00459C"]

		}, {
			label : "112",
			value : "CHOICE112",
			title : "112",
			color : ["#00459C", "#00459C"]

		}]
	}, {
		mapService : "http://niflheim.esri.com/ArcGIS/rest/services/collegefootball/map01/MapServer",
		title : "The Big 8",
		values : [{
			label : "108",
			value : "CHOICE108",
			title : "108",
			color : ["#081C5A", "#081C5A"]
		}, {
			label : "109",
			value : "CHOICE109",
			title : "109",
			color : ["#00459C", "#00459C"]

		}, {
			label : "110",
			value : "CHOICE110",
			title : "110",
			color : ["#00459C", "#00459C"]

		}, {
			label : "111",
			value : "CHOICE111",
			title : "111",
			color : ["#00459C", "#00459C"]

		}, {
			label : "112",
			value : "CHOICE112",
			title : "112",
			color : ["#00459C", "#00459C"]

		}]
	}, {
		mapService : "http://niflheim.esri.com/ArcGIS/rest/services/collegefootball/map01/MapServer",
		title : "The Big 8",
		values : [{
			label : "108",
			value : "CHOICE108",
			title : "108",
			color : ["#081C5A", "#081C5A"]
		}, {
			label : "109",
			value : "CHOICE109",
			title : "109",
			color : ["#00459C", "#00459C"]

		}, {
			label : "110",
			value : "CHOICE110",
			title : "110",
			color : ["#00459C", "#00459C"]

		}, {
			label : "111",
			value : "CHOICE111",
			title : "111",
			color : ["#00459C", "#00459C"]

		}, {
			label : "112",
			value : "CHOICE112",
			title : "112",
			color : ["#00459C", "#00459C"]

		}]
	}, {
		mapService : "http://niflheim.esri.com/ArcGIS/rest/services/collegefootball/map01/MapServer",
		title : "The Big 8",
		values : [{
			label : "108",
			value : "CHOICE108",
			title : "108",
			color : ["#081C5A", "#081C5A"]
		}, {
			label : "109",
			value : "CHOICE109",
			title : "109",
			color : ["#00459C", "#00459C"]

		}, {
			label : "110",
			value : "CHOICE110",
			title : "110",
			color : ["#00459C", "#00459C"]

		}, {
			label : "111",
			value : "CHOICE111",
			title : "111",
			color : ["#00459C", "#00459C"]

		}, {
			label : "112",
			value : "CHOICE112",
			title : "112",
			color : ["#00459C", "#00459C"]

		}]
	}]
};
