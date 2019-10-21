function getTabID() {
    chrome.runtime.sendMessage( {
            message: "get_tab_id"
        },
        function(response) {
            return response;
        }
    );
}

function hashcode(str) {
    var hash = 0, i, chr;
    if (str.length === 0) return hash;
    for (i = 0; i < str.length; i++) {
        chr   = str.charCodeAt(i);
        hash  = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return String(hash).replace("-", "0");
}