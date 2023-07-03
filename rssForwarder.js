// const TelegramBot = require('node-telegram-bot-api');
const Parser = require('rss-parser');
const axios = require('axios');
const cheerio = require('cheerio');
const moment = require('moment');
const fs = require('fs');


// 填入你的Telegram Bot Token
const botToken = process.env.TELEGRAM_BOT_TOKEN // process.env.TELEGRAM_BOT_TOKEN;

// 填入你的Telegram频道ID
const channelID = '@SolidotFree';


// 填入RSS网址
const rssURL = 'https://www.solidot.org/index.rss';

// 创建RSS解析器对象
const parser = new Parser();


// 存储上一次转发的最新文章链接
let lastLink = '';

// 读取持久化存储中的链接
fs.readFile('lastLink.txt', 'utf8', (err, data) => {
  if (!err) {
    lastLink = data.trim();
    console.log('从持久化存储读取到的链接:', lastLink);
  }
});


// 定义定时任务间隔时间（单位：毫秒）
const interval = 10000; // 每分钟刷新一次

// 定义定时任务
setInterval(forwardLatestRSS, interval);

// 转发最新的RSS内容到Telegram频道
async function forwardLatestRSS() {
  try {
    // 解析RSS数据
    const feed = await parser.parseURL(rssURL);
    console.log('feed.items[0]:::', feed.items[0]);
    // 获取最新的文章链接
    const link = feed.items[0].link;

    // 如果最新文章链接与上一次转发的链接相同，说明没有新内容发布
    if (link === lastLink) {
      console.log('没有新内容。');
      return;
    }

    // 保存最新的文章链接
    lastLink = link;

    // 将链接更新到持久化存储文件
    fs.writeFile('lastLink.txt', lastLink, (err) => {
      if (err) {
        console.error('Error writing to file:', err);
      } else {
        console.log('链接已更新到持久化存储。');
      }
    });


    // 获取内容内的原文链接
    axios.get(lastLink)
      .then(response => {
        if (response.status === 200) {
          //获取到原内容的原文链接
          const $ = cheerio.load(response.data);
          const finalcontent = $('.p_mainnew').html();
          const via = $('.talk_time > b').text().substring(2);
          const tag = $('.talk_time .icon_float a').attr('title');
          const regex = /https?:\/\/[^\s]+/;
          const url = finalcontent.match(regex)[0];

          // 获取最新文章的标题和内容
          const title = feed.items[0].title;
          const content = feed.items[0].contentSnippet;
          const link = feed.items[0].link;
          const isoDate = feed.items[0].isoDate

          const formattedDate = moment(isoDate).utcOffset(8).format('YYYY-MM-DD HH:mm:ss');
          // 组合消息文本
          const messageText = `<a href="${link}"><b>${title}</b></a>\n\n${formattedDate} by ${via}\n\n${content}\n\n${url}\n\n#${tag}`;
          // console.log('messageText:', messageText);
          const disablePreview = { disable_web_page_preview: true };



          // 发送消息到频道
          // bot.sendMessage(channelID, messageText, { parse_mode: 'HTML' });
          axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            chat_id: channelID,
            text: messageText,
            parse_mode: 'HTML',
            ...disablePreview
          })
            .then(response => {
              console.log('Message sent successfully:', response);
            })
            .catch(error => {
              console.error('Error sending message:', error.response.data.description);
            });
        }
      })
      .catch(error => {
        console.error('Error:', error);
      });

    console.log('转发了新内容。');
  } catch (error) {
    console.error('错误:', error.message);
  }
}




/* <div class="p_mainnew">
          苹果成为第一家市值突破 3 万亿美元的企业。苹果是在 2018 年市值首次突破 1 万亿美元，2020 年突破 2 万亿美元，然后不到三年之后突破 3 万亿美元。今年以来，苹果的股价上涨了接近 50%，它的旗舰产品 iPhone 手机需求一直强劲，今年晚些时候还将推出一款售价 3499 美元的增强现实产品 Vision Pro。
<p></p>
<!--more-->
<p></p>
<br>
https://finance.yahoo.com/quote/AAPL?p=AAPL&amp;.tsrc=fin-srch					                </div> */


