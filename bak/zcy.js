/*
本脚本仅供学习参考
*/
const jsname = '参考学习'
const $ = Env(jsname)
const logDebug = 0

const notifyFlag = 1; //0为关闭通知，1为打开通知,默认为1
const notify = $.isNode() ? require('./sendNotify') : '';
let notifyStr = ''

let httpResult //global buffer

let userCookie = ($.isNode() ? process.env.zcyCookie : $.getdata('zcyCookie')) || '';
let userCookieArr = []
let userList = []

let withdrawTime = ($.isNode() ? process.env.zcyWithdrawTime : $.getdata('zcyWithdrawTime')) || 20;
let currentTime = (new Date()).getHours()

let userIdx = 0
let userCount = 0

let rewardList = [8,12,21,22,24,25,26]
let convertList = [10000, 5000, 1000]

let md5Salt = '&appid=client_jpKdCKYdEC2hda0xXVg0IpArg&appkey=l4hCwPoSz1bYXvZGp99AtbkbNzLIw2pdVHqDpyPPRfwWV09137IqhelBmj56QdGv'
///////////////////////////////////////////////////////////////////
class UserInfo {
    constructor(str) {
        let info = str.split('#')
        this.index = ++userIdx
        this.uid = info[0] || '' 
        this.auth = info[1] || '' 
        this.taskFlag = true
        this.valid = true
        this.stepReward = []
    }
    
    async getProfile() {
        let caller = printCaller()
        let reqStr = `account_id=${this.uid}&foo=bar&gain_category=energy`
        let sign = EncryptSign(reqStr)
        let url = `https://step-money.quanxiangweilai.cn/api/account/profile?${reqStr}&sign=${sign}`
        let body = ``
        let urlObject = populateUrlObject(url,this.auth,body)
        await httpRequest('get',urlObject,caller)
        let result = httpResult;
        if(!result) return
        //console.log(result)
        if(result.error_code == 0) {
            let data  = result.data
            this.energies = data.energies
            this.nickname = data.profile.nickname
            console.log(`账号[${this.index}] ${this.nickname} 能量：${this.energies}`)
        } else {
            console.log(`账号[${this.index}]查询信息失败: ${result.message}`)
        }
    }
    
    async checkSignStatus() {
        let caller = printCaller()
        let reqStr = `account_id=${this.uid}&gain_category=energy`
        let sign = EncryptSign(reqStr)
        let url = `https://step-money.quanxiangweilai.cn/api/get_can_sign_in?${reqStr}&sign=${sign}`
        let body = ``
        let urlObject = populateUrlObject(url,this.auth,body)
        await httpRequest('get',urlObject,caller)
        let result = httpResult;
        if(!result) return
        //console.log(result)
        if(result.error_code == 0) {
            this.signCd = result.data.seconds
            let signStr = (this.signCd) ? `已签到，冷却时间${this.signCd}秒` : '可签到'
            console.log(`账号[${this.index}]当前时段${signStr}`)
        } else {
            console.log(`账号[${this.index}]查询签到状态失败: ${result.message}`)
            this.valid = false
        }
    }
    
    async doSign() {
        let caller = printCaller()
        let url = `https://step-money.quanxiangweilai.cn/api/sign_in`
        let body = `account_id=${this.uid}&gain_category=energy`
        let sign = EncryptSign(body)
        body += `&sign=${sign}`
        let urlObject = populateUrlObject(url,this.auth,body)
        await httpRequest('post',urlObject,caller)
        let result = httpResult;
        if(!result) return
        //console.log(result)
        if(result.error_code == 0) {
            console.log(`账号[${this.index}]签到成功，获得${result.data.sign_bonus}能量，日期${result.data.date}`)
        } else {
            console.log(`账号[${this.index}]签到失败: ${result.message}`)
        }
    }
    
    async getBonus(type) {
        let caller = printCaller()
        let url = `https://step-money.quanxiangweilai.cn/api/gain_common_bonus`
        let body = `account_id=${this.uid}&bonus_type=&gain_category=energy&type=${type}`
        let sign = EncryptSign(body)
        body += `&sign=${sign}`
        let urlObject = populateUrlObject(url,this.auth,body)
        await httpRequest('post',urlObject,caller)
        let result = httpResult;
        if(!result) return
        //console.log(result)
        if(result.error_code == 0) {
            console.log(`账号[${this.index}]完成任务[${type}]获得${result.data.bonus}能量`)
        } else {
            console.log(`账号[${this.index}]完成任务[${type}]失败: ${result.message}`)
            this.taskFlag = false
        }
    }
    
    async doConvert() {
        for(let step of convertList) {
            if(this.energies >= step) {
                let num = Math.floor(this.energies/step)
                if(num == 0) continue;
                for(let i=0; i<num; i++) {
                    await this.energyConvert(step)
                    await $.wait(300)
                }
            }
        }
    }
    
