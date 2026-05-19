import app from "../server/app";

console.log("Vercel API function initialized");

export default (req: any, res: any) => {
  console.log(`API request received: ${req.method} ${req.url}`);
  return app(req, res);
};
