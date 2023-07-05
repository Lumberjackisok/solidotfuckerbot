// const TelegramBot = require('node-telegram-bot-api');
const Parser = require('rss-parser');
const axios = require('axios');
const cheerio = require('cheerio');
const moment = require('moment');
const fs = require('fs');

// 填入你的Telegram Bot Token
const botToken = 'process.env.TELEGRAM_BOT_TOKEN';  // process.env.TELEGRAM_BOT_TOKEN;

// 填入你的Telegram频道ID
const channelID = '@SolidotFree';//@testsolidotfucker  @SolidotFree

// 填入RSS网址
const rssURL = 'https://www.solidot.org/index.rss';

// 创建RSS解析器对象
const parser = new Parser();

// 存储上一次转发的最新文章链接
let lastLink = [];

try {
  // 读取持久化存储中的链接
  fs.readFile('lastLink.json', 'utf8', (err, data) => {
    console.log('data:', data);
    console.log('err:', err);
    if (!err) {
      lastLink = JSON.parse(data);
      console.log('从持久化存储读取到的链接:', lastLink);
    }
  });
} catch (err) { console.log('readFile err', err); }


// 定义定时任务间隔时间（单位：毫秒）
const interval = 60000; // 每分钟刷新一次

// 定义定时任务
// setInterval(forwardLatestRSS, interval);
forwardLatestRSS();
// 转发最新的RSS内容到Telegram频道
async function forwardLatestRSS() {
  try {
    // 解析RSS数据
    let feedres = await parser.parseURL(rssURL);
    let feed = feedres.items;
    // feed = feed.reverse();



    // 获取最新的文章链接
    let link = feed.map(item => item.link);
    // link = link.reverse();
    // console.log('link:', link);

    // 获取最新link中与lastlink不同的link
    let res = lastLink.length ? link.filter((item) => { return !lastLink.includes(item) }) : link;
    // console.log('res:', res);

    //获取res对应的内容
    let finalmessage = feed.map(item => {
      if (res.includes(item.link)) {
        return item;
      }
    })
    //过滤出有效数据，并反转数组
    finalmessage = finalmessage.filter(item => item).reverse();
    console.log('finalmessage:', finalmessage);

    if (res.length === 0) {
      console.log('没有新内容。');
      return;
    }

    // 保存最新的文章链接
    // lastLink = link;

    //将新link和保存的旧link合并，并从数组后面去掉新link.length的条数，使保存的link数始终保持20条
    let pushlinks = res.concat(lastLink);
    // console.log('pushlinks:', pushlinks);
    console.log('res:', res, res.length);
    console.log('lastLink:', lastLink);

    let count = res.length === link.length ? 0 : -res.length;

    console.log('pushlinks:', count, pushlinks);

    pushlinks = pushlinks.slice(0, count)
    // 将链接更新到持久化存储文件
    fs.writeFile('lastLink.json', JSON.stringify(pushlinks), (err) => {
      if (err) {
        console.error('Error writing to file:', err);
      } else {
        console.log('链接已更新到持久化存储。');
      }
    });

    for (let i = 0; i < res.length; i++) {
      // console.log('res[i]:', res[i]);
      // console.log('feed[i]:', feed[i]);

      setTimeout(() => {
        axios.get(res[i])
          .then(response => {
            if (response.status === 200) {
              //获取到原内容的原文链接
              const $ = cheerio.load(response.data);
              const finalcontent = $('.p_mainnew').html();

              const via = $('.talk_time > b').text().substring(2);
              const tag = $('.talk_time .icon_float a').attr('title');
              const regex = /(http|https):\/\/[^\s]+/g;///https:\/\/.*?(?<!<br>)/
              let url = finalcontent.match(regex).toString();
              //去掉url的所有逗号，并将所有<br>替换为/n
              url = url.replace(/,/g, '');
              url = url.replace(/<br>/g, '\n');
              console.log('url:', url);

              // 获取最新文章的标题和内容
              const title = finalmessage[i].title;
              const content = finalmessage[i].contentSnippet;
              const link = finalmessage[i].link;
              const isoDate = finalmessage[i].isoDate

              const formattedDate = moment(isoDate).utcOffset(8).format('YYYY-MM-DD HH:mm:ss');
              // 组合消息文本
              // const messageText = `<a href="${link}"><b>${title}</b></a>\n\n${formattedDate} by ${via}\n\n${content}\n\n${url}\n\n#${tag}`;
              // console.log('messageText:', messageText);
              const disablePreview = { disable_web_page_preview: true };

              // 发送消息到频道
              // bot.sendMessage(channelID, messageText, { parse_mode: 'HTML' });
              axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                chat_id: channelID,
                text: `<a href="${link}"><b>${title}</b></a>\n\n${formattedDate} by ${via}\n\n${content}\n\n${url}\n\n#${tag}`,
                parse_mode: 'HTML',
                ...disablePreview
              })
                .then(response => {
                  console.log('Message sent successfully:');
                })
                .catch(error => {
                  console.error('Error sending message:', error.response.data.description);
                });
            }
          })
          .catch(error => {
            console.error('Error:', error);
          });
      }, i * 5000)

      console.log('转发了新内容。');
    }
    // 获取内容内的原文链接

  } catch (error) {
    console.error('错误:', error);
  }
}
