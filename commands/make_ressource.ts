import { normalizeResourceName, toSnakeCase } from '#utils/text_processors'
import { args, BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import { constants } from 'node:fs'
import { access, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

export default class MakeRessource extends BaseCommand {
  static commandName = 'make:ressource'
  static description = 'Create all different files for a ressource'

  static options: CommandOptions = {
    allowUnknownFlags: true,
  }

  @args.string({
    argumentName: 'ressource_name',
    description: 'Name of the ressource to create',
    required: false,
    allowEmptyValue: true,
    parse(value) {
      return value ? normalizeResourceName(value) : value
    },
  })
  declare name: string | undefined

  @flags.boolean({
    default: true,
    showNegatedVariantInHelp: true,
    description: 'Generate validator',
  })
  declare validator: boolean

  @flags.boolean({
    default: true,
    showNegatedVariantInHelp: true,
    description: 'Generate model',
  })
  declare model: boolean

  @flags.boolean({
    default: true,
    showNegatedVariantInHelp: true,
    description: 'Generate API controller',
  })
  declare controller: boolean

  @flags.boolean({
    default: true,
    showNegatedVariantInHelp: true,
    description: 'Generate migration',
  })
  declare migration: boolean

  @flags.boolean({
    default: true,
    showNegatedVariantInHelp: true,
    description: 'Generate repository (requires model)',
  })
  declare repository: boolean

  @flags.boolean({
    default: true,
    showNegatedVariantInHelp: true,
    description: 'Generate service',
  })
  declare service: boolean

  @flags.boolean({
    default: true,
    showNegatedVariantInHelp: true,
    description: 'Generate service (plural alias)',
  })
  declare services: boolean

  @flags.boolean({
    default: true,
    showNegatedVariantInHelp: true,
    description: 'Link repository injection inside service constructor',
  })
  declare serviceLink: boolean

  private get resourceName(): string {
    return this.name ? normalizeResourceName(this.name) : ''
  }

  private get shouldSkipService(): boolean {
    return !this.service || !this.services
  }

  async interact() {
    if (!this.name) {
      this.name = await this.prompt.ask('Ressource name', {
        result: normalizeResourceName,
        validate: (value) => {
          if (!value) {
            return 'Ressource name is required'
          }
          return true
        },
      })
    }
  }

  async run() {
    if (!this.name) {
      this.logger.error('Ressource name is required')
      this.exitCode = 1
      return
    }

    const resourceName = this.resourceName
    const shouldGenerateRepository = this.model && this.repository

    if (this.validator) {
      const success = await this.execSubCommand('make:validator', [resourceName])
      if (!success) return
    }

    if (this.model) {
      const success = await this.execSubCommand('make:model', [resourceName])
      if (!success) return
    }

    if (this.controller) {
      const success = await this.execSubCommand('make:controller', [resourceName, '--api'])
      if (!success) return
    }

    if (this.migration) {
      const success = await this.execSubCommand('make:migration', [resourceName, '--create'])
      if (!success) return
    }

    if (!this.model && this.repository) {
      this.logger.warning('Skipping repository generation because model generation is disabled')
    }

    if (shouldGenerateRepository) {
      const success = await this.execSubCommand('make:repository', [resourceName])
      if (!success) return
    }

    if (!this.shouldSkipService) {
      const success = await this.execSubCommand('make:service', [resourceName])
      if (!success) return
    }

    if (this.serviceLink && shouldGenerateRepository) {
      await this.linkServiceRepository(resourceName)
    }
  }

  private async execSubCommand(commandName: string, commandArgs: string[]): Promise<boolean> {
    const result = await this.kernel.exec(commandName, commandArgs)
    this.exitCode = result.exitCode
    this.error = result.error

    if (result.exitCode !== 0 || result.error) {
      this.logger.error(`Failed while running "${commandName}"`)
      return false
    }

    return true
  }

  private async linkServiceRepository(resourceName: string): Promise<void> {
    const serviceClassName = `${resourceName}Service`
    const repositoryClassName = `${resourceName}Repository`
    const repositoryImportPath = `#repositories/${toSnakeCase(repositoryClassName)}`
    const servicesDirectory = fileURLToPath(new URL('../app/services', import.meta.url))
    const serviceFilePath = join(servicesDirectory, `${toSnakeCase(serviceClassName)}.ts`)

    try {
      await access(serviceFilePath, constants.F_OK)
    } catch {
      this.logger.warning(`Service file not found at ${serviceFilePath}. Skipping service link.`)
      return
    }

    const originalContent = await readFile(serviceFilePath, 'utf8')
    let updatedContent = originalContent

    updatedContent = ensureInjectImport(updatedContent)
    updatedContent = addImport(
      updatedContent,
      `import ${repositoryClassName} from '${repositoryImportPath}'`
    )

    const classDeclaration = new RegExp(`export class\\s+${escapeRegExp(serviceClassName)}\\s*{`)

    if (!classDeclaration.test(updatedContent)) {
      this.logger.warning(`Service class "${serviceClassName}" not found. Skipping service link.`)
      return
    }

    const classWithInject = new RegExp(
      `@inject\\(\\)\\s*\\nexport class\\s+${escapeRegExp(serviceClassName)}\\s*{`
    )

    if (!classWithInject.test(updatedContent)) {
      updatedContent = updatedContent.replace(classDeclaration, (value) => `@inject()\n${value}`)
    }

    updatedContent = ensureRepositoryOnConstructor(
      updatedContent,
      serviceClassName,
      repositoryClassName
    )

    if (updatedContent === originalContent) {
      this.logger.info(`Service ${serviceClassName} already linked with ${repositoryClassName}`)
      return
    }

    await writeFile(serviceFilePath, updatedContent)
    this.logger.info(`Linked ${repositoryClassName} in ${serviceClassName}`)
  }
}

function addImport(content: string, line: string): string {
  if (content.includes(line)) {
    return content
  }

  const importPattern = /^import .*$/gm
  let lastMatch: RegExpExecArray | null = null
  let match: RegExpExecArray | null = null

  do {
    match = importPattern.exec(content)
    if (match) {
      lastMatch = match
    }
  } while (match)

  if (!lastMatch) {
    return `${line}\n\n${content}`
  }

  const insertAt = lastMatch.index + lastMatch[0].length
  return `${content.slice(0, insertAt)}\n${line}${content.slice(insertAt)}`
}

function ensureInjectImport(content: string): string {
  const coreImport = /import\s*{([^}]*)}\s*from\s*'@adonisjs\/core'/.exec(content)

  if (!coreImport) {
    return addImport(content, "import { inject } from '@adonisjs/core'")
  }

  const imports = coreImport[1]
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)

  if (imports.includes('inject')) {
    return content
  }

  const mergedImport = `import { ${imports.join(', ')}, inject } from '@adonisjs/core'`
  return content.replace(coreImport[0], mergedImport)
}

