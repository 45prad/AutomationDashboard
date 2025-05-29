import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const mongoUrI = process.env.MONGODB_URL;

const connectToMongo = async () => {
    try {
        await mongoose.connect(mongoUrI);
        console.log("connected to DB");
    } catch (error) {
        console.log(error);
    }
};

export default connectToMongo;
