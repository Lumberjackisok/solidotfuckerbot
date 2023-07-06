const { forwardLatestRSS } = require('../rssForwarder.js');

module.exports.updateChannelMessage = async (req, res, next) => {
  const datas = await forwardLatestRSS();
  return res.json({
    status: 200,
    message: "update channel message successful.",
    messageDatas: datas
  })
}