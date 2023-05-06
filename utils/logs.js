const Discord = require("discord.js");
module.exports = {
	async log(logsType, logs, client) {
		if (!client.config.logs) return;
		if (!client.config.logsChannelId) return;
		const channel = await client.channels
			.fetch(client.config.logsChannelId)
			.catch((e) => console.error("The channel to log events is not found!", e));
		if (!channel) return console.error("\n The channel to log events is not found!");

		let webhooks = await channel.fetchWebhooks();
		if (webhooks.size === 0) {
			await channel.createWebhook({ name: "Ticket Bot Logs" });
			webhooks = await channel.fetchWebhooks();
		}
		const webhook = webhooks.find((wh) => wh.token);

		if (logsType === "ticketCreate") {
			const embed = new Discord.EmbedBuilder()
				.setColor("3ba55c")
				.setAuthor({ name: logs.user.tag, iconURL: logs.user.avatarURL })
				.setDescription(`${logs.user.tag} (<@${logs.user.id}>) Created a ticket (<#${logs.ticketChannelId}>) with the reason: \`${logs.reason}\``);

			webhook
				.send({
					username: "Ticket has been Created",
					avatarURL: "https://cdn.discordapp.com/attachments/1089836522422947850/1104304618042818610/Untitled.png",
					embeds: [embed],
				})
				.catch((e) => console.log(e));
		}

		if (logsType === "ticketClaim") {
			const embed = new Discord.EmbedBuilder()
				.setColor("faa61a")
				.setAuthor({ name: logs.user.tag, iconURL: logs.user.avatarURL })
				.setDescription(
					`${logs.user.tag} (<@${logs.user.id}>) Claimed the ticket n°${logs.ticketId} (<#${logs.ticketChannelId}>) after ${client.msToHm(
						new Date(Date.now() - logs.ticketCreatedAt)
					)} of creation`
				);

			webhook
				.send({
					username: "Ticket hhas been Claimed",
					avatarURL: "https://cdn.discordapp.com/attachments/1089836522422947850/1104305453602701413/Untitled.jpg",
					embeds: [embed],
				})
				.catch((e) => console.log(e));
		}

		if (logsType === "ticketClose") {
			const embed = new Discord.EmbedBuilder()
				.setColor("#A020F0")
				.setAuthor({ name: logs.user.tag, iconURL: logs.user.avatarURL })
				.setDescription(
					`${logs.user.tag} (<@${logs.user.id}>) Closed the ticket n°${logs.ticketId} (<#${logs.ticketChannelId}>) with the reason: \`${
						logs.reason
					}\` after ${client.msToHm(new Date(Date.now() - logs.ticketCreatedAt))} of creation`
				);

			webhook
				.send({
					username: "Ticket has been Closed",
					avatarURL: "https://cdn.discordapp.com/attachments/1089836522422947850/1104305630015148172/Untitled.jpg",
					embeds: [embed],
				})
				.catch((e) => console.log(e));
		}

		if (logsType === "ticketDelete") {
			const embed = new Discord.EmbedBuilder()
				.setColor("#A020F0")
				.setAuthor({ name: logs.user.tag, iconURL: logs.user.avatarURL })
				.setDescription(
					`${logs.user.tag} (<@${logs.user.id}>) Deleted the ticket n°${logs.ticketId} after ${client.msToHm(
						new Date(Date.now() - logs.ticketCreatedAt)
					)} of creation\n\nTranscript: ${logs.transcriptURL}`
				);

			webhook
				.send({
					username: "Ticket Deleted",
					avatarURL: "https://cdn.discordapp.com/attachments/1089836522422947850/1104305787184099369/Untitled.png",
					embeds: [embed],
				})
				.catch((e) => console.log(e));
		}

		if (logsType === "userAdded") {
			const embed = new Discord.EmbedBuilder()
				.setColor("3ba55c")
				.setAuthor({ name: logs.user.tag, iconURL: logs.user.avatarURL })
				.setDescription(
					`${logs.user.tag} (<@${logs.user.id}>) Added <@${logs.added.id}> (${logs.added.id}) to the ticket n°${logs.ticketId} (<#${logs.ticketChannelId}>)`
				);

			webhook
				.send({
					username: "User has been Added",
					avatarURL: "https://cdn.discordapp.com/attachments/1089836522422947850/1104306045821669416/Untitled.png",
					embeds: [embed],
				})
				.catch((e) => console.log(e));
		}

		if (logsType === "userRemoved") {
			const embed = new Discord.EmbedBuilder()
				.setColor('#A020F0') //
				.setAuthor({ name: logs.user.tag, iconURL: logs.user.avatarURL })
				.setDescription(
					`${logs.user.tag} (<@${logs.user.id}>) Removed <@${logs.removed.id}> (${logs.removed.id}) from the ticket n°${logs.ticketId} (<#${logs.ticketChannelId}>)`
				);

			webhook
				.send({
					username: "User has been Removed",
					avatarURL: "https://cdn.discordapp.com/attachments/1089836522422947850/1104306045821669416/Untitled.png",
					embeds: [embed],
				})
				.catch((e) => console.log(e));
		}
	},
};


