const mongoose = require("mongoose");

const MONGO_URI = `mongodb://${
  process.env.NODE_ENV === "prod" ? "mongo-headless.mongo.svc.cluster.local" : "localhost"
}:27017/matchmaker`;

const createDbConnection = async () => {
  await mongoose.connect(
    MONGO_URI,
    process.env.NODE_ENV === "prod"
      ? {
          useNewUrlParser: true,
          useUnifiedTopology: true,
          authMechanism: "MONGODB-X509",
          authSource: "$external",
          tls: true,
          tlsCertificateKeyFile: "/etc/tls/x509.pem",
          tlsCAFile: "/etc/tls/x509.crt",
        }
      : {
          useNewUrlParser: true,
          useUnifiedTopology: true,
        }
  );
};

module.exports = { createDbConnection };
