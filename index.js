const config = require("./config.json");
const catalog = require("./catalog");
const cosmos = require("./cosmos");

async function startMigration() {
  cosmosReady = cosmos.init(config);
  catalogReady = await catalog.init(config.msftAuthUrl, config.msftClientId, config.msftScope, config.msoftOauthClientSecret);

  if (cosmosReady && catalogReady.statusMessage == "OK") {
    const { copied, items } = await cosmos.copyItemsToNewContainer(
      config.cosmosNewContainerId
    );

    let migratedItem = null;
    let reinserted = 0;
    for (const index in items) {
      const item = items[index];
      let hasBeenDeleted = false;
      try {
        migratedItem = migrate(item);
        const resp = await catalog.insertRecord(migratedItem, config.catalogUrl, config.apiMSubscriptionKey);
        hasBeenDeleted = await cosmos.deleteItem(item);
        if (hasBeenDeleted && resp.statusMessage == "Created") {
          reinserted += 1;
        }
      } catch (err) {
        console.log(`There was an error with Item: ${item.id} \n\n`);
        console.log(err);
      }
    }

    // Validating everything has been copied and deleteing the temporal collection.
    if (copied == reinserted) {
      cosmos.deleteContainer(config.cosmosNewContainerId);
    }
  }
}

function isComputer(item) {
  const computer = {
    Laptop: true,
    Desktop: true,
    Workstation: true,
    Tablet: true,
  };

  const res = computer[item.category] || false;
  return res;
}

function deleteUnwantedProps(data) {
  const unwantedProps = ["_etag", "_rid", "_self", "_attachments", "_ts"];
  unwantedProps.forEach(prop => {
    if (data.hasOwnProperty(prop)) {
      delete data[prop];
    }
  });
}

function migrate(item) {
  deleteUnwantedProps(item);
  const migratedItem = JSON.parse(JSON.stringify(item));
  // Setting active in true
  migratedItem.active = true;

  // Removing available property and alertMessage
  delete migratedItem.available;
  delete migratedItem.alertMessage;

  // Move model, manufacturer and highlightedFeatures inside details
  migratedItem.details.model = item.model;
  migratedItem.details.manufacturer = item.manufacturer;
  migratedItem.details.highlightedFeatures = item.highlightedFeatures;
  delete migratedItem.model;
  delete migratedItem.manufacturer;
  delete migratedItem.highlightedFeatures;

  // Remove configuration array and conver it to object
  let configuration = {}
  if (item.details.configurations && item.details.configurations[0]) {
    configuration = item.details.configurations[0];
  }
  migratedItem.details.configuration = configuration;
  delete migratedItem.details.configurations;

  // Remove skus array and conver it to skuInfo object
  let skuInfo = {}
  if (configuration.skus && configuration.skus[0]) {
    skuInfo = configuration.skus[0];
  }
  skuInfo.sku = skuInfo.vendorSku;
  delete skuInfo.id;
  delete skuInfo.vendorSku;
  delete skuInfo.active;
  migratedItem.details.configuration.skuInfo = skuInfo;
  delete migratedItem.details.configuration.skus;

  if (isComputer(item)) {
    migratedItem.details.class = "computer";
  } else {
    migratedItem.details.class = "accessory";
    migratedItem.details.configuration.skuInfo.language = skuInfo.keyboardLanguage;
    delete migratedItem.details.configuration.skuInfo.keyboardLanguage;
  }

  return migratedItem
}

startMigration();