    async energyConvert(energies) {
        let caller = printCaller()
        let url = `https://step-money.quanxiangweilai.cn/api/energy_convert`
        let body = `account_id=${this.uid}&energies=${energies}&gain_category=energy`
        let sign = EncryptSign(body)
        body += `&sign=${sign}`
        let urlObject = populateUrlObject(url,this.auth,body)
        await httpRequest('post',urlObject,caller)
        let result = httpResult;
        if(!result) return
        //console.log(result)
        if(result.error_code == 0) {
            this.energies -= result.data.energies
            console.log(`账号[${this.index}]成功转换${result.data.energies}能量到${result.data.money}元余额`)
        } else {
            console.log(`账号[${this.index}]转换能量失败: ${result.message}`)
        }
    }
    
    async getBalance() {
        let caller = printCaller()
        let reqStr = `account_id=${this.uid}&gain_category=energy&page_number=1&page_size=20`
        let sign = EncryptSign(reqStr)
        let url = `https://step-money.quanxiangweilai.cn/api/get_incomes?${reqStr}&sign=${sign}`
        let body = ``
        let urlObject = populateUrlObject(url,this.auth,body)
        await httpRequest('get',urlObject,caller)
        let result = httpResult;
        if(!result) return
        //console.log(result)
        if(result.error_code == 0) {
            this.balance = result.data.balance
            console.log(`账号[${this.index}]现金余额: ${this.balance}元`)
        } else {
            console.log(`账号[${this.index}]查询现金余额失败: ${result.message}`)
        }
    }
    
    async getWithdrawInfo() {
        let caller = printCaller()
        let url = `https://step-money.quanxiangweilai.cn/api/get_pay_type_status`
        let body = `account_id=${this.uid}&gain_category=energy&withdraw_type=1`
        let sign = EncryptSign(body)
        body += `&sign=${sign}`
        let urlObject = populateUrlObject(url,this.auth,body)
        await httpRequest('post',urlObject,caller)
        let result = httpResult;
        if(!result) return
        //console.log(result)
        if(result.error_code == 0) {
            this.withList = result.data.amount_list.sort(function(a,b) {return parseFloat(b.amount)-parseFloat(a.amount)})
        } else {
            console.log(`账号[${this.index}]查询提现列表失败: ${result.message}`)
        }
    }
    
    async withdraw(money) {
        let caller = printCaller()
        let url = 'https://step-money.quanxiangweilai.cn/api/withdraw_money'
        let body = `account_id=${this.uid}&gain_category=energy&money=${money}&pay_type=3&withdraw_type=1`
        let sign = EncryptSign(body)
        body += `&sign=${sign}`
        let urlObject = populateUrlObject(url,this.auth,body)
        await httpRequest('post',urlObject,caller)
        let result = httpResult;
        if(!result) return
        //console.log(result)
        if(result.error_code == 0) {
            console.log(`账号[${this.index}]成功提现${result.data.real_money}元`)
        } else {
            console.log(`账号[${this.index}]提现失败: ${result.message}`)
        }
    }
    
    async invite(code) {
        let caller = printCaller()
        let url = `https://step-money.quanxiangweilai.cn/api/use_invited_code`
        let body = `account_id=${this.uid}&gain_category=energy&invited_code=${code}`
        let sign = EncryptSign(body)
        body += `&sign=${sign}`
        let urlObject = populateUrlObject(url,this.auth,body)
        await httpRequest('post',urlObject,caller)
    }
    
    async bindAlipay(code) {
        let caller = printCaller()
        let url = `https://step-money.quanxiangweilai.cn/api/bind_alipay_user`
        let body = `account_id=${this.uid}&alipay_user_id=${code}&gain_category=energy`
        let sign = EncryptSign(body)
        body += `&sign=${sign}`
        let urlObject = populateUrlObject(url,this.auth,body)
        await httpRequest('post',urlObject,caller)
        let result = httpResult;
        if(!result) return
        //console.log(result)
        if(result.error_code == 0) {
            console.log(`账号[${this.index}]成功绑定支付宝`)
        } else {
            console.log(`账号[${this.index}]绑定支付宝失败: ${result.message}`)
        }
    }
    
    async getStepCount() {
        let caller = printCaller()
        let reqStr = `account_id=${this.uid}&gain_category=energy`
        let sign = EncryptSign(reqStr)
        let url = `https://step-money.quanxiangweilai.cn/api/account_detail?${reqStr}&sign=${sign}`
        let body = ``
        let urlObject = populateUrlObject(url,this.auth,body)
        await httpRequest('get',urlObject,caller)
        let result = httpResult;
        if(!result) return
        //console.log(result)
        if(result.error_code == 0) {
            this.stepCount = result.data.today_count
            console.log(`账号[${this.index}]今日步数: ${this.stepCount}`)
        } else {
            console.log(`账号[${this.index}]查询今日步数失败: ${result.message}`)
        }
    }
    
    async refreshStepCount() {
        let seed = currentTime - 6
        let lowerLimit = seed * 1500
        let range = seed * 200
        let step = Math.floor(Math.random()*range) + lowerLimit
        await $.wait(300)
        if(step > this.stepCount) {
            await this.syncStep(step)
        } else {
            step = this.stepCount + Math.floor(Math.random()*20)
            await this.syncStep(step)
        }
    }
    
