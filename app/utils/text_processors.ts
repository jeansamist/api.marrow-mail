export function toPascalCaseAndStripSuffix(input: string, suffix?: string): string {
  if (!input) return ''

  // Normalize to PascalCase
  const pascal = input
    // Convert camelCase boundaries to separators
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    // Replace underscores, dashes, spaces with a single space
    .replace(/[_\-\s]+/g, ' ')
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('')

  if (!suffix) return pascal

  const normalizedSuffix = suffix.charAt(0).toUpperCase() + suffix.slice(1)

  if (pascal.endsWith(normalizedSuffix)) {
    return pascal.slice(0, -normalizedSuffix.length)
  }

  return pascal
}
export function removeSuffix(value: string, suffix: string): string {
  return value.endsWith(suffix) ? value.slice(0, -suffix.length) : value
}

export function toSnakeCase(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[\s\-]+/g, '_')
    .toLowerCase()
}

const RESOURCE_NAME_SUFFIXES = [
  'Resource',
  'Ressource',
  'Validator',
  'Model',
  'Controller',
  'Repository',
  'Service',
]

export function normalizeResourceName(value: string): string {
  let normalized = toPascalCaseAndStripSuffix(value)

  for (const suffix of RESOURCE_NAME_SUFFIXES) {
    normalized = removeSuffix(normalized, suffix)
  }

  return normalized
}
