// Simple code to extract the stats string from the playback
/*TODO:
 * + Add tracking of which movie I am watching: on click it should extract the target link
 * + Check whether you can use an event to detect whether the text was refreshed without needing continous querying
 */

//Keeps track of whether we are recording video or not
var recording = false;

//Keeps the time at which video was started
var pageLoadTimestamp = (new Date()).getTime();

//Keeps track of the current movie I am watching
var currentMovie = null;
var hashed_id = null;

//Keeps stored the tab id of the tab
var myTabID = null;

//Active page reading interval
var myInterval = null;



/* Queries for the give class name and return the content */
function extractStringFromClass(className) {
    var x = document.getElementsByClassName(className);
    var i;
    if(x.length < 1) {
        return false;
    } else {
        try {
            dm = '\nisPlaying: false';
            dm = '\nisPlaying: '+String((document.getElementsByClassName('player-progress-val')[0].textContent === '100 %'));
        } catch (e) {}

        chrome.runtime.sendMessage( { 
	        	message: "netflix_stats", 
				domString: document.getElementsByClassName(className)[0].children[0].value + dm,
                movie_id: hashed_id,
				ts: (new Date()).getTime()
			}, 
			function(response) {
	            //console.log(response.message);
	        }
        );
        return true;
    }
}

/* Schedules periodic extraction of the information */
function simulateCtrlShiftAltD() {
	var element = document.body;

	function keyEvent(el, ev) {
		var eventObj = document.createEvent("Events");
		eventObj.initEvent(ev, true, true);

		eventObj.keyCode = 68;
		eventObj.which = 68;
		eventObj.ctrlKey = true;
		eventObj.shiftKey = true;
		eventObj.altKey = true;

		el.dispatchEvent(eventObj);
	}

	keyEvent(element, "keydown");
	keyEvent(element, "keypress");
	keyEvent(element, "keyup");
}

function extractMovieID() {
    path = window.location.pathname.split("/");
    if (path.length > 2 && path[1] === "watch")
        return path[2];
    else
        return null;
}

function periodicClassQuerying(className, period) {
    if(!recording) return;
    if(!extractStringFromClass(className)) {
        recording = false;
    }
    myInterval = setTimeout(function() {
        periodicClassQuerying(className, period); // try again
    }, period);
}

function startTracking(className, period, periodAfter, ts) {
    //Inject key
    if (!recording) 
        return;
    var script = document.createElement('script');
    script.textContent = "(" + simulateCtrlShiftAltD.toString() + ")();";
    (document.head||document.documentElement).appendChild(script);
    script.parentNode.removeChild(script);
    myInterval = setTimeout(function () {
        //Check whether we triggered the debugging
        elem = document.getElementsByClassName('player-info');
        if (elem.length != 0) {
            elem[0].style.display = 'none';       // Hide the text
            //element.style.visibility = 'hidden';      // Hide

            // The movie ID had not been extracted as it was clicked from the browser
            if(currentMovie == null) {
                currentMovie = extractMovieID();
                hashed_id = hashcode(currentMovie);
                chrome.runtime.sendMessage(
                    {
                        message: "netflix_start",
                        movie_id: currentMovie,
                        hashed_id: hashed_id,
                        ts: ts,
                        pageLoadTs: pageLoadTimestamp
                    },
                    function (response) {
                        //console.log(response);
                    });
            }
            
            //Notify that we are starting to track the video
            chrome.runtime.sendMessage({
                message: "netflix_shortcut",
                movie_id: hashed_id,
                ts: (new Date()).getTime()
            }, function (response) {
                //console.log(response.message);
            });

            periodicClassQuerying(className, periodAfter);
        } else {
            startTracking(className, period, periodAfter, ts);
        }
    }, period);
}

function startRecording() {
    recording = true;
    currentMovie = extractMovieID();
    var ts = (new Date()).getTime();
    if(currentMovie != null) {
        hashed_id = hashcode(currentMovie);
        chrome.runtime.sendMessage(
            {
                message: "netflix_start",
                movie_id: currentMovie,
                hashed_id: hashed_id,
                ts: ts,
                pageLoadTs: pageLoadTimestamp
            },
            function (response) {
                //console.log(response.message);
            });
    }
    startTracking("player-info", 5, 100, ts);
}

function stopRecording() {
    if(myInterval !== null) {
        clearInterval(myInterval);
    }
    myInterval = null;
    recording = false;
    currentMovie = null;
}

/*Capture that a change happened and that we should start counting the video start time*/

/*
 * Functions that collects different scenarios for which we should start recording based on a click
 */
function isPlayClick(target) {
    if(target.className.includes("icon-play") ||
        target.className.includes("nf-flat-button-text")
    ) {
        return true;
    }
}

/*
 * Functions that collects different scenarios for which we should stop recording based on a click
 */
function isStopClick(target) {
    if(target.className.includes("container-icon-player-back-to-browse") ||
        target.className.includes("player-back-to-browsing") ||
        target.className.includes("player-exit-playback")
    ) {
        return true;
    }
}

/*
 * We keep track of any click event to handle the user navigation through the interface
 * waiting for the moment it opens a video (hopefully it is sufficient and covers all cases)
 */
function clickDetection(e) {
    e = e || window.event;
    var target = e.target || e.srcElement;
    // text = target.textContent || text.innerText;
    // console.log("Detected click for event " + JSON.stringify(e) + JSON.stringify(target) + target);
    // console.log(target.tagName + target.className);

    if (isPlayClick(target)  && !recording) {
        console.log("Pressed play button while not playing");
        startRecording();
    } else if (isStopClick(target) && recording){
        console.log("Pressed back button while playing");
        stopRecording();
    } else {
        //Some other click that we do not want to capture
        console.log("Click not to log tagName: " + target.tagName +
            " className: " + target.className + " href: " + target.href);
    }
}

function checkPageUpdate() {
    if ( !document.URL.includes('netflix.com/watch') ) {
        return;
    }
    newMovieId = extractMovieID();
    if(newMovieId !== null && newMovieId !== currentMovie) {
        console.log("A new page has been detected: " + document.URL);
        startRecording();
    } else {
        console.log("Still the old page: " + document.URL);
    }
}

myTabID = getTabID();

//window.addEventListener("click", clickDetection, true);

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if(request.message === "netflix_page_reloaded") {
            if(recording){
                stopRecording();
            }
            checkPageUpdate();
        } else if(request.message === "general_page_reloaded") {
            if ( document.URL.includes('netflix.com/watch') ) {
                startRecording();
            }
        } else {
            console.log("Received message ", request.message)
        }
    }
);

if ( document.URL.includes('netflix.com/watch') ) {
    startRecording();
}