    async syncStep(step) {
        let caller = printCaller()
        let url = `https://step-money.quanxiangweilai.cn/api/step_count/sync`
        let body = `account_id=${this.uid}&device_step_count=${step}&gain_category=energy`
        let sign = EncryptSign(body)
        body += `&sign=${sign}`
        let urlObject = populateUrlObject(url,this.auth,body)
        await httpRequest('post',urlObject,caller)
        let result = httpResult;
        if(!result) return
        //console.log(result)
        if(result.today_step_count) {
            console.log(`账号[${this.index}]今天步数刷新成功: ${result.today_step_count}`)
            this.stepReward.push(...result.today_received_record.one)
            this.stepReward.push(...result.today_received_record.two)
            this.stepReward.push(...result.today_received_record.three)
        } else {
            console.log(`账号[${this.index}]刷步数失败: ${result.message}`)
        }
    }
    
    async getStepReward() {
        for(let reward of this.stepReward.filter(x => x.data.status==3)) {
            await $.wait(300)
            await this.gainBonus(reward.data.min_step)
            break;
        }
    }
    
    async getTodayBonus(step) {
        let caller = printCaller()
        let url = `https://step-money.quanxiangweilai.cn/api/get_today_bonus`
        let body = `account_id=${this.uid}&bonus_type=bonus&gain_category=energy&step_level=${step}`
        let sign = EncryptSign(body)
        body += `&sign=${sign}`
        let urlObject = populateUrlObject(url,this.auth,body)
        await httpRequest('post',urlObject,caller)
        let result = httpResult;
        if(!result) return
        //console.log(result)
        if(result.error_code == 0) {
            console.log(`账号[${this.index}]可以领取${step}步奖励`)
            await $.wait(300)
            await this.gainBonus(step)
        } else {
            console.log(`账号[${this.index}]领取${step}步奖励失败: ${result.message}`)
        }
    }
    
    async gainBonus(step) {
        let caller = printCaller()
        let url = `https://step-money.quanxiangweilai.cn/api/gain_bonus`
        let body = `account_id=${this.uid}&bonus_type=bonus&gain_category=energy&step_level=${step}`
        let sign = EncryptSign(body)
        body += `&sign=${sign}`
        let urlObject = populateUrlObject(url,this.auth,body)
        await httpRequest('post',urlObject,caller)
        let result = httpResult;
        if(!result) return
        //console.log(result)
        if(result.error_code == 0) {
            console.log(`账号[${this.index}]领取${step}步奖励获得${result.data.bonus}能量`)
        } else {
            console.log(`账号[${this.index}]领取${step}步奖励失败: ${result.message}`)
        }
    }
    
    async joinGroup() {
        let caller = printCaller()
        let url = `https://step-money.quanxiangweilai.cn/api/join_group`
        let body = `account_id=${this.uid}&gain_category=energy&group_id=${taskCode['group'][taskCode['groupId']]}`
        let sign = EncryptSign(body)
        body += `&sign=${sign}`
        let urlObject = populateUrlObject(url,this.auth,body)
        await httpRequest('post',urlObject,caller)
    }
    
    async getCreatedGroups() {
        let caller = printCaller()
        let reqStr = `account_id=${this.uid}&gain_category=energy`
        let sign = EncryptSign(reqStr)
        let url = `https://step-money.quanxiangweilai.cn/api/get_created_groups?${reqStr}&sign=${sign}`
        let body = ``
        let urlObject = populateUrlObject(url,this.auth,body)
        await httpRequest('get',urlObject,caller)
        let result = httpResult;
        if(!result) return
        //console.log(result)
        if(result.error_code == 0) {
            for(let group of result.data) {
                console.log(`账号[${this.index}]的群组[${group.name}]，成员${group.member_count}人，今天总步数${group.total_steps}`)
                await $.wait(200)
                await this.checkGroupBonuses(group.id)
            }
        } else {
            console.log(`账号[${this.index}]查询群组奖励失败: ${result.message}`)
        }
    }
    
    async checkGroupBonuses(groupId) {
        let caller = printCaller()
        let reqStr = `account_id=${this.uid}&gain_category=energy&group_id=${groupId}&page_number=1&page_size=20`
        let sign = EncryptSign(reqStr)
        let url = `https://step-money.quanxiangweilai.cn/api/group_bonuses?${reqStr}&sign=${sign}`
        let body = ``
        let urlObject = populateUrlObject(url,this.auth,body)
        await httpRequest('get',urlObject,caller)
        let result = httpResult;
        if(!result) return
        //console.log(result)
        if(result.error_code == 0) {
            for(let group of result.data.group_bonus) {
                if(group.status == 1) {
                    await $.wait(200)
                    await this.gainGroupBonus(group)
                }
            }
        } else {
            console.log(`账号[${this.index}]查询群组奖励失败: ${result.message}`)
        }
    }
    
