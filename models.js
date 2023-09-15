const { Sequelize, DataTypes } = require('sequelize')

const sequelize = new Sequelize(process.env.DATABASE_URL || 'sqlite://database.db', {
    logging: process.env.NODE_ENV == 'production' ? false : console.log 
})

const User = sequelize.define('User', {
    nowa: {
        type: DataTypes.STRING,
        unique: true
    },    
    timezone: {
        type: DataTypes.STRING,
        defaultValue: 'Asia/Jakarta'
    }
})

const Task = sequelize.define('Task', {
    nowa: {
        type: DataTypes.STRING,
    },
    timeUnix: {
        type: DataTypes.INTEGER
    },
    text: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    done: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
})

module.exports = {
    User,
    Task
}

sequelize.sync()
