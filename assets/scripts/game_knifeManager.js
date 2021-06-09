
cc.Class({
    extends: cc.Component,

    properties: {
        // 刀光颜色
        knift_color: "#cbd3db",
        // 刀光的生命周期
        knift_lift: 0.2,
        // 刀光的宽度
        knift_width: 10,
        // 刀光的长度
        knift_height: 10,
        // 是否激活刀光效果
        knift_isActivate: false,
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        // 初始化
        this._init_();
    },

    // 初始化函数
    _init_: function() {
        // 设置刀光颜色
        this.node.color = new cc.Color().fromHEX(this.knift_color);    // 将十六进制形式颜色转换为rgb形式。
        // 初始化刀光大小和角度
        this.node.width = this.knift_width;
        this.node.height = this.knift_height;
        this.node.angle = 0;
    },

    start () {

    },

    update (dt) {
        if(!this.knift_isActivate) {
            return;
        }
        // 刀光的生命周期随着时间流逝而减少
        // this.knift_lift -= dt;
        // 同时，刀光轨迹逐渐消失
        if(this.node.width > 0) {
            // this.knift_lift -= dt;   // 让刀光由慢到快逐渐消失
            this.node.width -= (dt / this.knift_lift) * this.knift_width;
        } else {
            this.reset_properties();
            this.node.removeFromParent();
        }
    },

    // 刀光属性重置函数
    reset_properties: function() {
        this.knift_color = "#cbd3db";
        this.knift_lift = 0.2;
        this.knift_width = 10;
        this.knift_height = 10;
        this.knift_isActivate = false;
        this.node.color = new cc.Color().fromHEX(this.knift_color);
        this.node.width = this.knift_width;
        this.node.height = this.knift_height;
        this.node.angle = 0;
    }
});
