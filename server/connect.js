import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.URI;
console.log(uri);
const connectDB = async() => {
    try
    {
        await mongoose.connect(uri, {
            useUnifiedTopology: true,
            useNewUrlParser: true
        });
        console.log('db connected...');
    }
    catch (err){
        console.log(err);
    }
}
const userSchema = new mongoose.Schema({
    email: String,
    user_data: typeof ({}),
    slack: Boolean,
    teams: Boolean,
    twitter: Boolean
});
connectDB();

const user = mongoose.model('users', userSchema);
export default user;