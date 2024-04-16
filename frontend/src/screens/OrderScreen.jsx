import { Link, useParams } from "react-router-dom";
import { Row, Col, ListGroup, Image, Button, Card } from "react-bootstrap";
import Message from "../components/Message";
import Loader from "../components/Loader";
import {
  useDeliverOrderMutation,
  useGetOrderDetailsQuery,
  usePayOrderMutation,
} from "../slices/ordersApiSlice";
import axios from "axios";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";

const OrderScreen = () => {
  const { userInfo } = useSelector((state) => state.auth);

  const { id: orderId } = useParams();
  const [token, setToken] = useState("");

  const {
    data: order,
    refetch,
    isLoading,
    error,
  } = useGetOrderDetailsQuery(orderId);

  const [payOrder] = usePayOrderMutation();
  const [deliverOrder] = useDeliverOrderMutation();

  const handlePayment = async () => {
    try {
      const orderData = {
        orderId: order._id,
        totalPrice: order.totalPrice, // Contoh harga total
      };

      const response = await axios.post("/api/payment", orderData);
      setToken(response.data);
    } catch (error) {
      console.error("Failed to initiate payment:", error);
      // Tampilkan pesan kesalahan kepada pengguna jika diperlukan.
    }
  };

  useEffect(() => {
    if (token) {
      window.snap.pay(token, {
        onSuccess: (result) => {
          payOrder(orderId);
          refetch();
          window.location.href = `/order/${orderId}`;
        },
        onPending: (result) => {
          window.location.href = `/order/${orderId}`;
        },
        onError: (error) => {
          window.location.href = `/order/${orderId}`;
          console.log(error);
        },
        onClose: () => {
          window.location.href = `/order/${orderId}`;
          console.log("Anda belum menyelesaikan pembayaran");
        },
      });
    }
  }, [token]);

  const fetchMidtransClientKey = async () => {
    try {
      await axios.get("/api/midtrans-client-key");
    } catch (error) {
      console.error("Failed to fetch Midtrans client key:", error);
    }
  };

  useEffect(() => {
    const midtransUrl = "https://app.sandbox.midtrans.com/snap/snap.js";

    // Deklarasikan variabel scriptTag
    let scriptTag = document.createElement("script");
    scriptTag.src = midtransUrl;

    const midtransClientKey = fetchMidtransClientKey();
    scriptTag.setAttribute("data-client-key", midtransClientKey);

    document.body.appendChild(scriptTag);

    return () => {
      document.body.removeChild(scriptTag);
    };
  }, []);

  const deliverOrderHandler = async () => {
    try {
      await deliverOrder(orderId);
      refetch();
      toast.success("Order delivered");
    } catch (err) {
      toast.error(err?.data?.message || err.message);
    }
  };

  // old

  // const handlePayment = async () => {
  //   try {
  //     await payOrder(orderId);
  //     refetch();
  //     toast.success("Payment successful");
  //   } catch (err) {
  //     toast.error(err?.data?.message || err.message);
  //   }
  // };

  return isLoading ? (
    <Loader />
  ) : error ? (
    <Message variant="danger">{error?.data?.message || error.error}</Message>
  ) : (
    <>
      <h1>Order {order._id}</h1>
      <Row>
        <Col md={8}>
          <ListGroup>
            <ListGroup.Item>
              <h2>Shipping</h2>
              <p>
                <strong>Name: </strong>
                {order.user.name}
              </p>
              <p>
                <strong>Email: </strong>
                {order.user.email}
              </p>
              <p>
                <strong>Address: </strong>
                {order.shippingAddress.address}{" "}
                {order.shippingAddress.postalCode} {order.shippingAddress.phone}
              </p>
              {order.isDelivered ? (
                <Message variant="success">
                  Delivered on {order.deliveredAt.substring(0, 10)}
                </Message>
              ) : (
                <Message variant="danger">Not Delivered</Message>
              )}
            </ListGroup.Item>
            <ListGroup.Item>
              <h2>Status Pembayaran</h2>
              {order.isPaid ? (
                <Message variant="success">
                  Pembayaran selesai: {order.paidAt.substring(0, 10)}
                </Message>
              ) : (
                <Message variant="danger">Menunggu pembayaran</Message>
              )}
            </ListGroup.Item>
            <ListGroup.Item>
              <h2>Order Items</h2>
              {order.orderItems.map((item, index) => (
                <ListGroup.Item key={index}>
                  <Row>
                    <Col md={2}>
                      <Image src={item.image} alt={item.name} fluid rounded />
                    </Col>
                    <Col>
                      <Link to={`/products/${item.product}`}>{item.name}</Link>
                    </Col>
                    <Col md={4}>
                      {item.qty} x {item.price.toLocaleString("id-ID")} = Rp{" "}
                      {(item.qty * item.price).toLocaleString("id-ID")}
                    </Col>
                  </Row>
                </ListGroup.Item>
              ))}
            </ListGroup.Item>
          </ListGroup>
        </Col>
        <Col md={4}>
          <Card>
            <ListGroup variant="flush">
              <ListGroup.Item>
                <h2>Order Summary</h2>
              </ListGroup.Item>
              <ListGroup.Item>
                <Row>
                  <Col>Items</Col>
                  <Col>Rp{order.itemsPrice.toLocaleString("id-ID")}</Col>
                </Row>
                <Row>
                  <Col>Shippping</Col>
                  <Col>Rp{order.shippingPrice.toLocaleString("id-ID")}</Col>
                </Row>
                <Row>
                  <Col>Total</Col>
                  <Col>Rp{order.totalPrice.toLocaleString("id-ID")}</Col>
                </Row>
              </ListGroup.Item>
              {/* PAY ORDER PLACEHOLDER */}
              {userInfo && !userInfo.isAdmin && !order.isPaid && (
                <ListGroup.Item>
                  <Button
                    type="button"
                    className="btn btn-block"
                    onClick={handlePayment}
                  >
                    Bayar Sekarang
                  </Button>
                </ListGroup.Item>
              )}
              {/* MARK AS DELIVERED PLACEHOLDER */}
              {userInfo &&
                userInfo.isAdmin &&
                order.isPaid &&
                !order.isDelivered && (
                  <ListGroup.Item>
                    <Button
                      type="button"
                      className="btn btn-block"
                      onClick={deliverOrderHandler}
                    >
                      Mark As Delivered
                    </Button>
                  </ListGroup.Item>
                )}
            </ListGroup>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default OrderScreen;
