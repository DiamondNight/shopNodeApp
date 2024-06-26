/* IMPORTS */

// MongoDB Functions
const { connectToDB } = require('./connectToDB');
const { ObjectId } = require('mongodb');

// Cart Functions
const cartFunc = require('./cartFunc');

// Products Functions
const { getProductById } = require('./productListFunc');

/* FUNCTIONS */

// CREATE ORDER
async function createOrder(id, params) {
    try {
        const orderList = await connectToDB('orders');
        const userCart = await cartFunc.getCartByUserId(id);
        var price = 0;
        const productsArray = await Promise.all(userCart.array_products.map(async (product) => {
            const productObject = {
                product: await getProductById(product.product_id_ref.toString()),
                quantity: product.quantity
            }
            if (productObject.product.status !== "deleted") {
                price = price + ((productObject.product.price - (productObject.product.price * productObject.product.discount) / 100) * productObject.quantity);
            }
            return productObject
        }));

        const filteredProductsArray = productsArray.filter(product => product.product.status !== "deleted");
        if (filteredProductsArray.length > 0) {
            const newOrder = await orderList.insertOne(
                {
                    "user_id_ref": ObjectId.createFromHexString(id),
                    "payment_method": params.payment_method,
                    "payment_price": price,
                    "status": "pending",
                    "address": params.address,
                    "array_products": filteredProductsArray
                }
            )
            await cartFunc.deleteAllProductsFromCart(id);
            return newOrder
        }
        return "error";
    } catch (error) {
        console.error("Error:", error);
    }

}

// GET ALL ORDERS
async function getAllOrders() {
    try {
        const ordersList = await connectToDB('orders');
        const orders = await ordersList.find({}).toArray();

        return orders;
    } catch (error) {
        console.error("Error:", error)
    }
}

// GET ORDERS BY USER ID
async function getOrderByUserId(id) {
    try {
        const orderList = await connectToDB('orders');
        const userOrders = await orderList.find({
            user_id_ref: ObjectId.createFromHexString(id)
        }).toArray();

        return userOrders;
    } catch (error) {
        console.error("Error:", error);
    }


}

// GET ORDER BY ID
async function getOrderById(id) {
    try {
        const orderList = await connectToDB("orders");
        const order = await orderList.findOne({
            _id: ObjectId.createFromHexString(id)
        });
        return order
    } catch (error) {
        console.error("Error:", error);
    }

}

// UPDATE ORDER
async function updateOrder(id, params) {
    try {
        const orderList = await connectToDB("orders");
        const order = await orderList.updateOne(
            {
                _id: ObjectId.createFromHexString(id)
            },
            {
                $set: params,
            }
        )
        return order;
    } catch (error) {
        console.error("Error:", error);
    }

}

// DELETE ORDER BY ID
async function deleteOrderById(id) {
    try {
        const orderList = await connectToDB("orders");
        const order = await orderList.deleteOne(
            {
                _id: ObjectId.createFromHexString(id)
            }
        )
        return order;
    } catch (error) {
        console.error("Error:", error);
    }

}

module.exports = {
    createOrder,
    getAllOrders,
    getOrderByUserId,
    getOrderById,
    updateOrder,
    deleteOrderById
}
