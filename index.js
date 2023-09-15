require("dotenv").config();
require("./worker");

const { default: OpenAI } = require("openai");
const utils = require("./utils");
const qrcode = require("qrcode-terminal");

const { User, Task } = require("./models");
const strftime = require("strftime");

const client = require("./client");

client.on("qr", (qr) => {
  qrcode.generate(qr, { small: true });
});

const openai = new OpenAI()

client.on("message", async (message) => {
  const [user, created] = await User.findOrCreate({
    where: {
      nowa: message.from,
    },
  });

  const resultAi = (data = await openai.chat.completions.create({
    model: "gpt-3.5-turbo-0613",
    max_tokens: 500,
    messages: [
      {
        role: "user",
        content: `sekarang tanggal ${Date()}. ${message.body}`,
      },
    ],
    functions: [
      {
        name: "get_time_by_date",
        description:
          "untuk mendapatkan tanggal dari input, contoh: ingatkan aku karena ingin makan pada 23-01-2010 jam 10:00",
        parameters: {
          type: "object",
          properties: {
            time: {
              type: "string",
              description: "yyyy-mm-dd hh:mm:00",
            },
            text: {
              type: "string",
              description: "apa yang ingin di ingatkan",
            },
          },
        },
      },
      {
        name: "get_time_by_seconds",
        description:
          "untuk mendapatkan tanggal berdasarkan detik, contoh: ingatkan aku 5 jam lagi",
        parameters: {
          type: "object",
          properties: {
            time: {
              type: "integer",
              description: "jumlah detik (berbentuk integer json murni)",
            },
            text: {
              type: "string",
              description: "apa yang ingin di ingatkan",
            },
          },
        },
      },
      {
        name: "list_task",
        description: "jika ada yang menanyakan list task saya",
        parameters: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "delete_task",
        description: "jika ada yang ingin menghapus task",
        parameters: {
          type: "object",
          properties: {
            id: {
              type: "integer",
              description: "kode task yang ingin dihapus",
            },
          },
        },
      },
      {
        name: "set_timezone",
        description:
          "saat seseorang memberi tahu timezone dia, contoh: saya berasal dari Jakarta (langsung konversi ke valid timezone dalam kasus ini Asia/Jakarta)",
        parameters: {
          type: "object",
          properties: {
            timezone: {
              type: "string",
            },
          },
        },
      },
    ],
  }));

  const messageAi = resultAi.choices[0].message;

  if (messageAi.content) {
    await message.reply(messageAi.content);
    return;
  }

  const messageFunctionCall = messageAi.function_call;
  const arguments = eval(`(${messageFunctionCall.arguments})`);

  if (messageFunctionCall.name == "set_timezone") {
    user.timezone = arguments["timezone"];
    await user.save();
    await message.reply(
      `Timezone anda sudah di-set ke *${arguments["timezone"]}*`
    );
  } else if (messageFunctionCall.name == "get_time_by_seconds") {
    const currentSeconds = Math.floor(Date.now() / 1000);
    const seconds = currentSeconds + arguments["time"];

    await Task.create({
      nowa: message.from,
      timeUnix: seconds,
      text: arguments["text"],
    });

    await message.reply("Ok. akan saya ingatkan");
  
  } else if (messageFunctionCall.name == "get_time_by_date") {
    let time = arguments.time;
    const tz = utils.getTZ();
    time = await utils.convertTZ(user.timezone, tz, time)

    const seconds = Math.floor(time.getTime() / 1000)
    await Task.create({
      nowa: message.from,
      timeUnix: seconds,
      text: arguments["text"],
    });

    await message.reply("Ok. akan saya ingatkan");

  } else if (messageFunctionCall.name == "list_task") {
    const tasks = await Task.findAll({
      where: {
        nowa: message.from,
        done: false,
      },
    });

    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      let time = new Date(task.timeUnix * 1000);
      time = strftime("%B %d, %Y %H:%M:%S", time);
      await client.sendMessage(task.nowa, `${i + 1}). ${time} - ${task.text}`);
    }

  } else if (messageFunctionCall.name == "delete_task") {
    try {
        const id = arguments['id']

        if (!id) {
            await message.reply('Waduh! mana id nya')
        }
    
        const tasks = await Task.findAll({
          where: {
            nowa: message.from,
            done: false,
          },
          limit: id,
        })
    
        tasks[id - 1].done = true
        await tasks[id - 1].save()
        await message.reply('Sukses menghapus')
    } catch(err) {
        console.log(err)
        await message.reply('Gagal menghapus task')
    }
  }
  
});

client.initialize();
