var tips = {
    //通用对话框
    alert: function(msg, act) {
        if (frameElement == null || frameElement.api == undefined) {
            this.alert1(msg, act);
        } else {
            var api = frameElement.api,
                W = api.opener;
            W.$.dialog.alert(msg, function() {
                setTimeout(function() {
                    if (typeof act == 'function') {
                        act();
                    } else {
                        eval(act);
                    }
                }, 1);
            });
        }
    },
    alert1: function(msg, act) {
        $.dialog.alert(msg, function() {
            if (typeof act == 'function') {
                act();
            } else {
                eval(act);
            }
        });
    },
    alertByTime: function(src, msg, t) {
        if (src == 1) {
            src = "success.gif";
        } else {
            src = "error.gif";
        }
        if (t == ''){ t = 2; }
        $.dialog.tips(msg, t, src, function() {});

    },
    confirm: function(msg, fun1, fun2) {
        if (frameElement == null || frameElement.api == undefined) {
            this.confirm1(msg, fun1, fun2);
        } else {
            var api = frameElement.api,
                W = api.opener;
            W.$.dialog.confirm(msg, function() {
                setTimeout(function() {
                    eval(fun1);
                }, 1);
            }, function() {
                setTimeout(function() {
                    eval(fun2);
                }, 1);
            });
        }
    },
    confirm1: function(msg, fun1, fun2) {
        $.dialog.confirm(msg, function() {
            if (typeof fun1 == 'function') {
                fun1();
            } else {
                eval(fun1);
            }
        }, function() {
            if (typeof fun2 == 'function') {
                fun2();
            } else {
                eval(fun2);
            }
        });
    },
    tips: function(title, msg, w, h) {
        $.dialog({
            title: title,
            content: msg,
            width: w,
            height: h,
            max: false,
            min: false
        });
    }
};