    async gainGroupBonus(group,groupId) {
        let caller = printCaller()
        let url = `https://step-money.quanxiangweilai.cn/api/gain_group_bonus`
        let body = `account_id=${this.uid}&date=${group.date}&gain_category=energy&group_id=${group.groupId}`
        let sign = EncryptSign(body)
        body += `&sign=${sign}`
        let urlObject = populateUrlObject(url,this.auth,body)
        await httpRequest('post',urlObject,caller)
        let result = httpResult;
        if(!result) return
        //console.log(result)
        if(result.error_code == 0) {
            console.log(`账号[${this.index}]领取群组奖励获得${result.data.money}能量`)
        } else {
            console.log(`账号[${this.index}]领取群组奖励失败: ${result.message}`)
        }
    }
    
    async refreshStepReward() {
        let caller = printCaller()
        let url = `https://step-money.quanxiangweilai.cn/api/statistic_ad_visit_log`
        let body = `account_id=${this.uid}&ad_unit_id=7030383717787008&ad_unit_name=home&event=load&gain_category=energy&platform=android`
        let sign = EncryptSign(body)
        body += `&sign=${sign}`
        let urlObject = populateUrlObject(url,this.auth,body)
        await httpRequest('post',urlObject,caller)
    }
}

!(async () => {
    if (typeof $request !== "undefined") {
        await GetRewrite()
    }else {
        if(!(await checkEnv())) return
        console.log('====================')
        
        console.log('\n=============== 签到状态 ===============')
        for(let user of userList) {
            await user.checkSignStatus(); 
            await $.wait(300);
        }
        
        let validUserList = userList.filter(x => x.valid)
        
        console.log('\n=============== 开始签到 ===============')
        for(let user of validUserList.filter(x => x.signCd==0)) {
            await user.doSign(); 
            await $.wait(300);
        }
        
        //加入群组
        /*for(let user of validUserList) {
            await user.joinGroup(); 
            await $.wait(300);
        }*/
        
        //邀请
        /*for(let user of validUserList) {
            await user.invite(taskCode['invite']); 
            await $.wait(300);
        }*/
        
        console.log('\n=============== 做任务 ===============')
        if(1) {
            for(let type of rewardList) {
                for(let user of validUserList) {
                    await user.getBonus(type); 
                    await $.wait(100);
                }
            }
        } else {
            for(let type=1; type<30; type++) {
                for(let user of validUserList) {
                    await user.getBonus(type); 
                    await $.wait(100);
                }
            }
        }
        
        console.log('\n=============== 查询步数 ===============')
        for(let user of validUserList) {
            await user.getStepCount(); 
            await $.wait(300);
        }
        
        console.log('\n=============== 刷新步数 ===============')
        for(let user of validUserList) {
            await user.refreshStepCount(); 
            await $.wait(300);
        }
        
        console.log('\n=============== 刷新步数奖励状态 ===============')
        for(let i=0; i<3; i++) {
            for(let user of validUserList) {
                await user.refreshStepReward(); 
                await $.wait(300);
            }
        }
        
        console.log('\n=============== 领取步数奖励 ===============')
        for(let user of validUserList) {
            await user.getStepReward(); 
            await $.wait(300);
        }
        
        /*console.log('\n=============== 领取群组奖励 ===============')
        for(let user of validUserList) {
            await user.getCreatedGroups(); 
            await $.wait(300);
        }*/
        
        console.log('\n=============== 查询账户信息 ===============')
        for(let user of validUserList) {
            await user.getProfile(); 
            await $.wait(300);
        }
        
        console.log('\n=============== 能量转换余额 ===============')
        for(let user of validUserList) {
            await user.doConvert(); 
            await $.wait(300);
        }
        
        console.log('\n=============== 查询账户余额 ===============')
        for(let user of validUserList) {
            await user.getBalance(); 
            await $.wait(300);
        }
        
        /*console.log('\n=============== 绑定支付宝 ===============')
        for(let user of validUserList) {
            await user.bindAlipay(''); 
            await $.wait(300);
        }*/
        
        if(withdrawTime == currentTime) {
            console.log('\n=============== 提现 ===============')
            for(let user of validUserList) {
                await user.getWithdrawInfo(); 
                await $.wait(300);
            }
            
            for(let user of validUserList) {
                for(let withItem of user.withList.filter(x => x.is_over_balance==true)) {
                    await user.withdraw(withItem.amount); 
                    await $.wait(300);
                }
            }
        } else {
            console.log(`\n现在设置的提现时间为每天${withdrawTime}点，如果需要更改，请将提现时间填到zcyWithdrawTime`)
        }
    }
})()
.catch((e) => $.logErr(e))
.finally(() => $.done())

///////////////////////////////////////////////////////////////////
async function checkEnv() {
    if(userCookie) {
        for(let userCookies of userCookie.split('@')) {
            if(userCookies) userList.push(new UserInfo(userCookies))
        }
        userCount = userList.length
    } else {
        console.log('未找到zcyCookie')
        return;
    }
    
    console.log(`共找到${userCount}个账号`)
    return true
}

