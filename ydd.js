/*
IOS：阅多多/悦看点
理论上可以直接跑两个APP的账号
阅多多下载注册地址：https://yuekandian.yichengw.cn/download?app=3&referrer=729879

青龙：
捉取 https://yuekandian.yichengw.cn/api/v1/member/profile 的包里的Authorization，device和User-Agent，按顺序用#连起来写到yddCookie里，多账户用@隔开
export yddCookie='账号1的Authorization#device#UA@账号2的Authorization#device#UA'

V2P重写：打开APP即可获取CK，没有的话点一下我的页面或者赚钱页面
[task_local]
#阅多多
0-59/15 8-23 * * * https://raw.githubusercontent.com/leafxcy/JavaScript/main/ydd.js, tag=阅多多, enabled=true
[rewrite_local]
https://yuekandian.yichengw.cn/api/v1/member/profile url script-request-header https://raw.githubusercontent.com/leafxcy/JavaScript/main/ydd.js
[MITM]
hostname = yuekandian.yichengw.cn
*/

const jsname = '阅多多'
const $ = Env(jsname)
const notifyFlag = 1; //0为关闭通知，1为打开通知,默认为1
const logDebug = 0

//const notify = $.isNode() ? require('./sendNotify') : '';
let notifyStr = ''

let rndtime = "" //毫秒
let httpResult //global buffer

let host = 'yuekandian.yichengw.cn'
let hostname = 'https://' + host

let yddCookie = ($.isNode() ? process.env.yddCookie : $.getdata('yddCookie')) || '';
let yddCookieArr = []
let userToken = []
let userDevice = []
let userAgent = []
let userCookie = []

let userIdx = 0
let taskIdx = 0
let coinList = []
let signFlag = []
let contSignFlag = []
let lotteryTicket = []
let lotteryAdTicket = []
let helpTicket = []
let userTicket = []
let userWaitTime = []
let extraRewardFlag = []
let userInfo = []
let withdrawFlag = []
let adVideoFlag = []
let adVideoTicket = []
let doAliFlag = []
let barrierFlag = []
let doneTaskList = []
let doneTaskTicket = []

let NUM_PER_ROUND = 1

let LOTTERY_TYPE = 1
let AD_TICKET_TYPE = 5
let AD_VIDEO_TYPE = 10
let HELP_TYPE = 13
let COIN_TYPE = 14
        
///////////////////////////////////////////////////////////////////

!(async () => {

    if(typeof $request !== "undefined")
    {
        await GetRewrite()
    }
    else
    {
        if(!(await checkEnv())) {
            return
        }
        
        await initAccountInfo()
        await RunMultiUser()
    }
  

})()
.catch((e) => $.logErr(e))
.finally(() => $.done())

//通知
async function showmsg() {
    
    notifyBody = jsname + "运行通知\n\n" + notifyStr
    
    if (notifyFlag != 1) {
        console.log(notifyBody);
    }

    if (notifyFlag == 1) {
        $.msg(notifyBody);
        //if ($.isNode()){await notify.sendNotify($.name, notifyBody );}
    }
}

async function GetRewrite() {
    if($request.url.indexOf('/api/v1/member/profile') > -1) {
        let headers = $request.headers
        let auth = headers.Authorization
        if(!auth) return
        auth = auth.replace(/Bearer /g,'')
        let device = headers['device']
        if(!device) return
        let ua = headers['User-Agent']
        if(!ua) return
        let ck = auth + '#' + device + '#' + ua
        
        if(yddCookie) {
            if(yddCookie.indexOf(ck) == -1) {
                yddCookie = yddCookie + '@' + ck
                $.setdata(yddCookie, 'yddCookie');
                ckList = yddCookie.split('@')
                $.msg(jsname+` 获取第${ckList.length}个yddCookie成功`)
            }
        } else {
            $.setdata(ck, 'yddCookie');
            $.msg(jsname+` 获取第1个yddCookie成功`)
        }
    }
}

async function checkEnv() {
    if(yddCookie) {
        if(yddCookie.indexOf('@') > -1) {
            let yddCookies = yddCookie.split('@')
            for(let i=0; i<yddCookies.length; i++) {
                yddCookieArr.push(yddCookies[i].replace(/Bearer /g,''))
            }
        } else {
            yddCookieArr.push(yddCookie)
        }
    } else {
        console.log('未找到yddCookie')
        return false
    }
    if(yddCookieArr.length == 0) {
        console.log('未找到有效的yddCookie')
        return false
    }
    
    for(let items of yddCookieArr) {
        let userItem = items.split('#')
        userToken.push(userItem[0])
        userDevice.push(userItem[1])
        userAgent.push(userItem[2])
    }
    
    console.log(`共找到${yddCookieArr.length}个用户`)
    return true
}

async function initAccountInfo() {
    for(userIdx=0; userIdx<yddCookieArr.length; userIdx++) {
        coinList.push([])
        signFlag.push(0)
        contSignFlag.push(0)
        lotteryTicket.push('')
        lotteryAdTicket.push('')
        helpTicket.push('')
        userTicket.push('')
        userWaitTime.push(0)
        extraRewardFlag.push(0)
        userInfo.push({})
        withdrawFlag.push(0)
        adVideoFlag.push(0)
        adVideoTicket.push('')
        doAliFlag.push(0)
        barrierFlag.push(0)
        doneTaskList.push([])
        doneTaskTicket.push([])
    }
}

