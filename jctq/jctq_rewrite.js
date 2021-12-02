/*
安卓：水果天气(v8.3.9)

此脚本负责：捉包重写

脚本会自动提现，如果不想自动提现的，请不要捉提现body，或者新建环境变量jctqWithdrawFlag，写成0

重写：
https://tq.xunsl.com/v17/NewTask/getTaskListByWeather.json  -- 点开任务页即可获取jctqCookie
https://tq.xunsl.com/v5/CommonReward/toGetReward.json       -- 领取签到和任务奖励后获取。首页左方点击福利视频浮窗（一共5次，建议捉到第一个后复制4遍）。获取完建议关掉重写
https://tq.xunsl.com/v5/article/info.json                   -- 点开文章获取文章body，获取完建议关掉重写
https://tq.xunsl.com/v5/article/detail.json                 -- 点开视频获取视频body，获取完建议关掉重写
https://tq.xunsl.com/v5/user/stay.json                      -- 阅读文章或者看视频一段时间后可以获取到时长body，获取完务必关掉重写，同一个账号不要获取多个时长body
https://tq.xunsl.com/v5/nameless/adlickstart.json           -- 点开看看赚获取body，可以一直开着，看看赚会不定时更新
https://tq.xunsl.com/v5/Weather/giveBoxOnWeather.json       -- （旧版8.3.7）点开福利页浮窗宝箱和观看翻倍视频获取body，获取完建议关掉重写
https://tq.xunsl.com/v5/weather/giveTimeInterval.json       -- （旧版8.3.7）点开首页气泡红包和观看翻倍视频获取body，获取完建议关掉重写
https://tq.xunsl.com/v5/Weather/giveReceiveGoldCoin.json    -- 任务页点击一键收金币获取第一个body，收金币后看完视频领奖励获取第二个body
https://tq.xunsl.com/v17/Rvideo/videoCallback.json          -- 资讯页右上角宝箱，看视频领取奖励后获取
https://tq.xunsl.com/v5/wechat/withdraw2.json               -- 提现一次对应金额获取body
https://tq.xunsl.com/v5/CommonReward/toDouble.json          -- 领取签到翻倍奖励后可获取

任务：
jctq_daily.js   -- 各种时段奖励，抽奖，转发
jctq_reward.js  -- 签到和翻倍，任务奖励领取，领首页福利视频奖励，首页统计今日收益，自动提现
jctq_kkz.js     -- 完成看看赚任务
jctq_read.js    -- 阅读文章，浏览视频

*/

const jsname = '晶彩天气捉包重写'
const $ = Env(jsname)
const notifyFlag = 1; //0为关闭通知，1为打开通知,默认为1
const logDebug = 0

let jctqCookie = ($.isNode() ? process.env.jctqCookie : $.getdata('jctqCookie')) || '';
let jctqBoxbody = ($.isNode() ? process.env.jctqBoxbody : $.getdata('jctqBoxbody')) || '';
let jctqTimeBody = ($.isNode() ? process.env.jctqTimeBody : $.getdata('jctqTimeBody')) || '';
let jctqWzBody = ($.isNode() ? process.env.jctqWzBody : $.getdata('jctqWzBody')) || '';
let jctqLookStartbody = ($.isNode() ? process.env.jctqLookStartbody : $.getdata('jctqLookStartbody')) || '';
let jctqWithdraw = ($.isNode() ? process.env.jctqWithdraw : $.getdata('jctqWithdraw')) || '';
let jctqBubbleBody = ($.isNode() ? process.env.jctqBubbleBody : $.getdata('jctqBubbleBody')) || '';
let jctqGiveBoxBody = ($.isNode() ? process.env.jctqGiveBoxBody : $.getdata('jctqGiveBoxBody')) || '';
let jctqSignDoubleBody = ($.isNode() ? process.env.jctqSignDoubleBody : $.getdata('jctqSignDoubleBody')) || '';
let jctqGoldBody = ($.isNode() ? process.env.jctqGoldBody : $.getdata('jctqGoldBody')) || '';
let jctqVideoBody = ($.isNode() ? process.env.jctqVideoBody : $.getdata('jctqVideoBody')) || '';

