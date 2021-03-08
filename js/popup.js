var Voices = [
    //通用
    {"name":"艾夏","voice":"aixia","tips":"亲和女声","sence":"通用"},
    {"name":"思悦","voice":"siyue","tips":"温柔女声","sence":"通用"},
    {"name":"艾雅","voice":"aiya","tips":"严厉女声","sence":"通用"},
    {"name":"艾美","voice":"aimei","tips":"甜美女声","sence":"通用"},
    {"name":"艾雨","voice":"aiyu","tips":"自然女声","sence":"通用"},
    {"name":"艾悦","voice":"aiyue","tips":"温柔女声","sence":"通用"},
    {"name":"艾婧","voice":"aijing","tips":"严厉女声","sence":"通用"},
    {"name":"小美","voice":"xiaomei","tips":"甜美女声","sence":"通用"},
    {"name":"艾娜","voice":"aina","tips":"浙普女声","sence":"通用"},
    {"name":"伊娜","voice":"yina","tips":"浙普女声","sence":"通用"},
    {"name":"思婧","voice":"sijing","tips":"严厉女声","sence":"通用"},
    {"name":"艾硕","voice":"aishuo","tips":"自然男声","sence":"通用"},
    //精品
    {"name":"艾媛","voice":"aiyuan","tips":"知心姐姐","sence":"精品"},
    {"name":"艾颖","voice":"aiying","tips":"软萌童声","sence":"精品"},
    {"name":"艾祥","voice":"aixiang","tips":"磁性男声","sence":"精品"},
    {"name":"艾墨","voice":"aimo","tips":"情感男声","sence":"精品"},
    {"name":"艾晔","voice":"aiye","tips":"青年男声","sence":"精品"},
    {"name":"艾婷","voice":"aiting","tips":"电台女声","sence":"精品"},
    {"name":"艾凡","voice":"aifan","tips":"情感女声","sence":"精品"},
    {"name":"艾德","voice":"aide","tips":"新闻男声","sence":"精品"},
    {"name":"艾楠","voice":"ainan","tips":"广告男声","sence":"精品"},
    {"name":"艾浩","voice":"aihao","tips":"资讯男声","sence":"精品"},
    {"name":"艾茗","voice":"aiming","tips":"诙谐男声","sence":"精品"},
    {"name":"艾笑","voice":"aixiao","tips":"资讯女声","sence":"精品"},
    {"name":"艾厨","voice":"aichu","tips":"舌尖男声","sence":"精品"},
    {"name":"艾倩","voice":"aiqian","tips":"资讯女声","sence":"精品"},
    {"name":"艾树","voice":"aishu","tips":"资讯男声","sence":"精品"},
    {"name":"艾茹","voice":"airu","tips":"新闻女声","sence":"精品"},
    //方言
    {"name":"姗姗","voice":"shanshan","tips":"粤语女声","sence":"方言"},
    {"name":"小玥","voice":"chuangirl","tips":"四川话女声","sence":"方言"},
    {"name":"青青","voice":"qingqing","tips":"台湾话女声","sence":"方言"},
    {"name":"翠姐","voice":"cuijie","tips":"东北话女声","sence":"方言"},
    {"name":"小泽","voice":"xiaoze","tips":"湖南重口音男声","sence":"方言"},
    {"name":"佳佳","voice":"jiajia","tips":"粤语女声","sence":"方言"},
    //英语
    {"name":"Harry","voice":"harry","tips":"英音男声","sence":"英语"},
    {"name":"Abby","voice":"abby","tips":"美音女声","sence":"英语"},
    {"name":"Andy","voice":"andy","tips":"美音男声","sence":"英语"},
    {"name":"Eric","voice":"eric","tips":"英音男声","sence":"英语"},
    {"name":"Emily","voice":"emily","tips":"英音女声","sence":"英语"},
    {"name":"Luna","voice":"luna","tips":"英音女声","sence":"英语"},
    {"name":"Luca","voice":"luca","tips":"英音男声","sence":"英语"},
    {"name":"Wendy","voice":"wendy","tips":"英音女声","sence":"英语"},
    {"name":"William","voice":"william","tips":"英音男声","sence":"英语"},
    {"name":"Olivia","voice":"olivia","tips":"英音女声","sence":"英语"},
    {"name":"Lydia","voice":"lydia","tips":"英中双语女声","sence":"英语"},
    {"name":"Annie","voice":"annie","tips":"美语女声","sence":"英语"},
];

$(function () {
    new PageScript();
});


class PageScript {

