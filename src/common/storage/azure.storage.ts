import * as fs from 'fs';
import { BlobServiceClient } from '@azure/storage-blob';
import * as path from 'path';

const AZURE_CONNECTION_STRING = process.env.AZURE_CONNECTION_STRING!;
const AZURE_CONTAINER_NAME = process.env.AZURE_CONTAINER_NAME!;

export async function uploadToAzureBlob(filePath: string): Promise<string> {
  const blobServiceClient = BlobServiceClient.fromConnectionString(
    AZURE_CONNECTION_STRING,
  );
  const containerClient =
    blobServiceClient.getContainerClient(AZURE_CONTAINER_NAME);

  const blobName = path.basename(filePath);
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  const stream = fs.createReadStream(filePath);
  await blockBlobClient.uploadStream(stream);

  return blockBlobClient.url;
}
