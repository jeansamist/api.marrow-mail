import env from '#start/env'
import { inject } from '@adonisjs/core'

import { Logger } from '@adonisjs/core/logger'
import {
  CreateBucketCommand,
  DeleteBucketCommand,
  GetObjectCommand,
  HeadBucketCommand,
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

  async generateUploadURL(bucketName: string, key: string, expiresIn: number = 3600) {
    return await getSignedUrl(
      this.client,
      new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
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