async function RunMultiUser() {
    let maxCoinNum = 0
    let needSign = 0
    let needContSign  = 0
    let needLottery = 0
    let needHelpVideo = 0
    let haveTicket = 0
    let needAdVideo = 0
    let needAliFlag = 0
    let needBarrier = 0
    let maxDoneTask = 0
    
    //============= 首页气泡红包 =============
    console.log('\n查询首页气泡红包...')
    for(userIdx=0; userIdx<yddCookieArr.length; userIdx++) {
        await QueryCoinInfo()
        maxCoinNum = getMax(maxCoinNum,coinList[userIdx].length)
    }
    await $.wait(100)
    
    if(maxCoinNum > 0) {
        console.log('\n开始领取首页气泡红包...')
        for(let i=0; i<maxCoinNum; i++) {
            for(userIdx=0; userIdx<yddCookieArr.length; userIdx++) {
                if(i < coinList[userIdx].length) await GetCoin(coinList[userIdx][i].id)
            }
            await $.wait(100)
            for(userIdx=0; userIdx<yddCookieArr.length; userIdx++) {
                if(i < coinList[userIdx].length && coinList[userIdx][i].ad == 1) await WatchAd(COIN_TYPE)
            }
            await $.wait(100)
            for(userIdx=0; userIdx<yddCookieArr.length; userIdx++) {
                if(i < coinList[userIdx].length && coinList[userIdx][i].ad == 1) await LogAd(COIN_TYPE)
            }
            await $.wait(100)
        }
    }
    
    //============= 签到 =============
    console.log('\n查询签到状态...')
    for(userIdx=0; userIdx<yddCookieArr.length; userIdx++) {
        await QuerySignInfo()
        if(signFlag[userIdx]==1) needSign=1
        if(contSignFlag[userIdx]==1) needContSign=1
    }
    await $.wait(100)
    
    if(needSign > 0) {
        console.log('\n开始签到...')
        for(userIdx=0; userIdx<yddCookieArr.length; userIdx++) {
            if(signFlag[userIdx]==1) await DoSign()
        }
        await $.wait(100)
    }
    
    if(needContSign > 0) {
        console.log('\n开始领取连续签到奖励...')
        for(userIdx=0; userIdx<yddCookieArr.length; userIdx++) {
            if(needContSign[userIdx]==1) await RewardContinuesSign()
        }
        await $.wait(100)
    }
    
    //============= 抽奖 =============
    console.log('\n查询抽奖状态...')
    for(userIdx=0; userIdx<yddCookieArr.length; userIdx++) {
        await QueryLotteryInfo()
        if(lotteryTicket[userIdx]) needLottery=1
    }
    await $.wait(100)
    
    if(needLottery > 0) {
        console.log('\n开始抽奖...')
        for(userIdx=0; userIdx<yddCookieArr.length; userIdx++) {
            if(lotteryTicket[userIdx]) await DoLottery(lotteryTicket[userIdx])
        }
        await $.wait(100)
        for(userIdx=0; userIdx<yddCookieArr.length; userIdx++) {
            if(lotteryAdTicket[userIdx]) await WatchAd(LOTTERY_TYPE)
        }
        await $.wait(100)
        for(userIdx=0; userIdx<yddCookieArr.length; userIdx++) {
            if(lotteryAdTicket[userIdx]) await LogAd(AD_TICKET_TYPE,lotteryTicket[userIdx])
        }
        await $.wait(100)
    }
    
    //============= 助力领现金 =============
    console.log('\n准备看助力领现金视频...')
    for(userIdx=0; userIdx<yddCookieArr.length; userIdx++) {
        await HelpClick()
        if(helpTicket[userIdx]) needHelpVideo=1
    }
    await $.wait(100)
    
    if(needHelpVideo > 0) {
        for(userIdx=0; userIdx<yddCookieArr.length; userIdx++) {
            if(helpTicket[userIdx]) await WatchAd(HELP_TYPE)
        }
        await $.wait(100)
        for(userIdx=0; userIdx<yddCookieArr.length; userIdx++) {
            if(helpTicket[userIdx]) await LogAd(AD_TICKET_TYPE,helpTicket[userIdx])
        }
        await $.wait(100)
    }
    
    console.log('\n查询助力领现金状态...')
    for(userIdx=0; userIdx<yddCookieArr.length; userIdx++) {
        await HelpInfo()
    }
    await $.wait(100)
    
    //============= 闯关换手机 =============
    console.log('\n查询闯关状态...')
    for(userIdx=0; userIdx<yddCookieArr.length; userIdx++) {
        await QueryBarrierInfo()
        if(barrierFlag[userIdx]>0) needBarrier=1
    }
    await $.wait(100)
    
    if(needBarrier > 0) {
        for(userIdx=0; userIdx<yddCookieArr.length; userIdx++) {
            if(barrierFlag[userIdx]) await DoBarrier(barrierFlag[userIdx])
        }
        await $.wait(100)
    }
    
    //============= 任务状态 =============
    console.log('\n查询任务状态...')
    for(userIdx=0; userIdx<yddCookieArr.length; userIdx++) {
        await QueryTaskList()
        if(adVideoFlag[userIdx]) needAdVideo=1
        if(doAliFlag[userIdx]) needAliFlag=1
        maxDoneTask = getMax(maxDoneTask,doneTaskList[userIdx].length)
    }
    await $.wait(100)
    
    //============= 领取任务奖励 =============
    if(maxDoneTask > 0) {
        console.log('\n开始领取任务奖励...')
        for(taskIdx=0; taskIdx<maxDoneTask; taskIdx++) {
            for(userIdx=0; userIdx<yddCookieArr.length; userIdx++) {
                if(taskIdx<doneTaskList[userIdx].length) await doneTaskReward(doneTaskList[userIdx][taskIdx])
            }
            await $.wait(100)
        }
        for(taskIdx=0; taskIdx<maxDoneTask; taskIdx++) {
            for(userIdx=0; userIdx<yddCookieArr.length; userIdx++) {
                if(doneTaskTicket[userIdx][taskIdx]) await WatchAd(LOTTERY_TYPE)
            }
            await $.wait(100)
        }
        for(taskIdx=0; taskIdx<maxDoneTask; taskIdx++) {
            for(userIdx=0; userIdx<yddCookieArr.length; userIdx++) {
                if(doneTaskTicket[userIdx][taskIdx]) await LogAd(AD_TICKET_TYPE,doneTaskTicket[userIdx][taskIdx])
            }
            await $.wait(100)
        }
    }
    
    //============= 跳转支付宝任务 =============
    if(needAliFlag > 0) {
        console.log('\n开始做跳转支付宝任务...')
        for(userIdx=0; userIdx<yddCookieArr.length; userIdx++) {
            if(doAliFlag[userIdx]==1) await DoAliTask()
        }
        await $.wait(100)
    }
    
    //============= 看广告任务 =============
    if(needAdVideo > 0) {
        console.log('\n开始看广告...')
        for(userIdx=0; userIdx<yddCookieArr.length; userIdx++) {
            if(adVideoFlag[userIdx]==1) await DoAdVideo()
        }
        await $.wait(100)
        for(userIdx=0; userIdx<yddCookieArr.length; userIdx++) {
            if(adVideoTicket[userIdx]) await WatchAd(AD_VIDEO_TYPE)
        }
        await $.wait(100)
        for(userIdx=0; userIdx<yddCookieArr.length; userIdx++) {
            if(adVideoTicket[userIdx]) await LogAd(AD_VIDEO_TYPE)
        }
        await $.wait(100)
        for(userIdx=0; userIdx<yddCookieArr.length; userIdx++) {
            if(adVideoTicket[userIdx]) await LogAd(AD_TICKET_TYPE,adVideoTicket[userIdx])
        }
        await $.wait(100)
    }
    
    //============= 看小视频 =============
    console.log(`\n准备刷小视频${NUM_PER_ROUND}次...`)
    haveTicket = 0
    for(userIdx=0; userIdx<yddCookieArr.length; userIdx++) {
        await GetTicket('video?short=1&')
        if(userTicket[userIdx]) haveTicket=1
    }
    if(haveTicket > 0) {
        for(userIdx=0; userIdx<yddCookieArr.length; userIdx++) {
            await TimeRecord('short/video',false)
        }
        await $.wait(100)
        for(let i=0; i<NUM_PER_ROUND && haveTicket > 0; i++) {
            haveTicket = 0
            console.log(`--- 开始刷第${i+1}轮 ---`)
            
            let waitTime = Math.floor(Math.random()*1000) + userWaitTime*1000
            console.log(`随机等待${waitTime/1000}秒...`)
            await $.wait(waitTime)
            for(userIdx=0; userIdx<yddCookieArr.length; userIdx++) {
                if(userTicket[userIdx]) await Reward('video?',userTicket[userIdx],'short=1&')
                if(userTicket[userIdx]) haveTicket=1
            }
            await $.wait(100)
            for(userIdx=0; userIdx<yddCookieArr.length; userIdx++) {
                if(extraRewardFlag[userIdx]) await RewardOpen('video','short=1&')
            }
            await $.wait(100)
        }
        for(userIdx=0; userIdx<yddCookieArr.length; userIdx++) {
            await TimeRecord('short/video',true)
        }
        await $.wait(100)
    }
    
    //============= 看资讯 =============
    console.log(`\n准备刷资讯${NUM_PER_ROUND}次...`)
    haveTicket = 0
    for(userIdx=0; userIdx<yddCookieArr.length; userIdx++) {
        await GetTicket('news/detail?')
        if(userTicket[userIdx]) haveTicket=1
    }
    if(haveTicket > 0) {
        for(userIdx=0; userIdx<yddCookieArr.length; userIdx++) {
            await TimeRecord('news',false)
        }
        await $.wait(100)
        for(let i=0; i<NUM_PER_ROUND && haveTicket > 0; i++) {
            haveTicket = 0
            console.log(`--- 开始刷第${i+1}轮 ---`)
            
            let waitTime = Math.floor(Math.random()*1000) + userWaitTime*1000
            console.log(`随机等待${waitTime/1000}秒...`)
            await $.wait(waitTime)
            for(userIdx=0; userIdx<yddCookieArr.length; userIdx++) {
                if(userTicket[userIdx]) await Reward('news?',userTicket[userIdx])
                if(userTicket[userIdx]) haveTicket=1
            }
            await $.wait(100)
            for(userIdx=0; userIdx<yddCookieArr.length; userIdx++) {
                if(extraRewardFlag[userIdx]) await RewardOpen('news')
            }
            await $.wait(100)
        }
        for(userIdx=0; userIdx<yddCookieArr.length; userIdx++) {
            await TimeRecord('news',true)
        }
        await $.wait(100)
    }
    
    //============= 账户信息 =============
    console.log('\n查询账户信息...')
    for(userIdx=0; userIdx<yddCookieArr.length; userIdx++) {
        await QueryUserInfo()
    }
    
    //============= 提现 =============
    console.log('\n查询提现信息...')
    for(userIdx=0; userIdx<yddCookieArr.length; userIdx++) {
        await QueryWithdrawList()
    }
}

