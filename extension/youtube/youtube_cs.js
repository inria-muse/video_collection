/**
 * Created by fbronzin on 19/06/2017.
 */

/*
 * TODO:
 *
 *  - FIX START TIME
 */

var queryingPeriod = 500;

var recording = false;
//Keeps the time at which video was started
var pageLoadTimestamp = null;
//Keeps track of the current movie I am watching
var currentMovie = null;
var hashed_id = null;
var startTime = null;
var ytscript = undefined;
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

function extractMovieID() {
    return getParameterByName("v");
}

function extractData(video) {
    chrome.runtime.sendMessage( {
            message: "youtube_stats",
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
            message: "youtube_start",
            movie_id: currentMovie,
            hashed_id: hashed_id,
            ts: (new Date()).getTime()
        },
        function(response) {
            //console.log(response.message);
        }
    );
}

function onVideoEventYoutube(event) {
    console.log("Captured video event " + event.type);
    chrome.runtime.sendMessage( {
            message: "youtube_stats",
            stats: {EVE: videoEvents[event.type]},
            movie_id: hashed_id,
            ts: (new Date()).getTime()
        },
        function(response) {
            //console.log(response.message);
        }
    );
}


function getYoutubePlayerForStats(){
    player = document.getElementById("movie_player");

    //player.getAvailableQualityLevels():Array
    //player.addEventListener(event:String, listener:String):Void
    window.postMessage({ type: "FROM_PAGE", rates: player.getAvailableQualityLevels() }, "*");
}

function sendAvailableRates(rates) {
    chrome.runtime.sendMessage( {
            message: "youtube_stats",
            stats: {YPR: rates},
            movie_id: hashed_id,
            ts: (new Date()).getTime()
        },
        function(response) {
            //console.log(response.message);
        }
    );
}

function injectYoutubePlayerCode() {
    var script = document.createElement('script');

    window.addEventListener("message", function(event) {
        // We only accept messages from ourselves
        if (event.source != window)
            return;

        if (event.data.type && (event.data.type == "FROM_PAGE")) {
            console.log("Content script received: " + event.data.rates);
            sendAvailableRates(event.data.rates);
            script.remove();
        }
    }, false);



    script.appendChild(document.createTextNode('('+ getYoutubePlayerForStats +')();'));
    (document.body || document.head || document.documentElement).appendChild(script);
}

function startRecording() {
    currentMovie = extractMovieID();
    hashed_id = hashcode(currentMovie);
    console.log("Started recording video " + currentMovie);
    // if(video !== undefined){
    //     console.log("Video tag was already found");
    //     ytplayer = video;
    // } else {
    //     console.log("Looking for video tag in the page");
    htmlplayer = document.getElementsByTagName("video")[0];
    injectYoutubePlayerCode();
    //     console.log("Found video tag " + ytplayer.currentSrc);
    // }
    sendStartMessage();
    //Register for events with video element
    registerVideoEvents(htmlplayer, onVideoEventYoutube);
    periodicQuerying(queryingPeriod);
}

function stopRecording() {
    console.log("Stopped recording video " + currentMovie);
    recording = false;
    try {
        unregisterVideoEvents(onVideoEventYoutube);
    }
    catch(e){
        console.log(e)
    }
    if(myInterval!==null){
        clearInterval(myInterval);
    }
    currentMovie = null;
    startTime = null;
    ytscript = undefined;
    htmlplayer = undefined;
}


function pageChange(URL) {
    console.log("Changed page to URL: " + URL);
    if(recording) {
        stopRecording();
    } else {
        console.log("Page change while not recording")
    }
    if (URL.includes("watch?v=")){
        console.log("Switched to a video page");
        recording = true;
        pageLoadTimestamp = (new Date());
        trackVideoTag(5, 1000, 0, htmlplayer, myInterval, startRecording);
    } else {
        console.log("Switched to a non video page");
    }
}

//Deprecated
// function findAnchor(target, limit) {
//     i = 0;
//     while (target && i < limit) {
//         if (target instanceof HTMLAnchorElement) {
//             console.log("Reached the link: " + target.getAttribute('href'));
//             return target;
//         }
//         target = target.parentNode;
//         i++;
//     }
//     return null;
// }

//Deprecated
// function isTargetOfInterest(target) {
//     lcase = target.tagName.toLowerCase()
//     if(lcase === "img") {
//         return true;
//     } else if (lcase === "span") {
//         return true;
//     } else{
//         return false;
//     }
// }

//Deprecated
// function clickDetection(e) {
//     e = e || window.event;
//     var target = e.target || e.srcElement;
//     console.log("Detected click for event " + JSON.stringify(e) + JSON.stringify(target) + target);
//     console.log(target.tagName + " and " + target.className + " and " + target.href);
//     if(target.href !== undefined) {
//         //I have the href I have clicked on
//         pageChange(target.href);
//     } else if(isTargetOfInterest(target)){
//         tWithAnchor = findAnchor(target, 10);
//         if(tWithAnchor !== null)
//             pageChange(tWithAnchor.href);
//         else
//             console.log("Not a click of interest");
//     } else {
//         console.log("Not a click of interest");
//     }
// }

//window.addEventListener("click", clickDetection, true);

myTabID = getTabID();

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if(request.message === "youtube_page_reloaded") {
            pageChange(document.URL);
        } else if(request.message === "general_page_reloaded") {
            if (!recording && document.URL.includes('youtube.com/watch?v=') ) {
                console.log("It's a youtube page: " + document.URL);
                recording = true;
                pageLoadTimestamp = (new Date());
                trackVideoTag(5, 1000, 0, htmlplayer, myInterval, startRecording);
            }
        }
    }
);

if ( document.URL.includes('youtube.com/watch?v=') ) {
    console.log("It's a youtube page: " + document.URL);
    recording = true;
    pageLoadTimestamp = (new Date());
    trackVideoTag(5, 1000, 0, htmlplayer, myInterval, startRecording);
} else {
    console.log("Not a viewing page: " + document.URL);
}