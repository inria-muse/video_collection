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
            message: "hbo_stats",
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
            message: "hbo_start",
            hashed_id: hashed_id,
            movie_id: currentMovie,
            ts: (new Date()).getTime()
        },
        function(response) {
            //console.log(response.message);
        }
    );
}

function onVideoEventHbo(event) {
    console.log("Captured video event " + event.type);
    chrome.runtime.sendMessage( {
            message: "hbo_stats",
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
    registerVideoEvents(htmlplayer, onVideoEventHbo);
    periodicQuerying(queryingPeriod);
}

function stopRecording() {
    console.log("Stopped recording video " + currentMovie);
    recording = false;
    try {
        unregisterVideoEvents(onVideoEventHbo);
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
    if (URL.includes("play.hbonow.com")){
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
        if(request.message === "hbo_page_reloaded") {
            pageChange(document.URL);
        } else if(request.message === "general_page_reloaded") {
            if (!recording && (document.URL.includes("play.hbonow.com"))) {
                console.log("It's an hbo page: " + document.URL);
                recording = true;
                pageLoadTimestamp = (new Date());
                x = document.getElementsByClassName("default class2 class4");
                console.log("Length of thing " + x.length);
                x[0].click();
                console.log("Should be clicked");
                trackVideoTag(5, 1000, 0, htmlplayer, myInterval, startRecording);
            }
        }
    }
);


function eventFire(el, etype){
    if (el.fireEvent) {
        el.fireEvent('on' + etype);
    } else {
        var evObj = document.createEvent('Events');
        evObj.initEvent(etype, true, false);
        el.dispatchEvent(evObj);
    }
}

function trackClassTag(period, maxIterations, currentIteration, existingplayer, myInterval, callback) {
    console.log("Looking to track the div down");
    myInterval = setTimeout(function () {
        //Check whether we triggered the debugging
        elements = document.getElementsByClassName("default class2 class4");
        if (elements !== undefined && elements.length > 0) {
            console.log(elements);
            console.log(elements.length);
            count = 0;
            for (var i = 0; i < elements.length; i++) {
               if (elements[i].getAttribute("style").includes("btn_play_large"))  {
                   // btn_play_large
                   // blob:https://play.hbonow.com/
                   console.log("One with that parent");
                   console.log(elements[i]);
                   // var clickEvent = new MouseEvent("click", {
                   //     "view": window,
                   //     "bubbles": true,
                   //     "cancelable": false
                   // });
                   // elements[i].dispatchEvent(clickEvent);
                   var last = elements[i];
                   count += 1;
               }
            }

            if (count === 0) {
                trackClassTag(period,maxIterations,currentIteration+1, existingplayer, myInterval, callback);
            } else {
                var clickEvent = new MouseEvent("click", {
                    "view": window,
                    "bubbles": true,
                    "cancelable": false
                });
                last.dispatchEvent(clickEvent);
            }
            // elements[0].click()
            // trackVideoTag(period, maxIterations, currentIteration, existingplayer, myInterval, callback);
        } else {
            //console.log("No video tag yet " + elements);
            trackClassTag(period,maxIterations,currentIteration+1, existingplayer, myInterval, callback);
        }
    }, period);
}

if ( document.URL.includes("play.hbonow.com")) {
    console.log("It's an hbo page: " + document.URL);
    recording = true;
    pageLoadTimestamp = (new Date());
    // TODO reinsert this
    trackVideoTag(5, 1000, 0, htmlplayer, myInterval, startRecording);

} else {
    console.log("Not a viewing page: " + document.URL);
}

// document.addEventListener('click', function(e) {
//     e = e || window.event;
//     var target = e.target || e.srcElement,
//         text = target.textContent || target.innerText;
//     console.log(target)
// }, false);
//
// for (var i = 0; i < elements.length; i++) {
//     if (elements[i].getAttribute("style").includes("btn_play_large")) {
//         console.log("One with that parent");
//         console.log(elements[i]);
//         var touse = elements[i];
//         elements[i].click();
//         eventFire(elements[i], 'click');
//     }
// }