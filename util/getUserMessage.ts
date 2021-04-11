import { IncomingMessage } from "telegraf/typings/telegram-types";

export const getUserMessage = (message: IncomingMessage): string => {
  const { text, entities } = message;
  if (!text || !entities) return '';

  const commandEntity = entities.find(
    entity => entity.type === 'bot_command',
  );

  return text.slice(commandEntity?.length || 0)
};