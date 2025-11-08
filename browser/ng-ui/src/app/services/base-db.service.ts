import { RxdbService, MyDatabaseCollections } from './rxdb.service';
import { RxCollection } from 'rxdb';
import { BaseModel } from '../../models/permits/base.model';

// This interface ensures that the model class has a constructor that can be called with `new`
interface IModel<T> {
  new (data: any): T;
}

export abstract class BaseDbService<
  ModelType extends BaseModel<any>,
  DocType,
  CollectionType extends RxCollection<DocType>
> {
  constructor(
    protected rxdbService: RxdbService,
    private modelConstructor: IModel<ModelType>,
    private collectionName: keyof MyDatabaseCollections
  ) {}

  protected async _getCollection(): Promise<CollectionType> {
    const db = await this.rxdbService.getDb();
    return db[this.collectionName] as CollectionType;
  }

  async getAll(): Promise<ModelType[]> {
    const collection = await this._getCollection();
    const docs = await collection.find().exec();
    return docs.map(doc => new this.modelConstructor(doc.toJSON()));
  }

  async getById(id: string): Promise<ModelType | null> {
    const collection = await this._getCollection();
    const doc = await collection.findOne(id).exec();
    return doc ? new this.modelConstructor(doc.toJSON()) : null;
  }

  async add(item: ModelType): Promise<DocType> {
    const collection = await this._getCollection();
    const data = item.toObject ? item.toObject() : { ...item };
    return collection.insert(data);
  }

  async update(item: ModelType): Promise<DocType> {
    const collection = await this._getCollection();
    const doc = await collection.findOne(item.id).exec();
    if (!doc) {
      throw new Error(`${this.collectionName} with id ${item.id} not found`);
    }
    const data = item.toObject ? item.toObject() : { ...item };
    return doc.patch(data);
  }

  async remove(id: string): Promise<any> {
    const collection = await this._getCollection();
    const doc = await collection.findOne(id).exec();
    if (doc) {
      return doc.remove();
    }
  }
}