//查询签到状态
async function QuerySignInfo() {
    let caller = printCaller()
    let url = `${hostname}/api/v1/reward/sign?`
    let urlObject = populateGetUrl(url)
    await httpGet(urlObject,caller)
    let result = httpResult;
    if(!result) return
    
    if(result.code == 0) {
        for(let items of result.result.items) {
            if(items.days=='今天') {
                if(items.status==false) {
                    signFlag[userIdx] = 1
                    console.log(`用户${userIdx+1}今天未完成签到`)
                } else {
                    console.log(`用户${userIdx+1}今天已签到`)
                }
            }
        }
        for(let items of result.result.ext_items) {
            if(result.result.days >= items.days) {
                console.log(`用户${userIdx+1}可领取${items.desc}奖励`)
                contSignFlag[userIdx] = 1
            }
        }
    } else {
        console.log(`用户${userIdx+1}查询签到状态失败：${result.message}`)
    }
}

//签到
async function DoSign() {
    let caller = printCaller()
    let url = `${hostname}/api/v1/reward/sign?`
    let urlObject = populatePostUrl(url)
    await httpPost(urlObject,caller)
    let result = httpResult;
    if(!result) return
    
    if(result.code == 0) {
        console.log(`用户${userIdx+1}签到获得：${result.result.coin}金币`)
    } else {
        console.log(`用户${userIdx+1}签到失败：${result.message}`)
    }
}

