/**
 * Created by fbronzin on 19/06/2017.
 */

function timeRanges(obj) {
    retString = "";
    for (i=0; i<obj.length; i++) {
        retString += "Range " + i + ": start(" + obj.start(i) +
            ") end(" + obj.end(i) +"); ";
    }
    return retString;
}

function printVideoObject(video) {
    console.log("buffered: " + timeRanges(video.buffered) +
        "\ncurrentSrc: " + video.currentSrc +
        "\ncurrentTime: " + video.currentTime +
        "\ndefaultPlaybackRate: " + video.defaultPlaybackRate +
        "\nduration: " + video.duration +
        "\nended: " + video.ended +
        "\nloop: " + video.loop +
        "\nnetworkState: " + video.networkState +
        "\npaused: " + video.paused +
        "\nplaybackRate: " + video.playbackRate +
        "\nplayed: " + timeRanges(video.played) +
        "\nreadyState: " + video.readyState +
        "\nseekable: " + timeRanges(video.seekable) +
        "\nseeking: " + video.seeking +
        "\nsrc: " + video.src +
        "\nstartDate: " + video.startDate +
        "\nvideoTracks: " + video.videoTracks +
        "\nvolume: " + video.volume +
        "\nvideoWidth: " + video.videoWidth +
        "\nvideoHeight: " + video.videoHeight +
        "\nwebkitDecodedFrameCount: " + video.webkitDecodedFrameCount +
        "\nwebkitDroppedFrameCount: " + video.webkitDroppedFrameCount +
        "\nwebkitAudioDecodedByteCount: " + video.webkitAudioDecodedByteCount +
        "\nwebkitVideoDecodedByteCount: " + video.webkitVideoDecodedByteCount +
        "\ntitle: " + video.title);
}

function rangesToString(ranges) {
    if(ranges.length === 0) {
        return ""
    }
    ret = "[";
    for (i=0; i<ranges.length; i++) {
        if(i>0) {
            ret += ",";
        }
        ret+="{i:"+ranges.start(i)+",e:"+ranges.end(i)+"}";
    }
    ret += "]";
    return ret;
}

function createVideoStats(video) {
    obj = {
        BUF: rangesToString(video.buffered),
        CRS: video.currentSrc,
        CUT: video.currentTime,
        DFR: video.defaultPlaybackRate,
        DUR: video.duration,
        END: video.ended,
        LOO: video.loop,
        NST: video.networkState,
        PAU: video.paused,
        PRA: video.playbackRate,
        PLA: rangesToString(video.played),
        RST: video.readyState,
        SEB: rangesToString(video.seekable),
        SEI: video.seeking,
        SRC: video.src,
        SDA: video.startDate,
        VTR: video.videoTracks,
        VOL: video.volume,
        VWI: video.videoWidth,
        VHE: video.videoHeight,
        WFC: video.webkitDecodedFrameCount,
        WDR: video.webkitDroppedFrameCount,
        WAD: video.webkitAudioDecodedByteCount,
        WVD: video.webkitVideoDecodedByteCount
    };
    return obj;
}

// Events that can be captured (in parenthesis not on whether we do capture it)
var videoEvents = {
    "abort": 1, // abort	Fires when the loading of an audio/video is aborted
    "canplay": 2, // canplay	Fires when the browser can start playing the audio/video
    "canplaythrough": 3, // canplaythrough	Fires when the browser can play through the audio/video without stopping for buffering
    "durationchange": 4, //     durationchange	Fires when the duration of the audio/video is changed
    "emptied": 5, // emptied	Fires when the current playlist is empty
    "ended": 6, // ended	Fires when the current playlist is ended
    "error": 7, // error	Fires when an error occurred during the loading of an audio/video
    "loadeddata": 8, // loadeddata	Fires when the browser has loaded the current frame of the audio/video
    "loadedmetadata": 9, // loadedmetadata	Fires when the browser has loaded meta data for the audio/video
    "loadstart": 10, // loadstart	Fires when the browser starts looking for the audio/video
    "pause": 11, // pause	Fires when the audio/video has been paused
    "play": 12, // play	Fires when the audio/video has been started or is no longer paused
    "playing": 13, // playing	Fires when the audio/video is playing after having been paused or stopped for buffering
    "progress": 14, //     progress	Fires when the browser is downloading the audio/video
    "ratechange": 15, // ratechange	Fires when the playing speed of the audio/video is changed
    "seeked": 16, // seeked	Fires when the user is finished moving/skipping to a new position in the audio/video
    "seeking": 17, // seeking	Fires when the user starts moving/skipping to a new position in the audio/video
    "stalled": 18, // stalled	Fires when the browser is trying to get media data, but data is not available
    "suspend": 19, // suspend	Fires when the browser is intentionally not getting media data
    "timeupdate": 20, // timeupdate	Fires when the current playback position has changed
    "volumechange": 21, // volumechange	Fires when the volume has been changed
    "waiting": 22 // waiting	Fires when the video stops because it needs to buffer the next frame
};

