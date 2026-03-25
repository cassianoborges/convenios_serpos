module.exports = {
  apps: [
    {
      name: 'serpos-backend',
      script: './backend/src/server.js',
      cwd: '/var/www/convenios_serpos',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'serpos-frontend',
      script: 'serve',
      interpreter: 'none',
      args: '-s dist -l 8081',
      cwd: '/var/www/convenios_serpos',
      instances: 1,
      autorestart: true,
      watch: false,
    },
  ],
};
