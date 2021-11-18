# 晶彩天气(v8.3.7)
  
## 重写：  
https://tq.xunsl.com/v17/NewTask/getTaskListByWeather.json  -- 点开福利页即可获取jctqCookie  
https://tq.xunsl.com/v5/CommonReward/toGetReward.json       -- 签到，和福利页任务奖励  
https://tq.xunsl.com/v5/article/info.json                   -- 点开文章获取文章body  
https://tq.xunsl.com/v5/article/detail.json                 -- 点开视频获取视频body  
https://tq.xunsl.com/v5/user/stay.json                      -- 阅读文章或者看视频一段时间后可以获取到时长body  
https://tq.xunsl.com/v5/nameless/adlickstart.json           -- 点开看看赚获取body，可以一直开着，脚本会自动删除重复和失效body  
https://tq.xunsl.com/v5/Weather/giveBoxOnWeather.json       -- 点开福利页浮窗宝箱和观看翻倍视频获取body  
https://tq.xunsl.com/v5/weather/giveTimeInterval.json       -- 点开首页气泡红包和观看翻倍视频获取body  
https://tq.xunsl.com/v5/wechat/withdraw2.json               -- 提现一次对应金额获取body  
https://tq.xunsl.com/v5/CommonReward/toDouble.json          -- 领取签到翻倍奖励后可获取  
  
## 任务：  
jctq_daily.js           -- 领转发页定时宝箱，领福利页定时宝箱，领首页气泡红包，时段转发，刷福利视频，抽奖5次  
jctq_reward.js          -- 签到和翻倍，任务奖励领取，统计今日收益，自动提现  
jctq_kkz.js             -- 完成看看赚任务，删除重复和失效的body  
jctq_read.js            -- 阅读文章，浏览视频  
  
## 分享阅读：  
jctq_shareRead.js       -- 分享和助力阅读，需要在环境变量jctqShareNum里设置要被阅读的次数，不设置默认不跑  
