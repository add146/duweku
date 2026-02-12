import { Bot, Context, SessionFlavor } from "grammy";
import { Env } from "./index";

export type MyContext = Context;

export const createBot = (env: Env) => {
    const bot = new Bot<MyContext>(env.TELEGRAM_BOT_TOKEN);
    return bot;
};
