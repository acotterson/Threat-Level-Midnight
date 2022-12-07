const CpuInfo = require("./CpuInfo");
const GpuInfo = require("./GpuInfo");
const User = require("./Users");
const Steam = require("./Steam");
const UserGames = require("./UserGames");

CpuInfo.hasMany(User, {
  foreignKey: "cpu_id",
});

User.belongsTo(CpuInfo, {
  foreignKey: "cpu_id",
});

GpuInfo.hasMany(User, {
  foreignKey: "gpu_id",
});

User.belongsTo(GpuInfo, {
  foreignKey: "gpu_id",
});

User.belongsToMany(Steam, {
  // Define the third table needed to store the foreign keys
  through: {
    model: UserGames,
    unique: false,
  },
  // Define an alias for when data is retrieved
  as: "user_steams",
});

Steam.belongsToMany(User, {
  // Define the third table needed to store the foreign keys
  through: {
    model: UserGames,
    unique: false,
  },
  // Define an alias for when data is retrieved
  as: "steam_users",
});

User.hasMany(UserGames);
UserGames.belongsTo(User);
Steam.hasMany(UserGames);
UserGames.belongsTo(Steam);

module.exports = { User, GpuInfo, CpuInfo, Steam, UserGames };