//连续签到奖励
async function RewardContinuesSign() {
    let caller = printCaller()
    let url = `${hostname}/api/v1/reward/sign/red_envelope?`
    let urlObject = populatePostUrl(url)
    await httpPost(urlObject,caller)
    let result = httpResult;
    if(!result) return
    
    if(result.code == 0) {
        console.log(`用户${userIdx+1}获得连续签到奖励：${result.result.amount}元`)
    } else {
        console.log(`用户${userIdx+1}获得连续签到奖励失败：${result.message}`)
    }
}

//查询首页金币气泡
async function QueryCoinInfo() {
    let caller = printCaller()
    let url = `${hostname}/api/v1/reward/coin?`
    let urlObject = populateGetUrl(url)
    await httpGet(urlObject,caller)
    let result = httpResult;
    if(!result) return
    
    if(result.code == 0) {
        for(let items of result.result.coins) {
            if(items.num > 0) {
                coinList[userIdx].push(items)
            }
        }
        console.log(`用户${userIdx+1}有${coinList[userIdx].length}个可以领取的首页气泡`)
    } else {
        console.log(`用户${userIdx+1}查询首页气泡信息失败：${result.message}`)
    }
}

//领取首页气泡
async function GetCoin(id) {
    let caller = printCaller()
    let url = `${hostname}/api/v1/reward/coin?`
    let body = `id=${id}&`
    let urlObject = populatePostUrl(url,body)
    await httpPost(urlObject,caller)
    let result = httpResult;
    if(!result) return
    
    if(result.code == 0) {
        console.log(`用户${userIdx+1}领取首页气泡获得：${result.result.coin}金币`)
    } else {
        console.log(`用户${userIdx+1}领取首页气泡失败：${result.message}`)
    }
}

//查询抽奖状态
async function QueryLotteryInfo() {
    let caller = printCaller()
    let url = `${hostname}/api/v1/reward/lottery/index?`
    let urlObject = populateGetUrl(url)
    await httpGet(urlObject,caller)
    let result = httpResult;
    if(!result) return
    
    if(result.code == 0) {
        console.log(`用户${userIdx+1}今天剩余抽奖次数：${result.result.lottery_count}`)
        if(result.result.lottery_count>0) {
            lotteryTicket[userIdx] = result.result.ticket
        }
    } else {
        console.log(`用户${userIdx+1}查询抽奖状态失败：${result.message}`)
    }
}

//抽奖
async function DoLottery(ticket) {
    let caller = printCaller()
    let url = `${hostname}/api/v1/reward/lottery/index?`
    let body = `ticket=${ticket}&`
    let urlObject = populatePostUrl(url,body)
    await httpPost(urlObject,caller)
    let result = httpResult;
    if(!result) return
    
    if(result.code == 0) {
        if(result.result.type==2) {
            lotteryAdTicket[userIdx] = result.result.ticket
            console.log(`用户${userIdx+1}抽奖获得：${result.result.num}金币`)
        } else if (result.result.type==1) {
            console.log(`用户${userIdx+1}抽奖获得：${result.result.num}手机碎片`)
        } else {
            console.log(result)
        }
    } else {
        console.log(`用户${userIdx+1}抽奖失败：${result.message}`)
    }
}

//助力领现金-看视频
async function HelpClick() {
    let caller = printCaller()
    let url = `${hostname}/api/v1/reward/help/click?`
    let urlObject = populateGetUrl(url)
    await httpGet(urlObject,caller)
    let result = httpResult;
    if(!result) return
    
    if(result.code == 0) {
        if(result.result && result.result.ticket) {
            helpTicket[userIdx] = result.result.ticket
            console.log(`用户${userIdx+1}看助力领现金视频将获得${result.result.coin/10000}元余额`)
        } else {
            console.log(`用户${userIdx+1}看助力领现金视频失败：${result.message}`)
        }
    } else {
        console.log(`用户${userIdx+1}看助力领现金视频失败：${result.message}`)
    }
}

//助力领现金信息
async function HelpInfo() {
    let caller = printCaller()
    let url = `${hostname}/api/v1/reward/help/index?`
    let urlObject = populateGetUrl(url)
    await httpGet(urlObject,caller)
    let result = httpResult;
    if(!result) return
    
    if(result.code == 0) {
        console.log(`用户${userIdx+1}助力领现金金额：${result.result.jinbi}元，还差${result.result.diff_jinbi}元可以提现`)
    } else {
        console.log(`用户${userIdx+1}看助力领现金视频失败：${result.message}`)
    }
}

//开始广告
async function WatchAd(type) {
    let caller = printCaller()
    let url = `${hostname}/api/v1/ad/topon/placement/id?type=${type}&`
    let urlObject = populateGetUrl(url)
    await httpGet(urlObject,caller)
    let result = httpResult;
    if(!result) return
    
    if(result.code == 0) {
        console.log(`用户${userIdx+1}开始看广告`)
    } else {
        console.log(`用户${userIdx+1}看广告失败：${result.message}`)
    }
}

//完成广告
async function LogAd(type,ticket='') {
    let caller = printCaller()
    let ticketStr = ''
    if(ticket) ticketStr = `ticket=${ticket}&`
    let url = `${hostname}/api/v1/ad/log?${ticketStr}type=${type}&`
    let urlObject = populateGetUrl(url)
    await httpGet(urlObject,caller)
    let result = httpResult;
    if(!result) return
    
    if(result.code == 0) {
        console.log(`用户${userIdx+1}完成看广告`)
    } else {
        console.log(`用户${userIdx+1}完成看广告失败：${result.message}`)
    }
}

