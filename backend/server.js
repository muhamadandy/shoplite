import path from "path";
import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
dotenv.config();
import connectDB from "./config/db.js";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";
import productRoutes from "./routes/productRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import Midtrans from "midtrans-client";
import uploadRoutes from "./routes/uploadRoutes.js";

const port = process.env.PORT || 5000;

connectDB();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

app.use("/api/products", productRoutes);
app.use("/api/users", userRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/upload", uploadRoutes);

const __dirname = path.resolve();
app.use("/uploads", express.static(path.join(__dirname, "/uploads")));

const snap = new Midtrans.Snap({
  isProduction: false, // false for sandbox, true for production
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY,
});

const midtransClientKey = process.env.MIDTRANS_CLIENT_KEY;

// Endpoint untuk memberikan midtransClientKey
app.get("/api/midtrans-client-key", (req, res) => {
  res.json({ midtransClientKey });
});

app.post("/api/payment", async (req, res) => {
  try {
    const parameter = {
      transaction_details: {
        order_id: req.body.orderId,
        gross_amount: req.body.totalPrice,
      },
    };

    const token = await snap.createTransactionToken(parameter);
    res.send(token);
  } catch (error) {
    console.error("Failed to create transaction token:", error);
    res.status(500).send("Failed to create transaction token");
  }
});

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "/frontend/dist")));

  app.get("*", (req, res) =>
    res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"))
  );
} else {
  app.get("/", (req, res) => {
    res.send("API is running...");
  });
}

app.use(notFound);
app.use(errorHandler);

app.listen(port, () => console.log(`Server running on port ${port}`));
