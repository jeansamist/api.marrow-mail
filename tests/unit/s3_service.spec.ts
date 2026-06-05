import { S3Service } from '#services/s3_service'
import { wait } from '#utils/wait'
import app from '@adonisjs/core/services/app'
import { test } from '@japa/runner'
import { readFile, unlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const AWS_TIMEOUT = 15_000
const BUCKET_NAME = 'geek-wear-test-bucket'
const FILE_KEY = 'test-folder/test-file.txt'
const FILE_CONTENT = 'Hello from Geek Wear test suite!'

function errorName(error: unknown): string {
  return error instanceof Error ? error.name : String(error)
}

test.group('S3Service', (group) => {
  let s3Service: S3Service

  group.setup(async () => {
    s3Service = await app.container.make(S3Service)
    await s3Service.createBucket(BUCKET_NAME)
    await wait(3000)
  })

  group.teardown(async () => {
    await s3Service.emptyBucket(BUCKET_NAME)
    await s3Service.deleteBucket(BUCKET_NAME)
  })

  // Ensure the test file always exists before each test that needs it
  group.each.setup(async () => {
    const url = await s3Service.generateUploadURL(BUCKET_NAME, FILE_KEY)
    await fetch(url, {
      method: 'PUT',
      body: FILE_CONTENT,
      headers: { 'Content-Type': 'text/plain' },
    })
  })

  // ─── Bucket ────────────────────────────────────────────────────────────────

  test('create a bucket', async ({ assert }) => {
    const exists = await s3Service.checkIfBucketExists(BUCKET_NAME)
    assert.isTrue(exists)
  }).timeout(AWS_TIMEOUT)

  test('checkIfBucketExists returns true for an existing bucket', async ({ assert }) => {
    const exists = await s3Service.checkIfBucketExists(BUCKET_NAME)
    assert.isTrue(exists)
  }).timeout(AWS_TIMEOUT)

  test('checkIfBucketExists throws for a non-existing bucket', async ({ assert }) => {
    try {
      await s3Service.checkIfBucketExists('this-bucket-does-not-exist-xyz')
      assert.fail('Expected an error to be thrown')
    } catch (error) {
      assert.match(errorName(error), /NoSuchBucket|NotFound|UnknownError/i)
    }
  }).timeout(AWS_TIMEOUT)

  // ─── Upload via presigned URL ───────────────────────────────────────────────

  test('generateUploadURL returns a valid presigned S3 URL', async ({ assert }) => {
    const url = await s3Service.generateUploadURL(BUCKET_NAME, FILE_KEY)

    assert.isString(url)
    assert.match(url, /^https:\/\/.+\.s3\..+\.amazonaws\.com/)
    assert.include(url, encodeURIComponent(FILE_KEY).replace(/%2F/g, '/'))
    assert.include(url, 'X-Amz-Expires')
  }).timeout(AWS_TIMEOUT)

  test('generateUploadURL respects a custom expiresIn value', async ({ assert }) => {
    const url = await s3Service.generateUploadURL(BUCKET_NAME, FILE_KEY, 120)
    assert.match(url, /X-Amz-Expires=120/)
  }).timeout(AWS_TIMEOUT)

  test('file uploaded via presigned URL is reachable in S3', async ({ assert }) => {
    // File is guaranteed to exist by group.each.setup
    const stream = await s3Service.getFileStream(BUCKET_NAME, FILE_KEY)
    assert.exists(stream)
  }).timeout(AWS_TIMEOUT)

  // ─── Download / streaming ───────────────────────────────────────────────────

  test('getFileStream returns the correct file content', async ({ assert }) => {
    const stream = await s3Service.getFileStream(BUCKET_NAME, FILE_KEY)
    assert.exists(stream)

    const chunks: Uint8Array[] = []
    for await (const chunk of stream as AsyncIterable<Uint8Array>) {
      chunks.push(chunk)
    }

    const content = Buffer.concat(chunks).toString('utf-8')
    assert.equal(content, FILE_CONTENT)
  }).timeout(AWS_TIMEOUT)

  test('getFileStream can be written to a temp file', async ({ assert }) => {
    const stream = await s3Service.getFileStream(BUCKET_NAME, FILE_KEY)
    const tmpPath = join(tmpdir(), 'ses-attachment-test.txt')

    const chunks: Uint8Array[] = []
    for await (const chunk of stream as AsyncIterable<Uint8Array>) {
      chunks.push(chunk)
    }

    await writeFile(tmpPath, Buffer.concat(chunks))

    const written = await readFile(tmpPath, 'utf-8')
    assert.equal(written, FILE_CONTENT)

    await unlink(tmpPath)
  }).timeout(AWS_TIMEOUT)

  test('getFileStream throws for a non-existing key', async ({ assert }) => {
    try {
      await s3Service.getFileStream(BUCKET_NAME, 'non-existing/file.txt')
      assert.fail('Expected an error to be thrown')
    } catch (error) {
      assert.match(errorName(error), /NoSuchKey/i)
    }
  }).timeout(AWS_TIMEOUT)

  // ─── Delete bucket ──────────────────────────────────────────────────────────

  test('delete a bucket', async ({ assert }) => {
    const tempBucket = 'geek-wear-temp-delete-test'
    await s3Service.createBucket(tempBucket)

    const result = await s3Service.deleteBucket(tempBucket)
    assert.isUndefined(result)

    try {
      await s3Service.checkIfBucketExists(tempBucket)
      assert.fail('Expected an error to be thrown')
    } catch (error) {
      assert.match(errorName(error), /NoSuchBucket|NotFound|UnknownError/i)
    }
  }).timeout(AWS_TIMEOUT * 2)
})
