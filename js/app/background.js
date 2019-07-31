$(function () {
    let pageAudio = new AudioPlay();

    //失败回调通知
    let errorHandle = function (message) {
        //发出通知
        chrome.notifications.create({
            type:'basic',
            iconUrl:'/images/logo-16.png',
            title:'失败',
            message:message
        });
        console.log(message);
    }
    
    //注册自定义右键菜单
    chrome.contextMenus.create({
        type: 'normal',
        title: '加入到朗读列表',
        id: '_create_',
        documentUrlPatterns:['*://mp.weixin.qq.com/*'],
        onclick:function (page) {
            //获取用户配置
            pageAudio.storage.getSayConfig(function (say_config) {
                let subdata = $.extend(say_config , {genre:'url',source:page.pageUrl});

                pageAudio.ttsApp.create(subdata , function (data) {
                    let taskid = data.taskid;
                    pageAudio.ttsApp.getinfo(taskid , function (taskinfo) {
                        pageAudio.storage.put(taskinfo , function () {
                            //添加成功
                            //加入新的播放
                            pageAudio.newPlayer();
                        });
                    } , errorHandle);
                } , errorHandle);
            });
        }
    });

    //注册自定义右键菜单
    chrome.contextMenus.create({
        type: 'normal',
        title: '将选定文本加入到朗读列表',
        id: '_create_text_',
        contexts:['selection'],
        onclick:function (page) {
            //获取用户配置
            pageAudio.storage.getSayConfig(function (say_config) {
                let content = page.selectionText;
                if (content.length < 10) {
                    errorHandle('加入列表失败，选定文本字符不能少于 15');return false;
                }
                let title = $.trim(String(content)).split('').slice(0 , 18).join('');
                let subdata = $.extend(say_config , {genre:'text',source:content,title:title});

                pageAudio.ttsApp.create(subdata , function (data) {
                    let taskid = data.taskid;
                    pageAudio.ttsApp.getinfo(taskid , function (taskinfo) {
                        pageAudio.storage.put(taskinfo , function () {
                            //添加成功
                            //加入新的播放
                            pageAudio.newPlayer();
                        });
                    } , errorHandle);
                } , errorHandle);
            });
        }
    });


    //监听播放完毕
    pageAudio.getAudio().addEventListener('ended', function () {
        pageAudio.playerOver();
    }, false);

    chrome.runtime.onMessage.addListener(function(message, sender, sendResponse){
        var msgtype = message.type;
        var data = message.data;

        switch (msgtype) {
            case 'putplayer':
                //加入新的播放
                pageAudio.newPlayer();
                break;
            case 'deleteplayer':
                //删除播放
                //data.index
                pageAudio.deletePlayer(data.index);
                break;
            case 'thisplayer':
                //指定开始播放
                //data.index
                pageAudio.playIndex(data.index);
                break;
            case 'startplayer':
                //开始播放
                if (pageAudio.currentIndex) {
                    pageAudio.audio.play();
                    pageAudio.setCurrentStatus('palyer' , true);
                }
                break;
            case 'stopplayer':
                //暂停播放
                if (!pageAudio.audio.paused && pageAudio.currentIndex) {
                    pageAudio.audio.pause();
                    pageAudio.setCurrentStatus('palyer' , false);
                }
                break;
            case 'pageinit':
                //页面初始化
                pageAudio.setCurrentStatus(undefined);
                break;
        }
    });
});

class AudioPlay {
    constructor() {
        this.id = 'music-audio';
        this.playUrl = 'http://api.aiyingso.com:88/';
        this.audio = document.getElementById(this.id);
        this.ttsApp = new VoiceTts();
        this.storage = new Storage();
        this.speak = new Speak();

        this.current = {}; //当前播放
        this.currentIndex = 0; //当前播放指针
        this.currentPlayerIndex = 1; //播放集合指针
        this.currentStatus = {  //当前播放信息
            text:'',
            tips:'',
            wait:false,
            palyer:false
        };

        this.currentTimeOut = {}; //当前播放定时器
    }


