/*
 * TODO:
 *  + All implemented for now
 *  + Check corner cases
 */

var open_netflix_tabs = {};
var netflix_dataset = {};
var open_youtube_tabs = {};
var youtube_dataset = {};
var open_twitch_tabs = {};
var twitch_dataset = {};
var open_amazon_tabs = {};
var amazon_dataset = {};
var open_hbo_tabs = {};
var hbo_dataset = {};
var open_hulu_tabs = {};
var hulu_dataset = {};
var failed_uploads = [];
var interrupted_sessions =[];

var manifestData = chrome.runtime.getManifest();
var extensionVersion = manifestData.version;

var requests_tabs_data = {};

chrome.webRequest.onBeforeRequest.addListener(
    function (details) {
        if(requests_tabs_data[details.tabId] === undefined){
            requests_tabs_data[details.tabId] = {}
        }
        if(requests_tabs_data[details.tabId][details.requestId] === undefined){
            requests_tabs_data[details.tabId][details.requestId] = {}
        }
        requests_tabs_data[details.tabId][details.requestId]["OnBeforeRequestOptions"] = details
    },
    {urls: ["<all_urls>"]}, ["requestBody"]
);

chrome.webRequest.onBeforeSendHeaders.addListener(
    function (details) {
        if(requests_tabs_data[details.tabId] === undefined){
            requests_tabs_data[details.tabId] = {}
        }
        if(requests_tabs_data[details.tabId][details.requestId] === undefined){
            requests_tabs_data[details.tabId][details.requestId] = {}
        }
        requests_tabs_data[details.tabId][details.requestId]["OnSendHeadersOptions"] = details
    },
    {urls: ["<all_urls>"]}, ["requestHeaders"]
);

chrome.webRequest.onCompleted.addListener(
    function(details) {
        if(requests_tabs_data[details.tabId] === undefined){
            requests_tabs_data[details.tabId] = {}
        }
        if(requests_tabs_data[details.tabId][details.requestId] === undefined){
            requests_tabs_data[details.tabId][details.requestId] = {}
        }
        requests_tabs_data[details.tabId][details.requestId]["onCompleted"] = details
    },
    {urls: ["<all_urls>"]}, ["responseHeaders"]
);

/*
 * Create random ID for device at first run
 */
chrome.storage.local.get({
    randomID: '000000000',
    failed_uploads: [],
    interrupted_sessions: []
}, function(items) {
    if(items.randomID === "000000000") {
        var randomID = Math.floor((Math.random() * 1000000000) + 1);
        chrome.storage.local.set({
            randomID: randomID
        }, function() {
            console.log("Random ID generated: " + randomID);
        });
    } else {
        console.log("The randomID for the device is: " + items.randomID);
    }
    failed_uploads = items.failed_uploads;
    interrupted_sessions = items.interrupted_sessions;
    setTimeout(uploadOldSessions, 1000);
});

function uploadOldSessions() {
    console.log("Uploading stored entries");
    failed_uploads_temp = failed_uploads;
    failed_uploads = [];
    while (failed_uploads_temp.length > 0) {
        entry = failed_uploads_temp.pop();
        uploadRecorededSession(entry.jsonString, entry.movieIdString, entry.service, entry.start_time);
    }

    while (interrupted_sessions.length > 0) {
        entry = interrupted_sessions.pop();
        if(entry.service === "n") {
            var jsonData = parseNetflixEntry(entry.entry, entry.end_ts);
            uploadRecorededSession(jsonData, entry.entry.hashed_id, "n", entry.entry.st);
        } else if (entry.service === "y") {
            var jsonData = parseYoutubeEntry(entry.entry, entry.end_ts);
            uploadRecorededSession(jsonData, entry.entry.hashed_id, "y", entry.entry.st);
        } else if (entry.service === "a") {
            var jsonData = parseVideoEntry(entry.entry, entry.end_ts);
            uploadRecorededSession(jsonData, entry.entry.hashed_id, "a", entry.entry.st);
        } else if (entry.service === "t") {
            var jsonData = parseVideoEntry(entry.entry, entry.end_ts);
            uploadRecorededSession(jsonData, entry.entry.hashed_id, "t", entry.entry.st);
        } else if (entry.service === "h") {
            var jsonData = parseVideoEntry(entry.entry, entry.end_ts);
            uploadRecorededSession(jsonData, entry.entry.hashed_id, "h", entry.entry.st);
        }
    }
}


