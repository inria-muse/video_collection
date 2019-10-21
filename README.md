# Chrome Extension that stores video sessions statistics

## Functionality

The extension collects browsing history by parsing events available from the
[https://developer.chrome.com/extensions/webRequest](Chrome WebRequest APIs). This API exposes all necessary
information to identify the start and end of video sessions, as well as the
HTTPS requests and responses for video segments. To collect video quality
metrics, we first used the Chrome browser API to inspect the URL of every page
and identify pages reproducing video for each of the video services of
interest.

Two sets of statics are collected:
* 
* HTML5 <video> tag

## Installation

## TODOs

* Parse the string that contains the values. The string is passed to the background script/page, but never processed.
* Export the values. Direct file writing is not possible within an extension; think of an alternative solution.
* Implement synchronization with the pcap traces.
