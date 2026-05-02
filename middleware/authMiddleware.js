const jwt = require("jsonwebtoken");

const authMiddleware = (request, response, next) => {
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return response.status(401).json({ error: "Unauthorized: No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret_key");
    request.user = decoded;
    next();
  } catch (error) {
    return response.status(401).json({ error: "Unauthorized: Invalid token" });
  }
};

module.exports = authMiddleware;
