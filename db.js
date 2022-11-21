import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config({ path: ".env" });

const MONGODB_URI = process.env.MONGODB_URI;
mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("Conectado a MongoDB"))
  .catch(error => {
    console.error("error de conexión", error.message);
  });