/*
 * TODO: capture closing of browser to save state
 */

var iDiv = document.createElement('div');
iDiv.id = 'latest_stats';
document.getElementsByTagName('body')[0].appendChild(iDiv);

function saveParsedEntries() {
    chrome.storage.local.set({
        failed_uploads: failed_uploads
    }, function() {
        console.log("Saved failed uploads");
    });
}

function saveUnparsedEntries() {
    var now = (new Date()).getTime();
    for (i in netflix_dataset) {
        obj = {end_ts: now, service: "n", entry: netflix_dataset[i]};
        interrupted_sessions.push(obj);
    }

    for (i in youtube_dataset) {
        obj = {end_ts: now, service: "y", entry: youtube_dataset[i]};
        interrupted_sessions.push(obj);
    }

    for (i in amazon_dataset) {
        obj = {end_ts: now, service: "a", entry: amazon_dataset[i]};
        interrupted_sessions.push(obj);
    }

    for (i in hbo_dataset) {
        obj = {end_ts: now, service: "h", entry: hbo_dataset[i]};
        interrupted_sessions.push(obj);
    }

    for (i in hulu_dataset) {
        obj = {end_ts: now, service: "u", entry: hulu_dataset[i]};
        interrupted_sessions.push(obj);
    }

    for (i in twitch_dataset) {
        obj = {end_ts: now, service: "t", entry: twitch_dataset[i]};
        interrupted_sessions.push(obj);
    }
    chrome.storage.local.set({
        interrupted_sessions: interrupted_sessions
    }, function() {
        console.log("Saved interrupted sessions");
    });
}


function uploadRecorededSession(jsonString, movieIdString, service, start_time) {
    console.log("Uploading " + movieIdString);
    myIP = "0000";
    chrome.storage.local.get({
        uploadServer: 'http://127.0.0.1:19282',
        otherServer: "Type in other server",
        randomID: "000000000"
    }, function (items) {
        var server = "";
        if (items.uploadServer === "Other") {
            server = items.otherServer;
        } else {
            server = items.uploadServer;
        }

        var xhr = new XMLHttpRequest();

        var jsonFileName = items.randomID + "_" + myIP + "_" + service + "_" + movieIdString + "_" + start_time + ".json";

        try {
            xhr.open("POST", server + "/" + jsonFileName, true);
            xhr.setRequestHeader("Content-type", "application/json");
            xhr.send(jsonString);
            xhr.onreadystatechange = function () {//Call a function when the state changes.
                if (xhr.readyState == XMLHttpRequest.DONE && xhr.status == 200) {
                    console.log("Server response: " + xhr.responseText);
                }
            }
        } catch (e) {
            console.error('Inria server not reachable.');
            failed_uploads.push({jsonString: jsonString, movieIdString: movieIdString,
                service: service, start_time: start_time})

      }
    });
}

function uploadRequestsHistory(tabId) {
    requests_history = requests_tabs_data[tabId];
    if (requests_history === undefined || requests_history === null) {
        console.error("No requests_history found: " + tabId);
        return;
    }
    console.log("Uploading " + tabId);
    jsonString = JSON.stringify(requests_history, null, 2);
    chrome.storage.local.get({
        uploadServer: 'http://127.0.0.1:19282',
        otherServer: "Type in other server",
        randomID: "000000000"
    }, function (items) {
        var server = "";
        if (items.uploadServer === "Other") {
            server = items.otherServer;
        } else {
            server = items.uploadServer;
        }

        var xhr = new XMLHttpRequest();

        var jsonFileName = "requests_history.json";

        try {
            xhr.open("POST", server + "/" + jsonFileName, true);
            xhr.setRequestHeader("Content-type", "application/json");
            xhr.send(jsonString);
            xhr.onreadystatechange = function () {//Call a function when the state changes.
                if (xhr.readyState == XMLHttpRequest.DONE && xhr.status == 200) {
                    console.log("Server response: " + xhr.responseText);
                }
            }
        } catch (e) {
            console.error('Local server not reachable.');
            failed_uploads.push({jsonString: jsonString, movieIdString: movieIdString,
                service: service, start_time: start_time})
        }

    });
}



