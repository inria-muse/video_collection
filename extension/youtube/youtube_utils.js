/**
 * Created by fbronzin on 28/06/2017.
 */

function parseYoutubeEntry(movie, end_ts) {
    var obj = {};
    obj.mid = movie.movie_id;
    obj.st = movie.startTime;
    obj.et = end_ts;
    obj.v = movie.version;
    obj.vals = [];

    lastEntry = createEmptyVideoEntry();
    for (entryKey in movie.values) {
        entry = {};
        for (key in movie.values[entryKey].val) {
            try{
                if(key!=="EVE" && key !== "YPR"){
                    if(lastEntry[key] !== movie.values[entryKey].val[key]) {
                        entry[key] = movie.values[entryKey].val[key];
                        lastEntry[key] = movie.values[entryKey].val[key];
                    }
                } else {
                    entry[key] = movie.values[entryKey].val[key];
                }

            } catch (e) {
                console.log(e);
            }

        }
        if (Object.keys(entry).length > 0) {
            entry.ts = movie.values[entryKey].ts;
            obj.vals.push(entry);
        }
    }
    return JSON.stringify(obj);
}
