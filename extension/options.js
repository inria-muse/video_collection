/**
 * Created by fbronzin on 16/06/2017.
 */

// Saves options to chrome.storage
function save_options() {
    var server = document.getElementById('server').value;
    var other = document.getElementById('othertext').value;
    chrome.storage.local.set({
        uploadServer: server,
        otherServer: other
    }, function() {
        // Update status to let user know options were saved.
        var status = document.getElementById('status');
        status.textContent = 'Options saved.';
        setTimeout(function() {
            status.textContent = '';
        }, 750);
    });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
    // Use default value color = 'red' and likesColor = true.
    chrome.storage.local.get({
        uploadServer: 'http://127.0.0.1:19282',
        otherServer: "Type in other server"
    }, function(items) {
        document.getElementById('server').value = items.uploadServer;
        document.getElementById('othertext').value = items.otherServer;
    });
}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click',
    save_options);