//获取ticket
async function GetTicket(suburl) {
    userTicket[userIdx] = ''
    userWaitTime[userIdx] = 0
    let caller = printCaller()
    let url = `${hostname}/api/v1/reward/${suburl}`
    let urlObject = populateGetUrl(url)
    await httpGet(urlObject,caller)
    let result = httpResult;
    if(!result) return
    
    if(result.code == 0) {
        if(result.result.coin_status==1) {
            if(result.result.ticket) {
                userTicket[userIdx] = result.result.ticket
                userWaitTime[userIdx] = result.result.time
                console.log(`用户${userIdx+1}获取到ticket`)
            } else {
                console.log(`用户${userIdx+1}获取ticket失败：${result.message}`)
            }
        } else {
            console.log(`用户${userIdx+1}已无法获得更多金币`)
        }
    } else {
        console.log(`用户${userIdx+1}获取ticket失败：${result.message}`)
    }
}

//记录时间
async function TimeRecord(suburl,isEnd=false) {
    let caller = printCaller()
    let endStr = ''
    let desc = '开始'
    if(isEnd) {
        endStr = 'end=1&'
        desc = '结束'
    }
    let url = `${hostname}/api/v1/reward/${suburl}/interval?${endStr}`
    let urlObject = populateGetUrl(url)
    await httpGet(urlObject,caller)
    let result = httpResult;
    if(!result) return
    
    if(result.code == 0) {
        console.log(`用户${userIdx+1}${desc}记录时长`)
    } else {
        console.log(`用户${userIdx+1}${desc}记录时长失败：${result.message}`)
    }
}

//获得奖励
async function Reward(suburl,ticket,subbody='') {
    extraRewardFlag[userIdx] = 0
    userTicket[userIdx] = ''
    userWaitTime[userIdx] = 0
    let caller = printCaller()
    let url = `${hostname}/api/v1/reward/${suburl}`
    let body = `ticket=${ticket}&${subbody}`
    let urlObject = populatePostUrl(url,body)
    await httpPost(urlObject,caller)
    let result = httpResult;
    if(!result) return
    
    if(result.code == 0) {
        if(result.result.count >= result.result.target && result.result.ren_status == 1) extraRewardFlag[userIdx]=1
        if(result.result.ticket) {
            userTicket[userIdx] = result.result.ticket
            userWaitTime[userIdx] = result.result.time
            console.log(`用户${userIdx+1}获取到下一个ticket`)
        } else {
            console.log(`用户${userIdx+1}获取下一个ticket失败：${result.message}`)
        }
        console.log(`用户${userIdx+1}获得：${result.result.reward}金币，额外奖励次数${result.result.target}，目前已刷${result.result.count}次`)
    } else {
        console.log(`用户${userIdx+1}获得奖励失败：${result.message}`)
    }
}

//额外次数奖励
async function RewardOpen(suburl,body='') {
    let caller = printCaller()
    let url = `${hostname}/api/v1/reward/${suburl}/open?`
    let urlObject = populatePostUrl(url,body)
    await httpPost(urlObject,caller)
    let result = httpResult;
    if(!result) return
    
    if(result.code == 0) {
        console.log(`用户${userIdx+1}获得额外奖励：${result.result.reward}金币`)
    } else {
        console.log(`用户${userIdx+1}获得额外奖励失败：${result.message}`)
    }
}

//账号信息
async function QueryUserInfo() {
    let caller = printCaller()
    let url = `${hostname}/api/v1/member/profile?debug=0&`
    let urlObject = populateGetUrl(url)
    await httpGet(urlObject,caller)
    let result = httpResult;
    if(!result) return
    
    if(result.code == 0) {
        console.log(`\n==== 用户${userIdx+1}: ${result.result.nickname} ====`)
        console.log(`今日收益: ${result.result.today_point}`)
        console.log(`提现券  : ${result.result.ticket}`)
        console.log(`手机碎片: ${result.result.fragment}`)
        console.log(`金币余额: ${result.result.point}`)
        console.log(`历史收益: ${result.result.total_point}`)
        userInfo[userIdx] = result.result
    } else {
        console.log(`用户${userIdx+1}查询账号信息失败：${result.message}`)
    }
}

//提现列表
async function QueryWithdrawList() {
    let caller = printCaller()
    let url = `${hostname}/api/v1/cash/exchange?`
    let urlObject = populateGetUrl(url)
    await httpGet(urlObject,caller)
    let result = httpResult;
    if(!result) return
    
    if(result.code == 0) {
        let sortList = result.result.items.sort(function(a,b){return b["jine"]-a["jine"]});
        for(let item of sortList) {
            if(userInfo[userIdx].point>item.jinbi && userInfo[userIdx].ticket>item.cond && item.is_ok==1) {
                await Withdraw(item.jine)
                if(withdrawFlag[userIdx]==1) break;
            }
        }
    } else {
        console.log(`用户${userIdx+1}查询提现列表失败：${result.message}`)
    }
}

//提现
async function Withdraw(amount) {
    let caller = printCaller()
    let url = `${hostname}/api/v1/cash/exchange?`
    let body = `amount=${amount}&gate=wechat&`
    let urlObject = populatePostUrl(url,body)
    await httpPost(urlObject,caller)
    let result = httpResult;
    if(!result) return false
    
    if(result.code == 0) {
        withdrawFlag[userIdx] = 1
        console.log(`用户${userIdx+1}提现${amount}：${result.result.title}, ${result.result.message}`)
    } else {
        console.log(`用户${userIdx+1}提现${amount}失败：${result.message}`)
    }
    return false
}

