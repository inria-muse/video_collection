/**
 * Created by fbronzin on 28/06/2017.
 */

function createEmptyVideoEntry(){
    obj = {
        BUF: undefined,
        CRS: undefined,
        CUT: undefined,
        DFR: undefined,
        DUR: undefined,
        END: undefined,
        LOO: undefined,
        NST: undefined,
        PAU: undefined,
        PRA: undefined,
        PLA: undefined,
        RST: undefined,
        SEB: undefined,
        SEI: undefined,
        SRC: undefined,
        SDA: undefined,
        VTR: undefined,
        VOL: undefined,
        VWI: undefined,
        VHE: undefined,
        WFC: undefined,
        WDR: undefined,
        WAD: undefined,
        WVD: undefined
    };
    return obj;
}

function parseVideoEntry(movie, end_ts) {
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
                if(key!=="EVE"){
                    if(lastEntry[key] !== movie.values[entryKey].val[key]) {
                        entry[key] = movie.values[entryKey].val[key];
                        lastEntry[key] = movie.values[entryKey].val[key];
                    }
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
