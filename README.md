# groupme.js

A simple Node.js library for interacting with the [GroupMe API](https://dev.groupme.com/docs/v3).

## Installation

```sh
npm install https://github.com/coderkearns/groupme.js.git
```

## Setup

You need a GroupMe access token to use this library.

1. Log in at [dev.groupme.com](https://dev.groupme.com/)
2. Your access token is listed at the top of the page.

Set it as an environment variable before running your program:

```sh
export GM_TOKEN=your_access_token_here
```

Or set it in your code before making any API calls:

```js
process.env.GM_TOKEN = "your_access_token_here";
```

## Quick Start

### Creating and using a Bot

```js
const { Bot } = require("groupme.js");

const GROUP_ID = process.env.GROUP_ID; // Your group ID

async function main() {
    // Create a new bot in the group
    const bot = await Bot.create("My Bot", GROUP_ID);
    console.log("Bot created with ID:", bot.botId);
    // Save bot.botId somewhere — it persists until you delete the bot on the dashboard

    // Send a text message
    await bot.sendMessage("Hello, GroupMe!");

    // Send a message with a local image
    await bot.sendImage("Check this out!", "./example_image.png");
}

main();
```

> **Tip:** Bot IDs are permanent. Once created, a bot continues to exist on GroupMe's servers until you explicitly delete it (via `API.destroyBot(botId)` or through the [developer dashboard](https://dev.groupme.com/bots)). You can persist the `bot.botId` value and reconnect to the same bot in future runs:
>
> ```js
> const BOT_ID = "your_stored_bot_id";
> const bot = new Bot(BOT_ID); // reconnect without calling Bot.create() again
> await bot.sendMessage("Back online!");
> ```

### Using the API directly

```js
require("dotenv").config();
const { API } = require("groupme.js");

async function main() {
    // Get the current user
    const me = await API.getMe();
    console.log("Logged in as:", me.name);

    // List groups
    const groups = await API.getGroups();
    groups.forEach(g => console.log(g.id, g.name));

    // Send a message to a group
    await API.createMessage(GROUP_ID, { text: "Hello from the API!" });
}

main();
```

## API Reference

### `Bot`

#### `Bot.create(name, groupId, [options])` → `Promise<Bot>`

Creates a new GroupMe bot with the given name in the specified group and returns a `Bot` instance.

The `options` object supports the following fields:

| Option | Type | Description |
|--------|------|-------------|
| `avatar_url` | string | URL of an image to use as the bot's avatar |
| `callback_url` | string | A URL GroupMe will POST new messages to (see [Webhooks](#webhooks)) |
| `dm_notification` | boolean | Whether the bot should receive DM notifications |
| `active` | boolean | Whether the bot is active (required by the API) |

```js
const bot = await Bot.create("My Bot", GROUP_ID, {
    avatar_url: "https://i.groupme.com/123456789",
    callback_url: "https://your-server.com/webhook",
    active: true,
});
```

#### `new Bot(botId)`

Instantiates a `Bot` from an existing bot ID. Bot IDs are permanent — they survive process restarts and exist on GroupMe's servers until the bot is explicitly deleted. Store `bot.botId` after creation and reuse it later:

```js
// First run: create and persist the ID
const bot = await Bot.create("My Bot", GROUP_ID);
fs.writeFileSync("bot_id.txt", bot.botId);

// Subsequent runs: reconnect without re-creating
const botId = fs.readFileSync("bot_id.txt", "utf8");
const bot = new Bot(botId);
await bot.sendMessage("I'm back!");
```

#### `bot.sendMessage(text, [attachments])` → `Promise<void>`

Sends a text message (with optional attachments) to the bot's group.

#### `bot.sendImage(text, imagePath)` → `Promise<void>`

Uploads a local image file and sends it with a caption to the bot's group.

---

### `API`

All methods are static and return Promises.

#### Authentication

| Method | Description |
|--------|-------------|
| `API.getAccessToken()` | Returns the access token from `process.env.GM_TOKEN` |

#### Users

| Method | Description |
|--------|-------------|
| `API.getMe()` | Get the current user |
| `API.updateMe(data)` | Update the current user's profile |

#### Groups

| Method | Description |
|--------|-------------|
| `API.getGroups([params])` | List the current user's active groups |
| `API.getFormerGroups()` | List groups the user has left |
| `API.getGroup(id)` | Get a specific group by ID |
| `API.createGroup(data)` | Create a new group |
| `API.updateGroup(id, data)` | Update group settings |
| `API.destroyGroup(id)` | Delete a group |
| `API.joinGroup(id, shareToken)` | Join a group via share token |
| `API.rejoinGroup(id)` | Rejoin a group |

#### Members

| Method | Description |
|--------|-------------|
| `API.addMembers(groupId, members)` | Add members to a group |
| `API.removeMember(groupId, membershipId)` | Remove a member from a group |
| `API.updateMember(groupId, nickname)` | Update your nickname in a group |

#### Messages

| Method | Description |
|--------|-------------|
| `API.getMessages(groupId, [params])` | Get messages from a group |
| `API.createMessage(groupId, message)` | Post a message to a group |

#### Direct Messages

| Method | Description |
|--------|-------------|
| `API.getDirectMessages(otherUserId, [params])` | Get direct messages with a user |
| `API.createDirectMessage(message)` | Send a direct message |

#### Likes

| Method | Description |
|--------|-------------|
| `API.likeMessage(groupId, messageId)` | Like a message |
| `API.unlikeMessage(groupId, messageId)` | Unlike a message |

#### Bots

| Method | Description |
|--------|-------------|
| `API.getBots()` | List all bots for the current user |
| `API.createBot(name, groupId)` | Create a new bot |
| `API.postBot(botId, text, [attachments])` | Post a message as a bot |
| `API.destroyBot(botId)` | Delete a bot |

#### Blocks

| Method | Description |
|--------|-------------|
| `API.getBlocks([params])` | Get list of blocked users |
| `API.createBlock(userId)` | Block a user |
| `API.destroyBlock(userId)` | Unblock a user |

#### Pictures

| Method | Description |
|--------|-------------|
| `API.uploadPicture(fileBuffer, contentType)` | Upload an image to GroupMe's Image Service |

---

### Attachments

#### `API.ImageAttachment`

```js
const { API } = require("groupme.js");

// From a URL
const attachment = new API.ImageAttachment("https://i.groupme.com/...");

// From a local file
const attachment = await API.ImageAttachment.fromFile("./photo.png");
```

#### `API.LocationAttachment`

```js
const attachment = new API.LocationAttachment(lat, lng, "Location Name");
```

---

### Error Handling

API errors throw an `API.Error` instance with the following properties:

| Property | Description |
|----------|-------------|
| `message` | Human-readable error description |
| `statusCode` | HTTP status code |
| `responseJSON` | Raw JSON response from the API (if available) |

```js
try {
    await API.getGroup(999999);
} catch (err) {
    if (err instanceof API.Error) {
        console.error(`API Error ${err.statusCode}: ${err.message}`);
    }
}
```

---

## Webhooks

When you create a bot with a `callback_url`, GroupMe will send an HTTP POST request to that URL every time a new message is posted in the group. The request body is a JSON object that can be parsed with `API.Message.from()`.

The example below creates an Express server and a bot. Each incoming group message is parsed as an `API.Message`, and the bot replies to any message that starts with `!hello`.

```js
const express = require("express");
const { Bot, API } = require("groupme.js");

const GROUP_ID = process.env.GROUP_ID;
const PORT = 3000;
const PUBLIC_URL = "https://your-server.com"; // must be publicly reachable by GroupMe

const app = express();
app.use(express.json());

let bot;

// GroupMe POSTs each new group message to this endpoint
app.post("/webhook", async (req, res) => {
    res.sendStatus(200); // respond quickly so GroupMe doesn't retry

    const message = API.Message.from(req.body);

    // Ignore messages sent by bots (including ourselves)
    if (!message.isFromUser()) return;

    if (message.startsWith("!hello")) {
        await bot.sendMessage(`Hello, ${message.name}!`);
    }

    // Check for image attachments
    const images = message.attachments.filter(a => a instanceof API.ImageAttachment);
    if (images.length > 0) {
        await bot.sendMessage(`Nice image, ${message.name}!`);
    }
});

async function main() {
    bot = await Bot.create("Webhook Bot", GROUP_ID, {
        callback_url: `${PUBLIC_URL}/webhook`,
        active: true,
    });
    console.log("Bot created:", bot.botId);
    // Persist bot.botId if you want to reuse it without re-creating the bot

    app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
}

main();
```

> **Note:** GroupMe requires `callback_url` to be a publicly accessible HTTPS URL. For local development you can use a tunnel like [ngrok](https://ngrok.com/).

## License

[ISC](./LICENSE)
