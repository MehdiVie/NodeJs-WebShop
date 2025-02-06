const mangodb = require('mongodb');
const MongoClient = mangodb.MongoClient;

let _db;

const mongoConnect = callback => {
    MongoClient.connect('mongodb+srv://UserReadWrite:bM0T1rs4jMhQFgfn@cluster0.pdry4.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')

    .then(client => {
        console.log('CONNECTED!');
        _db = client.db();
        callback();
    })
    .catch(err => {
        console.log(err);
        throw err;
    });
}

const getDb = () => {
    if (_db) {
        return _db;
    }
    throw 'No Database Found!';
};

exports.mongoConnect = mongoConnect;
exports.getDb = getDb;




