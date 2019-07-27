class Speak {

    constructor() {
        this.config = {};
    }


    /**
     * 播放提醒
     * @param title
     * @param callback
     */
    player (title , callback) {
        let $this = this;
        let config = $.extend($this.config , {
            desiredEventTypes:['end'],
            onEvent:function (data) {
                if (data.type == 'end') {
                    callback && callback();
                }
            }   
        });
        chrome.tts.speak(`准备播放：${title}，请稍后...` , config);
    }


    stop () {
        chrome.tts.stop();
    }
}