function finishedRecordingNetflix(movie_id, end_ts, tabId) {
    movie = netflix_dataset[movie_id];
    if (movie === undefined || movie === null) {
        console.error("No movie found: " + movie_id);
        return;
    }
    delete open_netflix_tabs[tabId];
    delete netflix_dataset[movie_id];

    var jsonData = parseNetflixEntry(movie, end_ts);

    uploadRecorededSession(jsonData, movie_id, "n", movie.startTime);
    uploadRequestsHistory(tabId)
}

function finishedRecordingYoutube(movie_id, end_ts, tabId) {
    movie = youtube_dataset[movie_id];
    if(movie === undefined) {
        console.error("No movie found: " + movie_id);
        return;
    }
    delete open_youtube_tabs[tabId];
    delete youtube_dataset[movie_id];

    var jsonData = parseYoutubeEntry(movie, end_ts);

    uploadRecorededSession(jsonData, movie_id, "y", movie.startTime);
    uploadRequestsHistory(tabId);
}

function finishedRecordingTwitch(movie_id, end_ts, tabId) {
    movie = twitch_dataset[movie_id];
    if(movie === undefined) {
        console.error("No movie found: " + movie_id);
        return;
    }
    delete open_twitch_tabs[tabId];
    delete twitch_dataset[movie_id];

    var jsonData = parseVideoEntry(movie, end_ts);

    uploadRecorededSession(jsonData, movie_id, "t", movie.startTime);
    uploadRequestsHistory(tabId);
}

function finishedRecordingAmazon(movie_id, end_ts, tabId) {
    movie = amazon_dataset[movie_id];
    if(movie === undefined) {
        console.error("No movie found: " + movie_id);
        return;
    }
    delete open_amazon_tabs[tabId];
    delete amazon_dataset[movie_id];

    var jsonData = parseVideoEntry(movie, end_ts);

    uploadRecorededSession(jsonData, movie_id, "a", movie.startTime);
    uploadRequestsHistory(tabId);
}


function finishedRecordingHbo(movie_id, end_ts, tabId) {
    movie = hbo_dataset[movie_id];
    if(movie === undefined) {
        console.error("No movie found: " + movie_id);
        return;
    }
    delete open_hbo_tabs[tabId];
    delete hbo_dataset[movie_id];

    var jsonData = parseVideoEntry(movie, end_ts);

    uploadRecorededSession(jsonData, movie_id, "h", movie.startTime);
    uploadRequestsHistory(tabId);
}