///////////////////////////////////////////////////////////////////

!(async () => {

    if(typeof $request !== "undefined")
    {
        await getRewrite()
    } else {
        $.msg(jsname+': 此脚本只负责重写，请检查任务设置')
    }

})()
.catch((e) => $.logErr(e))
.finally(() => $.done())

async function getRewrite() {
    
    if($request.url.indexOf('v17/NewTask/getTaskListByWeather.json') > -1) {
        rUrl = $request.url
        app_version = rUrl.match(/app_version=([\w\.]+)/)[1]
        zqkey = rUrl.match(/zqkey=([\w-]+)/)[1]
        zqkey_id = rUrl.match(/zqkey_id=([\w-]+)/)[1]
        uid = rUrl.match(/uid=([\w]+)/)[1]
        uidStr = 'uid=' + uid
        
        let newCookie = `app_version=${app_version}&cookie=${zqkey}&cookie_id=${zqkey_id}&uid=${uid}`
        if(jctqCookie) {
            if(jctqCookie.indexOf(uidStr) > -1) {
                $.msg(jsname+` 此jctqCookie已存在，本次跳过`)
            } else {
                jctqCookie = jctqCookie + '@' + newCookie
                $.setdata(jctqCookie, 'jctqCookie');
                bodyList = jctqCookie.split('@')
                $.msg(jsname+` 获取第${bodyList.length}个jctqCookie成功`)
            }
        } else {
            $.setdata(newCookie, 'jctqCookie');
            $.msg(jsname+` 获取第一个jctqCookie成功`)
        }
    }
    
    if($request.url.indexOf('v5/CommonReward/toGetReward.json') > -1) {
        rBody = $request.body
        if(jctqBoxbody) {
            if(jctqBoxbody.indexOf(rBody) > -1) {
                $.msg(jsname+` 此签到/奖励body已存在，本次跳过`)
            } else {
                jctqBoxbody = jctqBoxbody + '&' + rBody
                $.setdata(jctqBoxbody, 'jctqBoxbody');
                bodyList = jctqBoxbody.split('&')
                $.msg(jsname+` 获取第${bodyList.length}个签到/奖励body成功`)
            }
        } else {
            $.setdata(rBody, 'jctqBoxbody');
            $.msg(jsname+` 获取第一个签到/奖励body成功`)
        }
    }
    
    if($request.url.indexOf('v5/article/info.json') > -1 || 
       $request.url.indexOf('v5/article/detail.json') > -1) {
        rUrl = $request.url
        bodys = rUrl.split('?p=')
        rBody = 'p=' + bodys[1]
        if(jctqWzBody) {
            if(jctqWzBody.indexOf(rBody) > -1) {
                $.msg(jsname+` 此文章/视频body已存在，本次跳过`)
            } else {
                jctqWzBody = jctqWzBody + '&' + rBody
                $.setdata(jctqWzBody, 'jctqWzBody');
                bodyList = jctqWzBody.split('&')
                $.msg(jsname+` 获取第${bodyList.length}个文章/视频body成功`)
            }
        } else {
            $.setdata(rBody, 'jctqWzBody');
            $.msg(jsname+` 获取第一个文章/视频body成功`)
        }
    }
    
    if($request.url.indexOf('v5/user/stay.json') > -1) {
        rBody = $request.body
        if(jctqTimeBody) {
            if(jctqTimeBody.indexOf(rBody) > -1) {
                $.msg(jsname+` 此时长body已存在，本次跳过`)
            } else {
                jctqTimeBody = jctqTimeBody + '&' + rBody
                $.setdata(jctqTimeBody, 'jctqTimeBody');
                bodyList = jctqTimeBody.split('&')
                $.msg(jsname+` 获取第${bodyList.length}个时长body成功`)
            }
        } else {
            $.setdata(rBody, 'jctqTimeBody');
            $.msg(jsname+` 获取第一个时长body成功`)
        }
    }
    
    if($request.url.indexOf('v5/nameless/adlickstart.json') > -1) {
        rBody = $request.body
        if(jctqLookStartbody) {
            if(jctqLookStartbody.indexOf(rBody) > -1) {
                $.msg(jsname+` 此看看赚body已存在，本次跳过`)
            } else {
                jctqLookStartbody = jctqLookStartbody + '&' + rBody
                $.setdata(jctqLookStartbody, 'jctqLookStartbody');
                bodyList = jctqLookStartbody.split('&')
                $.msg(jsname+` 获取第${bodyList.length}个看看赚body成功`)
            }
        } else {
            $.setdata(rBody, 'jctqLookStartbody');
            $.msg(jsname+` 获取第一个看看赚body成功`)
        }
    }
    
    if($request.url.indexOf('v5/wechat/withdraw2.json') > -1) {
        rBody = $request.body
        if(jctqWithdraw) {
            if(jctqWithdraw.indexOf(rBody) > -1) {
                $.msg(jsname+` 此提现body已存在，本次跳过`)
            } else {
                jctqWithdraw = jctqWithdraw + '&' + rBody
                $.setdata(jctqWithdraw, 'jctqWithdraw');
                bodyList = jctqWithdraw.split('&')
                $.msg(jsname+` 获取第${bodyList.length}个提现body成功`)
            }
        } else {
            $.setdata(rBody, 'jctqWithdraw');
            $.msg(jsname+` 获取第一个提现body成功`)
        }
    }
    
    if($request.url.indexOf('v5/Weather/giveBoxOnWeather.json') > -1) {
        rBody = $request.body
        if(jctqGiveBoxBody) {
            if(jctqGiveBoxBody.indexOf(rBody) > -1) {
                $.msg(jsname+` 此福利页宝箱/翻倍body已存在，本次跳过`)
            } else {
                jctqGiveBoxBody = jctqGiveBoxBody + '&' + rBody
                $.setdata(jctqGiveBoxBody, 'jctqGiveBoxBody');
                bodyList = jctqGiveBoxBody.split('&')
                $.msg(jsname+` 获取第${bodyList.length}个福利页宝箱/翻倍body成功`)
            }
        } else {
            $.setdata(rBody, 'jctqGiveBoxBody');
            $.msg(jsname+` 获取第一个福利页宝箱/翻倍body成功`)
        }
    }
    
    if($request.url.indexOf('v5/weather/giveTimeInterval.json') > -1) {
        rBody = $request.body
        if(jctqBubbleBody) {
            if(jctqBubbleBody.indexOf(rBody) > -1) {
                $.msg(jsname+` 此首页气泡/翻倍body已存在，本次跳过`)
            } else {
                jctqBubbleBody = jctqBubbleBody + '&' + rBody
                $.setdata(jctqBubbleBody, 'jctqBubbleBody');
                bodyList = jctqBubbleBody.split('&')
                $.msg(jsname+` 获取第${bodyList.length}个首页气泡/翻倍body成功`)
            }
        } else {
            $.setdata(rBody, 'jctqBubbleBody');
            $.msg(jsname+` 获取第一个首页气泡/翻倍body成功`)
        }
    }
    
    if($request.url.indexOf('v5/CommonReward/toDouble.json') > -1) {
        rBody = $request.body
        if(jctqSignDoubleBody) {
            if(jctqSignDoubleBody.indexOf(rBody) > -1) {
                $.msg(jsname+` 此签到翻倍body已存在，本次跳过`)
            } else {
                jctqSignDoubleBody = jctqSignDoubleBody + '&' + rBody
                $.setdata(jctqSignDoubleBody, 'jctqSignDoubleBody');
                bodyList = jctqSignDoubleBody.split('&')
                $.msg(jsname+` 获取第${bodyList.length}个签到翻倍body成功`)
            }
        } else {
            $.setdata(rBody, 'jctqSignDoubleBody');
            $.msg(jsname+` 获取第一个签到翻倍body成功`)
        }
    }
    
    if($request.url.indexOf('v5/Weather/giveReceiveGoldCoin.json') > -1) {
        rBody = $request.body
        if(jctqGoldBody) {
            if(jctqGoldBody.indexOf(rBody) > -1) {
                $.msg(jsname+` 此收金币body已存在，本次跳过`)
            } else {
                jctqGoldBody = jctqGoldBody + '&' + rBody
                $.setdata(jctqGoldBody, 'jctqGoldBody');
                bodyList = jctqGoldBody.split('&')
                $.msg(jsname+` 获取第${bodyList.length}个收金币body成功`)
            }
        } else {
            $.setdata(rBody, 'jctqGoldBody');
            $.msg(jsname+` 获取第一个收金币body成功`)
        }
    }
    
    if($request.url.indexOf('v17/Rvideo/videoCallback.json') > -1) {
        rBody = $request.body
        if(jctqVideoBody) {
            if(jctqVideoBody.indexOf(rBody) > -1) {
                $.msg(jsname+` 此资讯页视频奖励body已存在，本次跳过`)
            } else {
                jctqVideoBody = jctqVideoBody + '@' + rBody
                $.setdata(jctqVideoBody, 'jctqVideoBody');
                bodyList = jctqVideoBody.split('@')
                $.msg(jsname+` 获取第${bodyList.length}个资讯页视频奖励body成功`)
            }
        } else {
            $.setdata(rBody, 'jctqVideoBody');
            $.msg(jsname+` 获取第一个资讯页视频奖励body成功`)
        }
    }
}

