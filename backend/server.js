import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import userRouter from './routes/userRoute.js';
import authRouter from './routes/authRoutes.js';
import starRouter from './routes/starRoute.js';
import gcashRouter from './routes/gcashRoutes.js';
import addRouter from './routes/addOrderRoute.js';
import productRoute from './routes/productRoute.js'
import userOrderRoute from './routes/userOrderRoute.js'
import serviceRoute from './routes/serviceRoute.js'
import cookieParser from 'cookie-parser';
import cors from 'cors'
dotenv.config();

mongoose
  .connect('mongodb+srv://admin:testAdmin123@cluster0.q3x7djq.mongodb.net/laundry')
  .then(() => {
    console.log('Connected to MongoDB!');
  })
  .catch((err) => {
    console.log(err);
  });


const app = express();

app.use(cors());

app.use(express.json());
mongoose.set('strictQuery', false)

app.use(cookieParser());

app.listen(3000, () => {
  console.log('Server is running on port 3000!');
});

app.use('/api/user', userRouter);
app.use('/api/auth', authRouter);
app.use('/api/add', addRouter)
app.use('/api/new', userOrderRoute)
app.use('/api/service', serviceRoute)
app.use('/api/product', productRoute)
app.use('/api/star', starRouter)
app.use('/api/gcash', gcashRouter)



app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  return res.status(statusCode).json({
    success: false,
    statusCode,
    message,
  });
});
