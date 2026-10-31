const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const accessLogStream = fs.createWriteStream(path.join(logDir, 'access.log'), { flags: 'a' });
const appLogStream = fs.createWriteStream(path.join(logDir, 'app.log'), { flags: 'a' });
const errorLogStream = fs.createWriteStream(path.join(logDir, 'error.log'), { flags: 'a' });

const formatMessage = (level, message) => {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level.toUpperCase()}] ${typeof message === 'object' ? JSON.stringify(message) : message}\n`;
};

const logger = {
  accessLogStream,
  info: (msg) => {
    const formatted = formatMessage('info', msg);
    process.stdout.write(formatted);
    appLogStream.write(formatted);
  },
  warn: (msg) => {
    const formatted = formatMessage('warn', msg);
    process.stdout.write(formatted);
    appLogStream.write(formatted);
  },
  error: (msg) => {
    const formatted = formatMessage('error', msg);
    process.stderr.write(formatted);
    errorLogStream.write(formatted);
  },
};

module.exports = logger;
