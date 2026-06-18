import env from '#start/env'
import { inject } from '@adonisjs/core'

import { Logger } from '@adonisjs/core/logger'
import {
  CreateBucketCommand,
  DeleteBucketCommand,
  GetBucketPolicyCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutBucketPolicyCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
@inject()
export class S3Service {
  client = new S3Client({
    region: env.get('AWS_REGION'),
    credentials: {
      accessKeyId: env.get('AWS_ACCESS_KEY_ID'),
      secretAccessKey: env.get('AWS_SECRET_ACCESS_KEY'),
    },
  })
  constructor(private readonly logger: Logger) {}

  async createBucket(bucketName: string) {
    const bucket = await this.client
      .send(
        new CreateBucketCommand({
          Bucket: bucketName,
        })
      )
      .then((response) => {
        this.logger.info(`Bucket ${bucketName} created successfully: ${response.Location}`)
        return response
      })
      .catch((error) => {
        this.logger.error(`Failed to create bucket ${bucketName}: ${error.message}`)
        throw error
      })
    return bucket
  }

  async deleteBucket(bucketName: string) {
    const bucket = await this.client
      .send(
        new DeleteBucketCommand({
          Bucket: bucketName,
        })
      )
      .then(() => {
        this.logger.info(`Bucket ${bucketName} deleted successfully`)
      })
      .catch((error) => {
        this.logger.error(`Failed to delete bucket ${bucketName}: ${error.message}`)
        throw error
      })
    return bucket
  }

  async checkIfBucketExists(bucketName: string) {
    try {
      await this.client.send(
        new HeadBucketCommand({
          Bucket: bucketName,
        })
      )
      return true
    } catch (error) {
      this.logger.error(`Failed to check if bucket ${bucketName} exists:`, error)
      throw error
    }
  }

  async generateUploadURL(
    bucketName: string,
    key: string,
    expiresIn: number = 3600,
    contentType?: string
  ) {
    return await getSignedUrl(
      this.client,
      new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        ...(contentType ? { ContentType: contentType } : {}),
      }),
      { expiresIn: expiresIn }
    )
      .then((url) => {
        this.logger.info(`Generated signed URL for bucket ${bucketName} and key ${key}`)
        return url
      })
      .catch((error) => {
        this.logger.error(
          `Failed to generate signed URL for bucket ${bucketName} and key ${key}:`,
          error
        )
        throw error
      })
  }

  async getFileStream(bucketName: string, key: string) {
    const result = await this.client
      .send(
        new GetObjectCommand({
          Bucket: bucketName,
          Key: key,
        })
      )
      .then((response) => {
        this.logger.info(`File ${key} retrieved successfully from bucket ${bucketName}`)
        return response.Body
      })
      .catch((error) => {
        this.logger.error(
          `Failed to retrieve file ${key} from bucket ${bucketName}: ${error.message}`
        )
        throw error
      })
    return result
  }

  async generateGetSignedUrl(bucketName: string, key: string, expiresIn: number = 3600) {
    return await getSignedUrl(
      this.client,
      new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
      }),
      { expiresIn }
    )
      .then((url) => {
        this.logger.info(`Generated GET signed URL for bucket ${bucketName} and key ${key}`)
        return url
      })
      .catch((error) => {
        this.logger.error(
          `Failed to generate GET signed URL for bucket ${bucketName} and key ${key}:`,
          error
        )
        throw error
      })
  }

  async putObject(bucketName: string, key: string, body: Buffer, contentType?: string) {
    return this.client
      .send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: key,
          Body: body,
          ContentType: contentType,
        })
      )
      .then((response) => {
        this.logger.info(`Uploaded object to ${bucketName}/${key}`)
        return response
      })
      .catch((error) => {
        this.logger.error(`Failed to upload object to ${bucketName}/${key}: ${error.message}`)
        throw error
      })
  }

  async getObjectBuffer(bucketName: string, key: string): Promise<Buffer> {
    const result = await this.client
      .send(new GetObjectCommand({ Bucket: bucketName, Key: key }))
      .catch((error) => {
        this.logger.error(`Failed to get object from ${bucketName}/${key}: ${error.message}`)
        throw error
      })
    if (!result.Body) throw new Error(`No body returned for ${bucketName}/${key}`)
    const bytes = await (
      result.Body as { transformToByteArray(): Promise<Uint8Array> }
    ).transformToByteArray()
    this.logger.info(`Retrieved object buffer from ${bucketName}/${key}`)
    return Buffer.from(bytes)
  }

  async configureSESBucketPolicy(bucketName: string) {
    const sesSid = 'AllowSESPuts-MarrowMail'
    const sesStatement = {
      Sid: sesSid,
      Effect: 'Allow',
      Principal: { Service: 'ses.amazonaws.com' },
      Action: 's3:PutObject',
      Resource: `arn:aws:s3:::${bucketName}/received/*`,
    }

    let policy: { Version: string; Statement: Record<string, unknown>[] } = {
      Version: '2012-10-17',
      Statement: [],
    }

    try {
      const existing = await this.client.send(new GetBucketPolicyCommand({ Bucket: bucketName }))
      if (existing.Policy) policy = JSON.parse(existing.Policy)
    } catch (error) {
      if ((error as { name?: string }).name !== 'NoSuchBucketPolicy') throw error
    }

    policy.Statement = policy.Statement.filter((s) => s['Sid'] !== sesSid)
    policy.Statement.push(sesStatement)

    await this.client.send(
      new PutBucketPolicyCommand({ Bucket: bucketName, Policy: JSON.stringify(policy) })
    )
    this.logger.info(`S3 bucket policy updated to allow SES writes on ${bucketName}`)
  }

  async emptyBucket(bucketName: string) {
    const { ListObjectsV2Command, DeleteObjectsCommand } = await import('@aws-sdk/client-s3')

    const listed = await this.client.send(new ListObjectsV2Command({ Bucket: bucketName }))
    const objects = listed.Contents

    if (!objects || objects.length === 0) return

    await this.client.send(
      new DeleteObjectsCommand({
        Bucket: bucketName,
        Delete: { Objects: objects.map(({ Key }) => ({ Key })) },
      })
    )

    this.logger.info(`Emptied bucket ${bucketName}`)
  }
}
