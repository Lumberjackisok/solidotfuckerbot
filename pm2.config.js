module.exports = {
  apps: [
    {
      name: 'solidotfucker',
      script: 'start.js',
      autorestart: true,
      watch: true,
      max_restarts: 10,
    },
  ],
};