function registerVideoEvents(video, onVideoEvent) {
    video.addEventListener("abort", onVideoEvent);
    video.addEventListener("canplay", onVideoEvent);
    video.addEventListener("canplaythrough", onVideoEvent);
    video.addEventListener("durationchange", onVideoEvent);
    video.addEventListener("emptied", onVideoEvent);
    video.addEventListener("ended", onVideoEvent);
    video.addEventListener("error", onVideoEvent);
    video.addEventListener("loadeddata", onVideoEvent);
    // video.addEventListener("loadedmetadata", onVideoEvent);
    video.addEventListener("loadstart", onVideoEvent);
    video.addEventListener("pause", onVideoEvent);
    video.addEventListener("play", onVideoEvent);
    video.addEventListener("playing", onVideoEvent);
    video.addEventListener("progress", onVideoEvent);
    video.addEventListener("ratechange", onVideoEvent);
    video.addEventListener("seeked", onVideoEvent);
    video.addEventListener("seeking", onVideoEvent);
    video.addEventListener("stalled", onVideoEvent);
    video.addEventListener("suspend", onVideoEvent);
    video.addEventListener("timeupdate", onVideoEvent);
    // video.addEventListener("volumechange", onVideoEvent);
    video.addEventListener("waiting", onVideoEvent);
}

function unregisterVideoEvents(video, onVideoEvent) {
    video.removeEventListener("abort", onVideoEvent);
    video.removeEventListener("canplay", onVideoEvent);
    video.removeEventListener("canplaythrough", onVideoEvent);
    video.removeEventListener("durationchange", onVideoEvent);
    video.removeEventListener("emptied", onVideoEvent);
    video.removeEventListener("ended", onVideoEvent);
    video.removeEventListener("error", onVideoEvent);
    video.removeEventListener("loadeddata", onVideoEvent);
    // video.removeEventListener("loadedmetadata", onVideoEvent);
    video.removeEventListener("loadstart", onVideoEvent);
    video.removeEventListener("pause", onVideoEvent);
    video.removeEventListener("play", onVideoEvent);
    video.removeEventListener("playing", onVideoEvent);
    video.removeEventListener("progress", onVideoEvent);
    video.removeEventListener("ratechange", onVideoEvent);
    video.removeEventListener("seeked", onVideoEvent);
    video.removeEventListener("seeking", onVideoEvent);
    video.removeEventListener("stalled", onVideoEvent);
    video.removeEventListener("suspend", onVideoEvent);
    video.removeEventListener("timeupdate", onVideoEvent);
    // video.removeEventListener("volumechange", onVideoEvent);
    video.removeEventListener("waiting", onVideoEvent);
}



function trackVideoTag(period, maxIterations, currentIteration, existingplayer, myInterval, callback) {
    console.log("Looking to track video tag down");
    if(currentIteration >= maxIterations) {
        console.log("Could not load video tag in a reasonable number of iterations")
    }
    myInterval = setTimeout(function () {
        //Check whether we triggered the debugging
        elements = document.getElementsByTagName("video");
        if (elements !== undefined && elements.length > 0) {
            if (elements[0] === existingplayer){
                //console.log("Still a valid video tag");
                callback();
            } else if(elements[0].currentSrc !== undefined &&
                elements[0].currentSrc !== ""){
                console.log("Found video tag " + elements[0].currentSrc);
                callback();
            } else {
                //console.log("Video Tage not ready");
                trackVideoTag(period,maxIterations,currentIteration+1, existingplayer, myInterval, callback);
            }
        } else {
            //console.log("No video tag yet " + elements);
            trackVideoTag(period,maxIterations,currentIteration+1, existingplayer, myInterval, callback);
        }
    }, period);
}