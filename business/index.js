// Loads the business file named in .env  (BUSINESS=manishai -> business/manishai.js)
const name = process.env.BUSINESS || "manishai";

if (!/^[a-z0-9_-]+$/i.test(name) || name === "index") {
    throw new Error(`Invalid BUSINESS value in .env: "${name}"`);
}

module.exports = require(`./${name}.js`);