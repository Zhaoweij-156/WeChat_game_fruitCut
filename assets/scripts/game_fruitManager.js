
cc.Class({
    extends: cc.Component,

    properties: {
        // 水果主体的初速度
        speed_initial_main: 1000,
        // 水果的抛射角
        angle_throw: 90,
        // 水果旋转一圈的时间
        fruit_main_rotate_duration: 3,
        // 水果分开时的初速度
        speed_initial_apart: 100,
        // 水果类型（用于辨别炸弹）
        fruit_type: "fruit",
        // 炸弹爆炸光线的颜色
        bomb_light_color: "ffffff",
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        // 初始化
        this._init_();
    },

    // 初始化函数
    _init_: function() {
        // 水果的重力加速度
        this.speed_g = -800;
        // 计算水果主体弧度
        var radian = this.angle_throw * Math.PI / 180;
        // 计算水果主体在x轴方向的初速度
        this.speed_x_main = this.speed_initial_main * Math.cos(radian);
        // 计算水果主体在y轴方向的初速度
        this.speed_y_main = this.speed_initial_main * Math.sin(radian);
        // 爆炸后闪光的不透明度
        this.color_opacity = 255;
        // 切后闪光的维持时间
        this.knife_flash_time = 0;
    },

    start () {
        // 水果主体可以运动
        this.canMove = true;
        // 水果主体开抛
        this.startThrowingInMain = true;
        // 水果部分体落下
        this.startFallingInPart = false;
        // 是否开始生成爆炸后的闪光
        this.flashStart = false;
        // 让水果主体不断旋转起来
        this.fruit_main_rotate();
    },

    update (dt) {
        // console.log("dt: " + dt);
        // 水果抛出运动
        if(this.startThrowingInMain) {
            // 主体是否可以运动
            if(this.canMove) {
                // 水平方向上匀速运动
                this.node.x += this.speed_x_main * dt;
                // 垂直方向上竖直上抛
                this.node.y += this.speed_y_main * dt + 0.5 * this.speed_g * dt * dt;
                this.speed_y_main += this.speed_g * dt;

                // if(this.speed_y_main <= 0) {
                //     this.fruit_apart();
                // }
                
                // 抛出界外则移除并扣除生命值
                if(this.node.y <= -(cc.winSize.height * 0.5 + 100) || this.node.x <= -(cc.winSize.width * 0.5 + 100) || this.node.x >= (cc.winSize.width * 0.5 + 100)) {
                    // 没有切到水果，扣除一点生命值
                    if(this.fruit_type == "fruit") {
                        let component_game_cutLogic = cc.find("Canvas").getComponent("game_cutLogic");
                        component_game_cutLogic.life_reduce();
                    }
                    // console.log("remove success from " + this.node.parent);
                    this.node.removeFromParent();
                }
            }
        }

        // 水果分开运动
        if(this.startFallingInPart && this.fruit_type === "fruit") {
            // 水平方向上匀速运动
            this.fruit_lhs.x -= this.speed_x_apart * dt;
            this.fruit_rhs.x += this.speed_x_apart * dt;
            // 垂直方向上竖直下抛
            this.fruit_lhs.y += this.speed_y_apart * dt + 0.5 * this.speed_g * dt * dt;
            this.fruit_rhs.y += this.speed_y_apart * dt + 0.5 * this.speed_g * dt * dt;
            this.speed_y_apart += this.speed_g * dt;
            // console.log("this.fruit_lhs.y: " + this.fruit_lhs.y);
            // console.log("this.fruit_rhs.y: " + this.fruit_rhs.y);

            this.knife_flash_time += dt;
            if(this.knife_flash_time >= 0.3) {
                this.fruit_flash.active = false;
            }

            // 落到界外则移除（分开时父节点不再移动，所以界外判定条件需加上父节点的y值）
            if(this.fruit_lhs.y <= -(cc.winSize.height + this.node.y + 100) && this.fruit_rhs.y <= -(cc.winSize.height + this.node.y + 100)) {
                // console.log("remove success from " + this.node.parent);
                this.node.removeFromParent();
            }
        }

        // 爆炸后的闪光
        if(this.flashStart && this.fruit_type === "bomb" && !!this.component_graphics && this.color_opacity > 0) {
            // 清空画板
            this.component_graphics.clear();
            // 矩形填充的白色逐渐变的透明形成闪光效果（3秒内闪完）
            this.component_graphics.fillColor = new cc.Color().fromHEX(this.bomb_light_color).setA(this.color_opacity -= 255 * dt / 3);
            this.component_graphics.fillRect(0, 0, 1000, 1500);
            
            // 闪完后移除
            if(this.color_opacity <= 0) {
                // 游戏结束
                let component_game_cutLogic = cc.find("Canvas").getComponent("game_cutLogic");
                component_game_cutLogic.game_over();
                // console.log("remove success from " + this.node.parent);
                this.node.removeFromParent();
            }
        }
    },

    // 水果主体旋转函数
    fruit_main_rotate: function() {
        // 水果主体在3秒内按顺时针旋转360°
        let fruit_main_action_rotate = cc.rotateBy(this.fruit_mainrotate_duration, 360);
        let fruit_main_action_forever = cc.repeatForever(fruit_main_action_rotate);
        this.node.runAction(fruit_main_action_forever);
    },

    // 水果或炸弹主体运动暂停函数
    fruit_main_action_pause: function() {
        // 暂停水果主体的旋转
        this.node.pauseAllActions();
        // 水果主体位置静止
        this.canMove = false;
    },

    // 水果或炸弹主体运动恢复函数
    fruit_main_action_resume: function() {
        // 恢复水果主体暂停的旋转
        this.node.resumeAllActions();
        // 水果主体恢复运动
        this.canMove = true;
    },

    // 水果分开函数
    fruit_apart: function(cutAngle) {
        // console.log("cutAngle: " + cutAngle);

        // 切换到水果分开的状态
        this.startThrowingInMain = false;
        this.startFallingInPart = true;

        // 显示被劈开的水果图片和切后闪光
        this.fruit_main = this.node.getChildByName("main");
        this.fruit_lhs = this.node.getChildByName("lhs");
        this.fruit_rhs = this.node.getChildByName("rhs");
        this.fruit_flash = this.node.getChildByName("flash");
        this.fruit_main.active = false;
        this.fruit_lhs.active = true;
        this.fruit_rhs.active = true;
        this.fruit_flash.active = true;
        
        // 停止并移除水果主体的旋转
        this.node.stopAllActions();

        // 计算当时水果部分体在水平方向上的速度
        // console.log("this.node.angle: " + this.node.angle);
        // var fruit_main_current_radian = this.node.angle * Math.PI / 180;
        var fruit_main_current_radian = (cutAngle + 90) * Math.PI / 180;    // cutAngle + 90 -> 指向水果rhs部分体的角度
        this.speed_x_apart = this.speed_initial_apart * Math.cos(fruit_main_current_radian);
        this.speed_y_apart = -Math.abs(this.speed_initial_apart * Math.sin(fruit_main_current_radian));

        // 计算fruit_flash要变化的角度
        let changeAngle = cutAngle - this.fruit_flash.angle; 
        // 改变水果主体和部分体的角度，方便部分体后续移动
        this.fruit_lhs.angle += changeAngle;
        this.fruit_rhs.angle += changeAngle;
        this.fruit_flash.angle = cutAngle;
        // this.fruit_lhs.angle = this.node.angle;
        // this.fruit_rhs.angle = this.node.angle;
        // this.fruit_flash.angle += this.node.angle;   // 说明：fruit_flash本身具有角度
        this.node.angle = 0;

        // 让水果部分体在一定时间内旋转一定角度
        let fruit_apart_rotate_duration = 4;
        let fruit_apart_rotate_angle =150 + 50 * Math.random();
        // 当Math.cos(fruit_main_current_radian) < 0时，水果左部分体在右边，水果右部分体在左边，旋转时要按反方向旋转
        if(this.speed_x_apart < 0) {
            fruit_apart_rotate_angle = -fruit_apart_rotate_angle;
        }
        // 水果左部分体在fruit_apart_rotate_duration秒内按逆时针旋转fruit_apart_rotate_angle度
        this.fruit_lhs.runAction(cc.rotateBy(fruit_apart_rotate_duration, -fruit_apart_rotate_angle));
        // 水果右部分体在fruit_apart_rotate_duration秒内按顺时针旋转fruit_apart_rotate_angle度
        this.fruit_rhs.runAction(cc.rotateBy(fruit_apart_rotate_duration, fruit_apart_rotate_angle));
    },

    bomb_blowup: function(light_num) {
        // 切换到炸弹爆炸状态
        this.startThrowingInMain = false;
        this.startFallingInPart = false;
        
        // 计算每道光线之间的间隔角度
        this.light_interval_angle = Math.floor(360 / light_num);
        // 随机排布每道光线生成的先后顺序
        // 赋值
        this.light_order_array = [];
        for(let i = 0; i < light_num; i++) {
            this.light_order_array[i] = i;
        }
        // 随机排列
        let n = this.light_order_array.length;
        for(let i = 0; i < n; i++) {
            // 从后n-i个元素中随机选择出一位元素放到i位置上
            let select = Math.floor(Math.random() * (n - i) + i);
            let temp = this.light_order_array[i];
            this.light_order_array[i] = this.light_order_array[select];
            this.light_order_array[select] = temp;
        }
        // 第二种排列方法
        // this.newArray = [],
        // while(this.light_order_array.length > 0) {
        //     // 从原数组中随机选择一位元素出来并在原数组中删除该元素，将该元素添加到新数组中
        //     var select = this.light_order_array.splice(Math.floor(Math.random() * n), 1)[0];
        //     this.newArray.push(select);
        // }

        // 绘制光线
        this.light_index = -1;
        this.createExplodingLight();
    },

    createExplodingLight: function() {
        this.light_index++;
        if(this.light_index >= this.light_order_array.length) {
            // 绘制完毕
            // console.log("createExplodingLight finished !");
            // 炸弹和其他水果消失
            let parent_bomb = this.node.parent;
            for(let i = 0; i < parent_bomb.childrenCount; i++) {
                let child_fruit = parent_bomb.children[i];
                if(child_fruit.name == "boom") {    // 隐藏炸弹
                    child_fruit.getChildByName("main").active = false;
                } else {    // 移除水果
                    child_fruit.removeFromParent();
                }
            }
            // 开始闪光
            this.flashStart = true;
            return;
        }
        // 爆炸光线的线段长度
        let light_length = 1074;
        // 计算爆炸光线的左右线段的角度
        let light_leftLine_angle = (this.light_interval_angle * this.light_order_array[this.light_index] - 2.5) * Math.PI / 180;
        let light_rightLine_angle = (this.light_interval_angle * this.light_order_array[this.light_index] + 2.5) * Math.PI / 180;
        // 计算爆炸光线的左右线段末端点的位置
        let exploding_worldSpaceAR = this.node.parent.convertToWorldSpaceAR(cc.v2(this.node.x, this.node.y));
        let light_leftLine_end_x = light_length * Math.cos(light_leftLine_angle) + exploding_worldSpaceAR.x;
        let light_leftLine_end_y = light_length * Math.sin(light_leftLine_angle) + exploding_worldSpaceAR.y;
        let light_rightLine_end_x = light_length * Math.cos(light_rightLine_angle) + exploding_worldSpaceAR.x;
        let light_rightLine_end_y = light_length * Math.sin(light_rightLine_angle) + exploding_worldSpaceAR.y;

        // 绘制爆炸光线
        let paintingBoard = this.node.getChildByName("paintingBoard");
        this.component_graphics = paintingBoard.getComponent(cc.Graphics);
        if(!this.component_graphics) {
           this.component_graphics = paintingBoard.addComponent(cc.Graphics);
        }
        // 设置绘制线段的起始点
        this.component_graphics.moveTo(exploding_worldSpaceAR.x, exploding_worldSpaceAR.y);
        // 定义左右线段
        this.component_graphics.lineTo(light_leftLine_end_x, light_leftLine_end_y);
        this.component_graphics.lineTo(light_rightLine_end_x, light_rightLine_end_y);
        // 左右线段闭合成图形
        this.component_graphics.close();
        // 绘制已定义的线段
        this.component_graphics.stroke();
        // 图形内填充颜色
        this.component_graphics.fillColor = new cc.Color().fromHEX(this.bomb_light_color);
        this.component_graphics.fill();

        // 使用计时器绘制下一道光线（1秒内绘制完所有光线）
        this.scheduleOnce(this.createExplodingLight.bind(this), 1 / this.light_order_array.length);
    },

});
