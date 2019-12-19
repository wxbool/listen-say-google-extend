class Speak {

    constructor() {
        this.config = {};
    }


    /**
     * 播放提醒
     * @param title
     * @param isplay
     * @param callback
     */
    player (title , isplay , callback) {
        let $this = this;
		$this.config = {};

		if (isplay) {
            let config = $.extend($this.config , {
                desiredEventTypes:['end' , 'error'],
                onEvent:function (data) {
                    if (data.type == 'end') {
                        callback && callback();
                    } else {
                        callback && callback();
                    }
                }
            });
            chrome.tts.speak(`准备播放：${title}，请稍后...` , config);
        } else {
            callback && callback();
        }
    }


    stop () {
        chrome.tts.stop();
    }

    /**
     * @param callback
     */
    isSpeak (callback) {
        chrome.tts.isSpeaking(callback);
    }
}