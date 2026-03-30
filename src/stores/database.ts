import { signal } from '@preact/signals'
import type { DatabaseSchema, Database, DatabaseColumn } from '../types'
import { createSchema, getSchemas, getSchema, updateSchema as updateSchemaDb, deleteSchema as deleteSchemaDb, getDatabaseBySchema, createDatabase as createDatabaseDb, addDatabaseRow as addRowDb, updateDatabaseRow as updateRowDb, deleteDatabaseRow as deleteRowDb, getDatabases } from '../lib/db'

export const schemas = signal<DatabaseSchema[]>([])
export const activeSchemaId = signal<string | null>(null)
export const activeSchema = signal<DatabaseSchema | null>(null)
export const databases = signal<Database[]>([])
export const activeDatabase = signal<Database | null>(null)
export const isLoading = signal(false)

export async function loadSchemas() {
  isLoading.value = true
  try {
    schemas.value = await getSchemas()
    databases.value = await getDatabases()
  } finally {
    isLoading.value = false
  }
}

export async function getDatabaseById(schemaId: string): Promise<Database | undefined> {
  return getDatabaseBySchema(schemaId)
}

export async function getSchemaById(schemaId: string): Promise<DatabaseSchema | undefined> {
  return getSchema(schemaId)
}

export async function addSchema(name: string) {
  const schema = await createSchema(name)
  schemas.value = [...schemas.value, schema]
  return schema
}

export async function removeSchema(id: string) {
  await deleteSchemaDb(id)
  schemas.value = schemas.value.filter((s: DatabaseSchema) => s.id !== id)
  if (activeSchemaId.value === id) {
    activeSchemaId.value = null
    activeSchema.value = null
  }
}

export async function renameSchema(id: string, newName: string) {
  const schema = await getSchema(id)
  if (schema) {
    await updateSchemaDb(id, { name: newName })
    schemas.value = schemas.value.map((s: DatabaseSchema) => s.id === id ? { ...s, name: newName } : s)
    if (activeSchemaId.value === id) {
      activeSchema.value = { ...activeSchema.value!, name: newName }
    }
  }
}

export async function saveSchema(schema: DatabaseSchema) {
  await updateSchemaDb(schema.id, schema)
  schemas.value = schemas.value.map((s: DatabaseSchema) => s.id === schema.id ? schema : s)
  if (activeSchemaId.value === schema.id) {
    activeSchema.value = schema
  }
}

export async function selectSchema(id: string) {
  isLoading.value = true
  try {
    const schema = await getSchema(id)
    if (schema) {
      activeSchemaId.value = id
      activeSchema.value = schema
      const db = await getDatabaseBySchema(id)
      activeDatabase.value = db ?? null
    }
  } finally {
    isLoading.value = false
  }
}

export async function addDatabase() {
  if (!activeSchemaId.value) return
  const db = await createDatabaseDb(activeSchemaId.value)
  databases.value = [...databases.value, db]
  activeDatabase.value = db
  return db
}

export async function addColumnToSchema(column: DatabaseColumn) {
  if (!activeSchema.value) return
  const updatedSchema = {
    ...activeSchema.value,
    columns: [...activeSchema.value.columns, column]
  }
  await saveSchema(updatedSchema)
}

export async function updateColumnInSchema(columnId: string, updates: Partial<DatabaseColumn>) {
  if (!activeSchema.value) return
  const updatedSchema = {
    ...activeSchema.value,
    columns: activeSchema.value.columns.map(c => 
      c.id === columnId ? { ...c, ...updates } : c
    )
  }
  await saveSchema(updatedSchema)
}

export async function deleteColumnFromSchema(columnId: string) {
  if (!activeSchema.value) return
  const updatedSchema = {
    ...activeSchema.value,
    columns: activeSchema.value.columns.filter(c => c.id !== columnId)
  }
  await saveSchema(updatedSchema)
}

export async function addRowToDatabase(row: Record<string, unknown>) {
  if (!activeDatabase.value) return
  await addRowDb(activeDatabase.value.id, row)
  const updated = await getDatabaseBySchema(activeSchemaId.value!)
  if (updated) {
    activeDatabase.value = updated
    databases.value = databases.value.map(d => d.id === updated.id ? updated : d)
  }
}

export async function updateRowInDatabase(rowId: string, updates: Record<string, unknown>) {
  if (!activeDatabase.value) return
  await updateRowDb(activeDatabase.value.id, rowId, updates)
  const updated = await getDatabaseBySchema(activeSchemaId.value!)
  if (updated) {
    activeDatabase.value = updated
    databases.value = databases.value.map(d => d.id === updated.id ? updated : d)
  }
}

export async function deleteRowFromDatabase(rowId: string) {
  if (!activeDatabase.value) return
  await deleteRowDb(activeDatabase.value.id, rowId)
  const updated = await getDatabaseBySchema(activeSchemaId.value!)
  if (updated) {
    activeDatabase.value = updated
    databases.value = databases.value.map(d => d.id === updated.id ? updated : d)
  }
}