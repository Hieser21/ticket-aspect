const readline = require("readline");
const axios = require("axios");
const Discord = require("discord.js");
const WebSocketClient = require("websocket").client;
module.exports = {
	name: "ready",
	once: true,
	/**
	 * @param {Discord.Client} client
	 */
	async execute(client) {
		if (!client.config.guildId) {
			console.log(" Server ID is missing from config.json");
			process.exit(0);
		}

		await client.guilds.fetch(client.config.guildId);
		await client.guilds.cache.get(client.config.guildId).members.fetch();
		if (!client.guilds.cache.get(client.config.guildId).members.me.permissions.has("Administrator")) {
			console.log("\nAdmin perm missing... ");
			process.exit(0);
		}

		const embedMessageId = await client.db.get("temp.openTicketMessageId");
		await client.channels.fetch(client.config.openTicketChannelId).catch(() => {
			console.error("you forgot to tell me where to open ticket!");
			process.exit(0);
		});
		const openTicketChannel = await client.channels.cache.get(client.config.openTicketChannelId);
		if (!openTicketChannel) {
			console.error("The channel to open tickets is not found!");
			process.exit(0);
		}

		if (!openTicketChannel.isTextBased()) {
			console.error("the channel is not a channel, the channel to open ticket is not a channel!");
			process.exit(0);
		}

		let embed = client.embeds.openTicket;

		

		embed.color = parseInt(client.config.mainColor, 16);
		
		embed.footer.text = "ticket.pm" + client.embeds.ticketOpened.footer.text.replace("ticket.pm", "");
 		const row = new Discord.ActionRowBuilder().addComponents(
			new Discord.ButtonBuilder().setCustomId("openTicket").setLabel(client.locales.other.openTicketButtonMSG).setStyle(Discord.ButtonStyle.Primary)
		);

		try {
			const msg = await openTicketChannel?.messages?.fetch(embedMessageId).catch(() => {});
			if (msg && msg.id) {
				msg.edit({
					embeds: [embed],
					components: [row],
				});
			} else {
				client.channels.cache
					.get(client.config.openTicketChannelId)
					.send({
						embeds: [embed],
						components: [row],
					})
					.then((msg) => {
						client.db.set("temp.openTicketMessageId", msg.id);
					});
			}
		} catch (e) {
			console.error(e);
		}

		function setStatus() {
			if (client.config.status) {
				if (!client.config.status.enabled) return;

				let type = client.config.status.type;
				if (type === "PLAYING") type = 0;
				if (type === "STREAMING") type = 1;
				if (type === "LISTENING") type = 2;
				if (type === "WATCHING") type = 3;
				if (type === "COMPETING") type = 5;

				if (client.config.status.type && client.config.status.text) {
					// If the user just want to set the status but not the activity
					client.user.setPresence({
						activities: [{ name: client.config.status.text, type: type, url: client.config.status.url }],
						status: client.config.status.status,
					});
				}
				client.user.setStatus(client.config.status.status);
			}
		}

		setStatus();
		setInterval(setStatus, 9e5); // 15 minutes

		readline.cursorTo(process.stdout, 0);
		process.stdout.write(
			`  The bot is ready! Logged in as ${client.user.id}) `
		);

		

		let connected;

		function telemetry(connection) {
			connection.sendUTF(
				JSON.stringify({
					type: "telemetry",
					data: {
						stats: {
							guilds: client?.guilds?.cache?.size,
							users: client?.users?.cache?.size,
						},
						infos: {
							ticketbotVersion: require("../package.json").version,
							nodeVersion: process.version,
							os: require("os").platform(),
							osVersion1: require("os").release(),
							osVersion2: require("os").version(),
							uptime: process.uptime(),
							ram: {
								total: require("os").totalmem(),
								free: require("os").freemem(),
							},
							cpu: {
								model: require("os").cpus()[0].model,
								cores: require("os").cpus().length,
								arch: require("os").arch(),
							},
						},
						clientName: client?.user?.tag,
						clientId: client?.user?.id,
						guildId: client?.config?.guildId,
					},
				})
			);
		}

		async function connect() {
			if (connected) return;
			let ws = new WebSocketClient();

			ws.on("connectFailed", (e) => {
				connected = false;
				setTimeout(connect, Math.random() * 1e4);
				console.log(`❌  WebSocket Error: ${e.toString()}`);
			});

			ws.on("connect", (connection) => {
				connection.on("error", (e) => {
					connected = false;
					setTimeout(connect, Math.random() * 1e4);
					console.log(`❌  WebSocket Error: ${e.toString()}`);
				});

				connection.on("close", (e) => {
					connected = false;
					setTimeout(connect, Math.random() * 1e4);
					console.log(`❌  WebSocket Error: ${e.toString()}`);
				});

				connected = true;
				console.log("✅  Connected to WebSocket server.");
				telemetry(connection);

				setInterval(() => {
					telemetry(connection);
				}, 120_000);
			});

			ws.connect("wss://ws.ticket.pm/", "echo-protocol");
		}

		connect();
		require("../deploy-commands").deployCommands(client);
	},
};

