import { MUTE_MODE, PAUSE_MODE, PLAY_MODE, UNMUTE_MODE } from './constants';

export const PLAYER_FUNCTIONS = {
  muteVideo: 'player.mute(); true;',
  unMuteVideo: 'player.unMute(); true;',
  playVideo: 'player.playVideo(); true;',
  pauseVideo: 'player.pauseVideo(); true;',
  getVideoUrlScript: `
window.parent.postMessage(JSON.stringify({eventType: 'getVideoUrl', data: player.getVideoUrl()}));
true;
  `,
  durationScript: `
window.parent.postMessage(JSON.stringify({eventType: 'getDuration', data: player.getDuration()}));
true;
`,
  currentTimeScript: `
window.parent.postMessage(JSON.stringify({eventType: 'getCurrentTime', data: player.getCurrentTime()}));
true;
`,
  isMutedScript: `
window.parent.postMessage(JSON.stringify({eventType: 'isMuted', data: player.isMuted()}));
true;
`,
  getVolumeScript: `
window.parent.postMessage(JSON.stringify({eventType: 'getVolume', data: player.getVolume()}));
true;
`,
  getPlaybackRateScript: `
window.parent.postMessage(JSON.stringify({eventType: 'getPlaybackRate', data: player.getPlaybackRate()}));
true;
`,
  getAvailablePlaybackRatesScript: `
window.parent.postMessage(JSON.stringify({eventType: 'getAvailablePlaybackRates', data: player.getAvailablePlaybackRates()}));
true;
`,

  setVolume: volume => {
    return `player.setVolume(${volume}); true;`;
  },

  seekToScript: (seconds, allowSeekAhead) => {
    return `player.seekTo(${seconds}, ${allowSeekAhead}); true;`;
  },

  setPlaybackRate: playbackRate => {
    return `player.setPlaybackRate(${playbackRate}); true;`;
  },

  loadPlaylist: (playList, startIndex, play) => {
    const index = startIndex || 0;
    const func = play ? 'loadPlaylist' : 'cuePlaylist';

    const list = typeof playList === 'string' ? `"${playList}"` : 'undefined';
    const listType =
      typeof playList === 'string' ? `"${playlist}"` : 'undefined';
    const playlist = Array.isArray(playList)
      ? `"${playList.join(',')}"`
      : 'undefined';

    return `player.${func}({listType: ${listType}, list: ${list}, playlist: ${playlist}, index: ${index}}); true;`;
  },

  loadVideoById: (videoId, play) => {
    const func = play ? 'loadVideoById' : 'cueVideoById';

    return `player.${func}({videoId: ${JSON.stringify(videoId)}}); true;`;
  },
};

export const playMode = {
  [PLAY_MODE]: PLAYER_FUNCTIONS.playVideo,
  [PAUSE_MODE]: PLAYER_FUNCTIONS.pauseVideo,
};

export const soundMode = {
  [MUTE_MODE]: PLAYER_FUNCTIONS.muteVideo,
  [UNMUTE_MODE]: PLAYER_FUNCTIONS.unMuteVideo,
};