    /**
     * @param key
     * @param value
     */
    setCurrentStatus(key , value) {
        let $this = this;

        if (key) {
            if (key.constructor == Object) {
                for (let i in key) {
                    $this.currentStatus[i] = key[i];
                }
            } else {
                $this.currentStatus[key] = value;
            }
        }

        chrome.runtime.sendMessage({type:'updateCurrent',data:$this.currentStatus});
    }


    /**
     * @param index
     */
    playIndex (index) {
        let $this = this;
        if (!index) {
            return;
        }

        $this.audio.pause(); //先暂停
        $this.storage.get(index , function (data) {
            if (!data){
                return;
            }
            //0等待开始，1读取任务配置，2语音合成中，3任务完成，4任务异常
            if (data.status === 4) {
                chrome.notifications.create({
                    type:'basic',
                    iconUrl:'/images/logo-16.png',
                    title:'错误',
                    message:`语音合成异常：${data.fail_remark}`,
                    contextMessage:data.title
                });
                return;
            }

            $this.current = data;
            $this.currentIndex = index;
            $this.currentPlayerIndex = 1;

            $this.setCurrentStatus('text' , $this.current.title);
            $this.playCurrent();
        });
    }
        

    //播放当前指针音频
    playCurrent () {
        let $this = this;
        if (!$this.currentIndex) {
            return;
        }

        $this.speak.stop();
        $this.speak.player($this.current.title , function () {
            
            clearInterval($this.currentTimeOut); //清除定时任务
            //循环缓冲
            $this.currentTimeOut = setInterval(function () {
                $this.setCurrentStatus('wait' , true);  //wait

                if ($this.current.status === 2) {
                    if ($this.current.loadnums > 0) {  //已存在音频文件
                        $this.playCurrentSrc($this.currentPlayerIndex); //播放
                        clearInterval($this.currentTimeOut);
                        return;
                    }
                } else if ($this.current.status === 3) { //已加载完成
                    $this.playCurrentSrc($this.currentPlayerIndex); //播放
                    clearInterval($this.currentTimeOut);
                    return;
                }

                //更新任务信息
                $this.updateIndexPlayer($this.current.taskid , $this.currentIndex , function () {
                    $this.storage.get($this.currentIndex , function (data) {
                        if (data.status === 4) {
                            //发出通知
                            chrome.notifications.create({
                                type:'basic',
                                iconUrl:'/images/logo-16.png',
                                title:'错误',
                                message:`语音合成异常：${data.fail_remark}`,
                                contextMessage:data.title
                            });
                            clearInterval($this.currentTimeOut);
                            return;
                        }
                        //last validate
                        if (data.taskid == $this.current.taskid) {
                            $this.current = data;
                        }
                    });
                });
            } , 1000);

        });
    }


    /**
     * 播放
     * @param playerIndex
     */
    playCurrentSrc (playerIndex) {
        if (playerIndex === undefined) playerIndex = $this.currentPlayerIndex;
        let $this = this;
        if (!$this.currentIndex) {
            return;
        }
        let voiceList = $this.current['voice_list'];
        let thissrc = '';
        for (let i in voiceList) {
            if (voiceList[i].index == playerIndex) {
                thissrc = voiceList[i].voice_src;
            }
        }
        if (!thissrc) {
            return;
        }

        $this.setCurrentStatus('wait' , false);
        $this.setCurrentStatus('tips' , '');
        $this.setCurrentStatus('palyer' , true);
        $this.currentPlayerIndex = playerIndex;
        $this.audio.src = $this.playUrl + thissrc;
        $this.audio.play();
    }


    /**
     * 更新播放任务信息
     * @param taskid
     * @param index
     * @param callback
     */
    updateIndexPlayer (taskid , index , callback) {
        let $this = this;

        try {
            $this.ttsApp.getinfo(taskid , function (taskinfo) {
                if (taskinfo.taskid == taskid) {
                    $this.storage.set(index , taskinfo , callback);
                }
            });
        } catch (e) {
            console.log(e);
        }
    }


    //加入了新的播放队列
    newPlayer () {
        let $this = this;
        if (!$this.audio.paused) {  //播放中
            return;
        };

        $this.speak.isSpeak(function (speak) {
            if (speak) {
                return; //已将开始播放讲述人
            }

            //无播放进行中
            //自动切换到最后插入的
            $this.getEndIndex(function (index , data) {
                if (index === 0) {
                    return false; //没有
                }
                setTimeout(function () {
                    $this.playIndex(index);
                } , 1000)
            });
        })
    }


