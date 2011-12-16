/**
 * config schema version 2.1.1
 * please note that all niflheim services are internal esri test services and won't work for those trying out the pollmap externally!
 * // added identify tolerance
 */

// strings
var webMercator = new esri.SpatialReference({
	"wkid" : 102100
})
var winkel = new esri.SpatialReference({
	"wkt" : 'PROJCS["World_Winkel_Tripel_NGS",GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137.0,298.257223563]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]],PROJECTION["Winkel_Tripel"],PARAMETER["False_Easting",0.0],PARAMETER["False_Northing",0.0],PARAMETER["Central_Meridian",-96.0],PARAMETER["Standard_Parallel_1",50.467],UNIT["Meter",1.0]]'
});

var worldWebMercator = new esri.geometry.Extent(-15978977, -5508497, 15407900, 13981110, webMercator )
var northAmericaWinkel = new esri.geometry.Extent(-3280498, 2158621, 2995899, 7065267, winkel);

var baseSR = webMercator;

var config = {
	app : {
		appTitle : "PollMap: Lunch Break Edition",
		version : "2.0.1", // app version
		
		// app modes
		locationMode : "postal", // "city" or "postal" REQUIRED
		questionMode : "radio", //"autocomplete" or "allocation" or "radio" 
		cookieName : "LunchBreak2011UID", // the name of the cookie used to track voters
		theme : "slate", //"foam" or "slate" or... Used to make it easier to create separate looks in CSS
		isPaneUI : true, // set to false when using only one map REQUIRED
		debug : true, // set to false for production

		// services
		basemapTiledService : "http://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer", //"http://pollmap.esri.com/ArcGIS/rest/services/Canvas/World_EarthDay_0419_BASE/MapServer",
		overlayTiledService : "http://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer", //"http://pollmap.esri.com/ArcGIS/rest/services/Canvas/World_EarthDay_0419_REFERENCE/MapServer",
		geometryService : "http://megacity.esri.com/ArcGIS/rest/services/Geometry/GeometryServer",
		featureService : "http://megacity.esri.com/ArcGIS/rest/services/FanMap/PostalCodes/MapServer/0", //"http://niflheim.esri.com/ArcGIS/rest/services/earthday/earthday_places/MapServer/0",//"http://pollmap.esri.com/ArcGIS/rest/services/Zips_Winkel/MapServer/0", use for zip validation
		locatorService : "http://tasks.arcgisonline.com/ArcGIS/rest/services/Locators/ESRI_Places_World/GeocodeServer",
		/**
		 * The service to use for autocomplete, required if locationMode == "city"
		 */
		autocompleteService : "", //"http://pollmap.esri.com/ArcGIS/rest/services/Earthday/earthday_places_autocomplete/MapServer/0",
		summaryService : "http://megacity.esri.com/ArcGIS/rest/services/FanMap/Tools/GPServer/Summarize", //"http://50.17.250.45/ArcGIS/rest/services/earthday/Vote/GPServer/Summarize",
		voteService : "http://megacity.esri.com/ArcGIS/rest/services/FanMap/Tools/GPServer/Vote", //"http://50.17.250.45/ArcGIS/rest/services/earthday/Vote/GPServer/Vote",
		configService : "",//http://niflheim.esri.com/ArcGIS/rest/services/collegefootball/tools/GPServer/Config",
		identifyService : "http://megacity.esri.com/ArcGIS/rest/services/FanMap/PostalCodes/MapServer/0", // "http://pollmap.esri.com/ArcGIS/rest/services/Zips_Poly_Winkel/MapServer/0",
		// extents		
		defaultExtent : new esri.geometry.Extent(-18000498, 1675552, -5115899, 7765267, webMercator), // north america: new esri.geometry.Extent(-3280498, 2158621, 2995899, 7065267, winkel), safe world: new esri.geometry.Extent(-13531188, -1575214, 4060334, 8952304, baseSR),
		fullExtent : new esri.geometry.Extent(-22424404, 1300000, -2856071, 9861354, webMercator), // world: new esri.geometry.Extent(-72516023, -33265069, 72516023, 33265069, baseSR),
		spatialReference : baseSR,
		geocodeZoomLevel : 8, //5, //1:577k THIS MUST BE A NUMBER, not a string

		// optional overrides:
		locationInputLabelText : "", // override here if desired, otherwise will set based on locationMode
		invalidLocationMessage : "", // override here if desired, otherwise will set based on locationMode

		// strings
		noVotesErrorText : "Please vote at least once!",
		noAllocationErrorText : "Please allocate funds to at least one item!",
		negativeAllocationErrorText : "You have allocated too much!",
		geocodeViewPrompt : "Enter postal code",
		allocationRemainingLabel: "Remaining Funds",
		allocationSummarySuffix: " allocated in this area",
		voteSummarySuffix: " votes in this area",
		summaryTitle : " responses in this area",		
		choiceCompareText : "",// " vs. " " or " // This is used in between options when using "radio" question mode. 
		//titleCompareText : "", 		 * You can comment in some code in script.js (around line 212) to have the app generate map titles from its options, that will use this
		megaMapSocialWidgetsHTML: '',// removed due to buggy twitter button. Whatever you put in here will show up in the megamap <div class="social-widgets vertical"><fb:like href="http://" layout="box_count" show_faces="false" width="20" font="" colorscheme="dark"></fb:like>' + '<iframe class="twitter-count-vertical" allowtransparency="true" frameborder="0" scrolling="no" src="http://platform.twitter.com/widgets/tweet_button.html?count=vertical&via=mappingcenter&url=http://&text=How%20would%20you%20allocate%20%24100%20among%207%20enviro%20issues%3F%20%23Esri%20%23EarthDay%20%23PollMap&url=http%3A%2F%2Fpollmap.esri.com%2Fearthday%2F"></iframe>',
		identifyInfoTemplate: null, // insert custom InfoTemplate here

		// Formatting
		panePadding : 0,
		paneBorderWidth : 2,
		paneBorder : "solid #000",
		labelOpacity : 1, // set to 0.8 when vote count is low to not obscure the dots
		currency : "$", // used for money allocation questions
		bgColor : "#D0CFD4", // the main theme bg color, used for various stylings (sidebar, map component, etc) [UNUSED]
		mapDialogPadding : 30,


		// regex, used to validate zip code entries
		locationRegex : "(^\\d{5}$)|(^[ABCEGHJKLMNPRSTVXYabceghjklmnprstvxy]{1}\\d{1}[A-Za-z]{1})", // *\\d{1}[A-Z]{1}\\d{1}$)", // http://geekswithblogs.net/MainaD/archive/2007/12/03/117321.aspx
		
		// parameters
		summarizeDelay : 1000,
		geocodeZoomTimeout : 1000,
		mapImageFormat : "png8", //must be a valid image format for server, either png8 png24 or png32 recommended
		identifyTolerance: 5,
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
		locationField : "POSTAL", // This should not change. old values: "GEONAMEID", "POSTAL" // the unique ID for each place record

		// other stuff
		allocationTotal : 100, // if you want to customize this...
		isGpAsynch : false, // are the services asynchronous? shouldn't be. app does NOT support asynch!!!!
		inactiveMapLabel : ""
	},
	questions : [{
		type : "radio", // "radio" or "allocation" or "autocomplete",
		label : "Gender: ", // required for "single" question type
		//inputType : "radio", // "autocomplete" (or "dropdown" [unimplemented]) only applies if using the "single" question type
		//autocompleteService : "http://niflheim/ArcGIS/rest/services/collegefootball/data/MapServer/1", // the choices to use when populating the autocomplete
		//autocompleteQueryField : "shortname",
		//autocompleteIDField : "field",
		title : "Gender",

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
		label : "Age range: ", // required for "single" question type
		inputType : "autocomplete", // "autocomplete" (or "dropdown" [unimplemented]) only applies if using the "single" question type
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
		label : "Where did you eat?", // required for "single" question type
		inputType : "autocomplete", // "autocomplete" (or "dropdown" [unimplemented]) only applies if using the "single" question type
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
		label : "Did you eat alone?", // required for "single" question type
		inputType : "autocomplete", // "autocomplete" (or "dropdown" [unimplemented]) only applies if using the "single" question type
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
		label : "What did you drink?", // required for "single" question type
		inputType : "autocomplete", // "autocomplete" (or "dropdown" [unimplemented]) only applies if using the "single" question type
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
		label : "What beverage size?", // required for "single" question type
		inputType : "autocomplete", // "autocomplete" (or "dropdown" [unimplemented]) only applies if using the "single" question type
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
		mapService : "http://megacity.esri.com/ArcGIS/rest/services/FanMap/Gender/MapServer",
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
		mapService : "http://megacity.esri.com/ArcGIS/rest/services/FanMap/Age/MapServer",
		title : "Age",
		values : [{
			label : "Under 18",
			value : "CHOICE03",
			title : "Under 18",
			color : ["#F2F200", "#F2F200"]
		}, {
			label : "18 - 25",
			value : "CHOICE04",
			title : "18 - 25",
			color : ["#00E6A9", "#00E6A9"]

		}, {
			label : "26 - 40",
			value : "CHOICE05",
			title : "26 - 40",
			color : ["#00A9E6", "#00A9E6"]

		}, {
			label : "41 - 65",
			value : "CHOICE06",
			title : "41 - 65",
			color : ["#A900E6", "#A900E6"]

		}, {
			label : "Over 65",
			value : "CHOICE07",
			title : "Over 65",
			color : ["#E64C00", "#E64C00"]

		}]
	}, {
		mapService : "http://megacity.esri.com/ArcGIS/rest/services/FanMap/AteAt/MapServer",
		title : "Lunch Location",
		values : [{
			label : "Vehicle",
			value : "CHOICE08",
			title : "Vehicle",
			color : ["#D9D200", "#D9D200"]
		}, {
			label : "Desk",
			value : "CHOICE09",
			title : "Desk",
			color : ["#C29ED7", "#C29ED7"]
		}, {
			label : "Restaurant",
			value : "CHOICE10",
			title : "Restaurant",
			color : ["#D6456E", "#D6456E"]
		}, {
			label : "Home",
			value : "CHOICE11",
			title : "Home",
			color : ["#D6A145", "#D6A145"]
		}, {
			label : "Meeting",
			value : "CHOICE12",
			title : "Meeting",
			color : ["#8ED108", "#8ED108"]
		}, {
			label : "Other",
			value : "CHOICE13",
			title : "Other",
			color : ["#60A5E6", "#60A5E6"]
		}]
	}, {
		mapService : "http://megacity.esri.com/ArcGIS/rest/services/FanMap/EatAlone/MapServer",
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
			color : ["#D43535", "#D43535"]
		}]
	}, {
		mapService : "http://megacity.esri.com/ArcGIS/rest/services/FanMap/Beverage/MapServer",
		title : "Beverage Choice",
		values : [{
			label : "Soda / Pop",
			value : "CHOICE16",
			title : "Soda / Pop",
			color : ["#FFAE00", "#FFAE00"]
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
			color : ["#BF5000", "#BF5000"]
		}, {
			label : "Beer / Wine",
			value : "CHOICE20",
			title : "Beer / Wine",
			color : ["#F5EE2A", "#F5EE2A"]
		}, {
			label : "Juice",
			value : "CHOICE21",
			title : "Juice",
			color : ["#D6456E", "#D6456E"]
		}, {
			label : "Other",
			value : "CHOICE22",
			title : "Other",
			color : ["#40EDA2", "#40EDA2"]
		}]
	}, {
		mapService : "http://megacity.esri.com/ArcGIS/rest/services/FanMap/DrinkSize/MapServer",
		title : "Drink Size",
		values : [{
			label : "Small",
			value : "CHOICE23",
			title : "Small",
			color : ["#1774FF", "#1774FF"]
		}, {
			label : "Medium",
			value : "CHOICE24",
			title : "Medium",
			color : ["#8ED108", "#8ED108"]
		}, {
			label : "Large",
			value : "CHOICE25",
			title : "Large",
			color : ["#9232C9", "#9232C9"]
		}, {
			label : "Extra Large",
			value : "CHOICE26",
			title : "Extra Large",
			color : ["#F26D00", "#F26D00"]
		}]
	}]
};
