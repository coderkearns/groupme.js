const API = require('./api');

class Bot {
    /** Creates a new bot with the given name and group ID, then a new bot object using the returned bot ID.
     * @param {string} name - The name of the bot (max 100 chars)
     * @param {number} groupId - The ID of the group the bot will post to
     * @param {Object} [options={}] - Optional bot settings: avatar_url, callback_url, dm_notification, active
     * @returns {Promise<Bot>} The newly created Bot instance
     */
    static async create(name, groupId, options = {}) {
        const response = await API.createBot(name, groupId, options);
        const id = response.bot.bot_id;
        return new Bot(id);
    }

    constructor(botId) {
        if (!botId) throw new Error('Bot ID is required');
        this.botId = botId;
    }

    /**
     * Sends a message to the group associated with this Bot.
     * @param {string} text - The message text.
     * @param {Array<API.Attachment>} [attachments=[]] - Optional array of attachments.
     */
    async sendMessage(text, attachments = []) {
        await API.postBot(this.botId, text, attachments);
    }

    /**
     * Helper to quickly send an image from a path on the local filesystem.
     * @param {string} text - Caption.
     * @param {string} imagePath - Path to local image file.
     */
    async sendImage(text, imagePath) {
        this.sendMessage(text, [await API.ImageAttachment.fromFile(imagePath)]);
    }
}

module.exports = Bot;