    //播完完毕事件
    playerOver () {
        let $this = this;
        if (!$this.currentIndex) {
            return;
        }

        /**
         * @param playerIndex
         * @param callback
         */
        let waiting = function (playerIndex , callback) {
            $this.updateIndexPlayer($this.current.taskid , $this.currentIndex , function () {
                $this.storage.get($this.currentIndex , function (data) {
                    if (data.status === 4) {
                        alert('语音合成异常');return false;
                    }
                    $this.current = data;

                    //缓冲
                    if (playerIndex > $this.current.loadnums) {
                        setTimeout(function () {
                            waiting(playerIndex);
                        } , 800);
                    } else {
                        callback && callback();
                    }
                });
            });
        }

        if ($this.currentPlayerIndex < $this.current.total_block) {
            let thisPlayerIndex = parseInt($this.currentPlayerIndex) + 1;
            if (thisPlayerIndex > $this.current.loadnums) {
                //需等待缓冲
                waiting(thisPlayerIndex , function () {
                    $this.setCurrentStatus('wait' , true);  //wait
                    //切换下一子音频
                    $this.playCurrentSrc(thisPlayerIndex);
                });
            } else {
                //切换下一子音频
                $this.playCurrentSrc(parseInt($this.currentPlayerIndex) + 1);
            }
        } else {
            //切换下一个
            $this.getNextIndex($this.currentIndex , function (nextindex , nextdata) {
                if (nextindex === 0) {
                    $this.setCurrentStatus({tips:'',text:'',palyer:false,wait:false});
                    $this.current = {};
                    $this.currentIndex = 0;
                    $this.currentPlayerIndex = 1;

                    $this.audio.src = ''; //清空播放
                    return false; //没有啦
                }

                setTimeout(function () {
                    $this.playIndex(nextindex);
                } , 1000)
            });
        }
    }

    //删除播放
    deletePlayer (index) {
        let $this = this;

        if (!$this.currentIndex) {
            return;
        }
        if ($this.currentIndex == index) {
            $this.setCurrentStatus({tips:'',text:'',palyer:false,wait:false});
            //关闭播放
            $this.current = {};
            $this.currentIndex = 0;
            $this.currentPlayerIndex = 1;

            $this.speak.stop();  //关闭讲述人
            clearInterval($this.currentTimeOut); //清除定时任务

            $this.audio.src = '';
            $this.audio.pause();
        }
    }


    /**
     * 查询最后一个
     * @param callback
     */
    getEndIndex(callback) {
        let $this = this;
        $this.storage.getAll(function (data) {
            let endindex = 0;
            let end = {};
            if (data.length > 0) {
                endindex = data[data.length - 1].index;
                end = data[data.length - 1];
            }
            callback && callback(endindex , end);
        });
    }

    /**
     * 查询下一个
     * @param index
     * @param callback
     */
    getNextIndex (index , callback) {
        let $this = this;
        $this.storage.getAll(function (data) {
            let thisele = -1;
            for (let i in data) {
                if (data[i].index == index) {
                    thisele = parseInt(i);
                }
            }
            if (thisele == -1) {
                callback && callback(0 , {});return;
            }
            if (thisele == (data.length-1)) { //最后一个
                callback && callback(0 , {});return;
            }
            let next = data[thisele + 1];
            callback && callback(next.index , next);
        });
    }

    /**
     * 查询上一个
     * @param index
     * @param callback
     */
    getLastIndex (index , callback) {
        let $this = this;
        $this.storage.getAll(function (data) {
            let thisele = -1;
            for (let i in data) {
                if (data[i].index == index) {
                    thisele = parseInt(i);
                }
            }
            if (thisele === -1) {
                callback && callback(0 , {});return;
            }
            if (thisele === 0) { //第一个
                callback && callback(0 , {});return;
            }
            let last = data[thisele - 1];
            callback && callback(last.index , last);
        });
    }

    /**
     * @returns {HTMLElement | *}
     */
    getAudio () {
        return this.audio;
    }
}