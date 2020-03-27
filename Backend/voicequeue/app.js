const querystring = require('querystring');

// Import AWS Node.js SDK
const AWS = require('aws-sdk');

// Set Region to us-east-1
AWS.config.update({ region: 'us-east-1' });

const DynamoDB = new AWS.DynamoDB();

const { VoiceResponse } = require('twilio').twiml;

let response;

async function anonymize(called) {
  const updateParams = {
    Key: {
      CALLED_ID: { S: `Queue${called}` },
    },
    ExpressionAttributeNames: {
      '#C': 'CALLER_ID',
    },
    ExpressionAttributeValues: {
      ':incr': { N: '1' },
    },
    ReturnValues: 'ALL_NEW',
    TableName: 'QueueTable',
    UpdateExpression: 'SET #C = #C + :incr',
  };

  const item = await DynamoDB.updateItem(updateParams).promise();
  console.log(item);

  return item.Attributes.CALLER_ID.N;
}

async function findRoom(called, callerID) {
  const roomID = (callerID % 2 === 0) ? callerID - 1 : callerID;

  const twiml = new VoiceResponse();
  const dial = twiml.dial();

  dial.conference({
    waitUrl: 'https://api.neighborline.hackeralliance.org/voice/wait',
    beep: true,
    endConferenceOnExit: true,
    maxParticipants: 2,
  }, `Queue${called}_Room_${roomID}`);

  return twiml;
}

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
  console.log(event);
  console.log(context);

  const params = querystring.parse(event.body);
  console.log(params);

  const callerID = await anonymize(params.Called);
  const twiml = await findRoom(params.Called, callerID);

  try {
    response = {
      statusCode: 200,
      headers: { 'content-type': 'text/xml' },
      body: twiml.toString(),
    };
  } catch (err) {
    console.log(err);
    return err;
  }
  return response;
};
