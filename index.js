
const fs = require("fs-extra");
const path = require("node:path");
const { Client, Collection, GatewayIntentBits } = require("discord.js");
// eslint-disable-next-line node/no-missing-require, node/no-unpublished-require
const { token } = require("./config/token.json");
const { QuickDB, MySQLDriver } = require("quick.db");
const jsonc = require("jsonc");

process.on("unhandledRejection", (reason, promise, a) => {
	console.log(reason, promise, a);
});

process.stdout.write(`
Connecting to Discord...
`);

const config = jsonc.parse(fs.readFileSync(path.join(__dirname, "config/config.jsonc"), "utf8"));
//status thingi
const client = new Client({
	intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers],
	presence: {
		status: config.status?.status ?? "online"
	}
});

// All variables stored in the client object
client.discord = require("discord.js");
client.config = jsonc.parse(fs.readFileSync(path.join(__dirname, "config/config.jsonc"), "utf8"));

let db = null;

if (client.config.mysql?.enabled) {
	(async () => {
		try {
			require.resolve("mysql2");
		} catch (e) {
			console.error(`mysql2 is not installed! Please run npm i mysql2 in the console!`);
			throw e.code;
		}

		const mysql = new MySQLDriver({
			host: client.config.mysql?.host,
			user: client.config.mysql?.user,
			password: client.config.mysql?.password,
			database: client.config.mysql?.database,
			charset: "utf8mb4"
		});

		await mysql.connect();

		db = new QuickDB({
			driver: mysql,
			table: client.config.mysql?.table ?? "json"
		});
		client.db = db;
	})();
} else {
	db = new QuickDB();
	client.db = db;
}

client.locales = require(`./locales/${client.config.lang}.json`);
client.embeds = client.locales.embeds;
client.log = require("./utils/logs.js").log;
client.msToHm = function dhm(ms) {
	const days = Math.floor(ms / (24 * 60 * 60 * 1000));
	const daysms = ms % (24 * 60 * 60 * 1000);
	const hours = Math.floor(daysms / (60 * 60 * 1000));
	const hoursms = ms % (60 * 60 * 1000);
	const minutes = Math.floor(hoursms / (60 * 1000));
	const minutesms = ms % (60 * 1000);
	const sec = Math.floor(minutesms / 1000);

	if (days > 0) return `${days}d ${hours}h ${minutes}m ${sec}s`;
	if (hours > 0) return `${hours}h ${minutes}m ${sec}s`;
	if (minutes > 0) return `${minutes}m ${sec}s`;
	if (sec > 0) return `${sec}s`;
	return "0s";
};

// Command handler
client.commands = new Collection();
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	client.commands.set(command.data.name, command);
}


client.on("interactionCreate", async (interaction) => {
	if (!interaction.isChatInputCommand()) return;
	const command = client.commands.get(interaction.commandName);
	if (!command) return;

	try {
		await command.execute(interaction, client);
	} catch (error) {
		console.error(error);
		await interaction.reply({
			content: "There was an error while executing this command!",
			ephemeral: true
		});
	}
});


const eventsPath = path.join(__dirname, "events");
const eventFiles = fs.readdirSync(eventsPath).filter((file) => file.endsWith(".js"));

for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const event = require(filePath);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	} else {
		client.on(event.name, (...args) => event.execute(...args, client));
	}
}

client.login(token);