//获取任务列表状态
async function QueryTaskList() {
    let caller = printCaller()
    let url = `${hostname}/api/v1/zhuan/index?`
    let urlObject = populatePostUrl(url)
    await httpPost(urlObject,caller)
    let result = httpResult;
    if(!result) return
    
    if(result.code == 0) {
        for(let item of result.result.items) {
            let str = (item.st==0) ? '未完成' : '已完成'
            if(item.title.indexOf('观看广告视频') > -1) {
                let matchItem = item.title.match(/"red">(\w+)<\/font>\/(\w+)/)
                str = (parseInt(matchItem[2]) > parseInt(matchItem[1])) ? '未完成' : '已完成'
                if(item.st==0) adVideoFlag[userIdx] = 1
                console.log(`用户${userIdx+1}${str}看广告任务，总次数${matchItem[2]}次，已完成${matchItem[1]}次`)
            } else if(item.title.indexOf('支付宝红包') > -1) {
                if(item.st==0) doAliFlag[userIdx] = 1
                console.log(`用户${userIdx+1}${str}跳转支付宝任务`)
            } else if(item.title.indexOf('看资讯') > -1) {
                let matchItem = item.rate.split('$')
                console.log(`用户${userIdx+1}${str}看资讯任务，总次数${matchItem[1]}次，已完成${matchItem[0]}次`)
            } else if(item.title.indexOf('刷视频') > -1) {
                let matchItem = item.rate.split('$')
                console.log(`用户${userIdx+1}${str}刷视频任务，总次数${matchItem[1]}次，已完成${matchItem[0]}次`)
            }
            if(item.st==1) {
                if(item.id != 10 && item.time <= 0) {
                    doneTaskList[userIdx].push(item.id)
                    doneTaskTicket[userIdx].push('')
                }
            }
        }
    } else {
        console.log(`用户${userIdx+1}获取任务列表状态失败：${result.message}`)
    }
}

//获取看广告视频任务ticket
async function DoAdVideo() {
    let caller = printCaller()
    let url = `${hostname}/api/v1/zhuan/video?`
    let urlObject = populatePostUrl(url)
    await httpPost(urlObject,caller)
    let result = httpResult;
    if(!result) return
    
    if(result.code == 0) {
        if(result.result.ticket) {
            adVideoTicket[userIdx] = result.result.ticket
            console.log(`用户${userIdx+1}获取看广告视频ticket成功，将获得：${result.result.coin}金币，${result.result.coupon}提现券`)
        } else {
            console.log(`用户${userIdx+1}获取看广告视频ticket失败`)
        }
    } else {
        console.log(`用户${userIdx+1}获取看广告视频ticket失败：${result.message}`)
    }
}

//跳转支付宝
async function DoAliTask() {
    let caller = printCaller()
    let url = `${hostname}/api/v1/zhuan/aliaaa?`
    let urlObject = populateGetUrl(url)
    await httpGet(urlObject,caller)
    let result = httpResult;
    if(!result) return
    
    if(result.code == 0) {
        console.log(`用户${userIdx+1}完成跳转支付宝任务`)
    } else {
        console.log(`用户${userIdx+1}完成跳转支付宝任务失败：${result.message}`)
    }
}

//闯关换手机状态
async function QueryBarrierInfo() {
    let caller = printCaller()
    let url = `${hostname}/api/v1/reward/barrier/index?`
    let urlObject = populateGetUrl(url)
    await httpGet(urlObject,caller)
    let result = httpResult;
    if(!result) return
    
    if(result.code == 0) {
        console.log(`用户${userIdx+1}今天已闯关${result.result.current_barrier}次`)
        if(result.result.current_barrier<7) {
            barrierFlag[userIdx] = parseInt(result.result.current_barrier) + 1
        }
    } else {
        console.log(`用户${userIdx+1}获取看广告视频ticket失败：${result.message}`)
    }
}

//闯关
async function DoBarrier(num) {
    let caller = printCaller()
    let url = `${hostname}/api/v1/reward/barrier/index?`
    let body = `no=${num}&`
    let urlObject = populatePostUrl(url,body)
    await httpPost(urlObject,caller)
    let result = httpResult;
    if(!result) return
    
    if(result.code == 0) {
        console.log(`用户${userIdx+1}闯关获得：${result.result.coin}金币，${result.result.fragment}手机碎片`)
    } else {
        console.log(`用户${userIdx+1}闯关失败：${result.message}`)
    }
}

//领任务奖励
async function doneTaskReward(id) {
    let caller = printCaller()
    let url = `${hostname}/api/v1/zhuan/done?`
    let body = `id=${id}&`
    let urlObject = populatePostUrl(url,body)
    await httpPost(urlObject,caller)
    let result = httpResult;
    if(!result) return
    
    if(result.code == 0) {
        if(result.result.ticket) doneTaskTicket[userIdx][taskIdx] = result.result.ticket
        console.log(`用户${userIdx+1}领取任务[id=${id}]奖励获得：${result.result.coin}金币`)
    } else {
        console.log(`用户${userIdx+1}领取任务[id=${id}]奖励失败：${result.message}`)
    }
}
////////////////////////////////////////////////////////////////////
function populatePostUrl(url,reqBody=''){
    let urlObject = {
        url: url,
        headers: {
            'Host' : 'yuekandian.yichengw.cn',
            'version' : '8',
            'Authorization' : 'Bearer ' + userToken[userIdx],
            'Accept-Language' : 'zh-CN,zh-Hans;q=0.9',
            'Accept-Encoding' : 'gzip, deflate, br',
            'platform' : '2',
            'Accept' : '*/*',
            'User-Agent' : userAgent[userIdx],
            'Connection' : 'keep-alive',
            'device' : userDevice[userIdx],
            'store' : '100',
        },
        body: reqBody
    }
    if(userAgent[userIdx].indexOf('CBD') > -1) {
        urlObject.headers['version'] = '2'
        urlObject.headers['app'] = '3'
    }
    return urlObject;
}

