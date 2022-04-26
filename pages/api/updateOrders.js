import Contract from "web3-eth-contract";
import fs from "fs";

Contract.setProvider(
  "https://rinkeby.infura.io/v3/af7a38f98bcd4ebbbc7c0c844640104f"
);
// Contract.setProvider("HTTP://127.0.0.1:8545");
const addressesObject = require("../../contractData.json");
const ContractAddress = addressesObject["mainContract"];
const compiledContract = require("../../compiledContract.json");
const ABI = compiledContract["abi"];
const myContract = new Contract(ABI, ContractAddress);

// const assetData = require("../../orders.json");
const assetData = {};
let orderCounto = 0;

const updateOrders = async () => {
  let orderCount = await myContract.methods
    .orderCount()
    .call()
    .then((resp) => {
      return resp;
    })
    .catch((err) => {
      return "Error";
    });
  orderCounto = orderCount;
  let isCounting = true;
  let orderId = 1;
  while (isCounting) {
    await myContract.methods
      .orderIdToProductId(orderId)
      .call()
      .then(async (resp) => {
        let productId = parseInt(resp);
        if (productId > 0) {
          let status = "";
          let user = "";
          await myContract.methods
            .orderIdTostatus(orderId)
            .call()
            .then((resp) => {
              status = resp;
            })
            .catch((err) => {
              status = "error";
            });
          await myContract.methods
            .orderIdTouserId(orderId)
            .call()
            .then((resp) => {
              user = resp;
            })
            .catch((err) => {
              user = "error";
            });
          assetData[orderId] = {
            productId: productId,
            status: status,
            user: user,
          };
        } else {
          isCounting = false;
        }
      })
      .catch((err) => {
        isCounting = false;
      });
    orderId++;
  }
  let assetDataJson = JSON.stringify(assetData);
  fs.writeFile("orders.json", assetDataJson, (err) => {
    throw err;
  });
};

export default async function handler(req, res) {
  await updateOrders();
  res.status(200).json({ status: orderCounto });
}
