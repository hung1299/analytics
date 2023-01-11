pm2 delete analytics-api
yarn build
pm2 start build/index.js --name analytics-api --watch