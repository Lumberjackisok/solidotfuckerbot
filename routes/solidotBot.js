const router = require('express').Router();
const { catchErr } = require('../handler/errorHandler');

const { updateChannelMessage } = require('../controllers/solidotBotController');

router.get("/botchanneluptdate", catchErr(updateChannelMessage));

module.exports = router;