function populateGetUrl(url){
    let urlObject = {
        url: url,
        headers: {
            'Host' : 'yuekandian.yichengw.cn',
            'version' : '8',
            'Authorization' : 'Bearer ' + userToken[userIdx],
            'Accept-Language' : 'zh-CN,zh-Hans;q=0.9',
            'Accept-Encoding' : 'gzip, deflate, br',
            'platform' : '2',
            'Accept' : '*/*',
            'User-Agent' : userAgent[userIdx],
            'Connection' : 'keep-alive',
            'device' : userDevice[userIdx],
            'store' : '100',
        }
    }
    if(userAgent[userIdx].indexOf('CBD') > -1) {
        urlObject.headers['version'] = '2'
        urlObject.headers['app'] = '3'
    }
    return urlObject;
}

async function httpPost(url,caller) {
    httpResult = null
    return new Promise((resolve) => {
        $.post(url, async (err, resp, data) => {
            try {
                if (err) {
                    console.log(caller + ": post请求失败");
                    console.log(JSON.stringify(err));
                    $.logErr(err);
                } else {
                    if (safeGet(data)) {
                        httpResult = JSON.parse(data);
                        if(logDebug) console.log(httpResult);
                    }
                }
            } catch (e) {
                $.logErr(e, resp);
            } finally {
                resolve();
            }
        });
    });
}

