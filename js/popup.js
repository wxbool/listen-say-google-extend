$(function () {
    new PageScript();
});


class PageScript {

    constructor() {
        this.insertData = $.databind({area:'.insert-player' , errorHandle:function (message , thisEle , tipsEle) {
            tips.alert(message);
        }});
        this.configData = $.databind({area:'.insert-config' , errorHandle:function (message , thisEle , tipsEle) {
            tips.alert(message);
        }});

        this.ttsApp = new VoiceTts();
        this.storage = new Storage();

        this.loadPlayList();
        this.loadPlayerSet();
        this.bindEvent();

        let $this = this;
        chrome.runtime.onMessage.addListener(function(message, sender, sendResponse){
            let msgtype = message.type;
            let data = message.data;

            if (msgtype == 'updateCurrent') {
                //更新播放信息
                $this.updatePlayerInfo(data);
            }
        });

        //发起初始化
        chrome.runtime.sendMessage({type:'pageinit',data:{}});
    }

    updatePlayerInfo (data) {
        if (data.text == '') {
            data.text = 'pause';
        }
        $(".player-boot .info").html(data.text).attr('title' , data.text);
        if (data.palyer === true) {
            $("._stop").show();
            $("._start").hide();
        } else {
            $("._start").show();
            $("._stop").hide();
        }
        if (data.wait) {
            $("._waiting").html('<i class="fa fa-spinner fa-pulse"></i> waiting... ');
        } else {
            $("._waiting").html('');
        }
    }

    loadPlayerSet() {
        let $this = this;

        chrome.storage.local.get('say_config' , function(data){
            if (data) {
                if (data.hasOwnProperty('say_config')) {
                    let say_config = data.say_config;
                    $this.configData.set(say_config);
                }
            }
        });
    }

    loadPlayList () {
        let $this = this;
        //获取播放列表
        $this.storage.getAll(function (data) {

            let appendHtml = '';
            for (let i in data) {
                let item = data[i];
                let playItem = `<li>
                           <dl>
                               <dt title="${item.title}">${item.index}.${item.title}</dt>
                               <dd>
                                    ${item.genre == 'text' ? '文本阅读' : '文章阅读'}
                                    ${item.target_url ? ' | ' + item.target_url : ''}
                               </dd>
                                
                               <span class="fa fa-close delete-btn pointer" data-index="${item.index}"></span>
                               <span class="fa fa-play-circle-o player-btn pointer" data-index="${item.index}"></span>
                           </dl>
                        </li>`;

                appendHtml += playItem;
            }
            $(".playlist").html(appendHtml);
        })
    }


    bindEvent () {
        let $this = this;

        //切换tab
        $("._tabs li").click(function () {
            let _this = $(this);
            let name = _this.data('name');

            $("._tabs li").removeClass('active');
            _this.addClass('active');

            $(".tab-box").hide();
            $(`.tab-box[data-name="${name}"]`).show();
        });

        //添加类型
        $(".insert-genre").change(function () {
            let val = $this.insertData.get('genre');
            if (val == 'text') {
                $(".insert-text").show();
                $(".insert-url").hide();
            } else {
                $(".insert-url").show();
                $(".insert-text").hide();
            }
        });

        //开始播放指定音频
        $("body").delegate(".playlist .player-btn" , "click" , function () {
            let index = $(this).data('index');
            chrome.runtime.sendMessage({type:'thisplayer',data:{index:index}});
        })

        //删除播放队列
        $("body").delegate(".playlist .delete-btn" , "click" , function () {
            let index = $(this).data('index');
            $this.storage.delete(index , function () {
                chrome.runtime.sendMessage({type:'deleteplayer',data:{index:index}});
                $this.loadPlayList();
            });
        })

        //暂停播放
        $("._stop").click(function () {
            chrome.runtime.sendMessage({type:'stopplayer',data:{}});
            $("._stop").hide();
            $("._start").show();
        });

        //开始播放
        $("._start").click(function () {
            chrome.runtime.sendMessage({type:'startplayer',data:{}});
            $("._start").hide();
            $("._stop").show();
        });

        //添加播放
        $(".btn-confirm").click(function () {
            let genre = $this.insertData.get('genre');
            let vali;
            if (genre == 'text') {
                vali = $this.insertData.validate('title,source_text');
            } else {
                vali = $this.insertData.validate('source_url');
            }
            if (vali !== true) {
                return;
            }
            let data = $this.insertData.get();
            let subdata = {
                genre:data.genre
            };
            if (genre == 'text') {
                subdata.title = data.title;
                subdata.source = data.source_text;
            } else {
                subdata.source = data.source_url;
            }
            //获取朗读配置
            let config = $this.configData.get();
            subdata = $.extend(subdata , config);
            //错误处理
            let errorHandle = function (message) {
                tips.alert(message);
            }
            $this.ttsApp.create(subdata , function (data) {
                let taskid = data.taskid;
                $this.ttsApp.getinfo(taskid , function (taskinfo) {
                    $this.storage.put(taskinfo , function () {
                        chrome.runtime.sendMessage({type:'putplayer',data:taskinfo});
                        //加载播放列表
                        $this.loadPlayList();

                        tips.alert('添加成功');
                        $this.insertData.remove('title,source_text,source_url');
                    });
                } , errorHandle);
            } , errorHandle);
        });

        //保存设置
        $(".btn-confirm-config").click(function () {
            let data = $this.configData.get();
            chrome.storage.local.set({say_config:data} , function(){
                tips.alert('保存成功');
            });
        });
    }
}