const assetData = require("../../orders.json");

export default function handler(req, res) {
  const { query: userId, method } = req;

  let myOrders = {};

  if (Object.keys(assetData).length > 0) {
    for (let i = 1; i <= Object.keys(assetData).length; i++) {
      if (assetData[i]["user"] === userId["userId"]) {
        myOrders[i] = { ...assetData[i], orderId: i };
      }
    }
  }

  res.status(200).json({ ...myOrders });
}
