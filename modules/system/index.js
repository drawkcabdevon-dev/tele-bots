const { exec } = require('child_process');
const os = require('os');
const config = require('../../config');

/**
 * System Management Module
 * Allows the owner to monitor and control the host device (tablet/mac) via Telegram.
 */
module.exports = (bot) => {
    
    // Middleware to ensure only the owner can run system commands
    const isOwner = (msg) => {
        if (msg.from.id.toString() !== config.OWNER_ID) {
            bot.sendMessage(msg.chat.id, "⛔ Access Denied: System commands are restricted to the owner.");
            return false;
        }
        return true;
    };

    // /status - Check device health
    bot.onText(/\/status/, (msg) => {
        if (!isOwner(msg)) return;

        const uptime = Math.floor(process.uptime());
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        
        const freeMem = (os.freemem() / 1024 / 1024 / 1024).toFixed(2);
        const totalMem = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);

        const statusText = `📊 *System Status*\n\n` +
                           `⏱ *Uptime:* ${hours}h ${minutes}m\n` +
                           `🧠 *Memory:* ${freeMem}GB / ${totalMem}GB free\n` +
                           `🏠 *Device:* ${os.hostname()} (${os.platform()})\n` +
                           `🔋 *Battery:* Fetching...`;

        bot.sendMessage(msg.chat.id, statusText, { parse_mode: 'Markdown' });

        // Try to get battery info (works on most Linux/Android/Mac)
        exec('pmset -g batt || termux-battery-status', (err, stdout) => {
            if (!err && stdout) {
                bot.sendMessage(msg.chat.id, `🔋 *Battery Detail:*\n\`${stdout.trim()}\``, { parse_mode: 'Markdown' });
            }
        });
    });

    // /shell <command> - Execute bash command
    bot.onText(/\/shell (.+)/, (msg, match) => {
        if (!isOwner(msg)) return;

        const command = match[1];
        bot.sendMessage(msg.chat.id, `💻 Executing: \`${command}\`...`, { parse_mode: 'Markdown' });

        exec(command, (error, stdout, stderr) => {
            const output = stdout || stderr || "Command executed with no output.";
            const formattedOutput = output.length > 4000 ? output.substring(0, 4000) + "..." : output;
            
            bot.sendMessage(msg.chat.id, `📝 *Output:*\n\`\`\`\n${formattedOutput}\n\`\`\``, { parse_mode: 'Markdown' });
        });
    });

    // /reboot - (Optional/Caution) 
    bot.onText(/\/reboot_bot/, (msg) => {
        if (!isOwner(msg)) return;
        bot.sendMessage(msg.chat.id, "♻️ Restarting bot process...").then(() => {
            process.exit(0); // If using PM2 or a systemd service, it will auto-restart
        });
    });
};
