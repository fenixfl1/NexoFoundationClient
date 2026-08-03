/* eslint-disable no-undef */
module.exports = {
  apps: [
    {
      name: 'client',
      cwd: __dirname,
      script: 'serve',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_restarts: 10,
      restart_delay: 5000,
      time: true,
      env: {
        NODE_ENV: 'production',
        PM2_SERVE_PATH: 'dist',
        PM2_SERVE_PORT: 3001,
        PM2_SERVE_SPA: 'true',
      },
    },
  ],
}
