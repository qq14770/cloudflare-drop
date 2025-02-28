import { z } from 'zod'
import { Context } from 'hono'
import { eq } from 'drizzle-orm'

import { Endpoint } from '../endpoint'
import { files, fileSelectSchema } from '../../data/schemas'

export class FileFetch extends Endpoint {
  schema = {
    request: {
      params: z.object({
        id: z.string(),
      }),
    },
    responses: {
      '200': {
        description: 'Returns a single file if found',
        content: {
          'application/json': {
            schema: fileSelectSchema,
          },
        },
      },
      '404': {
        description: 'File not found',
        content: {
          'application/json': {
            schema: z.object({
              message: z.string(),
            }),
          },
        },
      },
    },
  }

  async handle(c: Context) {
    const data = await this.getValidatedData<typeof this.schema>()
    const id = data.params.id
    const db = this.getDB(c)
    const [record] = await db.select().from(files).where(eq(files.id, id))
    const kv = this.getKV(c)
    if (!record) {
      return new Response('Invalid object ID', {
        status: 400,
        headers: {
          'Content-Type': 'plain/text',
        },
      })
    }
    const objectId = record.objectId

    const file = await kv.get(objectId, 'arrayBuffer')

    if (!file) {
      return new Response('Not found', {
        status: 404,
        headers: {
          'Content-Type': 'plain/text',
        },
      })
    }

    const isText = record.type === 'plain/string'

    return new Response(file, {
      status: 200,
      headers: new Headers({
        'Content-Type': isText
          ? 'plain/text'
          : (record.type ?? 'application/octet-stream'),
        'Content-Disposition':
          isText || record.is_encrypted
            ? 'inline'
            : `attachment; filename="${record.filename}"`,
      }),
    })
  }
}