function finishedRecordingHulu(movie_id, end_ts, tabId) {
    movie = hulu_dataset[movie_id];
    if(movie === undefined) {
        console.error("No movie found: " + movie_id);
        return;
    }
    delete open_hulu_tabs[tabId];
    delete hulu_dataset[movie_id];

    var jsonData = parseVideoEntry(movie, end_ts);

    uploadRecorededSession(jsonData, movie_id, "u", movie.startTime);
    uploadRequestsHistory(tabId);
}

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.message === "netflix_stats") {
            var movie = netflix_dataset[request.movie_id];
            if(movie.values.length > 0 &&
               movie.values[movie.last_valid].val === request.domString) {
                movie.values.push({ts: request.ts, val: "--"});
                //console.log("Not recording as it is the same as before");
            } else{
                movie.values.push({ts: request.ts, val: request.domString});
                movie.last_valid = movie.values.length - 1;
                //console.log("Recorded\n"+JSON.stringify(movie.values[movie.last_valid]));
            }
        }
        else if (request.message === "youtube_stats") {
            var movie = youtube_dataset[request.movie_id];
            if(movie !== undefined){
                movie.values.push({ts: request.ts, val: request.stats});
            } else {
                console.log("Pushing to empty movie", request.movie_id);
            }
        }
        else if (request.message === "amazon_stats") {
            var movie = amazon_dataset[request.movie_id];
            if(movie !== undefined){
                movie.values.push({ts: request.ts, val: request.stats});
            } else {
                console.log("Pushing to empty movie", request.movie_id);
            }
        }
        else if (request.message === "hbo_stats") {
            var movie = hbo_dataset[request.movie_id];
            if(movie !== undefined){
                movie.values.push({ts: request.ts, val: request.stats});
            } else {
                console.log("Pushing to empty movie", request.movie_id);
            }
        }
        else if (request.message === "hulu_stats") {
            var movie = hulu_dataset[request.movie_id];
            if(movie !== undefined){
                movie.values.push({ts: request.ts, val: request.stats});
            } else {
                console.log("Pushing to empty movie", request.movie_id);
            }
        }
        else if (request.message === "twitch_stats") {
            var movie = twitch_dataset[request.movie_id];
            if(movie !== undefined){
                movie.values.push({ts: request.ts, val: request.stats});
            } else {
                console.log("Pushing to empty movie", request.movie_id);
            }
        }
        else if (request.message === "netflix_start") {
            netflix_dataset[request.hashed_id] = {};
            netflix_dataset[request.hashed_id].startTime = request.ts;
            netflix_dataset[request.hashed_id].pageLoadTime = request.pageLoadTs; //added: reflects when the extension was loaded to the page
            netflix_dataset[request.hashed_id].movie_id = request.movie_id;
            netflix_dataset[request.hashed_id].hashed_id = request.hashed_id;
            netflix_dataset[request.hashed_id].values = [];
            netflix_dataset[request.hashed_id].tab_id = sender.tab.id;
            netflix_dataset[request.hashed_id].last_valid = 0;
            netflix_dataset[request.hashed_id].trackName = null; //not_a_debug_session
            netflix_dataset[request.hashed_id].version = extensionVersion;

            open_netflix_tabs[sender.tab.id] = request.hashed_id;

            console.log( "Starting time for netflix movie '" + request.hashed_id +"' is: " + request.ts + " at tab " + sender.tab.id);
        }
        else if (request.message === "youtube_start") {
            youtube_dataset[request.hashed_id] = {};
            youtube_dataset[request.hashed_id].startTime = request.ts;
            youtube_dataset[request.hashed_id].movie_id = request.movie_id;
            youtube_dataset[request.hashed_id].hashed_id = request.hashed_id;
            youtube_dataset[request.hashed_id].values = [];
            youtube_dataset[request.hashed_id].tab_id = sender.tab.id;
            youtube_dataset[request.hashed_id].version = extensionVersion;

            open_youtube_tabs[sender.tab.id] = request.hashed_id;
            console.log( "Starting time for youtube movie " + request.hashed_id +": " + request.ts  + " at tab " + sender.tab.id);
        }
        else if (request.message === "amazon_start") {
            amazon_dataset[request.hashed_id] = {};
            amazon_dataset[request.hashed_id].startTime = request.ts;
            amazon_dataset[request.hashed_id].movie_id = request.movie_id;
            amazon_dataset[request.hashed_id].hashed_id = request.hashed_id;
            amazon_dataset[request.hashed_id].values = [];
            amazon_dataset[request.hashed_id].tab_id = sender.tab.id;
            amazon_dataset[request.hashed_id].version = extensionVersion;

            open_amazon_tabs[sender.tab.id] = request.hashed_id;
            console.log( "Starting time for amazon movie " + request.hashed_id +": " + request.ts  + " at tab " + sender.tab.id);
        }
        else if (request.message === "hbo_start") {
            hbo_dataset[request.hashed_id] = {};
            hbo_dataset[request.hashed_id].startTime = request.ts;
            hbo_dataset[request.hashed_id].movie_id = request.movie_id;
            hbo_dataset[request.hashed_id].hashed_id = request.hashed_id;
            hbo_dataset[request.hashed_id].values = [];
            hbo_dataset[request.hashed_id].tab_id = sender.tab.id;
            hbo_dataset[request.hashed_id].version = extensionVersion;

            open_hbo_tabs[sender.tab.id] = request.hashed_id;
            console.log( "Starting time for hbo movie " + request.hashed_id +": " + request.ts  + " at tab " + sender.tab.id);
        }
        else if (request.message === "hulu_start") {
            hulu_dataset[request.hashed_id] = {};
            hulu_dataset[request.hashed_id].startTime = request.ts;
            hulu_dataset[request.hashed_id].movie_id = request.movie_id;
            hulu_dataset[request.hashed_id].hashed_id = request.hashed_id;
            hulu_dataset[request.hashed_id].values = [];
            hulu_dataset[request.hashed_id].tab_id = sender.tab.id;
            hulu_dataset[request.hashed_id].version = extensionVersion;

            open_hulu_tabs[sender.tab.id] = request.hashed_id;
            console.log( "Starting time for hulu movie " + request.hashed_id +": " + request.ts  + " at tab " + sender.tab.id);
        }
        else if (request.message === "twitch_start") {
            twitch_dataset[request.hashed_id] = {};
            twitch_dataset[request.hashed_id].startTime = request.ts;
            twitch_dataset[request.hashed_id].movie_id = request.movie_id;
            twitch_dataset[request.hashed_id].hashed_id = request.hashed_id;
            twitch_dataset[request.hashed_id].values = [];
            twitch_dataset[request.hashed_id].tab_id = sender.tab.id;
            twitch_dataset[request.hashed_id].version = extensionVersion;

            open_twitch_tabs[sender.tab.id] = request.hashed_id;
            console.log( "Starting time for twitch movie " + request.hashed_id +": " + request.ts  + " at tab " + sender.tab.id);
        }
        else if (request.message === "netflix_shortcut") {
            netflix_dataset[request.movie_id].shortcutTime = request.ts;
            console.log( "Shortcut triggered at time " + request.movie_id +": " + request.ts);
        }
        else if (request.message === "netflix_stop") {
            finishedRecordingNetflix(request.movie_id, request.ts, sender.tab);
            console.log("Stopped recording at: " + request.ts);
        }
        else if (request.message === "youtube_stop") {
            finishedRecordingYoutube(request.movie_id, request.ts, sender.tab);
            console.log("Stopped recording at: " + request.ts);
        }
        else if (request.message === "amazon_stop") {
            finishedRecordingAmazon(request.movie_id, request.ts, sender.tab);
            console.log("Stopped recording at: " + request.ts);
        }
        else if (request.message === "hbo_stop") {
            finishedRecordingHbo(request.movie_id, request.ts, sender.tab);
            console.log("Stopped recording at: " + request.ts);
        }
        else if (request.message === "hulu_stop") {
            finishedRecordingHulu(request.movie_id, request.ts, sender.tab);
            console.log("Stopped recording at: " + request.ts);
        }
        else if (request.message === "twitch_stop") {
            finishedRecordingTwitch(request.movie_id, request.ts, sender.tab);
            console.log("Stopped recording at: " + request.ts);
        } else if (request.message === "get_tab_id") {
            sendResponse(sender.tab.id);
        }
    }
);