//通知
async function showmsg() {
    if(!notifyStr) return
    notifyBody = jsname + "运行通知\n\n" + notifyStr
    if (notifyFlag == 1) {
        $.msg(notifyBody);
        if($.isNode()){await notify.sendNotify($.name, notifyBody );}
    } else {
        console.log(notifyBody);
    }
}

async function GetRewrite() {
    if($request.url.indexOf('account/profile') > -1) {
        let auth = $request.headers.Authorization.replace('Bearer','').replace(' ','')
        let uid = $request.url.match(/account_id=(\w+)/)[1]
        let ck = uid + '#' + auth
        
        if(userCookie) {
            if(userCookie.indexOf(uid) == -1) {
                userCookie = userCookie + '@' + ck
                $.setdata(userCookie, 'zcyCookie');
                ckList = userCookie.split('@')
                $.msg(jsname+` 获取第${ckList.length}个zcyCookie成功: ${ck}`)
            } else {
                console.log(jsname+` 找到重复的zcyCookie: ${ck}`)
            }
        } else {
            $.setdata(ck, 'zcyCookie');
            $.msg(jsname+` 获取第1个zcyCookie成功: ${ck}`)
        }
    }
}

function EncryptSign(reqStr) {
    //console.log(reqStr)
    let bodyArr = reqStr.split('&')
    let keyObj = {}
    for(let keyVal of bodyArr) {
        let keys = keyVal.split('=')
        keyObj[keys[0]] = keys[1]
    }
    let a = ''
    for(let keys of Object.keys(keyObj).sort()) {
        if(keys != 'sign') {
            if(a) a += '&'
            a += keys + '=' + keyObj[keys]
        }
    }
    a += md5Salt
    //console.log(a)
    return MD5Encrypt(a)
}
////////////////////////////////////////////////////////////////////
function populateUrlObject(url,auth,body=''){
    let urlObject = {
        url: url,
        headers: {
            'Host' : 'step-money.quanxiangweilai.cn',
            'Accept-Encoding' : 'gzip;q=1.0, compress;q=0.5',
            'Connection' : 'keep-alive',
            'Accept' : 'application/json',
            //'User-Agent' : 'step-money-iphone/2.0.1 (com.quanxiang.stepmoney; build:499; iOS 15.0.0) Alamofire/2.0.1',
            'User-Agent' : 'okhttp/4.3.1',
            'Authorization' : `Bearer ${auth}`,
            'Accept-Language' : 'zh-Hans-CN;q=1.0',
        },
    }
    if(body) urlObject.body = body
    return urlObject;
}

async function httpRequest(method,url,caller) {
    httpResult = null
    if(method == 'post') {
        url.headers['Content-Type'] =  'application/x-www-form-urlencoded; charset=utf-8'
        url.headers['Content-Length'] = url.body.length
    }
    return new Promise((resolve) => {
        $[method](url, async (err, resp, data) => {
            try {
                if (safeGet(data)) {
                    httpResult = JSON.parse(data);
                    if(logDebug) console.log(httpResult);
                }
            } catch (e) {
                $.logErr(e, resp);
            } finally {
                resolve();
            }
        });
    });
}

function safeGet(data,caller) {
    try {
        if (typeof JSON.parse(data) == "object") {
            return true;
        } else {
            console.log(`Function ${caller}: 未知错误`);
            console.log(data)
        }
    } catch (e) {
        console.log(e);
        console.log(`Function ${caller}: 服务器访问数据为空，请检查自身设备网络情况`);
        return false;
    }
}

function printCaller(){
    return (new Error()).stack.split("\n")[2].trim().split(" ")[1]
}


function getMin(a,b){
    return ((a<b) ? a : b)
}

function getMax(a,b){
    return ((a<b) ? b : a)
}

function padStr(num,length,padding='0') {
    let numStr = String(num)
    let numPad = (length>numStr.length) ? (length-numStr.length) : 0
    let retStr = ''
    for(let i=0; i<numPad; i++) {
        retStr += padding
    }
    retStr += numStr
    return retStr;
}

function randomString(len=16) {
    let chars = 'abcdef0123456789';
    let maxLen = chars.length;
    let str = '';
    for (i = 0; i < len; i++) {
        str += chars.charAt(Math.floor(Math.random()*maxLen));
    }
    return str;
}