export const MAIN_SCRIPT = (
  videoId,
  playList,
  initialPlayerParams,
  allowWebViewZoom,
  contentScale,
) => {
  const {
    end,
    rel,
    color,
    start,
    playerLang,
    loop = false,
    cc_lang_pref,
    iv_load_policy,
    modestbranding,
    controls = true,
    showClosedCaptions,
    preventFullScreen = false,
  } = initialPlayerParams;

  // _s postfix to refer to "safe"
  const end_s = end;
  const rel_s = rel ? 1 : 0;
  const loop_s = loop ? 1 : 0;
  const videoId_s = videoId || '';
  const controls_s = controls ? 1 : 0;
  const cc_lang_pref_s = cc_lang_pref || '';
  const modestbranding_s = modestbranding ? 1 : 0;
  const preventFullScreen_s = preventFullScreen ? 0 : 1;
  const showClosedCaptions_s = showClosedCaptions ? 1 : 0;
  const contentScale_s = typeof contentScale === 'number' ? contentScale : 1.0;

  const list = typeof playList === 'string' ? playList : undefined;
  const listType = typeof playList === 'string' ? 'playlist' : undefined;
  const playlist = Array.isArray(playList) ? playList.join(',') : undefined;

  // scale will either be "initial-scale=1.0"
  let scale = `initial-scale=${contentScale_s}`;
  if (!allowWebViewZoom) {
    // or "initial-scale=0.8, maximum-scale=1.0"
    scale += `, maximum-scale=${contentScale_s}`;
  }

  const safeData = {
    end_s,
    list,
    start,
    color,
    rel_s,
    loop_s,
    listType,
    playlist,
    videoId_s,
    controls_s,
    playerLang,
    iv_load_policy,
    contentScale_s,
    cc_lang_pref_s,
    allowWebViewZoom,
    modestbranding_s,
    preventFullScreen_s,
    showClosedCaptions_s,
  };

  const urlEncodedJSON = encodeURI(JSON.stringify(safeData));

  const htmlString = `
<!DOCTYPE html>
<meta name="viewport" content="width=device-width," />
<style>
    body {
        margin: 0;
    }

    .container {
        position: relative;
        width: 100%;
        height: 0;
        padding-bottom: 56.25%;
    }

    .video {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
    }
</style>
<div class="container">
    <div class="video" id="player"></div>
</div>
<script>
    const randomPlayerId = "player" + Date.now();
    document.getElementById("player").id = randomPlayerId;
    const parsedUrl = new URL(window.location.href),
        UrlQueryData = parsedUrl.searchParams.get("data"),
        {
            end: end_s,
            list: list,
            color: color,
            start: start,
            rel_s: rel_s,
            loop_s: loop_s,
            listType: listType,
            playerLang: playerLang,
            playlist: playlist,
            videoId_s: videoId_s,
            controls_s: controls_s,
            cc_lang_pref_s: cc_lang_pref_s,
            contentScale_s: contentScale_s,
            allowWebViewZoom: allowWebViewZoom,
            modestbranding_s: modestbranding_s,
            iv_load_policy: iv_load_policy,
            preventFullScreen_s: preventFullScreen_s,
            showClosedCaptions_s: showClosedCaptions_s,
        } = JSON.parse(UrlQueryData);
    function sendMessageToRN(e) {
        console.log("sendMessageToRN ", msg);
        if (typeof window.ReactNativeWebView != "undefined" && typeof window.ReactNativeWebView.postMessage == "function") {
            window.ReactNativeWebView.postMessage(JSON.stringify(e));
        } else {
            window.parent.postMessage(JSON.stringify(e));
        }
    }
    let metaString = "";
    contentScale_s && (metaString += 'initial-scale=${contentScale_s}, '), allowWebViewZoom || (metaString += 'maximum-scale=${contentScale_s}');
    const viewport = document.querySelector("meta[name=viewport]");
    viewport.setAttribute("content", "width=device-width, " + metaString);
    var tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    var player,
        firstScriptTag = document.getElementsByTagName("script")[0];
    function onYouTubeIframeAPIReady() {
            player = new YT.Player(randomPlayerId, {
                width: "1000",
                height: "1000",
                videoId: '${videoId_s}',
                playerVars: {
                    end: ${end_s},
                    rel: ${rel_s},
                    list: ${list},
                    color: ${color},
                    loop: ${loop_s},
                    start: ${start},
                    hl: ${playerLang},
                    controls: ${controls_s},
                    fs: ${preventFullScreen_s},
                    cc_lang_pref: '${cc_lang_pref_s}',
                    iv_load_policy: ${iv_load_policy},
                    modestbranding: ${modestbranding_s},
                    cc_load_policy: ${showClosedCaptions_s},
                    playsinline: 1,
                    playlist: ${playlist},
                    listType: ${listType},
                },
                events: { onReady: onPlayerReady, onError: onPlayerError, onStateChange: onPlayerStateChange, onPlaybackRateChange: onPlaybackRateChange, onPlaybackQualityChange: onPlaybackQualityChange },
            });
        }
        function onPlayerError(e) {
            sendMessageToRN({ eventType: "playerError", data: e.data });
        }
        function onPlaybackRateChange(e) {
            sendMessageToRN({ eventType: "playbackRateChange", data: e.data });
        }
        function onPlaybackQualityChange(e) {
            sendMessageToRN({ eventType: "playerQualityChange", data: e.data });
        }
        function onPlayerReady(e) {
            sendMessageToRN({ eventType: "playerReady" });
        }
        function onPlayerStateChange(e) {
            sendMessageToRN({ eventType: "playerStateChange", data: e.data });
        }
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        var isFullScreen = !1;
        function onFullScreenChange() {
            (isFullScreen = document.fullscreenElement || document.msFullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement), sendMessageToRN({ eventType: "fullScreenChange", data: Boolean(isFullScreen) });
        }
        document.addEventListener("fullscreenchange", onFullScreenChange),
            document.addEventListener("msfullscreenchange", onFullScreenChange),
            document.addEventListener("mozfullscreenchange", onFullScreenChange),
            document.addEventListener("webkitfullscreenchange", onFullScreenChange),
            window.addEventListener("message", function (e) {
                var { data: e } = e;
                switch (e) {
                    case "playVideo":
                        player.playVideo();
                        break;
                    case "pauseVideo":
                        player.pauseVideo();
                        break;
                    case "muteVideo":
                        player.mute();
                        break;
                    case "unMuteVideo":
                        player.unMute();
                }
            });
    </script>
  </body>
</html>
`;

  return { htmlString, urlEncodedJSON };
};
