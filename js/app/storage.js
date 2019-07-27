class Storage {
    constructor() {
        this.key = '_player_runing_';
    }

    put (player , callback) {
        let $this = this;

        if (player.constructor != Object) {
            throw new Error('player is not object .');
        }
        chrome.storage.local.get($this.key , function(data){
            if (data) {
                if (data.hasOwnProperty($this.key) && data[$this.key].length > 0) {
                    let originData = data[$this.key];
                    let lastIndex = originData[originData.length - 1].index;
                    player.index = parseInt(lastIndex)+1;
                    originData.push(player);
                    //update
                    let setdata = {}
                    setdata[$this.key] = originData;
                    chrome.storage.local.set(setdata , callback);
                } else {
                    let setdata = {};
                    player.index = 1;
                    setdata[$this.key] = [player];
                    chrome.storage.local.set(setdata , callback);
                }
            }
        });
    }

    getAll (callback) {
        let $this = this;

        chrome.storage.local.get($this.key , function(data){
            if (data && data.hasOwnProperty($this.key)) {
                callback && callback(data[ $this.key ]);
            } else {
                callback && callback([]);
            }
        });
    }

    get (index , callback) {
        let $this = this;

        $this.getAll(function (data) {
            for (let i in data) {
                if (data[i].index == index) {
                    callback && callback(data[i]);
                    return false;
                }
            }

            callback && callback(undefined);
        });
    }

    set (index , taskinfo , callback) {
        let $this = this;

        $this.getAll(function (data) {
            for (let i in data) {
                if (data[i].index == index) {
                    taskinfo.index = index;
                    data[i] = $.extend(data[i] , taskinfo);
                }
            }
            let setdata = {};
            setdata[$this.key] = data;
            chrome.storage.local.set(setdata , callback);
        });
    }

    delete(index , callback) {
        let $this = this;

        $this.getAll(function (data) {
            for (let i in data) {
                if (data[i].index == index) {
                    data.splice(i , 1);
                }
            }
            let setdata = {};
            setdata[$this.key] = data;
            chrome.storage.local.set(setdata , callback);
        });
    }

    clear (callback) {
        let $this = this;

        chrome.storage.local.remove($this.key , callback);
    }
}