chrome.tabs.onRemoved.addListener( function(tabid, removed)  {
    var movie, endTime;
    console.log("Tab " + tabid + " got closed");
    if (open_netflix_tabs[tabid] !== undefined) {
        console.log("A netflix tab has been closed");
        movie = open_netflix_tabs[tabid];
        endTime = (new Date()).getTime();
        finishedRecordingNetflix(movie, endTime, tabid);
    } else if(open_youtube_tabs[tabid] !== undefined) {
        console.log("A youtube tab has been closed " + JSON.stringify(open_youtube_tabs[tabid]));
        movie = open_youtube_tabs[tabid];
        endTime = (new Date()).getTime();
        finishedRecordingYoutube(movie, endTime, tabid);
    } else if(open_amazon_tabs[tabid] !== undefined){
        console.log("An amazon tab has been closed " + JSON.stringify(open_amazon_tabs[tabid]));
        movie = open_amazon_tabs[tabid];
        endTime = (new Date()).getTime();
        finishedRecordingAmazon(movie, endTime, tabid);
    } else if(open_hbo_tabs[tabid] !== undefined){
        console.log("An hbo tab has been closed " + JSON.stringify(open_hbo_tabs[tabid]));
        movie = open_hbo_tabs[tabid];
        endTime = (new Date()).getTime();
        finishedRecordingHbo(movie, endTime, tabid);
    } else if(open_hulu_tabs[tabid] !== undefined){
        console.log("An hulu tab has been closed " + JSON.stringify(open_hulu_tabs[tabid]));
        movie = open_hulu_tabs[tabid];
        endTime = (new Date()).getTime();
        finishedRecordingHulu(movie, endTime, tabid);
    } else if(open_twitch_tabs[tabid] !== undefined) {
        console.log("A twitch tab has been closed " + JSON.stringify(open_twitch_tabs[tabid]));
        movie = open_twitch_tabs[tabid];
        endTime = (new Date()).getTime();
        finishedRecordingTwitch(movie, endTime, tabid);
    }
});

