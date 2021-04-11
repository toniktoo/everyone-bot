import { TelegrafContext } from 'telegraf/typings/context'
import { IncomingMessage } from 'telegraf/typings/telegram-types'

import User from '../domain/user'
import GroupRepository from '../util/groupRepository'
import MentionBuilder from '../util/mentionBuilder'
import StatisticsRepository from '../util/statisticsRepository'
import { getUserMessage } from '../util/getUserMessage';

interface EventConfig {
    msg: string;
    paramName: string;
    paramValue: any
}

export default class EveryoneController {
    groupRepository: GroupRepository;
    mentionBuilder: MentionBuilder;
    statisticsRepository: StatisticsRepository;

    /**
     * Initializes a new instance of EveryoneController
     */
    constructor(
        groupRepository: GroupRepository,
        mentionBuilder: MentionBuilder,
        statisticsRepository: StatisticsRepository
    ) {
        this.groupRepository = groupRepository;
        this.mentionBuilder = mentionBuilder;
        this.statisticsRepository = statisticsRepository;
    }

    everyone = async (ctx: TelegrafContext) => {
        try {
            if (!ctx.chat) throw new SyntaxError('No `chat` field found on context')
            if (!ctx.message) throw new SyntaxError('No `message` field found on context')

            const groupId = ctx.chat.id;
            const group = await this.groupRepository.getGroup(groupId);

            if (!group.users.length) {
                ctx.reply('No users opted in!');
                return
            }

            const mentions = this.mentionBuilder.build(group.users);
            const userMessage = getUserMessage(ctx.message);

            mentions.forEach((mention, idx) => {
                if (idx === mentions.length - 1) {
                    ctx.reply(`${mention} ${userMessage}`, {
                        parse_mode: 'MarkdownV2'
                    });
                    return
                }

                ctx.reply(mention, {
                    parse_mode: 'MarkdownV2'
                })
            });

            this.statisticsRepository.incrementMentions(group.users.length)
        } catch(error) {
            console.log(error)
        }
    };

    updateUser = (config: EventConfig) => async (ctx: TelegrafContext) => {
        try {
            if (!ctx.from) throw new Error('No `from` field found on context');
            if (!ctx.chat) throw new Error('No `chat` field found on context');

            const user = new User(ctx.from.id, ctx.from.username || ctx.from.first_name);
            const groupId = ctx.chat.id;

            await this.groupRepository.userUpdate(user, groupId, config.paramName, config.paramValue);
            ctx.reply(`${config.msg} ${user.username}`);

        } catch(error) {
            if (error instanceof SyntaxError) {
                ctx.reply(`Sorry, you don't seem to have a username or a first name :(`);
                return;
            }

            console.log(error)
        }
    };
}
