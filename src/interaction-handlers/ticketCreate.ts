import { MaxTicketAmount, NexusColors, NexusEmojis, TicketConfig, TicketState, TicketType } from '#constants';
import { ApplyOptions } from '@sapphire/decorators';
import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import {
	StringSelectMenuBuilder,
	type ButtonInteraction,
	ActionRowBuilder,
	ComponentType,
	CategoryChannel,
	ChannelType,
	EmbedBuilder,
	ButtonBuilder,
	ButtonStyle,
	StringSelectMenuInteraction,
	channelMention,
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle
} from 'discord.js';

@ApplyOptions<InteractionHandler.Options>({
	interactionHandlerType: InteractionHandlerTypes.Button
})
export class ButtonHandler extends InteractionHandler {
	public async run(interaction: ButtonInteraction) {
		const ticketAmount = await this.container.db.ticket.count({
			where: {
				ownerId: interaction.user.id
			}
		});

		const blacklisted = await this.container.db.blacklist.findFirst({
			where: {
				userId: interaction.user.id
			}
		});

		if (blacklisted) {
			await interaction.reply({
				ephemeral: true,
				content: `${NexusEmojis.Fail} You are blacklisted from creating tickets.`
			});
			return;
		}

		if (ticketAmount >= MaxTicketAmount) {
			await interaction.reply({
				ephemeral: true,
				content: `${NexusEmojis.Fail} You already have the max number of tickets open (\`${MaxTicketAmount}\`)`
			});
			return;
		}

		const guild = interaction.guild!;
		const ticketTypeSelectMenu = new StringSelectMenuBuilder()
			.setCustomId('ticketTypeSelect')
			.setMaxValues(1)
			.setPlaceholder('Choose your ticket type')
			.addOptions(
				{
					label: 'Level Transfer',
					value: TicketType.LevelTransfer,
					description: 'This is for requesting to transfer your levels from your old account/bot'
				},
				{
					label: 'User Report',
					value: TicketType.UserReport,
					description: 'This is for reporting users who have broken rules.'
				},
				{
					label: 'Staff Report',
					value: TicketType.StaffReport,
					description: 'This is for reporting staff who have done something wrong.'
				},
				{
					label: 'Appeal',
					value: TicketType.Appeal,
					description: 'This is for appealing a punishment that you were given that feel was unfair.'
				},
				{
					label: 'Role Request',
					value: TicketType.RoleRequest,
					description: 'This is for requesting a role that you want in the server such as skittle-veteran role.'
				},
				{
					label: 'Other',
					value: TicketType.Other,
					description: 'This is for sending through any other request you may have such as questions or help needed.'
				}
			);

		const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(ticketTypeSelectMenu);

		const response = await interaction.reply({
			fetchReply: true,
			ephemeral: true,
			content: `## Choose the type of ticket you want to create`,
			components: [row]
		});

		let ticketType: TicketType;

		const collectorFilter = (i: StringSelectMenuInteraction) => {
			return i.user.id === interaction.user.id;
		};

		const collector = response.createMessageComponentCollector({
			filter: collectorFilter,
			componentType: ComponentType.StringSelect,
			time: 60_000,
			max: 1
		});

		collector.on('collect', async (interaction: StringSelectMenuInteraction) => {
			ticketType = interaction.values[0] as TicketType;

			let ticketTag: 'UR' | 'SR' | 'AP' | 'RR' | 'OT' | 'LT';
			let followUpMessage = '';

			switch (ticketType) {
				case TicketType.LevelTransfer:
					ticketTag = 'LT';
					followUpMessage = `You have submitted a level request ticket, please follow the instructions below.\n\n**Level:** <the level of your old/arcane account>`;
					break;
				case TicketType.UserReport:
					ticketTag = 'UR';
					followUpMessage = `You have submitted a user report ticket, please follow the instructions below.\n\n**UserID:** <the id of the user (the number)>\n**Reason:** <why you are reporting this user>`;
					break;
				case TicketType.StaffReport:
					ticketTag = 'SR';
					followUpMessage = `You have submitted a staff report ticket, please follow the instructions below.\n\n**Staff:** <the staff member>\n**Reason:** <why you are reporting this staff>`;

					break;
				case TicketType.Appeal:
					ticketTag = 'AP';

					break;
				case TicketType.RoleRequest:
					ticketTag = 'RR';
					followUpMessage = `You have submitted a role request ticket, please follow the instructions below.\n\n**Role Name:** <the name of the role you want>\n**Reason:** <why you are requesting this role>`;

					break;
				case TicketType.Other:
					ticketTag = 'OT';
					break;
				default:
					ticketTag = 'OT';
					break;
			}

			if (ticketType === TicketType.LevelTransfer) {
				const oldLevelInput = new TextInputBuilder()
					.setCustomId('oldlevel')
					.setLabel('Old level')
					.setRequired(true)
					.setPlaceholder('The level on arcane./old account.')
					.setMinLength(1)
					.setMaxLength(3)
					.setStyle(TextInputStyle.Short);

				const modal = new ModalBuilder()
					.setCustomId('leveltransfer')
					.setTitle('Level Transfer')
					.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(oldLevelInput));

				await interaction.showModal(modal);
				return;
			}

			interaction.deferUpdate();

			const ticket = await this.container.db.ticket.create({
				data: {
					ownerId: interaction.user.id,
					type: ticketType,
					state: TicketState.Open
				}
			});

			const channelName = `ticket-${ticketTag}${ticket.id.toString().padStart(4, '0')}`;

			const category = (await guild.channels.fetch(TicketConfig.TicketCategory)) as CategoryChannel;
			console.log(category);
			console.log(TicketConfig.HandlerRole);
			const ticketChannel = await guild.channels
				.create({
					name: channelName,
					parent: category,
					reason: `Ticket created by ${interaction.user.username}`,
					type: ChannelType.GuildText,
					permissionOverwrites: [
						{
							id: guild.id,
							deny: ['ViewChannel']
						},
						{
							id: TicketConfig.HandlerRole,
							allow: ['SendMessages', 'ViewChannel', 'ManageMessages', 'AttachFiles', 'ReadMessageHistory']
						},
						{
							id: interaction.user.id,
							allow: ['SendMessages', 'ViewChannel', 'AttachFiles', 'ReadMessageHistory']
						},
						{
							id: '1272585230955577417', // Muted role
							allow: [
								'SendMessages',
								'ViewChannel',
								'EmbedLinks',
								'ManageChannels',
								'ManageMessages',
								'ReadMessageHistory',
								'AttachFiles'
							]
						}
					]
				})
				.catch(async (err) => {
					await this.container.db.ticket.delete({
						where: {
							id: ticket.id
						}
					});
					console.log(err);
					throw new Error(`Failed to create channel`);
				});

			const ticketCloseButton = new ButtonBuilder()
				.setStyle(ButtonStyle.Secondary)
				.setLabel('Close')
				.setEmoji('🔒')
				.setCustomId(`ticketClose-${ticket.id}`);

			const ticketBlockButton = new ButtonBuilder()
				.setStyle(ButtonStyle.Secondary)
				.setLabel('Block user')
				.setEmoji('🛑')
				.setCustomId(`ticketBlock-${ticket.id}`);

			const greetEmbed = new EmbedBuilder()
				.setColor(NexusColors.Default)
				.setDescription(
					'Support will be with you shortly. \n**Please state what you need help with even if a staff member isnt here**.\n To close the ticket click the button with 🔒.'
				);

			const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(ticketBlockButton);
			const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(ticketCloseButton);

			interaction.followUp({
				ephemeral: true,
				content: `Your ticket has been created, ${channelMention(ticketChannel.id)}`
			});
			await ticketChannel.send({ embeds: [greetEmbed], content: `${interaction.user} Welcome,`, components: [row1, row2] }).catch(async () => {
				await this.container.db.ticket.delete({
					where: {
						id: ticket.id
					}
				});
			});
			await ticketChannel.send({
				content: followUpMessage
			});
		});
	}

	public override parse(interaction: ButtonInteraction) {
		if (interaction.customId !== 'ticketCreate') return this.none();

		return this.some();
	}
}
