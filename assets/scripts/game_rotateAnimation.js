
cc.Class({
    extends: cc.Component,

    properties: {
        // 旋转一圈的时间
        rotate_duration: 3,
    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},

    start () {
        this.button_rotate();
    },

    // update (dt) {},

    // 按钮旋转函数
    button_rotate: function() {
        var button_action_rotate = cc.rotateBy(this.rotate_duration, 360).easing(cc.easeCubicActionInOut());
        var button_action_forever = cc.repeatForever(button_action_rotate);
        this.node.runAction(button_action_forever);
    },
});
