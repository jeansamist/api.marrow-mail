import env from '#start/env'
import { inject } from '@adonisjs/core'
import { Logger } from '@adonisjs/core/logger'
import { CreateTopicCommand, SNSClient, SubscribeCommand } from '@aws-sdk/client-sns'

@inject()
export class SnsService {
  private client = new SNSClient({
    region: env.get('AWS_REGION'),
    credentials: {
      accessKeyId: env.get('AWS_ACCESS_KEY_ID'),
      secretAccessKey: env.get('AWS_SECRET_ACCESS_KEY'),
    },
  })

  constructor(private readonly logger: Logger) {}

  // CreateTopicCommand is idempotent — returns the same ARN if the topic already exists
  async ensureTopic(topicName: string): Promise<string> {
    const result = await this.client.send(new CreateTopicCommand({ Name: topicName }))
    if (!result.TopicArn) throw new Error('SNS CreateTopic returned no ARN')
    this.logger.info(`SNS topic "${topicName}" ready: ${result.TopicArn}`)
    return result.TopicArn
  }

  async subscribeHttpEndpoint(topicArn: string, endpointUrl: string): Promise<string> {
    const protocol = endpointUrl.startsWith('https://') ? 'https' : 'http'
    const result = await this.client.send(
      new SubscribeCommand({ TopicArn: topicArn, Protocol: protocol, Endpoint: endpointUrl })
    )
    this.logger.info(
      `SNS subscription to ${endpointUrl}: ${result.SubscriptionArn ?? 'pending confirmation'}`
    )
    return result.SubscriptionArn ?? 'pending'
  }
}
