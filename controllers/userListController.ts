import { TelegrafContext } from 'telegraf/typings/context'
import GroupRepository from "../util/groupRepository";
import { getUserMessage } from '../util/getUserMessage';
import User from '../domain/user';

interface GroupData {
  users: Array<User>,
  groupId: number
}

export default class UserListController {
  groupRepository: GroupRepository;

  constructor(
    groupRepository: GroupRepository
  ) {
    this.groupRepository = groupRepository;
  }

  _getGroups = async (ctx: TelegrafContext): Promise<GroupData> => {
    if (!ctx.chat) throw new SyntaxError('No `chat` field found on context');

    const groupId = ctx.chat.id;
    const group = await this.groupRepository.getGroup(groupId);

    if (!group.users.length) {
      ctx.reply('No users opted in!');
      return { users: [], groupId };
    }
    return { users: group.users, groupId };
  };

  review = async (ctx: TelegrafContext) => {
    try {
      if (!ctx.message) throw new SyntaxError('No `message` field found on context');

      const { users, groupId } = await this._getGroups(ctx);
      if(!users.length) return;

      const postedText = getUserMessage(ctx.message);

      if(!postedText) {
        ctx.reply('Need merge request link!');
        return;
      }

      const { id: postedUserId } = ctx.update.message?.from || {};

      const availableList = users.filter(({ id, status }) => status === 'active' && postedUserId !== id);

      if(!availableList.length) {
        ctx.reply('Everybody busy');
        return;
      }

      const selectedId = Math.floor(Math.random() * availableList.length) + 1;

      const selectedUser = availableList[selectedId - 1];

      selectedUser.review = postedText;
      selectedUser.setReviewDateTime = new Date().toJSON().slice(0,10).replace(/-/g,'/');

      await this.groupRepository.userUpdate(selectedUser, groupId, 'status', 'disable');

      ctx.reply(`${selectedUser.mention}, you got merge request: ${postedText}`, {
        parse_mode: 'Markdown'
      });
    } catch (e) {
      console.error(e);
    }
  };

  checkAvailableUsers = async (ctx: TelegrafContext) => {
    try {
      const { users } = await this._getGroups(ctx);
      if(!users.length) return;

      const list = users.filter(item => item.status !== 'active');
      if(!list.length) {
        ctx.reply('Everyone available');
        return;
      }
      list.forEach(user => {
        if(user.reviewLink) {
          ctx.reply(`${user.mention}: ${user.reviewLink}`, {
            parse_mode: 'Markdown'
          })
        }
      });

    } catch (e) {
      console.error(e);
    }
  };

  getInfo = async (ctx: TelegrafContext) => {
    try {
      if (!ctx.message) throw new SyntaxError('No `message` field found on context');

      const { users } = await this._getGroups(ctx);

      if(!users.length) return;

      const { id: postedUserId } = ctx.message.from || {};

      const userInfo = users.find(({ id }) => postedUserId === id);

      let msg = `${userInfo?.mention}, haven't any MR to review`;
      if(userInfo?.status === 'disable') {
        msg = `${userInfo?.mention}, you have active MR to review: ${userInfo.reviewLink}`;
      }

      ctx.reply(msg, {
        parse_mode: 'Markdown'
      });
    } catch (e) {
      console.error(e);
    }
  }
};