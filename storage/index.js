'use strict'

/**
 * Module dependencies.
 */
const {
    StorageSharedKeyCredential,
    DataLakeServiceClient
} = require('@azure/storage-file-datalake');

var Storage = function(accountName, accountKey, fileSystem) { 
  const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);

  console.log(`Account: ${accountName} -${fileSystem}`);

  this.serviceClient = new DataLakeServiceClient(
    `https://${accountName}.dfs.core.windows.net`,
    sharedKeyCredential
  );

  this.fileSystemClient = this.serviceClient.getFileSystemClient(fileSystem);

}

/**
 * Stream the File
 * 
 * @param {string} directory the Directory within the File System 
 * @param {string} fileName the Name of the file
 * @returns {stream} a stram to the file 
 */
Storage.prototype.readFileStream = async function(directory, fileName, res) {
  console.log(`Directory: ${directory} - ${fileName}`);
  var directoryClient = this.fileSystemClient.getDirectoryClient(directory);

  const fileClient = directoryClient.getFileClient(fileName);
  var readFileResponse = await fileClient.read();
  res.setHeader("content-type", "application/pdf");

  readFileResponse.readableStreamBody.pipe(res);
    
}

module.exports = Storage;