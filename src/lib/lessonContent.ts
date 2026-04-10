type UnknownRecord = Record<string, unknown>

export type LessonAsset = {
  url?: string
  fileName?: string
  mimeType?: string
  size?: number
  publicId?: string
  resourceType?: string
  provider?: string
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function getString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value : undefined
}

function getNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined
}

export function getLessonAsset(contentData?: UnknownRecord | null): LessonAsset {
  const safeContentData = isRecord(contentData) ? contentData : {}
  const fileAttachment = isRecord(safeContentData.fileAttachment) ? safeContentData.fileAttachment : {}

  return {
    url: getString(fileAttachment.url) ?? getString(safeContentData.fileUrl),
    fileName: getString(fileAttachment.fileName) ?? getString(safeContentData.fileName),
    mimeType: getString(fileAttachment.mimeType),
    size: getNumber(fileAttachment.size),
    publicId: getString(fileAttachment.publicId),
    resourceType: getString(fileAttachment.resourceType),
    provider: getString(fileAttachment.provider),
  }
}

export function buildLessonContentData({
  fileUrl,
  fileName,
  existingContentData,
}: {
  fileUrl?: string
  fileName?: string
  existingContentData?: UnknownRecord | null
}): UnknownRecord | undefined {
  const nextContentData = isRecord(existingContentData) ? { ...existingContentData } : {}

  if (!fileUrl) {
    delete nextContentData.fileUrl
    delete nextContentData.fileName
    delete nextContentData.fileAttachment
    return Object.keys(nextContentData).length > 0 ? nextContentData : undefined
  }

  const nextAttachment = isRecord(nextContentData.fileAttachment) ? { ...nextContentData.fileAttachment } : {}
  nextAttachment.url = fileUrl

  nextContentData.fileUrl = fileUrl

  if (fileName?.trim()) {
    nextAttachment.fileName = fileName.trim()
    nextContentData.fileName = fileName.trim()
  } else {
    delete nextAttachment.fileName
    delete nextContentData.fileName
  }

  nextContentData.fileAttachment = nextAttachment

  return nextContentData
}
