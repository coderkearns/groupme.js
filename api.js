const fs = require('fs/promises');
const path = require('path');

class ApiError extends Error {
    constructor(statusCode, message, responseJSON) {
        super(message);
        this.statusCode = statusCode;
        this.responseJSON = responseJSON;
        Error.captureStackTrace(this, this.constructor);
    }
}


/**
 * GroupMe Bot API Wrapper
 * * To get your API access token:
 * 1. Log in at https://dev.groupme.com/
 * 2. Go to the Bots page: https://dev.groupme.com/bots
 * 3. Your access token is listed at the top of the page.
 * 
 * Set your access token using the `GM_TOKEN` environment variable before running your bot:
 * ```sh
 * export GM_TOKEN=your_access_token_here
 * ```
 * 
 * or during the program with
 * ```js
 * process.env.GM_TOKEN = "your_access_token_here";
 * ```
 * 
 * or overwrite the `getAccessToken` method in the API class to return your token directly.
 * ```js
 * API.getAccessToken = () => "your_access_token_here";
 * ```
 */
class API {
    static Error = ApiError;

    static BASE_URL = 'https://api.groupme.com/v3';

    /** The GroupMe access token is defined by the `GM_TOKEN` environment variable */
    static getAccessToken() {
        if (!process.env.GM_TOKEN) {
            throw new ApiError(401, 'Access token is required. Set it via the GM_TOKEN environment variable.', null);
        }
        return process.env.GM_TOKEN;
    }

    /** * Send a request to the API
     * @param {string} method - HTTP method
     * @param {string} path - Endpoint path (e.g., '/groups')
     * @param {Object} [body=null] - Request body
     * @param {Object} [params={}] - Query parameters
     * @return {Promise<Object>} - Parsed JSON response or null for empty responses
     */
    static async request(method, path, body = null, params = {}) {
        const query = new URLSearchParams({ token: this.getAccessToken(), ...params }).toString();
        const url = `${this.BASE_URL}${path}?${query}`;

        const options = {
            method: method,
            headers: { 'Content-Type': 'application/json' }
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(url, options);

        // Handle empty responses (like from /bots/post)
        if (response.status === 202 || response.status === 204) {
            return null;
        }

        const text = await response.text();
        if (!text) return null;

        let responseJSON;
        try {
            responseJSON = JSON.parse(text);
        } catch (error) {
            throw new ApiError(response.status, `Invalid JSON response: ${error.message}`, null);
        }

        if (responseJSON && responseJSON.meta && responseJSON.meta.code >= 400) {
            throw new ApiError(response.status, `API Error: ${responseJSON.meta.errors.join(', ')}`, responseJSON);
        }

        return responseJSON.response !== undefined ? responseJSON.response : responseJSON;
    }

    // ==========================================
    // USERS
    // ==========================================
    static getMe() { return this.request('GET', '/users/me'); }
    static updateMe(data) { return this.request('POST', '/users/update', data); }

    // ==========================================
    // GROUPS
    // ==========================================
    static getGroups(params = { page: 1, per_page: 10, omit: 'memberships' }) { return this.request('GET', '/groups', null, params); }
    static getFormerGroups() { return this.request('GET', '/groups/former'); }
    static getGroup(id) { return this.request('GET', `/groups/${id}`); }
    static createGroup(data) { return this.request('POST', '/groups', data); }
    static updateGroup(id, data) { return this.request('POST', `/groups/${id}/update`, data); }
    static destroyGroup(id) { return this.request('POST', `/groups/${id}/destroy`); }
    static joinGroup(id, share_token) { return this.request('POST', `/groups/${id}/join/${share_token}`); }
    static rejoinGroup(id) { return this.request('POST', '/groups/join', { group_id: id }); }

    // ==========================================
    // MEMBERS
    // ==========================================
    static addMembers(groupId, members) { return this.request('POST', `/groups/${groupId}/members/add`, { members }); }
    static removeMember(groupId, membershipId) { return this.request('POST', `/groups/${groupId}/members/${membershipId}/remove`); }
    static updateMember(groupId, nickname) { return this.request('POST', `/groups/${groupId}/memberships/update`, { membership: { nickname } }); }

    // ==========================================
    // MESSAGES
    // ==========================================
    static getMessages(groupId, params = { limit: 20 }) { return this.request('GET', `/groups/${groupId}/messages`, null, params); }
    static createMessage(groupId, message) { return this.request('POST', `/groups/${groupId}/messages`, { message }); }

    // ==========================================
    // DIRECT MESSAGES
    // ==========================================
    static getDirectMessages(otherUserId, params = {}) { return this.request('GET', '/direct_messages', null, { other_user_id: otherUserId, ...params }); }
    static createDirectMessage(message) { return this.request('POST', '/direct_messages', { direct_message: message }); }

    // ==========================================
    // LIKES
    // ==========================================
    static likeMessage(groupId, messageId) { return this.request('POST', `/messages/${groupId}/${messageId}/like`); }
    static unlikeMessage(groupId, messageId) { return this.request('POST', `/messages/${groupId}/${messageId}/unlike`); }

    // ==========================================
    // BOTS
    // ==========================================
    static getBots() { return this.request('GET', '/bots'); }
    static createBot(name, group_id) { return this.request('POST', '/bots', { bot: { name, group_id } }); }
    static postBot(bot_id, text, attachments = []) { return this.request('POST', '/bots/post', { bot_id, text, attachments }); }
    static destroyBot(botId) { return this.request('POST', '/bots/destroy', { bot_id: botId }); }

    // ==========================================
    // BLOCKS
    // ==========================================
    static getBlocks(params = {}) { return this.request('GET', '/blocks', null, params); }
    static createBlock(userId) { return this.request('POST', '/blocks', { user: userId }); }
    static destroyBlock(userId) { return this.request('DELETE', '/blocks', null, { user: userId }); }

    // ==========================================
    // PICTURES
    // ==========================================
    static uploadPicture(fileBuffer, contentType) {
        return fetch('https://image.groupme.com/pictures', {
            method: 'POST',
            headers: {
                'X-Access-Token': this.getAccessToken(),
                'Content-Type': contentType,
            },
            body: fileBuffer
        }).then(response => {
            if (!response.ok) throw new ApiError(response.status, `Image Service Error: ${response.statusText}`, null);
            return response.json();
        }).then(data => data.payload.url);
    }
}
module.exports = API;

class Attachment {
    constructor(type) {
        this.type = type;
    }
};
module.exports.Attachment = Attachment;

class LocationAttachment extends Attachment {
    constructor(lat, lng, name) {
        super('location');
        this.lat = String(lat);
        this.lng = String(lng);
        this.name = name;
    }
};
module.exports.LocationAttachment = LocationAttachment;

class ImageAttachment extends Attachment {
    constructor(url) {
        super('image');
        this.url = url;
    }

