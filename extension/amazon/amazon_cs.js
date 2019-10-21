/**
 * Created by fbronzin on 19/06/2017.
 */

var queryingPeriod = 500;

var recording = false;
//Keeps the time at which video was started
var pageLoadTimestamp = null;
//Keeps track of the current movie I am watching
var currentMovie = null;
var hashed_id = null;
var startTime = null;
var htmlplayer = undefined;


//Keeps stored the tab id of the tab
var myTabID = null;

//Active page reading interval
var myInterval = null;


function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}


function extractData(video) {
    chrome.runtime.sendMessage( {
            message: "amazon_stats",
            stats: createVideoStats(video),
            movie_id: hashed_id,
            ts: (new Date()).getTime()
        },
        function(response) {
            //console.log(response.message);
        }
    );
}

function periodicQuerying(period) {
    if(!recording) return;
    extractData(htmlplayer);
    myInterval = setTimeout(function() {
        periodicQuerying(period); // try again
    }, period);
}

function sendStartMessage() {
    chrome.runtime.sendMessage( {
            message: "amazon_start",
            hashed_id: hashed_id,
            movie_id: currentMovie,
            ts: (new Date()).getTime()
        },
        function(response) {
            //console.log(response.message);
        }
    );
}

function onVideoEventAmazon(event) {
    console.log("Captured video event " + event.type);
    chrome.runtime.sendMessage( {
            message: "amazon_stats",
            stats: {EVE: videoEvents[event.type]},
            movie_id: hashed_id,
            ts: (new Date()).getTime()
        },
        function(response) {
            //console.log(response.message);
        }
    );
}


function startRecording() {
    console.log("Started recording video " + currentMovie);
    htmlplayer = document.getElementsByTagName("video")[0];
    currentMovie = htmlplayer.src.split("/").pop();
    hashed_id = hashcode(currentMovie);
    sendStartMessage();
    registerVideoEvents(htmlplayer, onVideoEventAmazon);
    periodicQuerying(queryingPeriod);
}

function stopRecording() {
    console.log("Stopped recording video " + currentMovie);
    recording = false;
    try {
        unregisterVideoEvents(onVideoEventAmazon);
    }
    catch(e){
        console.log(e)
    }
    if(myInterval!==null){
        clearInterval(myInterval);
    }
    currentMovie = null;
    startTime = null;
    htmlplayer = undefined;
}


function pageChange(URL) {
    console.log("Changed page to URL: " + URL);
    if(recording) {
        stopRecording();
    } else {
        console.log("Page change while not recording")
    }
    if (URL.includes("primevideo.com") || URL.includes("amazon.com/gp/video/*")){
        console.log("Switched to a video page");
        recording = true;
        pageLoadTimestamp = (new Date());
        trackVideoTag(5, 1000, 0, htmlplayer, myInterval, startRecording);
    } else {
        console.log("Switched to a non video page");
    }
}

myTabID = getTabID();


chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if(request.message === "amazon_page_reloaded") {
            pageChange(document.URL);
        } else if(request.message === "general_page_reloaded") {
            if (!recording && (document.URL.includes('primevideo.com') || document.URL.includes("amazon.com/gp/video/*"))) {
                console.log("It's an amazon page: " + document.URL);
                recording = true;
                pageLoadTimestamp = (new Date());
                trackVideoTag(5, 1000, 0, htmlplayer, myInterval, startRecording);
            }
        }
    }
);


if ( document.URL.includes('primevideo.com') || document.URL.includes("amazon.com/gp/video/*")) {
    console.log("It's an amazon page: " + document.URL);
    recording = true;
    pageLoadTimestamp = (new Date());
    trackVideoTag(5, 1000, 0, htmlplayer, myInterval, startRecording);
} else {
    console.log("Not a viewing page: " + document.URL);
}