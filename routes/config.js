const dotenv = require('dotenv');
dotenv.config();

module.exports = {
    aws_remote_config: {
      accessKeyId: process.env.AWS_ACCESS_ID,
      secretAccessKey: process.env.AWS_ACCESS_KEY,
      region: process.env.AWS_REGION,
    },
    poolData: {
      UserPoolId: process.env.USER_POOL_ID,
      ClientId: process.env.CLIENT_ID,
    }
};