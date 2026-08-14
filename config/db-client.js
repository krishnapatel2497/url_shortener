import {MongoClient} from 'mongodb';
import {env} from '../config/env.js';

export const dbclient= new MongoClient(env.MONGODB_URL);


