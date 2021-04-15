/**
 * Created by fbronzin on 28/06/2017.
 */

var netflixKeys = [ "Version", "Esn", "PBCID", "UserAgent", "MovieId",
    "TrackingId", "Xid", "Position", "Duration", "Volume", "Player state",
    "Buffering state", "Rendering state", "Playing bitrate (a/v)",
    "Playing/Buffering vmaf", "Buffering bitrate (a/v)", "Buffer size in Bytes (a/v)",
    "Buffer size in Bytes", "Buffer size in Seconds (a/v)", "Will Rebuffer",
    "Current CDN (a/v)", "Audio Track", "Video Track", "Timed Text Track",
    "Framerate", "Current Dropped Frames", "Total Frames", "Total Dropped Frames",
    "Total Corrupted Frames", "Total Frame Delay", "Main Thread stall/sec",
    "VideoDiag", "Throughput", "DFR"];

var shortenedNetflixKeys = {
    "ts":                               "ts",
    "Version":                          "V",
    "Esn":                              "ESN",
    "PBCID":                            "PBC",
    "UserAgent":                        "UA",
    "MovieId":                          "MI",
    "TrackingId":                       "TI",
    "Xid":                              "XID",
    "Position":                         "Pos",
    "Duration":                         "Dur",
    "Volume":                           "Vol",
    "Player state":                     "PS",
    "Buffering state":                  "BS",
    "Rendering state":                  "RS",
    "Playing bitrate (a/v)":            "PBR",
    "Playing resolution":               "RES",
    "Playing/Buffering vmaf":           "VMAF",
    "Buffering bitrate (a/v)":          "BBR",
    "Buffer size in Bytes (a/v)":       "BB1",
    "Buffer size in Bytes":             "BB2",
    "Buffer size in Seconds (a/v)":     "BSe",
    "Will Rebuffer":                    "WR",
    "Current CDN (a/v)":                "CDN",
    "Audio Track":                      "AT",
    "Video Track":                      "VT",
    "Timed Text Track":                 "TT",
    "Framerate":                        "FR",
    "Current Dropped Frames":           "CDF",
    "Total Frames":                     "TF",
    "Total Dropped Frames":             "TDF",
    "Total Corrupted Frames":           "TCF",
    "Total Frame Delay":                "TFD",
    "Main Thread stall/sec":            "MTS",
    "VideoDiag":                        "VD",
    "Throughput":                       "Th",
    "DFR":                              "DFR",
    "isPlaying":                        "PL?"};

function StatsEntry() {
    this.ts = undefined;
    this["Version"] = undefined;
    this["Esn"] = undefined;
    this["PBCID"] = undefined;
    this["UserAgent"] = undefined;
    this["MovieId"] = undefined;
    this["TrackingId"] = undefined;
    this["Xid"] = undefined;
    this["Position"] = undefined;
    this["Duration"] = undefined;
    this["Volume"] = undefined;
    this["Player state"] = undefined;
    this["Buffering state"] = undefined;
    this["Rendering state"] = undefined;
    this["Playing bitrate (a/v)"] = undefined;
    this["Playing resolution"] = undefined; //Added, extracted from Playing bitrate
    this["Playing/Buffering vmaf"] = undefined;
    this["Buffering bitrate (a/v)"] = undefined;
    this["Buffer size in Bytes (a/v)"] = undefined;
    this["Buffer size in Bytes"] = undefined;
    this["Buffer size in Seconds (a/v)"] = undefined;
    this["Will Rebuffer"] = undefined;
    this["Current CDN (a/v)"] = undefined;
    this["Audio Track"] = undefined;
    this["Video Track"] = undefined;
    this["Timed Text Track"] = undefined;
    this["Framerate"] = undefined;
    this["Current Dropped Frames"] = undefined;
    this["Total Frames"] = undefined;
    this["Total Dropped Frames"] = undefined;
    this["Total Corrupted Frames"] = undefined;
    this["Total Frame Delay"] = undefined;
    this["Main Thread stall/sec"] = undefined;
    this["VideoDiag"] = undefined;
    this["Throughput"] = undefined;
    this["DFR"] = undefined;
    this["isPlaying"] = undefined;

}

function createEntry(stringEntry) {
    function findkey(line) {
        for (i in shortenedNetflixKeys)
            if (line.includes(i))
                return i;
        
        return "";
    }
    var newEntry = new StatsEntry();
    newEntry.ts = stringEntry.ts;
    var lines = stringEntry.val.split("\n");
    for (lineKey in lines) {
        if (lines[lineKey] === "" || lines[lineKey] === undefined) continue;
        var key = findkey(lines[lineKey]);
        console.log(key)
        if (key === "" || key === undefined) continue;
        keyval = lines[lineKey].split(key+": ");
        if (keyval.length < 2) continue;
        console.log(keyval)
        console.log(lines[lineKey])
        newEntry[key] = keyval[1].trim();

        /***********************************************************************/
        if (key === 'Playing bitrate (a/v)') {
            try {
                newEntry['Playing resolution'] = newEntry[key].split('res: ')[1].split(', par:')[0];
                newEntry[key] = newEntry[key].split(' (')[0];
            } catch (e) {}
        }
        else if (key === "Throughput") {
            try {
                if (newEntry[key].includes("NaN"))
                    newEntry[key] = NaN;
                else 
                    newEntry[key] = newEntry[key].split(' kbps')[0];
            } catch (e) {}
        }
        else if (key === "Volume") {
            try {
                newEntry[key] = newEntry.strip('%');
            } catch (e) {}
        }
        /***********************************************************************/
    }
    return newEntry;
}

function creteShorterEntry(fullEntry, lastSeen) {
    var shortEntry = {};
    for (key in fullEntry) {
        if (lastSeen[key] !== fullEntry[key]) {
            shortEntry[shortenedNetflixKeys[key]] = fullEntry[key];
            lastSeen[key] = fullEntry[key];
        }
    }
    return shortEntry;
}

function parseNetflixEntry(movie, end_ts) {
    var obj = {};
    obj.mid = movie.movie_id;
    obj.plt = movie.pageLoadTime;
    obj.st = movie.startTime;
    obj.sct = movie.shortcutTime;
    obj.et = end_ts;
    obj.v = movie.version;
    obj.vals = [];
    obj.tname = null;
    if (movie.trackName !== null)
        obj.tname = movie.trackName;

    var lastSeen = new StatsEntry();
    console.log("Going to process " + movie.values.length + " entries.");
    for (entryKey in movie.values) {
        console.log(movie.values[entryKey])
        if (movie.values[entryKey].val === "--") continue;
        newEntry = createEntry(movie.values[entryKey]);
        //obj.vals.push(newEntry); //if you want to push a longer entry
        obj.vals.push(creteShorterEntry(newEntry, lastSeen));
    }
    return JSON.stringify(obj);
}