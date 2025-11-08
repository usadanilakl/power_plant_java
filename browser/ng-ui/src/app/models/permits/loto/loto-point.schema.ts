import { ILotoPoint } from './loto-point.model';
import { RxJsonSchema, RxDocument, toTypedRxJsonSchema } from 'rxdb';

export type LotoPointDocType = ILotoPoint & RxDocument<ILotoPoint, {}>;

const lotoPointSchemaLiteral = {
  title: 'Loto Point Schema',
  version: 0,
  primaryKey: 'tagNumber', // Define tagNumber as the unique identifier
  type: 'object',
  properties: {
    tagNumber: { type: 'string', maxLength: 100 }, // Add maxLength for primary key
    description: { type: ['string', 'null'] },
    specificLocation: { type: ['string', 'null'] },
    generalLocation: { type: ['string', 'null'] },
    normalPosition: { type: ['string', 'null'] },
    isolatedPosition: { type: ['string', 'null'] },
    zeroEnergyMethod: { type: ['string', 'null'] },
    currentPosition: { type: ['string', 'null'] },
    // Base model properties
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
    sharepointId: { type: ['number', 'null'] },
    status: { type: 'string' }
  },
  required: ['tagNumber', 'createdAt', 'updatedAt', 'status']
} as const; // Using "as const" for better type inference with toTypedRxJsonSchema

export const lotoPointSchema: RxJsonSchema<Omit<ILotoPoint, 'id'>> = lotoPointSchemaLiteral;

export const typedLotoPointSchema = toTypedRxJsonSchema(lotoPointSchemaLiteral);