import express from 'express';
import { checkElasticConnection } from './config/elasticsearch';
import { redisClient } from './config/redis';
import dotenv from 'dotenv';
import emailRoutes from "./routes/emailRoutes";

dotenv.config();

const app = express();
app.use(express.json());

// API routes
app.use("/api", emailRoutes);

// Default route
app.get('/', (req, res) => res.send('🚀 Email Onebox Backend Running!'));

const startServer = async () => {
  try {
    await checkElasticConnection();
    await redisClient.connect();

    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
  }
};

startServer();