/* Listener that captures whether a video tab was reloaded */
chrome.tabs.onUpdated.addListener( function(tabid, changeInfo)  {
    var movie, endTime;
    console.log("Tab " + tabid + " got updated");
    if (open_netflix_tabs[tabid] !== undefined) {
        console.log("A netflix tab has been updated");
        console.log(JSON.stringify(changeInfo));
        if (changeInfo.status === "loading") {
            movie = open_netflix_tabs[tabid];
            endTime = (new Date()).getTime();
            finishedRecordingNetflix(movie, endTime, tabid);
            chrome.tabs.sendMessage(tabid, {
                message: "netflix_page_reloaded"
            });
        }
    } else if (open_youtube_tabs[tabid] !== undefined) {
        console.log("A youtube tab has been updated");
        console.log(JSON.stringify(changeInfo));
        if (changeInfo.status === "loading") {
            movie = open_youtube_tabs[tabid];
            endTime = (new Date()).getTime();
            finishedRecordingYoutube(movie, endTime, tabid);
            chrome.tabs.sendMessage(tabid,{
                message: "youtube_page_reloaded"
            });
        }
    } else if (open_amazon_tabs[tabid] !== undefined) {
        console.log("An amazon tab has been updated");
        console.log(JSON.stringify(changeInfo));
        if (changeInfo.status === "loading") {
            movie = open_amazon_tabs[tabid];
            endTime = (new Date()).getTime();
            finishedRecordingAmazon(movie, endTime, tabid);
            chrome.tabs.sendMessage(tabid,{
                message: "amazon_page_reloaded"
            });
        }
    } else if (open_hbo_tabs[tabid] !== undefined) {
        console.log("An hbo tab has been updated");
        console.log(JSON.stringify(changeInfo));
        if (changeInfo.status === "loading") {
            movie = open_hbo_tabs[tabid];
            endTime = (new Date()).getTime();
            finishedRecordingHbo(movie, endTime, tabid);
            chrome.tabs.sendMessage(tabid,{
                message: "hbo_page_reloaded"
            });
        }
    } else if (open_hulu_tabs[tabid] !== undefined) {
        console.log("An hulu tab has been updated");
        console.log(JSON.stringify(changeInfo));
        if (changeInfo.status === "loading") {
            movie = open_hulu_tabs[tabid];
            endTime = (new Date()).getTime();
            finishedRecordingHulu(movie, endTime, tabid);
            chrome.tabs.sendMessage(tabid,{
                message: "hulu_page_reloaded"
            });
        }
    } else if (open_twitch_tabs[tabid] !== undefined) {
        console.log("A twitch tab has been updated");
        console.log(JSON.stringify(changeInfo));
        if (changeInfo.status === "loading") {
            movie = open_twitch_tabs[tabid];
            endTime = (new Date()).getTime();
            finishedRecordingTwitch(movie, endTime, tabid);
            chrome.tabs.sendMessage(tabid,{
                message: "twitch_page_reloaded"
            });
        }
    } else {
        console.log("A general tab has been updated");
        console.log(JSON.stringify(changeInfo));
        if (changeInfo.status === "loading") {
            console.log("Loading sending message");
            chrome.tabs.sendMessage(tabid, {
                message: "general_page_reloaded"
            });
        }
    }
});

chrome.runtime.onSuspend.addListener(function (){
    console.log("Chrome is closing");
    saveUnparsedEntries();
    saveParsedEntries();
});