////////////////////////////////////////////////////////////////////
function Env(t, e) { class s { constructor(t) { this.env = t } send(t, e = "GET") { t = "string" == typeof t ? { url: t } : t; let s = this.get; return "POST" === e && (s = this.post), new Promise((e, i) => { s.call(this, t, (t, s, r) => { t ? i(t) : e(s) }) }) } get(t) { return this.send.call(this.env, t) } post(t) { return this.send.call(this.env, t, "POST") } } return new class { constructor(t, e) { this.name = t, this.http = new s(this), this.data = null, this.dataFile = "box.dat", this.logs = [], this.isMute = !1, this.isNeedRewrite = !1, this.logSeparator = "\n", this.startTime = (new Date).getTime(), Object.assign(this, e), this.log("", `\ud83d\udd14${this.name}, \u5f00\u59cb!`) } isNode() { return "undefined" != typeof module && !!module.exports } isQuanX() { return "undefined" != typeof $task } isSurge() { return "undefined" != typeof $httpClient && "undefined" == typeof $loon } isLoon() { return "undefined" != typeof $loon } toObj(t, e = null) { try { return JSON.parse(t) } catch { return e } } toStr(t, e = null) { try { return JSON.stringify(t) } catch { return e } } getjson(t, e) { let s = e; const i = this.getdata(t); if (i) try { s = JSON.parse(this.getdata(t)) } catch { } return s } setjson(t, e) { try { return this.setdata(JSON.stringify(t), e) } catch { return !1 } } getScript(t) { return new Promise(e => { this.get({ url: t }, (t, s, i) => e(i)) }) } runScript(t, e) { return new Promise(s => { let i = this.getdata("@chavy_boxjs_userCfgs.httpapi"); i = i ? i.replace(/\n/g, "").trim() : i; let r = this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout"); r = r ? 1 * r : 20, r = e && e.timeout ? e.timeout : r; const [o, h] = i.split("@"), a = { url: `http://${h}/v1/scripting/evaluate`, body: { script_text: t, mock_type: "cron", timeout: r }, headers: { "X-Key": o, Accept: "*/*" } }; this.post(a, (t, e, i) => s(i)) }).catch(t => this.logErr(t)) } loaddata() { if (!this.isNode()) return {}; { this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path"); const t = this.path.resolve(this.dataFile), e = this.path.resolve(process.cwd(), this.dataFile), s = this.fs.existsSync(t), i = !s && this.fs.existsSync(e); if (!s && !i) return {}; { const i = s ? t : e; try { return JSON.parse(this.fs.readFileSync(i)) } catch (t) { return {} } } } } writedata() { if (this.isNode()) { this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path"); const t = this.path.resolve(this.dataFile), e = this.path.resolve(process.cwd(), this.dataFile), s = this.fs.existsSync(t), i = !s && this.fs.existsSync(e), r = JSON.stringify(this.data); s ? this.fs.writeFileSync(t, r) : i ? this.fs.writeFileSync(e, r) : this.fs.writeFileSync(t, r) } } lodash_get(t, e, s) { const i = e.replace(/\[(\d+)\]/g, ".$1").split("."); let r = t; for (const t of i) if (r = Object(r)[t], void 0 === r) return s; return r } lodash_set(t, e, s) { return Object(t) !== t ? t : (Array.isArray(e) || (e = e.toString().match(/[^.[\]]+/g) || []), e.slice(0, -1).reduce((t, s, i) => Object(t[s]) === t[s] ? t[s] : t[s] = Math.abs(e[i + 1]) >> 0 == +e[i + 1] ? [] : {}, t)[e[e.length - 1]] = s, t) } getdata(t) { let e = this.getval(t); if (/^@/.test(t)) { const [, s, i] = /^@(.*?)\.(.*?)$/.exec(t), r = s ? this.getval(s) : ""; if (r) try { const t = JSON.parse(r); e = t ? this.lodash_get(t, i, "") : e } catch (t) { e = "" } } return e } setdata(t, e) { let s = !1; if (/^@/.test(e)) { const [, i, r] = /^@(.*?)\.(.*?)$/.exec(e), o = this.getval(i), h = i ? "null" === o ? null : o || "{}" : "{}"; try { const e = JSON.parse(h); this.lodash_set(e, r, t), s = this.setval(JSON.stringify(e), i) } catch (e) { const o = {}; this.lodash_set(o, r, t), s = this.setval(JSON.stringify(o), i) } } else s = this.setval(t, e); return s } getval(t) { return this.isSurge() || this.isLoon() ? $persistentStore.read(t) : this.isQuanX() ? $prefs.valueForKey(t) : this.isNode() ? (this.data = this.loaddata(), this.data[t]) : this.data && this.data[t] || null } setval(t, e) { return this.isSurge() || this.isLoon() ? $persistentStore.write(t, e) : this.isQuanX() ? $prefs.setValueForKey(t, e) : this.isNode() ? (this.data = this.loaddata(), this.data[e] = t, this.writedata(), !0) : this.data && this.data[e] || null } initGotEnv(t) { this.got = this.got ? this.got : require("got"), this.cktough = this.cktough ? this.cktough : require("tough-cookie"), this.ckjar = this.ckjar ? this.ckjar : new this.cktough.CookieJar, t && (t.headers = t.headers ? t.headers : {}, void 0 === t.headers.Cookie && void 0 === t.cookieJar && (t.cookieJar = this.ckjar)) } get(t, e = (() => { })) { t.headers && (delete t.headers["Content-Type"], delete t.headers["Content-Length"]), this.isSurge() || this.isLoon() ? (this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, { "X-Surge-Skip-Scripting": !1 })), $httpClient.get(t, (t, s, i) => { !t && s && (s.body = i, s.statusCode = s.status), e(t, s, i) })) : this.isQuanX() ? (this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, { hints: !1 })), $task.fetch(t).then(t => { const { statusCode: s, statusCode: i, headers: r, body: o } = t; e(null, { status: s, statusCode: i, headers: r, body: o }, o) }, t => e(t))) : this.isNode() && (this.initGotEnv(t), this.got(t).on("redirect", (t, e) => { try { if (t.headers["set-cookie"]) { const s = t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString(); this.ckjar.setCookieSync(s, null), e.cookieJar = this.ckjar } } catch (t) { this.logErr(t) } }).then(t => { const { statusCode: s, statusCode: i, headers: r, body: o } = t; e(null, { status: s, statusCode: i, headers: r, body: o }, o) }, t => { const { message: s, response: i } = t; e(s, i, i && i.body) })) } post(t, e = (() => { })) { if (t.body && t.headers && !t.headers["Content-Type"] && (t.headers["Content-Type"] = "application/x-www-form-urlencoded"), t.headers && delete t.headers["Content-Length"], this.isSurge() || this.isLoon()) this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, { "X-Surge-Skip-Scripting": !1 })), $httpClient.post(t, (t, s, i) => { !t && s && (s.body = i, s.statusCode = s.status), e(t, s, i) }); else if (this.isQuanX()) t.method = "POST", this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, { hints: !1 })), $task.fetch(t).then(t => { const { statusCode: s, statusCode: i, headers: r, body: o } = t; e(null, { status: s, statusCode: i, headers: r, body: o }, o) }, t => e(t)); else if (this.isNode()) { this.initGotEnv(t); const { url: s, ...i } = t; this.got.post(s, i).then(t => { const { statusCode: s, statusCode: i, headers: r, body: o } = t; e(null, { status: s, statusCode: i, headers: r, body: o }, o) }, t => { const { message: s, response: i } = t; e(s, i, i && i.body) }) } } time(t) { let e = { "M+": (new Date).getMonth() + 1, "d+": (new Date).getDate(), "H+": (new Date).getHours(), "m+": (new Date).getMinutes(), "s+": (new Date).getSeconds(), "q+": Math.floor(((new Date).getMonth() + 3) / 3), S: (new Date).getMilliseconds() }; /(y+)/.test(t) && (t = t.replace(RegExp.$1, ((new Date).getFullYear() + "").substr(4 - RegExp.$1.length))); for (let s in e) new RegExp("(" + s + ")").test(t) && (t = t.replace(RegExp.$1, 1 == RegExp.$1.length ? e[s] : ("00" + e[s]).substr(("" + e[s]).length))); return t } msg(e = t, s = "", i = "", r) { const o = t => { if (!t) return t; if ("string" == typeof t) return this.isLoon() ? t : this.isQuanX() ? { "open-url": t } : this.isSurge() ? { url: t } : void 0; if ("object" == typeof t) { if (this.isLoon()) { let e = t.openUrl || t.url || t["open-url"], s = t.mediaUrl || t["media-url"]; return { openUrl: e, mediaUrl: s } } if (this.isQuanX()) { let e = t["open-url"] || t.url || t.openUrl, s = t["media-url"] || t.mediaUrl; return { "open-url": e, "media-url": s } } if (this.isSurge()) { let e = t.url || t.openUrl || t["open-url"]; return { url: e } } } }; this.isMute || (this.isSurge() || this.isLoon() ? $notification.post(e, s, i, o(r)) : this.isQuanX() && $notify(e, s, i, o(r))); let h = ["", "==============\ud83d\udce3\u7cfb\u7edf\u901a\u77e5\ud83d\udce3=============="]; h.push(e), s && h.push(s), i && h.push(i), console.log(h.join("\n")), this.logs = this.logs.concat(h) } log(...t) { t.length > 0 && (this.logs = [...this.logs, ...t]), console.log(t.join(this.logSeparator)) } logErr(t, e) { const s = !this.isSurge() && !this.isQuanX() && !this.isLoon(); s ? this.log("", `\u2757\ufe0f${this.name}, \u9519\u8bef!`, t.stack) : this.log("", `\u2757\ufe0f${this.name}, \u9519\u8bef!`, t) } wait(t) { return new Promise(e => setTimeout(e, t)) } done(t = {}) { const e = (new Date).getTime(), s = (e - this.startTime) / 1e3; this.log("", `\ud83d\udd14${this.name}, \u7ed3\u675f! \ud83d\udd5b ${s} \u79d2`), this.log(), (this.isSurge() || this.isQuanX() || this.isLoon()) && $done(t) } }(t, e) }
