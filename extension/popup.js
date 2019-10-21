function statsOpenerFunction() {
    chrome.tabs.create({url: chrome.extension.getURL('background.html')});
}

/*
 * Add text to the popup to display the unique ID of the user
 * Done in case we need to retrieve this information
 */
chrome.storage.local.get({
    randomID: '000000000',
}, function(items) {
    var div = document.getElementById('popup_user_id');
    div.innerHTML = div.innerHTML + items.randomID;
});


document.getElementById('stats-opener').onclick = statsOpenerFunction;