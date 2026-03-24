const { createLogger, format, transports } = require('winston')
const DailyRotateFile = require('winston-daily-rotate-file')

const { combine, timestamp, splat, colorize, printf } = format

const folderName = 'storages/logs'

const logger = createLogger({
    format: combine(
        splat(),
        timestamp({
            format: 'DD-MM-YYYY HH:mm:ss',
        }),
        colorize(),
        printf((log) => {
            if (log.stack) return `${log.timestamp} ${log.level} ${log.stack}`
            if (log.data) return `${log.timestamp} ${log.level} ${log.data}`
            return `${log.timestamp} ${log.level} ${log.message}`
        }),
    ),
    transports: [],
})

logger.configure({
    level: 'verbose',
    transports: [
        new DailyRotateFile({
            filename: `${folderName}/%DATE%-error.log`,
            level: 'error',
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '30d',
        }),
        new DailyRotateFile({
            filename: `${folderName}/%DATE%-log.log`,
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '30d',
        }),
    ],
})
//Chỉ show console khi môi trường khác production
if (process.env.NODE_ENV != 'production') {
    logger.add(new transports.Console())
}

module.exports = logger