    /**
     * Uploads a local file to GroupMe's Image Service.
     * @param {string} filePath - Path to local image.
     * @param {string|null} fileType - Optional MIME type of the file (e.g., 'image/png'). If not provided, it will be inferred from the file extension.
     * @returns {Promise<Bot.ImageAttachment>}
     */
    static async fromFile(filePath, fileType = null) {
        const fileBuffer = await fs.readFile(filePath);
        if (!fileType) {
            const ext = path.extname(filePath).toLowerCase();
            const mimeTypes = {
                '.png': 'image/png',
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.gif': 'image/gif'
            };
            fileType = mimeTypes[ext] || 'application/octet-stream';
        }

        const imageUrl = await API.uploadPicture(fileBuffer, fileType);
        return new ImageAttachment(imageUrl);
    }
};
module.exports.ImageAttachment = ImageAttachment;

class Message {
    constructor(data) {
        this.attachments = data.attachments || [];
        this.avatarUrl = data.avatar_url;
        this.createdAt = data.created_at;
        this.groupId = data.group_id;
        this.id = data.id;
        this.name = data.name;
        this.senderId = data.sender_id;
        this.senderType = data.sender_type;
        this.sourceGuid = data.source_guid;
        this.isSystem = data.system;
        this.text = data.text;
        this.userId = data.user_id;
    }

    isFromUser() {
        return this.senderType === 'user';
    }

    startsWith(trigger) {
        return this.text && this.text.startsWith(trigger);
    }

    /** Create a Message object from JSON message data */
    static from(data) {
        return new this(data);
    }
};
module.exports.Message = Message;

module.exports = API;
