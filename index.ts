'use strict'

import Telegraf from 'telegraf'

import SettingsRepository from './util/settingsRepository'
import GroupRepository from './util/groupRepository'
import StatisticsRepository from './util/statisticsRepository'
import MentionBuilder from './util/mentionBuilder'
import FirebaseSettings from './domain/firebaseSettings'

import OnboardingController from './controllers/onboardingController'
import EveryoneController from './controllers/everyoneController';
import UserListController from "./controllers/userListController";

const config = process.env.NODE_ENV !== 'prod' && require('./config.json');
const settings = new SettingsRepository(config);

const mentionBuilder = new MentionBuilder(settings);
const firebaseSettings = new FirebaseSettings(
    settings.firebaseProjectName,
    settings.firebaseDatabaseSecret,
);
const groupRepository = new GroupRepository(firebaseSettings);
const statisticsRepository = new StatisticsRepository(firebaseSettings);

const bot = new Telegraf(settings.telegramApiKey, {
    username: settings.botUsername,
});

const onboardingController = new OnboardingController(
    groupRepository,
    settings
);

const everyoneController = new EveryoneController(
    groupRepository,
    mentionBuilder,
    statisticsRepository,
);

const userListController = new UserListController(
  groupRepository
);

//TODO: create event fabric

bot.command('everyone', everyoneController.everyone);
bot.command('in', everyoneController.updateUser({
    msg: 'Thanks for opting in',
    paramName: 'optIn',
    paramValue: true
}));
bot.command('out', everyoneController.updateUser({
    msg: 'You\'ve been opted out',
    paramName: 'optIn',
    paramValue: false
}));
bot.command('start', onboardingController.start);
bot.command('clean', onboardingController.removeInactiveMembers);

// new list events
bot.command('review', userListController.review);
bot.command('check', userListController.getInfo);
bot.command('check_all', userListController.checkAvailableUsers);
bot.command('end_review', everyoneController.updateUser({
    msg: 'dobby is free!',
    paramName: 'status',
    paramValue: 'active'
}));
bot.on('left_chat_member', onboardingController.userLeaveGroup);

bot.startPolling();

console.log('EveryoneBot has started!');