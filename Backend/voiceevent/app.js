// Import AWS Node.js SDK
const AWS = require('aws-sdk');
const querystring = require('querystring');

// Set Region to us-east-1
AWS.config.update({ region: 'us-east-1' });

const DynamoDB = new AWS.DynamoDB();

let response;

async function decrementQueue(called) {
  const updateParams = {
    Key: {
      CALLED_ID: { S: `Queue${called}` },
    },
    ExpressionAttributeNames: {
      '#C': 'QUEUE_LENGTH',
    },
    ExpressionAttributeValues: {
      ':decr': { N: '1' },
    },
    ReturnValues: 'ALL_NEW',
    TableName: 'QueueTable',
    UpdateExpression: 'SET #C = #C - :decr',
  };

  const item = await DynamoDB.updateItem(updateParams).promise();
  console.log(item);

  return item.Attributes.QUEUE_LENGTH.N;
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

  if (params.QueueResult !== 'bridged' && params.QueueResult !== 'bridging-in-process') {
    await decrementQueue(params.Called);
  }

  try {
    response = {
      statusCode: 200,
      headers: { 'content-type': 'text/xml' },
      body: 'OK',
    };
  } catch (err) {
    console.log(err);
    return err;
  }
  return response;
};
