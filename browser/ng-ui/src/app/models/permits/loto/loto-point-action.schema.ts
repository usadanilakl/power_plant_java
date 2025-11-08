import { RxJsonSchema, toTypedRxJsonSchema } from 'rxdb';
import { ILotoPointAction } from './loto-point-action.model';

// The document type will store IDs for related documents.
export type LotoPointActionDocType = Omit<ILotoPointAction, 'actionBy'> & {
  actionBy: string; // Stores the user's ID
  lotoPointId: string; // Stores the LotoPoint's ID
};

export const lotoPointActionSchema: RxJsonSchema<LotoPointActionDocType> = {
  title: 'Loto Point Action Schema',
  version: 0,
  description: 'Describes an action taken on a LOTO point',
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 100 },
    description: { type: 'string' },
    actionDate: { type: 'string', format: 'date-time' },
    actionBy: {
      type: 'string',
      ref: 'users' // This creates a relationship to the 'users' collection
    },
    lotoPointId: {
      type: 'string',
      ref: 'lotopoints' // This creates a relationship to a future 'lotopoints' collection
    },
    // Base model properties
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
    status: { type: 'string' }
  },
  required: ['id', 'description', 'actionDate', 'actionBy', 'lotoPointId', 'createdAt', 'updatedAt'],
  indexes: ['createdAt', 'actionBy', 'lotoPointId']
};

export const typedLotoPointActionSchema = toTypedRxJsonSchema(lotoPointActionSchema);