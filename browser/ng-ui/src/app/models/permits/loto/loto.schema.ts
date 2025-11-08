import { RxJsonSchema, RxDocument, toTypedRxJsonSchema } from 'rxdb';
import { ILoto } from './loto.model';

// This is the type of the document data stored in the database.
// We only omit 'lotoPoints' to replace it with an array of strings.
type LotoDocData = Omit<ILoto, 'lotoPoints'> & { lotoPoints: string[] };

// This is the fully-typed RxDB document, including instance methods.
export type LotoDocType = LotoDocData & RxDocument<LotoDocData, {}>;

const lotoSchemaLiteral = {
  title: 'Loto Schema',
  version: 0,
  description: 'Describes a LOTO procedure',
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 100 },
    description: { type: 'string' },
    lotoPoints: {
      type: 'array',
      ref: 'lotopoints', // This creates the relationship to the lotopoints collection
      items: {
        type: 'string' // The array will contain the primary keys ('tagNumber') of the loto points
      }
    },
    // Base model properties
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
    sharepointId: { type: ['number', 'null'] },
    status: { type: 'string' }
  },
  required: ['id', 'description', 'createdAt', 'updatedAt', 'status'],
  indexes: ['createdAt', 'updatedAt', 'sharepointId']
} as const;

// The generic type for the schema must match the data structure.
export const lotoSchema: RxJsonSchema<LotoDocData> = lotoSchemaLiteral;

export const typedLotoSchema = toTypedRxJsonSchema(lotoSchemaLiteral);