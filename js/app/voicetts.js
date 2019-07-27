class VoiceTts {
    constructor() {
        this.ttsApi = 'http://api.aiyingso.com:88/api/listen/create';
        this.getApi = 'http://api.aiyingso.com:88/api/listen/getinfo';
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
}