## Instruction

1. Write command `npm i` in terminal for install node_modules folder.
2. Steps in Azure Cloud and filling .env file:
   - create "Storage account" in Azure Cloud and fill row in .env file ACCOUNT_NAME;
   - next in "Access keys" section find "Connection string" and fill row in .env file CONNECTION_STRING;
   - next in "Access keys" section find "key1", "key2" and fill rows in .env file VALID_KEY1, VALID_KEY2;
   - last step is creating public and private containers in section "Containers" and fill rows in .env file PUBLIC_CONTAINER, PRIVATE_CONTAINER.
3. Available endpoints:
   - POST http://localhost:4023/upload - for upload file in public container. For testing you can use Insomnia or similar tools. For sending file choose "Multipart From" in body and fill "file" - "choose file";
   - POST http://localhost:4023/upload_private - for upload file in private container. For testing you can use Insomnia or similar tools. For sending file choose "Multipart From" in body and fill "file" - "choose file";
   - GET http://localhost:4023?file-access-key=accessKey&file-unique-id=fileId - for read file by stream from private container.
   - GET http://localhost:4023?file-unique-id=fileId - for read file by stream from public container.
