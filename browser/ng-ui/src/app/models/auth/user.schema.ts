import { RxJsonSchema } from 'rxdb';
import { IUser } from '../../models/auth/user.model';

export type UserDocType = IUser;

export const userSchema: RxJsonSchema<UserDocType> = {
  title: 'User Schema',
  description: 'Describes a user in the system',
  version: 0,
  keyCompression: true,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: {
      type: 'string',
      maxLength: 100
    },
    firstName: {
      type: 'string'
    },
    lastName: {
      type: 'string'
    },
    company: {
      type: 'string'
    },
    email: {
      type: 'string'
    },
    role: {
      type: 'string'
    },
    password: {
      type: ['string', 'null']
    },
    sharepointId: {
      type: ['number', 'null']
    },
    status: {
      type: 'string',
      default: 'active'
    },
    createdAt: {
      type: 'string',
      format: 'date-time'
    },
    updatedAt: {
      type: 'string',
      format: 'date-time'
    }
  },
  required: ['id', 'firstName', 'lastName', 'email', 'role', 'status', 'createdAt', 'updatedAt'],
  indexes: ['email', 'sharepointId', 'status', 'updatedAt']
};