async function httpGet(url,caller) {
    httpResult = null
    return new Promise((resolve) => {
        $.get(url, async (err, resp, data) => {
            try {
                if (err) {
                    console.log(caller + ": get请求失败");
                    console.log(JSON.stringify(err));
                    $.logErr(err);
                } else {
                    if (safeGet(data,caller)) {
                        httpResult = JSON.parse(data);
                        if(logDebug) console.log(httpResult);
                    }
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

function Env(t, e) { class s { constructor(t) { this.env = t } send(t, e = "GET") { t = "string" == typeof t ? { url: t } : t; let s = this.get; return "POST" === e && (s = this.post), new Promise((e, i) => { s.call(this, t, (t, s, r) => { t ? i(t) : e(s) }) }) } get(t) { return this.send.call(this.env, t) } post(t) { return this.send.call(this.env, t, "POST") } } return new class { constructor(t, e) { this.name = t, this.http = new s(this), this.data = null, this.dataFile = "box.dat", this.logs = [], this.isMute = !1, this.isNeedRewrite = !1, this.logSeparator = "\n", this.startTime = (new Date).getTime(), Object.assign(this, e), this.log("", `\ud83d\udd14${this.name}, \u5f00\u59cb!`) } isNode() { return "undefined" != typeof module && !!module.exports } isQuanX() { return "undefined" != typeof $task } isSurge() { return "undefined" != typeof $httpClient && "undefined" == typeof $loon } isLoon() { return "undefined" != typeof $loon } toObj(t, e = null) { try { return JSON.parse(t) } catch { return e } } toStr(t, e = null) { try { return JSON.stringify(t) } catch { return e } } getjson(t, e) { let s = e; const i = this.getdata(t); if (i) try { s = JSON.parse(this.getdata(t)) } catch { } return s } setjson(t, e) { try { return this.setdata(JSON.stringify(t), e) } catch { return !1 } } getScript(t) { return new Promise(e => { this.get({ url: t }, (t, s, i) => e(i)) }) } runScript(t, e) { return new Promise(s => { let i = this.getdata("@chavy_boxjs_userCfgs.httpapi"); i = i ? i.replace(/\n/g, "").trim() : i; let r = this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout"); r = r ? 1 * r : 20, r = e && e.timeout ? e.timeout : r; const [o, h] = i.split("@"), a = { url: `http://${h}/v1/scripting/evaluate`, body: { script_text: t, mock_type: "cron", timeout: r }, headers: { "X-Key": o, Accept: "*/*" } }; this.post(a, (t, e, i) => s(i)) }).catch(t => this.logErr(t)) } loaddata() { if (!this.isNode()) return {}; { this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path"); const t = this.path.resolve(this.dataFile), e = this.path.resolve(process.cwd(), this.dataFile), s = this.fs.existsSync(t), i = !s && this.fs.existsSync(e); if (!s && !i) return {}; { const i = s ? t : e; try { return JSON.parse(this.fs.readFileSync(i)) } catch (t) { return {} } } } } writedata() { if (this.isNode()) { this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path"); const t = this.path.resolve(this.dataFile), e = this.path.resolve(process.cwd(), this.dataFile), s = this.fs.existsSync(t), i = !s && this.fs.existsSync(e), r = JSON.stringify(this.data); s ? this.fs.writeFileSync(t, r) : i ? this.fs.writeFileSync(e, r) : this.fs.writeFileSync(t, r) } } lodash_get(t, e, s) { const i = e.replace(/\[(\d+)\]/g, ".$1").split("."); let r = t; for (const t of i) if (r = Object(r)[t], void 0 === r) return s; return r } lodash_set(t, e, s) { return Object(t) !== t ? t : (Array.isArray(e) || (e = e.toString().match(/[^.[\]]+/g) || []), e.slice(0, -1).reduce((t, s, i) => Object(t[s]) === t[s] ? t[s] : t[s] = Math.abs(e[i + 1]) >> 0 == +e[i + 1] ? [] : {}, t)[e[e.length - 1]] = s, t) } getdata(t) { let e = this.getval(t); if (/^@/.test(t)) { const [, s, i] = /^@(.*?)\.(.*?)$/.exec(t), r = s ? this.getval(s) : ""; if (r) try { const t = JSON.parse(r); e = t ? this.lodash_get(t, i, "") : e } catch (t) { e = "" } } return e } setdata(t, e) { let s = !1; if (/^@/.test(e)) { const [, i, r] = /^@(.*?)\.(.*?)$/.exec(e), o = this.getval(i), h = i ? "null" === o ? null : o || "{}" : "{}"; try { const e = JSON.parse(h); this.lodash_set(e, r, t), s = this.setval(JSON.stringify(e), i) } catch (e) { const o = {}; this.lodash_set(o, r, t), s = this.setval(JSON.stringify(o), i) } } else s = this.setval(t, e); return s } getval(t) { return this.isSurge() || this.isLoon() ? $persistentStore.read(t) : this.isQuanX() ? $prefs.valueForKey(t) : this.isNode() ? (this.data = this.loaddata(), this.data[t]) : this.data && this.data[t] || null } setval(t, e) { return this.isSurge() || this.isLoon() ? $persistentStore.write(t, e) : this.isQuanX() ? $prefs.setValueForKey(t, e) : this.isNode() ? (this.data = this.loaddata(), this.data[e] = t, this.writedata(), !0) : this.data && this.data[e] || null } initGotEnv(t) { this.got = this.got ? this.got : require("got"), this.cktough = this.cktough ? this.cktough : require("tough-cookie"), this.ckjar = this.ckjar ? this.ckjar : new this.cktough.CookieJar, t && (t.headers = t.headers ? t.headers : {}, void 0 === t.headers.Cookie && void 0 === t.cookieJar && (t.cookieJar = this.ckjar)) } get(t, e = (() => { })) { t.headers && (delete t.headers["Content-Type"], delete t.headers["Content-Length"]), this.isSurge() || this.isLoon() ? (this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, { "X-Surge-Skip-Scripting": !1 })), $httpClient.get(t, (t, s, i) => { !t && s && (s.body = i, s.statusCode = s.status), e(t, s, i) })) : this.isQuanX() ? (this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, { hints: !1 })), $task.fetch(t).then(t => { const { statusCode: s, statusCode: i, headers: r, body: o } = t; e(null, { status: s, statusCode: i, headers: r, body: o }, o) }, t => e(t))) : this.isNode() && (this.initGotEnv(t), this.got(t).on("redirect", (t, e) => { try { if (t.headers["set-cookie"]) { const s = t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString(); this.ckjar.setCookieSync(s, null), e.cookieJar = this.ckjar } } catch (t) { this.logErr(t) } }).then(t => { const { statusCode: s, statusCode: i, headers: r, body: o } = t; e(null, { status: s, statusCode: i, headers: r, body: o }, o) }, t => { const { message: s, response: i } = t; e(s, i, i && i.body) })) } post(t, e = (() => { })) { if (t.body && t.headers && !t.headers["Content-Type"] && (t.headers["Content-Type"] = "application/x-www-form-urlencoded"), t.headers && delete t.headers["Content-Length"], this.isSurge() || this.isLoon()) this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, { "X-Surge-Skip-Scripting": !1 })), $httpClient.post(t, (t, s, i) => { !t && s && (s.body = i, s.statusCode = s.status), e(t, s, i) }); else if (this.isQuanX()) t.method = "POST", this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, { hints: !1 })), $task.fetch(t).then(t => { const { statusCode: s, statusCode: i, headers: r, body: o } = t; e(null, { status: s, statusCode: i, headers: r, body: o }, o) }, t => e(t)); else if (this.isNode()) { this.initGotEnv(t); const { url: s, ...i } = t; this.got.post(s, i).then(t => { const { statusCode: s, statusCode: i, headers: r, body: o } = t; e(null, { status: s, statusCode: i, headers: r, body: o }, o) }, t => { const { message: s, response: i } = t; e(s, i, i && i.body) }) } } time(t) { let e = { "M+": (new Date).getMonth() + 1, "d+": (new Date).getDate(), "H+": (new Date).getHours(), "m+": (new Date).getMinutes(), "s+": (new Date).getSeconds(), "q+": Math.floor(((new Date).getMonth() + 3) / 3), S: (new Date).getMilliseconds() }; /(y+)/.test(t) && (t = t.replace(RegExp.$1, ((new Date).getFullYear() + "").substr(4 - RegExp.$1.length))); for (let s in e) new RegExp("(" + s + ")").test(t) && (t = t.replace(RegExp.$1, 1 == RegExp.$1.length ? e[s] : ("00" + e[s]).substr(("" + e[s]).length))); return t } msg(e = t, s = "", i = "", r) { const o = t => { if (!t) return t; if ("string" == typeof t) return this.isLoon() ? t : this.isQuanX() ? { "open-url": t } : this.isSurge() ? { url: t } : void 0; if ("object" == typeof t) { if (this.isLoon()) { let e = t.openUrl || t.url || t["open-url"], s = t.mediaUrl || t["media-url"]; return { openUrl: e, mediaUrl: s } } if (this.isQuanX()) { let e = t["open-url"] || t.url || t.openUrl, s = t["media-url"] || t.mediaUrl; return { "open-url": e, "media-url": s } } if (this.isSurge()) { let e = t.url || t.openUrl || t["open-url"]; return { url: e } } } }; this.isMute || (this.isSurge() || this.isLoon() ? $notification.post(e, s, i, o(r)) : this.isQuanX() && $notify(e, s, i, o(r))); let h = ["", "==============\ud83d\udce3\u7cfb\u7edf\u901a\u77e5\ud83d\udce3=============="]; h.push(e), s && h.push(s), i && h.push(i), console.log(h.join("\n")), this.logs = this.logs.concat(h) } log(...t) { t.length > 0 && (this.logs = [...this.logs, ...t]), console.log(t.join(this.logSeparator)) } logErr(t, e) { const s = !this.isSurge() && !this.isQuanX() && !this.isLoon(); s ? this.log("", `\u2757\ufe0f${this.name}, \u9519\u8bef!`, t.stack) : this.log("", `\u2757\ufe0f${this.name}, \u9519\u8bef!`, t) } wait(t) { return new Promise(e => setTimeout(e, t)) } done(t = {}) { const e = (new Date).getTime(), s = (e - this.startTime) / 1e3; this.log("", `\ud83d\udd14${this.name}, \u7ed3\u675f! \ud83d\udd5b ${s} \u79d2`), this.log(), (this.isSurge() || this.isQuanX() || this.isLoon()) && $done(t) } }(t, e) }