function ensureRepositoryOnConstructor(
  content: string,
  className: string,
  repositoryClassName: string
): string {
  const classRegex = new RegExp(`export class\\s+${escapeRegExp(className)}\\s*{`)
  const classMatch = classRegex.exec(content)

  if (!classMatch) {
    return content
  }

  const classStart = content.indexOf('{', classMatch.index)
  if (classStart === -1) {
    return content
  }

  const classEnd = findMatchingBrace(content, classStart)
  if (classEnd === -1) {
    return content
  }

  const classBody = content.slice(classStart + 1, classEnd)

  if (new RegExp(`\\b${escapeRegExp(repositoryClassName)}\\b`).test(classBody)) {
    return content
  }

  const constructorPattern = /constructor\s*\(([\s\S]*?)\)\s*{/

  if (constructorPattern.test(classBody)) {
    const updatedBody = classBody.replace(constructorPattern, (value, params: string) => {
      const repositoryParameter = `private readonly repository: ${repositoryClassName}`
      const nextParams = params.trim()
        ? `${params.trim()}, ${repositoryParameter}`
        : repositoryParameter
      return value.replace(params, nextParams)
    })

    return `${content.slice(0, classStart + 1)}${updatedBody}${content.slice(classEnd)}`
  }

  const constructorBlock = `\n  constructor(private readonly repository: ${repositoryClassName}) {}\n`
  const bodyWithoutLeadingBreak = classBody.startsWith('\n') ? classBody.slice(1) : classBody
  const updatedBody = `${constructorBlock}${bodyWithoutLeadingBreak}`

  return `${content.slice(0, classStart + 1)}${updatedBody}${content.slice(classEnd)}`
}

function findMatchingBrace(content: string, openingBraceIndex: number): number {
  let depth = 0

  for (let index = openingBraceIndex; index < content.length; index++) {
    if (content[index] === '{') {
      depth++
    } else if (content[index] === '}') {
      depth--
      if (depth === 0) {
        return index
      }
    }
  }

  return -1
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
