const client = require("./client");
const { Op } = require("sequelize");
const { Task, User } = require("./models");

client.on("ready", async () => {
  console.log("SIAPPPP!");

  setInterval(async () => {
    try {
      const tasks = await Task.findAll({
        where: {
          timeUnix: {
            [Op.lte]: Math.floor(Date.now() / 1000),
          },
          done: false,
        },
      });

      tasks.forEach(async (task) => {

        try {
            const user = await User.findOne({
              where: {
                nowa: task.nowa
              }
            })
            task.done = true
            await task.save()
            await client.sendMessage(task.nowa, `*[PENGINGAT]*\n\nZona waktu kamu: *${user.timezone}*\n\nText: ${task.text}`)
        } catch(err) {
            console.log(err)
        }

      });
    } catch (err) {
      console.log(err);
    }
  }, 1000);
});
