import env from '#start/env'
import { inject } from '@adonisjs/core'
import { Logger } from '@adonisjs/core/logger'
import {
  CreateHostedZoneCommand,
  DeleteHostedZoneCommand,
  GetHostedZoneCommand,
  Route53Client,
} from '@aws-sdk/client-route-53'
@inject()
export class Route53Service {
  client = new Route53Client({
    region: env.get('AWS_REGION'),
    credentials: {
      accessKeyId: env.get('AWS_ACCESS_KEY_ID'),
      secretAccessKey: env.get('AWS_SECRET_ACCESS_KEY'),
    },
  })
  constructor(private readonly logger: Logger) {}
  async createHostedZone(domainName: string) {
    // Your code here
    const hostedZone = await this.client
      .send(
        new CreateHostedZoneCommand({
          CallerReference: 'cloud01-hosted-zone-' + Date.now(),
          Name: domainName,
          HostedZoneConfig: {
            Comment: 'Hosted zone for ' + domainName,
            PrivateZone: false,
          },
        })
      )
      .then((response) => {
        this.logger.info(
          `Hosted zone created successfully for domain ${domainName}: ${response.HostedZone?.Id}`
        )
        return response
      })
      .catch((error) => {
        this.logger.error(`Failed to create hosted zone for domain ${domainName}: ${error.message}`)
        throw error
      })
    return hostedZone
  }
  async getHostedZone(hostedZoneId: string) {
    const hostedZone = await this.client
      .send(new GetHostedZoneCommand({ Id: hostedZoneId }))
      .then((response) => {
        this.logger.info(`Hosted zone retrieved successfully: ${response.HostedZone?.Id}`)
        return response
      })
      .catch((error) => {
        this.logger.error(`Failed to retrieve hosted zone ${hostedZoneId}: ${error.message}`)
        throw error
      })
    return hostedZone
  }
  async deleteHostedZone(hostedZoneId: string) {
    const hostedZone = await this.client
      .send(new DeleteHostedZoneCommand({ Id: hostedZoneId }))
      .then((response) => {
        this.logger.info(`Hosted zone deleted successfully: ${hostedZoneId}`)
        return response
      })
      .catch((error) => {
        this.logger.error(`Failed to delete hosted zone ${hostedZoneId}: ${error.message}`)
        throw error
      })
    return hostedZone
  }
}
