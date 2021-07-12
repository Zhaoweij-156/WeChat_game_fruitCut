
cc.Class({
    extends: cc.Component,

    properties: {
        // UI界面节点
        node_ui_home: {
            type: cc.Node,
            default: null,
        },
        // 水果预制体
        prefab_fruit_ALL: {
            type: cc.Prefab,
            default: [],
        },
        // 水果的根节点
        node_fruits_ALL: {
            type: cc.Node,
            default: null,
        },

        // 刀光预制体
        prefab_knife: {
            type: cc.Prefab,
            default: null,
        },
        // 刀光的根节点
        node_knives_ALL: {
            type: cc.Node,
            default: null,
        },
        // 刀光的对象池
        objectPool_knives: [],
        // 刀光的对象池的容量
        objectPool_knives_size: 10,
        // 刀光的宽度高度
        knife_width: 10,
        knife_height: 10,

        // 玩家得分的根节点
        node_score_ALL: {
            type: cc.Node,
            default: null,
        },
        // 分数的字体
        label_score: {
            type: cc.Label,
            default: null,
        },
        // 最高得分的字体
        label_best: {
            type: cc.Label,
            default: null,
        },
        // 玩家生命值的根节点
        node_playerLife_ALL: {
            type: cc.Node,
            default: null,
        },

        // 游戏结束界面的根节点
        node_over_ALL: {
            type: cc.Node,
            default: null,
        },

        // 游戏主页（菜单界面）背景音乐
        audio_menu: {
            type: cc.AudioClip,
            default: null,
        },
        // 游戏开始的音效
        audio_start: {
            type: cc.AudioClip,
            default: null,
        },
        // 水果抛出的音效
        audio_throw: {
            type: cc.AudioClip,
            default: null,
        },
        // 切水果的音效
        audio_splatter: {
            type: cc.AudioClip,
            default: null,
        },
        // 炸弹爆炸的音效
        audio_boom: {
            type: cc.AudioClip,
            default: null,
        },
        // 游戏结束的音效
        audio_over: {
            type: cc.AudioClip,
            default: null,
        }, 
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        // 初始化
        this._init_();
    },

    // 初始化函数
    _init_: function() {
        // 初始化切水果得分
        this.score = 0;
        // 玩家坐高得分
        this.best = 0;
        // 初始化玩家生命值
        this.player_life = 3;
        // 初始化刀光对象池
        for(let i = 0; i < this.objectPool_knives_size; i++) {
            this.objectPool_knives.push(cc.instantiate(this.prefab_knife));
        }
    },

    start () {
        // 显示主页
        this.game_index();
        // 添加监听事件
        this.node.on(cc.Node.EventType.TOUCH_START, this.finger_touch_start, this);
        this.node.on(cc.Node.EventType.TOUCH_MOVE, this.finger_touch_move, this);
    },

    // 显示游戏主页（菜单界面）函数
    game_index: function() {
        console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
        // 停止正在播放的所有音频
        cc.audioEngine.stopAll();
        // 清空所有的水果和刀光
        this.node_fruits_ALL.removeAllChildren();
        this.node_knives_ALL.removeAllChildren();

        // 游戏可以开始游玩
        this.canStart = true;
        // 显示UI界面
        this.node_ui_home.active = true;
        // 隐藏玩家得分和生命值面板
        this.node_score_ALL.active = false;
        this.node_playerLife_ALL.active = false;
        // 隐藏游戏结束界面
        this.node_over_ALL.active = false;
        // 开启碰撞检测
        cc.director.getCollisionManager().enabled = true;
        // 播放游戏主页背景音乐
        this.audioID_menu = cc.audioEngine.play(this.audio_menu, true, 1.0);
    },

    update (dt) {

    },

    // 刀光对象池中对象获取函数
    getKnifeFromObjectPool: function() {
        // 在对象池中找到未激活的对象并返回
        for(let i = 0; i < this.objectPool_knives_size; i++) {
            if(!this.objectPool_knives[i].getComponent("game_knifeManager").knift_isActivate) {
                this.objectPool_knives[i].getComponent("game_knifeManager").knift_isActivate = true;
                return this.objectPool_knives[i];
            }
        }
        // 如果对象池中的对象全被激活，则进行扩容
        var newObject_knife = cc.instantiate(this.prefab_knife);
        this.objectPool_knives.push(newObject_knife);
        this.objectPool_knives_size++;
        newObject_knife.getComponent("game_knifeManager").knift_isActivate = true;
        return newObject_knife;
    },

    // 手指触摸屏幕时事件的回调函数
    finger_touch_start: function(event) {
        // 获取当前手指开始触摸屏幕的世界坐标（刀光轨迹起始点）
        this.touchStart_position = event.getLocation();
        // 转换为局部坐标
        let knives_nodeSpaceAR = this.node_knives_ALL.convertToNodeSpaceAR(this.touchStart_position);
        let myObject_knife = this.getKnifeFromObjectPool();
        if(!!myObject_knife) {
            // 设置刀光的节点位置
            myObject_knife.setPosition(knives_nodeSpaceAR);
            // 加入到根节点
            this.node_knives_ALL.addChild(myObject_knife);
        }
    },

    // 手指在屏幕移动时事件的回调函数
    finger_touch_move: function(event) {
        // 刀光生成处理
        // 获取当前手指在屏幕上移动到的世界坐标（刀光轨迹末尾点）
        this.touchMove_position = event.getLocation();
        // 计算移动的距离（两向量相减得到移动向量再计算其长度）
        var vectorLen = this.touchMove_position.sub(this.touchStart_position).mag();
        // 计算移动的角度（两向量相减得到移动向量再计算其与x轴（选x轴作为正方向）的夹角弧度，最后转换为角度）
        // signAngle(cc.v2(1, 0)计算的夹角弧度，若其方向为顺时针则为正值，逆时针则为负值，所以需要取负
        var vectorAngle = -this.touchMove_position.sub(this.touchStart_position).signAngle(cc.v2(1, 0)) / Math.PI * 180;
        // console.log("vectorAngle: " + vectorAngle);

        if(vectorLen >= this.knife_height) {
            // 以touchMove_position与touchStart_position两点之间的中点作为刀光的位置（两向量相加再除2得到中点向量）
            let knives_nodeSpaceAR = this.node_knives_ALL.convertToNodeSpaceAR(this.touchMove_position.add(this.touchStart_position).div(2));
            let myObject_knife = this.getKnifeFromObjectPool();
            if(!!myObject_knife) {
                // 该表刀光长度（高度）
                myObject_knife.height = vectorLen;
                // console.log("myObject_knife.height: " + myObject_knife.height);
                // 旋转刀光符合手指移动轨迹
                myObject_knife.angle = vectorAngle - 90;
                // console.log("myObject_knife.angle: " + myObject_knife.angle);
                // 设置刀光的节点位置
                myObject_knife.setPosition(knives_nodeSpaceAR);
                // 加入到根节点
                this.node_knives_ALL.addChild(myObject_knife);
            }
            // 移动到的世界坐标变为起始点的世界坐标，以便下次刀光轨迹形成
            this.touchStart_position = this.touchMove_position;
        }

        // 水果和炸弹被切开的处理
        this.cut_one_fruit(vectorAngle);
    },

    // 游戏开始函数
    game_start: function(event, level) {
        if(!this.canStart) {
            return;
        }
        // 游戏已开始，不可再执行此函数
        this.canStart = false;
        // 隐藏UI界面
        this.node_ui_home.active = false;
        // 显示得分和生命值面板
        this.node_score_ALL.active = true;
        this.node_playerLife_ALL.active = true;
        // 记录最高得分
        if(this.score > this.best) {
            this.best = this.score;
        }
        this.label_best.string = "" + this.best;
        // 得分和生命值重置
        this.score = 0;
        this.label_score.string = "" + this.score;
        this.life_reset();

        // 停止播放游戏主页的背景音乐
        cc.audioEngine.stop(this.audioID_menu);
        // 播放游戏开始的音效
        this.audioID_start = cc.audioEngine.play(this.audio_start, false, 1.0);

        // 音效播放完毕后抛出水果
        cc.audioEngine.setFinishCallback(this.audioID_start, function() {
            // 0.5秒后抛出水果
            this.scheduleOnce(this.instantiate_one_fruit.bind(this), 0.5);
            // this.instantiate_one_fruit();
        }.bind(this));
    },

    // 实例化预制体水果函数
    instantiate_one_fruit: function() {
        // 随机产生水果的初速度、抛射角和种类
        let speed_initial_main = 1000 + 400 * Math.random();  // 初速度为800~1200
        let angle_throw = 70 + 40 * Math.random();      // 抛射角为70°~110°
        // console.log("v0 and angle: " + speed_initial + " " + angle_throw);
        let prefab_fruit_index = Math.floor(this.prefab_fruit_ALL.length * Math.random());
        // console.log("prefab_fruit_index: "+prefab_fruit_index);
        
        // 实例化预制体
        var myFruit = cc.instantiate(this.prefab_fruit_ALL[prefab_fruit_index]);
        // 初始化位置
        myFruit.x = 0;
        myFruit.y = -(cc.winSize.height * 0.5 + 100);
        // 设置参数
        let component_game_fruitManager = myFruit.getComponent("game_fruitManager");
        component_game_fruitManager.speed_initial_main = speed_initial_main;
        component_game_fruitManager.angle_throw = angle_throw;
        // 如果是炸弹，则要修改水果类型
        if(prefab_fruit_index == this.prefab_fruit_ALL.length - 1) {
            component_game_fruitManager.fruit_type = "bomb";
        }

        // 加入到根节点中统一管理
        this.node_fruits_ALL.addChild(myFruit);

        // 播放抛出水果的音效
        this.audioID_throw = cc.audioEngine.play(this.audio_throw, false, 1.0);

        // 使用计时器不断抛出水果
        let instantiate_interval = 1 + Math.random();
        this.scheduleOnce(this.instantiate_one_fruit.bind(this), instantiate_interval);
    },

    // 水果和炸弹被切开时的处理函数
    cut_one_fruit: function(cutAngle) {
        // 循环遍历所有水果，检测水果是否与刀光相交
        for(let i = 0; i < this.node_fruits_ALL.childrenCount; i++) {
            let child_fruit = this.node_fruits_ALL.children[i];
            let component_game_fruitManager = child_fruit.getComponent("game_fruitManager");
            let component_polygonCollider = child_fruit.getComponent(cc.PolygonCollider);
            if(!!component_game_fruitManager && component_game_fruitManager.startThrowingInMain === true && component_game_fruitManager.startFallingInPart === false && 
               !!component_polygonCollider && cc.Intersection.pointInPolygon(this.touchMove_position, component_polygonCollider.world.points)) {
                // 水果被切开
                // console.log("The fruit or bomb is cut");
                if(component_game_fruitManager.fruit_type == "fruit") {
                    // 得分加1
                    this.score++;
                    this.label_score.string = "" + this.score;
                    // 播放水果分开的音效
                    this.audioID_splatter = cc.audioEngine.play(this.audio_splatter, false, 1.0);
                    // 水果分开
                    component_game_fruitManager.fruit_apart(cutAngle);
                } else {
                    // 游戏暂停
                    this.game_pause(true);
                    // 播放炸弹爆炸的音效
                    this.audioID_boom = cc.audioEngine.play(this.audio_boom, false, 1.0);
                    // 炸弹爆炸
                    component_game_fruitManager.bomb_blowup(10);    // 10道爆炸光线
                }
            }
        }
    },

    // 生命值扣除函数
    life_reduce: function() {
        // 显示已失去的生命值
        switch(this.player_life) {
            case 3:
                this.life_xf.active = true;
                break;
            case 2:
                this.life_xxf.active = true;
                break;
            case 1:
                this.life_xxxf.active = true;
                break;
        }
        this.player_life--;
        // 生命值为0，游戏结束
        if(this.player_life == 0) {
            // 游戏暂停
            this.game_pause(false);
            // 游戏结束
            this.game_over();
        }
    },

    // 生命值重置函数
    life_reset: function() {
        if(!this.node_playerLife_ALL) {
            this.node_playerLife_ALL = this.node.getChildByName("game_playerLife_ALL");
        }
        this.player_life = 3;
        this.node_playerLife_ALL.getChildByName("x").active = true;
        this.node_playerLife_ALL.getChildByName("xx").active = true;
        this.node_playerLife_ALL.getChildByName("xxx").active = true;
        this.life_xf = this.node_playerLife_ALL.getChildByName("xf");
        this.life_xxf = this.node_playerLife_ALL.getChildByName("xxf");
        this.life_xxxf = this.node_playerLife_ALL.getChildByName("xxxf");
        this.life_xf.active = false;
        this.life_xxf.active = false;
        this.life_xxxf.active = false;
    },

    // 游戏暂停函数
    game_pause: function(isStopFruitThrowing) {
        // 不再生成水果或炸弹
        this.unscheduleAllCallbacks();
        // 关闭碰撞检测
        cc.director.getCollisionManager().enabled = false;
        // 根据isStopFruitThrowing暂停正在运动的水果或炸弹
        if(isStopFruitThrowing) {
            for(let i = 0; i < this.node_fruits_ALL.childrenCount; i++) {
                let child_fruit = this.node_fruits_ALL.children[i];
                let component_game_fruitManager = child_fruit.getComponent("game_fruitManager");
                if(!!component_game_fruitManager && component_game_fruitManager.startThrowingInMain === true) {
                    component_game_fruitManager.fruit_main_action_pause();
                }
            }
        }
    },

    // 游戏结束函数
    game_over: function() {
        // 显示游戏结束界面
        this.node_over_ALL.active = true;
        
        // 播放游戏结束的音乐特效
        this.audioID_over = cc.audioEngine.play(this.audio_over, false, 1.0);

        // 逐渐显示game over字体
        let child_game_over = this.node_over_ALL.getChildByName("game-over");
        child_game_over.opacity = 0;
        child_game_over.setScale(0);
        // 渐显动作
        let over_action_fade = cc.fadeIn(1.0);
        // 逐渐变大动作
        let over_action_scale = cc.scaleTo(1.0, 1);
        // 同步执行动作
        let over_action_spawn = cc.spawn(over_action_fade, over_action_scale);
        child_game_over.runAction(over_action_spawn);
    },

});
