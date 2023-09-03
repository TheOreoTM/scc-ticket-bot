import {
	container,
	type ChatInputCommandSuccessPayload,
	type Command,
	type ContextMenuCommandSuccessPayload,
	type MessageCommandSuccessPayload
} from '@sapphire/framework';
import { cyan } from 'colorette';
import type { APIUser, Guild, GuildMember, TextBasedChannel, User } from 'discord.js';
import * as discordTranscripts from 'discord-html-transcripts';
import { TicketConfig, type TicketState } from '#constants';

export function isStaff(member: GuildMember) {
	return member.roles.cache.has(TicketConfig.HandlerRole);
}

export async function setTicketState(ticketId: number, state: TicketState) {
	container.db.ticket.update({
		where: {
			id: ticketId
		},
		data: {
			state
		}
	});
}

export async function generateTranscript(channel: TextBasedChannel) {
	const transcript = await discordTranscripts.createTranscript(channel, {
		filename: 'transcript.html',
		footerText: `Exported {number} message{s}`,
		poweredBy: false,
		limit: -1,
		returnType: discordTranscripts.ExportReturnType.Attachment,
		favicon: 'guild'
	});

	return transcript;
}

export const wait = (ms: number) => new Promise((res) => setTimeout(res, ms));

export function logSuccessCommand(payload: ContextMenuCommandSuccessPayload | ChatInputCommandSuccessPayload | MessageCommandSuccessPayload): void {
	let successLoggerData: ReturnType<typeof getSuccessLoggerData>;

	if ('interaction' in payload) {
		successLoggerData = getSuccessLoggerData(payload.interaction.guild, payload.interaction.user, payload.command);
	} else {
		successLoggerData = getSuccessLoggerData(payload.message.guild, payload.message.author, payload.command);
	}

	container.logger.debug(`${successLoggerData.shard} - ${successLoggerData.commandName} ${successLoggerData.author} ${successLoggerData.sentAt}`);
}

export function getSuccessLoggerData(guild: Guild | null, user: User, command: Command) {
	const shard = getShardInfo(guild?.shardId ?? 0);
	const commandName = getCommandInfo(command);
	const author = getAuthorInfo(user);
	const sentAt = getGuildInfo(guild);

	return { shard, commandName, author, sentAt };
}

function getShardInfo(id: number) {
	return `[${cyan(id.toString())}]`;
}

function getCommandInfo(command: Command) {
	return cyan(command.name);
}

function getAuthorInfo(author: User | APIUser) {
	return `${author.username}[${cyan(author.id)}]`;
}

function getGuildInfo(guild: Guild | null) {
	if (guild === null) return 'Direct Messages';
	return `${guild.name}[${cyan(guild.id)}]`;
}
