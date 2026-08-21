import env from '#start/env'
import { inject } from '@adonisjs/core'
import { Logger } from '@adonisjs/core/logger'
import {
  CheckDomainAvailabilityCommand,
  type ContactDetail,
  GetOperationDetailCommand,
  ListPricesCommand,
  RegisterDomainCommand,
  Route53DomainsClient,
} from '@aws-sdk/client-route-53-domains'

export interface RegistrantContact {
  firstName: string
  lastName: string
  organizationName?: string
  addressLine1: string
  addressLine2?: string
  city: string
  state?: string
  countryCode: string
  zipCode: string
  phoneNumber: string
  email: string
}

function toContactDetail(contact: RegistrantContact): ContactDetail {
  return {
    FirstName: contact.firstName,
    LastName: contact.lastName,
    ContactType: contact.organizationName ? 'COMPANY' : 'PERSON',
    OrganizationName: contact.organizationName,
    AddressLine1: contact.addressLine1,
    AddressLine2: contact.addressLine2,
    City: contact.city,
    State: contact.state,
    CountryCode: contact.countryCode as ContactDetail['CountryCode'],
    ZipCode: contact.zipCode,
    PhoneNumber: contact.phoneNumber,
    Email: contact.email,
  }
}

@inject()
export class Route53DomainsService {
  // Route 53 Domains is a global service that only operates out of
  // us-east-1 — unlike SES/S3/SNS, it can't share AWS_REGION.
  client = new Route53DomainsClient({
    region: 'us-east-1',
    credentials: {
      accessKeyId: env.get('AWS_ACCESS_KEY_ID'),
      secretAccessKey: env.get('AWS_SECRET_ACCESS_KEY'),
    },
  })

  constructor(private readonly logger: Logger) {}

  async checkAvailability(domainName: string): Promise<boolean> {
    const response = await this.client
      .send(new CheckDomainAvailabilityCommand({ DomainName: domainName }))
      .then((result) => {
        this.logger.info(`Checked availability for ${domainName}: ${result.Availability}`)
        return result
      })
      .catch((error) => {
        this.logger.error(`Failed to check availability for ${domainName}: ${error.message}`)
        throw error
      })

    return response.Availability === 'AVAILABLE'
  }

  async getPrice(tld: string): Promise<{ amount: number; currency: string }> {
    const response = await this.client
      .send(new ListPricesCommand({ Tld: tld }))
      .then((result) => {
        this.logger.info(`Fetched registration price for .${tld}`)
        return result
      })
      .catch((error) => {
        this.logger.error(`Failed to fetch price for .${tld}: ${error.message}`)
        throw error
      })

    const price = response.Prices?.[0]?.RegistrationPrice
    if (!price?.Price || !price.Currency) {
      throw new Error(`No registration price returned for .${tld}`)
    }
    return { amount: price.Price, currency: price.Currency }
  }

  async registerDomain(
    domainName: string,
    contact: RegistrantContact,
    autoRenew = true
  ): Promise<string> {
    const contactDetail = toContactDetail(contact)

    const response = await this.client
      .send(
        new RegisterDomainCommand({
          DomainName: domainName,
          DurationInYears: 1,
          AutoRenew: autoRenew,
          AdminContact: contactDetail,
          RegistrantContact: contactDetail,
          TechContact: contactDetail,
          PrivacyProtectAdminContact: true,
          PrivacyProtectRegistrantContact: true,
          PrivacyProtectTechContact: true,
        })
      )
      .then((result) => {
        this.logger.info(
          `Registration submitted for ${domainName}: operation ${result.OperationId}`
        )
        return result
      })
      .catch((error) => {
        this.logger.error(`Failed to register domain ${domainName}: ${error.message}`)
        throw error
      })

    if (!response.OperationId) {
      throw new Error(`RegisterDomain for ${domainName} did not return an OperationId`)
    }
    return response.OperationId
  }

  async getOperationDetail(operationId: string) {
    return this.client
      .send(new GetOperationDetailCommand({ OperationId: operationId }))
      .then((result) => {
        this.logger.info(`Operation ${operationId} status: ${result.Status}`)
        return result
      })
      .catch((error) => {
        this.logger.error(`Failed to get operation detail for ${operationId}: ${error.message}`)
        throw error
      })
  }
}
