// Configuration PM2 sur le VPS (voir README.md > Déploiement).
// PM2 garde l'API en vie, la redémarre en cas de crash et au reboot du
// serveur (`pm2 startup` + `pm2 save`), et `pm2 reload` permet un
// redéploiement sans coupure.
module.exports = {
  apps: [
    {
      name: 'lahiyarouwa-api',
      // `current` est un lien vers la dernière release (voir deploy/deploy.sh).
      cwd: '/var/www/api.lahiyarouwadayaro.com/current',
      script: 'dist/server.js',
      // 2 instances en mode cluster : reload sans coupure et un cœur de plus
      // utilisé. Repasser à 1 si le VPS a peu de mémoire (< 1 Go).
      instances: 2,
      exec_mode: 'cluster',
      max_memory_restart: '300M',
      // Le .env (secrets) est lu par dotenv depuis le dossier courant ; il
      // est relié dans chaque release depuis shared/.env par deploy.sh.
      env: { NODE_ENV: 'production' },
      kill_timeout: 10000,
      time: true,
    },
  ],
};
