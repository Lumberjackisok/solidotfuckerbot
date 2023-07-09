const Parser = require('rss-parser');
const axios = require('axios');
const cheerio = require('cheerio');
const moment = require('moment');

const botToken = process.env.TELEGRAM_BOT_TOKEN; //process.env.TELEGRAM_BOT_TOKEN;
const channelID = '@SolidotFree';//@testsolidotfucker  @SolidotFree
const groupID = process.env.groupID;//process.env.groupID
const rssURL = 'https://www.solidot.org/index.rss';


module.exports = {
  forwardLatestRSS: async function () {
    // 创建RSS解析器对象
    const parser = new Parser();

    // 存储上一次转发的最新文章链接
    let lastLink = [];

    try {
      //从群组获取持久化储存的链接
      const config = {
        headers: {
          'Content-Type': 'application/json'
        },
        params: {
          chat_id: groupID
        }
      };

      // Axios request URL
      const url = `https://api.telegram.org/bot${botToken}/getChat`;

      // Axios request payload
      const payload = {
        limit: 1
      };

      // Send Axios request to Telegram Bot API
      await axios.post(url, payload, config)
        .then(response => {
          // Parse response data to get the first message
          lastLink = response.data.result.pinned_message.text.split(',');
          console.log('从群组持久化存储读取到的链接::', lastLink);
        })
        .catch(error => {
          console.error(error);
        });

    } catch (err) { console.log('readFile err', err); }




    try {
      // 解析RSS数据
      let feedres = await parser.parseURL(rssURL);
      let feed = feedres.items;


      // 获取最新的文章链接
      let link = feed.map(item => item.link);
      console.log('link:', link);


      // 获取最新link中与lastlink不同的link
      let res = lastLink.length ? link.filter((item) => { return !lastLink.includes(item) }) : link;
      console.log('res:', res);

      //获取res对应的内容
      let finalmessage = feed.map(item => {
        if (res.includes(item.link)) {
          return item;
        }
      })


      if (res.length === 0) {
        console.log('没有新内容。');
        return;
      }

      //将新link和保存的旧link合并，并从数组后面去掉新link.length的条数，使保存的link数始终保持20条
      let pushlinks = res.concat(lastLink);
      let count = res.length === link.length ? res.length : -res.length;
      pushlinks = pushlinks.slice(0, count)
      // console.log('pushlinks:', pushlinks);

      // 将链接更新到群组并置顶，实现持久化存储链接

      //向telegram群聊发送链接并置顶
      const config = {
        headers: {
          'Content-Type': 'application/json'
        },
        params: {
          chat_id: groupID
        }
      };

      // Axios request URL
      const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

      const disablePreview = { disable_web_page_preview: true };

      // Axios request payload
      const payload = {
        text: pushlinks.join(','),
        disable_notification: true,
        parse_mode: 'HTML',
        ...disablePreview
      };

      // Send Axios request to Telegram Bot API
      await axios.post(url, payload, config)
        .then(async response => {
          // Parse response data to get the first message
          const result = response.data.result;

          //置顶该消息
          const pinPayload = {
            chat_id: groupID,
            message_id: result.message_id,
            disable_notification: true
          };

          await axios.post(`https://api.telegram.org/bot${botToken}/pinChatMessage`, pinPayload)
            .then(response => {
              console.log(response.data);
            })
            .catch(error => {
              console.error(error);
            });

        })
        .catch(error => {
          console.error(error);
        })



      //遍历最新消息
      for (let i = 0; i < res.length; i++) {

        setTimeout(async () => {
          // console.log('res[res.length - i]:', res[res.length - 1 - i]);
          await axios.get(res[res.length - 1 - i])
            .then(async response => {
              if (response.status === 200) {
                //获取到原内容的原文链接
                const $ = cheerio.load(response.data);
                const finalcontent = $('.p_mainnew').html();

                const via = $('.talk_time > b').text().substring(2);
                const tag = $('.talk_time .icon_float a').attr('title');
                const regex = /(http|https):\/\/[^\s]+/g;
                let url = finalcontent.match(regex).toString();
                url = url.replace(/,/g, '');
                url = url.replace(/<br>/g, '\n');
                // console.log('url:', url);

                // 获取最新文章的标题和内容
                const title = finalmessage[res.length - 1 - i].title;
                const content = finalmessage[res.length - 1 - i].contentSnippet;
                const link = finalmessage[res.length - 1 - i].link;
                const isoDate = finalmessage[res.length - 1 - i].isoDate

                const formattedDate = moment(isoDate).utcOffset(8).format('YYYY-MM-DD HH:mm:ss');


                const sendMessage = `<a href="${link}"><b>${title}</b></a>\n\n${formattedDate} by ${via}\n\n${content}\n\n${url}\n\n#${tag}`

                const disablePreview = { disable_web_page_preview: true };
                // 发送消息到频道
                await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                  chat_id: channelID,
                  text: sendMessage,
                  parse_mode: 'HTML',
                  ...disablePreview
                })
                  .then(response => {
                    console.log('Message sent successfully:');
                  })
                  .catch(error => {
                    console.error('Error sending message:', error);
                  });
              }
            })
            .catch(error => {
              console.error('Error:', error);
            });
        }, i * 3000)

      }
    } catch (error) {
      console.error('错误:', error);
    }
    return 'ok';
  }
};