import { removeSuffix, toPascalCaseAndStripSuffix, toSnakeCase } from '#utils/text_processors'
import { args, BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import { constants } from 'node:fs'
import { access, mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

export default class MakeRepository extends BaseCommand {
  static commandName = 'make:repository'
  static description = 'Create a model repository'
  static options: CommandOptions = {
    allowUnknownFlags: true,
  }
  @args.string({
    argumentName: 'repository_name',
    description: 'Name of the repository to be created',
    required: false,
    allowEmptyValue: true,
    parse(value) {
      return value ? toPascalCaseAndStripSuffix(value, 'Repository') + 'Repository' : value
    },
  })
  declare name: string | undefined

  async interact() {
    if (!this.name) {
      this.name = await this.prompt.ask('Repository name', {
        result: (value) => toPascalCaseAndStripSuffix(value, 'Repository') + 'Repository',
        validate: (value) => {
          if (!value) {
            return 'Repository name is required'
          }
          return true
        },
      })
    }
  }

  async run() {
    if (!this.name) {
      this.logger.error('Repository name is required')
      this.exitCode = 1
      return
    }

    const repositoriesDirectory = fileURLToPath(new URL('../app/repositories', import.meta.url))
    const repositoryFileName = `${toSnakeCase(this.name)}.ts`
    const repositoryFilePath = join(repositoriesDirectory, repositoryFileName)

    await mkdir(repositoriesDirectory, { recursive: true })

    try {
      await access(repositoryFilePath, constants.F_OK)
      this.logger.error(`Repository file already exists at ${repositoryFilePath}`)
      this.exitCode = 1
      return
    } catch {
      // File does not exist yet, continue with creation.
    }
    const modelName = removeSuffix(this.name, 'Repository')
    const fileContents = `import ${modelName} from '#models/${toSnakeCase(modelName)}'
export default class ${this.name} {
  private model = ${modelName}
  get getModel(): typeof ${modelName} {
    return this.model
  }
}\n`

    await writeFile(repositoryFilePath, fileContents)
    this.logger.info(`Created repository at ${repositoryFilePath}`)
  }

  async completed() {
    if (!this.error && this.exitCode === 0 && this.name) {
      this.logger.info(`Repository ${this.name} created successfully`)
    }
  }
}
