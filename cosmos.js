const { CosmosClient } = require("@azure/cosmos");
let cosmosClient = null;
let database = null;
let container = null;

function init(config) {
  cosmosClient = new CosmosClient({
    endpoint: config.cosmosEndPoint,
    key: config.cosmosPrimaryKey
  });
  database = cosmosClient.database(config.cosmosDatabaseId);
  container = database.container(config.cosmosContainerId);
  return true;
}

// Get all records
async function getAllRecords() {
  return container.items.readAll().fetchAll();
}

// Creates new container
async function createNewContainer(containerId) {
  const partitionKeyDef = {
    paths: ["/tenantId"]
  };
  resp = await database.containers.createIfNotExists({
    id: containerId,
    partitionKey: partitionKeyDef
  });
  return resp.container;
}

// Insert items in a container
async function insertItems(items, container) {
  let inserted = 0;
  for (const itemIndex in items) {
    await container.items.create(items[itemIndex]);
    inserted += 1;
  }
  return inserted;
}

// Copy items from original container to new container
async function copyItemsToNewContainer(containerId) {
  const { resources } = await getAllRecords();
  let newContainer = await createNewContainer(containerId);
  let copied = await insertItems(resources, newContainer);
  resp = {
    copied,
    items: resources
  };
  return resp;
}

// Delete Items from Original container
async function deleteItem(item) {
  await container.item(item.id, item.tenantId).delete();
  return true;
}

// Delete container (used to delete the new container when we are done)
async function deleteContainer(containerId) {
  const containerToDelete = cosmosClient
    .database(cosmosDatabaseId)
    .container(containerId);
  await containerToDelete.delete();
  return true;
}

module.exports = {
  init,
  copyItemsToNewContainer,
  deleteItem,
  deleteContainer
};
