import React from "react";
import { useEffect, useReducer, useState } from "react";
import { useEthers } from "@usedapp/core";

import Web3 from "web3";
import Contract from "web3-eth-contract";
Contract.setProvider(Web3.givenProvider);
const addressesObject = require("../contractData.json");
// Game Contract
const mainContractAddress = addressesObject["mainContract"];
const compiledContract = require("../compiledContract.json");
const mainABI = compiledContract["abi"];
const mainContract = new Contract(mainABI, mainContractAddress);
// Token Contract
const tokenContractAddress = addressesObject["beanContract"];
const compiledTokenContract = require("../compiledTokenContract.json");
const tokenABI = compiledTokenContract["abi"];
const tokenContract = new Contract(tokenABI, tokenContractAddress);

const Counter = () => {
  const { account } = useEthers();
  const [redeem, setRedeem] = useState(false);
  const [status, setStatus] = useState("");
  const productImages = {
    Mocha:
      "https://media1.popsugar-assets.com/files/thumbor/_sz9ibo9HCdBGNBUXeUqnV067-E/fit-in/2048xorig/filters:format_auto-!!-:strip_icc-!!-/2018/12/22/241/n/1922195/aee271bf5c1f134d149c29.72582828_/i/Starbucks-Black-White-Mocha-Drinks-2018.jpg",
    Latte:
      "https://coffeeatthree.com/wp-content/uploads/starbucks-latte-guide-1.jpg",
    Americano:
      "https://www.foodierate.com/uploads/fullsize/111/1FBGLo5ca71d2ca7f99_menu-starbucks-indonesia-caffe-americano-min.jpeg",
  };

  const orderStatus = { 0: "UNPLACED", 1: "LIVE", 2: "FULFILLED" };
  const reducer = (state, action) => {
    switch (action.type) {
      case "name":
        return { ...state, name: action.payload.name };
      case "id":
        return { ...state, id: action.payload.id };
      case "phone":
        return { ...state, phone: action.payload.phone };
      case "location":
        return { ...state, location: action.payload.location };
      case "discount":
        return { ...state, discount: action.payload.discount };
      case "tokenBalance":
        return { ...state, tokenBalance: action.payload.tokenBalance };
      case "collateral":
        return { ...state, collateral: action.payload.collateral };
      case "orders":
        return { ...state, orders: action.payload.orders };
      case "products":
        return { ...state, products: action.payload.products };
    }
  };
  const [state, dispatch] = useReducer(reducer, {
    name: "",
    id: 0,
    tokenBalance: 0,
    discount: "loading...",
    phone: "loading...",
    location: "loading...",
    collateral: 1,
    orders: [],
    products: [],
  });

  useEffect(() => {
    poppulateUserData();
    poppulateStoreData();
  }, []);

  const getMyOrders = async (userId) => {
    // let myorders = await fetch("/api/getMyOrders?userId=" + userId).then(
    //   (resp) => {
    //     return resp.json();
    //   }
    // );
    // let orders = [];
    // for (let i = 1; i <= Object.keys(myorders).length; i++) {
    //   orders.push(myorders[Object.keys(myorders)[i - 1]]);
    // }
    // dispatch({ type: "orders", payload: { orders: orders } });
    setStatus("Updating Orders...");
    let orders = [];
    let orderCount = await mainContract.methods
      .orderCount()
      .call()
      .then((resp) => {
        return parseInt(resp);
      })
      .catch((err) => {
        setStatus(
          "Something went wrong while updating orders. Please refresh."
        );
        return 0;
      });
    for (let i = 1; i <= orderCount; i++) {
      let user = await mainContract.methods
        .orderIdTouserId(i)
        .call()
        .then((resp) => {
          return resp;
        })
        .catch((err) => {
          setStatus(
            "Something went wrong while updating orders. Please refresh."
          );
          return 0;
        });

      if (parseInt(user) === parseInt(userId)) {
        let productId = await mainContract.methods
          .orderIdToProductId(i)
          .call()
          .then((resp) => {
            return resp;
          })
          .catch((err) => {
            return 0;
          });
        let status = await mainContract.methods
          .orderIdTostatus(i)
          .call()
          .then((resp) => {
            return resp;
          })
          .catch((err) => {
            return 0;
          });
        let orderData = {
          productId: productId,
          status: status,
          user: user,
          orderId: i,
        };
        orders.push(orderData);
        dispatch({ type: "orders", payload: { orders: orders } });
      }
    }
    setStatus("");
  };

  const poppulateUserData = async () => {
    mainContract.methods
      .userToId(account)
      .call()
      .then((resp) => {
        let userId = resp;
        console.log("UserId---------------------------", userId);
        dispatch({ type: "id", payload: { id: userId } });
        getMyOrders(userId);
        mainContract.methods
          .userIdToName(userId)
          .call()
          .then((resp) => {
            dispatch({ type: "name", payload: { name: resp } });
            mainContract.methods
              .userIdToPhone(userId)
              .call()
              .then((resp) => {
                dispatch({ type: "phone", payload: { phone: resp } });
                mainContract.methods
                  .userIdToLocation(userId)
                  .call()
                  .then((resp) => {
                    dispatch({ type: "location", payload: { location: resp } });
                    mainContract.methods
                      .userIdToDiscount(userId)
                      .call()
                      .then((resp) => {
                        let discount = Web3.utils.fromWei(resp, "ether");
                        dispatch({
                          type: "discount",
                          payload: { discount: discount },
                        });
                      });
                  });
              });
          });
      });
    tokenContract.methods
      .balanceOf(account)
      .call()
      .then((resp) => {
        let balance = Web3.utils.fromWei(resp, "ether");
        dispatch({ type: "tokenBalance", payload: { tokenBalance: balance } });
      });
  };

  const poppulateStoreData = async () => {
    let productData = [];
    let productCount = await mainContract.methods
      .productCount()
      .call()
      .then((resp) => {
        return parseInt(resp);
      })
      .catch((err) => {
        return "Server error";
      });

    if (productCount !== "Server error") {
      for (let productId = 1; productId <= productCount; productId++) {
        let productName = "";
        let productPrice = 0;
        await mainContract.methods
          .productIdToName(productId)
          .call()
          .then((resp) => {
            productName = resp;
          })
          .catch((err) => {
            productName = "error";
          });
        await mainContract.methods
          .productIdToPrice(productId)
          .call()
          .then((resp) => {
            productPrice = Web3.utils.fromWei(resp, "ether");
          })
          .catch((err) => {
            productPrice = 0;
          });
        productData.push({
          name: productName,
          price: productPrice,
          id: productId,
        });
      }
      dispatch({ type: "products", payload: { products: productData } });
      await mainContract.methods
        .collateral()
        .call()
        .then((resp) => {
          dispatch({
            type: "collateral",
            payload: { collateral: parseInt(resp) },
          });
        })
        .catch((err) => {
          console.log(err);
        });
    }
  };

  const UserSection = () => {
    const signUp = () => {
      let name = document.getElementById("nameform").value;
      let phone = document.getElementById("phoneform").value;
      let location = document.getElementById("locationform").value;
      if (name === "") {
        setStatus("Please enter a valid name.");
      } else if (phone.length !== 10) {
        setStatus("Please enter a 10 digit phone number.");
      } else if (location === "") {
        setStatus("Please provide a valid location.");
      } else {
        setStatus("");
        mainContract.methods
          .userSignUp(name, parseInt(phone), location)
          .send({ from: account })
          .then((resp) => {
            setStatus("Sign up successful.");
            poppulateUserData();
          })
          .catch((err) => {
            setStatus(err["message"]);
          });
      }
    };

    const fulfilOrder = async (orderId) => {
      setStatus("Closing order...");
      mainContract.methods
        .fulfillOrder(orderId)
        .send({ from: account })
        .then(async (resp) => {
          setStatus("Updating..");
          await fetch("/api/updateOrders")
            .then((resp) => setStatus("Successfully closed order"))
            .catch((err) => {
              console.log(err);
              setStatus("Something went wrong while updating database. ");
            });
          poppulateUserData();
        })
        .catch((err) => setStatus(err["message"]));
    };

    const redeemToken = async () => {
      setStatus("Redeeming beans...");
      let amount = document.getElementById("tokenRedeem").value;
      let amountInWei = Web3.utils.toWei(amount.toString(), "ether");
      tokenContract.methods
        .approve(mainContractAddress, amountInWei)
        .send({ from: account })
        .then((resp) => {
          mainContract.methods
            .redeemTokens(amountInWei)
            .send({ from: account })
            .then((resp) => {
              setStatus("Updating..");
              poppulateUserData();
              setRedeem(false);
            })
            .catch((err) => {
              setStatus("Something went wrong. Try again.");
            });
        })
        .catch((err) => {
          setStatus("Something went wrong. Try again.");
        });
    };
    return (
      <>
        <div
          className="mySection"
          style={{ background: "grey", color: "black" }}
        >
          {state.name === "" ? (
            <>
              <h3>Sign up</h3>
              <div className="myform">
                <label htmlFor="nameform">Name:</label>
                <input type="text" placeholder="Enter name" id="nameform" />
              </div>
              <div className="myform">
                <label htmlFor="phoneform">Phone:</label>
                <input type="text" placeholder="Mobile number" id="phoneform" />
              </div>
              <div className="myform">
                <label htmlFor="locationform">Location:</label>
                <input
                  type="text"
                  placeholder="Your address"
                  id="locationform"
                />
              </div>
              <button
                onClick={() => {
                  signUp();
                }}
              >
                SignUp
              </button>
            </>
          ) : (
            <>
              <div className="userData">
                <h3>Hi {state.name}</h3>
                <h5>{account}</h5>
                <h5>+91 {state.phone}</h5>
                <h5>{state.location}</h5>
                <h5>Discount: {state.discount}eth</h5>
                <h5>beans: {state.tokenBalance}</h5>
                {redeem ? (
                  <>
                    <input
                      type="number"
                      placeholder="Amount"
                      id="tokenRedeem"
                    />
                    <button onClick={() => redeemToken()}>Redeem</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => setRedeem(true)}>
                      Get Discount
                    </button>
                  </>
                )}
              </div>
              {state.orders.length > 0 && state.products.length > 0 ? (
                <>
                  <h1 style={{ marginTop: "300px", color: "white" }}>
                    Your Orders
                  </h1>
                  <div className="cardholder">
                    {state.orders.map((order) => {
                      let productIndex = parseInt(order["productId"]) - 1;
                      return (
                        <React.Fragment key={order["orderId"]}>
                          <div className="card">
                            <img
                              src={
                                productImages[state.products[productIndex].name]
                              }
                              alt=""
                            />
                            <h2>{state.products[productIndex].name}</h2>
                            {orderStatus[order.status]}
                            {order.status === "1" ? (
                              <>
                                <button
                                  onClick={() => fulfilOrder(order.orderId)}
                                  style={{ margin: "0 20px" }}
                                >
                                  Recieved?
                                </button>
                              </>
                            ) : (
                              <></>
                            )}
                          </div>
                        </React.Fragment>
                      );
                    })}
                  </div>
                </>
              ) : (
                <>
                  <div>No active orders </div>
                </>
              )}

              <h3>Order now and get rewards in bean token.</h3>
            </>
          )}
          <h4 style={{ color: "blue" }}>{status}</h4>
        </div>
      </>
    );
  };

  const CafeSection = () => {
    const orderProduct = async (productId, productPrice) => {
      let discount = Math.min(
        parseFloat(productPrice),
        parseFloat(state.discount)
      );
      let value = (
        parseFloat(productPrice) -
        discount +
        (state.collateral - 1) * parseFloat(productPrice)
      ).toString();
      let valueInWei = Web3.utils.toWei(value, "ether");
      setStatus("Waiting for transaction...");
      mainContract.methods
        .placeOrder(productId)
        .send({ from: account, value: valueInWei })
        .then(async (resp) => {
          setStatus("Confirmed. Updating...");
          await fetch("/api/updateOrders")
            .then((resp) => setStatus(""))
            .catch((err) => {
              console.log(err);
              setStatus("Something went wrong while updating database. ");
            });
          poppulateUserData();
        })
        .catch((err) => setStatus(err["message"]));
    };
    return (
      <>
        <div
          className="mySection"
          style={{
            // background:
            //   "url('https://www.starbucks.co.uk/sites/starbucks-uk/files/styles/c01_vertical_card_724x1009/public/2020-08/Starbucks_Logo_0.png.webp?itok=7aydb7qr')",
            // backgroundPosition: "center",
            // backgroundRepeat: "no-repeat",
            // backgroundSize: "cover",
            background: "#1f3a31",
            color: "white",
          }}
        >
          {state.products.length > 0 ? (
            <>
              <h1 style={{ color: "white", fontWeight: "900" }}>CRYPTOBUCKS</h1>
              <div className="cardholder">
                {state.products.map((product) => {
                  return (
                    <React.Fragment key={product.name + product.price}>
                      <div className="card">
                        <img src={productImages[product.name]} alt="" />
                        <h2>{product.name}</h2>
                        <h2>Price: {product.price} eth</h2>
                        <h2>
                          Discount:{" "}
                          {Math.min(
                            parseFloat(state.discount),
                            parseFloat(product.price)
                          )}{" "}
                          eth
                        </h2>
                        {state.name !== "" && (
                          <button
                            onClick={() =>
                              orderProduct(product.id, product.price)
                            }
                          >
                            Order
                          </button>
                        )}
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
            </>
          ) : (
            <>Loading...</>
          )}
        </div>
      </>
    );
  };

  return (
    <>
      <CafeSection />
      <UserSection />
    </>
  );
};

export default Counter;
