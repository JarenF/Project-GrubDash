const path = require("path");
const { isArray } = require("util");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
let nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass
function create(req, res) {
  var { data: { deliverTo, mobileNumber, dishes } = {} } = req.body;
  var newId = new nextId();
  var newOrder = {
    id: newId,
    deliverTo: deliverTo,
    mobileNumber: mobileNumber,
    dishes: { dishes },
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

//validation middleware: deliverTo, mobileNumber, dishes, and quantity
function hasDeliverTo(req, res, next) {
  var { data: { deliverTo } = {} } = req.body;
  if (deliverTo) {
    return next();
  }
  next({ status: 400, message: "Order must include a deliverTo" });
}

function hasMobileNum(req, res, next) {
  var { data: { mobileNumber } = {} } = req.body;
  if (mobileNumber) {
    return next();
  }
  next({ status: 400, message: "Order must include a mobileNumber" });
}

function hasDishes(req, res, next) {
  var { data: { dishes } = {} } = req.body;
  if (dishes) {
    return next();
  }
  next({ status: 400, message: "Order must include a dishes" });
}

function hasStatus(req, res, next) {
  var { data: { status } = {} } = req.body;
  if (status) {
    return next();
  }
  next({
    status: 400,
    message:
      "Order must have a status of pending, preparing, out-for-delivery, delivered",
  });
}

function validStatus(req, res, next) {
  var { data: { status } = {} } = req.body;
  if (status === "invalid" || !status) {
    next({
        status: 400,
        message:
          "Order must have a status of pending, preparing, out-for-delivery, delivered",
      });
  }
  next();
  
}

function dishesEmpty(req, res, next) {
  var { data: { dishes } = {} } = req.body;
  if (dishes.length === 0) {
    return next({ status: 400, message: "Order must include a dishes" });
  }
  next();
}

function dishesArray(req, res, next) {
  var { data: { dishes } = {} } = req.body;
  if (Array.isArray(dishes)) {
    return next();
  }
  next({ status: 400, message: "Order must include a dishes" });
}

function hasQuantity(req, res, next) {
  var { data: { dishes } = {} } = req.body;
  dishes.map((dish, index) => {
    if (!dish.quantity) {
      next({
        status: 400,
        message: `Dish ${index} must have a quantity that is an integer greater than 0`,
      });
    }
    if (typeof dish.quantity !== "number")
      next({
        status: 400,
        message: `Dish ${index} must have a quantity that is an integer greater than 0`,
      });
  });
  next();
}

function statusPropertyPending(req, res, next) {
    const order = res.locals.order;
    var {status} = order;
    if (status === "pending") {
      return next();
    }
    next({
      status: 400,
      message: `An order cannot be deleted unless it is pending.`,
    });
  }

//end middleware

function orderExists(req, res, next) {
  let { orderId } = req.params;
  var foundOrder = orders.find((order) => order.id === orderId);
  if (foundOrder) {
    res.locals.order = foundOrder;
    return next();
  }
  next({
    status: 404,
    message: `Order id not found: ${orderId}`,
  });
}

function read(req, res) {
  res.json({ data: res.locals.order });
}

function matchingId(req, res, next) {
  var { orderId } = req.params;
  const { data: { id } = {} } = req.body;

  if (orderId === id || !id) {
    return next();
  }
  next({
    status: 400,
    message: `Order id does not match route id. Order: ${id}, Route: ${orderId}`,
  });
}

function list(request, response) {
  response.json({ data: orders });
}

function update(req, res) {
  let { orderId } = req.params;
  var foundOrder = orders.find((order) => order.id === orderId);
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;

  foundOrder.deliverTo = deliverTo;
  foundOrder.mobileNumber = mobileNumber;
  foundOrder.status = status;

  res.json({ data: foundOrder });
}

function destroy(req, res) {
    let { orderId } = req.params;

    var index = orders.findIndex((order) => order.id === orderId);
    orders.splice(index, 1);
    
    res.sendStatus(204);
  }

module.exports = {
  list,
  create: [
    hasDeliverTo,
    hasMobileNum,
    hasDishes,
    dishesEmpty,
    dishesArray,
    hasQuantity,
    create,
  ],
  read: [orderExists, read],
  update: [
    orderExists,
    matchingId,
    hasStatus,
    validStatus,
    hasDeliverTo,
    hasMobileNum,
    hasDishes,
    dishesEmpty,
    dishesArray,
    hasQuantity,
    update,
  ],
  delete: [
      orderExists, 
      statusPropertyPending, 
      destroy
    ]
};