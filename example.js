const Bot = require("./bot");

const GROUP_ID = 1234567890; // Add group ID here

async function test() {
    const bot = await Bot.create("Test Bot", GROUP_ID);
    console.log("Bot created with ID:", bot.botId);

    const response = await bot.sendMessage("Hello, GroupMe!");
    console.log("Message sent. Response:", response);

    const imageResponse = await bot.sendImage("Here's an image!", './example_image.png');
    console.log("Image message sent. Response:", imageResponse);
}

test()