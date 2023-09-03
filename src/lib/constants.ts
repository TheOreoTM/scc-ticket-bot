import { join } from 'path';

export const rootDir = join(__dirname, '..', '..');
export const srcDir = join(rootDir, 'src');

export const BotOwners = ['600707283097485322'];
export const MaxTicketAmount = 1;

export const NexusColors = {
	Success: 0x46b485,
	Fail: 0xf05050,
	Warn: 0xfee65c,
	Info: 0x297bd1,
	Loading: 0x23272a,
	Default: 0x2b2d31
};

export const NexusEmojis = {
	Success: '<:success:1146683498766291024>',
	Fail: '<:fail:1146683470114996274>',
	Reply: '<:reply:1146683155370221639>',
	Off: '<:off:1146683633483141140>',
	On: '<:on:1146683600641736744>'
};

export const TicketConfig = {
	HandlerRole: '1016966909121527809',
	TicketCategory: '910957316046729256',
	TranscriptChannel: '912062908207353887'
};

export enum TicketState {
	Open = 'OPEN',
	Closed = 'CLOSED'
}

export enum TicketType {
	UserReport = 'USER_REPORT',
	StaffReport = 'STAFF_REPORT',
	RoleRequest = 'ROLE_REQUEST',
	Appeal = 'APPEAL',
	Other = 'OTHER'
}
