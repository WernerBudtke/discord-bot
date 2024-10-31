import { REST, Routes } from 'discord.js';
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import { pathToFileURL } from 'url';
dotenv.config();

// Grab all the command folders from the commands directory you created earlier
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

// Create an array of promises for importing command files
const commandPromises = [];

for (const folder of commandFolders) {
  // Grab all the command files from the commands directory
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const fileUrl = pathToFileURL(filePath).href;

    // Push the import promise to the array
    commandPromises.push(
      import(fileUrl)
        .then(command => {
          if ('data' in command && 'execute' in command) {
            return command.data.toJSON();
          } else {
            console.log(
              `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`,
            );
          }
        })
        .catch(error => {
          console.error(`Failed to import command at ${filePath}:`, error);
        }),
    );
  }
}

// Construct and prepare an instance of the REST module
if (!process.env.TOKEN) {
  throw new Error('TOKEN is not defined in the environment variables');
}
const rest = new REST().setToken(process.env.TOKEN);

(async () => {
  try {
    // Wait for all imports to complete
    const commands = (await Promise.all(commandPromises)).filter(Boolean);

    console.log(
      `Started refreshing ${commands.length} application (/) commands.`,
    );

    if (!process.env.CLIENT_ID || !process.env.GUILD_ID) {
      throw new Error(
        'CLIENT ID or GUILD ID is not defined in the environment variables',
      );
    }

    // Use the put method to fully refresh all commands in the guild with the current set
    const data = (await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID,
      ),
      { body: commands },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    )) as any[];

    console.log(
      `Successfully reloaded ${data.length} application (/) commands.`,
    );
  } catch (error) {
    // Catch and log any errors
    console.error(error);
  }
})();
