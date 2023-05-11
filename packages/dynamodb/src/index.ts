import { DynamoDB } from "aws-sdk";
import { IStore } from "@herodotus_dev/mmr-core";

export default class DynamoDbStore implements IStore {
  constructor(private db: DynamoDB.DocumentClient, private tableName: string, private primaryKey: string = "key") {}

  async get(key: string): Promise<string> {
    const result = await this.db
      .get({
        TableName: this.tableName,
        Key: { [this.primaryKey]: key },
      })
      .promise()
      .catch((err) => {
        throw new Error(err.message);
      });

    return result.Item?.value;
  }

  async getMany(keys: string[]): Promise<Map<string, string>> {
    const resultMap = new Map<string, string>();
    const promises: Promise<any>[] = [];

    for (let i = 0; i < keys.length; i += 25) {
      const keysBatch = keys.slice(i, i + 25);

      const requestItems: any = {};
      requestItems[this.tableName] = {
        Keys: keysBatch.map((key) => ({ [this.primaryKey]: key })),
      };

      promises.push(
        this.db
          .batchGet({ RequestItems: requestItems })
          .promise()
          .then((response) => {
            response.Responses?.[this.tableName].forEach((item) => resultMap.set(item[this.primaryKey], item.value));
          })
      );
    }

    await Promise.all(promises).catch((err) => {
      throw new Error(err.message);
    });

    return resultMap;
  }

  async set(key: string, value: string): Promise<void> {
    await this.db
      .put({
        TableName: this.tableName,
        Item: { [this.primaryKey]: key, value },
      })
      .promise()
      .catch((err) => {
        throw new Error(err.message);
      });
  }

  async setMany(entries: Map<string, string>): Promise<void> {
    const entriesArray = Array.from(entries.entries());
    const promises: Promise<any>[] = [];

    for (let i = 0; i < entriesArray.length; i += 25) {
      const entriesBatch = entriesArray.slice(i, i + 25);

      const requestItems: any = {};
      requestItems[this.tableName] = entriesBatch.map(([key, value]) => ({
        PutRequest: {
          Item: { [this.primaryKey]: key, value },
        },
      }));

      promises.push(this.db.batchWrite({ RequestItems: requestItems }).promise());
    }

    await Promise.all(promises).catch((err) => {
      throw new Error(err.message);
    });
  }

  async delete(key: string): Promise<void> {
    await this.db
      .delete({
        TableName: this.tableName,
        Key: { [this.primaryKey]: key },
      })
      .promise()
      .catch((err) => {
        throw new Error(err.message);
      });
  }

  async deleteMany(keys: string[]): Promise<void> {
    const promises: Promise<any>[] = [];

    for (let i = 0; i < keys.length; i += 25) {
      const keysBatch = keys.slice(i, i + 25);

      const requestItems: any = {};
      requestItems[this.tableName] = keysBatch.map((key) => ({
        DeleteRequest: {
          Key: { [this.primaryKey]: key },
        },
      }));

      promises.push(this.db.batchWrite({ RequestItems: requestItems }).promise());
    }

    await Promise.all(promises).catch((err) => {
      throw new Error(err.message);
    });
  }
}
