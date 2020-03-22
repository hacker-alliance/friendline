// Import AWS Node.js SDK
const AWS = require('aws-sdk');

// Set Region to us-east-1
AWS.config.update({ region: 'us-east-1' });

const DynamoDB = new AWS.DynamoDB();

const VoiceResponse = require('twilio').twiml.VoiceResponse;

let response;

const updateParams = {
    Key: {
        QUEUE_ID: { N: '001' },
    },
    ExpressionAttributeNames: {
        "#C": "Caller_ID"
    },
    ExpressionAttributeValues: {
        ":incr": { "N": "1" }
    },
    ReturnValues: "ALL_NEW",
    TableName: "QueueTable",
    UpdateExpression: "SET #C = #C + :incr"
};

/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Context doc: https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html 
 * @param {Object} context
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 * 
 */
exports.lambdaHandler = async (event, context) => {
    const twiml = new VoiceResponse();
    twiml.say({ voice: 'alice' }, 'Hello, Welcome to neighbor line!');

    twiml.say({ voice: 'alice' }, 'We\'ll be pairing you with a neighbor shortly, here\'s some music while you wait');

    let item = await DynamoDB.updateItem(updateParams).promise();
    console.log(item);
    let caller_ID = item.Attributes.Caller_ID.N;

    const dial = twiml.dial();

    let room_ID = (caller_ID % 2 == 0) ? caller_ID - 1 : caller_ID;

    dial.conference({
        waitUrl: 'https://api.neighborline.hackeralliance.org/wait/music',
        beep: true
    }, 'Pair_Room_' + room_ID);

    try {
        response = {
            'statusCode': 200,
            'headers': { "content-type": "text/xml" },
            'body': twiml.toString()
        }
    } catch (err) {
        console.log(err);
        return err;
    }
    return response
};
