const { SlashCommandBuilder } = require("discord.js");
const Discord = require("discord.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("rename")
		.setDescription("Rename the ticket")
		.addStringOption((option) => option.setName("name").setDescription("The new name of the ticket").setRequired(true)),
	/**
	 *
	 * @param {Discord.Interaction} interaction
	 * @param {Discord.Client} client
	 * @returns
	 */
	async execute(interaction, client) {
		const ticket = await client.db.get(`tickets_${interaction.channel.id}`);
		if (!ticket) return interaction.reply({ content: "Ticket not found", ephemeral: true }).catch((e) => console.log(e));
		if (!interaction.member.roles.cache.some((r) => client.config.rolesWhoHaveAccessToTheTickets.includes(r.id)))
			return interaction
				.reply({
					content: client.locales.ticketOnlyRenamableByStaff,
					ephemeral: true,
				})
				.catch((e) => console.log(e));

		interaction.channel.setName(interaction.options.getString("name")).catch((e) => console.log(e));
		interaction
			.reply({ content: client.locales.ticketRenamed.replace("NEWNAME", interaction.channel.toString()), ephemeral: false })
			.catch((e) => console.log(e));
	},
};

