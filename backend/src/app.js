const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const { errorMiddleware, notFound } = require("./middlewares/error.middleware");

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL,
].filter(Boolean); // removes undefined/null values

app.use(helmet());
app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (mobile apps, curl, postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
if (process.env.NODE_ENV !== "production") app.use(morgan("dev"));

app.use("/api", rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }));

app.get("/health", (req, res) => res.json({ status: "OK", time: new Date() }));
app.use("/api", require("./routes/index"));

app.use(notFound);
app.use(errorMiddleware);

module.exports = app;