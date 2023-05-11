import {
  BatchGetItemCommand,
  BatchWriteItemCommand,
  DeleteItemCommand,
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  ScanCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { IStore } from "@herodotus_dev/mmr-core";

export default class DynamoDbStore implements IStore {
  constructor(private db: DynamoDBClient, private tableName: string, private primaryKey: string = "key") {}

  async get(key: string): Promise<string> {
    try {
      const result = await this.db.send(
        new GetItemCommand({
          TableName: this.tableName,
          Key: marshall({ [this.primaryKey]: key }),
        })
      );

      if (!result.Item) return null;
      const item = unmarshall(result.Item);
      return item?.value ?? null;
    } catch (err) {
      throw new Error(err.message);
    }
  }

  async set(key: string, value: string): Promise<void> {
    try {
      await this.db.send(
        new PutItemCommand({
          TableName: this.tableName,
          Item: marshall({ [this.primaryKey]: key, value }),
        })
      );
    } catch (err) {
      throw new Error(err.message);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.db.send(
        new DeleteItemCommand({
          TableName: this.tableName,
          Key: marshall({ [this.primaryKey]: key }),
        })
      );
    } catch (err) {
      throw new Error(err.message);
    }
  }

  async getMany(keys: string[]): Promise<Map<string, string>> {
    const resultMap = new Map<string, string>();
    const promises: Promise<any>[] = [];

    for (let i = 0; i < keys.length; i += 100) {
      const keysBatch = keys.slice(i, i + 100);

      const requestItems: any = {};
      requestItems[this.tableName] = {
        Keys: keysBatch.map((key) => marshall({ [this.primaryKey]: key })),
      };

      promises.push(
        this.db.send(new BatchGetItemCommand({ RequestItems: requestItems })).then((response) => {
          response.Responses?.[this.tableName].forEach((item) => {
            const unmarshalledItem = unmarshall(item);
            resultMap.set(unmarshalledItem[this.primaryKey], unmarshalledItem.value);
          });
        })
      );
    }

    try {
      await Promise.all(promises);
    } catch (err) {
      throw new Error(err.message);
    }

    return resultMap;
  }

  async setMany(entries: Map<string, string>): Promise<void> {
    const entriesArray = Array.from(entries.entries());
    const promises: Promise<any>[] = [];

    for (let i = 0; i < entriesArray.length; i += 25) {
      const entriesBatch = entriesArray.slice(i, i + 25);

      const requestItems: any = {};
      requestItems[this.tableName] = entriesBatch.map(([key, value]) => ({
        PutRequest: {
          Item: marshall({ [this.primaryKey]: key, value }),
        },
      }));

      promises.push(this.db.send(new BatchWriteItemCommand({ RequestItems: requestItems })));
    }

    try {
      await Promise.all(promises);
    } catch (err) {
      throw new Error(err.message);
    }
  }

  async deleteMany(keys: string[]): Promise<void> {
    const promises: Promise<any>[] = [];

    for (let i = 0; i < keys.length; i += 25) {
      const keysBatch = keys.slice(i, i + 25);

      const requestItems: any = {};
      requestItems[this.tableName] = keysBatch.map((key) => ({
        DeleteRequest: {
          Key: marshall({ [this.primaryKey]: key }),
        },
      }));

      promises.push(this.db.send(new BatchWriteItemCommand({ RequestItems: requestItems })));
    }

    try {
      await Promise.all(promises);
    } catch (err) {
      throw new Error(err.message);
    }
  }

  async deleteAll(): Promise<void> {
    let items: any[];
    let lastEvaluatedKey: any;
    const promises: Promise<any>[] = [];

    do {
      const scanResult = await this.db.send(
        new ScanCommand({
          TableName: this.tableName,
          ExclusiveStartKey: lastEvaluatedKey,
        })
      );

      items = scanResult.Items || [];
      lastEvaluatedKey = scanResult.LastEvaluatedKey;

      for (let i = 0; i < items.length; i += 25) {
        const itemsBatch = items.slice(i, i + 25);

        const requestItems: any = {};
        requestItems[this.tableName] = itemsBatch.map((item) => ({
          DeleteRequest: {
            Key: marshall({ [this.primaryKey]: unmarshall(item)[this.primaryKey] }),
          },
        }));

        promises.push(this.db.send(new BatchWriteItemCommand({ RequestItems: requestItems })));
      }
    } while (lastEvaluatedKey);

    try {
      await Promise.all(promises);
    } catch (err) {
      throw new Error(err.message);
    }
  }
}
