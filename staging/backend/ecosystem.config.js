module.exports = {
  apps: [{
    name: 'user-management-api-staging',
    script: './dist/server.js',
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'staging',
      PORT: 3000
    }
  }]
};
