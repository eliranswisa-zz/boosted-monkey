'use strict';

const config = require('./config/config');
const Telegraf = require('telegraf');
const routes = require('./app/routes/commands');
const app = new Telegraf(config.telegramToken);
const startTime = new Date().getTime() / 1000;

// Set routes and start polling.
routes(app, startTime);
app.startPolling();