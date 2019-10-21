# Chrome Extension that stores video sessions statistics

## Functionality

The extension collects browsing history by parsing events available from the
[ Chrome WebRequest APIs ](https://developer.chrome.com/extensions/webRequest). This API exposes all necessary
information to identify the start and end of video sessions, as well as the
HTTPS requests and responses for video segments. To collect video quality
metrics, we first used the Chrome browser API to inspect the URL of every page
and identify pages reproducing video for each of the video services of
interest. After the extension identifies the page, collection is tailored for
each service:

* *Netflix: Parsing overlay text.* Netflix reports video quality
statistics as an overlay text on the video if the user provides a specific
keystroke combination. We injected this keystroke combination but render the
text invisible, which allows us to parse the reported statistics without
impacting the playback experience. This information is updated once per
second, so we adjusted our collection period accordingly. Netflix reports a
variety of statistics. We focused on the player and buffer state information;
including whether the player is playing or not, buffer levels (\ie, length of
video present in the buffer), and the buffering resolution.
* *YouTube: iframe API.* We used the YouTube iframe API
to periodically extract player status information, including current video
resolution, available playback buffer (in seconds) and current playing
position. Additionally, we collect events reported by the <video>
HTML5 tag, which exposes the times that the player starts or stops the video
playback due to both user interaction (\eg, pressing pause) or due to lack of
available content in the buffer.
* *Twitch and Amazon: HTML 5 tag parsing.* As the two services
expose no proprietary interface, we generalized the module developed for
YouTube to solely rely on the <video> HTML5 tag to collect all the
required data. This approach allowed us to collect all the events described
above as well as player status information, including current video
resolution, available playback buffer (in seconds), and current playing
position.

## Installation

Install the extension on a Chrome browser:

1. Open the extensions manager: [chrome://extensions/](chrome://extensions/)
2. Enable developer mode
3. Click on the *Load unpacked extension* button and select to the `extension` folder

At this point the extension will start tracking activity on the selected services.

To automate session generation, use the included python script available in the `tools` folder. The script, uses the [experiments_control](https://github.com/wontoniii/experiments_control) package. Follow the instructions the tool's page for installation. Ones installed, automated collection can be performed using the python script `tools/video_collection.py`. Instructions on how to configure and run the tool are available in the file.


Finally, to parse the generated data, use the [videoanalysis](https://github.com/inria-muse/videoanalysis) scripts.