function MD5Encrypt(a){function b(a,b){return a<<b|a>>>32-b}function c(a,b){var c,d,e,f,g;return e=2147483648&a,f=2147483648&b,c=1073741824&a,d=1073741824&b,g=(1073741823&a)+(1073741823&b),c&d?2147483648^g^e^f:c|d?1073741824&g?3221225472^g^e^f:1073741824^g^e^f:g^e^f}function d(a,b,c){return a&b|~a&c}function e(a,b,c){return a&c|b&~c}function f(a,b,c){return a^b^c}function g(a,b,c){return b^(a|~c)}function h(a,e,f,g,h,i,j){return a=c(a,c(c(d(e,f,g),h),j)),c(b(a,i),e)}function i(a,d,f,g,h,i,j){return a=c(a,c(c(e(d,f,g),h),j)),c(b(a,i),d)}function j(a,d,e,g,h,i,j){return a=c(a,c(c(f(d,e,g),h),j)),c(b(a,i),d)}function k(a,d,e,f,h,i,j){return a=c(a,c(c(g(d,e,f),h),j)),c(b(a,i),d)}function l(a){for(var b,c=a.length,d=c+8,e=(d-d%64)/64,f=16*(e+1),g=new Array(f-1),h=0,i=0;c>i;)b=(i-i%4)/4,h=i%4*8,g[b]=g[b]|a.charCodeAt(i)<<h,i++;return b=(i-i%4)/4,h=i%4*8,g[b]=g[b]|128<<h,g[f-2]=c<<3,g[f-1]=c>>>29,g}function m(a){var b,c,d="",e="";for(c=0;3>=c;c++)b=a>>>8*c&255,e="0"+b.toString(16),d+=e.substr(e.length-2,2);return d}function n(a){a=a.replace(/\r\n/g,"\n");for(var b="",c=0;c<a.length;c++){var d=a.charCodeAt(c);128>d?b+=String.fromCharCode(d):d>127&&2048>d?(b+=String.fromCharCode(d>>6|192),b+=String.fromCharCode(63&d|128)):(b+=String.fromCharCode(d>>12|224),b+=String.fromCharCode(d>>6&63|128),b+=String.fromCharCode(63&d|128))}return b}var o,p,q,r,s,t,u,v,w,x=[],y=7,z=12,A=17,B=22,C=5,D=9,E=14,F=20,G=4,H=11,I=16,J=23,K=6,L=10,M=15,N=21;for(a=n(a),x=l(a),t=1732584193,u=4023233417,v=2562383102,w=271733878,o=0;o<x.length;o+=16)p=t,q=u,r=v,s=w,t=h(t,u,v,w,x[o+0],y,3614090360),w=h(w,t,u,v,x[o+1],z,3905402710),v=h(v,w,t,u,x[o+2],A,606105819),u=h(u,v,w,t,x[o+3],B,3250441966),t=h(t,u,v,w,x[o+4],y,4118548399),w=h(w,t,u,v,x[o+5],z,1200080426),v=h(v,w,t,u,x[o+6],A,2821735955),u=h(u,v,w,t,x[o+7],B,4249261313),t=h(t,u,v,w,x[o+8],y,1770035416),w=h(w,t,u,v,x[o+9],z,2336552879),v=h(v,w,t,u,x[o+10],A,4294925233),u=h(u,v,w,t,x[o+11],B,2304563134),t=h(t,u,v,w,x[o+12],y,1804603682),w=h(w,t,u,v,x[o+13],z,4254626195),v=h(v,w,t,u,x[o+14],A,2792965006),u=h(u,v,w,t,x[o+15],B,1236535329),t=i(t,u,v,w,x[o+1],C,4129170786),w=i(w,t,u,v,x[o+6],D,3225465664),v=i(v,w,t,u,x[o+11],E,643717713),u=i(u,v,w,t,x[o+0],F,3921069994),t=i(t,u,v,w,x[o+5],C,3593408605),w=i(w,t,u,v,x[o+10],D,38016083),v=i(v,w,t,u,x[o+15],E,3634488961),u=i(u,v,w,t,x[o+4],F,3889429448),t=i(t,u,v,w,x[o+9],C,568446438),w=i(w,t,u,v,x[o+14],D,3275163606),v=i(v,w,t,u,x[o+3],E,4107603335),u=i(u,v,w,t,x[o+8],F,1163531501),t=i(t,u,v,w,x[o+13],C,2850285829),w=i(w,t,u,v,x[o+2],D,4243563512),v=i(v,w,t,u,x[o+7],E,1735328473),u=i(u,v,w,t,x[o+12],F,2368359562),t=j(t,u,v,w,x[o+5],G,4294588738),w=j(w,t,u,v,x[o+8],H,2272392833),v=j(v,w,t,u,x[o+11],I,1839030562),u=j(u,v,w,t,x[o+14],J,4259657740),t=j(t,u,v,w,x[o+1],G,2763975236),w=j(w,t,u,v,x[o+4],H,1272893353),v=j(v,w,t,u,x[o+7],I,4139469664),u=j(u,v,w,t,x[o+10],J,3200236656),t=j(t,u,v,w,x[o+13],G,681279174),w=j(w,t,u,v,x[o+0],H,3936430074),v=j(v,w,t,u,x[o+3],I,3572445317),u=j(u,v,w,t,x[o+6],J,76029189),t=j(t,u,v,w,x[o+9],G,3654602809),w=j(w,t,u,v,x[o+12],H,3873151461),v=j(v,w,t,u,x[o+15],I,530742520),u=j(u,v,w,t,x[o+2],J,3299628645),t=k(t,u,v,w,x[o+0],K,4096336452),w=k(w,t,u,v,x[o+7],L,1126891415),v=k(v,w,t,u,x[o+14],M,2878612391),u=k(u,v,w,t,x[o+5],N,4237533241),t=k(t,u,v,w,x[o+12],K,1700485571),w=k(w,t,u,v,x[o+3],L,2399980690),v=k(v,w,t,u,x[o+10],M,4293915773),u=k(u,v,w,t,x[o+1],N,2240044497),t=k(t,u,v,w,x[o+8],K,1873313359),w=k(w,t,u,v,x[o+15],L,4264355552),v=k(v,w,t,u,x[o+6],M,2734768916),u=k(u,v,w,t,x[o+13],N,1309151649),t=k(t,u,v,w,x[o+4],K,4149444226),w=k(w,t,u,v,x[o+11],L,3174756917),v=k(v,w,t,u,x[o+2],M,718787259),u=k(u,v,w,t,x[o+9],N,3951481745),t=c(t,p),u=c(u,q),v=c(v,r),w=c(w,s);var O=m(t)+m(u)+m(v)+m(w);return O.toLowerCase()}

