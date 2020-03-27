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

async function getQueueLength(called) {
  const getParams = {
    Key: {
      CALLED_ID: { S: `Queue${called}` },
    },
    ConsistentRead: true,
    TableName: 'QueueTable',
  };

  const item = await DynamoDB.getItem(getParams).promise();
  console.log(item);

  return item.Item.QUEUE_LENGTH.N;
}

async function incrementQueue(called, amount) {
  const updateParams = {
    Key: {
      CALLED_ID: { S: `Queue${called}` },
    },
    ExpressionAttributeNames: {
      '#C': 'QUEUE_LENGTH',
    },
    ExpressionAttributeValues: {
      ':incr': { N: `${amount}` },
    },
    ReturnValues: 'ALL_NEW',
    TableName: 'QueueTable',
    UpdateExpression: 'SET #C = #C + :incr',
  };

  const item = await DynamoDB.updateItem(updateParams).promise();
  console.log(item);

  return item.Attributes.QUEUE_LENGTH.N;
}

function enqueue(called, twiml) {
  twiml.enqueue({
    action: '/voice/event',
    method: 'POST',
    waitUrl: 'https://api.neighborline.hackeralliance.org/voice/wait',
  }, `Queue${called}`);
}

function dequeue(called, twiml) {
  const dial = twiml.dial();
  dial.queue({
    // TODO: Implement Connection Notification using url
  }, `Queue${called}`);
}
async function findNeighbor(called, callerID) {
  console.log(`Handling Caller #${callerID} to ${called}`);

  const twiml = new VoiceResponse();

  let queueLength = await getQueueLength(called);
  // Check how many callers are available in queue
  if (queueLength > 0) {
    // Attempt to dequeue
    queueLength = await incrementQueue(called, -1);
    if (queueLength < 0) {
      // Negative value means another lambda already took our caller, fix queue length and enqueue
      queueLength = await incrementQueue(called, 2);
      enqueue(called, twiml);
    } else {
      // Positive value or zero means we're good to go, dial into queue
      dequeue(called, twiml);
    }
  } else {
    // Queue is empty, increment queue and enqueue
    queueLength = await incrementQueue(called, 1);
    enqueue(called, twiml);
  }
  console.log(queueLength);

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
  const twiml = await findNeighbor(params.Called, callerID);

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
