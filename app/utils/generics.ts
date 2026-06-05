import type { LucidModel } from '@adonisjs/lucid/types/model'
import type { ModelRelations } from '@adonisjs/lucid/types/relations'

// Generic utility to extract only the properties (exclude methods) of a class
export type ModelProps<T> = {
  [K in keyof T as K extends string
    ? K extends `$${string}` // omit $-prefixed
      ? never
      : K extends 'id' | 'createdAt' | 'updatedAt' // omit these
        ? never
        : T[K] extends Function // omit methods
          ? never
          : NonNullable<T[K]> extends ModelRelations<LucidModel, LucidModel> // omit lucid relations
            ? never
            : K
    : never]: T[K]
}