function Env(t,e){"undefined"!=typeof process&&JSON.stringify(process.env).indexOf("GITHUB")>-1&&process.exit(0);class s{constructor(t){this.env=t}send(t,e="GET"){t="string"==typeof t?{url:t}:t;let s=this.get;return"POST"===e&&(s=this.post),"PUT"===e&&(s=this.put),new Promise((e,i)=>{s.call(this,t,(t,s,r)=>{t?i(t):e(s)})})}get(t){return this.send.call(this.env,t)}post(t){return this.send.call(this.env,t,"POST")}put(t){return this.send.call(this.env,t,"PUT")}}return new class{constructor(t,e){this.name=t,this.http=new s(this),this.data=null,this.dataFile="box.dat",this.logs=[],this.isMute=!1,this.isNeedRewrite=!1,this.logSeparator="\n",this.startTime=(new Date).getTime(),Object.assign(this,e),this.log("",`\ud83d\udd14${this.name}, \u5f00\u59cb!`)}isNode(){return"undefined"!=typeof module&&!!module.exports}isQuanX(){return"undefined"!=typeof $task}isSurge(){return"undefined"!=typeof $httpClient&&"undefined"==typeof $loon}isLoon(){return"undefined"!=typeof $loon}toObj(t,e=null){try{return JSON.parse(t)}catch{return e}}toStr(t,e=null){try{return JSON.stringify(t)}catch{return e}}getjson(t,e){let s=e;const i=this.getdata(t);if(i)try{s=JSON.parse(this.getdata(t))}catch{}return s}setjson(t,e){try{return this.setdata(JSON.stringify(t),e)}catch{return!1}}getScript(t){return new Promise(e=>{this.get({url:t},(t,s,i)=>e(i))})}runScript(t,e){return new Promise(s=>{let i=this.getdata("@chavy_boxjs_userCfgs.httpapi");i=i?i.replace(/\n/g,"").trim():i;let r=this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout");r=r?1*r:20,r=e&&e.timeout?e.timeout:r;const[o,h]=i.split("@"),a={url:`http://${h}/v1/scripting/evaluate`,body:{script_text:t,mock_type:"cron",timeout:r},headers:{"X-Key":o,Accept:"*/*"}};this.post(a,(t,e,i)=>s(i))}).catch(t=>this.logErr(t))}loaddata(){if(!this.isNode())return{};{this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e);if(!s&&!i)return{};{const i=s?t:e;try{return JSON.parse(this.fs.readFileSync(i))}catch(t){return{}}}}}writedata(){if(this.isNode()){this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e),r=JSON.stringify(this.data);s?this.fs.writeFileSync(t,r):i?this.fs.writeFileSync(e,r):this.fs.writeFileSync(t,r)}}lodash_get(t,e,s){const i=e.replace(/\[(\d+)\]/g,".$1").split(".");let r=t;for(const t of i)if(r=Object(r)[t],void 0===r)return s;return r}lodash_set(t,e,s){return Object(t)!==t?t:(Array.isArray(e)||(e=e.toString().match(/[^.[\]]+/g)||[]),e.slice(0,-1).reduce((t,s,i)=>Object(t[s])===t[s]?t[s]:t[s]=Math.abs(e[i+1])>>0==+e[i+1]?[]:{},t)[e[e.length-1]]=s,t)}getdata(t){let e=this.getval(t);if(/^@/.test(t)){const[,s,i]=/^@(.*?)\.(.*?)$/.exec(t),r=s?this.getval(s):"";if(r)try{const t=JSON.parse(r);e=t?this.lodash_get(t,i,""):e}catch(t){e=""}}return e}setdata(t,e){let s=!1;if(/^@/.test(e)){const[,i,r]=/^@(.*?)\.(.*?)$/.exec(e),o=this.getval(i),h=i?"null"===o?null:o||"{}":"{}";try{const e=JSON.parse(h);this.lodash_set(e,r,t),s=this.setval(JSON.stringify(e),i)}catch(e){const o={};this.lodash_set(o,r,t),s=this.setval(JSON.stringify(o),i)}}else s=this.setval(t,e);return s}getval(t){return this.isSurge()||this.isLoon()?$persistentStore.read(t):this.isQuanX()?$prefs.valueForKey(t):this.isNode()?(this.data=this.loaddata(),this.data[t]):this.data&&this.data[t]||null}setval(t,e){return this.isSurge()||this.isLoon()?$persistentStore.write(t,e):this.isQuanX()?$prefs.setValueForKey(t,e):this.isNode()?(this.data=this.loaddata(),this.data[e]=t,this.writedata(),!0):this.data&&this.data[e]||null}initGotEnv(t){this.got=this.got?this.got:require("got"),this.cktough=this.cktough?this.cktough:require("tough-cookie"),this.ckjar=this.ckjar?this.ckjar:new this.cktough.CookieJar,t&&(t.headers=t.headers?t.headers:{},void 0===t.headers.Cookie&&void 0===t.cookieJar&&(t.cookieJar=this.ckjar))}get(t,e=(()=>{})){t.headers&&(delete t.headers["Content-Type"],delete t.headers["Content-Length"]),this.isSurge()||this.isLoon()?(this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.get(t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status),e(t,s,i)})):this.isQuanX()?(this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t))):this.isNode()&&(this.initGotEnv(t),this.got(t).on("redirect",(t,e)=>{try{if(t.headers["set-cookie"]){const s=t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString();this.ckjar.setCookieSync(s,null),e.cookieJar=this.ckjar}}catch(t){this.logErr(t)}}).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>{const{message:s,response:i}=t;e(s,i,i&&i.body)}))}post(t,e=(()=>{})){if(t.body&&t.headers&&!t.headers["Content-Type"]&&(t.headers["Content-Type"]="application/x-www-form-urlencoded"),t.headers&&delete t.headers["Content-Length"],this.isSurge()||this.isLoon())this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.post(t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status),e(t,s,i)});else if(this.isQuanX())t.method="POST",this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t));else if(this.isNode()){this.initGotEnv(t);const{url:s,...i}=t;this.got.post(s,i).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>{const{message:s,response:i}=t;e(s,i,i&&i.body)})}}put(t,e=(()=>{})){if(t.body&&t.headers&&!t.headers["Content-Type"]&&(t.headers["Content-Type"]="application/x-www-form-urlencoded"),t.headers&&delete t.headers["Content-Length"],this.isSurge()||this.isLoon())this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.put(t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status),e(t,s,i)});else if(this.isQuanX())t.method="PUT",this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t));else if(this.isNode()){this.initGotEnv(t);const{url:s,...i}=t;this.got.put(s,i).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>{const{message:s,response:i}=t;e(s,i,i&&i.body)})}}time(t){let e={"M+":(new Date).getMonth()+1,"d+":(new Date).getDate(),"H+":(new Date).getHours(),"m+":(new Date).getMinutes(),"s+":(new Date).getSeconds(),"q+":Math.floor(((new Date).getMonth()+3)/3),S:(new Date).getMilliseconds()};/(y+)/.test(t)&&(t=t.replace(RegExp.$1,((new Date).getFullYear()+"").substr(4-RegExp.$1.length)));for(let s in e)new RegExp("("+s+")").test(t)&&(t=t.replace(RegExp.$1,1==RegExp.$1.length?e[s]:("00"+e[s]).substr((""+e[s]).length)));return t}msg(e=t,s="",i="",r){const o=t=>{if(!t)return t;if("string"==typeof t)return this.isLoon()?t:this.isQuanX()?{"open-url":t}:this.isSurge()?{url:t}:void 0;if("object"==typeof t){if(this.isLoon()){let e=t.openUrl||t.url||t["open-url"],s=t.mediaUrl||t["media-url"];return{openUrl:e,mediaUrl:s}}if(this.isQuanX()){let e=t["open-url"]||t.url||t.openUrl,s=t["media-url"]||t.mediaUrl;return{"open-url":e,"media-url":s}}if(this.isSurge()){let e=t.url||t.openUrl||t["open-url"];return{url:e}}}};this.isMute||(this.isSurge()||this.isLoon()?$notification.post(e,s,i,o(r)):this.isQuanX()&&$notify(e,s,i,o(r)));let h=["","==============\ud83d\udce3\u7cfb\u7edf\u901a\u77e5\ud83d\udce3=============="];h.push(e),s&&h.push(s),i&&h.push(i),console.log(h.join("\n")),this.logs=this.logs.concat(h)}log(...t){t.length>0&&(this.logs=[...this.logs,...t]),console.log(t.join(this.logSeparator))}logErr(t,e){const s=!this.isSurge()&&!this.isQuanX()&&!this.isLoon();s?this.log("",`\u2757\ufe0f${this.name}, \u9519\u8bef!`,t.stack):this.log("",`\u2757\ufe0f${this.name}, \u9519\u8bef!`,t)}wait(t){return new Promise(e=>setTimeout(e,t))}done(t={}){const e=(new Date).getTime(),s=(e-this.startTime)/1e3;this.log("",`\ud83d\udd14${this.name}, \u7ed3\u675f! \ud83d\udd5b ${s} \u79d2`),this.log(),(this.isSurge()||this.isQuanX()||this.isLoon())&&$done(t)}}(t,e)}