    constructor() {
        this.insertData = $.databind({area:'.insert-player' , errorHandle:function (message , thisEle , tipsEle) {
            $(".btn-confirm").attr('disabled' , false);
            tips.alert(message);
        }});
        this.configData = $.databind({area:'.insert-config' , errorHandle:function (message , thisEle , tipsEle) {
            tips.alert(message);
        }});

        this.ttsApp = new VoiceTts();
        this.storage = new Storage();

        this.loadPlayList();
        this.loadPlayerSet();

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
            
            console.log(data);

            //准备就绪
            $this.bindEvent();
        });
    }

    loadPlayList () {
        let $this = this;
        //获取播放列表
        $this.storage.getAll(function (data) {

            let appendHtml = '';
            for (let i in data) {
                let item = data[i];

                let target_url = '';
                if (item.target_url) {
                    target_url = ` | <a href="javascript:;" class="_target_url" data-url="${item.target_url}">${item.target_url}</a>`;
                }
                let playItem = `<li>
                           <dl>
                               <dt title="${item.title}">${item.index}.${item.title}</dt>
                               <dd>
                                    ${item.genre == 'text' ? '文本阅读' : '文章阅读'}
                                    ${target_url}
                               </dd>
                                
                               <span class="fa fa-close delete-btn pointer" title="移出列表" data-index="${item.index}"></span>
                               <span class="fa fa-download download-btn pointer" title="下载音频" data-index="${item.index}"></span>
                               <span class="fa fa-play-circle-o player-btn pointer" title="开始播放" data-index="${item.index}"></span>
                           </dl>
                        </li>`;

                appendHtml += playItem;
            }
            $(".playlist").html(appendHtml);
        })
    }


    /**
     * @param voice
     * @returns {*}
     */
    getVoiceGroup (voice){
        for (let i in Voices){
            if (voice == Voices[i].voice) {
                return Voices[i].sence;
            }
        }
        return null;
    }


    loadVoiceGroup (){
        let $this = this;
        //<div class="voice-group show">
        //    <div class="voicer-personal active"><h4>艾夏<small>亲和女声</small></h4></div>
        //</div>

        //当前发音人
        let voice = $this.configData.get('voice_name')
        //当前分组
        let group = $this.getVoiceGroup(voice);
        if (group) {
            $(`.voice-header li[data-group=${group}]`).addClass("active");
        }

        let voiceHtml = "";
        let groups = ['通用' , '精品' , '方言' , '英语'];

        for (let g in groups) {
            let currGroup = groups[g];
            let groupHtml = `<div class="voice-group {groupshow}" data-group="${currGroup}">`;
            groupHtml = groupHtml.replace(/{groupshow}/g , (currGroup==group) ? 'show' : '');

            //遍历发音人
            for (let i in Voices){
                let currVoice = Voices[i];
                if (currGroup != currVoice.sence){
                    continue;
                }

                let vhtml =`<div class="voicer-personal {active}" data-voice="${currVoice.voice}"><h4>${currVoice.name}<small>${currVoice.tips}</small></h4></div>`;
                vhtml = vhtml.replace(/{active}/g , (currVoice.voice==voice) ? 'active' : '');
                groupHtml += vhtml;
            }

            groupHtml += `</div>`;
            voiceHtml += groupHtml;
        }
        $("#voice-container").html(voiceHtml);
    }

    
    bindEvent () {
        let $this = this;

        //加载发音人分组列表
        $this.loadVoiceGroup();

        //切换工具tab
        $("._tabs li").click(function () {
            let _this = $(this);
            let name = _this.data('name');

            $("._tabs li").removeClass('active');
            _this.addClass('active');

            $(".tab-box").hide();
            $(`.tab-box[data-name="${name}"]`).show();
        });

        //切换发音人group
        $(".voice-header li").click(function () {
            let _this = $(this);
            let name = $.trim(_this.text());

            $(".voice-header li").removeClass('active');
            _this.addClass('active');
            $(".voice-container .voice-group").removeClass('show');
            $(`.voice-container .voice-group[data-group="${name}"]`).addClass('show');
            //set
            $this.configData.set("group" , name);
        });

        //切换发音人
        $(".voice-container .voice-group .voicer-personal").click(function () {
            let _this = $(this);
            let voice = _this.data("voice");
            if (voice) {
                $(`.voice-container .voice-group .voicer-personal.active`).removeClass('active');
                _this.addClass("active");
                //设置发音人
                $this.configData.set("voice_name" , voice);
            }
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

        //打开链接
        $("body").delegate("._target_url" , "click" , function () {
            let url = $(this).data('url');
            if (url) {
                chrome.tabs.create({url:url});
            }
        });

        //开始播放指定音频
        $("body").delegate(".playlist .player-btn" , "click" , function () {
            let index = $(this).data('index');
            chrome.runtime.sendMessage({type:'thisplayer',data:{index:index}});
        });
        
        //下载任务音频
        $("body").delegate(".playlist .download-btn" , "click" , function () {
            let index = $(this).data('index');
            $this.storage.get(index , function (taskinfo) {
                if (!taskinfo) {
                    return;
                }
                $this.ttsApp.getdownload(taskinfo.taskid , function (result) {
                    let output = $this.ttsApp.getdownloadurl(result.output);
                    //发起下载
                    chrome.downloads.download({url:output,saveAs:true,filename:taskinfo.title + '.mp3'} , function (downid) {
                        if (!downid) {
                            //下载失败
                        }
                    });
                } , function (message) {
                    tips.alert(message);
                });
            });
        });

        //删除播放队列
        $("body").delegate(".playlist .delete-btn" , "click" , function () {
            let index = $(this).data('index');
            $this.storage.delete(index , function () {
                chrome.runtime.sendMessage({type:'deleteplayer',data:{index:index}});
                $this.loadPlayList();
            });
        });


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
        let $btnConfirm = $(".btn-confirm");
        $btnConfirm.click(function () {
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
            
            $btnConfirm.html('添加中 <i class="fa fa-spinner fa-pulse"></i>').attr('disabled' , true);

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
                $btnConfirm.html('确认添加').attr('disabled' , false);
                tips.alert(message);
            }
            $this.ttsApp.create(subdata , function (data) {
                let taskid = data.taskid;
                $this.ttsApp.getinfo(taskid , function (taskinfo) {
                    $this.storage.put(taskinfo , function () {
                        chrome.runtime.sendMessage({type:'putplayer',data:taskinfo});
                        //加载播放列表
                        $this.loadPlayList();

                        $btnConfirm.html('确认添加').attr('disabled' , false);
                        tips.alert('添加成功');
                        $this.insertData.clear('title,source_text,source_url');
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