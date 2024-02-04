const AWS = require('aws-sdk');
const AmazonCognitoIdentity = require("amazon-cognito-identity-js");
const config = require('./config');
const axios = require("axios");
const CognitoIdentityProvider = require('@aws-sdk/client-cognito-identity-provider');

const poolData = config.poolData;
AWS.config.update(config.aws_remote_config);
const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
const cognitoBaseURL = `https://amcart.auth.${config.aws_remote_config.region}.amazoncognito.com`;

const getToken = function (req, res) {
    const body = {
        grant_type: "authorization_code",
        client_id: config.poolData.ClientId,
        code: req.params.code,
        redirect_uri: "http://localhost:4201"
    }

    axios.post(`${cognitoBaseURL}/oauth2/token`, body, {
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        }
    }).then(function (response) {
        const id_token = response.data.id_token;
        const payload = JSON.parse(Buffer.from(id_token.split('.')[1], 'base64').toString());
        res.send({
            success: true,
            access_token: response.data.access_token,
            refresh_token: response.data.refresh_token,
            userDetails: {
                email: payload.email,
                name: payload.name
            }
        })
    }, function (err) {
        res.send({
            success: false,
            message: "Failed to authenticate user",
            error: err
        })
    })
}

const userInfo = async function (req, res) {
    axios.get(`${cognitoBaseURL}/oauth2/userinfo`, {
        headers: {
            "Authorization": `Bearer ${req.params.token}`
        }
    }).then(function (response) {
        console.log(response);
        res.send({
            success: true,            
            userDetails: {
                email: response.data.email,
                name: response.data.name
            }
        })
    }, function (err) {
        res.send({
            success: false,
            message: "Failed to fetch user details",
            error: err
        })
    })
}

const refreshToken = async function(req, res) {
    if (!req.params.token) {
        res.status(400).send({
            message: "Please provide refresh token"
        })
    }

    const client = new CognitoIdentityProvider.CognitoIdentityProvider({ region: config.aws_remote_config.region })

    const response = await client.initiateAuth({
        ClientId: config.poolData.ClientId,
        AuthFlow: 'REFRESH_TOKEN_AUTH',
        AuthParameters: {
            REFRESH_TOKEN: req.params.token,
        },
    });

    const {
        AuthenticationResult: { AccessToken, IdToken },
    } = response;

    const body = {
        refresh_token: req.params.token,
        access_token: AccessToken,
        id_token: IdToken,
    };

    console.log(body);
    res.send({
        success: true,
        ...body
    });
}

module.exports = { login, getToken, userInfo, refreshToken }