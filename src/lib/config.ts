process.env.NODE_ENV ??= 'development';

import { Time } from '@sapphire/duration';
import { BucketScope, type ClientLoggerOptions, type CooldownOptions, LogLevel } from '@sapphire/framework';
import {
	type ClientOptions,
	GatewayIntentBits,
	type MessageMentionOptions,
	Partials,
	type PresenceData,
	type SweeperOptions,
	ActivityType
} from 'discord.js';
import { BotOwners } from './constants';
import { ServerOptions } from '@sapphire/plugin-api';

export const config: Config = {
	api: {
		origin: '*',
		prefix: 'v1',
		listenOptions: {
			port: 4040,
			host: 'localhost'
		}
	},
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildModeration,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.DirectMessages,
		GatewayIntentBits.DirectMessageReactions,
		GatewayIntentBits.DirectMessageTyping
	],
	partials: [Partials.Channel, Partials.Message, Partials.GuildMember, Partials.User],
	cooldown_options: {
		delay: Time.Second * 10,
		filteredUsers: BotOwners,
		scope: BucketScope.User
	},
	mentions: {
		parse: ['users'],
		repliedUser: false
	},
	logger: {
		level: LogLevel.Info
	},
	sweepers: {
		bans: {
			interval: 300,
			filter: () => null
		},
		applicationCommands: {
			interval: 300,
			filter: () => null
		},
		emojis: {
			interval: 30,
			filter: () => null
		},
		invites: {
			interval: 60,
			filter: () => null
		},
		messages: {
			interval: 120,
			lifetime: 360
		},
		reactions: {
			interval: 5,
			filter: () => null
		},
		voiceStates: {
			interval: 30,
			filter: () => null
		},
		threads: {
			interval: 3600,
			lifetime: 14400
		}
	},
	presence: {
		status: 'online',
		activities: [
			{
				name: 'for tickets',
				type: ActivityType.Watching
			}
		]
	}
};

export const ClientConfig: ClientOptions = {
	api: config.api,
	intents: config.intents,
	partials: config.partials,
	allowedMentions: config.mentions,
	caseInsensitiveCommands: true,
	caseInsensitivePrefixes: true,
	defaultCooldown: config.cooldown_options,
	logger: config.logger,
	loadMessageCommandListeners: false,
	typing: false,
	shards: 'auto',
	disableMentionPrefix: false,
	preventFailedToFetchLogForGuilds: true,
	sweepers: config.sweepers
};

interface Config {
	intents: GatewayIntentBits[];
	cooldown_options: CooldownOptions;
	mentions: MessageMentionOptions;
	partials: Partials[];
	logger: ClientLoggerOptions;
	sweepers: SweeperOptions;
	presence: PresenceData;
	api: ServerOptions;
}
