class VoiceTts {
    constructor() {
        this.tssdomain = 'http://say.viggo.site';
        this.ttsApi = this.tssdomain + '/api/listen/create';
        this.getApi = this.tssdomain + '/api/listen/getinfo';
        this.downloadApi = this.tssdomain + '/api/listen/download';
    }

    /**
     * 创建tts合成
     * @param data
     * @param callback
     * @param errorhandle
     */
    create (data , callback , errorhandle) {
        let $this = this;

        $.ajax({
            url:$this.ttsApi,
            type:'POST',
            async:true,
            data:data,
            dataType:'json',
            timeout:10000,
            success:function (response , status) {
                if (response.status == 0) {
                    callback && callback(response.data);
                } else {
                    if (errorhandle) {
                        errorhandle(response.msg);
                    } else {
                        throw new Error(response.msg);
                    }
                }
            },
            error:function () {
                if (errorhandle) {
                    errorhandle('网络异常');
                } else {
                    throw new Error('网络异常');
                }
            }
        });
    }

    /**
     * @param taskid
     * @param callback
     * @param errorhandle
     */
    getinfo(taskid , callback , errorhandle) {
        let $this = this;

        $.ajax({
            url:$this.getApi,
            type:'GET',
            async:true,
            data:{taskid:taskid},
            dataType:'json',
            timeout:10000,
            success:function (response , status) {
                if (response.status == 0) {
                    callback && callback(response.data);
                } else {
                    if (errorhandle) {
                        errorhandle(response.msg);
                    } else {
                        throw new Error(response.msg);
                    }
                }
            },
            error:function () {
                if (errorhandle) {
                    errorhandle('网络异常');
                } else {
                    throw new Error('网络异常');
                }
            }
        });
    }


    /**
     * @param taskid
     * @param callback
     * @param errorhandle
     */
    getdownload(taskid , callback , errorhandle) {
        let $this = this;

        $.ajax({
            url:$this.downloadApi,
            type:'POST',
            async:true,
            data:{taskid:taskid},
            dataType:'json',
            timeout:10000,
            success:function (response , status) {
                if (response.status == 0) {
                    callback && callback(response.data);
                } else {
                    if (errorhandle) {
                        errorhandle(response.msg);
                    } else {
                        throw new Error(response.msg);
                    }
                }
            },
            error:function () {
                if (errorhandle) {
                    errorhandle('网络异常');
                } else {
                    throw new Error('网络异常');
                }
            }
        });
    }

    /**
     * @param path
     * @returns {string}
     */
    getdownloadurl (path) {
        return this.tssdomain + path;
    }
}